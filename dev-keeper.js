const { spawn } = require('child_process');
const fs = require('fs');

function startServer() {
  const logFile = '/home/z/my-project/dev.log';
  fs.appendFileSync(logFile, `\n[${new Date().toISOString()}] Starting Next.js dev server...\n`);
  
  const out = fs.openSync(logFile, 'a');
  const err = fs.openSync(logFile, 'a');
  
  const child = spawn('npx', ['next', 'dev', '-p', '3000'], {
    cwd: '/home/z/my-project',
    stdio: ['ignore', out, err],
    detached: true
  });
  
  child.unref();
  
  child.on('exit', (code) => {
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] Server exited with code ${code}, restarting in 5s...\n`);
    setTimeout(startServer, 5000);
  });
}

startServer();

// Keep alive heartbeat
setInterval(() => {}, 60000);
