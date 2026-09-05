import { useEffect, useState } from 'react';
import { SupportedLanguage } from '@/src/utils/i18n';
import { getTranslationGlossary, subscribeToDbChanges, TranslationGlossary } from '@/src/api/api';

let persistedGlossary: TranslationGlossary = {};

export async function refreshCustomerMenuGlossary(): Promise<void> {
  try {
    persistedGlossary = await getTranslationGlossary();
  } catch {}
}

// Inizializzazione immediata in background
refreshCustomerMenuGlossary().catch(() => {});

/** Makes customer pages reactive when the local offline glossary is updated from remote admin. */
export function useCustomerMenuGlossary(): void {
  const [, setVersion] = useState(0);
  useEffect(() => {
    refreshCustomerMenuGlossary().then(() => setVersion(v => v + 1)).catch(() => {});
    return subscribeToDbChanges((type) => {
      if (type === 'glossary' || type === 'all') {
        refreshCustomerMenuGlossary().then(() => setVersion(v => v + 1)).catch(() => {});
      }
    });
  }, []);
}

/**
 * Dizionario completo e deterministico per prodotti, categorie, gruppi opzioni,
 * ingredienti, allergeni, salse, bevande e diciture tipiche dei menù ristorante/fast-food/pizzeria.
 */
export const CUSTOMER_MENU_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  
  // === PRODOTTI DEMO & DESCRIZIONI ===

  // === INGREDIENTI DEMO ===

  // === MISC DEMO ===
  "330ml in lattina": { "it": "330ml in lattina", "en": "330ml can", "fr": "Canette 330ml", "es": "Lata 330ml", "de": "330ml Dose" },
  "500ml": { "it": "500ml", "en": "500ml", "fr": "500ml", "es": "500ml", "de": "500ml" },
  "Tiramisù classico fatto in casa": { "it": "Tiramisù classico fatto in casa", "en": "Classic homemade tiramisu", "fr": "Tiramisu classique maison", "es": "Tiramisú casero clásico", "de": "Klassisches hausgemachtes Tiramisu" },
  "Patatine Fritte Maxi (Test)": { "it": "Patatine Fritte Maxi (Test)", "en": "Large Fries (Test)", "fr": "Grandes Frites (Test)", "es": "Patatas Fritas Maxi (Test)", "de": "Große Pommes (Test)" },
  "Cheeseburger Classic (Test)": { "it": "Cheeseburger Classic (Test)", "en": "Classic Cheeseburger (Test)", "fr": "Cheeseburger Classique (Test)", "es": "Cheeseburger Clásico (Test)", "de": "Klassischer Cheeseburger (Test)" },
  "Cottura media": { "it": "Cottura media", "en": "Medium rare", "fr": "Cuisson moyenne", "es": "Punto medio", "de": "Medium gebraten" },

  "Pane brioche": { "it": "Pane brioche", "en": "Brioche bun", "fr": "Pain brioché", "es": "Pan brioche", "de": "Brioche-Brötchen" },
  "Extra Formaggio": { "it": "Extra Formaggio", "en": "Extra Cheese", "fr": "Extra Fromage", "es": "Extra Queso", "de": "Extra Käse" },
  "Extra Bacon": { "it": "Extra Bacon", "en": "Extra Bacon", "fr": "Supplément Bacon", "es": "Bacon Extra", "de": "Extra Speck" },
  "Salsa speciale": { "it": "Salsa speciale", "en": "Special sauce", "fr": "Sauce spéciale", "es": "Salsa especial", "de": "Spezialsauce" },
  "Extra Mozzarella": { "it": "Extra Mozzarella", "en": "Extra Mozzarella", "fr": "Supplément Mozzarella", "es": "Extra Mozzarella", "de": "Extra Mozzarella" },
  "Bordo Ripieno": { "it": "Bordo Ripieno", "en": "Stuffed Crust", "fr": "Croûte fourrée", "es": "Borde Relleno", "de": "Gefüllter Rand" },
  "Lattuga romana": { "it": "Lattuga romana", "en": "Romaine lettuce", "fr": "Laitue romaine", "es": "Lechuga romana", "de": "Römersalat" },
  "Crostini": { "it": "Crostini", "en": "Croutons", "fr": "Croûtons", "es": "Picatostes", "de": "Croutons" },
  "Extra Pollo": { "it": "Extra Pollo", "en": "Extra Chicken", "fr": "Supplément Poulet", "es": "Extra Pollo", "de": "Extra Hähnchen" },

  "Hamburger Classico": { "it": "Hamburger Classico", "en": "Classic Burger", "fr": "Burger Classique", "es": "Hamburguesa Clásica", "de": "Klassischer Burger" },
  "Cheeseburger Deluxe": { "it": "Cheeseburger Deluxe", "en": "Deluxe Cheeseburger", "fr": "Cheeseburger Deluxe", "es": "Hamburguesa Deluxe con Queso", "de": "Deluxe Cheeseburger" },
  "Burger Combo": { "it": "Burger Combo", "en": "Burger Combo", "fr": "Menu Burger", "es": "Combo Hamburguesa", "de": "Burger Combo" },
  "Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa": { "it": "Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa", "en": "180g beef patty on brioche bun with lettuce, tomato, and sauce", "fr": "Steak de bœuf de 180g sur pain brioché avec laitue, tomate et sauce", "es": "Hamburguesa de ternera de 180g en pan brioche con lechuga, tomate y salsa", "de": "180g Rindfleisch-Patty auf Brioche-Brötchen mit Salat, Tomate und Soße" },
  "Hamburger con doppio cheddar e salsa speciale": { "it": "Hamburger con doppio cheddar e salsa speciale", "en": "Burger with double cheddar and special sauce", "fr": "Burger avec double cheddar et sauce spéciale", "es": "Hamburguesa con doble queso cheddar y salsa especial", "de": "Burger mit doppelt Cheddar und Spezialsauce" },
  "Pomodoro, mozzarella di bufala, basilico fresco": { "it": "Pomodoro, mozzarella di bufala, basilico fresco", "en": "Tomato, buffalo mozzarella, fresh basil", "fr": "Tomate, mozzarella di bufala, basilic frais", "es": "Tomate, mozzarella de búfala, albahaca fresca", "de": "Tomaten, Büffelmozzarella, frisches Basilikum" },
  "Pomodoro, mozzarella, salame piccante": { "it": "Pomodoro, mozzarella, salame piccante", "en": "Tomato, mozzarella, spicy salami", "fr": "Tomate, mozzarella, salami piquant", "es": "Tomate, mozzarella, salami picante", "de": "Tomaten, Mozzarella, scharfe Salami" },
  "Lattuga romana, pollo grigliato, parmigiano e crostini": { "it": "Lattuga romana, pollo grigliato, parmigiano e crostini", "en": "Romaine lettuce, grilled chicken, parmesan, and croutons", "fr": "Laitue romaine, poulet grillé, parmesan et croûtons", "es": "Lechuga romana, pollo a la parrilla, parmesano y picatostes", "de": "Römersalat, gegrilltes Hähnchen, Parmesan und Croutons" },
  "Hamburger + patatine + bevanda": { "it": "Hamburger + patatine + bevanda", "en": "Burger + fries + drink", "fr": "Burger + frites + boisson", "es": "Hamburguesa + patatas + bebida", "de": "Burger + Pommes + Getränk" },
  "Scegli il Burger": { "it": "Scegli il Burger", "en": "Choose your Burger", "fr": "Choisissez le Burger", "es": "Elige tu Hamburguesa", "de": "Wähle deinen Burger" },

  // === CATEGORIE & REPARTI ===
  "Panini": { "it": "Panini", "en": "Sandwiches", "fr": "Sandwichs", "es": "Bocadillos", "de": "Sandwiches" },
  "Panino": { "it": "Panino", "en": "Sandwich", "fr": "Sandwich", "es": "Bocadillo", "de": "Sandwich" },
  "Panini Gourmet": { "it": "Panini Gourmet", "en": "Gourmet Sandwiches", "fr": "Sandwichs Gourmets", "es": "Bocadillos Gourmet", "de": "Gourmet-Sandwiches" },
  "Panini Caldi": { "it": "Panini Caldi", "en": "Warm Sandwiches", "fr": "Sandwichs Chauds", "es": "Bocadillos Calientes", "de": "Warme Sandwiches" },
  "Hamburger": { "it": "Hamburger", "en": "Burger", "fr": "Burger", "es": "Hamburguesa", "de": "Burger" },
  "Burgers": { "it": "Burgers", "en": "Burgers", "fr": "Burgers", "es": "Hamburguesas", "de": "Burger" },
  "Fritti": { "it": "Fritti", "en": "Fried Food", "fr": "Fritures", "es": "Fritos", "de": "Frittiertes" },
  "Sfiziosità": { "it": "Sfiziosità", "en": "Finger Food", "fr": "Amuse-gueules", "es": "Aperitivos", "de": "Fingerfood" },
  "Snack": { "it": "Snack", "en": "Snacks", "fr": "Snacks", "es": "Snacks", "de": "Snacks" },
  "Pizze": { "it": "Pizze", "en": "Pizzas", "fr": "Pizzas", "es": "Pizzas", "de": "Pizzen" },
  "Pizza": { "it": "Pizza", "en": "Pizza", "fr": "Pizza", "es": "Pizza", "de": "Pizza" },
  "Focacce": { "it": "Focacce", "en": "Focaccias", "fr": "Focaccias", "es": "Focaccias", "de": "Focaccias" },
  "Focaccia": { "it": "Focaccia", "en": "Focaccia", "fr": "Focaccia", "es": "Focaccia", "de": "Focaccia" },
  "Insalate": { "it": "Insalate", "en": "Salads", "fr": "Salades", "es": "Ensaladas", "de": "Salate" },
  "Insalata": { "it": "Insalata", "en": "Salad", "fr": "Salade", "es": "Ensalada", "de": "Salat" },
  "Combo": { "it": "Combo", "en": "Combo Menus", "fr": "Menus Combo", "es": "Menús Combo", "de": "Kombi-Menüs" },
  "Menu": { "it": "Menu", "en": "Menu", "fr": "Menu", "es": "Menú", "de": "Menü" },
  "Menù": { "it": "Menù", "en": "Menu", "fr": "Menu", "es": "Menú", "de": "Menü" },
  "Menu Completo": { "it": "Menu Completo", "en": "Full Menu", "fr": "Menu Complet", "es": "Menú Completo", "de": "Komplettes Menü" },
  "Bevande": { "it": "Bevande", "en": "Drinks", "fr": "Boissons", "es": "Bebidas", "de": "Getränke" },
  "Bibite": { "it": "Bibite", "en": "Soft Drinks", "fr": "Boissons fraîches", "es": "Refrescos", "de": "Erfrischungsgetränke" },
  "Dolci": { "it": "Dolci", "en": "Desserts", "fr": "Desserts", "es": "Postres", "de": "Desserts" },
  "Dessert": { "it": "Dessert", "en": "Dessert", "fr": "Dessert", "es": "Postre", "de": "Dessert" },
  "Contorni": { "it": "Contorni", "en": "Side Dishes", "fr": "Accompagnements", "es": "Guarniciones", "de": "Beilagen" },
  "Piadine": { "it": "Piadine", "en": "Flatbread Wraps", "fr": "Wraps Piadinas", "es": "Piadinas", "de": "Piadinas" },
  "Piadina": { "it": "Piadina", "en": "Flatbread Wrap", "fr": "Wrap Piadina", "es": "Piadina", "de": "Piadina" },
  "Kebab": { "it": "Kebab", "en": "Kebab", "fr": "Kebab", "es": "Kebab", "de": "Kebab" },
  "Pollo": { "it": "Pollo", "en": "Chicken", "fr": "Poulet", "es": "Pollo", "de": "Hähnchen" },
  "Birre": { "it": "Birre", "en": "Beers", "fr": "Bières", "es": "Cervezas", "de": "Biere" },
  "Birra": { "it": "Birra", "en": "Beer", "fr": "Bière", "es": "Cerveza", "de": "Bier" },
  "Vini": { "it": "Vini", "en": "Wines", "fr": "Vins", "es": "Vinos", "de": "Weine" },
  "Caffetteria": { "it": "Caffetteria", "en": "Coffee & Hot Drinks", "fr": "Caféterie", "es": "Cafetería", "de": "Kaffee & Heißgetränke" },
  "Rosticceria": { "it": "Rosticceria", "en": "Rotisserie & Street Food", "fr": "Rôtisserie", "es": "Comida para llevar", "de": "Street Food & Grill" },
  "Tavola Calda": { "it": "Tavola Calda", "en": "Hot Delicatessen", "fr": "Plats Chauds", "es": "Comida Caliente", "de": "Warme Küche" },
  "Specialità": { "it": "Specialità", "en": "Specialties", "fr": "Spécialités", "es": "Especialidades", "de": "Spezialitäten" },

  // === DESCRIZIONI E SOTTOTITOLI CATEGORIE ===
  "I nostri panini gourmet": { "it": "I nostri panini gourmet", "en": "Our gourmet sandwiches", "fr": "Nos sandwichs gourmets", "es": "Nuestros bocadillos gourmet", "de": "Unsere Gourmet-Sandwiches" },
  "Pizze fresche e croccanti": { "it": "Pizze fresche e croccanti", "en": "Fresh, crispy pizzas", "fr": "Pizzas fraîches et croustillantes", "es": "Pizzas frescas y crujientes", "de": "Frische, knusprige Pizzen" },
  "Insalate fresche e salutari": { "it": "Insalate fresche e salutari", "en": "Fresh, healthy salads", "fr": "Salades fraîches et saines", "es": "Ensaladas frescas y saludables", "de": "Frische, gesunde Salate" },
  "I nostri menù combo": { "it": "I nostri menù combo", "en": "Our combo menus", "fr": "Nos menus combo", "es": "Nuestros menús combo", "de": "Unsere Kombi-Menüs" },
  "Bevande fresche": { "it": "Bevande fresche", "en": "Refreshing drinks", "fr": "Boissons fraîches", "es": "Bebidas refrescantes", "de": "Erfrischende Getränke" },
  "Dolci e dessert": { "it": "Dolci e dessert", "en": "Sweets and desserts", "fr": "Douceurs et desserts", "es": "Dulces y postres", "de": "Süßspeisen und Desserts" },

  // === PRODOTTI PANINI SPECIFICI & STREET FOOD ===
  "Patatine Panino": { "it": "Patatine Panino", "en": "French Fries Sandwich", "fr": "Sandwich aux Frites", "es": "Bocadillo de Patatas", "de": "Pommes-Sandwich" },
  "Panino con Patatine": { "it": "Panino con Patatine", "en": "French Fries Sandwich", "fr": "Sandwich aux Frites", "es": "Bocadillo de Patatas", de: "Pommes-Sandwich" },
  "Panelle Panino": { "it": "Panelle Panino", "en": "Chickpea Fritters Sandwich (Panelle)", "fr": "Sandwich aux Panelle", "es": "Bocadillo de Panelle", "de": "Panelle-Sandwich" },
  "Panino con Panelle": { "it": "Panino con Panelle", "en": "Chickpea Fritters Sandwich (Panelle)", "fr": "Sandwich aux Panelle", "es": "Bocadillo de Panelle", "de": "Panelle-Sandwich" },
  "Wurstel Panino": { "it": "Wurstel Panino", "en": "Hot Dog Sandwich", "fr": "Sandwich à la Saucisse", "es": "Bocadillo de Salchicha", "de": "Würstchen-Sandwich" },
  "Panino con Wurstel": { "it": "Panino con Wurstel", en: "Hot Dog Sandwich", "fr": "Sandwich à la Saucisse", "es": "Bocadillo de Salchicha", "de": "Würstchen-Sandwich" },
  "Salsiccia Panino": { "it": "Salsiccia Panino", "en": "Sausage Sandwich", "fr": "Sandwich à la Saucisse", "es": "Bocadillo de Salchicha", "de": "Bratwurst-Sandwich" },
  "Panino con Salsiccia": { "it": "Panino con Salsiccia", "en": "Sausage Sandwich", "fr": "Sandwich à la Saucisse", "es": "Bocadillo de Salchicha", "de": "Bratwurst-Sandwich" },
  "Porchetta Panino": { "it": "Porchetta Panino", "en": "Roast Pork Sandwich", "fr": "Sandwich à la Porchetta", "es": "Bocadillo de Porchetta", "de": "Porchetta-Sandwich" },
  "Panino con Porchetta": { "it": "Panino con Porchetta", "en": "Roast Pork Sandwich", "fr": "Sandwich à la Porchetta", "es": "Bocadillo de Porchetta", "de": "Porchetta-Sandwich" },
  "Cotoletta Panino": { "it": "Cotoletta Panino", "en": "Cutlet Sandwich", "fr": "Sandwich à l'Escalope", "es": "Bocadillo de Milanesa", "de": "Schnitzel-Sandwich" },
  "Panino con Cotoletta": { "it": "Panino con Cotoletta", "en": "Cutlet Sandwich", "fr": "Sandwich à l'Escalope", "es": "Bocadillo de Milanesa", "de": "Schnitzel-Sandwich" },
  "Hamburger Panino": { "it": "Hamburger Panino", "en": "Burger Sandwich", "fr": "Sandwich Burger", "es": "Bocadillo de Hamburguesa", "de": "Burger-Sandwich" },
  "Panino con Hamburger": { "it": "Panino con Hamburger", "en": "Burger Sandwich", "fr": "Sandwich Burger", "es": "Bocadillo de Hamburguesa", "de": "Burger-Sandwich" },
  "Pollo Panino": { "it": "Pollo Panino", "en": "Chicken Sandwich", "fr": "Sandwich au Poulet", "es": "Bocadillo de Pollo", "de": "Hähnchen-Sandwich" },
  "Panino con Pollo": { "it": "Panino con Pollo", "en": "Chicken Sandwich", "fr": "Sandwich au Poulet", "es": "Bocadillo de Pollo", "de": "Hähnchen-Sandwich" },
  "Kebab Panino": { "it": "Kebab Panino", "en": "Kebab Sandwich", "fr": "Sandwich Kebab", "es": "Bocadillo de Kebab", "de": "Kebab-Sandwich" },
  "Panino con Kebab": { "it": "Panino con Kebab", "en": "Kebab Sandwich", "fr": "Sandwich Kebab", "es": "Bocadillo de Kebab", "de": "Kebab-Sandwich" },
  "Prosciutto Panino": { "it": "Prosciutto Panino", "en": "Ham Sandwich", "fr": "Sandwich au Jambon", "es": "Bocadillo de Jamón", "de": "Schinken-Sandwich" },
  "Salame Panino": { "it": "Salame Panino", "en": "Salami Sandwich", "fr": "Sandwich au Salami", "es": "Bocadillo de Salchichón", "de": "Salami-Sandwich" },
  "Mortadella Panino": { "it": "Mortadella Panino", "en": "Mortadella Sandwich", "fr": "Sandwich à la Mortadelle", "es": "Bocadillo de Mortadela", "de": "Mortadella-Sandwich" },
  "Tonno Panino": { "it": "Tonno Panino", "en": "Tuna Sandwich", "fr": "Sandwich au Thon", "es": "Bocadillo de Atún", "de": "Thunfisch-Sandwich" },

  // === FRITTI & SPECIALITÀ ===
  "Panelle": { "it": "Panelle", "en": "Chickpea Fritters (Panelle)", "fr": "Beignets de pois chiches (Panelle)", "es": "Frituras de garbanzo (Panelle)", "de": "Kichererbsen-Puffer (Panelle)" },
  "Panella": { "it": "Panella", "en": "Chickpea Fritter", "fr": "Beignet de pois chiche", "es": "Fritura de garbanzo", "de": "Kichererbsen-Puffer" },
  "Crocchè": { "it": "Crocchè", "en": "Potato Croquettes (Crocchè)", "fr": "Croquettes de pommes de terre", "es": "Croquetas de patata", "de": "Kartoffelkroketten" },
  "Crocche": { "it": "Crocche", "en": "Potato Croquettes", "fr": "Croquettes de pommes de terre", "es": "Croquetas de patata", "de": "Kartoffelkroketten" },
  "Crocchè di patate": { "it": "Crocchè di patate", "en": "Potato Croquettes", "fr": "Croquettes de pommes de terre", "es": "Croquetas de patata", "de": "Kartoffelkroketten" },
  "Arancini": { "it": "Arancini", "en": "Rice Balls (Arancini)", "fr": "Boules de riz (Arancini)", "es": "Bolas de arroz (Arancini)", "de": "Reisbällchen (Arancini)" },
  "Arancino": { "it": "Arancino", "en": "Rice Ball (Arancino)", "fr": "Boule de riz (Arancino)", "es": "Bola de arroz (Arancino)", "de": "Reisbällchen (Arancino)" },
  "Arancina": { "it": "Arancina", "en": "Rice Ball (Arancina)", "fr": "Boule de riz (Arancina)", "es": "Bola de arroz (Arancina)", "de": "Reisbällchen (Arancina)" },
  "Arancino al ragù": { "it": "Arancino al ragù", "en": "Meat Ragù Rice Ball", "fr": "Arancino au ragù", "es": "Arancino de ragú", "de": "Arancino mit Fleischragout" },
  "Arancina al ragù": { "it": "Arancina al ragù", "en": "Meat Ragù Rice Ball", "fr": "Arancina au ragù", "es": "Arancina de ragú", "de": "Arancina mit Fleischragout" },
  "Arancino al burro": { "it": "Arancino al burro", "en": "Butter & Mozzarella Rice Ball", "fr": "Arancino au beurre et mozzarella", "es": "Arancino de mantequilla y mozzarella", "de": "Arancino mit Butter und Mozzarella" },
  "Arancina al burro": { "it": "Arancina al burro", "en": "Butter & Mozzarella Rice Ball", "fr": "Arancina au beurre et mozzarella", "es": "Arancina de mantequilla y mozzarella", "de": "Arancina mit Butter und Mozzarella" },
  "Cotoletta": { "it": "Cotoletta", "en": "Breaded Cutlet", "fr": "Escalope panée", "es": "Milanesa", "de": "Paniertes Schnitzel" },
  "Cotoletta di pollo": { "it": "Cotoletta di pollo", "en": "Breaded Chicken Cutlet", "fr": "Escalope de poulet panée", "es": "Milanesa de pollo", "de": "Paniertes Hähnchenschnitzel" },
  "Porchetta": { "it": "Porchetta", "en": "Roast Pork (Porchetta)", "fr": "Porchetta", "es": "Porchetta (Cerdo asado)", "de": "Spanferkelbraten (Porchetta)" },

  // === PRODOTTI CLASSICI & NOMI ===
  "Cheeseburger": { "it": "Cheeseburger", "en": "Cheeseburger", "fr": "Cheeseburger", "es": "Cheeseburger", "de": "Cheeseburger" },
  "Bacon Burger": { "it": "Bacon Burger", "en": "Bacon Burger", "fr": "Burger Bacon", "es": "Hamburguesa con Bacon", "de": "Bacon-Burger" },
  "Classic Burger": { "it": "Classic Burger", "en": "Classic Burger", "fr": "Burger Classique", "es": "Hamburguesa Clásica", "de": "Klassischer Burger" },
  "Double Burger": { "it": "Double Burger", "en": "Double Burger", "fr": "Double Burger", "es": "Hamburguesa Doble", "de": "Doppel-Burger" },
  "Chicken Burger": { "it": "Chicken Burger", "en": "Chicken Burger", "fr": "Burger au Poulet", "es": "Hamburguesa de Pollo", "de": "Hähnchen-Burger" },
  "Veggie Burger": { "it": "Veggie Burger", "en": "Veggie Burger", "fr": "Burger Végétarien", "es": "Hamburguesa Vegetariana", "de": "Veggie-Burger" },
  "Crispy Chicken": { "it": "Crispy Chicken", "en": "Crispy Chicken", "fr": "Poulet Croustillant", "es": "Pollo Crujiente", "de": "Knuspriges Hähnchen" },
  "Pizza Margherita": { "it": "Pizza Margherita", "en": "Margherita Pizza", "fr": "Pizza Margherita", "es": "Pizza Margarita", "de": "Pizza Margherita" },
  "Margherita": { "it": "Margherita", "en": "Margherita", "fr": "Margherita", "es": "Margarita", "de": "Margherita" },
  "Pizza Diavola": { "it": "Pizza Diavola", "en": "Spicy Salami Pizza", "fr": "Pizza Diavola", "es": "Pizza Diabla", "de": "Pizza Diavola" },
  "Diavola": { "it": "Diavola", "en": "Spicy Salami", "fr": "Diavola", "es": "Diabla", "de": "Diavola" },
  "Pizza 4 Formaggi": { "it": "Pizza 4 Formaggi", "en": "Four Cheese Pizza", "fr": "Pizza 4 Fromages", "es": "Pizza 4 Quesos", "de": "Vier-Käse-Pizza" },
  "Pizza Capricciosa": { "it": "Pizza Capricciosa", "en": "Capricciosa Pizza", "fr": "Pizza Capricciosa", "es": "Pizza Caprichosa", "de": "Pizza Capricciosa" },
  "Pizza Marinara": { "it": "Pizza Marinara", "en": "Marinara Pizza", "fr": "Pizza Marinara", "es": "Pizza Marinera", "de": "Pizza Marinara" },
  "Patatine Fritte": { "it": "Patatine Fritte", "en": "French Fries", "fr": "Frites", "es": "Patatas Fritas", "de": "Pommes Frites" },
  "Patatine": { "it": "Patatine", "en": "Fries", "fr": "Frites", "es": "Patatas", "de": "Pommes" },
  "Nuggets di Pollo": { "it": "Nuggets di Pollo", "en": "Chicken Nuggets", "fr": "Nuggets de Poulet", "es": "Nuggets de Pollo", "de": "Hähnchen-Nuggets" },
  "Nuggets": { "it": "Nuggets", "en": "Nuggets", "fr": "Nuggets", "es": "Nuggets", "de": "Nuggets" },
  "Anelli di Cipolla": { "it": "Anelli di Cipolla", "en": "Onion Rings", "fr": "Rondelles d'Oignon", "es": "Aros de Cebolla", "de": "Zwiebelringe" },
  "Mozzarella Sticks": { "it": "Mozzarella Sticks", "en": "Mozzarella Sticks", "fr": "Bâtonnets de Mozzarella", "es": "Palitos de Mozzarella", "de": "Mozzarella-Sticks" },
  "Insalata Cesare": { "it": "Insalata Cesare", "en": "Caesar Salad", "fr": "Salade César", "es": "Ensalada César", "de": "Caesar Salad" },
  "Caesar Salad": { "it": "Caesar Salad", "en": "Caesar Salad", "fr": "Salade César", "es": "Ensalada César", "de": "Caesar Salad" },
  "Insalata Mista": { "it": "Insalata Mista", "en": "Mixed Salad", "fr": "Salade Mixte", "es": "Ensalada Mixta", "de": "Gemischter Salat" },
  "Insalata Greca": { "it": "Insalata Greca", "en": "Greek Salad", "fr": "Salade Grecque", "es": "Ensalada Griega", "de": "Griechischer Salat" },
  "Tiramisù": { "it": "Tiramisù", "en": "Tiramisù", "fr": "Tiramisu", "es": "Tiramisú", "de": "Tiramisu" },
  "Tiramisu": { "it": "Tiramisu", "en": "Tiramisù", "fr": "Tiramisu", "es": "Tiramisú", "de": "Tiramisu" },
  "Cheesecake": { "it": "Cheesecake", "en": "Cheesecake", "fr": "Gâteau au Fromage", "es": "Tarta de Queso", "de": "Käsekuchen" },
  "Acqua Naturale": { "it": "Acqua Naturale", "en": "Still Water", "fr": "Eau Plate", "es": "Agua sin gas", "de": "Stilles Wasser" },
  "Acqua Frizzante": { "it": "Acqua Frizzante", "en": "Sparkling Water", "fr": "Eau Gazeuse", "es": "Agua con gas", "de": "Sprudelwasser" },
  "Acqua": { "it": "Acqua", "en": "Water", "fr": "Eau", "es": "Agua", "de": "Wasser" },
  "Coca Cola": { "it": "Coca Cola", "en": "Coca Cola", "fr": "Coca Cola", "es": "Coca Cola", "de": "Coca Cola" },
  "Coca Cola Zero": { "it": "Coca Cola Zero", "en": "Coca Cola Zero", "fr": "Coca Cola Zéro", "es": "Coca Cola Zero", "de": "Coca Cola Zero" },
  "Fanta": { "it": "Fanta", "en": "Fanta", "fr": "Fanta", "es": "Fanta", "de": "Fanta" },
  "Sprite": { "it": "Sprite", "en": "Sprite", "fr": "Sprite", "es": "Sprite", "de": "Sprite" },
  "The al Limone": { "it": "The al Limone", "en": "Lemon Iced Tea", "fr": "Thé Glacé au Citron", "es": "Té Helado al Limón", "de": "Zitronen-Eistee" },
  "The alla Pesca": { "it": "The alla Pesca", "en": "Peach Iced Tea", "fr": "Thé Glacé à la Pêche", "es": "Té Helado al Melocotón", "de": "Pfirsich-Eistee" },
  "Caffè Espresso": { "it": "Caffè Espresso", "en": "Espresso Coffee", "fr": "Café Expresso", "es": "Café Espresso", "de": "Espresso" },
  "Caffè": { "it": "Caffè", "en": "Coffee", "fr": "Café", "es": "Café", "de": "Kaffee" },

  // === GRUPPI OPZIONI, SCELTE E SEZIONI UI ===
  "Dimensione": { "it": "Dimensione", "en": "Size", "fr": "Taille", "es": "Tamaño", "de": "Größe" },
  "Taglia": { "it": "Taglia", "en": "Size", "fr": "Taille", "es": "Tamaño", "de": "Größe" },
  "Formato": { "it": "Formato", "en": "Format", "fr": "Format", "es": "Formato", "de": "Format" },
  "Cottura": { "it": "Cottura", "en": "Doneness", "fr": "Cuisson", "es": "Cocción", "de": "Garstufe" },
  "Cottura Carne": { "it": "Cottura Carne", "en": "Meat Doneness", "fr": "Cuisson de la viande", "es": "Punto de la carne", "de": "Fleisch-Garstufe" },
  "Scegli la Cottura": { "it": "Scegli la Cottura", "en": "Choose Cooking Level", "fr": "Choisissez la cuisson", "es": "Elige el punto de cocción", "de": "Garstufe wählen" },
  "Personalizza Ingredienti": { "it": "Personalizza Ingredienti", "en": "Customize Ingredients", "fr": "Personnaliser les ingrédients", "es": "Personalizar ingredientes", "de": "Zutaten anpassen" },
  "Ingredienti Base": { "it": "Ingredienti Base", "en": "Base Ingredients", "fr": "Ingrédients de base", "es": "Ingredientes base", "de": "Grundzutaten" },
  "Ingredienti": { "it": "Ingredienti", "en": "Ingredients", "fr": "Ingrédients", "es": "Ingredientes", "de": "Zutaten" },
  "Aggiunte Extra": { "it": "Aggiunte Extra", "en": "Extra Additions", "fr": "Suppléments", "es": "Añadidos extra", "de": "Zusätzliche Extras" },
  "Extra": { "it": "Extra", "en": "Extras", "fr": "Suppléments", "es": "Extras", "de": "Extras" },
  "Salse": { "it": "Salse", "en": "Sauces", "fr": "Sauces", "es": "Salsas", "de": "Saucen" },
  "Salsa": { "it": "Salsa", "en": "Sauce", "fr": "Sauce", "es": "Salsa", "de": "Sauce" },
  "Salse a scelta": { "it": "Salse a scelta", "en": "Choice of sauces", "fr": "Sauces au choix", "es": "Salsas a elegir", "de": "Saucen nach Wahl" },
  "Salsa a scelta": { "it": "Salsa a scelta", "en": "Choice of sauce", "fr": "Sauce au choix", "es": "Salsa a elegir", "de": "Sauce nach Wahl" },
  "e salse a scelta": { "it": "e salse a scelta", "en": "and choice of sauces", "fr": "et sauces au choix", "es": "y salsas a elegir", "de": "und Saucen nach Wahl" },
  "con salse a scelta": { "it": "con salse a scelta", "en": "with choice of sauces", "fr": "avec sauces au choix", "es": "con salsas a elegir", "de": "mit Saucen nach Wahl" },
  "Scegli la Salsa": { "it": "Scegli la Salsa", "en": "Choose Sauce", "fr": "Choisissez la sauce", "es": "Elige la salsa", "de": "Sauce wählen" },
  "Scegli le Salse": { "it": "Scegli le Salse", "en": "Choose Sauces", "fr": "Choisissez les sauces", "es": "Elige las salsas", "de": "Saucen wählen" },
  "Scegli il Contorno": { "it": "Scegli il Contorno", "en": "Choose Side Dish", "fr": "Choisissez l'accompagnement", "es": "Elige la guarnición", "de": "Beilage wählen" },
  "Scegli la Bevanda": { "it": "Scegli la Bevanda", "en": "Choose Drink", "fr": "Choisissez la boisson", "es": "Elige la bebida", "de": "Getränk wählen" },
  "Scegli il Dolce": { "it": "Scegli il Dolce", "en": "Choose Dessert", "fr": "Choisissez le dessert", "es": "Elige el postre", "de": "Dessert wählen" },
  "Scegli il Pane": { "it": "Scegli il Pane", "en": "Choose Bun / Bread", "fr": "Choisissez le pain", "es": "Elige el pan", "de": "Brot / Brötchen wählen" },
  "Tipo di Pane": { "it": "Tipo di Pane", "en": "Bread Type", "fr": "Type de pain", "es": "Tipo de pan", "de": "Brotsorte" },

  // === VALORI OPZIONI E COTTURE ===
  "Piccolo": { "it": "Piccolo", "en": "Small", "fr": "Petit", "es": "Pequeño", "de": "Klein" },
  "Medio": { "it": "Medio", "en": "Medium", "fr": "Moyen", "es": "Mediano", "de": "Mittel" },
  "Grande": { "it": "Grande", "en": "Large", "fr": "Grand", "es": "Grande", "de": "Groß" },
  "Maxi": { "it": "Maxi", "en": "Maxi", "fr": "Maxi", "es": "Maxi", "de": "Maxi" },
  "Normale": { "it": "Normale", "en": "Regular", "fr": "Normal", "es": "Normal", "de": "Normal" },
  "Al Sangue": { "it": "Al Sangue", "en": "Rare", "fr": "Saignant", "es": "Poco hecho", "de": "Blutig" },
  "Media Cottura": { "it": "Media Cottura", "en": "Medium", "fr": "À point", "es": "Al punto", "de": "Medium" },
  "Media": { "it": "Media", "en": "Medium", "fr": "À point", "es": "Al punto", "de": "Medium" },
  "Ben Cotta": { "it": "Ben Cotta", "en": "Well Done", "fr": "Bien cuit", "es": "Muy hecho", "de": "Durchgebraten" },
  "Ben Cotto": { "it": "Ben Cotto", "en": "Well Done", "fr": "Bien cuit", "es": "Muy hecho", "de": "Durchgebraten" },

  // === INGREDIENTI, CARNE, FORMAGGI, VERDURE ===
  "Carne di manzo": { "it": "Carne di manzo", "en": "Beef Patty", "fr": "Bœuf", "es": "Carne de vacuno", "de": "Rindfleisch" },
  "Carne": { "it": "Carne", "en": "Meat", "fr": "Viande", "es": "Carne", "de": "Fleisch" },
  "Manzo": { "it": "Manzo", "en": "Beef", "fr": "Bœuf", "es": "Ternera", "de": "Rindfleisch" },
  "Pollo fritto": { "it": "Pollo fritto", "en": "Fried Chicken", "fr": "Poulet frit", "es": "Pollo frito", "de": "Gebratenes Hähnchen" },
  "Pollo grigliato": { "it": "Pollo grigliato", "en": "Grilled Chicken", "fr": "Poulet grillé", "es": "Pollo a la plancha", "de": "Gegrilltes Hähnchen" },
  "Bacon": { "it": "Bacon", "en": "Crispy Bacon", "fr": "Bacon", "es": "Bacon", "de": "Speck" },
  "Pancetta": { "it": "Pancetta", "en": "Pancetta", "fr": "Poitrine de porc", "es": "Panceta", "de": "Bauchspeck" },
  "Prosciutto crudo": { "it": "Prosciutto crudo", "en": "Cured Ham", "fr": "Jambon cru", "es": "Jamón serrano", "de": "Parmaschinken" },
  "Prosciutto cotto": { "it": "Prosciutto cotto", "en": "Cooked Ham", "fr": "Jambon cuit", "es": "Jamón cocido", "de": "Kochschinken" },
  "Salame piccante": { "it": "Salame piccante", "en": "Spicy Salami", "fr": "Salami piquant", "es": "Salami picante", "de": "Scharfe Salami" },
  "Salsiccia": { "it": "Salsiccia", "en": "Sausage", "fr": "Saucisse", "es": "Salchicha", "de": "Wurst" },
  "Wurstel": { "it": "Wurstel", "en": "Hot Dog", "fr": "Saucisse", "es": "Perrito caliente", "de": "Würstchen" },
  "Uovo": { "it": "Uovo", "en": "Egg", "fr": "Œuf", "es": "Huevo", "de": "Ei" },
  "Uovo fritto": { "it": "Uovo fritto", "en": "Fried Egg", "fr": "Œuf au plat", "es": "Huevo frito", "de": "Spiegelei" },
  "Formaggio": { "it": "Formaggio", "en": "Cheese", "fr": "Fromage", "es": "Queso", "de": "Käse" },
  "Cheddar": { "it": "Cheddar", "en": "Cheddar Cheese", "fr": "Cheddar", "es": "Cheddar", "de": "Cheddar" },
  "Mozzarella": { "it": "Mozzarella", "en": "Mozzarella", "fr": "Mozzarella", "es": "Mozzarella", "de": "Mozzarella" },
  "Mozzarella di bufala": { "it": "Mozzarella di bufala", "en": "Buffalo Mozzarella", "fr": "Mozzarella de bufflonne", "es": "Mozzarella de búfala", "de": "Büffelmozzarella" },
  "Gorgonzola": { "it": "Gorgonzola", "en": "Gorgonzola", "fr": "Gorgonzola", "es": "Gorgonzola", "de": "Gorgonzola" },
  "Parmigiano": { "it": "Parmigiano", "en": "Parmesan", "fr": "Parmesan", "es": "Parmesano", "de": "Parmesan" },
  "Stracciatella": { "it": "Stracciatella", "en": "Stracciatella Cheese", "fr": "Fromage Stracciatella", "es": "Queso Stracciatella", "de": "Stracciatella-Käse" },
  "Burrata": { "it": "Burrata", "en": "Burrata Cheese", "fr": "Burrata", "es": "Queso Burrata", "de": "Burrata-Käse" },
  "Scamorza": { "it": "Scamorza", "en": "Scamorza Cheese", "fr": "Fromage Scamorza", "es": "Queso Scamorza", "de": "Scamorza-Käse" },
  "Provola": { "it": "Provola", "en": "Provola Cheese", "fr": "Fromage Provola", "es": "Queso Provola", "de": "Provola-Käse" },
  "Pecorino": { "it": "Pecorino", "en": "Pecorino Cheese", "fr": "Fromage Pecorino", "es": "Queso Pecorino", "de": "Pecorino-Käse" },
  "Grana Padano": { "it": "Grana Padano", "en": "Grana Padano Cheese", "fr": "Fromage Grana Padano", "es": "Queso Grana Padano", "de": "Grana-Padano-Käse" },
  "Fontina": { "it": "Fontina", "en": "Fontina Cheese", "fr": "Fromage Fontina", "es": "Queso Fontina", "de": "Fontina-Käse" },
  "Lattuga": { "it": "Lattuga", "en": "Lettuce", "fr": "Laitue", "es": "Lechuga", "de": "Salat" },
  "Insalata verde": { "it": "Insalata verde", "en": "Green Salad", "fr": "Salade verte", "es": "Ensalada verde", "de": "Grüner Salat" },
  "Rucola": { "it": "Rucola", "en": "Arugula", "fr": "Roquette", "es": "Rúcula", "de": "Rucola" },
  "Pomodoro": { "it": "Pomodoro", "en": "Tomato", "fr": "Tomate", "es": "Tomate", "de": "Tomate" },
  "Pomodorini": { "it": "Pomodorini", "en": "Cherry Tomatoes", "fr": "Tomates cerises", "es": "Tomates cherry", "de": "Kirschtomaten" },
  "Pomodori secchi": { "it": "Pomodori secchi", "en": "Sun-dried Tomatoes", "fr": "Tomates séchées", "es": "Tomates secos", "de": "Getrocknete Tomaten" },
  "Cipolla": { "it": "Cipolla", "en": "Onion", "fr": "Oignon", "es": "Cebolla", "de": "Zwiebel" },
  "Cipolla rossa": { "it": "Cipolla rossa", "en": "Red Onion", "fr": "Oignon rouge", "es": "Cebolla roja", "de": "Rote Zwiebel" },
  "Cipolla caramellata": { "it": "Cipolla caramellata", "en": "Caramelized Onion", "fr": "Oignon caramélisé", "es": "Cebolla caramelizada", "de": "Karamellisierte Zwiebel" },
  "Cipolla croccante": { "it": "Cipolla croccante", "en": "Crispy Fried Onion", "fr": "Oignon croustillant", "es": "Cebolla crujiente", "de": "Röstzwiebeln" },
  "Zucchine": { "it": "Zucchine", "en": "Zucchini", "fr": "Courgettes", "es": "Calabacín", "de": "Zucchini" },
  "Melanzane": { "it": "Melanzane", "en": "Eggplant", "fr": "Aubergines", "es": "Berenjenas", "de": "Auberginen" },
  "Peperoni": { "it": "Peperoni", "en": "Bell Peppers", "fr": "Poivrons", "es": "Pimientos", "de": "Paprika" },
  "Friarielli": { "it": "Friarielli", "en": "Broccoli Rabe (Friarielli)", "fr": "Brocoli-rave (Friarielli)", "es": "Grelos (Friarielli)", "de": "Stängelkohl (Friarielli)" },
  "Funghi": { "it": "Funghi", "en": "Mushrooms", "fr": "Champignons", "es": "Champiñones", "de": "Pilze" },
  "Cetriolini": { "it": "Cetriolini", "en": "Pickles", "fr": "Cornichons", "es": "Pepinillos", "de": "Essiggurken" },
  "Jalapenos": { "it": "Jalapenos", "en": "Jalapeños", "fr": "Jalapeños", "es": "Jalapeños", "de": "Jalapeños" },
  "Olive": { "it": "Olive", "en": "Olives", "fr": "Olives", "es": "Aceitunas", "de": "Oliven" },
  "Basilico": { "it": "Basilico", "en": "Fresh Basil", "fr": "Basilic", "es": "Albahaca", "de": "Basilikum" },
  "Origano": { "it": "Origano", "en": "Oregano", "fr": "Origan", "es": "Orégano", "de": "Oregano" },
  "Pane": { "it": "Pane", "en": "Bread", "fr": "Pain", "es": "Pan", "de": "Brot" },

  // === SALSE ===
  "Maionese": { "it": "Maionese", "en": "Mayonnaise", "fr": "Mayonnaise", "es": "Mayonesa", "de": "Mayonnaise" },
  "Ketchup": { "it": "Ketchup", "en": "Ketchup", "fr": "Ketchup", "es": "Kétchup", "de": "Ketchup" },
  "Salsa BBQ": { "it": "Salsa BBQ", "en": "BBQ Sauce", "fr": "Sauce Barbecue", "es": "Salsa Barbacoa", "de": "BBQ-Sauce" },
  "Barbecue": { "it": "Barbecue", "en": "BBQ Sauce", "fr": "Sauce Barbecue", "es": "Salsa Barbacoa", "de": "BBQ-Sauce" },
  "Senape": { "it": "Senape", "en": "Mustard", "fr": "Moutarde", "es": "Mostaza", "de": "Senf" },
  "Salsa Burger": { "it": "Salsa Burger", "en": "Burger Sauce", "fr": "Sauce Burger", "es": "Salsa Burger", "de": "Burger-Sauce" },
  "Salsa Piccante": { "it": "Salsa Piccante", "en": "Spicy Hot Sauce", "fr": "Sauce Piquante", "es": "Salsa Picante", "de": "Scharfe Sauce" },
  "Salsa Rosa": { "it": "Salsa Rosa", "en": "Cocktail Sauce", "fr": "Sauce Cocktail", "es": "Salsa Rosa", "de": "Cocktailsauce" },
  "Salsa Yogurt": { "it": "Salsa Yogurt", "en": "Yogurt Sauce", "fr": "Sauce Yaourt", "es": "Salsa de Yogur", "de": "Joghurtsauce" },
  "Salsa Tartara": { "it": "Salsa Tartara", "en": "Tartar Sauce", "fr": "Sauce Tartare", "es": "Salsa Tártara", "de": "Remouladensauce" },
  "Salsa Agrodolce": { "it": "Salsa Agrodolce", "en": "Sweet and Sour Sauce", "fr": "Sauce Aigre-douce", "es": "Salsa Agridulce", "de": "Süß-Sauer-Sauce" },
  "Guacamole": { "it": "Guacamole", "en": "Guacamole", "fr": "Guacamole", "es": "Guacamole", "de": "Guacamole" },
  "Pesto di pistacchio": { "it": "Pesto di pistacchio", "en": "Pistachio Pesto", "fr": "Pesto de pistache", "es": "Pesto de pistacho", "de": "Pistazien-Pesto" },
  "Pesto di basilico": { "it": "Pesto di basilico", "en": "Basil Pesto", "fr": "Pesto de basilic", "es": "Pesto de albahaca", "de": "Basilikum-Pesto" },
  "Crema di tartufo": { "it": "Crema di tartufo", "en": "Truffle Cream", "fr": "Crème de truffe", "es": "Crema de trufa", "de": "Trüffelcreme" },

  // === ALLERGENI COMPLETI & VARIANTI ===
  "Glutine": { "it": "Glutine", "en": "Gluten", "fr": "Gluten", "es": "Gluten", "de": "Gluten" },
  "glutine": { "it": "glutine", "en": "gluten", "fr": "gluten", "es": "gluten", "de": "Gluten" },
  "Latte": { "it": "Latte", "en": "Milk / Dairy", "fr": "Lait", "es": "Leche", "de": "Milch" },
  "latte": { "it": "latte", "en": "milk", "fr": "lait", "es": "leche", "de": "Milch" },
  "Latticini": { "it": "Latticini", "en": "Dairy", "fr": "Produits laitiers", "es": "Lácteos", "de": "Milchprodukte" },
  "latticini": { "it": "latticini", "en": "dairy", "fr": "produits laitiers", "es": "lácteos", "de": "Milchprodukte" },
  "Derivati del latte": { "it": "Derivati del latte", "en": "Milk derivatives", "fr": "Dérivés du lait", "es": "Derivados lácteos", "de": "Milcherzeugnisse" },
  "derivati del latte": { "it": "derivati del latte", "en": "milk derivatives", "fr": "dérivés du lait", "es": "derivados lácteos", "de": "Milcherzeugnisse" },
  "Uova": { "it": "Uova", "en": "Eggs", "fr": "Œufs", "es": "Huevos", "de": "Eier" },
  "uova": { "it": "uova", "en": "eggs", "fr": "œufs", "es": "huevos", "de": "Eier" },
  "Frutta a guscio": { "it": "Frutta a guscio", "en": "Tree Nuts", "fr": "Fruits à coque", "es": "Frutos de cáscara", "de": "Schalenfrüchte" },
  "frutta a guscio": { "it": "frutta a guscio", "en": "tree nuts", "fr": "fruits à coque", "es": "frutos de cáscara", "de": "Schalenfrüchte" },
  "Arachidi": { "it": "Arachidi", "en": "Peanuts", "fr": "Arachides", "es": "Cacahuetes", "de": "Erdnüsse" },
  "arachidi": { "it": "arachidi", "en": "peanuts", "fr": "arachides", "es": "cacahuetes", "de": "Erdnüsse" },
  "Soia": { "it": "Soia", "en": "Soy", "fr": "Soja", "es": "Soja", "de": "Soja" },
  "soia": { "it": "soia", "en": "soy", "fr": "soja", "es": "soja", "de": "Soja" },
  "Pesce": { "it": "Pesce", "en": "Fish", "fr": "Poisson", "es": "Pescado", "de": "Fisch" },
  "pesce": { "it": "pesce", "en": "fish", "fr": "poisson", "es": "pescado", "de": "Fisch" },
  "Crostacei": { "it": "Crostacei", "en": "Crustaceans", "fr": "Crustacés", "es": "Crustáceos", "de": "Krebstiere" },
  "crostacei": { "it": "crostacei", "en": "crustaceans", "fr": "crustacés", "es": "crustáceos", "de": "Krebstiere" },
  "Sedano": { "it": "Sedano", "en": "Celery", "fr": "Céleri", "es": "Apio", "de": "Sellerie" },
  "sedano": { "it": "sedano", "en": "celery", "fr": "céleri", "es": "apio", "de": "Sellerie" },
  "Sesamo": { "it": "Sesamo", "en": "Sesame", "fr": "Sésame", "es": "Sésamo", "de": "Sesam" },
  "sesamo": { "it": "sesamo", "en": "sesame", "fr": "sésame", "es": "sésamo", "de": "Sesam" },
  "Semi di sesamo": { "it": "Semi di sesamo", "en": "Sesame seeds", "fr": "Graines de sésame", "es": "Semillas de sésamo", "de": "Sesamsamen" },
  "semi di sesamo": { "it": "semi di sesamo", "en": "sesame seeds", "fr": "graines de sésame", "es": "semillas de sésamo", "de": "Sesamsamen" },
  "Senape (allergene)": { "it": "Senape", "en": "Mustard", "fr": "Moutarde", "es": "Mostaza", "de": "Senf" },
  "senape": { "it": "senape", "en": "mustard", "fr": "moutarde", "es": "mostaza", "de": "Senf" },
  "Solfiti": { "it": "Solfiti", "en": "Sulphites", "fr": "Sulfites", "es": "Sulfitos", "de": "Sulfite" },
  "solfiti": { "it": "solfiti", "en": "sulphites", "fr": "sulfites", "es": "sulfitos", "de": "Sulfite" },
  "Anidride solforosa": { "it": "Anidride solforosa", "en": "Sulphur dioxide", "fr": "Dioxyde de soufre", "es": "Dióxido de azufre", "de": "Schwefeldioxid" },
  "anidride solforosa": { "it": "anidride solforosa", "en": "sulphur dioxide", "fr": "dioxyde de soufre", "es": "dióxido de azufre", "de": "Schwefeldioxid" },
  "Anidride solforosa e solfiti": { "it": "Anidride solforosa e solfiti", "en": "Sulphur dioxide and sulphites", "fr": "Dioxyde de soufre et sulfites", "es": "Dióxido de azufre y sulfitos", "de": "Schwefeldioxid und Sulfite" },
  "anidride solforosa e solfiti": { "it": "anidride solforosa e solfiti", "en": "sulphur dioxide and sulphites", "fr": "dioxyde de soufre et sulfites", "es": "dióxido de azufre y sulfitos", "de": "Schwefeldioxid und Sulfite" },
  "Lupini": { "it": "Lupini", "en": "Lupin", "fr": "Lupin", "es": "Altramuces", "de": "Lupinen" },
  "lupini": { "it": "lupini", "en": "lupin", "fr": "lupin", "es": "altramuces", "de": "Lupinen" },
  "Molluschi": { "it": "Molluschi", "en": "Molluscs", "fr": "Mollusques", "es": "Moluscos", "de": "Weichtiere" },
  "molluschi": { "it": "molluschi", "en": "molluscs", "fr": "mollusques", "es": "moluscos", "de": "Weichtiere" },
  "Cereali contenenti glutine": { "it": "Cereali contenenti glutine", "en": "Cereals containing gluten", "fr": "Céréales contenant du gluten", "es": "Cereales con gluten", "de": "Glutenhaltiges Getreide" },
  "cereali contenenti glutine": { "it": "cereali contenenti glutine", "en": "cereals containing gluten", "fr": "céréales contenant du gluten", "es": "cereales con gluten", "de": "glutenhaltiges Getreide" },
};

