import { useEffect, useState } from 'react';
import { SupportedLanguage } from './i18n';
import { api } from '../api/client';

export type TranslationGlossary = Record<string, Record<string, string>>;

let persistedGlossary: TranslationGlossary = {};

export async function refreshCustomerMenuGlossary(): Promise<void> {
  try {
    persistedGlossary = await api.getTranslationGlossary();
  } catch {
    // Keep in-memory or fallback
  }
}

/** Makes customer pages reactive when the local offline glossary is updated from remote admin. */
export function useCustomerMenuGlossary(): void {
  const [, setVersion] = useState(0);
  useEffect(() => {
    refreshCustomerMenuGlossary().then(() => setVersion((v) => v + 1)).catch(() => {});
  }, []);
}

/**
 * Offline glossary dictionary for client-facing menu copy.
 * Translates categories, product titles, descriptions, base ingredients,
 * extra modifiers, combo group names, options, and sauces.
 */
export const CUSTOMER_MENU_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  // Categorie
  "Panini": { "it": "Panini", "en": "Panini & Sandwiches", "fr": "Paninis & Sandwichs", "es": "Paninis y Bocadillos", "de": "Panini & Sandwiches" },
  "Hamburger": { "it": "Hamburger", "en": "Burgers", "fr": "Burgers", "es": "Hamburguesas", "de": "Burger" },
  "Fritti": { "it": "Fritti", "en": "Fried Sides", "fr": "Fritures", "es": "Fritos y Entrantes", "de": "Frittiertes & Beilagen" },
  "Pizze": { "it": "Pizze", "en": "Pizzas", "fr": "Pizzas", "es": "Pizzas", "de": "Pizzen" },
  "Insalate": { "it": "Insalate", "en": "Salads", "fr": "Salades", "es": "Ensaladas", "de": "Salate" },
  "Combo": { "it": "Combo", "en": "Combo Meals", "fr": "Menus Combo", "es": "Menús Combo", "de": "Kombi-Menüs" },
  "Bevande": { "it": "Bevande", "en": "Beverages & Drinks", "fr": "Boissons", "es": "Bebidas", "de": "Getränke" },
  "Dolci": { "it": "Dolci", "en": "Desserts & Sweets", "fr": "Desserts & Douceurs", "es": "Postres y Dulces", "de": "Desserts & Süßspeisen" },
  "Contorni": { "it": "Contorni", "en": "Side Dishes", "fr": "Accompagnements", "es": "Guarniciones", "de": "Beilagen" },
  "Piadine": { "it": "Piadine", "en": "Piadina Wraps", "fr": "Piadinas", "es": "Piadinas", "de": "Piadinas" },
  "Kebab": { "it": "Kebab", "en": "Kebab", "fr": "Kebab", "es": "Kebab", "de": "Kebab" },

  // Descrizioni categorie e promo
  "I nostri panini gourmet": { "it": "I nostri panini gourmet", "en": "Our gourmet sandwiches", "fr": "Nos sandwichs gourmets", "es": "Nuestros bocadillos gourmet", "de": "Unsere Gourmet-Sandwiches" },
  "Pizze fresche e croccanti": { "it": "Pizze fresche e croccanti", "en": "Fresh, crispy pizzas", "fr": "Pizzas fraîches et croustillantes", "es": "Pizzas frescas y crujientes", "de": "Frische, knusprige Pizzen" },
  "Insalate fresche e salutari": { "it": "Insalate fresche e salutari", "en": "Fresh, healthy salads", "fr": "Salades fraîches et saines", "es": "Ensaladas frescas y saludables", "de": "Frische, gesunde Salate" },
  "I nostri menù combo": { "it": "I nostri menù combo", "en": "Our combo menus", "fr": "Nos menus combo", "es": "Nuestros menús combo", "de": "Unsere Kombi-Menüs" },
  "Bevande fresche": { "it": "Bevande fresche", "en": "Refreshing drinks", "fr": "Boissons fraîches", "es": "Bebidas refrescantes", "de": "Erfrischende Getränke" },
  "Dolci e dessert": { "it": "Dolci e dessert", "en": "Sweets and desserts", "fr": "Douceurs et desserts", "es": "Dulces y postres", "de": "Süßspeisen und Desserts" },

  // Prodotti e descrizioni
  "Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa": { "it": "Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa", "en": "180g beef on a brioche bun with lettuce, tomato and sauce", "fr": "Bœuf de 180 g sur pain brioché avec laitue, tomate et sauce", "es": "Carne de vacuno de 180 g en pan brioche con lechuga, tomate y salsa", "de": "180 g Rindfleisch auf Briochebrötchen mit Salat, Tomate und Sauce" },
  "Hamburger con doppio cheddar e salsa speciale": { "it": "Hamburger con doppio cheddar e salsa speciale", "en": "Burger with double cheddar and special sauce", "fr": "Burger avec double cheddar et sauce spéciale", "es": "Hamburguesa con doble cheddar y salsa especial", "de": "Burger mit doppeltem Cheddar und Spezialsauce" },
  "Pomodoro, mozzarella di bufala, basilico fresco": { "it": "Pomodoro, mozzarella di bufala, basilico fresco", "en": "Tomato, buffalo mozzarella and fresh basil", "fr": "Tomate, mozzarella de bufflonne et basilic frais", "es": "Tomate, mozzarella de búfala y albahaca fresca", "de": "Tomate, Büffelmozzarella und frisches Basilikum" },
  "Pomodoro, mozzarella, salame piccante": { "it": "Pomodoro, mozzarella, salame piccante", "en": "Tomato, mozzarella and spicy salami", "fr": "Tomate, mozzarella et salami piquant", "es": "Tomate, mozzarella y salami picante", "de": "Tomate, Mozzarella und scharfe Salami" },
  "Lattuga romana, pollo grigliato, parmigiano e crostini": { "it": "Lattuga romana, pollo grigliato, parmigiano e crostini", "en": "Romaine lettuce, grilled chicken, Parmesan and croutons", "fr": "Laitue romaine, poulet grillé, parmesan et croûtons", "es": "Lechuga romana, pollo a la parrilla, parmesano y picatostes", "de": "Römersalat, gegrilltes Hähnchen, Parmesan und Croutons" },
  "Tiramisù classico fatto in casa": { "it": "Tiramisù classico fatto in casa", "en": "Classic homemade tiramisù", "fr": "Tiramisù classique fait maison", "es": "Tiramisú clásico casero", "de": "Klassisches hausgemachtes Tiramisù" },
  "Acqua": { "it": "Acqua", "en": "Water", "fr": "Eau", "es": "Agua", "de": "Wasser" },

  // Ingredienti base e carne
  "Carne di manzo": { "it": "Carne di manzo", "en": "Beef Patty", "fr": "Steak de Bœuf", "es": "Carne de Vacuno", "de": "Rindfleisch" },
  "Pollo": { "it": "Pollo", "en": "Chicken", "fr": "Poulet", "es": "Pollo", "de": "Hähnchen" },
  "Pollo fritto": { "it": "Pollo fritto", "en": "Fried Chicken", "fr": "Poulet Frit", "es": "Pollo Frito", "de": "Knuspriges Hähnchen" },
  "Pollo grigliato": { "it": "Pollo grigliato", "en": "Grilled Chicken", "fr": "Poulet Grillé", "es": "Pollo a la Parrilla", "de": "Gegrilltes Hähnchen" },
  "Salsiccia": { "it": "Salsiccia", "en": "Italian Sausage", "fr": "Saucisse", "es": "Salchicha", "de": "Wurst" },
  "Wurstel": { "it": "Wurstel", "en": "Frankfurter / Hot Dog", "fr": "Saucisse", "es": "Salchicha Frankfurt", "de": "Würstchen" },
  "Porchetta": { "it": "Porchetta", "en": "Roast Pork Porchetta", "fr": "Porc Rôti (Porchetta)", "es": "Porchetta Asada", "de": "Spanferkel (Porchetta)" },
  "Bacon": { "it": "Bacon", "en": "Crispy Bacon", "fr": "Bacon Grillé", "es": "Bacon Crujiente", "de": "Knuspriger Bacon" },
  "Pancetta": { "it": "Pancetta", "en": "Pancetta", "fr": "Pancetta", "es": "Panceta", "de": "Bauchspeck" },
  "Prosciutto crudo": { "it": "Prosciutto crudo", "en": "Parma / Cured Ham", "fr": "Jambon Cru", "es": "Jamón Serrano / Curado", "de": "Parmaschinken" },
  "Prosciutto cotto": { "it": "Prosciutto cotto", "en": "Cooked Ham", "fr": "Jambon Blanc", "es": "Jamón Cocido", "de": "Kochschinken" },
  "Salame piccante": { "it": "Salame piccante", "en": "Spicy Salami / Pepperoni", "fr": "Salami Piquant", "es": "Salami Picante", "de": "Scharfe Salami" },
  "Uovo": { "it": "Uovo", "en": "Egg", "fr": "Œuf", "es": "Huevo", "de": "Ei" },
  "Uovo fritto": { "it": "Uovo fritto", "en": "Fried Egg", "fr": "Œuf au Plat", "es": "Huevo Frito", "de": "Spiegelei" },
  "Tonno": { "it": "Tonno", "en": "Tuna", "fr": "Thon", "es": "Atún", "de": "Thunfisch" },
  "Salmone": { "it": "Salmone", "en": "Salmon", "fr": "Saumon", "es": "Salmón", "de": "Lachs" },

  // Formaggi
  "Formaggio": { "it": "Formaggio", "en": "Cheese", "fr": "Fromage", "es": "Queso", "de": "Käse" },
  "Cheddar": { "it": "Cheddar", "en": "Cheddar Cheese", "fr": "Cheddar", "es": "Queso Cheddar", "de": "Cheddar" },
  "Mozzarella": { "it": "Mozzarella", "en": "Mozzarella", "fr": "Mozzarella", "es": "Mozzarella", "de": "Mozzarella" },
  "Mozzarella di bufala": { "it": "Mozzarella di bufala", "en": "Buffalo Mozzarella", "fr": "Mozzarella de Bufflonne", "es": "Mozzarella de Búfala", "de": "Büffelmozzarella" },
  "Gorgonzola": { "it": "Gorgonzola", "en": "Gorgonzola", "fr": "Gorgonzola", "es": "Gorgonzola", "de": "Gorgonzola" },
  "Scamorza": { "it": "Scamorza", "en": "Smoked Scamorza", "fr": "Scamorza", "es": "Scamorza Ahumada", "de": "Scamorza" },
  "Provola": { "it": "Provola", "en": "Provolone Cheese", "fr": "Provolone", "es": "Queso Provolone", "de": "Provolone" },
  "Parmigiano": { "it": "Parmigiano", "en": "Parmesan", "fr": "Parmesan", "es": "Parmesano", "de": "Parmesan" },
  "Grana Padano": { "it": "Grana Padano", "en": "Grana Padano", "fr": "Grana Padano", "es": "Grana Padano", "de": "Grana Padano" },
  "Pecorino": { "it": "Pecorino", "en": "Pecorino Cheese", "fr": "Pecorino", "es": "Queso Pecorino", "de": "Pecorino" },
  "Brie": { "it": "Brie", "en": "Brie", "fr": "Brie", "es": "Brie", "de": "Brie" },
  "Edamer": { "it": "Edamer", "en": "Edam", "fr": "Edam", "es": "Edam", "de": "Edamer" },

  // Verdure
  "Lattuga": { "it": "Lattuga", "en": "Lettuce", "fr": "Laitue", "es": "Lechuga", "de": "Salat" },
  "Lattuga romana": { "it": "Lattuga romana", "en": "Romaine Lettuce", "fr": "Laitue Romaine", "es": "Lechuga Romana", "de": "Römersalat" },
  "Rucola": { "it": "Rucola", "en": "Arugula / Rocket", "fr": "Roquette", "es": "Rúcula", "de": "Rucola" },
  "Pomodoro": { "it": "Pomodoro", "en": "Tomato", "fr": "Tomate", "es": "Tomate", "de": "Tomaten" },
  "Pomodorini": { "it": "Pomodorini", "en": "Cherry Tomatoes", "fr": "Tomates Cerises", "es": "Tomates Cherry", "de": "Kirschtomaten" },
  "Cipolla": { "it": "Cipolla", "en": "Onion", "fr": "Oignon", "es": "Cebolla", "de": "Zwiebel" },
  "Cipolla rossa": { "it": "Cipolla rossa", "en": "Red Onion", "fr": "Oignon Rouge", "es": "Cebolla Roja", "de": "Rote Zwiebel" },
  "Cipolla caramellata": { "it": "Cipolla caramellata", "en": "Caramelized Onion", "fr": "Oignon Caramélisé", "es": "Cebolla Caramelizada", "de": "Karamellisierte Zwiebel" },
  "Cipolla croccante": { "it": "Cipolla croccante", "en": "Crispy Fried Onion", "fr": "Oignon Croustillant", "es": "Cebolla Crujiente", "de": "Röstzwiebeln" },
  "Zucchine": { "it": "Zucchine", "en": "Zucchini / Courgettes", "fr": "Courgettes", "es": "Calabacín", "de": "Zucchini" },
  "Melanzane": { "it": "Melanzane", "en": "Eggplants / Aubergines", "fr": "Aubergines", "es": "Berenjenas", "de": "Auberginen" },
  "Peperoni": { "it": "Peperoni", "en": "Bell Peppers", "fr": "Poivrons", "es": "Pimientos", "de": "Paprika" },
  "Verdure grigliate": { "it": "Verdure grigliate", "en": "Grilled Vegetables", "fr": "Légumes Grillés", "es": "Verduras a la Parrilla", "de": "Gegrilltes Gemüse" },
  "Funghi": { "it": "Funghi", "en": "Mushrooms", "fr": "Champignons", "es": "Champiñones", "de": "Pilze" },
  "Olive": { "it": "Olive", "en": "Olives", "fr": "Olives", "es": "Aceitunas", "de": "Oliven" },
  "Cetriolini": { "it": "Cetriolini", "en": "Pickles", "fr": "Cornichons", "es": "Pepinillos", "de": "Gewürzgurken" },
  "Jalapeño": { "it": "Jalapeño", "en": "Jalapeño", "fr": "Jalapeño", "es": "Jalapeño", "de": "Jalapeño" },
  "Friarielli": { "it": "Friarielli", "en": "Neapolitan Broccoli Rabe", "fr": "Brocolis-Raves", "es": "Grelos / Friarielli", "de": "Stängelkohl (Friarielli)" },
  "Basilico": { "it": "Basilico", "en": "Fresh Basil", "fr": "Basilic Frais", "es": "Albahaca Fresca", "de": "Frisches Basilikum" },

  // Salse e creme
  "Salsa": { "it": "Salsa", "en": "Sauce", "fr": "Sauce", "es": "Salsa", "de": "Sauce" },
  "Salsa speciale": { "it": "Salsa speciale", "en": "House Special Sauce", "fr": "Sauce Spéciale Maison", "es": "Salsa Especial de la Casa", "de": "Haus-Spezialsoße" },
  "Maionese": { "it": "Maionese", "en": "Mayonnaise", "fr": "Mayonnaise", "es": "Mayonesa", "de": "Mayonnaise" },
  "Ketchup": { "it": "Ketchup", "en": "Ketchup", "fr": "Ketchup", "es": "Kétchup", "de": "Ketchup" },
  "Senape": { "it": "Senape", "en": "Mustard", "fr": "Moutarde", "es": "Mostaza", "de": "Senf" },
  "Salsa BBQ": { "it": "Salsa BBQ", "en": "BBQ Sauce", "fr": "Sauce Barbecue", "es": "Salsa Barbacoa", "de": "BBQ-Sauce" },
  "Salsa Burger": { "it": "Salsa Burger", "en": "Burger Sauce", "fr": "Sauce Burger", "es": "Salsa Burger", "de": "Burger-Sauce" },
  "Salsa rosa": { "it": "Salsa rosa", "en": "Cocktail Pink Sauce", "fr": "Sauce Cocktail", "es": "Salsa Rosa Cocktail", "de": "Cocktailsauce" },
  "Salsa tartara": { "it": "Salsa tartara", "en": "Tartar Sauce", "fr": "Sauce Tartare", "es": "Salsa Tártara", "de": "Remouladensauce" },
  "Salsa yogurt": { "it": "Salsa yogurt", "en": "Yogurt Sauce", "fr": "Sauce au Yaourt", "es": "Salsa de Yogur", "de": "Joghurt-Dressing" },
  "Tabasco": { "it": "Tabasco", "en": "Tabasco", "fr": "Tabasco", "es": "Tabasco", "de": "Tabasco" },
  "Crema di pistacchio": { "it": "Crema di pistacchio", "en": "Pistachio Cream", "fr": "Crème de Pistache", "es": "Crema de Pistacho", "de": "Pistaziencreme" },
  "Crema al tartufo": { "it": "Crema al tartufo", "en": "Truffle Cream", "fr": "Crème de Truffe", "es": "Crema de Trufa", "de": "Trüffelcreme" },
  "Pesto": { "it": "Pesto", "en": "Basil Pesto", "fr": "Pesto au Basilic", "es": "Pesto de Albahaca", "de": "Basilikumpesto" },
  "Guacamole": { "it": "Guacamole", "en": "Fresh Guacamole", "fr": "Guacamole Frais", "es": "Guacamole Fresco", "de": "Frische Guacamole" },
  "Salsa piccante": { "it": "Salsa piccante", "en": "Hot Chili Sauce", "fr": "Sauce Pimentée", "es": "Salsa Picante", "de": "Scharfe Chilisauce" },

  // Pane e impasti
  "Pane brioche": { "it": "Pane brioche", "en": "Brioche Bun", "fr": "Pain Brioché", "es": "Pan Brioche", "de": "Briochebrötchen" },
  "Pane sesamo": { "it": "Pane sesamo", "en": "Sesame Seed Bun", "fr": "Pain au Sésame", "es": "Pan de Sésamo", "de": "Sesambrötchen" },
  "Pane integrale": { "it": "Pane integrale", "en": "Whole Wheat Bun", "fr": "Pain Complet", "es": "Pan Integral", "de": "Vollkornbrötchen" },
  "Pane senza glutine": { "it": "Pane senza glutine", "en": "Gluten-Free Bun", "fr": "Pain Sans Gluten", "es": "Pan Sin Gluten", "de": "Glutenfreies Brötchen" },
  "Pane casereccio": { "it": "Pane casereccio", "en": "Rustic Bread", "fr": "Pain de Campagne", "es": "Pan Rústico", "de": "Bauernbrot" },
  "Focaccia": { "it": "Focaccia", "en": "Focaccia", "fr": "Focaccia", "es": "Focaccia", "de": "Focaccia" },
  "Piadina": { "it": "Piadina", "en": "Piadina Wrap", "fr": "Piadina", "es": "Piadina", "de": "Piadina" },
  "Impasto classico": { "it": "Impasto classico", "en": "Classic Dough", "fr": "Pâte Classique", "es": "Masa Clásica", "de": "Klassischer Teig" },
  "Impasto napoletano": { "it": "Impasto napoletano", "en": "Neapolitan Dough", "fr": "Pâte Napolitaine", "es": "Masa Napolitana", "de": "Neapolitanischer Teig" },
  "Bordo Ripieno": { "it": "Bordo Ripieno", "en": "Stuffed Crust", "fr": "Croûte Fourrée", "es": "Borde Relleno", "de": "Gefüllter Rand" },

  // Fritti e contorni
  "Patatine fritte": { "it": "Patatine fritte", "en": "French Fries", "fr": "Frites Croustillantes", "es": "Patatas Fritas", "de": "Pommes Frites" },
  "Patatine dipper": { "it": "Patatine dipper", "en": "Dipper Fries", "fr": "Frites Dipper", "es": "Patatas Dipper", "de": "Dipper-Pommes" },
  "Patate al forno": { "it": "Patate al forno", "en": "Roasted Potatoes", "fr": "Pommes de Terre Rôties", "es": "Patatas Asadas", "de": "Bratkartoffeln" },
  "Crocchette di pollo": { "it": "Crocchette di pollo", "en": "Chicken Nuggets", "fr": "Nuggets de Poulet", "es": "Nuggets de Pollo", "de": "Chicken Nuggets" },
  "Alette di pollo": { "it": "Alette di pollo", "en": "Crispy Chicken Wings", "fr": "Ailes de Poulet", "es": "Alitas de Pollo", "de": "Chicken Wings" },
  "Anelli di cipolla": { "it": "Anelli di cipolla", "en": "Crispy Onion Rings", "fr": "Rondelles d'Oignon", "es": "Aros de Cebolla", "de": "Zwiebelringe" },
  "Mozzarelline fritte": { "it": "Mozzarelline fritte", "en": "Fried Mozzarella Sticks", "fr": "Bâtonnets de Mozzarella Frits", "es": "Palitos de Mozzarella Fritos", "de": "Mozzarella-Sticks" },
  "Olive ascolane": { "it": "Olive ascolane", "en": "Stuffed Fried Olives", "fr": "Olives Farcies Frites", "es": "Aceitunas Rellenas Fritas", "de": "Gefüllte Frittierte Oliven" },
  "Jalapeños ripieni": { "it": "Jalapeños ripieni", "en": "Stuffed Jalapeños", "fr": "Jalapeños Farcis", "es": "Jalapeños Rellenos", "de": "Gefüllte Jalapeños" },
  "Crostini": { "it": "Crostini", "en": "Crunchy Croutons", "fr": "Croûtons", "es": "Picatostes", "de": "Croutons" },
  "Panelle": { "it": "Panelle", "en": "Sicilian Chickpea Fritters", "fr": "Beignets de Pois Chiches", "es": "Buñuelos de Garbanzos", "de": "Kichererbsen-Fritter" },
  "Arancini": { "it": "Arancini", "en": "Sicilian Rice Balls", "fr": "Arancini Siciliens", "es": "Arancini Siciliani", "de": "Sizilianische Reisbällchen" },

  // Nomi classici dei piatti
  "Hamburger Classico": { "it": "Hamburger Classico", "en": "Classic Hamburger", "fr": "Hamburger Classique", "es": "Hamburguesa Clásica", "de": "Klassischer Hamburger" },
  "Cheeseburger": { "it": "Cheeseburger", "en": "Cheeseburger", "fr": "Cheeseburger", "es": "Cheeseburger", "de": "Cheeseburger" },
  "Cheeseburger Deluxe": { "it": "Cheeseburger Deluxe", "en": "Cheeseburger Deluxe", "fr": "Cheeseburger Deluxe", "es": "Cheeseburger Deluxe", "de": "Cheeseburger Deluxe" },
  "Bacon Burger": { "it": "Bacon Burger", "en": "Bacon Burger", "fr": "Bacon Burger", "es": "Bacon Burger", "de": "Bacon Burger" },
  "Chicken Burger": { "it": "Chicken Burger", "en": "Chicken Burger", "fr": "Burger au Poulet", "es": "Hamburguesa de Pollo", "de": "Chicken Burger" },
  "Veggie Burger": { "it": "Veggie Burger", "en": "Veggie Burger", "fr": "Burger Végétarien", "es": "Hamburguesa Vegetal", "de": "Veggie Burger" },
  "Margherita": { "it": "Margherita", "en": "Margherita Pizza", "fr": "Pizza Margherita", "es": "Pizza Margherita", "de": "Pizza Margherita" },
  "Diavola": { "it": "Diavola", "en": "Spicy Diavola Pizza", "fr": "Pizza Diavola Piquante", "es": "Pizza Diavola Picante", "de": "Pizza Diavola" },
  "Capricciosa": { "it": "Capricciosa", "en": "Capricciosa Pizza", "fr": "Pizza Capricciosa", "es": "Pizza Capricciosa", "de": "Pizza Capricciosa" },
  "Quattro Formaggi": { "it": "Quattro Formaggi", "en": "Four Cheese Pizza", "fr": "Pizza Quatre Fromages", "es": "Pizza Cuatro Quesos", "de": "Vier-Käse-Pizza" },
  "Caesar Salad": { "it": "Caesar Salad", "en": "Caesar Salad", "fr": "Salade César", "es": "Ensalada César", "de": "Caesar Salad" },

  // Aggiunte extra e modifiche
  "Extra Formaggio": { "it": "Extra Formaggio", "en": "Extra Cheese", "fr": "Supplément Fromage", "es": "Queso Extra", "de": "Extra Käse" },
  "Extra Bacon": { "it": "Extra Bacon", "en": "Extra Bacon", "fr": "Supplément Bacon", "es": "Bacon Extra", "de": "Extra Bacon" },
  "Extra Mozzarella": { "it": "Extra Mozzarella", "en": "Extra Mozzarella", "fr": "Supplément Mozzarella", "es": "Mozzarella Extra", "de": "Extra Mozzarella" },
  "Extra Pollo": { "it": "Extra Pollo", "en": "Extra Chicken", "fr": "Supplément Poulet", "es": "Pollo Extra", "de": "Extra Hähnchen" },
  "Extra Carne": { "it": "Extra Carne", "en": "Extra Meat", "fr": "Supplément Viande", "es": "Carne Extra", "de": "Extra Fleisch" },
  "Extra Salsa": { "it": "Extra Salsa", "en": "Extra Sauce", "fr": "Supplément Sauce", "es": "Salsa Extra", "de": "Extra Sauce" },
  "Senza Cipolla": { "it": "Senza Cipolla", "en": "No Onion", "fr": "Sans Oignon", "es": "Sin Cebolla", "de": "Ohne Zwiebel" },
  "Senza Pomodoro": { "it": "Senza Pomodoro", "en": "No Tomato", "fr": "Sans Tomate", "es": "Sin Tomate", "de": "Ohne Tomate" },
  "Senza Salsa": { "it": "Senza Salsa", "en": "No Sauce", "fr": "Sans Sauce", "es": "Sin Salsa", "de": "Ohne Sauce" },
  "Ben Cotto": { "it": "Ben Cotto", "en": "Well Done", "fr": "Bien Cuit", "es": "Muy Hecho", "de": "Gut Durchgebraten" },
  "Al Sangue": { "it": "Al Sangue", "en": "Rare", "fr": "Saignant", "es": "Poco Hecho", "de": "Blutig / Medium Rare" },

  // Bevande e Dolci
  "Acqua Naturale": { "it": "Acqua Naturale", "en": "Still Mineral Water", "fr": "Eau Plate", "es": "Agua Mineral Natural", "de": "Stilles Mineralwasser" },
  "Acqua Frizzante": { "it": "Acqua Frizzante", "en": "Sparkling Mineral Water", "fr": "Eau Gazeuse", "es": "Agua Con Gas", "de": "Sprudelwasser" },
  "Coca Cola": { "it": "Coca Cola", "en": "Coca Cola", "fr": "Coca Cola", "es": "Coca Cola", "de": "Coca Cola" },
  "Coca Cola Zero": { "it": "Coca Cola Zero", "en": "Coca Cola Zero", "fr": "Coca Cola Zéro", "es": "Coca Cola Zero", "de": "Coca Cola Zero" },
  "Fanta": { "it": "Fanta", "en": "Fanta Orange", "fr": "Fanta Orange", "es": "Fanta Naranja", "de": "Fanta Orange" },
  "Sprite": { "it": "Sprite", "en": "Sprite", "fr": "Sprite", "es": "Sprite", "de": "Sprite" },
  "Tè alla Pesca": { "it": "Tè alla Pesca", "en": "Peach Iced Tea", "fr": "Thé Glacé Pêche", "es": "Té Helado al Melocotón", "de": "Pfirsich-Eistee" },
  "Tè al Limone": { "it": "Tè al Limone", "en": "Lemon Iced Tea", "fr": "Thé Glacé Citron", "es": "Té Helado al Limón", "de": "Zitronen-Eistee" },
  "Birra": { "it": "Birra", "en": "Beer", "fr": "Bière", "es": "Cerveza", "de": "Bier" },
  "Birra alla spina": { "it": "Birra alla spina", "en": "Draft Beer", "fr": "Bière Pression", "es": "Cerveza de Barril", "de": "Fassbier" },
  "Tiramisù": { "it": "Tiramisù", "en": "Homemade Tiramisù", "fr": "Tiramisù Maison", "es": "Tiramisú Casero", "de": "Hausgemachtes Tiramisù" },
  "Cheesecake": { "it": "Cheesecake", "en": "Cheesecake", "fr": "Cheesecake", "es": "Tarta de Queso", "de": "Käsekuchen" },
  "Panna Cotta": { "it": "Panna Cotta", "en": "Panna Cotta", "fr": "Panna Cotta", "es": "Panna Cotta", "de": "Panna Cotta" },
  "Muffin": { "it": "Muffin", "en": "Chocolate Muffin", "fr": "Muffin au Chocolat", "es": "Muffin de Chocolate", "de": "Schoko-Muffin" },
  "Brownie": { "it": "Brownie", "en": "Chocolate Brownie", "fr": "Brownie au Chocolat", "es": "Brownie con Chocolate", "de": "Schoko-Brownie" },
  "Gelato": { "it": "Gelato", "en": "Artisan Ice Cream", "fr": "Glace Artisanale", "es": "Helado Artesano", "de": "Handwerkliches Eis" },

  // Formati e Gruppi Combo
  "500ml": { "it": "500ml", "en": "500ml", "fr": "500ml", "es": "500ml", "de": "500ml" },
  "330ml in lattina": { "it": "330ml in lattina", "en": "330ml Can", "fr": "Canette 330ml", "es": "Lata 330ml", "de": "330ml Dose" },
  "Scegli il Burger": { "it": "Scegli il Burger", "en": "Choose Your Burger", "fr": "Choisissez Votre Burger", "es": "Elige Tu Hamburguesa", "de": "Wähle Deinen Burger" },
  "Scegli la Bevanda": { "it": "Scegli la Bevanda", "en": "Choose Your Drink", "fr": "Choisissez Votre Boisson", "es": "Elige Tu Bebida", "de": "Wähle Dein Getränk" },
  "Scegli il Contorno": { "it": "Scegli il Contorno", "en": "Choose Your Side", "fr": "Choisissez Votre Accompagnement", "es": "Elige Tu Guarnición", "de": "Wähle Deine Beilage" },
  "Hamburger + patatine + bevanda": { "it": "Hamburger + patatine + bevanda", "en": "Burger + Fries + Drink", "fr": "Burger + Frites + Boisson", "es": "Hamburguesa + Patatas + Bebida", "de": "Burger + Pommes + Getränk" }
};

