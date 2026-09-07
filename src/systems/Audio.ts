/** Original synthesized audio; no downloads or audio assets required. */
export class GameAudio {
  private context?: AudioContext;
  private master?: GainNode;
  private voices = new Set<OscillatorNode>();
  private muted = false;
  private volume = 0.35;
  private paused = true;
  private boss = false;
  private beat = 0;
  private nextBeat = 0;
  private readonly button =
    document.querySelector<HTMLButtonElement>("#audio-mute")!;
  private readonly slider =
    document.querySelector<HTMLInputElement>("#audio-volume")!;
  private readonly output =
    document.querySelector<HTMLOutputElement>("#audio-level")!;

  constructor() {
    try {
      const saved = JSON.parse(
        localStorage.getItem("ion-frontier-audio") ?? "null",
      );
      if (typeof saved?.muted === "boolean") this.muted = saved.muted;
      if (typeof saved?.volume === "number" && Number.isFinite(saved.volume))
        this.volume = Math.max(0, Math.min(1, saved.volume));
    } catch {
      /* Storage is optional. */
    }
    this.button.addEventListener("click", this.toggle);
    this.slider.addEventListener("input", this.changeVolume);
    window.addEventListener("keydown", this.unlock);
    window.addEventListener("pointerdown", this.unlock);
    this.button.addEventListener("keydown", this.controlKey);
    this.slider.addEventListener("keydown", this.controlKey);
    this.refresh();
  }

  private controlKey = (event: KeyboardEvent) => {
    event.stopPropagation();
    this.unlock();
  };

  private unlock = () => {
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
        this.refresh();
      }
      if (this.context.state === "suspended")
        void this.context.resume().catch(() => {});
    } catch {
      /* Gameplay remains available without Web Audio. */
    }
  };

  private toggle = () => {
    this.muted = !this.muted;
    this.save();
  };

  private changeVolume = () => {
    this.volume = Number(this.slider.value) / 100;
    this.save();
  };

  private save() {
    this.refresh();
    try {
      localStorage.setItem(
        "ion-frontier-audio",
        JSON.stringify({ muted: this.muted, volume: this.volume }),
      );
    } catch {
      /* Storage is optional. */
    }
  }

  private refresh() {
    this.button.textContent = this.muted ? "Unmute audio" : "Mute audio";
    this.button.setAttribute("aria-pressed", String(this.muted));
    this.slider.value = String(Math.round(this.volume * 100));
    this.output.value = `${this.slider.value}%`;
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(
        this.muted ? 0 : this.volume,
        this.context.currentTime,
        0.015,
      );
  }

  private tone(
    frequency: number,
    end: number,
    duration: number,
    level = 0.15,
    type: OscillatorType = "square",
    delay = 0,
  ) {
    const ctx = this.context;
    if (
      !ctx ||
      ctx.state !== "running" ||
      !this.master ||
      this.paused ||
      this.muted ||
      this.volume === 0 ||
      this.voices.size >= 24
    )
      return;
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const envelope = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(end, start + duration);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(level, start + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.master);
    this.voices.add(oscillator);
    oscillator.onended = () => {
      this.voices.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }

  play(
    effect:
      | "forward"
      | "spread"
      | "hit"
      | "explosion"
      | "damage"
      | "pickup"
      | "warning"
      | "victory"
      | "loss",
  ) {
    switch (effect) {
      case "forward":
        this.tone(980, 220, 0.07, 0.08);
        break;
      case "spread":
        this.tone(620, 120, 0.12, 0.1, "sawtooth");
        break;
      case "hit":
        this.tone(180, 80, 0.04, 0.08, "triangle");
        break;
      case "explosion":
        this.tone(110, 22, 0.24, 0.3, "sawtooth");
        break;
      case "damage":
        this.tone(240, 35, 0.32, 0.3, "sawtooth");
        break;
      case "pickup":
      case "victory":
        (effect === "pickup"
          ? [523, 659, 784]
          : [392, 523, 659, 784, 1047]
        ).forEach((note, i) =>
          this.tone(note, note, 0.22, 0.16, "triangle", i * 0.1),
        );
        break;
      case "warning":
        for (let i = 0; i < 3; i++)
          this.tone(330, 220, 0.3, 0.16, "square", i * 0.5);
        break;
      case "loss":
        this.tone(330, 40, 0.8, 0.2, "sawtooth");
        break;
    }
  }

  private clear() {
    for (const voice of this.voices) voice.stop();
    this.voices.clear();
  }

  start() {
    this.clear();
    this.paused = false;
    this.boss = false;
    this.beat = 0;
    this.nextBeat = 0;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (paused) this.clear();
  }

  startBoss() {
    this.boss = true;
    this.nextBeat = 0;
  }

  finish(won: boolean) {
    this.boss = false;
    this.clear();
    this.play(won ? "victory" : "loss");
  }

  update(elapsed: number) {
    if (!this.boss || this.paused || elapsed < this.nextBeat) return;
    this.nextBeat = elapsed + 180;
    const notes = [98, 98, 147, 116.54, 98, 174.61, 147, 116.54];
    const note = notes[this.beat % notes.length];
    this.tone(note, note, 0.16, 0.15, "triangle");
    if (this.beat % 2 === 0)
      this.tone(note * 4, note * 4, 0.1, 0.035, "square");
    if (this.beat % 4 === 0) this.tone(90, 30, 0.12, 0.2, "sine");
    this.beat++;
  }

  destroy() {
    this.clear();
    this.button.removeEventListener("keydown", this.controlKey);
    this.slider.removeEventListener("keydown", this.controlKey);
    this.button.removeEventListener("click", this.toggle);
    this.slider.removeEventListener("input", this.changeVolume);
    window.removeEventListener("keydown", this.unlock);
    window.removeEventListener("pointerdown", this.unlock);
    if (this.context) void this.context.close().catch(() => {});
  }
}
