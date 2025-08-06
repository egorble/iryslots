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
                    "name": "serverWallet",
                    "type": "address"
                }
            ],
            "name": "ServerWalletAdded",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "serverWallet",
                    "type": "address"
                }
            ],
            "name": "ServerWalletRemoved",
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
            "inputs": [
                {
                    "internalType": "address",
                    "name": "newServerWallet",
                    "type": "address"
                }
            ],
            "name": "addServerWallet",
            "outputs": [],
            "stateMutability": "nonpayable",
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
            "name": "authorizedServers",
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
            "inputs": [],
            "name": "getAuthorizedServers",
            "outputs": [
                {
                    "internalType": "address[]",
                    "name": "",
                    "type": "address[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getAuthorizedServersCount",
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
            "inputs": [
                {
                    "internalType": "address",
                    "name": "wallet",
                    "type": "address"
                }
            ],
            "name": "isAuthorizedServer",
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
            "inputs": [
                {
                    "internalType": "address",
                    "name": "serverWalletToRemove",
                    "type": "address"
                }
            ],
            "name": "removeServerWallet",
            "outputs": [],
            "stateMutability": "nonpayable",
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
            "inputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "name": "serverWalletsList",
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
const CONTRACT_BYTECODE = "0x6080604052662386f26fc100006006556007805461ffff19169055348015610025575f5ffd5b5060405161153a38038061153a833981016040819052610044916100ee565b806001600160a01b03811661006c5760405163e6c4247b60e01b815260040160405180910390fd5b505f80546001600160a01b031990811633178255600380546001600160a01b0394909416938216841790558282526001602081905260408320805460ff1916821790556002805491820181559092527f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace9091018054909116909117905561011b565b5f602082840312156100fe575f5ffd5b81516001600160a01b0381168114610114575f5ffd5b9392505050565b611412806101285f395ff3fe60806040526004361061017e575f3560e01c80638456cb59116100cd578063b625abac11610087578063dfe6b5d611610062578063dfe6b5d61461044b578063f2fde38b1461046d578063f8b2cb4f1461048c578063ff50abdc146104c0575f5ffd5b8063b625abac14610405578063d0e30db014610424578063d5395d2b1461042c575f5ffd5b80638456cb591461033d57806389e02eb9146103515780638da5cb5b1461038857806390048a2e146103a65780639a7be471146103c7578063a293a996146103e6575f5ffd5b80635312ea8e116101385780636137ff2e116101135780636137ff2e146102b357806365c22b49146102d25780636f9fb98a146103005780637b38314c14610312575f5ffd5b80635312ea8e1461024c5780635c975abb1461026b5780635cad2c9914610294575f5ffd5b806301622ec814610189578063133da00e146101aa5780631a59f0f0146101cd5780632e1a7d4d146102045780633f4ba83a1461022357806341b3d18514610237575f5ffd5b3661018557005b5f5ffd5b348015610194575f5ffd5b506101a86101a33660046111f7565b6104d5565b005b3480156101b5575f5ffd5b506002545b6040519081526020015b60405180910390f35b3480156101d8575f5ffd5b506003546101ec906001600160a01b031681565b6040516001600160a01b0390911681526020016101c4565b34801561020f575f5ffd5b506101a861021e366004611217565b610620565b34801561022e575f5ffd5b506101a86107e2565b348015610242575f5ffd5b506101ba60065481565b348015610257575f5ffd5b506101a8610266366004611217565b61084c565b348015610276575f5ffd5b506007546102849060ff1681565b60405190151581526020016101c4565b34801561029f575f5ffd5b506101a86102ae3660046111f7565b61092c565b3480156102be575f5ffd5b506101a86102cd36600461122e565b610aae565b3480156102dd575f5ffd5b506102846102ec3660046111f7565b60016020525f908152604090205460ff1681565b34801561030b575f5ffd5b50476101ba565b34801561031d575f5ffd5b506101ba61032c3660046111f7565b60046020525f908152604090205481565b348015610348575f5ffd5b506101a8610c3b565b34801561035c575f5ffd5b5061028461036b3660046111f7565b6001600160a01b03165f9081526001602052604090205460ff1690565b348015610393575f5ffd5b505f546101ec906001600160a01b031681565b3480156103b1575f5ffd5b506103ba610ca2565b6040516101c491906112b1565b3480156103d2575f5ffd5b506101a86103e1366004611217565b610d02565b3480156103f1575f5ffd5b506101a86104003660046111f7565b610d91565b348015610410575f5ffd5b506101ec61041f366004611217565b610ece565b6101a8610ef6565b348015610437575f5ffd5b506102846104463660046112fc565b611023565b348015610456575f5ffd5b5060055460408051918252476020830152016101c4565b348015610478575f5ffd5b506101a86104873660046111f7565b611045565b348015610497575f5ffd5b506101ba6104a63660046111f7565b6001600160a01b03165f9081526004602052604090205490565b3480156104cb575f5ffd5b506101ba60055481565b5f546001600160a01b031633146104ff57604051635fc483c560e01b815260040160405180910390fd5b806001600160a01b0381166105275760405163e6c4247b60e01b815260040160405180910390fd5b6001600160a01b0382165f9081526001602052604090205460ff16156105945760405162461bcd60e51b815260206004820181905260248201527f5365727665722077616c6c657420616c726561647920617574686f72697a656460448201526064015b60405180910390fd5b6001600160a01b0382165f818152600160208190526040808320805460ff19168317905560028054928301815583527f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace90910180546001600160a01b03191684179055517f99511a7399663e3ebe1715746abdbb9cb8c32cfbde53b042a9cd60abc043e4459190a25050565b600754610100900460ff1615610649576040516345f5ce8b60e11b815260040160405180910390fd5b6007805461ff001981166101001790915560ff161561067b5760405163ab35696f60e01b815260040160405180910390fd5b805f0361069b5760405163617ab12d60e11b815260040160405180910390fd5b335f908152600460205260409020548111156106ca57604051631e9acf1760e31b815260040160405180910390fd5b804710156106eb5760405163786e0a9960e01b815260040160405180910390fd5b335f9081526004602052604081208054839290610709908490611338565b925050819055508060055f8282546107219190611338565b90915550506040515f90339083908381818185875af1925050503d805f8114610765576040519150601f19603f3d011682016040523d82523d5f602084013e61076a565b606091505b505090508061078c576040516312171d8360e31b815260040160405180910390fd5b335f81815260046020908152604091829020548251868152918201527fdf273cb619d95419a9cd0ec88123a0538c85064229baa6363788f743fff90deb910160405180910390a250506007805461ff0019169055565b5f546001600160a01b0316331461080c57604051635fc483c560e01b815260040160405180910390fd5b6007805460ff191690556040513381527f5db9ee0a495bf2e6ff9c91a7834c1ba4fdd244a5e8aa4e537bd38aeae4b073aa906020015b60405180910390a1565b5f546001600160a01b0316331461087657604051635fc483c560e01b815260040160405180910390fd5b805f036108965760405163617ab12d60e11b815260040160405180910390fd5b804710156108b75760405163786e0a9960e01b815260040160405180910390fd5b5f80546040516001600160a01b039091169083908381818185875af1925050503d805f8114610901576040519150601f19603f3d011682016040523d82523d5f602084013e610906565b606091505b5050905080610928576040516312171d8360e31b815260040160405180910390fd5b5050565b5f546001600160a01b0316331461095657604051635fc483c560e01b815260040160405180910390fd5b806001600160a01b03811661097e5760405163e6c4247b60e01b815260040160405180910390fd5b6001600160a01b0382165f9081526001602052604090205460ff166109e55760405162461bcd60e51b815260206004820152601c60248201527f5365727665722077616c6c6574206e6f7420617574686f72697a656400000000604482015260640161058b565b6003546001600160a01b0390811690831603610a4f5760405162461bcd60e51b815260206004820152602360248201527f43616e6e6f742072656d6f7665207072696d617279207365727665722077616c6044820152621b195d60ea1b606482015260840161058b565b6001600160a01b0382165f908152600160205260409020805460ff19169055610a77826110e7565b6040516001600160a01b038316907fa2bdf6e40e15395d5fe624df4c693971b8852fcbb8d90452d687857b5734fe3e905f90a25050565b335f9081526001602052604090205460ff16610add576040516311b475dd60e31b815260040160405180910390fd5b60075460ff1615610b015760405163ab35696f60e01b815260040160405180910390fd5b836001600160a01b038116610b295760405163e6c4247b60e01b815260040160405180910390fd5b5f841215610ba9575f610b3b8561134b565b6001600160a01b0387165f90815260046020526040902054909150811115610b7657604051631e9acf1760e31b815260040160405180910390fd5b6001600160a01b0386165f9081526004602052604081208054839290610b9d908490611338565b90915550610bde915050565b5f841315610bde576001600160a01b0385165f9081526004602052604081208054869290610bd8908490611365565b90915550505b6001600160a01b0385165f81815260046020526040908190205490517ff5dd68deaab9ef45f87012620d5c6297c65b9f2f2244286dc81bb4868026786991610c2c9188919088908890611378565b60405180910390a25050505050565b5f546001600160a01b03163314610c6557604051635fc483c560e01b815260040160405180910390fd5b6007805460ff191660011790556040513381527f62e78cea01bee320cd4e420270b5ea74000d11b0c9f74754ebdbfc544b05a25890602001610842565b60606002805480602002602001604051908101604052809291908181526020018280548015610cf857602002820191905f5260205f20905b81546001600160a01b03168152600190910190602001808311610cda575b5050505050905090565b5f546001600160a01b03163314610d2c57604051635fc483c560e01b815260040160405180910390fd5b805f03610d4c5760405163617ab12d60e11b815260040160405180910390fd5b600680549082905560408051828152602081018490527fb566d3df2587c9e70b06b6419bdeeeeec8ca8cd60e4c48c6baad0d94c46809c7910160405180910390a15050565b5f546001600160a01b03163314610dbb57604051635fc483c560e01b815260040160405180910390fd5b806001600160a01b038116610de35760405163e6c4247b60e01b815260040160405180910390fd5b6003546001600160a01b03165f8181526001602052604090205460ff1615610e2d576001600160a01b0381165f908152600160205260409020805460ff19169055610e2d816110e7565b600380546001600160a01b038086166001600160a01b031992831681179093555f838152600160208190526040808320805460ff19168317905560028054928301815583527f405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace909101805490941685179093559151908416917f22b059a29562c70d00e1b93302ee0ceea2e4c1162e027ffa0da8f3e6455ea4fb91a3505050565b60028181548110610edd575f80fd5b5f918252602090912001546001600160a01b0316905081565b600754610100900460ff1615610f1f576040516345f5ce8b60e11b815260040160405180910390fd5b6007805461ff001981166101001790915560ff1615610f515760405163ab35696f60e01b815260040160405180910390fd5b600654341015610f7457604051632ddf431160e11b815260040160405180910390fd5b345f03610f945760405163617ab12d60e11b815260040160405180910390fd5b335f9081526004602052604081208054349290610fb2908490611365565b925050819055503460055f828254610fca9190611365565b9091555050335f81815260046020908152604091829020548251348152918201527f90890809c654f11d6e72a28fa60149770a0d11ec6c92319d6ceb2bb0a4ea1a15910160405180910390a26007805461ff0019169055565b6001600160a01b0382165f908152600460205260409020548111155b92915050565b5f546001600160a01b0316331461106f57604051635fc483c560e01b815260040160405180910390fd5b806001600160a01b0381166110975760405163e6c4247b60e01b815260040160405180910390fd5b5f80546001600160a01b038481166001600160a01b0319831681178455604051919092169283917f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e09190a3505050565b5f5b60025481101561092857816001600160a01b031660028281548110611110576111106113b4565b5f918252602090912001546001600160a01b0316036111d4576002805461113990600190611338565b81548110611149576111496113b4565b5f91825260209091200154600280546001600160a01b039092169183908110611174576111746113b4565b905f5260205f20015f6101000a8154816001600160a01b0302191690836001600160a01b0316021790555060028054806111b0576111b06113c8565b5f8281526020902081015f1990810180546001600160a01b03191690550190555050565b6001016110e9565b80356001600160a01b03811681146111f2575f5ffd5b919050565b5f60208284031215611207575f5ffd5b611210826111dc565b9392505050565b5f60208284031215611227575f5ffd5b5035919050565b5f5f5f5f60608587031215611241575f5ffd5b61124a856111dc565b935060208501359250604085013567ffffffffffffffff81111561126c575f5ffd5b8501601f8101871361127c575f5ffd5b803567ffffffffffffffff811115611292575f5ffd5b8760208284010111156112a3575f5ffd5b949793965060200194505050565b602080825282518282018190525f918401906040840190835b818110156112f15783516001600160a01b03168352602093840193909201916001016112ca565b509095945050505050565b5f5f6040838503121561130d575f5ffd5b611316836111dc565b946020939093013593505050565b634e487b7160e01b5f52601160045260245ffd5b8181038181111561103f5761103f611324565b5f600160ff1b820161135f5761135f611324565b505f0390565b8082018082111561103f5761103f611324565b84815283602082015260606040820152816060820152818360808301375f818301608090810191909152601f909201601f191601019392505050565b634e487b7160e01b5f52603260045260245ffd5b634e487b7160e01b5f52603160045260245ffdfea2646970667358221220dea2df3d5510ab4ce4b6cb8adf63ae1297923817f5ebc2cb69290d477d39b04364736f6c634300081e0033";

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