import { defineConfig } from 'vite';

// Same-origin loopback test proxy only; no public binding or Backend CORS change.
export default defineConfig(({ mode }) => mode === 'local_fixture' ? {
  server: { host: '127.0.0.1', proxy: { '/api/v1': { target: 'http://127.0.0.1:8789' } } },
} : {});
