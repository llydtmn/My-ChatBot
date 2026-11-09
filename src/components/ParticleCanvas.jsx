import { useEffect, useRef } from "react";

const PARTICLE_COUNT = 55;
const PARTICLE_COLOR = "rgba(240,237,232,";
const GRID_COLOR = "rgba(240,237,232,0.018)";
const CONNECTION_DIST = 130;

const randBetween = (a, b) => a + Math.random() * (b - a);

export default function ParticleCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let W, H, particles, rafId;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const makeParticle = () => ({
      x: Math.random() * W, y: Math.random() * H, r: randBetween(0.8, 2.2),
      vx: randBetween(-0.18, 0.18), vy: randBetween(-0.18, 0.18), alpha: randBetween(0.15, 0.55),
    });
    const initParticles = () => { particles = Array.from({ length: PARTICLE_COUNT }, makeParticle); };

    const drawGrid = () => {
      const spacing = 60;
      ctx.strokeStyle = GRID_COLOR; ctx.lineWidth = 0.5;
      for (let x = 0; x < W; x += spacing) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += spacing) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    };

    const drawParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = PARTICLE_COLOR + p.alpha + ")"; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const lineAlpha = (1 - dist / CONNECTION_DIST) * 0.08;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = PARTICLE_COLOR + lineAlpha + ")"; ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }
    };

    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      drawGrid();
      drawParticles();
      rafId = requestAnimationFrame(tick);
    };

    const onResize = () => { resize(); initParticles(); };
    window.addEventListener("resize", onResize);
    resize(); initParticles(); tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas id="bg-canvas" ref={canvasRef}></canvas>;
}
