// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import fs from 'node:fs';
import path from 'node:path';

function devConfigApiPlugin() {
  return {
    name: 'dev-config-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/config' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const config = JSON.parse(body);
              const jsonStr = JSON.stringify(config, null, 2) + '\n';
              const baseDir = process.cwd();
              const targetPaths = [
                path.resolve(baseDir, 'src/data/seeds/configuracion.json'),
                path.resolve(baseDir, '../web/src/data/seeds/configuracion.json'),
                path.resolve(baseDir, '../src/data/seeds/configuracion.json'),
                path.resolve(baseDir, 'web/src/data/seeds/configuracion.json'),
              ];
              for (const p of targetPaths) {
                try {
                  const dir = path.dirname(p);
                  if (fs.existsSync(dir)) {
                    fs.writeFileSync(p, jsonStr, 'utf-8');
                  }
                } catch (e) {}
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  server: {
    port: 4322,
  },

  vite: {
    plugins: [tailwindcss(), devConfigApiPlugin()],
  },

  integrations: [react()],
});