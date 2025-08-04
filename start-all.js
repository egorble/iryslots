#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    log('❌ .env file not found!', colors.red);
    log('Please create .env file with required configuration.', colors.yellow);
    log('See FULL_SETUP.md for details.', colors.yellow);
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'CONTRACT_ADDRESS',
    'SERVER_WALLET_KEY',
    'IRYS_RPC_URL'
  ];
  
  for (const varName of requiredVars) {
    if (!envContent.includes(`${varName}=`) || envContent.includes(`${varName}=your_`)) {
      log(`❌ Missing or incomplete environment variable: ${varName}`, colors.red);
      log('Please configure all required variables in .env file.', colors.yellow);
      process.exit(1);
    }
  }
  
  log('✅ Environment configuration looks good!', colors.green);
}

function checkDependencies() {
  log('🔍 Checking dependencies...', colors.blue);
  
  // Check main dependencies
  if (!fs.existsSync(join(__dirname, 'node_modules'))) {
    log('❌ Frontend dependencies not installed!', colors.red);
    log('Run: npm install', colors.yellow);
    process.exit(1);
  }
  
  // Check server dependencies
  if (!fs.existsSync(join(__dirname, 'server', 'node_modules'))) {
    log('❌ Server dependencies not installed!', colors.red);
    log('Run: cd server && npm install', colors.yellow);
    process.exit(1);
  }
  
  log('✅ Dependencies are installed!', colors.green);
}

function checkContract() {
  const artifactsPath = join(__dirname, 'artifacts', 'SlotMachineBank.json');
  if (!fs.existsSync(artifactsPath)) {
    log('❌ Contract artifacts not found!', colors.red);
    log('Run: npm run compile', colors.yellow);
    process.exit(1);
  }
  
  log('✅ Contract artifacts found!', colors.green);
}

function startProcess(name, command, args, cwd, color) {
  log(`🚀 Starting ${name}...`, color);
  
  const process = spawn(command, args, {
    cwd: cwd || __dirname,
    stdio: 'pipe',
    shell: true
  });
  
  process.stdout.on('data', (data) => {
    const lines = data.toString().split('\\n').filter(line => line.trim());
    lines.forEach(line => {
      log(`[${name}] ${line}`, color);
    });
  });
  
  process.stderr.on('data', (data) => {
    const lines = data.toString().split('\\n').filter(line => line.trim());
    lines.forEach(line => {
      log(`[${name}] ${line}`, colors.red);
    });
  });
  
  process.on('close', (code) => {
    if (code !== 0) {
      log(`❌ ${name} exited with code ${code}`, colors.red);
    } else {
      log(`✅ ${name} exited successfully`, colors.green);
    }
  });
  
  return process;
}

async function main() {
  log('🎰 Cherry Charm - Full System Startup', colors.bright);
  log('=====================================', colors.bright);
  
  // Pre-flight checks
  checkEnvFile();
  checkDependencies();
  checkContract();
  
  log('\\n🚀 Starting all services...\\n', colors.bright);
  
  // Start server
  const serverProcess = startProcess(
    'SERVER',
    'npm',
    ['run', 'dev'],
    join(__dirname, 'server'),
    colors.blue
  );
  
  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Start frontend
  const frontendProcess = startProcess(
    'FRONTEND',
    'npm',
    ['run', 'dev'],
    __dirname,
    colors.green
  );
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('\\n🛑 Shutting down all services...', colors.yellow);
    
    serverProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    
    setTimeout(() => {
      log('👋 Goodbye!', colors.bright);
      process.exit(0);
    }, 1000);
  });
  
  // Show startup info
  setTimeout(() => {
    log('\\n🎉 Cherry Charm is starting up!', colors.bright);
    log('📊 Server: http://localhost:3001', colors.blue);
    log('🎮 Frontend: http://localhost:5173', colors.green);
    log('📚 Health Check: http://localhost:3001/health', colors.cyan);
    log('\\n💡 Press Ctrl+C to stop all services', colors.yellow);
  }, 5000);
}

// Run the startup script
main().catch(error => {
  log(`💥 Startup failed: ${error.message}`, colors.red);
  process.exit(1);
});