#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('🏥 CLINIC APPOINTMENT SYSTEM - STARTING');
console.log('='.repeat(70));
console.log('\n📋 Available Services:\n');
console.log('   🌐 Frontend:  http://localhost:5173/');
console.log('   🔧 Backend:   http://localhost:3001/');
console.log('\n' + '='.repeat(70) + '\n');

const processes = [
  {
    name: 'backend',
    command: 'npm',
    args: ['run', 'backend:dev'],
    cwd: path.join(__dirname),
  },
  {
    name: 'frontend',
    command: 'npm',
    args: ['run', 'frontend:dev'],
    cwd: path.join(__dirname),
  },
];

const children = new Map();
let shuttingDown = false;

const startChild = ({ name, command, args, cwd }) => {
  console.log(`Starting ${name}...`);
  const child = spawn(command, args, {
    cwd,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (error) => {
    console.error(`❌ Failed to start ${name}:`, error.message || error);
    shutdown(1);
  });

  child.on('close', (code, signal) => {
    if (shuttingDown) return;
    console.log(`\n❌ ${name} process exited with code ${code} ${signal ? `signal ${signal}` : ''}`.trim());
    shutdown(code || 0);
  });

  children.set(name, child);
};

const shutdown = (exitCode = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log('\n🛑 Shutting down services...');

  for (const [name, child] of children.entries()) {
    if (!child.killed) {
      child.kill('SIGINT');
      console.log(`Stopping ${name}...`);
    }
  }

  setTimeout(() => process.exit(exitCode), 500);
};

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown(1);
});

for (const proc of processes) {
  startChild(proc);
}
