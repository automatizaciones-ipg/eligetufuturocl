// start.cjs
const { spawn } = require('child_process');
const path = require('path');

const port = process.env.PORT || 4321;
const host = process.env.HOST || '0.0.0.0';

console.log(`Iniciando servidor Astro en ${host}:${port}`);

const child = spawn('node', ['dist/server/entry.mjs'], {
  env: {
    ...process.env,
    PORT: port.toString(),
    HOST: host,
  },
  stdio: 'inherit',
  cwd: __dirname,
});

child.on('error', (err) => {
  console.error('Error al iniciar el servidor:', err);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code);
});