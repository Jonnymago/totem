"""
bt_bridge.py — Bridge Bluetooth locale per stampanti termiche ESC/POS
Gira in locale sul dispositivo (Termux o PC) sulla porta 8765.
Chiamato dal backend Totem come proxy interno.

Dipendenze:
  pip install fastapi uvicorn bleak pyserial

Per stampanti BT classiche (SPP/RFCOMM):
  pip install pyserial  (Linux/Windows)
  Su Android Termux: pkg install python; pip install bleak

Avvio:
  python bt_bridge.py
"""

from __future__ import annotations
import asyncio
import socket
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI(title="Totem BT Bridge", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── ESC/POS helpers ──────────────────────────────────────────────────────────

ESC = b"\x1b"
GS  = b"\x1d"

def escpos_init():       return ESC + b"@"
def escpos_align(a):     return ESC + b"a" + bytes([a])   # 0=sx 1=centro 2=dx
def escpos_bold(on):     return ESC + b"E" + bytes([1 if on else 0])
def escpos_size(w, h):   return GS  + b"!" + bytes([(w-1)<<4|(h-1)])
def escpos_feed(n=4):    return ESC + b"d" + bytes([n])
def escpos_cut():        return GS  + b"V" + b"\x41" + b"\x00"
def escpos_text(t):      return (t + "\n").encode("cp437", errors="replace")

def build_receipt(lines: list[str]) -> bytes:
    """
    Converte le righe di testo del ticket (generate da printer.ts lato frontend)
    in comandi ESC/POS pronti per la stampante.

    Marker speciali riconosciuti (stessa logica di printer.ts):
      @@NAME@@ → testo centrato grande (nome ristorante)
      @@NUM@@  → numero ordine centrato grande
    """
    buf = bytearray()
    buf += escpos_init()
    for raw in lines:
        line = raw.rstrip()
        if line.startswith("@@NAME@@"):
            buf += escpos_align(1)
            buf += escpos_bold(True)
            buf += escpos_size(2, 2)
            buf += escpos_text(line[8:])
            buf += escpos_size(1, 1)
            buf += escpos_bold(False)
            buf += escpos_align(0)
        elif line.startswith("@@NUM@@"):
            buf += escpos_align(1)
            buf += escpos_bold(True)
            buf += escpos_size(3, 3)
            buf += escpos_text(line[7:])
            buf += escpos_size(1, 1)
            buf += escpos_bold(False)
            buf += escpos_align(0)
        else:
            buf += escpos_text(line)
    buf += escpos_feed(5)
    buf += escpos_cut()
    return bytes(buf)


# ── Connessione RFCOMM (BT Classico SPP) ─────────────────────────────────────

RFCOMM_PORT = 1   # Porta SPP standard

def _bt_send_rfcomm(mac: str, data: bytes, timeout: float = 10.0):
    """Invia dati via socket RFCOMM (Linux/Termux, BT classico)."""
    mac_clean = mac.replace("bt:", "").replace("ble:", "").upper()
    sock = socket.socket(socket.AF_BLUETOOTH, socket.SOCK_STREAM, socket.BTPROTO_RFCOMM)
    sock.settimeout(timeout)
    try:
        sock.connect((mac_clean, RFCOMM_PORT))
        sock.sendall(data)
    finally:
        sock.close()


# ── Scansione dispositivi BT ──────────────────────────────────────────────────

async def _scan_bleak(timeout: float = 8.0) -> list[dict]:
    """Scansiona dispositivi BLE con bleak (fallback se RFCOMM non disponibile)."""
    try:
        from bleak import BleakScanner
        devices = await BleakScanner.discover(timeout=timeout)
        return [
            {"name": d.name or "(Senza nome)", "address": "ble:" + d.address, "type": "ble"}
            for d in devices
        ]
    except Exception as e:
        return [{"error": str(e)}]


def _scan_rfcomm() -> list[dict]:
    """Scansiona dispositivi BT classici accoppiati via bluetoothctl/hcitool (Linux)."""
    import subprocess
    results = []
    try:
        # Prova con bluetoothctl
        out = subprocess.check_output(
            ["bluetoothctl", "devices"], timeout=5, stderr=subprocess.DEVNULL
        ).decode()
        for line in out.splitlines():
            # formato: "Device AA:BB:CC:DD:EE:FF NomePrinter"
            parts = line.strip().split(" ", 2)
            if len(parts) >= 2:
                addr = parts[1]
                name = parts[2] if len(parts) > 2 else "(Senza nome)"
                results.append({"name": name, "address": "bt:" + addr, "type": "classic"})
    except Exception:
        pass
    return results


# ── Endpoints ─────────────────────────────────────────────────────────────────

PRINT_MESSAGES = {
    "it": {"missing": "Indirizzo stampante e righe di stampa sono obbligatori", "error": "Errore di stampa"},
    "en": {"missing": "Printer address and print lines are required", "error": "Print error"},
    "fr": {"missing": "L’adresse de l’imprimante et les lignes d’impression sont obligatoires", "error": "Erreur d’impression"},
    "es": {"missing": "La dirección de la impresora y las líneas de impresión son obligatorias", "error": "Error de impresión"},
    "de": {"missing": "Druckeradresse und Druckzeilen sind erforderlich", "error": "Druckfehler"},
}


def print_message(language: str, key: str) -> str:
    return PRINT_MESSAGES.get((language or "it").lower(), PRINT_MESSAGES["it"])[key]


class PrintRequest(BaseModel):
    address: str          # es. "bt:AA:BB:CC:DD:EE:FF"
    lines: list[str]      # righe di testo generate da printer.ts
    timeout: float = 10.0
    language: str = "it"


@app.get("/health")
def health():
    return {"status": "ok", "service": "totem-bt-bridge"}


@app.get("/printers")
async def scan_printers():
    """Scansiona e restituisce stampanti disponibili (classiche + BLE)."""
    classic = await asyncio.get_running_loop().run_in_executor(None, _scan_rfcomm)
    ble     = await _scan_bleak(timeout=6.0)
    # filtra errori dal BLE scan
    ble_clean = [d for d in ble if "error" not in d]
    all_printers = classic + ble_clean
    # deduplicazione per address
    seen = {}
    for p in all_printers:
        key = p.get("address", "").upper()
        if key and key not in seen:
            seen[key] = p
    return {"printers": list(seen.values()), "count": len(seen)}


@app.post("/print")
async def print_ticket(req: PrintRequest):
    """Stampa le righe di testo sulla stampante all'indirizzo specificato."""
    if not req.address or not req.lines:
        raise HTTPException(400, {"code": "print_missing_data", "message": print_message(req.language, "missing")})

    data = build_receipt(req.lines)

    try:
        # Prova prima RFCOMM (BT classico)
        if req.address.lower().startswith("bt:"):
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, _bt_send_rfcomm, req.address, data, req.timeout)
            return {"success": True, "method": "rfcomm", "bytes_sent": len(data)}

        # BLE: usa bleak per scrittura caratteristica (richiede UUID stampante)
        # La maggior parte delle termiche SPP-over-BLE espone UUID: 49535343-1E4D-4BD9-BA61-23C647249616
        from bleak import BleakClient
        PRINT_CHAR = "49535343-8841-43f4-a8d4-ecbe34729bb3"
        mac_clean = req.address.replace("ble:", "").upper()
        async with BleakClient(mac_clean, timeout=req.timeout) as client:
            # Invia in chunk da 20 byte (limite BLE standard)
            chunk_size = 20
            for i in range(0, len(data), chunk_size):
                await client.write_gatt_char(PRINT_CHAR, data[i:i+chunk_size], response=False)
                await asyncio.sleep(0.01)
        return {"success": True, "method": "ble", "bytes_sent": len(data)}

    except Exception as e:
        raise HTTPException(500, {"code": "print_error", "message": f"{print_message(req.language, 'error')}: {str(e)}"})


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8765, log_level="info")
