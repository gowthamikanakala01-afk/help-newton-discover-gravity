/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Lobby from './components/Lobby';
import GameCanvas from './components/GameCanvas';
import EndingModal from './components/EndingModal';
import { EndingId, GameStats, Difficulty } from './types';
import { gameAudio } from './utils/audio';

type ActiveView = 'lobby' | 'playing';

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('lobby');
  const [activeEnding, setActiveEnding] = useState<EndingId>('none');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    applesGuided: 0,
    fruitsDeflected: 0,
    timeRemaining: 60
  });

  const handleStartGame = () => {
    setActiveEnding('none');
    setActiveView('playing');
    gameAudio.stopAmbientLoop();
  };

  const handleGameEnd = (ending: EndingId, gameStats: GameStats) => {
    setStats(gameStats);
    setActiveEnding(ending);
  };

  const handleRestart = () => {
    setActiveEnding('none');
    setActiveView('playing');
    gameAudio.resume();
  };

  const handleBackToLobby = () => {
    setActiveEnding('none');
    setActiveView('lobby');
    gameAudio.startAmbientLoop();
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-white overflow-hidden select-none">
      <AnimatePresence mode="wait">
        {activeView === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            <Lobby
              difficulty={difficulty}
              onDifficultyChange={setDifficulty}
              onStartGame={handleStartGame}
            />
          </motion.div>
        )}

        {activeView === 'playing' && (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full flex flex-col min-h-screen"
          >
            <GameCanvas
              difficulty={difficulty}
              onBack={handleBackToLobby}
              onGameEnd={handleGameEnd}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Ending Screen overlays */}
      <AnimatePresence>
        {activeEnding !== 'none' && (
          <EndingModal
            endingId={activeEnding}
            stats={stats}
            onRestart={handleRestart}
            onBackToLobby={handleBackToLobby}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