// Costruisci dizionario case-insensitive lowercase per lookup istantaneo veloce
const LOWERCASE_MAP = new Map<string, Record<SupportedLanguage, string>>();
for (const [k, v] of Object.entries(CUSTOMER_MENU_TRANSLATIONS)) {
  LOWERCASE_MAP.set(k.toLowerCase().trim(), v);
}

export type MenuLocalizedValue = Partial<Record<SupportedLanguage, string>>;

const PREFIX_PATTERNS: Array<{
  regex: RegExp;
  translatePrefix: (lang: SupportedLanguage) => string;
}> = [
  {
    regex: /^(\+\s*extra\s+)/i,
    translatePrefix: (l) => (l === 'en' ? '+ Extra ' : l === 'fr' ? '+ Supplément ' : l === 'es' ? '+ Extra ' : l === 'de' ? '+ Extra ' : '+ Extra '),
  },
  {
    regex: /^(\+\s*)/i,
    translatePrefix: () => '+ ',
  },
  {
    regex: /^(extra\s+)/i,
    translatePrefix: (l) => (l === 'en' ? 'Extra ' : l === 'fr' ? 'Supplément ' : l === 'es' ? 'Extra ' : l === 'de' ? 'Extra ' : 'Extra '),
  },
  {
    regex: /^(❌\s*senza\s+)/i,
    translatePrefix: (l) => (l === 'en' ? '❌ No ' : l === 'fr' ? '❌ Sans ' : l === 'es' ? '❌ Sin ' : l === 'de' ? '❌ Ohne ' : '❌ Senza '),
  },
  {
    regex: /^(senza\s+)/i,
    translatePrefix: (l) => (l === 'en' ? 'Without ' : l === 'fr' ? 'Sans ' : l === 'es' ? 'Sin ' : l === 'de' ? 'Ohne ' : 'Senza '),
  },
  {
    regex: /^(-\s*senza\s+)/i,
    translatePrefix: (l) => (l === 'en' ? '- No ' : l === 'fr' ? '- Sans ' : l === 'es' ? '- Sin ' : l === 'de' ? '- Ohne ' : '- Senza '),
  },
  {
    regex: /^(-\s*)/i,
    translatePrefix: () => '- ',
  },
  {
    regex: /^(con\s+)/i,
    translatePrefix: (l) => (l === 'en' ? 'With ' : l === 'fr' ? 'Avec ' : l === 'es' ? 'Con ' : l === 'de' ? 'Mit ' : 'Con '),
  },
  {
    regex: /^(doppio\s+)/i,
    translatePrefix: (l) => (l === 'en' ? 'Double ' : l === 'fr' ? 'Double ' : l === 'es' ? 'Doble ' : l === 'de' ? 'Doppel ' : 'Doppio '),
  },
  {
    regex: /^(doppia\s+)/i,
    translatePrefix: (l) => (l === 'en' ? 'Double ' : l === 'fr' ? 'Double ' : l === 'es' ? 'Doble ' : l === 'de' ? 'Doppel ' : 'Doppia '),
  },
  {
    regex: /^(solo\s+)/i,
    translatePrefix: (l) => (l === 'en' ? 'Only ' : l === 'fr' ? 'Seulement ' : l === 'es' ? 'Solo ' : l === 'de' ? 'Nur ' : 'Solo '),
  },
];

