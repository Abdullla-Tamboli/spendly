import { resolve } from 'path';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';

Object.assign(process.env, { NODE_ENV: 'test', PORT: '5001', MONGODB_URI: 'mongodb://127.0.0.1:27017/spendly-test', JWT_SECRET: 'isolated-tests-only-not-a-production-secret', JWT_EXPIRES_IN: '1d', CLIENT_ORIGIN: 'http://localhost:5173', CLOUDINARY_CLOUD_NAME: '', CLOUDINARY_API_KEY: '', CLOUDINARY_API_SECRET: '' });

// Use a locally installed executable when available; each suite still gets an
// isolated temporary MongoDB process and database, never the user's database.
const mongoRoot = resolve(process.env.ProgramFiles || 'C:/Program Files', 'MongoDB/Server');
if (process.platform === 'win32' && !process.env.MONGOMS_SYSTEM_BINARY && existsSync(mongoRoot)) {
  const version = readdirSync(mongoRoot).sort((a, b) => b.localeCompare(a, undefined, { numeric: true })).find((v) => existsSync(resolve(mongoRoot, v, 'bin/mongod.exe')));
  if (version) {
    process.env.MONGOMS_SYSTEM_BINARY = resolve(mongoRoot, version, 'bin/mongod.exe');
    const info = execFileSync(process.env.MONGOMS_SYSTEM_BINARY, ['--version'], { encoding: 'utf8', windowsHide: true });
    process.env.MONGOMS_VERSION = info.match(/db version v([\d.]+)/)?.[1] || `${version}.0`;
  }
}
