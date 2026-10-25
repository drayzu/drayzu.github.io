// Publishes the site at https://users.dcc.uchile.cl/~direyes/ (the same build, under that base).
// Uses the deployment SSH key set up for AstroIngeniería. The previous upload is kept as ~/public_www_previous until the next deploy.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const host = 'direyes@anakena.dcc.uchile.cl';
const key = resolve(process.env.DCC_SSH_KEY || join(homedir(), '.ssh', 'astroingenieria-dcc-deploy'));
const ssh = ['-o', 'BatchMode=yes', '-o', 'IdentitiesOnly=yes', '-o', 'StrictHostKeyChecking=yes', '-o', 'ConnectTimeout=15', '-i', key];
const outDir = 'dist-dcc';

function run(command, args) {
  const r = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' && command === 'npx' });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${command} ${args.join(' ')} failed (${r.status})`);
}

if (!existsSync(key)) { console.error(`No SSH key at ${key}`); process.exit(1); }

run('npx', ['tsc']);
run('npx', ['vite', 'build', '--base=/~direyes/', '--outDir', outDir]);

run('ssh', [...ssh, host, 'rm -rf ~/public_www_new && mkdir ~/public_www_new']);
run('scp', [...ssh, '-r', `${outDir}/.`, `${host}:public_www_new/`]);
run('ssh', [...ssh, host,
  'chmod -R u=rwX,go=rX ~/public_www_new && rm -rf ~/public_www_previous && mv ~/public_www ~/public_www_previous && mv ~/public_www_new ~/public_www']);

console.log('Published: https://users.dcc.uchile.cl/~direyes/');
