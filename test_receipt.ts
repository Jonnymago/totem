import { generateCourtesyTicketText } from './frontend/src/utils/printer';

const sampleOrder = {
      id: 'sample-001',
      order_number: 42,
      order_prefix: 'T1',
      order_type: 'takeaway',
      status: 'pending',
      created_at: new Date().toISOString(),
      total_price: 14.5,
      items: [
        { product_id: 'p1', product_name: 'Classic Burger BBQ', quantity: 2, price: 6.0, removed_ingredients: ['Cipolla'] },
      ],
    };

const receiptConfig = {
    language: 'auto',
    paper_width_mm: 58,
    header_title: 'BURGER FAST FOOD',
    translations: {
        en: { courtesy: 'EN COURTESY' }
    }
};

const settings = {
    ...receiptConfig,
    restaurant_name: receiptConfig.header_title,
    receipt_layout: {
        ...receiptConfig,
        language: 'en'
    },
};

console.log(generateCourtesyTicketText(sampleOrder, settings as any, 58));
