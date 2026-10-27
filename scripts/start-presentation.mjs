import { spawn } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';
const nodeMajor = Number(process.versions.node.split('.')[0]);

if (nodeMajor < 20) {
  console.error(`A apresentação requer Node.js 20 ou superior. Versão detectada: ${process.versions.node}`);
  process.exit(1);
}

function isPrivateIpv4(address) {
  const parts = address.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  return parts[0] === 10
    || (parts[0] === 192 && parts[1] === 168)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31);
}

const privateAddresses = [...new Set(Object.values(os.networkInterfaces())
  .flatMap((interfaces) => interfaces ?? [])
  .filter((entry) => entry.family === 'IPv4' && !entry.internal && isPrivateIpv4(entry.address))
  .map((entry) => entry.address))];

const port = process.env.PRESENTATION_PORT || '3000';
const databasePath = path.join(projectRoot, 'database-presentation.sqlite');
const pythonExecutable = process.env.PYTHON_EXECUTABLE || (isWindows ? 'python' : 'python3');
const env = {
  ...process.env,
  NODE_ENV: 'production',
  HOST: '0.0.0.0',
  PORT: port,
  DEMO_MODE: 'true',
  DATABASE_PATH: databasePath,
  PYTHON_EXECUTABLE: pythonExecutable,
};
const npmCommand = isWindows ? 'npm.cmd' : 'npm';

function runNpm(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(npmCommand, args, {
      cwd: projectRoot,
      env,
      shell: isWindows,
      stdio: 'inherit',
      windowsHide: false,
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => resolve({ code: code ?? (signal ? 1 : 0), child }));
  });
}

console.log('\nDespezi — modo de apresentação local');
console.log(`Banco descartável: ${databasePath}`);
console.log(`No computador: http://localhost:${port}`);
if (privateAddresses.length) {
  console.log('No celular, conectado à mesma rede Wi-Fi privada:');
  for (const address of privateAddresses) console.log(`  http://${address}:${port}`);
} else {
  console.log('Nenhum IPv4 privado foi detectado; conecte o computador à rede Wi-Fi da apresentação.');
}
console.log('Use somente dados fictícios. Autorize a porta apenas no perfil privado do firewall; não encaminhe portas nem crie túnel público.');
console.log('Google OAuth e envio de e-mail ficam desativados neste modo. Pressione Ctrl+C para encerrar.\n');

const build = await runNpm(['run', 'build']);
if (build.code !== 0) process.exit(build.code);

const server = spawn(npmCommand, ['run', 'start'], {
  cwd: projectRoot,
  env,
  shell: isWindows,
  stdio: 'inherit',
  windowsHide: false,
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, () => {
    if (server.exitCode === null && server.signalCode === null) server.kill(signal);
  });
}

server.once('error', (error) => {
  console.error('Não foi possível iniciar o servidor de apresentação:', error.message);
  process.exitCode = 1;
});
server.once('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
