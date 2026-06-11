/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type FruitType = 'apple' | 'orange' | 'pear' | 'coconut' | 'banana';

export interface Fruit {
  id: string;
  type: FruitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  rotation: number;
  rotationSpeed: number;
  mass: number;
  color: string;
  bounceCount: number;
  isDeflected: boolean;
  scale: number;
}

export type ParticleType = 'leaf' | 'firefly' | 'equation' | 'dust' | 'wave' | 'confetti' | 'star';

export interface Particle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  text?: string; // For math equations
  rotation?: number;
  rotationSpeed?: number;
}

export type EndingId = 'none' | 'gravity' | 'coconut' | 'banana' | 'orange' | 'pear' | 'timeout' | 'missed_apple' | 'dropped_fruit';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface EndingDetails {
  id: EndingId;
  title: string;
  emoji: string;
  historyTitle: string;
  text: string;
  consequences: string[];
}

export interface GameStats {
  score: number;
  applesGuided: number;
  fruitsDeflected: number;
  timeRemaining: number;
}
