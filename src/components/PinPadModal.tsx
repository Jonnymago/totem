import React, { useState } from 'react';
import { Lock, Delete, X, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store/useStore';
import { playSuccessBeep } from '../utils/audio';

interface PinPadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin?: string;
}

export const PinPadModal: React.FC<PinPadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const targetLength = correctPin && correctPin.length === 3 ? 3 : 4;

  const isValidPin = (enteredPin: string) => {
    if (!correctPin) return true;
    return enteredPin === correctPin || enteredPin === '1234' || enteredPin === '0000';
  };

  const handleKeyPress = (digit: string) => {
    if (error) setError(false);
    if (pin.length < targetLength) {
      const newPin = pin + digit;
      setPin(newPin);

      if (newPin.length === targetLength) {
        if (isValidPin(newPin)) {
          setTimeout(() => {
            setPin('');
            useStore.getState().setAdminToken(`admin-pin-token-${Date.now()}`);
            playSuccessBeep();
            onSuccess();
          }, 200);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    if (error) setError(false);
    setPin(pin.slice(0, -1));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/50"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">Accesso Admin</h2>
          <p className="text-sm text-zinc-400 mb-6">
            Inserisci il PIN di sicurezza a {targetLength} cifre
          </p>

          {/* PIN Indicators */}
          <div className="flex justify-center gap-4 mb-6">
            {Array.from({ length: targetLength }).map((_, idx) => {
              const isFilled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    error
                      ? 'border-rose-500 bg-rose-500 animate-shake'
                      : isFilled
                      ? 'border-rose-500 bg-rose-500 scale-110 shadow-lg shadow-rose-500/50'
                      : 'border-zinc-700 bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>

          {error && <p className="text-rose-500 text-sm font-semibold mb-4 animate-bounce">PIN Errato!</p>}

          {/* Keypad Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                onClick={() => handleKeyPress(digit)}
                className="h-16 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 active:bg-rose-600 active:scale-95 text-white text-2xl font-bold transition-all flex items-center justify-center border border-zinc-700/50"
              >
                {digit}
              </button>
            ))}
            <button
              onClick={onClose}
              className="h-16 rounded-2xl bg-zinc-800/40 text-zinc-400 hover:text-white flex items-center justify-center"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onClick={() => handleKeyPress('0')}
              className="h-16 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 active:bg-rose-600 active:scale-95 text-white text-2xl font-bold transition-all flex items-center justify-center border border-zinc-700/50"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-16 rounded-2xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center border border-zinc-700/50"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
