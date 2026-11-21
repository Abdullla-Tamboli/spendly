import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readdirSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env.test'), override: true });

// Use a locally installed executable when available; each suite still gets an
// isolated temporary MongoDB process and database, never the user's database.
const mongoRoot = resolve(process.env.ProgramFiles || 'C:/Program Files', 'MongoDB/Server');
if (process.platform === 'win32' && !process.env.MONGOMS_SYSTEM_BINARY && existsSync(mongoRoot)) {
  const version = readdirSync(mongoRoot).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })).find((v) => existsSync(resolve(mongoRoot, v, 'bin/mongod.exe')));
  if (version) {
    process.env.MONGOMS_SYSTEM_BINARY = resolve(mongoRoot, version, 'bin/mongod.exe');
    process.env.MONGOMS_VERSION = `${version}.0`;
  }
}
