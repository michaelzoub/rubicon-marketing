// Cross-platform dev launcher: runs the Next.js app and the Mint docs server
// together, and tears both down when one exits or the process is interrupted.
// Works on macOS, Linux, and Windows (no `sh`/`trap` required).
import { spawn } from 'node:child_process';
import process from 'node:process';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

const procs = [
  spawn('next', ['dev'], { stdio: 'inherit', shell: true }),
  spawn(npx, ['--yes', 'mint@latest', 'dev', '--port', '3002', '--no-open'], {
    stdio: 'inherit',
    shell: true,
    cwd: 'docs',
  }),
];

let shuttingDown = false;
function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const p of procs) {
    if (!p.killed) p.kill('SIGTERM');
  }
  process.exit(code);
}

for (const p of procs) {
  p.on('exit', (code) => shutdown(code ?? 0));
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
