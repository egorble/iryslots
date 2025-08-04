const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Contract ABI - will be updated by compile.js
const CONTRACT_ABI = [
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_serverWallet",
                    "type": "address"
                }
            ],
            "stateMutability": "nonpayable",
            "type": "constructor"
        },
        {
            "inputs": [],
            "name": "AmountTooSmall",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "BelowMinimumDeposit",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ContractPaused",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "InsufficientBalance",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "InsufficientContractBalance",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "InvalidAddress",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "OnlyOwner",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "OnlyServer",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "ReentrancyGuard",
            "type": "error"
        },
        {
            "inputs": [],
            "name": "TransferFailed",
            "type": "error"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "int256",
                    "name": "change",
                    "type": "int256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "newBalance",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "string",
                    "name": "reason",
                    "type": "string"
                }
            ],
            "name": "BalanceUpdated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "newBalance",
                    "type": "uint256"
                }
            ],
            "name": "Deposit",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "oldAmount",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "newAmount",
                    "type": "uint256"
                }
            ],
            "name": "MinDepositUpdated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "previousOwner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "OwnershipTransferred",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "Paused",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "oldServer",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "newServer",
                    "type": "address"
                }
            ],
            "name": "ServerWalletUpdated",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "account",
                    "type": "address"
                }
            ],
            "name": "Unpaused",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "newBalance",
                    "type": "uint256"
                }
            ],
            "name": "Withdrawal",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "deposit",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "emergencyWithdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                }
            ],
            "name": "getBalance",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getContractBalance",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getContractStats",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "betAmount",
                    "type": "uint256"
                }
            ],
            "name": "hasSufficientBalance",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "minDeposit",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "pause",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "paused",
            "outputs": [
                {
                    "internalType": "bool",
                    "name": "",
                    "type": "bool"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "name": "playerBalances",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "serverWallet",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "totalDeposited",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "transferOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "unpause",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "player",
                    "type": "address"
                },
                {
                    "internalType": "int256",
                    "name": "change",
                    "type": "int256"
                },
                {
                    "internalType": "string",
                    "name": "reason",
                    "type": "string"
                }
            ],
            "name": "updateBalance",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "newMinDeposit",
                    "type": "uint256"
                }
            ],
            "name": "updateMinDeposit",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "newServerWallet",
                    "type": "address"
                }
            ],
            "name": "updateServerWallet",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "stateMutability": "payable",
            "type": "receive"
        }
    ];

