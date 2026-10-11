// Native sandbox harness: the production gateway, not a mock of AppAPI or WeKan.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const { configuration, createGateway } = await import(pathToFileURL(process.env.NEXTCLOUD_GATEWAY_MODULE));
const config = configuration();
const backendPort = Number(process.env.WEKAN_BACKEND_PORT);
const server = createGateway({ config, key: process.env.WEKAN_NEXTCLOUD_PROXY_KEY, backendPort,
  isReady: async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${backendPort}${config.publicUrl.pathname}_nextcloud/health`, { signal: AbortSignal.timeout(3000) });
      return response.ok && (await response.json()).nextcloud === 1;
    }
    catch { return false; }
  },
});
if (process.env.NATIVE_FRP_SOCKET) {
  const socket = process.env.NATIVE_FRP_SOCKET;
  try { fs.unlinkSync(socket); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await new Promise(resolve => server.listen(socket, resolve));
  fs.chmodSync(socket, 0o600);
  const { frpConfiguration } = await import(pathToFileURL(process.env.NEXTCLOUD_GATEWAY_MODULE.replace('gateway.mjs', 'runtime.mjs')));
  fs.writeFileSync(process.env.NATIVE_FRP_CONFIG,
    frpConfiguration(config, process.env, socket, process.env.NATIVE_FRP_CERTS), { mode: 0o600 });
} else server.listen(config.port, config.host);
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => {
  server.closeAllConnections(); server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 2000).unref();
});
