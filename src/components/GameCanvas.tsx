/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Trophy, ChevronRight, Play, Volume2, VolumeX, ArrowLeft, RefreshCw, Sparkles, BookOpen } from 'lucide-react';
import { Fruit, FruitType, Particle, GameStats, EndingDetails, EndingId, Difficulty } from '../types';
import { ALL_ENDINGS } from '../utils/endings';
import { gameAudio } from '../utils/audio';

// Virtual coordinate space (maintains absolute physics consistency regardless of viewport size)
const V_WIDTH = 1000;
const V_HEIGHT = 750;

interface GameCanvasProps {
  difficulty: Difficulty;
  onBack: () => void;
  onGameEnd: (ending: EndingId, stats: GameStats) => void;
}

export default function GameCanvas({ difficulty, onBack, onGameEnd }: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const flowersRef = useRef<{ x: number; y: number; color: string }[]>([]);

  // Stats react-side to render minimal HUD overlay
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    applesGuided: 0,
    fruitsDeflected: 0,
    timeRemaining: 60,
  });

  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [cinematicPhase, setCinematicPhase] = useState<'playing' | 'eureka' | 'wrong_hit' | 'timeout'>('playing');
  const [hitFruit, setHitFruit] = useState<string | null>(null);

  // References for mutable game variables accessed in the animation loop
  const stateRef = useRef<{
    fruits: Fruit[];
    particles: Particle[];
    mouseX: number;
    mouseY: number;
    mouseActive: boolean;
    lastSpawnTime: number;
    spawnInterval: number; // millseconds
    score: number;
    applesGuided: number;
    fruitsDeflected: number;
    timeRemaining: number;
    gameTime: number;
    newtonExpression: 'reading' | 'surprised' | 'dizzy' | 'slipping' | 'orange_mech' | 'pear';
    newtonFaceTimer: number;
    eurekaTimer: number;
    endingTriggered: boolean;
    gravRadius: number;
    applesTotal: number;
    lastAppleSpawnTime: number;
  }>({
    fruits: [],
    particles: [],
    mouseX: -500,
    mouseY: -500,
    mouseActive: false,
    lastSpawnTime: 0,
    spawnInterval: 1805, // 1.8 seconds initial spawn delay
    score: 0,
    applesGuided: 0,
    fruitsDeflected: 0,
    timeRemaining: 45,
    gameTime: 0,
    newtonExpression: 'reading',
    newtonFaceTimer: 0,
    eurekaTimer: 0,
    endingTriggered: false,
    gravRadius: 150,
    applesTotal: 5,
    lastAppleSpawnTime: 0,
  });

  // Sound sync trigger on start
  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    const isMuted = localStorage.getItem('newton_gravity_muted') === 'true';
    setMuted(isMuted);
    gameAudio.setMute(isMuted);
    gameAudio.resume();

    // Timer countdown
    const timer = setInterval(() => {
      if (cinematicPhase !== 'playing' || !isPlaying) return;

      stateRef.current.timeRemaining -= 1;
      setStats(prev => ({ ...prev, timeRemaining: stateRef.current.timeRemaining }));

      if (stateRef.current.timeRemaining % 5 === 0) {
        // Soft audio alert
        gameAudio.playTimerTick();
      }

      if (stateRef.current.timeRemaining <= 0) {
        clearInterval(timer);
        if (stateRef.current.applesGuided >= stateRef.current.applesTotal) {
          triggerEureka();
        } else {
          triggerTimeout();
        }
      }
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [cinematicPhase, isPlaying]);

  const toggleSound = () => {
    const newState = !muted;
    setMuted(newState);
    gameAudio.setMute(newState);
    localStorage.setItem('newton_gravity_muted', String(newState));
  };

  // Reset/Initiate Game variables
  const initGame = () => {
    const flowerColors = ['#fef08a', '#fdba74', '#fbcfe8'];
    flowersRef.current = [];
    for (let i = 0; i < 25; i++) {
        flowersRef.current.push({
            x: Math.random() * V_WIDTH,
            y: 640 + Math.random() * 90,
            color: flowerColors[Math.floor(Math.random() * flowerColors.length)]
        });
    }

    const timeLimit = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 30 : 50;
    const targetApples = difficulty === 'easy' ? 3 : difficulty === 'medium' ? 5 : 7;
    const initialGravRadius = difficulty === 'easy' ? 180 : difficulty === 'medium' ? 150 : 120;
    const initialSpawnInterval = difficulty === 'easy' ? 2000 : difficulty === 'medium' ? 1600 : 1200;

    stateRef.current = {
      fruits: [],
      particles: [],
      mouseX: -500,
      mouseY: -500,
      mouseActive: false,
      lastSpawnTime: 0,
      spawnInterval: initialSpawnInterval,
      score: 0,
      applesGuided: 0,
      fruitsDeflected: 0,
      timeRemaining: timeLimit,
      gameTime: 0,
      newtonExpression: 'reading',
      newtonFaceTimer: 0,
      eurekaTimer: 0,
      endingTriggered: false,
      gravRadius: initialGravRadius,
      applesTotal: targetApples,
      lastAppleSpawnTime: 0,
    };
    setStats({
      score: 0,
      applesGuided: 0,
      fruitsDeflected: 0,
      timeRemaining: timeLimit,
    });
    setCinematicPhase('playing');
    setHitFruit(null);
    setIsPlaying(true);
  };

  // Trigger win sequence
  const triggerEureka = () => {
    setCinematicPhase('eureka');
    stateRef.current.newtonExpression = 'surprised';
    gameAudio.playBonk(true);
    gameAudio.playEurekaFanfare();
    
    // Lock endings
    unlockTimelineEnding('gravity');

    // Spawn massive beautiful equations & confetti particles
    const equations = ['F = G·(Mm/r²)', 'F = m·a', 'g = 9.81 m/s²', '🍎 = 🌌', 'v = d/t', 'G_uv = 8πT_uv', 'p = m·v', 'E = mc²'];
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      stateRef.current.particles.push({
        id: Math.random().toString(),
        type: 'equation',
        x: 500,
        y: 560,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2, // Ascend slightly
        radius: 12 + Math.random() * 14,
        alpha: 1,
        life: 0,
        maxLife: 150 + Math.random() * 100,
        color: `hsl(${Math.random() * 360}, 85%, 70%)`,
        text: equations[Math.floor(Math.random() * equations.length)],
        rotation: Math.random() * Math.PI,
        rotationSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    // Sparkles
    for (let i = 0; i < 60; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 10;
      stateRef.current.particles.push({
        id: Math.random().toString(),
        type: 'confetti',
        x: 500,
        y: 560,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 3,
        radius: 3 + Math.random() * 8,
        alpha: 1,
        life: 0,
        maxLife: 120 + Math.random() * 80,
        color: `hsl(${Math.random() * 360}, 95%, 60%)`
      });
    }
  };

  // Trigger alternative history fruit hitting Newton
  const triggerAlternativeEnding = (fruit: FruitType) => {
    setCinematicPhase('wrong_hit');
    setHitFruit(fruit);
    stateRef.current.newtonFaceTimer = Date.now();
    gameAudio.playBonk(false);
    gameAudio.playFailureEnding();

    if (fruit === 'coconut') {
      stateRef.current.newtonExpression = 'dizzy';
      unlockTimelineEnding('coconut');
    } else if (fruit === 'banana') {
      stateRef.current.newtonExpression = 'slipping';
      unlockTimelineEnding('banana');
    } else if (fruit === 'orange') {
      stateRef.current.newtonExpression = 'orange_mech';
      unlockTimelineEnding('orange');
    } else if (fruit === 'pear') {
      stateRef.current.newtonExpression = 'pear';
      unlockTimelineEnding('pear');
    }

    // Spawn funny dust/cloud particles at the bonk site
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 4;
      stateRef.current.particles.push({
        id: Math.random().toString(),
        type: 'dust',
        x: 500,
        y: 560,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 4 + Math.random() * 10,
        alpha: 0.8,
        life: 0,
        maxLife: 60 + Math.random() * 40,
        color: '#94a3b8'
      });
    }
  };

  // Trigger dropped fruit on floor
  const triggerDroppedFruit = (fruit: FruitType) => {
    setCinematicPhase('wrong_hit');
    const ending = fruit === 'apple' ? 'missed_apple' : 'dropped_fruit';
    setHitFruit(ending);
    stateRef.current.newtonFaceTimer = Date.now();
    unlockTimelineEnding(ending as EndingId);
    gameAudio.playFailureEnding();
  };

  // Trigger timeout
  const triggerTimeout = () => {
    setCinematicPhase('timeout');
    stateRef.current.newtonExpression = 'reading';
    unlockTimelineEnding('timeout');
    gameAudio.playFailureEnding();
  };

  // Helper to save endings in localStorage - disabled to not track win/lose records
  const unlockTimelineEnding = (endingId: EndingId) => {
    // No-op: tracking of win/lose timeline records is removed
  };

  // Actual canvas frame loops
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    // Device Pixel Ratio scaling for absolute sharp rendering
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    // Use ResizeObserver for responsive bounds monitoring
    const observer = new ResizeObserver(() => {
      resizeCanvas();
    });
    if (canvas.parentElement) {
      observer.observe(canvas.parentElement);
    }
    resizeCanvas();

    // Spawn 15 standing background fireflies and stars initially
    const state = stateRef.current;
    
    // Add fireflies
    for (let i = 0; i < 25; i++) {
        state.particles.push({
            id: `firefly-${i}`,
            type: 'firefly',
            x: Math.random() * V_WIDTH,
            y: Math.random() * (V_HEIGHT - 200),
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            radius: 1.2 + Math.random() * 1.5,
            alpha: 0.1 + Math.random() * 0.6,
            life: 0,
            maxLife: 500 + Math.random() * 1000,
            color: 'rgba(253, 230, 138, 0.9)' // Soft yellow amber
        });
    }

    // Add stars
    for(let i=0; i<100; i++) {
        state.particles.push({
            id: `star-${i}`,
            type: 'star',
            x: Math.random() * V_WIDTH,
            y: Math.random() * (V_HEIGHT / 4), // Restrict to top 1/4 area
            vx: 0,
            vy: 0,
            radius: 0.5 + Math.random() * 1,
            alpha: 0.2 + Math.random() * 0.8,
            life: 0,
            maxLife: 100000, // perpetual
            color: 'white'
        });
    }

    // Core Animation loop function
    const loop = (timestamp: number) => {
      if (!isPlaying) {
        animId = requestAnimationFrame(loop);
        return;
      }

      // Calculate container width and scale ratio
      const rect = canvas.getBoundingClientRect();
      const scaleX = rect.width / V_WIDTH;
      const scaleY = rect.height / V_HEIGHT;

      // 1. UPDATE STATE
      state.gameTime += 16.67; // approx 60 FPS

      // Spawn Fruits periodically
      if (cinematicPhase === 'playing') {
        const timeSinceLastSpawn = state.gameTime - state.lastSpawnTime;
        
        // Spawn interval gets shorter over time (Difficulty Scaler)
        // Different base speeds based on difficulty
        const difficultyBaseInterval = difficulty === 'easy' ? 3500 : difficulty === 'medium' ? 2000 : 1500;
        const timeLimit = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 30 : 50;
        const difficultyProgress = Math.min((timeLimit - state.timeRemaining) / timeLimit, 1);
        const minInterval = difficulty === 'easy' ? 2000 : difficulty === 'medium' ? 1200 : 900;
        state.spawnInterval = difficultyBaseInterval - (difficultyProgress * (difficultyBaseInterval - minInterval)); 

        if (timeSinceLastSpawn >= state.spawnInterval) {
          const fruitTypes: FruitType[] = ['apple', 'apple', 'apple', 'orange', 'pear', 'coconut', 'banana'];
          
          // Force an Apple to spawn within first 3 seconds, and then weigh them properly
          let spawnedType: FruitType = 'coconut';
          if (state.fruits.filter(f => f.type === 'apple').length === 0 && state.gameTime < 3000) {
            spawnedType = 'apple';
          } else {
            const rand = Math.random();
            if (rand < 0.4) spawnedType = 'apple'; // Higher chance of apple
            else if (rand < 0.55) spawnedType = 'orange';
            else if (rand < 0.7) spawnedType = 'banana';
            else if (rand < 0.85) spawnedType = 'pear';
            else spawnedType = 'coconut';
          }

          const radius = spawnedType === 'coconut' ? 24 : spawnedType === 'banana' ? 20 : 18;
          const mass = spawnedType === 'coconut' ? 2.5 : spawnedType === 'banana' ? 0.8 : 1.2;
          const colors: Record<FruitType, string> = {
            apple: '#ef4444',
            orange: '#f97316',
            pear: '#a3e635',
            coconut: '#78350f',
            banana: '#eab308'
          };

          // Leaves branch locations to drop
          const dropX = 180 + Math.random() * 640;
          const dropY = 120 + Math.random() * 120;

          state.fruits.push({
            id: Math.random().toString(),
            type: spawnedType,
            x: dropX,
            y: dropY,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (difficulty === 'easy' ? 0.2 : difficulty === 'medium' ? 0.4 : 0.8) + Math.random() * (difficulty === 'easy' ? 0.5 : 1.0),
            radius,
            rotation: Math.random() * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            mass,
            color: colors[spawnedType],
            bounceCount: 0,
            isDeflected: false,
            scale: 0.1
          });

          state.lastSpawnTime = state.gameTime;
        }
      }

      // Physics logic for falling fruit
      state.fruits.forEach(f => {
        // Grow fruit scaling initially (like it fell off tree branch smoothly)
        if (f.scale < 1) f.scale += 0.05;

        // Apply normal gravity (faster over time as game accelerates)
        const timeLimit = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 30 : 50;
        const difficultyProgress = Math.min((timeLimit - state.timeRemaining) / timeLimit, 1);
        state.gravRadius = 160 - (difficultyProgress * 70); // Shrinks as game gets harder
        
        let baseGravity = 0.08;
        let gravityScale = 0.05;
        if (difficulty === 'easy') {
          baseGravity = 0.015; // Very slow
          gravityScale = 0.005;
        } else if (difficulty === 'medium') {
          baseGravity = 0.035; // Slow
          gravityScale = 0.015;
        } else {
          baseGravity = 0.07; // Little fast
          gravityScale = 0.03;
        }
        
        const activeNormalGravity = baseGravity + (difficultyProgress * gravityScale);
        f.vy += activeNormalGravity;

        // Apply cursor-driven gentle gravitational vacuum pull
        if (state.mouseActive) {
          const dx = state.mouseX - f.x;
          const dy = state.mouseY - f.y;
          const dist = Math.hypot(dx, dy);

          if (dist < state.gravRadius) {
            // Pull vector
            const forceStrength = 1.35 * (1 - dist / state.gravRadius); // strongest at center
            
            // Adjust acceleration based on mass
            const ax = (dx / dist) * forceStrength / f.mass;
            const ay = (dy / dist) * forceStrength / f.mass;

            // Apply force
            f.vx += ax;
            f.vy += ay;

            // Play audio feedback loop lightly
            if (state.gameTime % 200 < 17) {
              gameAudio.playGravityActive(forceStrength);
            }

            // Create little gravitational suction dust rings
            if (Math.random() < 0.25) {
              state.particles.push({
                id: Math.random().toString(),
                type: 'wave',
                x: f.x,
                y: f.y,
                vx: -ax * 1.5,
                vy: -ay * 1.5,
                radius: 2,
                alpha: 0.6,
                life: 0,
                maxLife: 25,
                color: f.color
              });
            }
          }
        }

        // Apply position velocities
        f.x += f.vx;
        f.y += f.vy;
        f.rotation += f.rotationSpeed;

        // Friction and air drag
        f.vx *= 0.985;
        f.vy *= 0.99;

        // Bounce off Left/Right limits
        if (f.x < f.radius) {
          f.x = f.radius;
          f.vx = Math.abs(f.vx) * 0.6;
          f.rotationSpeed *= -0.8;
          gameAudio.playDeflect();
        } else if (f.x > V_WIDTH - f.radius) {
          f.x = V_WIDTH - f.radius;
          f.vx = -Math.abs(f.vx) * 0.6;
          f.rotationSpeed *= -0.8;
          gameAudio.playDeflect();
        }

        // Bouncing off bottom ground
        const groundLevel = 640;
        if (f.y >= groundLevel - f.radius && f.vy > 0) {
          f.y = groundLevel - f.radius;
          f.vy = -f.vy * 0.45; // Organic energy loss
          f.vx *= 0.8;
          f.bounceCount += 1;

          if (Math.abs(f.vy) > 0.8) {
            gameAudio.playDeflect();
          }

          if (cinematicPhase === 'playing') {
            triggerDroppedFruit(f.type);
            return;
          }
        }

        // COLLISION WITH NEWTON
        let newtonX = 500;
        let newtonY = 580;
        if (state.gameTime < 2000) {
          const walkProgress = state.gameTime / 2000;
          newtonX = 1100 - (600 * walkProgress);
          newtonY = 580 - Math.abs(Math.sin(walkProgress * Math.PI * 8)) * 15;
        }

        const headDX = newtonX - f.x;
        const headDY = (newtonY - 35) - f.y;
        const headDist = Math.hypot(headDX, headDY);

        const chestDX = newtonX - f.x;
        const chestDY = (newtonY + 20) - f.y;
        const chestDist = Math.hypot(chestDX, chestDY);

        if (cinematicPhase === 'playing') {
          // If fruit collides with head
          if (headDist < (25 + f.radius) || chestDist < (40 + f.radius)) {
            // Filter fruit type
            if (f.type === 'apple') {
                state.applesGuided += 1;
                state.fruits = state.fruits.filter(item => item.id !== f.id);
                setStats(prev => ({ ...prev, applesGuided: state.applesGuided }));
                
                if (state.applesGuided >= state.applesTotal) {
                  triggerEureka();
                } else {
                  gameAudio.playDeflect(); // Simple sound for success-guided apple
                }
            } else {
              triggerAlternativeEnding(f.type);
            }
          }
        }
      });

      // Clear off-screen or dead fruits (either on floor too long or went stray)
      state.fruits = state.fruits.filter(f => {
        // Keeps healthy loops
        if (f.y > V_HEIGHT + 100) return false;
        if (f.bounceCount > 4 && Math.abs(f.vy) < 0.1) return false;
        if (f.x < -100 || f.x > V_WIDTH + 100) return false;
        if (f.y < -150) return false;
        return true;
      });

      // Maintain standing leaves particles
      // (Leaf particles removed as requested)

      // Update particle lifetimes
      state.particles.forEach(p => {
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;

        if (p.type === 'leaf') {
          // elegant fluttering sine wave motion
          p.vx += Math.sin(p.life / 20) * 0.03;
        }

        if (p.type === 'firefly') {
          // Brownian light hover
          p.vx += (Math.random() - 0.5) * 0.15;
          p.vy += (Math.random() - 0.5) * 0.15;
          p.alpha = 0.3 + Math.sin(p.life / 15) * 0.5;
        }

        if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
          p.rotation += p.rotationSpeed;
        }

        // Fade out
        p.alpha = Math.max(0, 1 - (p.life / p.maxLife));
      });

      // filter particles
      state.particles = state.particles.filter(p => p.life < p.maxLife);


      // 2. RENDERING CANVAS
      ctx.save();
      ctx.scale(scaleX, scaleY);

      ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);

      // --- LAYER 0: Background Deep Space Grid Atmosphere ---
      const bgGrad = ctx.createRadialGradient(V_WIDTH / 2, V_HEIGHT / 2, 50, V_WIDTH / 2, V_HEIGHT / 2, V_WIDTH / 1.1);
      bgGrad.addColorStop(0, '#0f172a'); // slate-900 center
      bgGrad.addColorStop(1, '#020617'); // dark slate-950 edges
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

      // --- LAYER 1: Deep Moon Rays & Soft Clouds ---
      ctx.fillStyle = 'rgba(253, 230, 138, 0.02)';
      ctx.beginPath();
      ctx.moveTo(800, 100);
      ctx.lineTo(200, V_HEIGHT);
      ctx.lineTo(0, V_HEIGHT);
      ctx.lineTo(500, 100);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(253, 230, 138, 0.01)';
      ctx.beginPath();
      ctx.moveTo(800, 100);
      ctx.lineTo(900, V_HEIGHT);
      ctx.lineTo(400, V_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // --- LAYER 2: Drifting Horizon Ground Fog ---
      const fogTime = state.gameTime * 0.0005;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fillRect(0, 600, V_WIDTH, 150);

      // --- LAYER 2.5: Grassy Land ---
      ctx.fillStyle = '#166534'; // Dark forest green
      ctx.beginPath();
      ctx.moveTo(0, 750);
      ctx.lineTo(V_WIDTH, 750);
      ctx.lineTo(V_WIDTH, 640);
      ctx.quadraticCurveTo(V_WIDTH / 2, 610, 0, 640);
      ctx.closePath();
      ctx.fill();

      // Small flowers
      flowersRef.current.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
        ctx.fill();
      });


      // --- LAYER 3: The Ancient Majestic Oak Tree ---
      // Render Stars (LAYER 2.5 - background)
      state.particles.filter(p => p.type === 'star').forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Trunk (gorgeous layered stroke gradients)
      const trunkGrad = ctx.createLinearGradient(400, 350, 600, 650);
      trunkGrad.addColorStop(0, '#1c1917'); // deep brown black
      trunkGrad.addColorStop(0.5, '#292524');
      trunkGrad.addColorStop(1, '#1c1917');
      ctx.fillStyle = trunkGrad;

      // Draw thick curved trunk base
      ctx.beginPath();
      ctx.moveTo(430, 650); // Left root
      ctx.quadraticCurveTo(460, 580, 470, 480);
      ctx.lineTo(460, 420);
      // split branches
      ctx.lineTo(400, 330);
      ctx.lineTo(435, 300);
      ctx.lineTo(480, 370);
      ctx.lineTo(520, 370);
      ctx.lineTo(565, 300);
      ctx.lineTo(600, 330);
      ctx.lineTo(540, 420);
      ctx.lineTo(530, 480);
      ctx.quadraticCurveTo(540, 580, 570, 650); // Right root
      ctx.closePath();
      ctx.fill();

      // Root splays details
      ctx.strokeStyle = '#0c0a09';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(462, 590);
      ctx.quadraticCurveTo(445, 620, 400, 645);
      ctx.moveTo(538, 590);
      ctx.quadraticCurveTo(555, 620, 600, 645);
      ctx.stroke();

      // Tree Bark textures
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(485, 480);
      ctx.lineTo(485, 560);
      ctx.moveTo(515, 460);
      ctx.lineTo(515, 540);
      ctx.stroke();

      // Foliage Clusters (Dense atmospheric layers of foliage with subtle wind swaying)
      const windAngle = Math.sin(state.gameTime / 1200) * 0.015;
      
      const foliageOffsetList = [
        { cx: 300, cy: 190, r: 130, color: 'rgba(15, 23, 42, 0.92)' }, // dark back layer
        { cx: 700, cy: 190, r: 130, color: 'rgba(15, 23, 42, 0.92)' },
        { cx: 500, cy: 150, r: 150, color: 'rgba(2, 44, 34, 0.85)' },  // organic teal-greens
        { cx: 200, cy: 260, r: 90, color: 'rgba(4, 47, 46, 0.8)' },
        { cx: 800, cy: 260, r: 90, color: 'rgba(4, 47, 46, 0.8)' },
        { cx: 330, cy: 230, r: 110, color: 'rgba(13, 148, 136, 0.15)' }, // glowing moon highlight overlay
        { cx: 670, cy: 230, r: 110, color: 'rgba(13, 148, 136, 0.15)' },
        { cx: 500, cy: 200, r: 120, color: 'rgba(15, 118, 110, 0.2)' }
      ];

      foliageOffsetList.forEach(cl => {
        ctx.save();
        ctx.translate(cl.cx + cl.cx * windAngle, cl.cy);
        ctx.fillStyle = cl.color;
        ctx.beginPath();
        ctx.arc(0, 0, cl.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // --- LAYER 4: Sir Isaac Newton & his book ---
      ctx.save();
      
      let newtonX = 500;
      let newtonY = 580;
      let walking = false;
      const WALK_DURATION = 2000;
      
      if (state.gameTime < WALK_DURATION) {
        walking = true;
        const walkProgress = state.gameTime / WALK_DURATION;
        newtonX = 1100 - (600 * walkProgress);
        newtonY = 580 - Math.abs(Math.sin(walkProgress * Math.PI * 8)) * 15;
      }
      
      ctx.translate(newtonX, newtonY); // Pivot anchor

      // Newton's body silhouette / coat
      ctx.fillStyle = '#1e1b4b'; // Deep navy blue
      ctx.beginPath();
      if (walking) {
        ctx.moveTo(-25, 70); 
        ctx.lineTo(-30, 40);
        ctx.quadraticCurveTo(-35, 15, -20, 10); 
        ctx.lineTo(20, 10); 
        ctx.quadraticCurveTo(35, 15, 30, 40);
        ctx.lineTo(25, 70);
      } else {
        ctx.moveTo(-35, 70); // Seat base
        ctx.lineTo(-45, 50);
        ctx.quadraticCurveTo(-45, 25, -25, 10); // Shoulder
        ctx.lineTo(25, 10); // Shoulder
        ctx.quadraticCurveTo(45, 25, 45, 50);
        ctx.lineTo(35, 70);
      }
      ctx.closePath();
      ctx.fill();

      // Lap sleeves & legs
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      if (walking) {
        const legOsc = Math.sin((state.gameTime / WALK_DURATION) * Math.PI * 8);
        ctx.arc(-15 + legOsc * 10, 70, 12, 0, Math.PI * 2);
        ctx.arc(15 - legOsc * 10, 70, 12, 0, Math.PI * 2);
      } else {
        ctx.arc(-22, 50, 16, 0, Math.PI * 2);
        ctx.arc(22, 50, 16, 0, Math.PI * 2);
      }
      ctx.fill();

      // Beautiful white cravat
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(-6, 5);
      ctx.lineTo(-12, 18);
      ctx.lineTo(12, 18);
      ctx.lineTo(6, 5);
      ctx.closePath();
      ctx.fill();

      // Face skin
      ctx.fillStyle = '#fed7aa'; // light peach skin
      ctx.beginPath();
      ctx.arc(0, -22, 18, 0, Math.PI * 2);
      ctx.fill();

      // Iconic curly grey/white Newtonian long wig
      ctx.fillStyle = '#cbd5e1'; // slate-300 curls
      const curls = [
        { x: -16, y: -26, r: 9 }, { x: -21, y: -16, r: 10 }, { x: -24, y: -5, r: 11 }, { x: -25, y: 8, r: 11 },
        { x: 16, y: -26, r: 9 }, { x: 21, y: -16, r: 10 }, { x: 24, y: -5, r: 11 }, { x: 25, y: 8, r: 11 },
        { x: 0, y: -36, r: 13 }, { x: -12, y: -34, r: 10 }, { x: 12, y: -34, r: 10 }
      ];
      curls.forEach(c => {
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
        ctx.fill();
        // ring outline
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Eyes and Glasses or expressions
      const faceExpr = state.newtonExpression;
      
      if (faceExpr === 'surprised') {
        // Wide surprise eyes
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2.5;
        // left eye
        ctx.beginPath(); ctx.arc(-6, -24, 4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.fillStyle = '#020617'; ctx.beginPath(); ctx.arc(-6, -24, 1.5, 0, Math.PI * 2); ctx.fill();
        // right eye
        ctx.beginPath(); ctx.arc(6, -24, 4, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.fillStyle = '#020617'; ctx.beginPath(); ctx.arc(6, -24, 1.5, 0, Math.PI * 2); ctx.fill();
        // Surprised open mouth
        ctx.strokeStyle = '#020617';
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(0, -13, 4, 0, Math.PI * 2);
        ctx.fill();

        // Shock lines overhead
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -48); ctx.lineTo(-15, -60);
        ctx.moveTo(0, -52); ctx.lineTo(0, -66);
        ctx.moveTo(10, -48); ctx.lineTo(15, -60);
        ctx.stroke();

      } else if (faceExpr === 'dizzy') {
        // Spiral dizzy spiral eyes
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        // left spiral
        ctx.beginPath();
        ctx.arc(-6, -24, 4, 0, Math.PI * 1.5);
        ctx.stroke();
        // right spiral
        ctx.beginPath();
        ctx.arc(6, -24, 4, 0, Math.PI * 1.5);
        ctx.stroke();

        // Sad wobbly mouth
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-5, -13);
        ctx.quadraticCurveTo(0, -16, 5, -13);
        ctx.stroke();

        // Bump swelling on head with cartoon stars
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(0, -38, 5, 0, Math.PI * 2);
        ctx.fill();

        // Little spinning stars overhead
        const bumpAngle = (state.gameTime / 150) % (Math.PI * 2);
        const bx = Math.cos(bumpAngle) * 16;
        const by = Math.sin(bumpAngle) * 6 - 54;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();

      } else if (faceExpr === 'slipping') {
        // Shock eyes
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        // crosses for eyes
        ctx.beginPath(); ctx.moveTo(-9, -27); ctx.lineTo(-3, -21); ctx.moveTo(-3, -27); ctx.lineTo(-9, -21); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(3, -27); ctx.lineTo(9, -21); ctx.moveTo(9, -27); ctx.lineTo(3, -21); ctx.stroke();

        // Open mouth
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.ellipse(0, -12, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Slip comic sign
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(-16, -60);
        ctx.quadraticCurveTo(0, -50, 16, -60);
        ctx.stroke();

      } else if (faceExpr === 'orange_mech') {
        // Cute sunglasses / smart monocle examining gravity juice!
        ctx.fillStyle = '#ea580c'; // shiny orange circle
        ctx.beginPath();
        ctx.arc(-6, -24, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // standard right eye
        ctx.strokeStyle = '#020617';
        ctx.beginPath(); ctx.arc(6, -23, 2, 0, Math.PI, true); ctx.stroke();

        // Tasting mouth
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -13);
        ctx.quadraticCurveTo(0, -9, 4, -13);
        ctx.stroke();

      } else if (faceExpr === 'pear') {
        // Scurrying scientists/confused researcher squinting
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        // squint slant lines
        ctx.beginPath(); ctx.moveTo(-9, -22); ctx.lineTo(-3, -25); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(3, -25); ctx.lineTo(9, -22); ctx.stroke();

        // Flat mouth
        ctx.beginPath(); ctx.moveTo(-6, -13); ctx.lineTo(6, -13); ctx.stroke();
      } else {
        // NORMAL READING EXPRESSION
        // Relaxed reading eyes looking down
        ctx.strokeStyle = '#020617';
        ctx.lineWidth = 2;
        // left eye curve
        ctx.beginPath();
        ctx.arc(-6, -24, 2.5, 0, Math.PI, false);
        ctx.stroke();
        // right eye curve
        ctx.beginPath();
        ctx.arc(6, -24, 2.5, 0, Math.PI, false);
        ctx.stroke();

        // Peaceful line mouth
        ctx.beginPath();
        ctx.moveTo(-4, -14);
        ctx.quadraticCurveTo(0, -12, 4, -14);
        ctx.stroke();
      }

      if (!walking) {
        // Physics Book reading on Newton's Lap
        const bookOsc = Math.sin(state.gameTime / 400) * 1.5;
        ctx.save();
        ctx.translate(0, 48 + bookOsc);

        // Book covers (gorgeous dark leather)
        ctx.fillStyle = '#7c2d12'; // rust brown
        ctx.beginPath();
        ctx.rect(-28, -2, 56, 14);
        ctx.fill();

        // Gleaming white paper pages
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(-24, -2);
        ctx.lineTo(0, -8);
        ctx.lineTo(24, -2);
        ctx.lineTo(24, 6);
        ctx.lineTo(0, 0);
        ctx.lineTo(-24, 6);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -8);
        ctx.lineTo(0, 0);
        ctx.stroke();

        // Floating golden spell/science glow from book!
        const bookGlow = ctx.createRadialGradient(0, -10, 2, 0, -20, 45);
        bookGlow.addColorStop(0, 'rgba(253, 224, 71, 0.45)'); // Golden glowing knowledge
        bookGlow.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = bookGlow;
        ctx.beginPath();
        ctx.arc(0, -10, 45, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore(); // end book
      }
      ctx.restore(); // end Newton


      // --- LAYER 5: Falling Fruits ---
      state.fruits.forEach(f => {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.scale(f.scale, f.scale);
        ctx.rotate(f.rotation);

        // Gentle drop shadow behind fruit
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.beginPath();
        ctx.arc(2, 4, f.radius, 0, Math.PI * 2);
        ctx.fill();

        // Vector render each type
        if (f.type === 'apple') {
          // APPLE: Red body with indentation
          ctx.fillStyle = f.color; // red
          ctx.beginPath();
          // Complex heart organic apple shape
          ctx.arc(-f.radius * 0.45, 0, f.radius * 0.85, 0, Math.PI * 2);
          ctx.arc(f.radius * 0.45, 0, f.radius * 0.85, 0, Math.PI * 2);
          ctx.fill();

          // Cover base indent
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(0, f.radius * 0.35, f.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();

          // Specular white shine highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.arc(-f.radius * 0.42, -f.radius * 0.42, f.radius * 0.3, 0, Math.PI * 2);
          ctx.fill();

          // Brown stem
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(0, -f.radius * 0.2);
          ctx.quadraticCurveTo(f.radius * 0.3, -f.radius * 0.8, f.radius * 0.35, -f.radius * 0.95);
          ctx.stroke();

          // Green leaf
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.ellipse(f.radius * 0.3, -f.radius * 0.72, f.radius * 0.3, f.radius * 0.15, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();

        } else if (f.type === 'orange') {
          // ORANGE: Textured orange ball
          ctx.fillStyle = f.color; // orange
          ctx.beginPath();
          ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
          ctx.fill();

          // Dimple skin details
          ctx.fillStyle = 'rgba(234, 88, 12, 0.4)';
          ctx.beginPath();
          ctx.arc(-f.radius * 0.4, f.radius * 0.25, 2, 0, Math.PI * 2);
          ctx.arc(f.radius * 0.3, -f.radius * 0.3, 1.5, 0, Math.PI * 2);
          ctx.arc(-f.radius * 0.1, -f.radius * 0.5, 2, 0, Math.PI * 2);
          ctx.arc(f.radius * 0.5, f.radius * 0.4, 2, 0, Math.PI * 2);
          ctx.fill();

          // White shine
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(-f.radius * 0.35, -f.radius * 0.35, f.radius * 0.28, 0, Math.PI * 2);
          ctx.fill();

          // Stem
          ctx.strokeStyle = '#15803d'; // green-ish brown
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -f.radius * 1.05);
          ctx.stroke();

          // Leaf
          ctx.fillStyle = '#16a34a';
          ctx.beginPath();
          ctx.ellipse(f.radius * 0.3, -f.radius * 0.8, f.radius * 0.35, f.radius * 0.16, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();

        } else if (f.type === 'banana') {
          // BANANA: Curved yellow crescent outline
          ctx.fillStyle = f.color;
          ctx.beginPath();
          ctx.arc(0, 0, f.radius * 1.2, 0.25, Math.PI * 0.9, false); // outer curve
          ctx.quadraticCurveTo(-f.radius * 0.5, f.radius * 0.1, -f.radius, -f.radius * 0.5); // inner curve back
          ctx.closePath();
          ctx.fill();

          // Brown tip
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.arc(f.radius, f.radius * 0.4, 3, 0, Math.PI * 2);
          ctx.fill();

          // White specular highlight line along length
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(-2, 3, f.radius * 0.8, 0.4, Math.PI * 0.8, false);
          ctx.stroke();

        } else if (f.type === 'coconut') {
          // COCONUT: Rugged brown circle
          ctx.fillStyle = f.color; // dark brown
          ctx.beginPath();
          ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
          ctx.fill();

          // Inner rim / hairy shade lines
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, f.radius - 2.5, 0, Math.PI * 2);
          ctx.stroke();

          // Three dark indentations (eyes of the coconut 🥥)
          ctx.fillStyle = '#1c1917';
          ctx.beginPath();
          ctx.arc(-5, -3, 3, 0, Math.PI * 2);
          ctx.arc(5, -3, 3, 0, Math.PI * 2);
          ctx.arc(0, 5, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Fuzzy hair highlights
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-f.radius, 0); ctx.lineTo(-f.radius - 2, -3);
          ctx.moveTo(f.radius, 2); ctx.lineTo(f.radius + 2, 4);
          ctx.moveTo(0, -f.radius); ctx.lineTo(-2, -f.radius - 2);
          ctx.stroke();

        } else if (f.type === 'pear') {
          // PEAR: Elegant pear shape (yellow-green bell)
          ctx.fillStyle = f.color;
          ctx.beginPath();
          // bottom bulb
          ctx.arc(0, f.radius * 0.35, f.radius * 0.8, 0, Math.PI * 2);
          // upper narrow bell
          ctx.arc(0, -f.radius * 0.35, f.radius * 0.52, 0, Math.PI * 2);
          ctx.fill();

          // pear core overlap fill
          ctx.beginPath();
          ctx.rect(-f.radius * 0.4, -f.radius * 0.3, f.radius * 0.8, f.radius * 0.6);
          ctx.fill();

          // Speckled spots
          ctx.fillStyle = 'rgba(74, 124, 13, 0.35)'; // dark lime
          ctx.beginPath();
          ctx.arc(-f.radius * 0.3, f.radius * 0.3, 1, 0, Math.PI * 2);
          ctx.arc(f.radius * 0.4, f.radius * 0.1, 1, 0, Math.PI * 2);
          ctx.arc(-f.radius * 0.1, f.radius * 0.5, 1, 0, Math.PI * 2);
          ctx.fill();

          // Stem
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(0, -f.radius * 0.4);
          ctx.quadraticCurveTo(f.radius * 0.2, -f.radius * 0.9, f.radius * 0.15, -f.radius * 1.15);
          ctx.stroke();

          // Leaf
          ctx.fillStyle = '#65a30d';
          ctx.beginPath();
          ctx.ellipse(f.radius * 0.2, -f.radius * 0.9, f.radius * 0.24, f.radius * 0.13, Math.PI / 3, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });


      // --- LAYER 6: Particles (Fireflies, math equations) ---
      state.particles.filter(p => p.type !== 'star').forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.alpha;

        if (p.type === 'firefly') {
          // Warm glowing radial
          const rad = ctx.createRadialGradient(p.x, p.y, 0.2, p.x, p.y, p.radius * 3);
          rad.addColorStop(0, '#fef08a'); // soft white yellow
          rad.addColorStop(0.3, 'rgba(253, 224, 71, 0.8)');
          rad.addColorStop(1, 'rgba(253, 224, 71, 0)');
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'equation' && p.text) {
          ctx.font = `bold ${p.radius}px "JetBrains Mono", Courier, monospace`;
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.fillText(p.text, p.x, p.y);
        }

        ctx.restore();
      });


      // --- LAYER 7: Quantum Gravity Field Cursor Representation ---
      if (state.mouseActive) {
        ctx.save();
        ctx.translate(state.mouseX, state.mouseY);

        // Rotating vacuum vortex lines
        const pulse = Math.sin(state.gameTime / 120) * 8;
        const currentRadius = 140 + pulse;

        // Glowing backdrop distort
        const searchGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, currentRadius);
        searchGlow.addColorStop(0, 'rgba(99, 102, 241, 0.18)'); // indigo neon
        searchGlow.addColorStop(0.6, 'rgba(168, 85, 247, 0.05)'); // purple shadow
        searchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = searchGlow;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.fill();

        // Glowing boundary line ring
        ctx.strokeStyle = 'rgba(168, 85, 247, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 12]);
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Concentric suction lines collapsing toward center
        const collapseRatio = (state.gameTime % 1000) / 1000;
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, currentRadius * (1 - collapseRatio), 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }

      // --- LAYER 8: Active Eureka visual animations during win phase ---
      if (cinematicPhase === 'eureka') {
        state.eurekaTimer += 16.67;

        // Draw rotating celestial portal rings behind/above Newton
        ctx.save();
        ctx.translate(500, 520);
        
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)'; // beautiful amber
        ctx.lineWidth = 3;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.setLineDash([20, 20]);
        ctx.beginPath();
        ctx.arc(0, 0, 80 + Math.sin(state.gameTime / 150) * 10, state.gameTime / 300, (state.gameTime / 300) + Math.PI * 1.7);
        ctx.stroke();

        // Planetary Orbit spheres
        ctx.fillStyle = '#a78bfa';
        ctx.beginPath();
        const orbitAngle = state.gameTime * 0.003;
        ctx.arc(Math.cos(orbitAngle) * 80, Math.sin(orbitAngle) * 80, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Slowly open final win popup after 4.5 seconds of awe
        if (state.eurekaTimer > 4005 && !state.endingTriggered) {
          state.endingTriggered = true;
          onGameEnd('gravity', {
            score: state.score,
            applesGuided: state.applesGuided + 1,
            fruitsDeflected: state.fruitsDeflected,
            timeRemaining: state.timeRemaining
          });
        }
      }

      // Restore outer window scale before finishing loop frame
      ctx.restore();

      // Transition to Fail timeline popup after wrong fruit hits Newton
      if (cinematicPhase === 'wrong_hit' && !state.endingTriggered) {
        if (Date.now() - state.newtonFaceTimer > 2800) {
          state.endingTriggered = true;
          onGameEnd(hitFruit as EndingId, {
            score: state.score,
            applesGuided: state.applesGuided,
            fruitsDeflected: state.fruitsDeflected,
            timeRemaining: state.timeRemaining
          });
        }
      }

      if (cinematicPhase === 'timeout' && !state.endingTriggered) {
        state.endingTriggered = true;
        onGameEnd('timeout', {
          score: state.score,
          applesGuided: state.applesGuided,
          fruitsDeflected: state.fruitsDeflected,
          timeRemaining: state.timeRemaining
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [isPlaying, cinematicPhase, hitFruit, onGameEnd]);

  // Touch and Mouse Coordinate Trackers relative to scaled canvas viewport bounds
  const getCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Scale standard 1000 x 750 size
    const x = ((clientX - rect.left) / rect.width) * V_WIDTH;
    const y = ((clientY - rect.top) / rect.height) * V_HEIGHT;
    return { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCoords(e.clientX, e.clientY);
    stateRef.current.mouseX = coords.x;
    stateRef.current.mouseY = coords.y;
    stateRef.current.mouseActive = true;
  };

  const handleMouseLeave = () => {
    stateRef.current.mouseActive = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const coords = getCoords(touch.clientX, touch.clientY);
      stateRef.current.mouseX = coords.x;
      stateRef.current.mouseY = coords.y;
      stateRef.current.mouseActive = true;
    }
  };

  const handleTouchEnd = () => {
    stateRef.current.mouseActive = false;
  };

  return (
    <div className="w-full h-screen flex flex-col overflow-hidden font-serif relative bg-[#020617] text-[#f8fafc] select-none">
      
      {/* Interactive top HUD Overlay */}
      <div className="absolute top-0 inset-x-0 bg-linear-to-b from-[#020617]/95 via-[#020617]/50 to-transparent p-6 flex items-center justify-between z-20 pointer-events-none">
        
        {/* Back and Title */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 bg-transparent border border-white/10 hover:border-white/30 text-white rounded-none font-sans text-xs uppercase tracking-[0.2em] active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          
          <h2 className="hidden sm:block font-sans text-[10px] text-slate-400 uppercase tracking-[0.25em]">
            Newton's Orchard • MDCLXVI
          </h2>
        </div>

        {/* Dashboard Center */}
        <div className="flex items-center gap-4 bg-slate-900/40 border border-white/10 px-4 py-2 rounded-none backdrop-blur-md">
          {/* SECONDS REMAINING */}
          <div className="flex items-center gap-1.5 border-r border-white/10 pr-4">
            <Clock className={`w-3.5 h-3.5 ${stats.timeRemaining <= 15 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
            <span className={`font-mono text-xs font-bold ${stats.timeRemaining <= 15 ? 'text-rose-400' : 'text-white'}`}>
              {stats.timeRemaining}s
            </span>
          </div>

          {/* TOTAL SCORE */}
          <div className="flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <div className="flex flex-col">
              <span className="text-[8px] text-slate-500 font-sans tracking-widest uppercase">SCORE</span>
              <span className="font-mono text-xs font-bold text-white leading-none">
                {stats.score}
              </span>
            </div>
          </div>
        </div>

        {/* Mute and control button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={toggleSound}
            className="p-2.5 bg-transparent border border-white/10 hover:border-white/30 transition-all text-slate-300 hover:text-white rounded-none cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Primary HTML5 Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 w-full bg-[#020617] relative h-full flex items-center justify-center cursor-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block absolute inset-0 max-w-full max-h-full"
        />

        {/* Floating guidance hint initially for 4 seconds */}
        {stateRef.current.gameTime < 4500 && cinematicPhase === 'playing' && (
          <div className="absolute top-1/3 text-center pointer-events-none animate-bounce max-w-xs px-4">
            <div className="bg-slate-900 border border-white/10 px-5 py-4 rounded-none shadow-xl backdrop-blur-lg">
              <h4 className="text-[10px] font-sans font-bold tracking-[0.25em] text-amber-500 mb-2 uppercase">Gravity Field</h4>
              <p className="text-xs text-slate-350 font-serif leading-relaxed italic">
                Drag to pull elements. Guide the apple to Newton's head, and deflect other fruits.
              </p>
            </div>
          </div>
        )}

        {/* Play Pause / Tutorial overlay if paused */}
        {!isPlaying && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md z-40 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-none p-6 md:p-8 max-w-sm w-full text-center shadow-2xl">
              <BookOpen className="w-10 h-10 text-amber-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-serif mb-2 text-white">Chronology Paused</h3>
              <p className="text-xs text-slate-400 font-serif italic leading-relaxed mb-6">
                Newton's calculations are suspended. Resume to resume observation.
              </p>
              <button
                onClick={() => setIsPlaying(true)}
                className="w-full py-3 bg-white hover:bg-slate-100 text-slate-950 font-sans uppercase font-medium text-xs tracking-[0.2em] mt-2 active:scale-95 transition-all cursor-pointer"
              >
                Resume Observation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