/**
 * Traduzione atomica di un singolo termine pulito.
 */
function translateSingleTerm(term: string, language: SupportedLanguage): string {
  const t = term.trim();
  if (!t) return '';

  // 1. Glossario dinamico persistente salvato da Admin
  if (persistedGlossary[t]?.[language]) return persistedGlossary[t][language] as string;
  const tLower = t.toLowerCase();
  for (const [k, map] of Object.entries(persistedGlossary)) {
    if (k.toLowerCase() === tLower && map?.[language]) return map[language] as string;
  }

  // 2. Dizionario integrato esatto
  if (CUSTOMER_MENU_TRANSLATIONS[t]?.[language]) return CUSTOMER_MENU_TRANSLATIONS[t][language];

  // 3. Dizionario integrato case-insensitive
  const match = LOWERCASE_MAP.get(tLower);
  if (match?.[language]) return match[language];

  return t;
}

/**
 * Motore di traduzione avanzato per il menù utente:
 * Supporta:
 * - Localizzazione esplicita se presente nell'oggetto
 * - Traduzione diretta di prodotti, categorie, gruppi opzioni
 * - Riconoscimento morfologico di frasi culinarie (es: "Panino con Patatine e salse a scelta.")
 * - Riconoscimento nomi composti (es: "Patatine Panino" -> "French Fries Sandwich")
 * - Traduzione con prefissi ("+ Extra Formaggio" -> "+ Extra Cheese")
 * - Traduzione di liste separate da virgola ("Glutine, soia, arachidi, latte")
 * - Preservazione di prezzi e numeri "(+1.50€)"
 */
