#!/usr/bin/env bun
/**
 * One-command Tuiport setup.
 *
 *   wrangler login   (or this script will start it)
 *   bun run setup
 *
 * Deploys the Worker + Container to the Cloudflare account you are logged into,
 * generates the two machine secrets, and stores them with the bulk secrets API.
 * No secret is ever pasted into a web form. Public SSH (relay + Spectrum) is an
 * explicit follow-up step, printed at the end with your real Worker URL.
 *
 * Implementation notes (verified against wrangler source):
 *   - Login state is read from `wrangler whoami`.
 *   - The deployed URL is read from wrangler's structured ND-JSON output
 *     (WRANGLER_OUTPUT_FILE_PATH, type:"deploy" -> targets), not by scraping
 *     stdout.
 *   - Secrets are sent to `wrangler secret bulk` as a JSON object over stdin,
 *     which wrangler parses with parseJSON (no trailing-newline pitfall that
 *     affects single `secret put`).
 */
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { $ } from 'bun';

$.throws(true);

function step(message: string) {
  console.log(`\n\x1b[1m• ${message}\x1b[0m`);
}

async function isLoggedIn(): Promise<boolean> {
  try {
    const out = await $`bunx wrangler whoami`.quiet();
    return !out.stdout.toString().toLowerCase().includes('not authenticated');
  } catch {
    return false;
  }
}

/** Read the workers.dev hostname from wrangler's ND-JSON deploy output. */
function deployedHostFromOutput(outputFile: string): string | null {
  let lines: string[];
  try {
    lines = readFileSync(outputFile, 'utf8').trim().split('\n');
  } catch {
    return null;
  }
  for (const line of lines) {
    let entry: { type?: string; targets?: unknown };
    try {
      entry = JSON.parse(line);
    } catch {
      continue;
    }
    if (entry.type !== 'deploy' || !Array.isArray(entry.targets)) continue;
    const targets = entry.targets.filter((t): t is string => typeof t === 'string');
    const workersDev = targets.find((t) => t.includes('.workers.dev'));
    const chosen = workersDev ?? targets.find((t) => t.startsWith('https://'));
    if (!chosen) continue;
    try {
      return new URL(chosen).host;
    } catch {
      return chosen.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    }
  }
  return null;
}

console.log('\x1b[1mTuiport setup\x1b[0m — deploys to the account you are logged into.');

if (!(await isLoggedIn())) {
  step('Logging in to Cloudflare (a browser window will open)');
  await $`bunx wrangler login`;
}

step('Generating RELAY_TOKEN and SSH_HOST_KEY_B64');
const gen = await $`bash scripts/gen-secrets.sh`.quiet();
const secrets: Record<string, string> = {};
for (const line of gen.stdout.toString().trim().split('\n')) {
  const eq = line.indexOf('=');
  if (eq > 0) secrets[line.slice(0, eq)] = line.slice(eq + 1);
}
if (!secrets.RELAY_TOKEN || !secrets.SSH_HOST_KEY_B64) {
  throw new Error('Secret generation failed; check that ssh-keygen and openssl are installed.');
}

const outDir = mkdtempSync(join(tmpdir(), 'tuiport-deploy-'));
const outputFile = join(outDir, 'wrangler-output.ndjson');
let deployedHost: string | null = null;
try {
  step('Building and deploying the Worker and Container');
  await $`bun run build`;
  await $`bunx wrangler deploy`.env({ ...process.env, WRANGLER_OUTPUT_FILE_PATH: outputFile });
  deployedHost = deployedHostFromOutput(outputFile);
} finally {
  rmSync(outDir, { recursive: true, force: true });
}

step('Storing secrets with the bulk secrets API');
const payload = JSON.stringify({
  RELAY_TOKEN: secrets.RELAY_TOKEN,
  SSH_HOST_KEY_B64: secrets.SSH_HOST_KEY_B64,
});
await $`bunx wrangler secret bulk < ${new Blob([payload])}`;

// Save locally (gitignored) so you can start the relay with the same token.
await Bun.write(
  '.dev.vars',
  `# Written by 'bun run setup'. Gitignored. Used to start the relay.\nRELAY_TOKEN=${secrets.RELAY_TOKEN}\nSSH_HOST_KEY_B64=${secrets.SSH_HOST_KEY_B64}\n`,
);

const bridge = deployedHost
  ? `wss://${deployedHost}/bridge`
  : 'wss://YOUR-WORKER.workers.dev/bridge';
const siteLine = deployedHost ? `  Site:  https://${deployedHost}` : '';

console.log(`
\x1b[32m✓ Deployed.\x1b[0m The site and live browser demo are running now — no
  further steps are needed to use Tuiport in the browser.
${siteLine}

\x1b[1mTo expose plain \`ssh <hostname>\`\x1b[0m (a separate step from the deploy):

  1. Start the byte relay on any host with a public TCP address:

       cd relay && go build
       ./tuiport-relay \\
         -listen :22 \\
         -upstream ${bridge} \\
         -token "$RELAY_TOKEN"      # value saved in .dev.vars

  2. Point a Cloudflare Spectrum SSH application (tcp/22) at the relay.
  3. Connect: ssh your-hostname

  RELAY_TOKEN and SSH_HOST_KEY_B64 were generated for you, stored as Worker
  secrets, and saved to .dev.vars (gitignored) so the relay can reuse them.
`);
