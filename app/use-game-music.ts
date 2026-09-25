'use client';

import { useEffect, useRef, useState } from 'react';

const preferenceKey = 'inside-joke-music';

export function useGameMusic() {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const track = new Audio('/inside-joke-music.mp3');
    track.loop = true;
    track.volume = 0.7;
    track.preload = 'auto';
    audio.current = track;
    const onHide = () => {
      if (!document.hidden) return;
      track.pause();
      setPlaying(false);
    };
    document.addEventListener('visibilitychange', onHide);
    let readyTimer: number | null = null;
    if (localStorage.getItem(preferenceKey) === 'on') readyTimer = window.setTimeout(() => setEnabled(true), 0);
    return () => {
      if (readyTimer !== null) window.clearTimeout(readyTimer);
      document.removeEventListener('visibilitychange', onHide);
      track.pause();
      audio.current = null;
    };
  }, []);

  async function toggle() {
    const track = audio.current;
    if (!track) return;
    if (!track.paused) {
      track.pause();
      setPlaying(false);
      setEnabled(false);
      localStorage.setItem(preferenceKey, 'off');
      return;
    }
    setEnabled(true);
    localStorage.setItem(preferenceKey, 'on');
    try {
      await track.play();
      setPlaying(!track.paused);
    } catch {
      setPlaying(false);
    }
  }

  return { enabled, playing, toggle };
}
