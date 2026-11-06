import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalLanIp(): string {
  try {
    const interfaces = os.networkInterfaces();
    const candidates: string[] = [];

    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          // Exclude virtualbox / host-only / apipa addresses
          if (!iface.address.startsWith('192.168.56.') && !iface.address.startsWith('169.254.')) {
            candidates.push(iface.address);
          }
        }
      }
    }

    return candidates[0] || '192.168.42.39';
  } catch {
    return '192.168.42.39';
  }
}

const localLanIp = getLocalLanIp();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'network-ip-api',
      configureServer(server) {
        server.middlewares.use('/api/network-ip', (_req, res) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ip: getLocalLanIp() }));
        });
      }
    }
  ],
  define: {
    __LOCAL_LAN_IP__: JSON.stringify(localLanIp)
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: true, // Listen on all network interfaces (0.0.0.0) so phone can access
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 2000,
  }
});
