import confetti from 'canvas-confetti';

const CELEBRATION_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#f472b6'];

export function fireInstagramConnectCelebration(): void {
  const duration = 2800;
  const end = Date.now() + duration;

  const burst = (x: number) => {
    confetti({
      particleCount: 4,
      angle: x < 0.5 ? 60 : 120,
      spread: 62,
      startVelocity: 52,
      origin: { x, y: 0.55 },
      colors: CELEBRATION_COLORS,
      ticks: 200,
      gravity: 1.1,
      scalar: 1.1,
      drift: 0,
    });
  };

  // Center burst
  confetti({
    particleCount: 90,
    spread: 100,
    startVelocity: 42,
    origin: { x: 0.5, y: 0.5 },
    colors: CELEBRATION_COLORS,
    ticks: 220,
  });

  const frame = () => {
    burst(0.12);
    burst(0.88);
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}
