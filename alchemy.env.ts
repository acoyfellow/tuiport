export interface DeploymentEnv {
  alchemyPassword: string;
  relayToken: string;
  sshHostKeyBase64: string;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`${name} is required; deployment stopped before changing resources.`);
  return value;
}

export function loadDeploymentEnv(env: NodeJS.ProcessEnv = process.env): DeploymentEnv {
  const alchemyPassword = required(env, 'ALCHEMY_PASSWORD');
  const relayToken = required(env, 'RELAY_TOKEN');
  const sshHostKeyBase64 = required(env, 'SSH_HOST_KEY_B64');

  if (relayToken.length < 32) {
    throw new Error('RELAY_TOKEN must contain at least 32 characters.');
  }

  let hostKey: string;
  try {
    hostKey = Buffer.from(sshHostKeyBase64, 'base64').toString('utf8');
  } catch {
    throw new Error('SSH_HOST_KEY_B64 must be a base64-encoded private key.');
  }
  if (!hostKey.includes('BEGIN OPENSSH PRIVATE KEY') && !hostKey.includes('BEGIN PRIVATE KEY')) {
    throw new Error('SSH_HOST_KEY_B64 must decode to an OpenSSH or PKCS#8 private key.');
  }

  return { alchemyPassword, relayToken, sshHostKeyBase64 };
}
