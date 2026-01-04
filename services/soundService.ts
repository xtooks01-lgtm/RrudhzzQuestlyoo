
class SoundService {
  private ctx: AudioContext | null = null;

  private async init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  private osc(freq: number, dur: number, type: OscillatorType, time: number, volume: number = 0.1) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    
    o.type = type;
    o.frequency.setValueAtTime(freq, this.ctx.currentTime + time);
    
    g.gain.setValueAtTime(volume, this.ctx.currentTime + time);
    g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + time + dur);
    
    o.connect(g);
    g.connect(this.ctx.destination);
    
    o.start(this.ctx.currentTime + time);
    o.stop(this.ctx.currentTime + time + dur);
  }

  async playAdd() {
    await this.init();
    this.osc(440, 0.1, 'sine', 0);
    this.osc(880, 0.1, 'sine', 0.05);
  }

  async playComplete() {
    await this.init();
    // C Major Triad
    this.osc(523.25, 0.15, 'sine', 0);    // C5
    this.osc(659.25, 0.15, 'sine', 0.08); // E5
    this.osc(783.99, 0.25, 'sine', 0.16); // G5
  }

  async playDelete() {
    await this.init();
    this.osc(180, 0.2, 'sawtooth', 0, 0.05);
  }

  async playBadge() {
    await this.init();
    // Arpeggio leading up to a bright tone
    this.osc(392.00, 0.1, 'sine', 0);    // G4
    this.osc(523.25, 0.1, 'sine', 0.05); // C5
    this.osc(659.25, 0.1, 'sine', 0.1);  // E5
    this.osc(1046.50, 0.4, 'sine', 0.15, 0.15); // C6
  }

  async playWarning() {
    await this.init();
    // Short high-pitched alert for mission failure
    this.osc(1200, 0.08, 'square', 0, 0.04);
    this.osc(1000, 0.08, 'square', 0.1, 0.04);
  }

  async playCritical() {
    await this.init();
    // Double pulse alert for 10% remaining
    this.osc(1500, 0.1, 'square', 0, 0.05);
    this.osc(1500, 0.1, 'square', 0.15, 0.05);
  }

  async playTick() {
    await this.init();
    // Soft high tick
    this.osc(2000, 0.02, 'sine', 0, 0.02);
  }
}

export const soundService = new SoundService();
