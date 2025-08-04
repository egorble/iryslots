const solc = require('solc');
const fs = require('fs');
const path = require('path');

// Function to read contract files
function findImports(importPath) {
  try {
    // Try to find file in node_modules
    const fullPath = path.resolve('node_modules', importPath);
    if (fs.existsSync(fullPath)) {
      return { contents: fs.readFileSync(fullPath, 'utf8') };
    }
    
    // Try relative path
    const relativePath = path.resolve('.', importPath);
    if (fs.existsSync(relativePath)) {
      return { contents: fs.readFileSync(relativePath, 'utf8') };
    }
    
    // If not found, return error
    return { error: 'File not found: ' + importPath };
  } catch (error) {
    return { error: 'Error reading file: ' + importPath };
  }
}

// Compilation function
function compileContract() {
  try {
    console.log('🔨 Compiling SlotMachineBank.sol...');
    
    // Read the contract source code
    const contractPath = './contracts/SlotMachineBank.sol';
    const source = fs.readFileSync(contractPath, 'utf8');
    
    // Prepare the input for solc
    const input = {
      language: 'Solidity',
      sources: {
        'SlotMachineBank.sol': {
          content: source,
        },
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode'],
          },
        },
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    };
    
    console.log('⚙️  Running Solidity compiler...');
    
    // Compile the contract
    const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
    
    // Check for errors
    if (output.errors) {
      const hasErrors = output.errors.some(error => error.severity === 'error');
      output.errors.forEach(error => {
        if (error.severity === 'error') {
          console.error('❌ Error:', error.formattedMessage);
        } else {
          console.warn('⚠️  Warning:', error.formattedMessage);
        }
      });
      
      if (hasErrors) {
        throw new Error('Compilation failed with errors');
      }
    }
    
    // Extract contract data
    const contractName = 'SlotMachineBank';
    const contract = output.contracts['SlotMachineBank.sol'][contractName];
    
    if (!contract) {
      throw new Error('Contract not found in compilation output');
    }
    
    const abi = contract.abi;
    const bytecode = contract.evm.bytecode.object;
    
    console.log('✅ Compilation successful!');
    console.log(`📝 ABI length: ${JSON.stringify(abi).length} characters`);
    console.log(`💾 Bytecode length: ${bytecode.length} characters`);
    
    // Save compilation artifacts
    const artifactsDir = './artifacts';
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir);
    }
    
    // Save ABI
    const abiPath = path.join(artifactsDir, `${contractName}.abi.json`);
    fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
    
    // Save bytecode
    const bytecodePath = path.join(artifactsDir, `${contractName}.bin`);
    fs.writeFileSync(bytecodePath, bytecode);
    
    // Save combined artifact
    const artifact = {
      contractName: contractName,
      abi: abi,
      bytecode: '0x' + bytecode,
      compiler: {
        version: solc.version(),
        optimizer: {
          enabled: true,
          runs: 200
        }
      },
      compiledAt: new Date().toISOString()
    };
    
    const artifactPath = path.join(artifactsDir, `${contractName}.json`);
    fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2));
    
    console.log('📁 Artifacts saved to:');
    console.log(`   ABI: ${abiPath}`);
    console.log(`   Bytecode: ${bytecodePath}`);
    console.log(`   Combined: ${artifactPath}`);
    
    // Update deploy.cjs with bytecode
    console.log('🔄 Updating deploy.cjs with compiled data...');
    updateDeployScript(abi, '0x' + bytecode);
    
    console.log('🎉 Ready for deployment!');
    console.log('Next steps:');
    console.log('1. node deploy.cjs');
    console.log('2. Update your frontend with the contract address');
    
    return { abi, bytecode: '0x' + bytecode };
    
  } catch (error) {
    console.error('❌ Compilation failed:', error.message);
    process.exit(1);
  }
}

function updateDeployScript(abi, bytecode) {
  try {
    const deployPath = './deploy.cjs';
    let deployContent = fs.readFileSync(deployPath, 'utf8');
    
    // Create ABI string
    const abiString = JSON.stringify(abi, null, 4)
      .split('\n')
      .map((line, index) => index === 0 ? line : '    ' + line)
      .join('\n');
    
    // Replace ABI
    deployContent = deployContent.replace(
      /const CONTRACT_ABI = \[[\s\S]*?\];/,
      `const CONTRACT_ABI = ${abiString};`
    );
    
    // Replace bytecode
    deployContent = deployContent.replace(
      /const CONTRACT_BYTECODE = "0x[a-fA-F0-9]*";/,
      `const CONTRACT_BYTECODE = "${bytecode}";`
    );
    
    fs.writeFileSync(deployPath, deployContent);
    console.log('✅ deploy.cjs updated successfully');
    
  } catch (error) {
    console.error('⚠️  Failed to update deploy.js:', error.message);
    console.log('Please manually update the CONTRACT_BYTECODE in deploy.cjs');
  }
}

// Run compilation
if (require.main === module) {
  compileContract();
}

module.exports = { compileContract };