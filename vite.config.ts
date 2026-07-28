import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const STORE = resolve('.data/finance.json');

const financeApi = (): Plugin => ({
  name: 'cyclepay-finance-api',
  configureServer(server) {
    server.middlewares.use('/api/finance', (req, res) => {
      if (req.method === 'GET') {
        if (!existsSync(STORE)) {
          res.statusCode = 404;
          res.end('not-initialised');
          return;
        }
        res.setHeader('content-type', 'application/json');
        res.end(readFileSync(STORE, 'utf8'));
        return;
      }
      if (req.method === 'PUT') {
        let body = '';
        req.on('data', (c) => (body += c));
        req.on('end', () => {
          try {
            JSON.parse(body); // sanity
            mkdirSync(resolve('.data'), { recursive: true });
            writeFileSync(STORE, body, 'utf8');
            res.statusCode = 204;
            res.end();
          } catch {
            res.statusCode = 400;
            res.end('invalid-json');
          }
        });
        return;
      }
      res.statusCode = 405;
      res.end();
    });
  },
});

export default defineConfig({
  plugins: [react(), financeApi()],
  server: { port: 5173 },
});
