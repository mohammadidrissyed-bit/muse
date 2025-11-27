import React, { useRef, useEffect } from 'react';
import type { Subject } from '../types';

interface BackgroundAnimationProps {
  theme: 'light' | 'dark';
  subject: Subject | null;
}

// Helper to get a random number in a range
const random = (min: number, max: number) => Math.random() * (max - min) + min;

export function BackgroundAnimation({ theme, subject }: BackgroundAnimationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number | null>(null);
  const isReducedMotion = useRef(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const mouse = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const handleMouseMove = (event: MouseEvent) => {
        mouse.current.x = event.clientX;
        mouse.current.y = event.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);


    let particles: Particle[] = [];
    let traces: Trace[] = [];
    let rings: Ring[] = [];

    const particleCount = 50; 
    const traceSpawnRate = 0.01;
    const ringSpawnRate = 0.002;

    const colors = theme === 'dark' 
      ? { particle: [106, 75, 255], trace: [139, 92, 246], ring: [45, 212, 242] }
      : { particle: [100, 116, 139], trace: [129, 140, 248], ring: [56, 189, 248] };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    class Particle {
      x: number; y: number; vx: number; vy: number; radius: number; opacity: number;
      baseVx: number; baseVy: number;
      char: string;
      constructor() {
        this.x = random(0, canvas.width);
        this.y = random(0, canvas.height);
        this.vx = random(-0.2, 0.2);
        this.vy = random(-0.2, 0.2);
        this.baseVx = this.vx;
        this.baseVy = this.vy;
        this.radius = random(1, 4);
        this.opacity = random(0.1, 0.4);

        if (subject === 'Biology') {
            const biologyChars = ['⬢', '⬡', '⌬', '⏣'];
            this.char = biologyChars[Math.floor(Math.random() * biologyChars.length)];
        } else { // Default to Computer Science theme
            this.char = Math.random() > 0.5 ? '1' : '0';
        }
      }
      update() {
        // Mouse interaction (parallax/repulsion)
        const dx = this.x - mouse.current.x;
        const dy = this.y - mouse.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repulsionRadius = 150;
        
        if (dist < repulsionRadius) {
            const force = (repulsionRadius - dist) / repulsionRadius;
            this.x += (dx / dist) * force * 1.5;
            this.y += (dy / dist) * force * 1.5;
        }

        // Drifting behavior
        this.x += this.vx;
        this.y += this.vy;
        
        // Damping to return to normal drift
        this.vx *= 0.98;
        this.vy *= 0.98;
        if (Math.abs(this.vx) < 0.1) this.vx = this.baseVx;
        if (Math.abs(this.vy) < 0.1) this.vy = this.baseVy;


        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
      }
      draw() {
        const [r,g,b] = colors.particle;
        const fontSize = this.radius * (subject === 'Biology' ? 5 : 3);
        ctx.font = `${fontSize}px monospace`;
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.opacity})`;
        ctx.fillText(this.char, this.x, this.y);
      }
    }

    class Trace {
      x1: number; y1: number; x2: number; y2: number; life: number; maxLife: number;
      constructor() {
        this.x1 = random(0, canvas.width);
        this.y1 = random(0, canvas.height);
        const angle = random(0, Math.PI * 2);
        const length = random(100, 300);
        this.x2 = this.x1 + Math.cos(angle) * length;
        this.y2 = this.y1 + Math.sin(angle) * length;
        this.life = 0;
        this.maxLife = random(100, 200);
      }
      update() { this.life++; }
      draw() {
        const progress = this.life / this.maxLife;
        const opacity = Math.sin(progress * Math.PI) * 0.4;
        const [r,g,b] = colors.trace;
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    class Ring {
      x: number; y: number; radius: number; maxRadius: number; life: number; maxLife: number;
      constructor() {
        this.x = random(0, canvas.width);
        this.y = random(0, canvas.height);
        this.radius = 0;
        this.maxRadius = random(50, 150);
        this.life = 0;
        this.maxLife = random(150, 300);
      }
      update() { this.life++; }
      draw() {
        const progress = this.life / this.maxLife;
        this.radius = progress * this.maxRadius;
        const opacity = (1 - progress) * 0.2;
        const [r,g,b] = colors.ring;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    const init = () => {
      resizeCanvas();
      particles = Array.from({ length: particleCount }, () => new Particle());
    };

    const animate = () => {
      // Set the background fill style based on the current theme
      if (theme === 'dark') {
        const gradient = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.7);
        gradient.addColorStop(0, 'hsl(240, 50%, 8%)');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
      } else {
        ctx.fillStyle = '#ffffff';
      }
      // Fill the entire canvas with the background color/gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!isReducedMotion.current) {
        // Update and draw particles
        particles.forEach(p => { p.update(); p.draw(); });

        // Update, draw, and filter traces
        traces.forEach(t => { t.update(); t.draw(); });
        traces = traces.filter(t => t.life < t.maxLife);

        // Update, draw, and filter rings
        rings.forEach(r => { r.update(); r.draw(); });
        rings = rings.filter(r => r.life < r.maxLife);

        // Spawn new elements
        if (Math.random() < traceSpawnRate) traces.push(new Trace());
        if (rings.length < 3 && Math.random() < ringSpawnRate) rings.push(new Ring());
      } else {
        // For reduced motion, just draw static particles
        particles.forEach(p => p.draw());
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    init();
    animate();

    window.addEventListener('resize', init);

    return () => {
      window.removeEventListener('resize', init);
      window.removeEventListener('mousemove', handleMouseMove);
      if(animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [theme, subject]);
  
  return (
    <canvas 
        ref={canvasRef} 
        id="background-canvas" 
        className="fixed inset-0 w-full h-full pointer-events-none transition-opacity duration-500"
    />
  );
}