// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import fs from 'node:fs';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

/** @returns {import('vite').Plugin} */
function devConfigApiPlugin() {
  return {
    name: 'dev-config-api',
    /** @param {import('vite').ViteDevServer} server */
    configureServer(server) {
      /**
       * @param {import('node:http').IncomingMessage} req
       * @param {import('node:http').ServerResponse} res
       * @param {(err?: any) => void} next
       */
      server.middlewares.use(async (req, res, next) => {
        // 1. Sync Config JSON
        if (req.url === '/api/config' && req.method === 'POST') {
          let body = '';
          req.on('data', (/** @type {any} */ chunk) => (body += chunk));
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
                    if (fs.existsSync(p)) {
                      const current = fs.readFileSync(p, 'utf-8');
                      if (current === jsonStr) continue;
                    }
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

        // 1.5. Read Store JSON
        if (req.url?.startsWith('/api/read-store') && req.method === 'GET') {
          try {
            const urlObj = new URL(req.url, 'http://localhost');
            const store = urlObj.searchParams.get('store');
            if (store) {
              const filePath = path.resolve(process.cwd(), `src/data/seeds/${store}.json`);
              if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8');
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(content);
                return;
              }
            }
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Store not found' }));
          } catch (err) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: String(err) }));
          }
          return;
        }

        // 2. Sync Store JSON (galeria, horarios, avisos, etc.)
        if (req.url === '/api/sync-store' && req.method === 'POST') {
          let body = '';
          req.on('data', (/** @type {any} */ chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const { store, data } = JSON.parse(body);
              if (store && data) {
                const jsonStr = JSON.stringify(data, null, 2) + '\n';
                const baseDir = process.cwd();
                const targetPaths = [
                  path.resolve(baseDir, `src/data/seeds/${store}.json`),
                  path.resolve(baseDir, `../web/src/data/seeds/${store}.json`),
                  path.resolve(baseDir, `../src/data/seeds/${store}.json`),
                  path.resolve(baseDir, `web/src/data/seeds/${store}.json`),
                ];
                for (const p of targetPaths) {
                  try {
                    const dir = path.dirname(p);
                    if (fs.existsSync(dir)) {
                      if (fs.existsSync(p)) {
                        const current = fs.readFileSync(p, 'utf-8');
                        if (current === jsonStr) continue;
                      }
                      fs.writeFileSync(p, jsonStr, 'utf-8');
                    }
                  } catch (e) {}
                }
              }
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: String(err) }));
            }
          });
          return;
        }

        // 3. Link Domains automatically to Vercel
        if (req.url === '/api/vercel/link-domain' && req.method === 'POST') {
          let body = '';
          req.on('data', (/** @type {any} */ chunk) => (body += chunk));
          req.on('end', async () => {
            try {
              const { webDomain, cmsDomain } = JSON.parse(body);
              const results = [];

              if (webDomain && webDomain !== 'parroquia.org' && webDomain !== 'santamariadelaayuda.org') {
                try {
                  const { stdout } = await execAsync(`npx vercel domains add ${webDomain} altario-web`);
                  results.push({ domain: webDomain, project: 'altario-web', output: stdout });
                } catch (/** @type {any} */ e) {
                  results.push({ domain: webDomain, project: 'altario-web', error: e.message });
                }

                if (!webDomain.startsWith('www.')) {
                  try {
                    const { stdout } = await execAsync(`npx vercel domains add www.${webDomain} altario-web`);
                    results.push({ domain: `www.${webDomain}`, project: 'altario-web', output: stdout });
                  } catch (/** @type {any} */ e) {
                    results.push({ domain: `www.${webDomain}`, project: 'altario-web', error: e.message });
                  }
                }
              }

              if (cmsDomain && cmsDomain !== 'admin.santamariadelaayuda.org') {
                try {
                  const { stdout } = await execAsync(`npx vercel domains add ${cmsDomain} altario-cms`);
                  results.push({ domain: cmsDomain, project: 'altario-cms', output: stdout });
                } catch (/** @type {any} */ e) {
                  results.push({ domain: cmsDomain, project: 'altario-cms', error: e.message });
                }
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, results }));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
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