let audioUnlocked = false;

export function unlockNotificationSound() {
  audioUnlocked = true;
}

export function playNotificationSound() {
  if (typeof window === "undefined" || !audioUnlocked) return;

  try {
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    gain.connect(ctx.destination);

    [880, 1175].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, ctx.currentTime + index * 0.12);
      osc.connect(gain);
      osc.start(ctx.currentTime + index * 0.12);
      osc.stop(ctx.currentTime + index * 0.12 + 0.22);
    });

    window.setTimeout(() => void ctx.close().catch(() => {}), 700);
  } catch {
    // Browser audio can fail before interaction; notification UI still works.
  }
}

export function useUnlockNotificationSoundOnInteraction() {
  if (typeof window === "undefined") return;
  window.addEventListener("pointerdown", unlockNotificationSound, { once: true });
  window.addEventListener("keydown", unlockNotificationSound, { once: true });
}
