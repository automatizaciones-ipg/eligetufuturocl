import { spawn } from 'child_process';

// Hereda TODO el entorno automáticamente y arranca el servidor
const child = spawn('node', ['dist/server/entry.mjs'], {
  stdio: 'inherit'
});

child.on('exit', (code) => process.exit(code));