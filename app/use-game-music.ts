'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const preferenceKey = 'inside-joke-music';
const stepLength = 60 / 116 / 2;
const melody = [
  72, 76, 79, null, 76, 74, 72, null,
  71, 74, 79, 76, 74, null, 71, null,
  72, 76, 81, 79, 76, 74, 72, null,
  74, 76, 79, 76, 72, null, 67, null,
];
const bass = [48, 45, 53, 43];
const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

function playNote(context: AudioContext, midi: number, at: number, length: number, level: number, shape: OscillatorType) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = shape;
  oscillator.frequency.value = frequency(midi);
  envelope.gain.setValueAtTime(0.0001, at);
  envelope.gain.exponentialRampToValueAtTime(level, at + 0.02);
  envelope.gain.exponentialRampToValueAtTime(0.0001, at + length);
  oscillator.connect(envelope).connect(context.destination);
  oscillator.start(at);
  oscillator.stop(at + length + 0.03);
}

export function useGameMusic() {
  const [enabled, setEnabled] = useState(false);
  const desired = useRef(false);
  const context = useRef<AudioContext | null>(null);
  const timer = useRef<number | null>(null);
  const step = useRef(0);
  const nextAt = useRef(0);

  const pause = useCallback(() => {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
    if (context.current?.state === 'running') void context.current.suspend();
  }, []);

  const start = useCallback(async () => {
    if (!desired.current || document.hidden) return;
    const audio = context.current ?? new AudioContext();
    context.current = audio;
    await audio.resume();
    if (!desired.current || document.hidden || timer.current !== null) return;
    nextAt.current = audio.currentTime + 0.04;
    const tick = () => {
      while (nextAt.current < audio.currentTime + 0.35) {
        const position = step.current % melody.length;
        const note = melody[position];
        if (note !== null) playNote(audio, note, nextAt.current, stepLength * 0.8, 0.035, 'triangle');
        if (position % 8 === 0) {
          const root = bass[Math.floor(position / 8)];
          playNote(audio, root, nextAt.current, stepLength * 7.7, 0.019, 'sine');
          playNote(audio, root + 7, nextAt.current, stepLength * 7.7, 0.009, 'sine');
        }
        if (position % 4 === 0) playNote(audio, bass[Math.floor(position / 8)], nextAt.current, stepLength * 1.4, 0.035, 'sine');
        nextAt.current += stepLength;
        step.current++;
      }
    };
    tick();
    timer.current = window.setInterval(tick, 110);
  }, []);

  useEffect(() => {
    let readyTimer: number | null = null;
    if (localStorage.getItem(preferenceKey) === 'on') {
      desired.current = true;
      readyTimer = window.setTimeout(() => setEnabled(true), 0);
    }
    return () => {
      if (readyTimer !== null) window.clearTimeout(readyTimer);
      pause();
      if (context.current) void context.current.close();
      context.current = null;
    };
  }, [pause]);

  useEffect(() => {
    if (!enabled) return;
    const resume = () => { void start().catch(() => {}); };
    const onVisibility = () => { if (document.hidden) pause(); else resume(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pointerdown', resume);
    window.addEventListener('keydown', resume);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointerdown', resume);
      window.removeEventListener('keydown', resume);
    };
  }, [enabled, pause, start]);

  function toggle() {
    const next = !desired.current;
    desired.current = next;
    setEnabled(next);
    localStorage.setItem(preferenceKey, next ? 'on' : 'off');
    if (next) void start().catch(() => {
      desired.current = false;
      setEnabled(false);
      localStorage.setItem(preferenceKey, 'off');
    });
    else pause();
  }

  return { enabled, toggle };
}