// Contract bytecode - will be updated by compile.js
const CONTRACT_BYTECODE = "0x6080604052662386f26fc100006004556005805461ffff191690553480156024575f5ffd5b50604051610e2c380380610e2c833981016040819052604191609a565b806001600160a01b03811660685760405163e6c4247b60e01b815260040160405180910390fd5b505f8054336001600160a01b031991821617909155600180549091166001600160a01b039290921691909117905560c5565b5f6020828403121560a9575f5ffd5b81516001600160a01b038116811460be575f5ffd5b9392505050565b610d5a806100d25f395ff3fe608060405260043610610113575f3560e01c80638456cb591161009d578063d5395d2b11610062578063d5395d2b146102ce578063dfe6b5d6146102ed578063f2fde38b1461030f578063f8b2cb4f1461032e578063ff50abdc14610362575f5ffd5b80638456cb59146102565780638da5cb5b1461026a5780639a7be47114610288578063a293a996146102a7578063d0e30db0146102c6575f5ffd5b80635312ea8e116100e35780635312ea8e146101b25780635c975abb146101d15780636137ff2e146101fa5780636f9fb98a146102195780637b38314c1461022b575f5ffd5b80631a59f0f01461011e5780632e1a7d4d1461015a5780633f4ba83a1461017b57806341b3d1851461018f575f5ffd5b3661011a57005b5f5ffd5b348015610129575f5ffd5b5060015461013d906001600160a01b031681565b6040516001600160a01b0390911681526020015b60405180910390f35b348015610165575f5ffd5b50610179610174366004610b97565b610377565b005b348015610186575f5ffd5b50610179610539565b34801561019a575f5ffd5b506101a460045481565b604051908152602001610151565b3480156101bd575f5ffd5b506101796101cc366004610b97565b6105a3565b3480156101dc575f5ffd5b506005546101ea9060ff1681565b6040519015158152602001610151565b348015610205575f5ffd5b50610179610214366004610bc9565b610683565b348015610224575f5ffd5b50476101a4565b348015610236575f5ffd5b506101a4610245366004610c4c565b60026020525f908152604090205481565b348015610261575f5ffd5b5061017961080c565b348015610275575f5ffd5b505f5461013d906001600160a01b031681565b348015610293575f5ffd5b506101796102a2366004610b97565b610873565b3480156102b2575f5ffd5b506101796102c1366004610c4c565b610902565b6101796109a6565b3480156102d9575f5ffd5b506101ea6102e8366004610c6c565b610ad3565b3480156102f8575f5ffd5b506003546040805191825247602083015201610151565b34801561031a575f5ffd5b50610179610329366004610c4c565b610af5565b348015610339575f5ffd5b506101a4610348366004610c4c565b6001600160a01b03165f9081526002602052604090205490565b34801561036d575f5ffd5b506101a460035481565b600554610100900460ff16156103a0576040516345f5ce8b60e11b815260040160405180910390fd5b6005805461ff001981166101001790915560ff16156103d25760405163ab35696f60e01b815260040160405180910390fd5b805f036103f25760405163617ab12d60e11b815260040160405180910390fd5b335f9081526002602052604090205481111561042157604051631e9acf1760e31b815260040160405180910390fd5b804710156104425760405163786e0a9960e01b815260040160405180910390fd5b335f9081526002602052604081208054839290610460908490610ca8565b925050819055508060035f8282546104789190610ca8565b90915550506040515f90339083908381818185875af1925050503d805f81146104bc576040519150601f19603f3d011682016040523d82523d5f602084013e6104c1565b606091505b50509050806104e3576040516312171d8360e31b815260040160405180910390fd5b335f81815260026020908152604091829020548251868152918201527fdf273cb619d95419a9cd0ec88123a0538c85064229baa6363788f743fff90deb910160405180910390a250506005805461ff0019169055565b5f546001600160a01b0316331461056357604051635fc483c560e01b815260040160405180910390fd5b6005805460ff191690556040513381527f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa906020015b60405180910390a1565b5f546001600160a01b031633146105cd57604051635fc483c560e01b815260040160405180910390fd5b805f036105ed5760405163617ab12d60e11b815260040160405180910390fd5b8047101561060e5760405163786e0a9960e01b815260040160405180910390fd5b5f80546040516001600160a01b039091169083908381818185875af1925050503d805f8114610658576040519150601f19603f3d011682016040523d82523d5f602084013e61065d565b606091505b505090508061067f576040516312171d8360e31b815260040160405180910390fd5b5050565b6001546001600160a01b031633146106ae576040516311b475dd60e31b815260040160405180910390fd5b60055460ff16156106d25760405163ab35696f60e01b815260040160405180910390fd5b836001600160a01b0381166106fa5760405163e6c4247b60e01b815260040160405180910390fd5b5f84121561077a575f61070c85610cbb565b6001600160a01b0387165f9081526002602052604090205490915081111561074757604051631e9acf1760e31b815260040160405180910390fd5b6001600160a01b0386165f908152600260205260408120805483929061076e908490610ca8565b909155506107af915050565b5f8413156107af576001600160a01b0385165f90815260026020526040812080548692906107a9908490610cd5565b90915550505b6001600160a01b0385165f81815260026020526040908190205490517ff5dd68deaab9ef45f87012620d5c6297c65b9f2f2244286dc81bb48680267869916107fd9188919088908890610ce8565b60405180910390a25050505050565b5f546001600160a01b0316331461083657604051635fc483c560e01b815260040160405180910390fd5b6005805460ff191660011790556040513381527f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a25890602001610599565b5f546001600160a01b0316331461089d57604051635fc483c560e01b815260040160405180910390fd5b805f036108bd5760405163617ab12d60e11b815260040160405180910390fd5b600480549082905560408051828152602081018490527fb566d3df2587c9e70b06b6419bdeeeeec8ca8cd60e4c48c6baad0d94c46809c7910160405180910390a15050565b5f546001600160a01b0316331461092c57604051635fc483c560e01b815260040160405180910390fd5b806001600160a01b0381166109545760405163e6c4247b60e01b815260040160405180910390fd5b600180546001600160a01b038481166001600160a01b0319831681179093556040519116919082907f22b059a29562c70d00e1b93302ee0ceea2e4c1162e027ffa0da8f3e6455ea4fb905f90a3505050565b600554610100900460ff16156109cf576040516345f5ce8b60e11b815260040160405180910390fd5b6005805461ff001981166101001790915560ff1615610a015760405163ab35696f60e01b815260040160405180910390fd5b600454341015610a2457604051632ddf431160e11b815260040160405180910390fd5b345f03610a445760405163617ab12d60e11b815260040160405180910390fd5b335f9081526002602052604081208054349290610a62908490610cd5565b925050819055503460035f828254610a7a9190610cd5565b9091555050335f81815260026020908152604091829020548251348152918201527f90890809c654f11d6e72a28fa60149770a0d11ec6c92319d6ceb2bb0a4ea1a15910160405180910390a26005805461ff0019169055565b6001600160a01b0382165f908152600260205260409020548111155b92915050565b5f546001600160a01b03163314610b1f57604051635fc483c560e01b815260040160405180910390fd5b806001600160a01b038116610b475760405163e6c4247b60e01b815260040160405180910390fd5b5f80546001600160a01b038481166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a3505050565b5f60208284031215610ba7575f5ffd5b5035919050565b80356001600160a01b0381168114610bc4575f5ffd5b919050565b5f5f5f5f60608587031215610bdc575f5ffd5b610be585610bae565b935060208501359250604085013567ffffffffffffffff811115610c07575f5ffd5b8501601f81018713610c17575f5ffd5b803567ffffffffffffffff811115610c2d575f5ffd5b876020828401011115610c3e575f5ffd5b949793965060200194505050565b5f60208284031215610c5c575f5ffd5b610c6582610bae565b9392505050565b5f5f60408385031215610c7d575f5ffd5b610c8683610bae565b946020939093013593505050565b634e487b7160e01b5f52601160045260245ffd5b81810381811115610aef57610aef610c94565b5f600160ff1b8201610ccf57610ccf610c94565b505f0390565b80820180821115610aef57610aef610c94565b84815283602082015260606040820152816060820152818360808301375f818301608090810191909152601f909201601f19160101939250505056fea2646970667358221220a9419c5d450fd6e06ca167ce537a0aecce62d8c6b9070b90b2d6a409def0847164736f6c634300081e0033";

