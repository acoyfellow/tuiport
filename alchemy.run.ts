import alchemy from 'alchemy';
import { Container, Worker } from 'alchemy/cloudflare';

const app = await alchemy('tuiport', {
  password: process.env.ALCHEMY_PASSWORD || 'tuiport-local',
});

const TUIPORT = await Container('tuiport-app', {
  className: 'TuiportContainer',
  maxInstances: 1,
  instanceType: 'lite',
  adopt: true,
  build: { context: '.', dockerfile: 'container/Dockerfile' },
});

export const WORKER = await Worker('tuiport', {
  name: 'tuiport',
  entrypoint: './build/worker.bundled.mjs',
  compatibility: 'node',
  compatibilityDate: '2026-06-12',
  adopt: true,
  observability: { enabled: true },
  url: true,
  domains: [{ domainName: 'tuiport.coey.dev', adopt: true }],
  bindings: {
    TUIPORT,
    RELAY_TOKEN: alchemy.secret(process.env.RELAY_TOKEN || 'replace-me-before-production'),
    SSH_HOST_KEY_B64: alchemy.secret(process.env.SSH_HOST_KEY_B64 || ''),
  },
});

await app.finalize();
