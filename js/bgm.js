// js/bgm.js — Ambient spa music via Web Audio API
let ctx = null;
let master = null;
let isPlaying = false;
let timers = [];
let nextBeat = 0;

// C major pentatonic (C D E G A) across 3 octaves
const P = [
  130.81, 146.83, 164.81, 196.00, 220.00,
  261.63, 293.66, 329.63, 392.00, 440.00,
  523.25, 587.33, 659.25, 784.00, 880.00,
];

const CHORDS = [
  [0, 2, 4, 5],
  [1, 3, 5, 6],
  [4, 5, 7, 9],
  [2, 4, 6, 8],
  [0, 3, 5, 7],
  [3, 5, 8, 10],
];

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(freq, start, dur, vol = 0.055, type = 'sine') {
  const ac = getCtx();
  const osc  = ac.createOscillator();
  const gain = ac.createGain();
  const lp   = ac.createBiquadFilter();

  lp.type = 'lowpass';
  lp.frequency.value = 1000 + Math.random() * 600;
  lp.Q.value = 0.4;

  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = (Math.random() - 0.5) * 6;

  const atk  = Math.min(dur * 0.25, 1.4);
  const rel  = Math.min(dur * 0.40, 2.2);
  const peak = Math.max(start + atk, start + 0.01);
  const tail = Math.max(peak + 0.01, start + dur - rel);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(vol, peak);
  gain.gain.setValueAtTime(vol, tail);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

  osc.connect(lp);
  lp.connect(gain);
  gain.connect(master);

  osc.start(start);
  osc.stop(start + dur + 0.1);
}

function scheduleChords() {
  if (!isPlaying) return;
  const ac  = getCtx();
  const now = ac.currentTime;

  while (nextBeat < now + 10) {
    const dur   = 5.0 + Math.random() * 3.0;
    const chord = CHORDS[Math.floor(Math.random() * CHORDS.length)];

    chord.forEach((idx, i) => {
      playTone(P[idx], nextBeat + i * 0.18, dur, 0.045 + Math.random() * 0.025);
    });

    if (Math.random() < 0.5) {
      playTone(P[chord[0]] / 2, nextBeat, dur + 0.5, 0.04);
    }

    if (Math.random() < 0.60) {
      const hi  = 9 + Math.floor(Math.random() * (P.length - 9));
      const off = 1.8 + Math.random() * 2.0;
      playTone(P[hi], nextBeat + off, 2.0 + Math.random() * 1.5, 0.030);
    }

    if (Math.random() < 0.30) {
      const hi2 = 7 + Math.floor(Math.random() * (P.length - 7));
      const off2 = 3.5 + Math.random() * 1.5;
      playTone(P[hi2], nextBeat + off2, 1.5 + Math.random() * 1.0, 0.025);
    }

    nextBeat += dur * 0.82;
  }

  timers.push(setTimeout(scheduleChords, 3000));
}

export function startBGM() {
  if (isPlaying) return;
  const ac = getCtx();
  master = ac.createGain();
  master.gain.setValueAtTime(0.0001, ac.currentTime);
  master.gain.linearRampToValueAtTime(0.55, ac.currentTime + 2.5);
  master.connect(ac.destination);
  isPlaying = true;
  nextBeat  = ac.currentTime + 0.3;
  scheduleChords();
}

export function stopBGM() {
  if (!isPlaying) return;
  isPlaying = false;
  timers.forEach(id => clearTimeout(id));
  timers = [];
  if (master && ctx) {
    master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 2.0);
    setTimeout(() => {
      try { master.disconnect(); } catch (_) {}
      master = null;
    }, 2500);
  }
}

export function isBGMPlaying() { return isPlaying; }
