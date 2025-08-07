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

import useGame from '../../stores/store';
import './style.css';

const HelpModal = () => {
  const { setModal, showBars, toggleBars } = useGame((state) => state);

  return (
    <div className="modal" onClick={() => setModal(false)}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-main">
          <div className="modal-text">
            <strong>🎰 IRYS Slots - Blockchain Slot Machine</strong>
          </div>
          <div className="modal-text">
            Connect your MetaMask wallet and deposit IRYS tokens to play.
          </div>
          <div className="modal-text">
            Click SPIN button or press SPACE to spin. Each spin costs 1 coin (0.01 IRYS).
          </div>
          <div className="modal-text">
            Matches count from left to right. Click and drag to rotate the 3D view.
          </div>
          
          <div className="modal-text">
            <strong>💰 Payout Table (multiplied by bet):</strong>
          </div>
          <div id="paytable">
            <div className="modal-text">
              <img className="modal-image" src="./images/cherry.png" />
              <img className="modal-image" src="./images/cherry.png" />
              <img className="modal-image" src="./images/cherry.png" />
              <span> Pay 21x </span>
              <img className="modal-image" src="./images/coin.png" />
            </div>
            <div className="modal-text">
              <img className="modal-image" src="./images/cherry.png" />
              <img className="modal-image" src="./images/cherry.png" />
              <span> Pay 16x </span>
              <img className="modal-image" src="./images/coin.png" />
            </div>
            <div className="modal-text">
              <img className="modal-image" src="./images/apple.png" />
              <img className="modal-image" src="./images/apple.png" />
              <img className="modal-image" src="./images/apple.png" />
              <span> Pay 8x </span>
              <img className="modal-image" src="./images/coin.png" />
            </div>
            <div className="modal-text">
              <img className="modal-image" src="./images/apple.png" />
              <img className="modal-image" src="./images/apple.png" />
              <span> Pay 4x </span>
              <img className="modal-image" src="./images/coin.png" />
            </div>
            <div className="modal-text">
              <img className="modal-image" src="./images/banana.png" />
              <img className="modal-image" src="./images/banana.png" />
              <img className="modal-image" src="./images/banana.png" />
              <span> Pay 6x </span>
              <img className="modal-image" src="./images/coin.png" />
            </div>
            <div className="modal-text">
              <img className="modal-image" src="./images/banana.png" />
              <img className="modal-image" src="./images/banana.png" />
              <span> Pay 2x </span>
              <img className="modal-image" src="./images/coin.png" />
            </div>
            <div className="modal-text">
              <img className="modal-image" src="./images/lemon.png" />
              <img className="modal-image" src="./images/lemon.png" />
              <img className="modal-image" src="./images/lemon.png" />
              <span> Pay 3x </span>
              <img className="modal-image" src="./images/coin.png" />
            </div>
          </div>
          
          <div className="modal-text">
            <strong>🔗 Blockchain Features:</strong>
          </div>
          <div className="modal-text">
            • All transactions are recorded on IRYS blockchain
          </div>
          <div className="modal-text">
            • Provably fair gaming with smart contracts
          </div>
          <div className="modal-text">
            • Instant deposits and withdrawals
          </div>
          <div className="modal-text">
            • 1 IRYS = 100 coins in-game
          </div>

          <button className="bars-toggle-button" onClick={toggleBars}>
            {showBars ? 'Hide' : 'Show'} Bars
          </button>

          <div className="modal-footer">
            <div>
              <a
                className="modal-link"
                href="https://iryslots.xyz"
                target="_blank"
                rel="noopener noreferrer"
              >
                🎰 IRYS Slots
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
