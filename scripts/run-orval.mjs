import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const schemaPath = path.join(rootDir, 'schema.yaml');
const configPath = path.join(rootDir, 'orval.config.cjs');
const orvalCliPath = path.join(
  rootDir,
  'node_modules',
  'orval',
  'dist',
  'bin',
  'orval.js',
);

const sanitizeSchemaForOrval = (schema) => {
  const lines = schema.split(/\r?\n/u);
  let inSecurityDefinitions = false;
  let currentScheme = null;

  return lines
    .map((line) => {
      if (!inSecurityDefinitions) {
        if (line.trim() === 'securityDefinitions:') {
          inSecurityDefinitions = true;
        }

        return line;
      }

      if (line.length > 0 && !line.startsWith(' ')) {
        inSecurityDefinitions = false;
        currentScheme = null;
        return line;
      }

      const schemeMatch = line.match(/^ {2}([A-Za-z0-9_]+):\s*$/u);

      if (schemeMatch) {
        currentScheme = schemeMatch[1];
        return line;
      }

      if (
        (currentScheme === 'AccessCookieAuth' ||
          currentScheme === 'RefreshCookieAuth') &&
        line.trim() === 'in: cookie'
      ) {
        return line.replace('cookie', 'header');
      }

      return line;
    })
    .join('\n');
};

const runOrval = (tempSchemaPath) =>
  new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [orvalCliPath, '--config', configPath],
      {
        cwd: rootDir,
        env: { ...process.env, ORVAL_INPUT: tempSchemaPath },
        stdio: 'inherit',
      },
    );

    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (signal) {
        reject(new Error(`orval exited with signal ${signal}`));
        return;
      }

      resolve(code ?? 1);
    });
  });

const main = async () => {
  const schema = await readFile(schemaPath, 'utf8');
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'smetapro-orval-'));
  const tempSchemaPath = path.join(tempDir, 'schema.yaml');

  try {
    await writeFile(tempSchemaPath, sanitizeSchemaForOrval(schema));
    process.exitCode = await runOrval(tempSchemaPath);
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
};

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : 'Failed to generate API client.',
  );
  process.exit(1);
});
