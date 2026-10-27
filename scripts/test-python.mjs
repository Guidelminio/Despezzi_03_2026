import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const testArguments = ['-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_*.py'];
const configuredPython = process.env.PYTHON_EXECUTABLE;
const candidates = configuredPython
  ? [{ command: configuredPython, args: testArguments }]
  : process.platform === 'win32'
    ? [{ command: 'py', args: ['-3', ...testArguments] }]
    : [{ command: 'python3', args: testArguments }, { command: 'python', args: testArguments }];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      env: process.env,
      shell: false,
      stdio: 'inherit',
      windowsHide: true,
    });
    child.once('error', reject);
    child.once('close', (code) => resolve(code ?? 1));
  });
}

let lastError;
let interpreterStarted = false;
for (const candidate of candidates) {
  try {
    const exitCode = await run(candidate.command, candidate.args);
    process.exitCode = exitCode;
    interpreterStarted = true;
    break;
  } catch (error) {
    lastError = error;
    if (configuredPython) break;
  }
}

if (interpreterStarted) process.exit(process.exitCode ?? 0);
console.error('Python 3 não foi encontrado. Instale Python 3 ou configure PYTHON_EXECUTABLE.');
if (lastError instanceof Error) console.error(lastError.message);
process.exitCode = 1;