export type MenuLocalizedValue = Partial<Record<SupportedLanguage, string>>;

/**
 * Translates a menu label (dish, ingredient, category, extra, combo option).
 * Returns the translated label in the requested language, or the original source string if not matched.
 */
export function translateCustomerMenuText(
  source: string | undefined | null,
  language: SupportedLanguage,
  localized?: MenuLocalizedValue
): string {
  if (!source) return '';
  if (language === 'it') return source;
  if (localized?.[language]) return localized[language] as string;
  const trimmed = source.trim();
  return (
    persistedGlossary[source]?.[language] ||
    persistedGlossary[trimmed]?.[language] ||
    CUSTOMER_MENU_TRANSLATIONS[source]?.[language] ||
    CUSTOMER_MENU_TRANSLATIONS[trimmed]?.[language] ||
    source
  );
}

export function hasOfflineMenuTranslation(source: string | undefined | null, language: SupportedLanguage): boolean {
  if (!source) return false;
  if (language === 'it') return true;
  const trimmed = source.trim();
  return Boolean(
    persistedGlossary[source]?.[language] ||
    persistedGlossary[trimmed]?.[language] ||
    CUSTOMER_MENU_TRANSLATIONS[source]?.[language] ||
    CUSTOMER_MENU_TRANSLATIONS[trimmed]?.[language]
  );
}
