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

import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
  useCallback,
} from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import useGame from './stores/store';
import devLog from './utils/functions/devLog';
import segmentToFruit from './utils/functions/segmentToFruit';
import calculateWin from './utils/functions/calculateWin';
import { apiClient } from './utils/api';
import { blockchainService } from './utils/blockchain';
import { WHEEL_SEGMENT } from './utils/constants';
import Reel from './Reel';
import Button from './Button';

interface ReelGroup extends THREE.Group {
  reelSegment?: number;
  reelSpinUntil?: number;
  reelStopSegment?: number;
  isSnapping?: boolean;
  targetRotationX?: number;
}

interface SlotMachineProps {
  value: (0 | 1 | 2 | 3 | 4 | 5 | 6 | 7)[];
}

const SlotMachine = forwardRef(({ value }: SlotMachineProps, ref) => {
  const {
    fruit0,
    fruit1,
    fruit2,
    setFruit0,
    setFruit1,
    setFruit2,
    setWin,
    phase,
    start,
    end,
    addSpin,
    bet,
    coins,
    updateCoins,
    isProcessingTransaction,
    setProcessingTransaction,
    setShowTransactionModal,
  } = useGame((state) => state);

  const reelRefs = [
    useRef<ReelGroup>(null),
    useRef<ReelGroup>(null),
    useRef<ReelGroup>(null),
  ];

  const [, setStoppedReels] = useState(0);
  const spinInProgressRef = useRef(false);
  const resultProcessedRef = useRef(false);

  // Handle blockchain game results
  const handleBlockchainGameResult = async (winAmount: number, betAmount: number) => {
    setProcessingTransaction(true);

    // Show modal after 5 seconds delay
    const modalTimeoutId = setTimeout(() => {
      setShowTransactionModal(true);
    }, 5000);

    // Set timeout to prevent infinite processing state
    const processingTimeoutId = setTimeout(() => {
      devLog('Transaction timeout - resetting processing state');
      setProcessingTransaction(false);
      setShowTransactionModal(false);
    }, 30000); // 30 seconds timeout

    try {
      const address = await blockchainService.getAddress();
      if (!address) {
        setProcessingTransaction(false);
        return;
      }

      // Prepare game result data
      const gameResult = {
        playerAddress: address,
        betAmount: betAmount,
        winAmount: winAmount,
        gameData: {
          fruit0: fruit0,
          fruit1: fruit1,
          fruit2: fruit2,
          timestamp: Date.now()
        }
      };

      devLog('Sending game result to server');

      // Send to server
      const response = await apiClient.submitGameResult(gameResult);

      if (response.success && response.data) {
        devLog('Server response received');

        // Update local state with server response
        const newBalanceCoins = response.data.newBalance;
        updateCoins(newBalanceCoins - coins); // Update to match server balance

        if (response.data.txHash) {
          devLog(`Transaction hash: ${response.data.txHash}`);
        }
      } else {
        devLog(`Server error: ${response.error}`);
        // Fallback to local balance update if server fails
        updateCoins(winAmount - betAmount);
      }


    } catch (error) {
      devLog(`Error handling blockchain game result: ${error}`);
      // Fallback to local balance update
      updateCoins(winAmount - betAmount);
    } finally {
      // Clear timeouts and reset processing state
      clearTimeout(modalTimeoutId);
      clearTimeout(processingTimeoutId);
      setProcessingTransaction(false);
      setShowTransactionModal(false);
    }
  };

  useEffect(() => {
    devLog('PHASE: ' + phase);
    if (phase === 'idle' && (fruit0 || fruit1 || fruit2) && spinInProgressRef.current && !resultProcessedRef.current) {
      // Only calculate win if we have fruits AND a spin was just completed AND result not yet processed
      const coinsWon = calculateWin(fruit0, fruit1, fruit2) * bet;
      devLog(`Adding ${coinsWon} coins as winnings`);
      setWin(coinsWon);

      // Mark result as processed to prevent re-triggering
      resultProcessedRef.current = true;

      // Always use blockchain integration
      if (blockchainService.isConnected()) {
        handleBlockchainGameResult(coinsWon, bet); // Send win amount and bet to server
      } else {
        devLog('Blockchain not connected - cannot process game result');
      }

      spinInProgressRef.current = false; // Reset spin flag when idle
    }
  }, [phase, fruit0, fruit1, fruit2, bet]);

  const spinSlotMachine = useCallback(async () => {
    // Check if we can spin and deduct coins
    if (phase === 'spinning' || coins < bet || spinInProgressRef.current || isProcessingTransaction) {
      return;
    }

    // Blockchain checks (always required)
    if (!blockchainService.isConnected()) {
      devLog('Wallet not connected');
      return;
    }

    const address = await blockchainService.getAddress();
    if (!address) {
      devLog('Wallet not connected');
      return;
    }

    const betInIRYS = (bet / 100).toFixed(4); // Convert coins to IRYS
    const hasSufficient = await blockchainService.hasSufficientBalance(address, betInIRYS);
    if (!hasSufficient) {
      devLog('Insufficient blockchain balance for bet');
      return;
    }

    spinInProgressRef.current = true; // Mark spin as in progress
    resultProcessedRef.current = false; // Reset result processing flag
    devLog(`Deducting ${bet} coins. Current coins: ${coins}`);
    setWin(0);
    start();
    setStoppedReels(0);
    addSpin();

    // Bet deduction is handled by the server in blockchain mode

    const min = 10;
    const max = 35;
    const getRandomStopSegment = () =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    setFruit0('');
    setFruit1('');
    setFruit2('');

    for (let i = 0; i < 3; i++) {
      const reel = reelRefs[i].current;
      if (reel) {
        reel.rotation.x = 0;
        reel.reelSegment = 0;
        const stopSegment = getRandomStopSegment();
        reel.reelSpinUntil = stopSegment;
        reel.targetRotationX = stopSegment * WHEEL_SEGMENT;
        reel.isSnapping = false;
      }
    }
  }, [phase, coins, bet, setWin, start, setStoppedReels, addSpin, updateCoins, setFruit0, setFruit1, setFruit2]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault(); // Prevent default space behavior
        spinSlotMachine();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [spinSlotMachine]);

  useFrame(() => {
    for (let i = 0; i < reelRefs.length; i++) {
      const reel = reelRefs[i].current;
      if (
        !reel ||
        reel.reelSpinUntil === undefined ||
        reel.targetRotationX === undefined
      )
        continue;

      const rotationSpeed = 0.1;

      if (!reel.isSnapping) {
        if (reel.rotation.x < reel.targetRotationX - rotationSpeed) {
          reel.rotation.x += rotationSpeed;
          reel.reelSegment = Math.floor(reel.rotation.x / WHEEL_SEGMENT);
        } else {
          reel.isSnapping = true;
        }
      }

      if (reel.isSnapping) {
        reel.rotation.x = THREE.MathUtils.lerp(
          reel.rotation.x,
          reel.targetRotationX,
          0.2
        );

        if (Math.abs(reel.rotation.x - reel.targetRotationX) < 0.01) {
          reel.rotation.x = reel.targetRotationX;

          const fruit = segmentToFruit(i, reel.reelSpinUntil);
          if (fruit) {
            if (i === 0) setFruit0(fruit);
            if (i === 1) setFruit1(fruit);
            if (i === 2) setFruit2(fruit);
          }

          devLog(
            `Reel ${i + 1} stopped at segment ${reel.reelSpinUntil} (${fruit})`
          );

          reel.reelSpinUntil = undefined;
          reel.isSnapping = false;

          setStoppedReels((prev) => {
            const newStopped = prev + 1;
            if (newStopped === 3) {
              setTimeout(() => {
                end();
              }, 1000);
            }
            return newStopped;
          });
        }
      }
    }
  });

  useImperativeHandle(ref, () => ({
    reelRefs,
  }));

  const [buttonZ, setButtonZ] = useState(0);
  const [buttonY, setButtonY] = useState(-13);

  return (
    <>
      <Reel
        ref={reelRefs[0]}
        value={value[0]}
        map={0}
        position={[-7, 0, 0]}
        rotation={[0, 0, 0]}
        scale={[10, 10, 10]}
        reelSegment={0}
      />
      <Reel
        ref={reelRefs[1]}
        value={value[1]}
        map={1}
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        scale={[10, 10, 10]}
        reelSegment={0}
      />
      <Reel
        ref={reelRefs[2]}
        value={value[2]}
        map={2}
        position={[7, 0, 0]}
        rotation={[0, 0, 0]}
        scale={[10, 10, 10]}
        reelSegment={0}
      />
      <Button
        scale={[0.055, 0.045, 0.045]}
        position={[0, buttonY, buttonZ]}
        rotation={[-Math.PI / 8, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          spinSlotMachine();
        }}
        onPointerDown={() => {
          setButtonZ(-1);
          setButtonY(-13.5);
        }}
        onPointerUp={() => {
          setButtonZ(0);
          setButtonY(-13);
        }}
      />
    </>
  );
});

export default SlotMachine;
