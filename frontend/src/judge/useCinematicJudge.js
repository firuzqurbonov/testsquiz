import { useEffect, useRef, useState } from 'react';
import { primeJudgeSound } from './sound';

function read(store, key) {
  try { return store.getItem(key); } catch { return null; }
}

function write(store, key, value) {
  try { store.setItem(key, value); } catch { /* storage is optional */ }
}

export function useCinematicJudge(taskKey) {
  const key = 'marifat.judge.streak.' + taskKey;
  const [streak, setStreak] = useState(() => Math.min(3, Math.max(0, Number(read(sessionStorage, key)) || 0)));
  const count = useRef(streak);
  const [effects, setEffects] = useState(() => read(localStorage, 'marifat.judge.effects') !== 'off'
    && read(localStorage, 'marifat.mentor.motion') !== 'off');
  const [sound, setSound] = useState(() => read(localStorage, 'marifat.judge.sound') === 'on');
  const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [phase, setPhase] = useState('idle');
  const [scene, setScene] = useState(null);
  const activity = useRef(null);
  const sequence = useRef(0);
  const openAttempt = useRef(null);
  const enabled = effects && !reduced;
  const availability = useRef(enabled);
  availability.current = enabled;

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (event) => setReduced(event.matches);
    media.addEventListener('change', update);
    return () => {
      media.removeEventListener('change', update);
      clearTimeout(activity.current);
      openAttempt.current = null;
    };
  }, []);

  useEffect(() => {
    if (!enabled) setScene(null);
  }, [enabled]);

  function toggleEffects() {
    const next = !effects;
    write(localStorage, 'marifat.judge.effects', next ? 'on' : 'off');
    if (next) write(localStorage, 'marifat.mentor.motion', 'on');
    else setScene(null);
    setEffects(next);
  }

  function toggleSound() {
    const next = !sound;
    if (next) primeJudgeSound();
    write(localStorage, 'marifat.judge.sound', next ? 'on' : 'off');
    setSound(next);
  }

  function typing() {
    if (openAttempt.current || scene) return;
    clearTimeout(activity.current);
    setPhase('typing');
    activity.current = setTimeout(() => setPhase('idle'), 1800);
  }

  function begin() {
    if (sound && enabled) primeJudgeSound();
    clearTimeout(activity.current);
    const attempt = ++sequence.current;
    openAttempt.current = attempt;
    setScene(null);
    setPhase('checking');
    return attempt;
  }

  function finish(attempt, status) {
    if (openAttempt.current !== attempt) return;
    openAttempt.current = null;
    if (status === 'accepted' || status === 'wrong_answer') {
      count.current = status === 'accepted' ? 0 : Math.min(count.current + 1, 3);
      write(sessionStorage, key, String(count.current));
      setStreak(count.current);
      setPhase(status);
      if (availability.current) setScene({ id: attempt, kind: status, level: count.current });
    } else {
      setPhase('execution_error');
    }
  }

  function fail(attempt) {
    if (openAttempt.current !== attempt) return;
    openAttempt.current = null;
    setPhase('network_error');
  }

  const dismiss = (id) => setScene((current) => id === undefined || current?.id === id ? null : current);

  return {
    phase, scene, streak, enabled, reduced, sound,
    typing, begin, finish, fail, dismiss, toggleEffects, toggleSound,
  };
}
