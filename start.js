import fs from 'fs';
import { spawn } from 'child_process';

const log = (msg) => {
  fs.appendFileSync('startup.log', msg + '\n');
  console.log(msg);
};

log('Iniciando start.js de diagnóstico');
log('PORT=' + process.env.PORT);
log('HOST=' + process.env.HOST);
log('PWD=' + process.cwd());

const child = spawn('node', ['dist/server/entry.mjs'], { stdio: 'pipe' });

child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
  fs.appendFileSync('startup.log', 'STDERR: ' + data);
});

child.on('error', (err) => {
  log('Error al ejecutar: ' + err.message);
  process.exit(1);
});

child.on('exit', (code) => {
  log('Proceso hijo terminó con código ' + code);
  process.exit(code);
});