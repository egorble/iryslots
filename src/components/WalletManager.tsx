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

  // Обробка депозиту
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

  // Встановлення мінімального депозиту
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
          <h3>MetaMask не встановлено</h3>
          <p>Для гри потрібно встановити MetaMask</p>
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="install-metamask-btn"
          >
            Встановити MetaMask
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
            <h3>Підключити гаманець</h3>
            <p>Для гри потрібно підключити MetaMask з IRYS токенами</p>
            <button 
              onClick={connectWallet}
              disabled={walletState.isConnecting}
              className="connect-wallet-btn"
            >
              {walletState.isConnecting ? 'Підключення...' : 'Підключити MetaMask'}
            </button>
          </div>
        ) : (
          <div className="wallet-connected">
            <div className="wallet-info">
              <div className="wallet-address">
                <span className="address-label">Адреса:</span>
                <span className="address-value">{shortenAddress(walletState.address!)}</span>
                <button 
                  onClick={updateBalances}
                  className="refresh-btn"
                  title="Оновити баланси"
                >
                  🔄
                </button>
              </div>
              
              <div className="balances">
                <div className="balance-item">
                  <span className="balance-label">Гаманець:</span>
                  <span className="balance-value">{formatIRYS(walletState.balance)} IRYS</span>
                </div>
                <div className="balance-item">
                  <span className="balance-label">Ігровий баланс:</span>
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
                  💰 Депозит
                </button>
                
                <button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="action-btn withdraw-btn"
                  disabled={isLoading || parseFloat(walletState.gameBalance) <= 0}
                >
                  💸 Вивід
                </button>
              </div>
              
              <div className="wallet-actions-row">
                <button 
                  onClick={() => setModal(true)}
                  className="action-btn help-btn"
                >
                  ❓ Допомога
                </button>
                
                <button 
                  onClick={disconnectWallet}
                  className="action-btn disconnect-btn"
                >
                  🔌 Відключити
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальне вікно депозиту */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Депозит IRYS</h3>
              <button 
                onClick={() => setShowDepositModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>Мінімальний депозит: {formatIRYS(minDeposit)} IRYS</p>
              <p>Баланс гаманця: {formatIRYS(walletState.balance)} IRYS</p>
              
              <div className="input-group">
                <label>Сума депозиту:</label>
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
                {isLoading ? 'Обробка...' : 'Підтвердити депозит'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальне вікно виводу */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Вивід IRYS</h3>
              <button 
                onClick={() => setShowWithdrawModal(false)}
                className="modal-close"
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <p>Доступно для виводу: {formatIRYS(walletState.gameBalance)} IRYS</p>
              
              <div className="input-group">
                <label>Сума виводу:</label>
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
                {isLoading ? 'Обробка...' : 'Підтвердити вивід'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WalletManager;