export function translateCustomerMenuText(
  source: string | undefined | null,
  language: SupportedLanguage,
  localized?: MenuLocalizedValue,
): string {
  if (!source) return '';
  if (language === 'it') return source;
  if (localized?.[language]) return localized[language] as string;

  const trimmed = source.trim();
  if (!trimmed) return '';

  // 1. Tentativo match diretto esatto o case-insensitive
  const directMatch = translateSingleTerm(trimmed, language);
  if (directMatch !== trimmed) return directMatch;

  // 2. Prefisso icona o emoji (es. ⚠️ Glutine, soia...)
  const iconPrefixMatch = trimmed.match(/^([\u26A0\uFE0F\u2600-\u26FF\uD83C-\uDBFF\uDC00-\uDFFF]+\s*)(.+)$/);
  if (iconPrefixMatch) {
    const icon = iconPrefixMatch[1];
    const rest = iconPrefixMatch[2];
    return `${icon}${translateCustomerMenuText(rest, language)}`;
  }

  // 3. Match con prefissi comuni (+, -, Senza, Extra, Con...)
  for (const p of PREFIX_PATTERNS) {
    const match = trimmed.match(p.regex);
    if (match) {
      const rest = trimmed.slice(match[0].length);
      const translatedRest = translateCustomerMenuText(rest, language);
      const newPrefix = p.translatePrefix(language);
      return `${newPrefix}${translatedRest}`;
    }
  }

  // 4. Se contiene virgole (es. elenco ingredienti o allergeni "Glutine, soia, arachidi, latte, uova")
  if (trimmed.includes(',')) {
    const parts = trimmed.split(',').map((part) => {
      const pTrim = part.trim();
      const pTranslated = translateCustomerMenuText(pTrim, language);
      return pTranslated;
    });
    return parts.join(', ');
  }

  // 5. Se contiene parentesi con prezzo o note es: "Patatine (+1.50€)" o "Hamburger (180g)"
  const parenMatch = trimmed.match(/^(.+?)(\s*\([^)]+\))$/);
  if (parenMatch) {
    const mainText = parenMatch[1];
    const suffix = parenMatch[2];
    const translatedMain = translateCustomerMenuText(mainText, language);
    return `${translatedMain}${suffix}`;
  }

  // 6. Analisi e traduzione sintattica frasi culinarie italiane tipiche
  // 6a. "Panino con {X} e salse a scelta" / "Panino con {X}"
  const paninoConSalseMatch = trimmed.match(/^Panino\s+con\s+(.+?)(?:\s+e\s+salse\s+a\s+scelta)?(\.?)$/i);
  if (paninoConSalseMatch) {
    const ingredient = paninoConSalseMatch[1].trim();
    const hasSalse = /salse\s+a\s+scelta/i.test(trimmed);
    const dot = paninoConSalseMatch[2] || '';
    const transIngr = translateCustomerMenuText(ingredient, language);
    if (language === 'en') {
      return hasSalse ? `Sandwich with ${transIngr} and choice of sauces${dot}` : `Sandwich with ${transIngr}${dot}`;
    }
    if (language === 'fr') {
      return hasSalse ? `Sandwich avec ${transIngr} et sauces au choix${dot}` : `Sandwich avec ${transIngr}${dot}`;
    }
    if (language === 'es') {
      return hasSalse ? `Bocadillo con ${transIngr} y salsas a elegir${dot}` : `Bocadillo con ${transIngr}${dot}`;
    }
    if (language === 'de') {
      return hasSalse ? `Sandwich mit ${transIngr} und Saucen nach Wahl${dot}` : `Sandwich mit ${transIngr}${dot}`;
    }
  }

  // 6b. "{X} con {Y} e salse a scelta" / "{X} con {Y}"
  const conSalseMatch = trimmed.match(/^(.+?)\s+con\s+(.+?)(?:\s+e\s+salse\s+a\s+scelta)?(\.?)$/i);
  if (conSalseMatch) {
    const itemA = conSalseMatch[1].trim();
    const itemB = conSalseMatch[2].trim();
    const hasSalse = /salse\s+a\s+scelta/i.test(trimmed);
    const dot = conSalseMatch[3] || '';
    const transA = translateCustomerMenuText(itemA, language);
    const transB = translateCustomerMenuText(itemB, language);
    if (language === 'en') {
      return hasSalse ? `${transA} with ${transB} and choice of sauces${dot}` : `${transA} with ${transB}${dot}`;
    }
    if (language === 'fr') {
      return hasSalse ? `${transA} avec ${transB} et sauces au choix${dot}` : `${transA} avec ${transB}${dot}`;
    }
    if (language === 'es') {
      return hasSalse ? `${transA} con ${transB} y salsas a elegir${dot}` : `${transA} con ${transB}${dot}`;
    }
    if (language === 'de') {
      return hasSalse ? `${transA} mit ${transB} und Saucen nach Wahl${dot}` : `${transA} mit ${transB}${dot}`;
    }
  }

  // 6c. "{X} e salse a scelta"
  const eSalseMatch = trimmed.match(/^(.+?)\s+e\s+salse\s+a\s+scelta(\.?)$/i);
  if (eSalseMatch) {
    const item = eSalseMatch[1].trim();
    const dot = eSalseMatch[2] || '';
    const transItem = translateCustomerMenuText(item, language);
    if (language === 'en') return `${transItem} and choice of sauces${dot}`;
    if (language === 'fr') return `${transItem} et sauces au choix${dot}`;
    if (language === 'es') return `${transItem} y salsas a elegir${dot}`;
    if (language === 'de') return `${transItem} und Saucen nach Wahl${dot}`;
  }

  // 6d. "{X} a scelta"
  const aSceltaMatch = trimmed.match(/^(.+?)\s+a\s+scelta(\.?)$/i);
  if (aSceltaMatch) {
    const item = aSceltaMatch[1].trim();
    const dot = aSceltaMatch[2] || '';
    const transItem = translateCustomerMenuText(item, language);
    if (language === 'en') return `Choice of ${transItem}${dot}`;
    if (language === 'fr') return `${transItem} au choix${dot}`;
    if (language === 'es') return `${transItem} a elegir${dot}`;
    if (language === 'de') return `${transItem} nach Wahl${dot}`;
  }

  // 6e. "Servito con {X}"
  const servitoConMatch = trimmed.match(/^servito\s+con\s+(.+?)(\.?)$/i);
  if (servitoConMatch) {
    const item = servitoConMatch[1].trim();
    const dot = servitoConMatch[2] || '';
    const transItem = translateCustomerMenuText(item, language);
    if (language === 'en') return `Served with ${transItem}${dot}`;
    if (language === 'fr') return `Servi avec ${transItem}${dot}`;
    if (language === 'es') return `Servido con ${transItem}${dot}`;
    if (language === 'de') return `Serviert mit ${transItem}${dot}`;
  }

  // 6f. "Accompagnato da {X}"
  const accompagnatoMatch = trimmed.match(/^accompagnato\s+da\s+(.+?)(\.?)$/i);
  if (accompagnatoMatch) {
    const item = accompagnatoMatch[1].trim();
    const dot = accompagnatoMatch[2] || '';
    const transItem = translateCustomerMenuText(item, language);
    if (language === 'en') return `Accompanied by ${transItem}${dot}`;
    if (language === 'fr') return `Accompagné de ${transItem}${dot}`;
    if (language === 'es') return `Acompañado de ${transItem}${dot}`;
    if (language === 'de') return `Serviert mit ${transItem}${dot}`;
  }

  // 6g. Nomi composti con suffisso "Panino" (es. "Patatine Panino", "Panelle Panino", "Wurstel Panino")
  const suffixPaninoMatch = trimmed.match(/^(.+?)\s+panino$/i);
  if (suffixPaninoMatch) {
    const mainIngredient = suffixPaninoMatch[1].trim();
    const transIngr = translateCustomerMenuText(mainIngredient, language);
    if (language === 'en') return `${transIngr} Sandwich`;
    if (language === 'fr') return `Sandwich ${transIngr}`;
    if (language === 'es') return `Bocadillo de ${transIngr}`;
    if (language === 'de') return `${transIngr}-Sandwich`;
  }

  // 6h. Nomi composti con prefisso "Panino" (es. "Panino Patatine", "Panino Panelle")
  const prefixPaninoMatch = trimmed.match(/^panino\s+(.+)$/i);
  if (prefixPaninoMatch) {
    const mainIngredient = prefixPaninoMatch[1].trim();
    const transIngr = translateCustomerMenuText(mainIngredient, language);
    if (language === 'en') return `${transIngr} Sandwich`;
    if (language === 'fr') return `Sandwich ${transIngr}`;
    if (language === 'es') return `Bocadillo de ${transIngr}`;
    if (language === 'de') return `${transIngr}-Sandwich`;
  }

  // 6i. Nomi composti con "Burger" (es. "Pollo Burger" -> "Chicken Burger")
  const burgerCompoundMatch = trimmed.match(/^(.+?)\s+burger$/i);
  if (burgerCompoundMatch) {
    const mainIngredient = burgerCompoundMatch[1].trim();
    const transIngr = translateCustomerMenuText(mainIngredient, language);
    return `${transIngr} Burger`;
  }

  // 6j. Nomi composti con "Pizza" (es. "Funghi Pizza" -> "Mushroom Pizza")
  const pizzaCompoundMatch = trimmed.match(/^(.+?)\s+pizza$/i);
  if (pizzaCompoundMatch) {
    const mainIngredient = pizzaCompoundMatch[1].trim();
    const transIngr = translateCustomerMenuText(mainIngredient, language);
    return `${transIngr} Pizza`;
  }

  // 6k. Congiunzioni binarie (es. "Lattuga e Pomodoro" -> "Lettuce and Tomato")
  const andMatch = trimmed.match(/^(.+?)\s+(?:e|ed)\s+(.+)$/i);
  if (andMatch) {
    const left = andMatch[1].trim();
    const right = andMatch[2].trim();
    const transLeft = translateCustomerMenuText(left, language);
    const transRight = translateCustomerMenuText(right, language);
    if (transLeft !== left || transRight !== right) {
      if (language === 'en') return `${transLeft} and ${transRight}`;
      if (language === 'fr') return `${transLeft} et ${transRight}`;
      if (language === 'es') return `${transLeft} y ${transRight}`;
      if (language === 'de') return `${transLeft} und ${transRight}`;
    }
  }

  return source;
}

export function hasOfflineMenuTranslation(source: string | undefined | null, language: SupportedLanguage): boolean {
  if (!source) return false;
  if (language === 'it') return true;
  const translated = translateCustomerMenuText(source, language);
  return translated !== source;
}

/**
 * Decodifica entità HTML comuni e ripulisce il testo tradotto ricevuto da API esterne
 */
export function cleanTranslatedText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cerca la traduzione online su MyMemory API pubblica (senza autenticazione/chiavi richieste).
 * In caso di assenza di rete, errore o timeout, restituisce null consentendo il fallback offline istantaneo.
 */
export async function fetchOnlineTranslation(
  term: string,
  targetLang: SupportedLanguage,
  sourceLang: string = 'it'
): Promise<string | null> {
  if (!term || targetLang === 'it') return term || null;
  const cleanTerm = term.trim();
  if (!cleanTerm) return null;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanTerm)}&langpair=${sourceLang}|${targetLang}`;
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

    const res = await fetch(url, {
      signal: controller ? controller.signal : undefined,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (timeoutId) clearTimeout(timeoutId);
    if (!res.ok) return null;

    const data = await res.json();
    const rawResult = data?.responseData?.translatedText;
    if (typeof rawResult === 'string' && rawResult.length > 0) {
      // Ignora messaggi di warning o rate limit
      if (rawResult.toUpperCase().includes('MYMEMORY WARNING') || rawResult.toUpperCase().includes('QUERY LENGTH LIMIT')) {
        return null;
      }
      const cleaned = cleanTranslatedText(rawResult);
      return cleaned || null;
    }
  } catch {
    // Dispositivo offline o rete lenta: fallback offline
  }
  return null;
}

/**
 * Risolve un termine per tutte le 5 lingue (IT, EN, FR, ES, DE) combinando:
 * 1. Glossario locale / Dizionario gastronomico integrato
 * 2. Lookup online unauthenticated (se connesso a Internet e termine mancante)
 * 3. Fallback euristico offline
 */
export async function fetchFullGlossaryTermOnline(
  term: string,
  existingTranslations?: Partial<Record<SupportedLanguage, string>>
): Promise<Record<SupportedLanguage, string>> {
  const result: Record<SupportedLanguage, string> = {
    it: term,
    en: existingTranslations?.en || translateCustomerMenuText(term, 'en'),
    fr: existingTranslations?.fr || translateCustomerMenuText(term, 'fr'),
    es: existingTranslations?.es || translateCustomerMenuText(term, 'es'),
    de: existingTranslations?.de || translateCustomerMenuText(term, 'de'),
  };

  const targetLangs: SupportedLanguage[] = ['en', 'fr', 'es', 'de'];
  for (const lang of targetLangs) {
    // Se non avevamo una traduzione gastronomica dedicata o la traduzione è identica al termine sorgente
    const currentVal = result[lang];
    const isUntranslated = !currentVal || currentVal === term;
    if (isUntranslated) {
      try {
        const onlineVal = await fetchOnlineTranslation(term, lang, 'it');
        if (onlineVal && onlineVal.trim().length > 0) {
          result[lang] = onlineVal.trim();
        }
      } catch {
        // Nessun blocco se la richiesta fallisce
      }
    }
  }

  return result;
}