async function deploy() {
  console.log('🚀 Starting SlotMachineBank deployment...');
  
  // Check environment variables
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY not set in .env file');
    process.exit(1);
  }
  
  if (!process.env.SERVER_WALLET_ADDRESS) {
    console.error('❌ SERVER_WALLET_ADDRESS not set in .env file');
    process.exit(1);
  }
  
  if (!process.env.IRYS_RPC_URL) {
    console.error('❌ IRYS_RPC_URL not set in .env file');
    process.exit(1);
  }
  
  if (CONTRACT_BYTECODE === "YOUR_CONTRACT_BYTECODE_HERE") {
    console.error('❌ Contract not compiled. Please run: node compile.cjs');
    process.exit(1);
  }
  
  try {
    // Connect to IRYS network
    const provider = new ethers.JsonRpcProvider(process.env.IRYS_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log('🔗 Connected to network:', process.env.IRYS_NETWORK);
    console.log('👛 Deployer address:', wallet.address);
    
    // Check balance
    const balance = await provider.getBalance(wallet.address);
    console.log('💰 Deployer balance:', ethers.formatEther(balance), 'IRYS');
    
    if (balance === 0n) {
      console.error('❌ Insufficient funds for deployment');
      process.exit(1);
    }
    
    // Create contract factory
    const contractFactory = new ethers.ContractFactory(
      CONTRACT_ABI,
      CONTRACT_BYTECODE,
      wallet
    );
    
    // Constructor parameters
    const serverWalletAddress = process.env.SERVER_WALLET_ADDRESS;
    
    console.log('📋 Deployment parameters:');
    console.log('   Server Wallet:', serverWalletAddress);
    
    // Estimate gas
    console.log('⛽ Estimating gas...');
    const deployTx = await contractFactory.getDeployTransaction(serverWalletAddress);
    const estimatedGas = await provider.estimateGas(deployTx);
    console.log('   Estimated gas:', estimatedGas.toString());
    
    // Deploy contract
    console.log('🔄 Deploying contract...');
    const contract = await contractFactory.deploy(serverWalletAddress);
    
    console.log('⏳ Waiting for transaction confirmation...');
    console.log('🔗 Transaction hash:', contract.deploymentTransaction().hash);
    
    // Wait for deployment
    await contract.waitForDeployment();
    
    const contractAddress = await contract.getAddress();
    console.log('✅ Contract deployed successfully!');
    console.log('📍 Contract address:', contractAddress);
    
    // Verify deployment
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      console.error('❌ Error: contract not deployed properly');
      process.exit(1);
    }
    
    // Test basic functions
    console.log('🧪 Testing basic functions...');
    
    try {
      const serverWallet = await contract.serverWallet();
      const minDeposit = await contract.minDeposit();
      const contractBalance = await contract.getContractBalance();
      
      console.log('✅ Testing passed:');
      console.log('   Server Wallet:', serverWallet);
      console.log('   Min Deposit:', ethers.formatEther(minDeposit), 'IRYS');
      console.log('   Contract Balance:', ethers.formatEther(contractBalance), 'IRYS');
      
    } catch (error) {
      console.error('❌ Error during testing:', error.message);
    }
    
    // Update .env file
    updateEnvFile(contractAddress);
    
    // Save deployment info
    saveDeploymentInfo(contractAddress, contract.deploymentTransaction().hash);
    
    console.log('🎉 Deployment completed successfully!');
    console.log('📝 Contract address has been updated in .env file');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    if (error.code === 'INSUFFICIENT_FUNDS') {
      console.error('💸 Insufficient funds for deployment');
    }
    process.exit(1);
  }
}

