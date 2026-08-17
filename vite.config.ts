import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

let settings = {
  restaurant_name: 'TOTEM RISTORANTE',
  logo: '',
  admin_pin: '0000',
  currency_symbol: '€',
  custom_backend_url: '',
  auto_print_courtesy: false,
  auto_print_kitchen: false,
  kitchen_display_enabled: true,
};

let categories = [
  { id: 'cat-1', name: 'Panini', description: 'I nostri panini gourmet', order_index: 0 },
  { id: 'cat-2', name: 'Pizze', description: 'Pizze fresche e croccanti', order_index: 1 },
  { id: 'cat-3', name: 'Insalate', description: 'Insalate fresche e salutari', order_index: 2 },
  { id: 'cat-4', name: 'Combo', description: 'I nostri menù combo', order_index: 3 },
  { id: 'cat-5', name: 'Bevande', description: 'Bevande fresche', order_index: 4 },
  { id: 'cat-6', name: 'Dolci', description: 'Dolci e dessert', order_index: 5 },
];

let products = [
  {
    id: 'prod-1',
    category_id: 'cat-1',
    name: 'Hamburger Classico',
    description: 'Carne di manzo 180g su pane brioche con lattuga, pomodoro e salsa',
    price: 8.5,
    product_type: 'simple',
    available: true,
    base_ingredients: ['Pane brioche', 'Carne di manzo', 'Lattuga', 'Pomodoro', 'Salsa'],
    extra_additions: [
      { name: 'Extra Formaggio', price: 1.0 },
      { name: 'Extra Bacon', price: 1.5 },
      { name: 'Uovo', price: 1.0 },
    ],
  },
  {
    id: 'prod-2',
    category_id: 'cat-1',
    name: 'Cheeseburger Deluxe',
    description: 'Hamburger con doppio cheddar e salsa speciale',
    price: 9.5,
    product_type: 'simple',
    available: true,
    base_ingredients: ['Pane brioche', 'Carne di manzo', 'Cheddar', 'Salsa speciale'],
    extra_additions: [
      { name: 'Extra Formaggio', price: 1.0 },
      { name: 'Extra Bacon', price: 1.5 },
    ],
  },
  {
    id: 'prod-3',
    category_id: 'cat-2',
    name: 'Margherita',
    description: 'Pomodoro, mozzarella di bufala, basilico fresco',
    price: 7.0,
    product_type: 'simple',
    available: true,
    base_ingredients: ['Pomodoro', 'Mozzarella', 'Basilico'],
    extra_additions: [
      { name: 'Extra Mozzarella', price: 1.5 },
      { name: 'Bordo Ripieno', price: 2.0 },
    ],
  },
  {
    id: 'prod-4',
    category_id: 'cat-2',
    name: 'Diavola',
    description: 'Pomodoro, mozzarella, salame piccante',
    price: 8.5,
    product_type: 'simple',
    available: true,
    base_ingredients: ['Pomodoro', 'Mozzarella', 'Salame piccante'],
    extra_additions: [{ name: 'Extra Mozzarella', price: 1.5 }],
  },
  {
    id: 'prod-5',
    category_id: 'cat-3',
    name: 'Caesar Salad',
    description: 'Lattuga romana, pollo grigliato, parmigiano e crostini',
    price: 9.0,
    product_type: 'simple',
    available: true,
    base_ingredients: ['Lattuga romana', 'Pollo grigliato', 'Parmigiano', 'Crostini'],
    extra_additions: [{ name: 'Extra Pollo', price: 2.0 }],
  },
  {
    id: 'prod-6',
    category_id: 'cat-4',
    name: 'Burger Combo',
    description: 'Hamburger + patatine + bevanda',
    price: 13.5,
    product_type: 'combo',
    available: true,
    combo_groups: [
      {
        name: 'Scegli il Burger',
        min_selection: 1,
        max_selection: 1,
        options: [
          { name: 'Hamburger Classico', price_delta: 0.0 },
          { name: 'Cheeseburger', price_delta: 1.0 },
        ],
      },
      {
        name: 'Scegli la Bevanda',
        min_selection: 1,
        max_selection: 1,
        options: [
          { name: 'Coca Cola', price_delta: 0.0 },
          { name: 'Fanta', price_delta: 0.0 },
          { name: 'Acqua', price_delta: 0.0 },
        ],
      },
    ],
  },
  {
    id: 'prod-7',
    category_id: 'cat-5',
    name: 'Coca Cola',
    description: '330ml in lattina',
    price: 2.5,
    product_type: 'simple',
    available: true,
  },
  {
    id: 'prod-8',
    category_id: 'cat-5',
    name: 'Acqua Naturale',
    description: '500ml',
    price: 1.5,
    product_type: 'simple',
    available: true,
  },
  {
    id: 'prod-9',
    category_id: 'cat-6',
    name: 'Tiramisù',
    description: 'Tiramisù classico fatto in casa',
    price: 5.5,
    product_type: 'simple',
    available: true,
  },
];

