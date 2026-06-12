import { connect } from 'node:net';
import { BoxRenderable, TextRenderable } from '@opentui/core';
import { createServer } from '@opentui/ssh';

const hostKey = process.env.SSH_HOST_KEY_B64
  ? { pem: Buffer.from(process.env.SSH_HOST_KEY_B64, 'base64').toString('utf8') }
  : { path: '/tmp/tuiport_host_key' };

const ssh = createServer({
  hostKey,
  auth: { publicKey: 'any' },
  startupBanner: 'Tuiport · OpenTUI over SSH on Cloudflare',
}).serve((session) => {
  const { renderer } = session;
  const shell = new BoxRenderable(renderer, {
    width: '100%',
    height: '100%',
    border: true,
    borderStyle: 'rounded',
    title: ' tuiport ',
    titleAlignment: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  });
  shell.add(
    new TextRenderable(renderer, {
      content: [
        'OpenTUI is running inside a Cloudflare Container.',
        '',
        `hello ${session.identity.username} · ${session.cols}×${session.rows}`,
        '',
        'press q to disconnect',
      ].join('\n'),
    }),
  );
  renderer.root.add(shell);
  renderer.keyInput.on('keypress', (key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) session.end();
  });
});

await ssh.listen(2222, '0.0.0.0');

Bun.serve<{ socket?: ReturnType<typeof connect> }>({
  port: 8080,
  fetch(request, server) {
    const url = new URL(request.url);
    if (url.pathname === '/health') return Response.json({ ok: true, service: 'tuiport' });
    if (url.pathname !== '/bridge') return new Response('not found', { status: 404 });
    if (!server.upgrade(request, { data: {} }))
      return new Response('upgrade required', { status: 426 });
  },
  websocket: {
    open(ws) {
      const socket = connect({ host: '127.0.0.1', port: 2222 });
      ws.data.socket = socket;
      socket.on('data', (chunk) => ws.send(chunk));
      socket.on('close', () => ws.close());
      socket.on('error', () => ws.close(1011, 'ssh bridge failed'));
    },
    message(ws, message) {
      ws.data.socket?.write(
        typeof message === 'string' ? Buffer.from(message) : Buffer.from(message),
      );
    },
    close(ws) {
      ws.data.socket?.destroy();
    },
  },
});

console.log('tuiport ready: http :8080, ssh :2222');
