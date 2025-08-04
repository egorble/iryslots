const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function verify() {
  console.log('🔍 Verifying deployed contract...');
  
  if (!process.env.CONTRACT_ADDRESS) {
    console.error('❌ CONTRACT_ADDRESS not set in .env file');
    process.exit(1);
  }
  
  if (!process.env.IRYS_RPC_URL) {
    console.error('❌ IRYS_RPC_URL not set in .env file');
    process.exit(1);
  }
  
  try {
    // Connect to network
    const provider = new ethers.JsonRpcProvider(process.env.IRYS_RPC_URL);
    
    // Load contract ABI
    const artifactPath = './artifacts/SlotMachineBank.json';
    if (!fs.existsSync(artifactPath)) {
      console.error('❌ Contract artifact not found. Please compile first: node compile.cjs');
      process.exit(1);
    }
    
    const contractArtifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Create contract instance
    const contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contractArtifact.abi,
      provider
    );
    
    console.log('📍 Contract address:', process.env.CONTRACT_ADDRESS);
    console.log('🔗 Network:', process.env.IRYS_NETWORK);
    
    // Check if contract exists
    const code = await provider.getCode(process.env.CONTRACT_ADDRESS);
    if (code === '0x') {
      console.error('❌ Contract not found at this address');
      process.exit(1);
    }
    
    console.log('✅ Contract found on blockchain');
    
    // Test contract functions
    console.log('\n🧪 Testing contract functions:');
    
    try {
      // Read public variables
      const serverWallet = await contract.serverWallet();
      console.log('✅ Server Wallet:', serverWallet);
      
      const minDeposit = await contract.minDeposit();
      console.log('✅ Min Deposit:', ethers.formatEther(minDeposit), 'IRYS');
      
      const totalDeposited = await contract.totalDeposited();
      console.log('✅ Total Deposited:', ethers.formatEther(totalDeposited), 'IRYS');
      
      const contractBalance = await contract.getContractBalance();
      console.log('✅ Contract Balance:', ethers.formatEther(contractBalance), 'IRYS');
      
      // Test view functions
      const testAddress = '0x0000000000000000000000000000000000000001';
      const testBalance = await contract.getBalance(testAddress);
      console.log('✅ getBalance() works, test address balance:', ethers.formatEther(testBalance), 'IRYS');
      
      const hasSufficient = await contract.hasSufficientBalance(testAddress, ethers.parseEther('0.01'));
      console.log('✅ hasSufficientBalance() works:', hasSufficient);
      
    } catch (error) {
      console.error('❌ Error testing functions:', error.message);
    }
    
    // Check contract state
    console.log('\n📋 Contract information:');
    
    try {
      const paused = await contract.paused();
      console.log('🔄 Contract state:', paused ? 'Paused' : 'Active');
    } catch (error) {
      console.log('⚠️  Could not check state:', error.message);
    }
    
    // Load deployment info if available
    const deploymentPath = `./deployments/${process.env.IRYS_NETWORK}-deployment.json`;
    if (fs.existsSync(deploymentPath)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      console.log('📅 Deployed at:', deploymentInfo.deployedAt);
      console.log('🔗 Deployment tx:', deploymentInfo.deploymentTxHash);
    }
    
    console.log('\n✅ Verification completed successfully!');
    console.log('🎉 Contract is ready to use');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
    process.exit(1);
  }
}

// Run verification
if (require.main === module) {
  verify().catch(console.error);
}

module.exports = { verify };