import { useEffect, useState } from 'react';
import { SupportedLanguage } from '@/src/utils/i18n';
import { getTranslationGlossary, subscribeToDbChanges, TranslationGlossary } from '@/src/api/api';

let persistedGlossary: TranslationGlossary = {};

export async function refreshCustomerMenuGlossary(): Promise<void> {
  persistedGlossary = await getTranslationGlossary();
}

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
 * Offline cache for client-facing menu copy. The source catalog and order payload
 * remain canonical; this module translates only what a customer sees during an order.
 */
const CUSTOMER_MENU_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {
  // Categorie
  "Panini":{"it":"Panini","en":"Panini","fr":"Paninis","es":"Paninis","de":"Panini"},
  "Hamburger":{"it":"Hamburger","en":"Burger","fr":"Burger","es":"Hamburguesa","de":"Burger"},
  "Fritti":{"it":"Fritti","en":"Fried Food","fr":"Fritures","es":"Fritos","de":"Frittiertes"},
  "Pizze":{"it":"Pizze","en":"Pizzas","fr":"Pizzas","es":"Pizzas","de":"Pizzen"},
  "Insalate":{"it":"Insalate","en":"Salads","fr":"Salades","es":"Ensaladas","de":"Salate"},
  "Combo":{"it":"Combo","en":"Combo","fr":"Combo","es":"Combo","de":"Combo"},
  "Bevande":{"it":"Bevande","en":"Drinks","fr":"Boissons","es":"Bebidas","de":"Getränke"},
  "Dolci":{"it":"Dolci","en":"Desserts","fr":"Desserts","es":"Postres","de":"Desserts"},
  "Contorni":{"it":"Contorni","en":"Side Dishes","fr":"Accompagnements","es":"Guarniciones","de":"Beilagen"},
  "Piadine":{"it":"Piadine","en":"Piadina Wraps","fr":"Piadinas","es":"Piadinas","de":"Piadinas"},
  "Kebab":{"it":"Kebab","en":"Kebab","fr":"Kebab","es":"Kebab","de":"Kebab"},
  "I nostri panini gourmet":{"it":"I nostri panini gourmet","en":"Our gourmet sandwiches","fr":"Nos sandwichs gourmets","es":"Nuestros bocadillos gourmet","de":"Unsere Gourmet-Sandwiches"},
  "Pizze fresche e croccanti":{"it":"Pizze fresche e croccanti","en":"Fresh, crispy pizzas","fr":"Pizzas fraîches et croustillantes","es":"Pizzas frescas y crujientes","de":"Frische, knusprige Pizzen"},
  "Insalate fresche e salutari":{"it":"Insalate fresche e salutari","en":"Fresh, healthy salads","fr":"Salades fraîches et saines","es":"Ensaladas frescas y saludables","de":"Frische, gesunde Salate"},
  "I nostri menù combo":{"it":"I nostri menù combo","en":"Our combo menus","fr":"Nos menus combo","es":"Nuestros menús combo","de":"Unsere Kombi-Menüs"},
  "Bevande fresche":{"it":"Bevande fresche","en":"Refreshing drinks","fr":"Boissons fraîches","es":"Bebidas refrescantes","de":"Erfrischende Getränke"},
  "Dolci e dessert":{"it":"Dolci e dessert","en":"Sweets and desserts","fr":"Douceurs et desserts","es":"Dulces y postres","de":"Süßspeisen und Desserts"},
  "Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa":{"it":"Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa","en":"180g beef on a brioche bun with lettuce, tomato and sauce","fr":"Bœuf de 180 g sur pain brioché avec laitue, tomate et sauce","es":"Carne de vacuno de 180 g en pan brioche con lechuga, tomate y salsa","de":"180 g Rindfleisch auf Briochebrötchen mit Salat, Tomate und Sauce"},
  "Hamburger con doppio cheddar e salsa speciale":{"it":"Hamburger con doppio cheddar e salsa speciale","en":"Burger with double cheddar and special sauce","fr":"Burger avec double cheddar et sauce spéciale","es":"Hamburguesa con doble cheddar y salsa especial","de":"Burger mit doppeltem Cheddar und Spezialsauce"},
  "Pomodoro, mozzarella di bufala, basilico fresco":{"it":"Pomodoro, mozzarella di bufala, basilico fresco","en":"Tomato, buffalo mozzarella and fresh basil","fr":"Tomate, mozzarella de bufflonne et basilic frais","es":"Tomate, mozzarella de búfala y albahaca fresca","de":"Tomate, Büffelmozzarella und frisches Basilikum"},
  "Pomodoro, mozzarella, salame piccante":{"it":"Pomodoro, mozzarella, salame piccante","en":"Tomato, mozzarella and spicy salami","fr":"Tomate, mozzarella et salami piquant","es":"Tomate, mozzarella y salami picante","de":"Tomate, Mozzarella und scharfe Salami"},
  "Lattuga romana, pollo grigliato, parmigiano e crostini":{"it":"Lattuga romana, pollo grigliato, parmigiano e crostini","en":"Romaine lettuce, grilled chicken, Parmesan and croutons","fr":"Laitue romaine, poulet grillé, parmesan et croûtons","es":"Lechuga romana, pollo a la parrilla, parmesano y picatostes","de":"Römersalat, gegrilltes Hähnchen, Parmesan und Croutons"},
  "Tiramisù classico fatto in casa":{"it":"Tiramisù classico fatto in casa","en":"Classic homemade tiramisù","fr":"Tiramisù classique fait maison","es":"Tiramisú clásico casero","de":"Klassisches hausgemachtes Tiramisù"},
  "Acqua":{"it":"Acqua","en":"Water","fr":"Eau","es":"Agua","de":"Wasser"},

  // Ingredienti base e carne
  "Carne di manzo":{"it":"Carne di manzo","en":"Beef","fr":"Bœuf","es":"Carne de vacuno","de":"Rindfleisch"},
  "Pollo":{"it":"Pollo","en":"Chicken","fr":"Poulet","es":"Pollo","de":"Hähnchen"},
  "Pollo fritto":{"it":"Pollo fritto","en":"Fried chicken","fr":"Poulet frit","es":"Pollo frito","de":"Gebratenes Hähnchen"},
  "Pollo grigliato":{"it":"Pollo grigliato","en":"Grilled chicken","fr":"Poulet grillé","es":"Pollo a la parrilla","de":"Gegrilltes Hähnchen"},
  "Salsiccia":{"it":"Salsiccia","en":"Sausage","fr":"Saucisse","es":"Salchicha","de":"Wurst"},
  "Wurstel":{"it":"Wurstel","en":"Hot dog","fr":"Saucisse","es":"Perrito caliente","de":"Würstchen"},
  "Porchetta":{"it":"Porchetta","en":"Roast pork","fr":"Porc rôti","es":"Cerdo asado","de":"Spanferkel"},
  "Bacon":{"it":"Bacon","en":"Bacon","fr":"Bacon","es":"Bacon","de":"Speck"},
  "Pancetta":{"it":"Pancetta","en":"Pancetta","fr":"Poitrine de porc","es":"Panceta","de":"Bauchspeck"},
  "Prosciutto crudo":{"it":"Prosciutto crudo","en":"Cured ham","fr":"Jambon cru","es":"Jamón serrano","de":"Parmaschinken"},
  "Prosciutto cotto":{"it":"Prosciutto cotto","en":"Cooked ham","fr":"Jambon cuit","es":"Jamón cocido","de":"Kochschinken"},
  "Salame piccante":{"it":"Salame piccante","en":"Spicy salami","fr":"Salami piquant","es":"Salami picante","de":"Scharfe Salami"},
  "Uovo":{"it":"Uovo","en":"Egg","fr":"Œuf","es":"Huevo","de":"Ei"},
  "Uovo fritto":{"it":"Uovo fritto","en":"Fried egg","fr":"Œuf au plat","es":"Huevo frito","de":"Spiegelei"},
  "Tonno":{"it":"Tonno","en":"Tuna","fr":"Thon","es":"Atún","de":"Thunfisch"},
  "Salmone":{"it":"Salmone","en":"Salmon","fr":"Saumon","es":"Salmón","de":"Lachs"},

  // Formaggi
  "Formaggio":{"it":"Formaggio","en":"Cheese","fr":"Fromage","es":"Queso","de":"Käse"},
  "Cheddar":{"it":"Cheddar","en":"Cheddar","fr":"Cheddar","es":"Cheddar","de":"Cheddar"},
  "Mozzarella":{"it":"Mozzarella","en":"Mozzarella","fr":"Mozzarella","es":"Mozzarella","de":"Mozzarella"},
  "Mozzarella di bufala":{"it":"Mozzarella di bufala","en":"Buffalo mozzarella","fr":"Mozzarella di bufala","es":"Mozzarella de búfala","de":"Büffelmozzarella"},
  "Gorgonzola":{"it":"Gorgonzola","en":"Gorgonzola","fr":"Gorgonzola","es":"Gorgonzola","de":"Gorgonzola"},
  "Scamorza":{"it":"Scamorza","en":"Scamorza cheese","fr":"Scamorza","es":"Scamorza","de":"Scamorza"},
  "Provola":{"it":"Provola","en":"Provola cheese","fr":"Provolone","es":"Queso provolone","de":"Provolone"},
  "Parmigiano":{"it":"Parmigiano","en":"Parmesan","fr":"Parmesan","es":"Parmesano","de":"Parmesan"},
  "Grana Padano":{"it":"Grana Padano","en":"Grana Padano","fr":"Grana Padano","es":"Grana Padano","de":"Grana Padano"},
  "Pecorino":{"it":"Pecorino","en":"Pecorino cheese","fr":"Pecorino","es":"Queso pecorino","de":"Pecorino"},
  "Brie":{"it":"Brie","en":"Brie","fr":"Brie","es":"Brie","de":"Brie"},
  "Edamer":{"it":"Edamer","en":"Edam","fr":"Edam","es":"Edam","de":"Edamer"},

  // Verdure
  "Lattuga":{"it":"Lattuga","en":"Lettuce","fr":"Laitue","es":"Lechuga","de":"Salat"},
  "Lattuga romana":{"it":"Lattuga romana","en":"Romaine lettuce","fr":"Laitue romaine","es":"Lechuga romana","de":"Römersalat"},
  "Rucola":{"it":"Rucola","en":"Arugula","fr":"Roquette","es":"Rúcula","de":"Rucola"},
  "Pomodoro":{"it":"Pomodoro","en":"Tomato","fr":"Tomate","es":"Tomate","de":"Tomate"},
  "Pomodorini":{"it":"Pomodorini","en":"Cherry tomatoes","fr":"Tomates cerises","es":"Tomates cherry","de":"Kirschtomaten"},
  "Cipolla":{"it":"Cipolla","en":"Onion","fr":"Oignon","es":"Cebolla","de":"Zwiebel"},
  "Cipolla rossa":{"it":"Cipolla rossa","en":"Red onion","fr":"Oignon rouge","es":"Cebolla roja","de":"Rote Zwiebel"},
  "Cipolla caramellata":{"it":"Cipolla caramellata","en":"Caramelized onion","fr":"Oignon caramélisé","es":"Cebolla caramelizada","de":"Karamellisierte Zwiebel"},
  "Cipolla croccante":{"it":"Cipolla croccante","en":"Crispy onion","fr":"Oignon croustillant","es":"Cebolla crujiente","de":"Röstzwiebeln"},
  "Zucchine":{"it":"Zucchine","en":"Zucchini","fr":"Courgettes","es":"Calabacín","de":"Zucchini"},
  "Melanzane":{"it":"Melanzane","en":"Eggplant","fr":"Aubergines","es":"Berenjena","de":"Aubergine"},
  "Peperoni":{"it":"Peperoni","en":"Peppers","fr":"Poivrons","es":"Pimientos","de":"Paprika"},
  "Verdure grigliate":{"it":"Verdure grigliate","en":"Grilled vegetables","fr":"Légumes grillés","es":"Verduras a la parrilla","de":"Gegrilltes Gemüse"},
  "Funghi":{"it":"Funghi","en":"Mushrooms","fr":"Champignons","es":"Champiñones","de":"Pilze"},
  "Olive":{"it":"Olive","en":"Olives","fr":"Olives","es":"Aceitunas","de":"Oliven"},
  "Cetriolini":{"it":"Cetriolini","en":"Pickles","fr":"Cornichons","es":"Pepinillos","de":"Essiggurken"},
  "Jalapeño":{"it":"Jalapeño","en":"Jalapeño","fr":"Jalapeño","es":"Jalapeño","de":"Jalapeño"},
  "Friarielli":{"it":"Friarielli","en":"Broccoli rabe","fr":"Brocolis-raves","es":"Grelos","de":"Stängelkohl"},
  "Basilico":{"it":"Basilico","en":"Basil","fr":"Basilic","es":"Albahaca","de":"Basilikum"},

  // Salse e creme
  "Salsa":{"it":"Salsa","en":"Sauce","fr":"Sauce","es":"Salsa","de":"Sauce"},
  "Salsa speciale":{"it":"Salsa speciale","en":"Special sauce","fr":"Sauce spéciale","es":"Salsa especial","de":"Spezialsoße"},
  "Maionese":{"it":"Maionese","en":"Mayonnaise","fr":"Mayonnaise","es":"Mayonesa","de":"Mayonnaise"},
  "Ketchup":{"it":"Ketchup","en":"Ketchup","fr":"Ketchup","es":"Kétchup","de":"Ketchup"},
  "Senape":{"it":"Senape","en":"Mustard","fr":"Moutarde","es":"Mostaza","de":"Senf"},
  "Salsa BBQ":{"it":"Salsa BBQ","en":"BBQ Sauce","fr":"Sauce BBQ","es":"Salsa Barbacoa","de":"BBQ-Sauce"},
  "Salsa Burger":{"it":"Salsa Burger","en":"Burger Sauce","fr":"Sauce Burger","es":"Salsa Burger","de":"Burger-Sauce"},
  "Salsa rosa":{"it":"Salsa rosa","en":"Pink sauce","fr":"Sauce cocktail","es":"Salsa rosa","de":"Cocktailsauce"},
  "Salsa tartara":{"it":"Salsa tartara","en":"Tartar sauce","fr":"Sauce tartare","es":"Salsa tártara","de":"Remoulade"},
  "Salsa yogurt":{"it":"Salsa yogurt","en":"Yogurt sauce","fr":"Sauce au yaourt","es":"Salsa de yogur","de":"Joghurt-Dressing"},
  "Tabasco":{"it":"Tabasco","en":"Tabasco","fr":"Tabasco","es":"Tabasco","de":"Tabasco"},
  "Crema di pistacchio":{"it":"Crema di pistacchio","en":"Pistachio cream","fr":"Crème de pistache","es":"Crema de pistacho","de":"Pistaziencreme"},
  "Crema al tartufo":{"it":"Crema al tartufo","en":"Truffle cream","fr":"Crème de truffe","es":"Crema de trufa","de":"Trüffelcreme"},
  "Pesto":{"it":"Pesto","en":"Pesto","fr":"Pesto","es":"Pesto","de":"Pesto"},
  "Guacamole":{"it":"Guacamole","en":"Guacamole","fr":"Guacamole","es":"Guacamole","de":"Guacamole"},
  "Salsa piccante":{"it":"Salsa piccante","en":"Hot sauce","fr":"Sauce piquante","es":"Salsa picante","de":"Scharfe Sauce"},

  // Pane e impasti
  "Pane brioche":{"it":"Pane brioche","en":"Brioche bun","fr":"Pain brioché","es":"Pan brioche","de":"Briochebrötchen"},
  "Pane sesamo":{"it":"Pane sesamo","en":"Sesame bun","fr":"Pain au sésame","es":"Pan con sésamo","de":"Sesambrötchen"},
  "Pane integrale":{"it":"Pane integrale","en":"Whole wheat bun","fr":"Pain complet","es":"Pan integral","de":"Vollkornbrötchen"},
  "Pane senza glutine":{"it":"Pane senza glutine","en":"Gluten-free bun","fr":"Pain sans gluten","es":"Pan sin gluten","de":"Glutenfreies Brötchen"},
  "Pane casereccio":{"it":"Pane casereccio","en":"Rustic bread","fr":"Pain de campagne","es":"Pan rústico","de":"Bauernbrot"},
  "Focaccia":{"it":"Focaccia","en":"Focaccia","fr":"Focaccia","es":"Focaccia","de":"Focaccia"},
  "Piadina":{"it":"Piadina","en":"Piadina","fr":"Piadina","es":"Piadina","de":"Piadina"},
  "Impasto classico":{"it":"Impasto classico","en":"Classic dough","fr":"Pâte classique","es":"Masa clásica","de":"Klassischer Teig"},
  "Impasto napoletano":{"it":"Impasto napoletano","en":"Neapolitan dough","fr":"Pâte napolitaine","es":"Masa napolitana","de":"Neapolitanischer Teig"},
  "Bordo Ripieno":{"it":"Bordo Ripieno","en":"Stuffed Crust","fr":"Croûte fourrée","es":"Borde relleno","de":"Gefüllter Rand"},

  // Fritti e contorni
  "Patatine fritte":{"it":"Patatine fritte","en":"French fries","fr":"Frites","es":"Patatas fritas","de":"Pommes frites"},
  "Patatine dipper":{"it":"Patatine dipper","en":"Dipper fries","fr":"Frites dipper","es":"Patatas dipper","de":"Dipper-Pommes"},
  "Patate al forno":{"it":"Patate al forno","en":"Roasted potatoes","fr":"Pommes de terre rôties","es":"Patatas asadas","de":"Bratkartoffeln"},
  "Crocchette di pollo":{"it":"Crocchette di pollo","en":"Chicken nuggets","fr":"Nuggets de poulet","es":"Nuggets de pollo","de":"Chicken Nuggets"},
  "Alette di pollo":{"it":"Alette di pollo","en":"Chicken wings","fr":"Ailes de poulet","es":"Alitas de pollo","de":"Chicken Wings"},
  "Anelli di cipolla":{"it":"Anelli di cipolla","en":"Onion rings","fr":"Rondelles d'oignon","es":"Aros de cebolla","de":"Zwiebelringe"},
  "Mozzarelline fritte":{"it":"Mozzarelline fritte","en":"Fried mozzarella sticks","fr":"Bâtonnets de mozzarella frits","es":"Palitos de mozzarella fritos","de":"Frittierte Mozzarella-Sticks"},
  "Olive ascolane":{"it":"Olive ascolane","en":"Stuffed fried olives","fr":"Olives farcies frites","es":"Aceitunas rellenas fritas","de":"Gefüllte frittierte Oliven"},
  "Jalapeños ripieni":{"it":"Jalapeños ripieni","en":"Stuffed jalapeños","fr":"Jalapeños farcis","es":"Jalapeños rellenos","de":"Gefüllte Jalapeños"},
  "Crostini":{"it":"Crostini","en":"Croutons","fr":"Croûtons","es":"Picatostes","de":"Croutons"},
  "Panelle":{"it":"Panelle","en":"Chickpea fritters","fr":"Beignets de pois chiches","es":"Buñuelos de garbanzos","de":"Kichererbsen-Fritter"},
  "Arancini":{"it":"Arancini","en":"Rice balls","fr":"Arancini","es":"Arancini","de":"Reisbällchen"},

  // Nomi classici
  "Hamburger Classico":{"it":"Hamburger Classico","en":"Classic Hamburger","fr":"Hamburger classique","es":"Hamburguesa clásica","de":"Klassischer Hamburger"},
  "Cheeseburger":{"it":"Cheeseburger","en":"Cheeseburger","fr":"Cheeseburger","es":"Cheeseburger","de":"Cheeseburger"},
  "Cheeseburger Deluxe":{"it":"Cheeseburger Deluxe","en":"Cheeseburger Deluxe","fr":"Cheeseburger Deluxe","es":"Cheeseburger Deluxe","de":"Cheeseburger Deluxe"},
  "Bacon Burger":{"it":"Bacon Burger","en":"Bacon Burger","fr":"Bacon Burger","es":"Bacon Burger","de":"Bacon Burger"},
  "Chicken Burger":{"it":"Chicken Burger","en":"Chicken Burger","fr":"Burger au poulet","es":"Hamburguesa de pollo","de":"Chicken Burger"},
  "Veggie Burger":{"it":"Veggie Burger","en":"Veggie Burger","fr":"Burger végétarien","es":"Hamburguesa vegetal","de":"Veggie Burger"},
  "Margherita":{"it":"Margherita","en":"Margherita","fr":"Margherita","es":"Margherita","de":"Margherita"},
  "Diavola":{"it":"Diavola","en":"Diavola","fr":"Diavola","es":"Diavola","de":"Diavola"},
  "Capricciosa":{"it":"Capricciosa","en":"Capricciosa","fr":"Capricciosa","es":"Capricciosa","de":"Capricciosa"},
  "Quattro Formaggi":{"it":"Quattro Formaggi","en":"Four Cheese","fr":"Quatre Fromages","es":"Cuatro Quesos","de":"Vier Käsesorten"},
  "Caesar Salad":{"it":"Caesar Salad","en":"Caesar Salad","fr":"Salade César","es":"Ensalada César","de":"Caesar Salad"},

  // Aggiunte extra
  "Extra Formaggio":{"it":"Extra Formaggio","en":"Extra Cheese","fr":"Supplément fromage","es":"Queso extra","de":"Extra Käse"},
  "Extra Bacon":{"it":"Extra Bacon","en":"Extra Bacon","fr":"Supplément bacon","es":"Bacon extra","de":"Extra Bacon"},
  "Extra Mozzarella":{"it":"Extra Mozzarella","en":"Extra Mozzarella","fr":"Supplément mozzarella","es":"Mozzarella extra","de":"Extra Mozzarella"},
  "Extra Pollo":{"it":"Extra Pollo","en":"Extra Chicken","fr":"Supplément poulet","es":"Pollo extra","de":"Extra Hähnchen"},
  "Extra Carne":{"it":"Extra Carne","en":"Extra Meat","fr":"Supplément viande","es":"Carne extra","de":"Extra Fleisch"},
  "Extra Salsa":{"it":"Extra Salsa","en":"Extra Sauce","fr":"Supplément sauce","es":"Salsa extra","de":"Extra Sauce"},
  "Senza Cipolla":{"it":"Senza Cipolla","en":"No Onion","fr":"Sans oignon","es":"Sin cebolla","de":"Ohne Zwiebel"},
  "Senza Pomodoro":{"it":"Senza Pomodoro","en":"No Tomato","fr":"Sans tomate","es":"Sin tomate","de":"Ohne Tomate"},
  "Senza Salsa":{"it":"Senza Salsa","en":"No Sauce","fr":"Sans sauce","es":"Sin salsa","de":"Ohne Sauce"},
  "Ben Cotto":{"it":"Ben Cotto","en":"Well Done","fr":"Bien cuit","es":"Muy hecho","de":"Gut durch"},
  "Al Sangue":{"it":"Al Sangue","en":"Rare","fr":"Saignant","es":"Poco hecho","de":"Blutig"},

  // Bevande e Dolci
  "Acqua Naturale":{"it":"Acqua Naturale","en":"Still Water","fr":"Eau plate","es":"Agua natural","de":"Stilles Wasser"},
  "Acqua Frizzante":{"it":"Acqua Frizzante","en":"Sparkling Water","fr":"Eau gazeuse","es":"Agua con gas","de":"Sprudelwasser"},
  "Coca Cola":{"it":"Coca Cola","en":"Coca Cola","fr":"Coca Cola","es":"Coca Cola","de":"Coca Cola"},
  "Coca Cola Zero":{"it":"Coca Cola Zero","en":"Coca Cola Zero","fr":"Coca Cola Zéro","es":"Coca Cola Zero","de":"Coca Cola Zero"},
  "Fanta":{"it":"Fanta","en":"Fanta","fr":"Fanta","es":"Fanta","de":"Fanta"},
  "Sprite":{"it":"Sprite","en":"Sprite","fr":"Sprite","es":"Sprite","de":"Sprite"},
  "Tè alla Pesca":{"it":"Tè alla Pesca","en":"Peach Tea","fr":"Thé à la pêche","es":"Té de melocotón","de":"Pfirsichtee"},
  "Tè al Limone":{"it":"Tè al Limone","en":"Lemon Tea","fr":"Thé au citron","es":"Té de limón","de":"Zitronentee"},
  "Birra":{"it":"Birra","en":"Beer","fr":"Bière","es":"Cerveza","de":"Bier"},
  "Birra alla spina":{"it":"Birra alla spina","en":"Draft Beer","fr":"Bière pression","es":"Cerveza de barril","de":"Fassbier"},
  "Tiramisù":{"it":"Tiramisù","en":"Tiramisù","fr":"Tiramisù","es":"Tiramisù","de":"Tiramisù"},
  "Cheesecake":{"it":"Cheesecake","en":"Cheesecake","fr":"Cheesecake","es":"Tarta de queso","de":"Käsekuchen"},
  "Panna Cotta":{"it":"Panna Cotta","en":"Panna Cotta","fr":"Panna Cotta","es":"Panna Cotta","de":"Panna Cotta"},
  "Muffin":{"it":"Muffin","en":"Muffin","fr":"Muffin","es":"Muffin","de":"Muffin"},
  "Brownie":{"it":"Brownie","en":"Brownie","fr":"Brownie","es":"Brownie","de":"Brownie"},
  "Gelato":{"it":"Gelato","en":"Ice Cream","fr":"Glace","es":"Helado","de":"Eiscreme"},

  // Formati
  "500ml":{"it":"500ml","en":"500ml","fr":"500ml","es":"500ml","de":"500ml"},
  "330ml in lattina":{"it":"330ml in lattina","en":"330ml can","fr":"330ml en canette","es":"330ml en lata","de":"330ml in Dose"},
  "Scegli il Burger":{"it":"Scegli il Burger","en":"Choose your burger","fr":"Choisissez le burger","es":"Elige la hamburguesa","de":"Wähle deinen Burger"},
  "Scegli la Bevanda":{"it":"Scegli la Bevanda","en":"Choose your drink","fr":"Choisissez la boisson","es":"Elige la bebida","de":"Wähle dein Getränk"},
  "Hamburger + patatine + bevanda":{"it":"Hamburger + patatine + bevanda","en":"Burger + fries + drink","fr":"Hamburger + frites + boisson","es":"Hamburguesa + patatas fritas + bebida","de":"Hamburger + Pommes + Getränk"}
};

export type MenuLocalizedValue = Partial<Record<SupportedLanguage, string>>;

/**
 * Translates a label from the seeded catalog, or uses an optional localized value
 * attached to a custom catalog record. Unknown custom content remains unchanged,
 * preserving the restaurant's own wording when no offline translation was prepared.
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
