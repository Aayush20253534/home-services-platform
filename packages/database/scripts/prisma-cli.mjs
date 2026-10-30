import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

const workspace = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = resolve(workspace, '../..');
config({ path: resolve(root, '.env'), override: false, quiet: true });

// The repository uses node-linker=hoisted to keep the Prisma CLI at this
// stable location across CI and Windows/macOS/Linux developer machines.
const cli = resolve(root, 'node_modules/prisma/build/index.js');
if (!existsSync(cli)) {
  console.error('Prisma CLI is missing. Run pnpm install from the repository root.');
  process.exit(1);
}
const result = spawnSync(process.execPath, [cli, ...process.argv.slice(2)], {
  cwd: workspace,
  env: process.env,
  stdio: 'inherit',
});
if (result.error) console.error(result.error);
process.exit(result.status ?? 1);
