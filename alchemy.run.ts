import alchemy from 'alchemy';
import { Container, Worker } from 'alchemy/cloudflare';
import { loadDeploymentEnv } from './alchemy.env';

const deployment = loadDeploymentEnv();

const app = await alchemy('tuiport', {
  password: deployment.alchemyPassword,
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
    RELAY_TOKEN: alchemy.secret(deployment.relayToken),
    SSH_HOST_KEY_B64: alchemy.secret(deployment.sshHostKeyBase64),
  },
});

await app.finalize();
