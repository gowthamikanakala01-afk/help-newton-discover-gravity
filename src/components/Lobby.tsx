/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, Volume2, VolumeX, ShieldQuestion, HelpCircle, AlertCircle } from 'lucide-react';
import { gameAudio } from '../utils/audio';
import { Difficulty } from '../types';

interface LobbyProps {
  difficulty: Difficulty;
  onDifficultyChange: (difficulty: Difficulty) => void;
  onStartGame: () => void;
}

export default function Lobby({ difficulty, onDifficultyChange, onStartGame }: LobbyProps) {
  const [muted, setMuted] = useState(false);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    // Sound settings persist
    const storedMute = localStorage.getItem('newton_gravity_muted') === 'true';
    setMuted(storedMute);
    gameAudio.setMute(storedMute);
    
    // Start ambient chimes loop
    gameAudio.startAmbientLoop();
    return () => {
      // Don't stop unless explicit, but let's keep it clean
    };
  }, []);

  const toggleSound = () => {
    const newState = !muted;
    setMuted(newState);
    gameAudio.setMute(newState);
    localStorage.setItem('newton_gravity_muted', String(newState));
    gameAudio.resume();
    // Play sound test
    if (!newState) {
      gameAudio.playDeflect();
    }
  };

  const handleStartWithSound = () => {
    gameAudio.resume();
    // Warm-up play sound
    gameAudio.playDeflect();
    onStartGame();
  };

  return (
    <div className="min-h-screen bg-[#020617] text-[#f8fafc] flex flex-col items-center justify-between p-6 md:p-12 font-serif overflow-hidden relative select-none">
      
      {/* Editorial Radial Ground Atmosphere Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_100%,#1e1b4b_0%,#020617_100%)]" />
      
      {/* Atmospheric Star Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

      {/* Header with audio control & stats */}
      <header className="w-full max-w-5xl flex items-center justify-between z-10 border-b border-white/10 pb-6">
        <div className="flex flex-col text-left">
          <div className="font-sans text-[10px] text-slate-400 uppercase tracking-[0.3em] leading-none mb-1">
            Subject
          </div>
          <div className="font-serif text-lg font-light tracking-wide text-white">
            ISAAC NEWTON
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <div className="font-sans text-[10px] text-emerald-400 uppercase tracking-[0.3em] leading-none mb-1">
              SYSTEM STATUS
            </div>
            <div className="font-mono text-xs text-slate-300">
              00:42.08 SYNCED
            </div>
          </div>

          <button
            onClick={toggleSound}
            className="p-3 bg-transparent border border-white/10 hover:border-white/30 rounded-none transition-all cursor-pointer text-slate-300 hover:text-white"
            title={muted ? "Unmute sounds" : "Mute sounds"}
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full z-10 text-center py-12">
        
        {/* Apple icon highlight floating */}
        <motion.div
          animate={{ y: [0, -8, 0], rotate: [0, 2, -2, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="text-6xl md:text-7xl mb-8 relative drop-shadow-[0_0_20px_rgba(239,68,68,0.25)] flex justify-center cursor-pointer select-none"
          onClick={() => { gameAudio.resume(); gameAudio.playBonk(true); }}
        >
          🍎
        </motion.div>

        {/* Title in fine Editorial Style */}
        <div className="mb-2">
          <div className="font-sans text-[10px] text-slate-400 uppercase tracking-[0.35em] font-medium mb-3">
            An Alternative-History Spatial Experiment
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-normal font-serif tracking-tight text-white leading-[1.1] mb-6">
            Help Newton <br />
            <span className="italic font-light text-slate-100">Discover Gravity</span>
          </h1>
        </div>

        {/* Play Controls Panel */}
        <div className="w-full max-w-md flex flex-col gap-4 px-4 mt-4 font-sans">
          <button
            onClick={handleStartWithSound}
            className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-sans uppercase font-medium text-xs tracking-[0.25em] active:scale-[0.98] transition-all cursor-pointer border border-white/10 shadow-lg"
          >
            Begin Temporal Mission
          </button>
        </div>

        {/* Difficulty Selector */}
        <div className="w-full max-w-md px-4 mt-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-sans text-slate-400 uppercase tracking-[0.3em] text-center font-medium">
              TEMPORAL CHRONOLOGY DENSITY
            </label>
            <div className="flex border border-white/10 p-1 bg-slate-950/60 backdrop-blur-md rounded-none">
              {(['easy', 'medium', 'hard'] as const).map((level) => {
                const isActive = difficulty === level;
                const labels: Record<string, string> = {
                  easy: 'EASY',
                  medium: 'MEDIUM',
                  hard: 'HARD',
                };
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => {
                      onDifficultyChange(level);
                      gameAudio.playDeflect();
                    }}
                    className={`flex-1 py-2 text-xs font-sans uppercase font-medium tracking-[0.1em] transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white text-slate-950 px-2'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {labels[level]}
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-center italic text-slate-400 font-serif leading-normal mt-1 max-w-md mx-auto">
              {difficulty === 'easy' && "★ Calm orchard. Gentle breezes, broad gravity fields, and sparse hazards. Catch all apples before time expires!"}
              {difficulty === 'medium' && "★★ Standard timeline. Balanced gravity field, moderate hazards. Catch all apples before time expires!"}
              {difficulty === 'hard' && "★★★ Cosmic turbulence! Rapid debris, narrower gravity wells. Expert focus is needed to catch all apples before time expires!"}
            </p>
          </div>
        </div>

        {/* Elegant quote with double lines */}
        <div className="mt-12 max-w-sm border-y border-white/10 py-4 opacity-75">
          <p className="text-xs italic font-serif text-slate-300">
            "If I have seen further, it is because I did not get struck by a tropical coconut on a pitch-black midnight under an orchard." <br />
            <span className="text-[10px] text-slate-400 not-italic block mt-1 font-sans">— Sir Isaac Newton, probably</span>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl text-center py-6 text-[10px] font-sans uppercase tracking-[0.2em] text-slate-500 border-t border-white/10 z-10 flex flex-col md:flex-row justify-between gap-4">
        <span>© MDCLXVI • SACRED NATURAL PHILOSOPHY</span>
        <span>CRAFTED IN EDITORIAL FORMAT</span>
      </footer>

      {/* Explanatory Manual Overlay */}
      <AnimatePresence>
        {showManual && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/95 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-white/10 rounded-none p-6 md:p-8 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                <div className="text-amber-500">
                  <HelpCircle className="w-5 h-5 animate-pulse" />
                </div>
                <h3 className="text-base font-sans uppercase tracking-[0.2em] text-white">Lab Experiment Protocol</h3>
              </div>

              <div className="space-y-6 font-serif text-slate-300">
                <div className="space-y-1">
                  <h4 className="font-sans font-bold text-amber-500 text-[10px] tracking-[0.25em] uppercase">
                    🌌 Core Mechanic: Gravity Field
                  </h4>
                  <p className="leading-relaxed text-xs">
                    Move your cursor or touch-drag to create a <b>gravity pull</b>. Bends the trajectory of all falling elements.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-sans font-bold text-slate-400 text-[10px] tracking-[0.25em] uppercase">
                    🍎 Primary Target
                  </h4>
                  <p className="leading-relaxed text-xs">
                    Guide the falling <b>Apple 🍎</b> onto Newton's head. This launches the true timeline.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-sans font-bold text-rose-400 text-[10px] tracking-[0.25em] uppercase">
                    🥥 Avoid Threats
                  </h4>
                  <p className="leading-relaxed text-xs">
                    Deflect <b>wrong fruits</b> (coconuts 🥥, oranges 🍊, bananas 🍌, pears 🍐) away from Newton. They warp the timeline.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowManual(false)}
                className="w-full py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-sans uppercase font-medium text-xs tracking-[0.2em] mt-8 active:scale-95 transition-all cursor-pointer"
              >
                Return to Orchard
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
