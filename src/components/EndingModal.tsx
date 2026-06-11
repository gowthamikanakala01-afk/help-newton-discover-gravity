/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Clock, Calendar, RefreshCcw, Landmark, Book, Sparkles, Home, ArrowRight, ShieldAlert } from 'lucide-react';
import { EndingId, GameStats } from '../types';
import { ALL_ENDINGS } from '../utils/endings';

interface EndingModalProps {
  endingId: EndingId;
  stats: GameStats;
  onRestart: () => void;
  onBackToLobby: () => void;
}

export default function EndingModal({ endingId, stats, onRestart, onBackToLobby }: EndingModalProps) {
  const ending = ALL_ENDINGS[endingId] || ALL_ENDINGS.none;
  const isGravityCanon = endingId === 'gravity';
  const isTimeout = endingId === 'timeout';

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 overflow-y-auto selection:bg-amber-500 selection:text-slate-950 font-serif">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(30,27,75,0.4),transparent_60%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative z-10 w-full max-w-xl bg-slate-900 border ${
          isGravityCanon 
            ? 'border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.05)] bg-[radial-gradient(circle_at_50%_100%,#064e3b_0%,#0f172a_100%)]' 
            : 'border-white/10 shadow-2xl'
        } rounded-none p-6 md:p-8 flex flex-col items-center text-center`}
      >
        
        {/* Large Decorative Fruit Emoji */}
        <motion.div
          animate={isGravityCanon ? { scale: [1, 1.1, 1] } : { y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="text-5xl p-4 bg-transparent border border-white/10 flex items-center justify-center w-20 h-20 mb-6 shadow-md"
        >
          {ending.emoji}
        </motion.div>

        {/* Main Title Banner */}
        <h2 className="font-sans text-[10px] tracking-[0.3em] font-bold text-amber-500 uppercase">
          {isGravityCanon ? 'TEMPORAL OBSERVATION FULLY RESOLVED' : 'COSMIC FIELD INTERRUPTION'}
        </h2>

        <h3 className="text-xl md:text-2xl font-normal text-white mt-2 leading-tight font-serif max-w-md">
          {ending.title}
        </h3>

        {/* Dynamic subtext specific to Newton */}
        {isGravityCanon ? (
          <p className="font-sans text-[9px] text-emerald-400 uppercase tracking-[0.2em] bg-emerald-950/30 border border-emerald-900/40 px-3 py-1 rounded-none mt-3">
            The laws of motion are safe
          </p>
        ) : (
          <p className="font-sans text-[9px] text-amber-300 uppercase tracking-[0.2em] bg-amber-950/30 border border-amber-900/45 px-3 py-1 rounded-none mt-3 flex items-center gap-1.5">
            <ShieldAlert className="w-3 h-3" /> ALTERNATIVE EQUATION UNFOLDING
          </p>
        )}

        {/* Historical Impact Narrative Card */}
        <div className="w-full bg-slate-950/40 border border-white/10 rounded-none p-6 my-6 text-slate-300 text-left relative font-serif">
          <span className="text-[10px] font-mono text-slate-500 block uppercase tracking-[0.3em] mb-4">HISTORIOMETRIC ANALYSIS</span>
          <p className="text-lg md:text-xl leading-relaxed text-slate-100 font-normal italic font-funny">
            "{ending.text}"
          </p>

          {isTimeout && (
            <div className="space-y-1.5 text-slate-400 text-sm border-t border-white/10 pt-4 mt-4 font-light font-funny">
              <p>• School curricula remain delightfully clear of vector physics.</p>
              <p>• Sir Isaac retired peacefully under simple balloons.</p>
            </div>
          )}

          {/* Render consequences if there are any */}
          {!isGravityCanon && !isTimeout && ending.consequences.length > 0 && (
            <div className="space-y-2 border-t border-white/10 pt-4 mt-4 text-sm text-slate-400 font-light font-funny">
              <span className="text-[10px] font-sans text-slate-500 block uppercase tracking-[0.2em] font-bold">MUTATIONS OBSERVED:</span>
              {ending.consequences.slice(0, 3).map((con, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  <span>{con}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Clear Status Message */}
        <div className="w-full mb-8 font-sans">
          <div className="text-center">
            <span className={`text-4xl font-black uppercase tracking-[0.1em] ${isGravityCanon ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isGravityCanon ? 'YOU WON' : 'YOU LOST'}
            </span>
          </div>
        </div>

        {/* Action button triggers */}
        <div className="w-full sm:max-w-xs mx-auto font-sans">
          <button
            onClick={onBackToLobby}
            className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-sans uppercase font-medium text-xs tracking-[0.25em] active:scale-[0.98] transition-all cursor-pointer border border-white/10 shadow-lg flex items-center justify-center gap-2"
          >
            <Home className="w-3.5 h-3.5" /> Return to Lobby
          </button>
        </div>

      </motion.div>
    </div>
  );
}
