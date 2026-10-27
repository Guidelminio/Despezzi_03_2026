import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export type InsightsWorkerInput = {
  contract_version: 1;
  budget_usage: Array<{ category: string; usage_basis_points: number }>;
  goals: {
    active_count: number;
    completed_count: number;
    shortfall_count: number;
    deadline_only_count: number;
    on_track_count: number;
  };
};

export type InsightCode =
  | 'budget_limit_reached'
  | 'budget_near_limit'
  | 'goals_completed'
  | 'goals_plan_shortfall'
  | 'goals_deadline_estimate'
  | 'goals_plan_on_track';

export type WorkerInsight = {
  code: InsightCode;
  category: string | null;
  message: string;
};

export type InsightsWorkerOutput = {
  contract_version: 1;
  insights: WorkerInsight[];
};

const CONTRACT_VERSION = 1;
const MAX_INPUT_BYTES = 16 * 1024;
const MAX_OUTPUT_BYTES = 64 * 1024;
const MAX_STDERR_BYTES = 4 * 1024;
const MAX_ITEMS = 32;
const MAX_COUNT = 1_000_000;
const MAX_USAGE_BASIS_POINTS = 100_000_000;
const WORKER_TIMEOUT_MS = 2_000;
const MAX_CONCURRENT_WORKERS = 4;
const CATEGORY_PATTERN = /^[a-z0-9_-]{1,40}$/;
const ALLOWED_CATEGORIES = new Set([
  'alimentacao', 'moradia', 'transporte', 'lazer', 'saude', 'educacao', 'outros',
]);
const ALLOWED_CODES = new Set<InsightCode>([
  'budget_limit_reached',
  'budget_near_limit',
  'goals_completed',
  'goals_plan_shortfall',
  'goals_deadline_estimate',
  'goals_plan_on_track',
]);
const WORKER_PATH = fileURLToPath(new URL('../../worker/insights_worker.py', import.meta.url));
let activeWorkerCount = 0;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  return Object.keys(value).length === expected.length
    && expected.every((key) => Object.prototype.hasOwnProperty.call(value, key));
}

function isBoundedCount(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0 && Number(value) <= MAX_COUNT;
}

function validateInput(input: InsightsWorkerInput): void {
  const candidate: unknown = input;
  if (!isRecord(candidate) || !hasExactKeys(candidate, ['contract_version', 'budget_usage', 'goals'])) {
    throw new Error('Invalid insights worker input.');
  }
  if (candidate.contract_version !== CONTRACT_VERSION || !Array.isArray(candidate.budget_usage) || candidate.budget_usage.length > MAX_ITEMS) {
    throw new Error('Invalid insights worker input.');
  }
  const seen = new Set<string>();
  for (const item of candidate.budget_usage) {
    if (!isRecord(item) || !hasExactKeys(item, ['category', 'usage_basis_points'])) {
      throw new Error('Invalid insights worker input.');
    }
    if (
      typeof item.category !== 'string'
      || !CATEGORY_PATTERN.test(item.category)
      || !ALLOWED_CATEGORIES.has(item.category)
      || seen.has(item.category)
      || !Number.isSafeInteger(item.usage_basis_points)
      || Number(item.usage_basis_points) < 0
      || Number(item.usage_basis_points) > MAX_USAGE_BASIS_POINTS
    ) {
      throw new Error('Invalid insights worker input.');
    }
    seen.add(item.category);
  }
  const goals = candidate.goals;
  const goalKeys = ['active_count', 'completed_count', 'shortfall_count', 'deadline_only_count', 'on_track_count'];
  if (!isRecord(goals) || !hasExactKeys(goals, goalKeys) || !goalKeys.every((key) => isBoundedCount(goals[key]))) {
    throw new Error('Invalid insights worker input.');
  }
  if (
    Number(goals.active_count) + Number(goals.completed_count) > MAX_COUNT
    || Number(goals.shortfall_count) + Number(goals.deadline_only_count) + Number(goals.on_track_count) !== Number(goals.active_count)
  ) {
    throw new Error('Invalid insights worker input.');
  }
}