let globalGroups: any[] = [];
let orders: any[] = [];
let orderCounter = 1;

function mockApiPlugin(): Plugin {
  return {
    name: 'mock-api-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const rawUrl = req.url || '';
        const url = rawUrl.split('?')[0];

        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // Handle /remote, /admin, etc. to serve the standalone remote admin panel
        if (
          url === '/remote' ||
          url === '/remote/' ||
          url === '/remote/index.html' ||
          url === '/admin' ||
          url === '/admin/' ||
          url === '/admin/index.html' ||
          url === '/admin.html' ||
          url === '/remote.html'
        ) {
          const remoteHtmlPath = path.join(process.cwd(), 'public', 'remote', 'index.html');
          if (fs.existsSync(remoteHtmlPath)) {
            const html = fs.readFileSync(remoteHtmlPath, 'utf-8');
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.statusCode = 200;
            return res.end(html);
          }
        }

        if (!url.startsWith('/api')) {
          return next();
        }

        const method = req.method || 'GET';
        res.setHeader('Content-Type', 'application/json');

        const sendJson = (data: any, statusCode = 200) => {
          res.statusCode = statusCode;
          res.end(JSON.stringify(data));
        };

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', () => {
          let parsedBody: any = {};
          if (body) {
            try {
              parsedBody = JSON.parse(body);
            } catch {
              // ignore
            }
          }

          if (url === '/api/settings' && method === 'GET') {
            return sendJson(settings);
          }

          if (url === '/api/categories' && method === 'GET') {
            return sendJson(categories);
          }

          if (url === '/api/products' && method === 'GET') {
            return sendJson(products);
          }

          if (url.startsWith('/api/products/category/') && method === 'GET') {
            const catId = url.replace('/api/products/category/', '');
            return sendJson(products.filter((p) => p.category_id === catId));
          }

          if (url === '/api/orders' && method === 'POST') {
            const newOrder = {
              id: `ord-${Date.now()}`,
              order_number: orderCounter++,
              items: parsedBody.items || [],
              total_price: parsedBody.total_price || 0,
              status: 'pending',
              created_at: new Date().toISOString(),
              order_type: 'full',
            };
            orders.push(newOrder);
            return sendJson(newOrder, 201);
          }

          if (url === '/api/orders/number-only' && method === 'POST') {
            const newOrder = {
              id: `ord-${Date.now()}`,
              order_number: orderCounter++,
              items: [],
              total_price: 0,
              status: 'pending',
              created_at: new Date().toISOString(),
              order_type: 'number-only',
            };
            orders.push(newOrder);
            return sendJson(newOrder, 201);
          }

          if (url === '/api/orders/current' && method === 'GET') {
            return sendJson(orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled'));
          }

          if (url === '/api/admin/login' && method === 'POST') {
            const p = parsedBody.password?.toString().trim();
            const allowed = ['0000', '1234', 'admin123', 'admin', settings.admin_pin];
            if (!p || allowed.includes(p)) {
              return sendJson({ access_token: 'mock-admin-token' });
            }
            return sendJson({ detail: 'Credenziali non valide' }, 401);
          }

          if (url === '/api/admin/pin-login' && method === 'POST') {
            const p = parsedBody.pin?.toString().trim();
            const allowed = ['0000', '1234', 'admin123', 'admin', settings.admin_pin];
            if (!p || allowed.includes(p)) {
              return sendJson({ access_token: 'mock-admin-token' });
            }
            return sendJson({ detail: 'PIN non corretto' }, 401);
          }

          if (url === '/api/admin/settings' && method === 'PUT') {
            settings = { ...settings, ...parsedBody };
            return sendJson(settings);
          }

          if (url === '/api/admin/reset-order-number' && method === 'POST') {
            orderCounter = 1;
            return sendJson({ message: 'Order number reset successfully', reset_at: new Date().toISOString() });
          }

          if (url === '/api/admin/seed' && method === 'POST') {
            orderCounter = 1;
            return sendJson({ message: 'Database seeded successfully' });
          }

          if (url === '/api/admin/categories' && method === 'GET') {
            return sendJson(categories);
          }

          if (url === '/api/admin/categories' && method === 'POST') {
            const newCat = {
              id: `cat-${Date.now()}`,
              name: parsedBody.name || 'Nuova Categoria',
              description: parsedBody.description || '',
              image: parsedBody.image || '',
              order_index: parsedBody.order_index ?? categories.length,
            };
            categories.push(newCat);
            return sendJson(newCat, 201);
          }

          if (url.startsWith('/api/admin/categories/') && method === 'PUT') {
            const id = url.replace('/api/admin/categories/', '');
            const idx = categories.findIndex((c) => c.id === id);
            if (idx >= 0) {
              categories[idx] = { ...categories[idx], ...parsedBody };
              return sendJson(categories[idx]);
            }
          }

          if (url.startsWith('/api/admin/categories/') && method === 'DELETE') {
            const id = url.replace('/api/admin/categories/', '');
            categories = categories.filter((c) => c.id !== id);
            return sendJson({ message: 'Category deleted' });
          }

          if (url === '/api/admin/products' && method === 'GET') {
            return sendJson(products);
          }

          if (url === '/api/admin/products' && method === 'POST') {
            const newProd = {
              id: `prod-${Date.now()}`,
              category_id: parsedBody.category_id || 'cat-1',
              name: parsedBody.name || 'Nuovo Prodotto',
              price: parsedBody.price || 0,
              product_type: parsedBody.product_type || 'simple',
              available: parsedBody.available !== false,
              ...parsedBody,
            };
            products.push(newProd);
            return sendJson(newProd, 201);
          }

          if (url.startsWith('/api/admin/products/') && method === 'PUT') {
            const id = url.replace('/api/admin/products/', '');
            const idx = products.findIndex((p) => p.id === id);
            if (idx >= 0) {
              products[idx] = { ...products[idx], ...parsedBody };
              return sendJson(products[idx]);
            }
          }

          if (url.startsWith('/api/admin/products/') && method === 'DELETE') {
            const id = url.replace('/api/admin/products/', '');
            products = products.filter((p) => p.id !== id);
            return sendJson({ message: 'Product deleted' });
          }

          if (url === '/api/admin/orders' && method === 'GET') {
            return sendJson(orders);
          }

          if (url.startsWith('/api/admin/orders/') && url.endsWith('/status') && method === 'PUT') {
            const id = url.replace('/api/admin/orders/', '').replace('/status', '');
            const idx = orders.findIndex((o) => o.id === id);
            if (idx >= 0) {
              orders[idx].status = parsedBody.status;
              return sendJson(orders[idx]);
            }
          }

          if (url === '/api/global-groups' && method === 'GET') {
            return sendJson(globalGroups);
          }

          if (url === '/api/admin/global-groups' && method === 'GET') {
            return sendJson(globalGroups);
          }

          if (url === '/api/admin/global-groups' && method === 'POST') {
            const newGroup = { id: `grp-${Date.now()}`, ...parsedBody };
            globalGroups.push(newGroup);
            return sendJson(newGroup, 201);
          }

          if (url.startsWith('/api/admin/global-groups/') && method === 'PUT') {
            const id = url.replace('/api/admin/global-groups/', '');
            const idx = globalGroups.findIndex((g) => g.id === id);
            if (idx >= 0) {
              globalGroups[idx] = { ...globalGroups[idx], ...parsedBody };
              return sendJson(globalGroups[idx]);
            }
          }

          if (url.startsWith('/api/admin/global-groups/') && method === 'DELETE') {
            const id = url.replace('/api/admin/global-groups/', '');
            globalGroups = globalGroups.filter((g) => g.id !== id);
            return sendJson({ message: 'Deleted successfully' });
          }

          if (url === '/api/admin/sync-backup' && method === 'POST') {
            if (parsedBody.settings) settings = { ...settings, ...parsedBody.settings };
            if (parsedBody.categories) categories = parsedBody.categories;
            if (parsedBody.products) products = parsedBody.products;
            if (parsedBody.global_groups) globalGroups = parsedBody.global_groups;
            return sendJson({ message: 'Backup synchronized successfully' });
          }

          if (url === '/api/admin/change-credentials' && method === 'POST') {
            if (parsedBody.pin) settings.admin_pin = parsedBody.pin;
            return sendJson({ message: 'Credentials updated successfully' });
          }

          return sendJson({ message: 'Not found' }, 404);
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), mockApiPlugin()],
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  preview: {
    port: 3000,
    host: '0.0.0.0',
  },
});
