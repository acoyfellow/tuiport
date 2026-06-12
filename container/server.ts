import { connect } from 'node:net';
import { Readable, Writable } from 'node:stream';
import { BoxRenderable, type CliRenderer, createCliRenderer, TextRenderable } from '@opentui/core';
import { createServer } from '@opentui/ssh';

const MAX_DEMO_SESSIONS = 8;
const MAX_INPUT_BYTES = 8 * 1024;
const DEMO_IDLE_MS = 2 * 60 * 1000;
const DEMO_MAX_MS = 10 * 60 * 1000;
let activeDemoSessions = 0;

type DemoRuntime = {
  renderer?: CliRenderer;
  stdin?: Readable;
  stdout?: Writable;
  idleTimer?: ReturnType<typeof setTimeout>;
  maxTimer?: ReturnType<typeof setTimeout>;
  outputReady?: boolean;
  closed: boolean;
};

type SocketData = {
  mode: 'ssh' | 'demo';
  socket?: ReturnType<typeof connect>;
  demo?: DemoRuntime;
  cols?: number;
  rows?: number;
  colo?: string;
};

function mountTuiport(
  renderer: CliRenderer,
  options: { identity: string; environment: string; onEnd: () => void },
) {
  const panels = [
    {
      label: 'HOW IT WORKS',
      body: [
        'You are controlling an OpenTUI app running in a real',
        'Cloudflare Container. Your browser sends keys; the',
        'Container sends terminal frames back.',
      ],
    },
    {
      label: 'SAFETY',
      body: [
        'This demo is an app, not a shell.',
        'It cannot run commands or access a filesystem.',
        'The session closes automatically when idle.',
      ],
    },
    {
      label: 'RUNTIME',
      body: [
        `session    ${options.identity}`,
        `edge       ${options.environment}`,
        'compute    Cloudflare Container',
        'state      temporary / per visitor',
      ],
    },
  ];
  let selected = 0;

  const shell = new BoxRenderable(renderer, {
    width: '100%',
    height: '100%',
    border: true,
    borderStyle: 'rounded',
    title: ' tuiport / live ',
    titleAlignment: 'center',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 2,
    paddingLeft: 3,
  });
  const content = new TextRenderable(renderer, {
    width: '100%',
    content: '',
  });
  shell.add(content);
  renderer.root.add(shell);

  const paint = () => {
    const panel = panels[selected];
    content.content = [
      'TUIPORT LIVE DEMO',
      'A real OpenTUI session on Cloudflare',
      '',
      panels
        .map((item, index) => `${index === selected ? '>' : ' '} ${index + 1}. ${item.label}`)
        .join('   '),
      '',
      ...panel.body,
      '',
      '[1/2/3] choose view    [q] close',
    ].join('\n');
  };
  paint();

  renderer.keyInput.on('keypress', (key) => {
    if (key.name === '1') {
      selected = 0;
      paint();
    } else if (key.name === '2') {
      selected = 1;
      paint();
    } else if (key.name === '3') {
      selected = 2;
      paint();
    } else if (key.name === 'left' || key.name === 'h') {
      selected = (selected + panels.length - 1) % panels.length;
      paint();
    } else if (key.name === 'right' || key.name === 'l' || key.name === 'tab') {
      selected = (selected + 1) % panels.length;
      paint();
    } else if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
      options.onEnd();
    }
  });
}

const hostKey = process.env.SSH_HOST_KEY_B64
  ? { pem: Buffer.from(process.env.SSH_HOST_KEY_B64, 'base64').toString('utf8') }
  : { path: '/tmp/tuiport_host_key' };

const ssh = createServer({
  hostKey,
  auth: { publicKey: 'any' },
  startupBanner: 'Tuiport · OpenTUI over SSH on Cloudflare',
}).serve((session) => {
  mountTuiport(session.renderer, {
    identity: session.identity.username,
    environment: 'SSH / Cloudflare Spectrum',
    onEnd: () => session.end(),
  });
});

await ssh.listen(2222, '0.0.0.0');

function closeDemo(ws: Bun.ServerWebSocket<SocketData>) {
  const demo = ws.data.demo;
  if (!demo || demo.closed) return;
  demo.closed = true;
  if (demo.idleTimer) clearTimeout(demo.idleTimer);
  if (demo.maxTimer) clearTimeout(demo.maxTimer);
  demo.renderer?.destroy();
  demo.stdin?.destroy();
  demo.stdout?.end();
  activeDemoSessions = Math.max(0, activeDemoSessions - 1);
}

function touchDemo(ws: Bun.ServerWebSocket<SocketData>) {
  const demo = ws.data.demo;
  if (!demo || demo.closed) return;
  if (demo.idleTimer) clearTimeout(demo.idleTimer);
  demo.idleTimer = setTimeout(() => ws.close(1000, 'idle timeout'), DEMO_IDLE_MS);
}