function validateOutput(value: unknown): InsightsWorkerOutput {
  if (!isRecord(value) || !hasExactKeys(value, ['contract_version', 'insights'])) {
    throw new Error('Invalid insights worker output.');
  }
  if (value.contract_version !== CONTRACT_VERSION || !Array.isArray(value.insights) || value.insights.length > MAX_ITEMS + 4) {
    throw new Error('Invalid insights worker output.');
  }
  const insights = value.insights.map((item): WorkerInsight => {
    if (!isRecord(item) || !hasExactKeys(item, ['code', 'category', 'message'])) {
      throw new Error('Invalid insights worker output.');
    }
    if (
      typeof item.code !== 'string'
      || !ALLOWED_CODES.has(item.code as InsightCode)
      || typeof item.message !== 'string'
      || item.message.length < 1
      || item.message.length > 280
      || item.message.includes('\n')
    ) {
      throw new Error('Invalid insights worker output.');
    }
    const code = item.code as InsightCode;
    if (code.startsWith('budget_')) {
      if (typeof item.category !== 'string' || !ALLOWED_CATEGORIES.has(item.category)) {
        throw new Error('Invalid insights worker output.');
      }
    } else if (item.category !== null) {
      throw new Error('Invalid insights worker output.');
    }
    return { code, category: item.category as string | null, message: item.message };
  });
  return { contract_version: CONTRACT_VERSION, insights };
}

function workerEnvironment(): NodeJS.ProcessEnv {
  const environment: NodeJS.ProcessEnv = {
    PYTHONUTF8: '1',
    PYTHONIOENCODING: 'utf-8',
  };
  if (process.env.PATH) environment.PATH = process.env.PATH;
  if (process.platform === 'win32') {
    for (const key of ['SystemRoot', 'WINDIR', 'TEMP', 'TMP']) {
      if (process.env[key]) environment[key] = process.env[key];
    }
  }
  return environment;
}

export async function runInsightsWorker(input: InsightsWorkerInput): Promise<InsightsWorkerOutput> {
  validateInput(input);
  const serialized = JSON.stringify(input);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_INPUT_BYTES) {
    throw new Error('Insights worker input exceeds the size limit.');
  }
  if (activeWorkerCount >= MAX_CONCURRENT_WORKERS) {
    throw new Error('Insights worker concurrency limit reached.');
  }

  const pythonExecutable = process.env.PYTHON_EXECUTABLE
    || (process.platform === 'win32' ? 'python' : 'python3');
  activeWorkerCount += 1;

  return new Promise((resolve, reject) => {
    let child: ChildProcessWithoutNullStreams;
    try {
      child = spawn(pythonExecutable, ['-I', '-X', 'utf8', WORKER_PATH], {
        cwd: process.cwd(),
        env: workerEnvironment(),
        shell: false,
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch {
      activeWorkerCount -= 1;
      reject(new Error('Insights worker could not start.'));
      return;
    }

    let stdout = Buffer.alloc(0);
    let timedOut = false;
    let outputTooLarge = false;
    let stderrBytes = 0;
    let settled = false;
    let timer: NodeJS.Timeout | undefined;
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      activeWorkerCount -= 1;
      callback();
    };
    timer = setTimeout(() => {
      timedOut = true;
      child.kill();
    }, WORKER_TIMEOUT_MS);
    timer.unref();

    child.stdout.on('data', (chunk: Buffer) => {
      if (stdout.length + chunk.length > MAX_OUTPUT_BYTES) {
        outputTooLarge = true;
        child.kill();
        return;
      }
      stdout = Buffer.concat([stdout, chunk]);
    });
    // Consume stderr without logging it and stop a noisy process at a fixed bound.
    child.stderr.on('data', (chunk: Buffer) => {
      stderrBytes += chunk.length;
      if (stderrBytes > MAX_STDERR_BYTES) {
        outputTooLarge = true;
        child.kill();
      }
    });
    child.stdin.on('error', () => undefined);
    child.on('error', () => finish(() => reject(new Error('Insights worker could not start.'))));
    child.on('close', (code) => finish(() => {
      if (timedOut) {
        reject(new Error('Insights worker timed out.'));
        return;
      }
      if (outputTooLarge) {
        reject(new Error('Insights worker output exceeds the size limit.'));
        return;
      }
      if (code !== 0) {
        reject(new Error('Insights worker returned a failure status.'));
        return;
      }
      try {
        resolve(validateOutput(JSON.parse(stdout.toString('utf8'))));
      } catch {
        reject(new Error('Insights worker returned an invalid response.'));
      }
    }));

    child.stdin.end(serialized, 'utf8');
  });
}
