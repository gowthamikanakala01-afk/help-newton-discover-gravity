/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Safe browser-native Audio Synthesizer for high-fidelity audio feedback without external file dependencies
class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientInterval: number | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Audio Context is initialized lazily upon first user interaction to comply with browser autoplay policies.
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime); // Gentle default volume
        this.masterGain.connect(this.ctx.destination);
      }
    } catch (e) {
      console.warn('Web Audio API is not supported in this browser.', e);
    }
  }

  public resume() {
    this.initCtx();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const targetGain = muted ? 0 : 0.3;
      this.masterGain.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.1);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Sound of a fruit hitting Newton / bonking
   */
  public playBonk(isApple: boolean = false) {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    
    // Create oscillator for the main hit
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.masterGain!);

    if (isApple) {
      // Golden harmonic bonk
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.15);
      
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);

      // Add a sparkly ring chime for discovery
      const sparkles = this.ctx.createOscillator();
      const sparkleGain = this.ctx.createGain();
      sparkles.type = 'sine';
      sparkles.frequency.setValueAtTime(800, now);
      sparkles.frequency.exponentialRampToValueAtTime(1600, now + 0.3);
      sparkles.connect(sparkleGain);
      sparkleGain.connect(this.masterGain!);
      sparkleGain.gain.setValueAtTime(0.15, now);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      sparkles.start(now);
      sparkles.stop(now + 0.5);
    } else {
      // Deeper, duller bonk for heavy falling fruit
      osc.type = 'sine';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);
      
      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    }
  }

  /**
   * Play gravity deflection / capture effect (high-pitched sweep)
   */
  public playDeflect() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Play continuous low gravity field activation hum (pulsing filter sweeps)
   */
  public playGravityActive(intensity: number) {
    this.resume();
    if (!this.ctx || this.isMuted || intensity <= 0) return;

    // Create a very brief soft sci-fi gravity bubble pop
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80 + intensity * 40, now);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, now);
    filter.Q.setValueAtTime(10, now);
    filter.frequency.exponentialRampToValueAtTime(800 + intensity * 600, now + 0.1);

    gain.gain.setValueAtTime(0.03 * intensity, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Celestial major chords arpeggio for Eureka triumph
   */
  public playEurekaFanfare() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const rootFreqs = [261.63, 311.13, 392.00, 466.16, 523.25, 622.25]; // Beautiful cinematic Cm7 arpeggio (C, Eb, G, Bb, C, Eb) -> transcribing to shiny Major/Suspended chord for discovery excitement
    const freqs = [261.63, 329.63, 392.00, 493.88, 523.25, 659.25, 783.99, 987.77]; // Cmaj7, Cmaj9
    
    freqs.forEach((freq, idx) => {
      const delay = idx * 0.12;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now + delay);
      filter.frequency.exponentialRampToValueAtTime(3000, now + delay + 0.2);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.18, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + delay);
      osc.stop(now + delay + 1.5);
    });
  }

  /**
   * Dramatic sad descending minor chord for failures or timeline disruptions
   */
  public playFailureEnding() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    // Descending heavy chord (Diminished / Minor)
    const freqs = [311.13, 277.18, 233.08, 196.00]; // Disorienting Eb, Db, Bb, G

    freqs.forEach((freq, idx) => {
      const delay = idx * 0.15;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + delay);
      
      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.15, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 1.0);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + delay);
      osc.stop(now + delay + 1.2);
    });
  }

  /**
   * Subtle tick for countdown timer
   */
  public playTimerTick() {
    this.resume();
    if (!this.ctx || this.isMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  /**
   * Cosmic starry ambient theme: starts an background loop that plays randomized pentatonic chimes
   */
  public startAmbientLoop() {
    this.resume();
    if (this.ambientInterval) return;

    this.initCtx();
    
    const pentatonic = [196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00, 493.88]; // G major absolute dreamscape
    
    this.ambientInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      if (this.ctx.state !== 'running') return;

      const baseTime = this.ctx.currentTime;
      // Play 1 or 2 elegant celestial chimes
      const numChimes = Math.random() > 0.5 ? 2 : 1;
      
      for (let i = 0; i < numChimes; i++) {
        const note = pentatonic[Math.floor(Math.random() * pentatonic.length)] * (Math.random() > 0.7 ? 2 : 1);
        const playTime = baseTime + i * 0.4 + Math.random() * 0.2;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delayNode = this.ctx.createDelay ? this.ctx.createDelay(1.0) : null;
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, playTime);
        
        gain.gain.setValueAtTime(0, playTime);
        gain.gain.linearRampToValueAtTime(0.06, playTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, playTime + 2.0);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.start(playTime);
        osc.stop(playTime + 2.5);
      }
    }, 3500);
  }

  public stopAmbientLoop() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
  }
}

export const gameAudio = new AudioSynthesizer();
