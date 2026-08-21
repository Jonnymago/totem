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
const CUSTOMER_MENU_TRANSLATIONS: Record<string, Record<SupportedLanguage, string>> = {"Panini":{"it":"Panini","en":"Panini","fr":"Paninis","es":"Paninis","de":"Panini"},"I nostri panini gourmet":{"it":"I nostri panini gourmet","en":"Our gourmet paninis","fr":"Nos paninis gourmets","es":"Nuestros paninis gourmet","de":"Unsere Gourmet-Panini"},"Pizze":{"it":"Pizze","en":"Pizzas","fr":"Pizzas","es":"Pizzas","de":"Pizzen"},"Pizze fresche e croccanti":{"it":"Pizze fresche e croccanti","en":"Fresh, crispy pizzas","fr":"Pizzas fraîches et croustillantes","es":"Pizzas frescas y crujientes","de":"Frische, knusprige Pizzen"},"Insalate":{"it":"Insalate","en":"Salads","fr":"Salades","es":"Ensaladas","de":"Salate"},"Insalate fresche e salutari":{"it":"Insalate fresche e salutari","en":"Fresh, healthy salads","fr":"Salades fraîches et saines","es":"Ensaladas frescas y saludables","de":"Frische, gesunde Salate"},"Combo":{"it":"Combo","en":"Combo","fr":"Combo","es":"Combo","de":"Combo"},"I nostri menù combo":{"it":"I nostri menù combo","en":"Our combo menus","fr":"Nos menus combo","es":"Nuestros menús combo","de":"Unsere Combo-Menüs"},"Bevande":{"it":"Bevande","en":"Drinks","fr":"Boissons","es":"Bebidas","de":"Getränke"},"Bevande fresche":{"it":"Bevande fresche","en":"Cold drinks","fr":"Boissons fraîches","es":"Bebidas frías","de":"Kalte Getränke"},"Dolci":{"it":"Dolci","en":"Desserts","fr":"Desserts","es":"Postres","de":"Desserts"},"Dolci e dessert":{"it":"Dolci e dessert","en":"Desserts & sweets","fr":"Desserts et douceurs","es":"Postres y dulces","de":"Desserts und Süßes"},"Hamburger Classico":{"it":"Hamburger Classico","en":"Classic Hamburger","fr":"Hamburger classique","es":"Hamburguesa clásica","de":"Klassischer Hamburger"},"Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa":{"it":"Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa","en":"180g beef on brioche bun with lettuce, tomato and sauce","fr":"Viande de bœuf 180g sur pain brioché avec laitue, tomate et sauce","es":"Carne de vacuno 180g en pan brioche con lechuga, tomate y salsa","de":"180g Rindfleisch auf Briochebrötchen mit Salat, Tomate und Sauce"},"Pane brioche":{"it":"Pane brioche","en":"Brioche bun","fr":"Pain brioché","es":"Pan brioche","de":"Briochebrötchen"},"Carne di manzo":{"it":"Carne di manzo","en":"Beef","fr":"Bœuf","es":"Carne de vacuno","de":"Rindfleisch"},"Lattuga":{"it":"Lattuga","en":"Lettuce","fr":"Laitue","es":"Lechuga","de":"Salat"},"Pomodoro":{"it":"Pomodoro","en":"Tomato","fr":"Tomate","es":"Tomate","de":"Tomate"},"Salsa":{"it":"Salsa","en":"Sauce","fr":"Sauce","es":"Salsa","de":"Sauce"},"Extra Formaggio":{"it":"Extra Formaggio","en":"Extra Cheese","fr":"Supplément fromage","es":"Queso extra","de":"Extra Käse"},"Extra Bacon":{"it":"Extra Bacon","en":"Extra Bacon","fr":"Supplément bacon","es":"Bacon extra","de":"Extra Bacon"},"Uovo":{"it":"Uovo","en":"Egg","fr":"Œuf","es":"Huevo","de":"Ei"},"Cheeseburger Deluxe":{"it":"Cheeseburger Deluxe","en":"Cheeseburger Deluxe","fr":"Cheeseburger Deluxe","es":"Cheeseburger Deluxe","de":"Cheeseburger Deluxe"},"Hamburger con doppio cheddar e salsa speciale":{"it":"Hamburger con doppio cheddar e salsa speciale","en":"Burger with double cheddar and special sauce","fr":"Hamburger avec double cheddar et sauce spéciale","es":"Hamburguesa con doble cheddar y salsa especial","de":"Hamburger mit doppeltem Cheddar und Spezialsoße"},"Cheddar":{"it":"Cheddar","en":"Cheddar","fr":"Cheddar","es":"Cheddar","de":"Cheddar"},"Salsa speciale":{"it":"Salsa speciale","en":"Special sauce","fr":"Sauce spéciale","es":"Salsa especial","de":"Spezialsoße"},"Margherita":{"it":"Margherita","en":"Margherita","fr":"Margherita","es":"Margherita","de":"Margherita"},"Pomodoro, mozzarella di bufala, basilico fresco":{"it":"Pomodoro, mozzarella di bufala, basilico fresco","en":"Tomato, buffalo mozzarella, fresh basil","fr":"Tomate, mozzarella di bufala, basilic frais","es":"Tomate, mozzarella de búfala, albahaca fresca","de":"Tomate, Büffelmozzarella, frisches Basilikum"},"Mozzarella":{"it":"Mozzarella","en":"Mozzarella","fr":"Mozzarella","es":"Mozzarella","de":"Mozzarella"},"Basilico":{"it":"Basilico","en":"Basil","fr":"Basilic","es":"Albahaca","de":"Basilikum"},"Extra Mozzarella":{"it":"Extra Mozzarella","en":"Extra Mozzarella","fr":"Supplément mozzarella","es":"Mozzarella extra","de":"Extra Mozzarella"},"Bordo Ripieno":{"it":"Bordo Ripieno","en":"Stuffed Crust","fr":"Croûte fourrée","es":"Borde relleno","de":"Gefüllter Rand"},"Diavola":{"it":"Diavola","en":"Diavola","fr":"Diavola","es":"Diavola","de":"Diavola"},"Pomodoro, mozzarella, salame piccante":{"it":"Pomodoro, mozzarella, salame piccante","en":"Tomato, mozzarella, spicy salami","fr":"Tomate, mozzarella, salami piquant","es":"Tomate, mozzarella, salami picante","de":"Tomate, Mozzarella, scharfe Salami"},"Salame piccante":{"it":"Salame piccante","en":"Spicy salami","fr":"Salami piquant","es":"Salami picante","de":"Scharfe Salami"},"Caesar Salad":{"it":"Caesar Salad","en":"Caesar Salad","fr":"Salade César","es":"Ensalada César","de":"Caesar Salad"},"Lattuga romana, pollo grigliato, parmigiano e crostini":{"it":"Lattuga romana, pollo grigliato, parmigiano e crostini","en":"Romaine lettuce, grilled chicken, parmesan and croutons","fr":"Laitue romaine, poulet grillé, parmesan et croûtons","es":"Lechuga romana, pollo a la parrilla, parmesano y picatostes","de":"Römersalat, gegrilltes Hähnchen, Parmesan und Croutons"},"Lattuga romana":{"it":"Lattuga romana","en":"Romaine lettuce","fr":"Laitue romaine","es":"Lechuga romana","de":"Römersalat"},"Pollo grigliato":{"it":"Pollo grigliato","en":"Grilled chicken","fr":"Poulet grillé","es":"Pollo a la parrilla","de":"Gegrilltes Hähnchen"},"Parmigiano":{"it":"Parmigiano","en":"Parmesan","fr":"Parmesan","es":"Parmesano","de":"Parmesan"},"Crostini":{"it":"Crostini","en":"Croutons","fr":"Croûtons","es":"Picatostes","de":"Croutons"},"Extra Pollo":{"it":"Extra Pollo","en":"Extra Chicken","fr":"Supplément poulet","es":"Pollo extra","de":"Extra Hähnchen"},"Burger Combo":{"it":"Burger Combo","en":"Burger Combo","fr":"Menu Burger","es":"Combo de hamburguesa","de":"Burger-Combo"},"Hamburger + patatine + bevanda":{"it":"Hamburger + patatine + bevanda","en":"Burger + fries + drink","fr":"Hamburger + frites + boisson","es":"Hamburguesa + patatas fritas + bebida","de":"Hamburger + Pommes + Getränk"},"Scegli il Burger":{"it":"Scegli il Burger","en":"Choose your burger","fr":"Choisissez le burger","es":"Elige la hamburguesa","de":"Wähle deinen Burger"},"Cheeseburger":{"it":"Cheeseburger","en":"Cheeseburger","fr":"Cheeseburger","es":"Cheeseburger","de":"Cheeseburger"},"Scegli la Bevanda":{"it":"Scegli la Bevanda","en":"Choose your drink","fr":"Choisissez la boisson","es":"Elige la bebida","de":"Wähle dein Getränk"},"Coca Cola":{"it":"Coca Cola","en":"Coca Cola","fr":"Coca Cola","es":"Coca Cola","de":"Coca Cola"},"Fanta":{"it":"Fanta","en":"Fanta","fr":"Fanta","es":"Fanta","de":"Fanta"},"Acqua":{"it":"Acqua","en":"Water","fr":"Eau","es":"Agua","de":"Wasser"},"330ml in lattina":{"it":"330ml in lattina","en":"330ml can","fr":"330ml en canette","es":"330ml en lata","de":"330ml in Dose"},"Acqua Naturale":{"it":"Acqua Naturale","en":"Still Water","fr":"Eau plate","es":"Agua natural","de":"Stilles Wasser"},"500ml":{"it":"500ml","en":"500ml","fr":"500ml","es":"500ml","de":"500ml"},"Tiramisù":{"it":"Tiramisù","en":"Tiramisù","fr":"Tiramisù","es":"Tiramisù","de":"Tiramisù"},"Tiramisù classico fatto in casa":{"it":"Tiramisù classico fatto in casa","en":"Classic homemade tiramisù","fr":"Tiramisù classique fait maison","es":"Tiramisù clásico casero","de":"Klassisches hausgemachtes Tiramisù"}};

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
  if (localized?.[language]) return localized[language] as string;
  return persistedGlossary[source]?.[language] || CUSTOMER_MENU_TRANSLATIONS[source]?.[language] || source;
}

export function hasOfflineMenuTranslation(source: string | undefined | null, language: SupportedLanguage): boolean {
  return Boolean(source && (persistedGlossary[source]?.[language] || CUSTOMER_MENU_TRANSLATIONS[source]?.[language]));
}
