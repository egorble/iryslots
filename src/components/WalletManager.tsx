import React, { useState } from 'react';
import { useBlockchain } from '../hooks/useBlockchain';
import useGame from '../stores/store';
import './WalletManager.css';

const WalletManager: React.FC = () => {
  const {
    walletState,
    error,
    isLoading,
    minDeposit,
    connectWallet,
    disconnectWallet,
    deposit,
    withdraw,
    updateBalances,
    clearError,
    formatIRYS,
    isMetaMaskInstalled,
  } = useBlockchain();

  const { setModal } = useGame();

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  // Handle deposit
  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      return;
    }

    const success = await deposit(depositAmount);
    if (success) {
      setDepositAmount('');
      setShowDepositModal(false);
    }
  };

  // Обробка виводу
  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      return;
    }

    const success = await withdraw(withdrawAmount);
    if (success) {
      setWithdrawAmount('');
      setShowWithdrawModal(false);
    }
  };

  // Встановлення максимальної суми для виводу
  const setMaxWithdraw = () => {
    setWithdrawAmount(walletState.gameBalance);
  };

  // Set minimum deposit
  const setMinDeposit = () => {
    setDepositAmount(minDeposit);
  };

  // Скорочення адреси для відображення
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isMetaMaskInstalled) {
    return (
      <div className="wallet-manager">
        <div className="wallet-error">
          <h3>MetaMask Not Installed</h3>
          <p>MetaMask is required to play the game</p>
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="install-metamask-btn"
          >
            Install MetaMask
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="wallet-manager">
        {error && (
          <div className="wallet-error">
            <p>{error}</p>
            <button onClick={clearError} className="clear-error-btn">
              ✕
            </button>
          </div>
        )}

        {!walletState.isConnected ? (
          <div className="wallet-connect">
            <h3>Connect Wallet</h3>
            <p>Connect MetaMask with IRYS tokens to play</p>
            <button 
              onClick={connectWallet}
              disabled={walletState.isConnecting}
              className="connect-wallet-btn"
            >
              {walletState.isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </button>
          </div>
        ) : (
          <div className="wallet-connected">
            <div className="wallet-info">
              <div className="wallet-address">
                <span className="address-label">Address:</span>
                <span className="address-value">{shortenAddress(walletState.address!)}</span>
                <button 
                  onClick={updateBalances}
                  className="refresh-btn"
                  title="Refresh Balances"
                >
                  🔄
                </button>
              </div>
              
              <div className="balances">
                <div className="balance-item">
                  <span className="balance-label">Wallet:</span>
                  <span className="balance-value">{formatIRYS(walletState.balance)} IRYS</span>
                </div>
                <div className="balance-item">
                  <span className="balance-label">Game Balance:</span>
                  <span className="balance-value">{formatIRYS(walletState.gameBalance)} IRYS</span>
                </div>
              </div>
            </div>

            <div className="wallet-actions">
              <div className="wallet-actions-row">
                <button 
                  onClick={() => setShowDepositModal(true)}
                  className="action-btn deposit-btn"
                  disabled={isLoading}
                >
                  💰 Deposit
                </button>
                
                <button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="action-btn withdraw-btn"
                  disabled={isLoading || parseFloat(walletState.gameBalance) <= 0}
                >
                  💸 Withdraw
                </button>
              </div>
              
              <div className="wallet-actions-row">
                <button 
                  onClick={() => setModal(true)}
                  className="action-btn help-btn"
                >
                  ❓ Help
                </button>
                
                <button 
                  onClick={disconnectWallet}
                  className="action-btn disconnect-btn"
                >
                  🔌 Disconnect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Deposit IRYS</h3>
              <button 
                onClick={() => setShowDepositModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>Minimum deposit: {formatIRYS(minDeposit)} IRYS</p>
              <p>Wallet balance: {formatIRYS(walletState.balance)} IRYS</p>
              
              <div className="input-group">
                <label>Deposit amount:</label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="0.0"
                  min={minDeposit}
                  step="0.001"
                  className="amount-input"
                />
                <button 
                  onClick={setMinDeposit}
                  className="quick-amount-btn"
                >
                  Мін
                </button>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={handleDeposit}
                disabled={isLoading || !depositAmount || parseFloat(depositAmount) < parseFloat(minDeposit)}
                className="confirm-btn"
              >
                {isLoading ? 'Processing...' : 'Confirm Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Withdraw IRYS</h3>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>Available to withdraw: {formatIRYS(walletState.gameBalance)} IRYS</p>
              
              <div className="input-group">
                <label>Withdraw amount:</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.0"
                  min="0.001"
                  max={walletState.gameBalance}
                  step="0.001"
                  className="amount-input"
                />
                <button 
                  onClick={setMaxWithdraw}
                  className="quick-amount-btn"
                >
                  Макс
                </button>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                onClick={handleWithdraw}
                disabled={isLoading || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(walletState.gameBalance)}
                className="confirm-btn"
              >
                {isLoading ? 'Processing...' : 'Confirm Withdraw'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletManager;