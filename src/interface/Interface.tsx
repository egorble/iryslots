/*
 *  Copyright (c) Michael Kolesidis <michael.kolesidis@gmail.com>
 *  GNU Affero General Public License v3.0
 *
 *  ATTENTION! FREE SOFTWARE
 *  This website is free software (free as in freedom).
 *  If you use any part of this code, you must make your entire project's source code
 *  publicly available under the same license. This applies whether you modify the code
 *  or use it as it is in your own project. This ensures that all modifications and
 *  derivative works remain free software, so that everyone can benefit.
 *  If you are not willing to comply with these terms, you must refrain from using any part of this code.
 *
 *  For full license terms and conditions, you can read the AGPL-3.0 here:
 *  https://www.gnu.org/licenses/agpl-3.0.html
 */

import useGame from '../stores/store';
import HelpModal from './helpModal/HelpModal';
import useAnimatedNumber from '../hooks/useAnimatedNumber';
import WalletManager from '../components/WalletManager';
import './style.css';

const Interface = () => {
  const { modal, coins, win, bet, phase, updateBet } = useGame(
    (state) => state
  );
  const animatedCoins = useAnimatedNumber(coins);
  return (
    <>
      {/* Wallet Manager */}
      <WalletManager />

      {/* Modal */}
      {modal && <HelpModal />}

      {/* Logo */}
      <div id="logo-section">
        <div className="logo-container">
          {/* You can choose between text and SVG logo */}
          <div className="logo-text">
            IRYS SLOTS
          </div>
          {/* Alternatively, you can use SVG logo:
          <img className="logo" src="./images/irys-slots-logo.svg" alt="IRYS Slots" />
          */}
        </div>

        <div id="version">{__APP_VERSION__}</div>
      </div>

      <div className="interface">
        {/* Game UI - new layout */}
        <div className="game-ui">
          {/* Win section */}
          <div className="win-section">
            <div className="win-number">WIN: {win}</div>
          </div>

          {/* Bet section */}
          <div className="bet-section">
            <div className="bet-label">BET:</div>
            <div className="bet-amount">{bet}</div>
            <div id="bet-controls" className={phase === 'idle' ? '' : 'hidden'}>
              <div
                id="increase-bet"
                className="bet-control"
                onClick={() => updateBet(1)}
              >
                ⏶
              </div>
              <div
                id="decrease-bet"
                className="bet-control"
                onClick={() => updateBet(-1)}
              >
                ⏷
              </div>
            </div>
          </div>

          {/* Coins section */}
          <div className="coins-section">
            <div className="coins-number">{animatedCoins}</div>
            <img className="coins-image" src="./images/coin.png" alt="Coins" />
          </div>
        </div>
      </div>
    </>
  );
};

export default Interface;