function updateEnvFile(contractAddress) {
  try {
    const envPath = './.env';
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update CONTRACT_ADDRESS
    envContent = envContent.replace(
      /CONTRACT_ADDRESS=.*/,
      `CONTRACT_ADDRESS=${contractAddress}`
    );
    
    // Update VITE_CONTRACT_ADDRESS
    envContent = envContent.replace(
      /VITE_CONTRACT_ADDRESS=.*/,
      `VITE_CONTRACT_ADDRESS=${contractAddress}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file updated with contract address');
    
  } catch (error) {
    console.warn('⚠️  Failed to update .env file:', error.message);
  }
}

function saveDeploymentInfo(contractAddress, txHash) {
  const deploymentInfo = {
    network: process.env.IRYS_NETWORK,
    chainId: process.env.IRYS_CHAIN_ID,
    contractAddress: contractAddress,
    deploymentTxHash: txHash,
    deployedAt: new Date().toISOString(),
    deployer: process.env.PRIVATE_KEY ? 'configured' : 'not configured',
    serverWallet: process.env.SERVER_WALLET_ADDRESS,
  };
  
  const deploymentPath = './deployments';
  if (!fs.existsSync(deploymentPath)) {
    fs.mkdirSync(deploymentPath, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(deploymentPath, `${process.env.IRYS_NETWORK}-deployment.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log('📄 Deployment info saved to deployments/');
}

// Run deployment
if (require.main === module) {
  deploy().catch(console.error);
}

module.exports = { deploy };