async function openDemo(ws: Bun.ServerWebSocket<SocketData>) {
  if (activeDemoSessions >= MAX_DEMO_SESSIONS) {
    ws.close(1013, 'demo at capacity');
    return;
  }
  activeDemoSessions += 1;
  const demo: DemoRuntime = { closed: false };
  ws.data.demo = demo;

  const stdin = new Readable({ read() {} });
  const stdout = new Writable({
    write(chunk, _encoding, callback) {
      if (demo.closed || !demo.outputReady) return callback();
      try {
        ws.send(Buffer.from(chunk));
        callback();
      } catch (error) {
        callback(error as Error);
      }
    },
  }) as Writable & { columns: number; rows: number };
  const cols = Math.max(40, Math.min(160, ws.data.cols || 80));
  const rows = Math.max(18, Math.min(60, ws.data.rows || 24));
  stdout.columns = cols;
  stdout.rows = rows;
  demo.stdin = stdin;
  demo.stdout = stdout;
  demo.maxTimer = setTimeout(() => ws.close(1000, 'session complete'), DEMO_MAX_MS);
  touchDemo(ws);

  try {
    const renderer = await createCliRenderer({
      stdin: stdin as NodeJS.ReadStream,
      stdout: stdout as NodeJS.WriteStream,
      width: cols,
      height: rows,
      remote: true,
      exitOnCtrlC: false,
      exitSignals: [],
      consoleMode: 'disabled',
      useMouse: false,
      useKittyKeyboard: null,
      targetFps: 30,
    });
    if (demo.closed) {
      renderer.destroy();
      return;
    }
    demo.renderer = renderer;
    demo.outputReady = true;
    ws.send('\u001b[?1049h\u001b[2J\u001b[H\u001b[?25l');
    mountTuiport(renderer, {
      identity: `visitor-${crypto.randomUUID().slice(0, 6)}`,
      environment: ws.data.colo || 'Cloudflare edge',
      onEnd: () => ws.close(1000, 'session closed'),
    });
  } catch (error) {
    console.error('demo renderer failed', error);
    ws.close(1011, 'renderer failed');
  }
}

Bun.serve<SocketData>({
  port: 8080,
  fetch(request, server) {
    const url = new URL(request.url);
    const innerPath = request.headers.get('x-tuiport-inner-path') || url.pathname;
    if (innerPath === '/health') return Response.json({ ok: true, service: 'tuiport' });
    if (innerPath === '/demo') {
      const cols = Number(url.searchParams.get('cols')) || 80;
      const rows = Number(url.searchParams.get('rows')) || 24;
      const colo = request.headers.get('x-tuiport-colo') || 'Cloudflare edge';
      if (!server.upgrade(request, { data: { mode: 'demo', cols, rows, colo } })) {
        return new Response('upgrade required', { status: 426 });
      }
      return;
    }
    if (innerPath !== '/bridge') return new Response('not found', { status: 404 });
    if (!server.upgrade(request, { data: { mode: 'ssh' } })) {
      return new Response('upgrade required', { status: 426 });
    }
  },
  websocket: {
    open(ws) {
      if (ws.data.mode === 'demo') {
        void openDemo(ws);
        return;
      }
      const socket = connect({ host: '127.0.0.1', port: 2222 });
      ws.data.socket = socket;
      socket.on('data', (chunk) => ws.send(chunk));
      socket.on('close', () => ws.close());
      socket.on('error', () => ws.close(1011, 'ssh bridge failed'));
    },
    message(ws, message) {
      if (ws.data.mode === 'ssh') {
        ws.data.socket?.write(
          typeof message === 'string' ? Buffer.from(message) : Buffer.from(message),
        );
        return;
      }
      const demo = ws.data.demo;
      if (!demo || demo.closed) return;
      touchDemo(ws);
      if (typeof message === 'string') {
        try {
          const control = JSON.parse(message) as { type?: string; cols?: number; rows?: number };
          if (control.type === 'resize' && control.cols && control.rows) {
            const cols = Math.max(40, Math.min(160, control.cols));
            const rows = Math.max(18, Math.min(60, control.rows));
            const stdout = demo.stdout as
              | (Writable & { columns: number; rows: number })
              | undefined;
            if (stdout) {
              stdout.columns = cols;
              stdout.rows = rows;
            }
            demo.renderer?.resize(cols, rows);
          }
        } catch {
          // Unknown text control frames are ignored.
        }
        return;
      }
      const bytes = Buffer.from(message);
      if (bytes.byteLength <= MAX_INPUT_BYTES) demo.stdin?.push(bytes);
    },
    close(ws) {
      if (ws.data.mode === 'demo') closeDemo(ws);
      else ws.data.socket?.destroy();
    },
  },
});

console.log('tuiport ready: http :8080, ssh :2222');
