"use client";

import { useEffect, useRef } from "react";

/**
 * Hero diagram laid over the painting: a clearly delimited "Agents" zone (left)
 * and "Creators" zone (right), separated by a divider. Agents periodically send
 * a coin across to a creator; when it lands, the creator gives a soft pulse and
 * a "$" money sign floats up. Deliberately calm — slow motion, thin lines, no
 * glow or constellation noise. Pure canvas, DPR-aware, static when the user
 * prefers reduced motion.
 */

type Agent = { x: number; y: number; r: number; phase: number };
type Creator = { x: number; y: number; r: number; pulse: number };
type Coin = { sx: number; sy: number; cx: number; cy: number; tx: number; ty: number; target: number; t: number; dur: number };
type Sign = { x: number; y: number; t: number; dur: number };

const INK = "20, 22, 40";
const BLUE = "47, 125, 246";
const GREEN = "30, 140, 78";
const FONT = '"Helvetica Neue", Arial, sans-serif';

export function HeroSwarm({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    let width = 0;
    let height = 0;
    let divider = 0;
    let agents: Agent[] = [];
    let creators: Creator[] = [];
    let coins: Coin[] = [];
    let signs: Sign[] = [];
    let raf = 0;
    let last = 0;
    let spawnTimer = 1;

    function build() {
      const rect = canvas?.getBoundingClientRect();xF
      width = rect?.width ?? 0;
      height = rect?.height ?? 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!canvas) return;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

      divider = width * 0.52;
      const nodeR = Math.max(5, Math.min(width, height) * 0.014);

      // A small, tidy set of agents on the left — staggered, not scattered.
      const agentSpots = [
        [0.16, 0.26],
        [0.34, 0.18],
        [0.2, 0.52],
        [0.36, 0.46],
        [0.14, 0.76],
        [0.33, 0.74],
      ];
      agents = agentSpots.map(([fx, fy]) => ({
        x: width * fx,
        y: height * fy,
        r: nodeR * 0.62,
        phase: rand(0, Math.PI * 2),
      }));

      // Three creators on the right.
      creators = [0.3, 0.52, 0.74].map((fy) => ({
        x: width * 0.82,
        y: height * fy,
        r: nodeR,
        pulse: 0,
      }));

      coins = [];
      signs = [];
    }

    function spawnCoin() {
      if (!agents.length || !creators.length) return;
      const a = agents[(Math.random() * agents.length) | 0];
      const target = (Math.random() * creators.length) | 0;
      const c = creators[target];
      const midX = (a.x + c.x) / 2;
      const midY = (a.y + c.y) / 2 - Math.abs(c.x - a.x) * 0.12;
      coins.push({ sx: a.x, sy: a.y, cx: midX, cy: midY, tx: c.x, ty: c.y, target, t: 0, dur: rand(1.9, 2.5) });
    }

    function quad(p0: number, p1: number, p2: number, t: number) {
      const mt = 1 - t;
      return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
    }

    // A white chip with a thin ink ring + soft shadow, so nodes stay legible
    // over both the bright sky and the dark foliage of the painting.
    function chip(x: number, y: number, r: number, ring: string) {
      if (!ctx) return;
      ctx.save();
      ctx.shadowColor = "rgba(15, 18, 30, 0.3)";
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = ring;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    function haloText(text: string, x: number, y: number, fill: string, halo: string) {
      if (!ctx) return;
      ctx.save();
      ctx.shadowColor = halo;
      ctx.shadowBlur = 5;
      ctx.fillStyle = fill;
      ctx.fillText(text, x, y);
      ctx.restore();
    }

    function draw(dt: number, t: number) {
      if (!ctx) return;

      ctx.clearRect(0, 0, width, height);

      // --- Divider between the two zones -----------------------------------
      ctx.save();
      ctx.strokeStyle = `rgba(${INK}, 0.16)`;
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(divider, height * 0.12);
      ctx.lineTo(divider, height * 0.88);
      ctx.stroke();
      ctx.restore();

      // --- Zone labels ------------------------------------------------------
      ctx.font = `600 11px ${FONT}`;
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "center";
      const labelY = height * 0.1;
      const halo = "rgba(255, 255, 255, 0.9)";
      withSpacing(ctx, "1.6px", () => {
        haloText("AGENTS", divider * 0.5, labelY, `rgba(${INK}, 0.62)`, halo);
        haloText("CREATORS", divider + (width - divider) * 0.5, labelY, `rgba(${INK}, 0.62)`, halo);
      });

      // --- Agents (gentle bob) ---------------------------------------------
      for (const a of agents) {
        const y = a.y + Math.sin(t * 0.5 + a.phase) * 2.5;
        chip(a.x, y, a.r, `rgba(${INK}, 0.42)`);
      }

      // --- Coins in transit -------------------------------------------------
      ctx.textAlign = "center";
      for (let i = coins.length - 1; i >= 0; i--) {
        const p = coins[i];
        p.t += dt / p.dur;
        if (p.t >= 1) {
          const c = creators[p.target];
          c.pulse = 1;
          signs.push({ x: c.x, y: c.y - c.r - 6, t: 0, dur: 1.2 });
          coins.splice(i, 1);
          continue;
        }
        const x = quad(p.sx, p.cx, p.tx, p.t);
        const y = quad(p.sy, p.cy, p.ty, p.t);
        // Small blue coin marked with a "$".
        ctx.save();
        ctx.shadowColor = "rgba(15, 18, 30, 0.3)";
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 1;
        ctx.fillStyle = `rgba(${BLUE}, 0.98)`;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = "rgba(255, 255, 255, 0.98)";
        ctx.font = `700 9px ${FONT}`;
        ctx.textBaseline = "middle";
        ctx.fillText("$", x, y + 0.5);
        ctx.textBaseline = "alphabetic";
      }

      // --- Creators (soft arrival pulse) -----------------------------------
      for (const c of creators) {
        if (c.pulse > 0.001) {
          ctx.strokeStyle = `rgba(${GREEN}, ${c.pulse * 0.5})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r + 4 + (1 - c.pulse) * 16, 0, Math.PI * 2);
          ctx.stroke();
          c.pulse = Math.max(0, c.pulse - dt * 1.4);
        }
        chip(c.x, c.y, c.r, `rgba(${INK}, 0.5)`);
      }

      // --- Money signs floating up on receipt ------------------------------
      ctx.textAlign = "center";
      ctx.font = `700 15px ${FONT}`;
      for (let i = signs.length - 1; i >= 0; i--) {
        const s = signs[i];
        s.t += dt / s.dur;
        if (s.t >= 1) {
          signs.splice(i, 1);
          continue;
        }
        const alpha = Math.sin(Math.min(1, s.t) * Math.PI);
        haloText("+$", s.x, s.y - s.t * 22, `rgba(${GREEN}, ${alpha})`, `rgba(255, 255, 255, ${alpha * 0.85})`);
      }
    }

    function frame(now: number) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      const t = now / 1000;
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnCoin();
        spawnTimer = rand(1.6, 2.6);
      }
      draw(dt, t);
      raf = requestAnimationFrame(frame);
    }

    build();

    if (reduced) {
      // Static representative frame: one coin mid-flight, one money sign.
      spawnCoin();
      if (coins[0]) coins[0].t = 0.55;
      signs.push({ x: creators[1].x, y: creators[1].y - creators[1].r - 6, t: 0.4, dur: 1.2 });
      creators[1].pulse = 0.6;
      draw(0, 0);
    } else {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => build());
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}

function withSpacing(ctx: CanvasRenderingContext2D, value: string, fn: () => void) {
  const c = ctx as unknown as { letterSpacing: string };
  const prev = c.letterSpacing;
  c.letterSpacing = value;
  fn();
  c.letterSpacing = prev ?? "0px";
}
