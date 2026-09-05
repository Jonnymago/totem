import sys
import re

with open('src/utils/guideChapters.ts', 'r') as f:
    content = f.read()

ch_it = """    {
      id: 'ch11_kds_routing',
      icon: 'restaurant',
      title: '11. Routing Multi-Stampante & Categorie KDS',
      subtitle: 'Gestione avanzata delle comande divise per reparto e stampanti Bluetooth.',
      badge: 'AVANZATO',
      paragraphs: [
        'La piattaforma supporta l\\'assegnazione diretta di categorie (es. Pizze, Bevande) a specifici schermi KDS e Stampanti Bluetooth.',
        'Vai nella scheda Impostazioni -> Stampa del Totem per rilevare e accoppiare più stampanti Bluetooth.',
        'Per ogni stampante o monitor KDS, puoi selezionare le categorie di cui si occupa. Le comande verranno divise automaticamente e inviate ai reparti corretti.'
      ],
      tip: 'Suggerimento: se non selezioni nessuna categoria, la stampante o il KDS riceverà l\\'intero ordine globale.'
    }"""

ch_en = """    {
      id: 'ch11_kds_routing',
      icon: 'restaurant',
      title: '11. Multi-Printer Routing & KDS Categories',
      subtitle: 'Advanced order management divided by department and Bluetooth printers.',
      badge: 'ADVANCED',
      paragraphs: [
        'The platform supports assigning specific categories (e.g., Pizzas, Drinks) to dedicated KDS screens and Bluetooth Printers.',
        'Go to Settings -> Printing on the Totem to detect and pair multiple Bluetooth printers.',
        'For each printer or KDS monitor, select the categories it handles. Orders will be automatically split and sent to the correct departments.'
      ],
      tip: 'Pro Tip: If you do not select any category, the printer or KDS will receive the entire global order.'
    }"""

ch_es = """    {
      id: 'ch11_kds_routing',
      icon: 'restaurant',
      title: '11. Enrutamiento Multi-Impresora y Categorías KDS',
      subtitle: 'Gestión avanzada de pedidos divididos por departamento e impresoras Bluetooth.',
      badge: 'AVANZADO',
      paragraphs: [
        'La plataforma admite la asignación directa de categorías (ej. Pizzas, Bebidas) a pantallas KDS específicas e impresoras Bluetooth.',
        'Ve a la pestaña Configuración -> Impresión del Tótem para detectar y vincular múltiples impresoras Bluetooth.',
        'Para cada impresora o monitor KDS, selecciona las categorías de las que se encarga. Los pedidos se dividirán automáticamente y se enviarán a los departamentos correctos.'
      ],
      tip: 'Consejo: Si no seleccionas ninguna categoría, la impresora o KDS recibirá todo el pedido global.'
    }"""

ch_fr = """    {
      id: 'ch11_kds_routing',
      icon: 'restaurant',
      title: '11. Routage Multi-Imprimante & Catégories KDS',
      subtitle: 'Gestion avancée des commandes divisées par département et imprimantes Bluetooth.',
      badge: 'AVANCÉ',
      paragraphs: [
        'La plateforme prend en charge l\\'assignation directe de catégories (ex. Pizzas, Boissons) à des écrans KDS spécifiques et à des imprimantes Bluetooth.',
        'Allez dans l\\'onglet Paramètres -> Impression du Totem pour détecter et coupler plusieurs imprimantes Bluetooth.',
        'Pour chaque imprimante ou moniteur KDS, sélectionnez les catégories dont il s\\'occupe. Les commandes seront automatiquement divisées et envoyées aux bons départements.'
      ],
      tip: 'Astuce : Si vous ne sélectionnez aucune catégorie, l\\'imprimante ou le KDS recevra l\\'ensemble de la commande globale.'
    }"""

ch_de = """    {
      id: 'ch11_kds_routing',
      icon: 'restaurant',
      title: '11. Multi-Drucker-Routing & KDS-Kategorien',
      subtitle: 'Erweiterte Bestellverwaltung unterteilt nach Abteilungen und Bluetooth-Druckern.',
      badge: 'FORTGESCHRITTEN',
      paragraphs: [
        'Die Plattform unterstützt die direkte Zuweisung von Kategorien (z.B. Pizzen, Getränke) an spezifische KDS-Bildschirme und Bluetooth-Drucker.',
        'Gehen Sie auf die Registerkarte Einstellungen -> Drucken am Totem, um mehrere Bluetooth-Drucker zu erkennen und zu koppeln.',
        'Wählen Sie für jeden Drucker oder KDS-Monitor die zuständigen Kategorien aus. Die Bestellungen werden automatisch aufgeteilt und an die richtigen Abteilungen gesendet.'
      ],
      tip: 'Tipp: Wenn Sie keine Kategorie auswählen, empfängt der Drucker oder KDS die gesamte globale Bestellung.'
    }"""

# Splitting content by language arrays
def append_chapter(lang_code, ch_content, full_text):
    marker = f"  {lang_code}: ["
    idx = full_text.find(marker)
    if idx == -1: return full_text
    # find the end of the array ]
    # We will just find the last chapter by searching for ch10
    ch10_idx = full_text.find("id: 'ch10_multi_totem_printers'", idx)
    if ch10_idx == -1: return full_text
    end_of_ch10 = full_text.find("    },", ch10_idx)
    if end_of_ch10 != -1:
        end_of_ch10 += 6 # include "    },"
        return full_text[:end_of_ch10] + "\n" + ch_content + "," + full_text[end_of_ch10:]
    return full_text

content = append_chapter('it', ch_it, content)
content = append_chapter('en', ch_en, content)
content = append_chapter('es', ch_es, content)
content = append_chapter('fr', ch_fr, content)
content = append_chapter('de', ch_de, content)

with open('src/utils/guideChapters.ts', 'w') as f:
    f.write(content)

print("Updated guide")
