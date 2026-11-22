import { useCallback, useEffect, useRef, useState } from 'react';

const preferenceKey = 'marifat.mentor.motion';
const readingTime = 970;
const sleepTime = 12500;
const reactionTimes = { success: 1400, wrong_answer: 1850, execution_error: 600, network_error: 450, request_error: 450 };
const idle = { phase: 'idle', attempt: 0 };

function readPreference() {
  try {
    return localStorage.getItem(preferenceKey) !== 'off';
  } catch {
    return true;
  }
}

function prefersStatic() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function mentorVerdict(status) {
  if (status === 'accepted') return 'success';
  if (status === 'wrong_answer') return 'wrong_answer';
  return 'execution_error';
}

export function mentorFailure(error) {
  return !error?.status || error.status >= 500 ? 'network_error' : 'request_error';
}

export function useCodeMentor() {
  const [state, setState] = useState(idle);
  const [enabled, setEnabled] = useState(readPreference);
  const [reduced, setReduced] = useState(prefersStatic);
  const current = useRef(idle);
  const active = useRef(null);
  const queued = useRef(null);
  const reveal = useRef(null);
  const activity = useRef(null);
  const sequence = useRef(0);
  const lockedUntil = useRef(0);
  const animated = enabled && !reduced;
  const playing = useRef(animated);
  playing.current = animated;

  const publish = useCallback((next) => {
    current.current = next;
    setState(next);
  }, []);

  const scheduleSleep = useCallback((delay = sleepTime) => {
    clearTimeout(activity.current);
    activity.current = setTimeout(() => {
      if (!active.current) publish({ ...idle, phase: 'sleeping' });
    }, delay);
  }, [publish]);

  const showOutcome = useCallback(() => {
    if (!queued.current) return;
    const next = queued.current;
    clearTimeout(reveal.current);
    queued.current = null;
    active.current = null;
    lockedUntil.current = performance.now() + (reactionTimes[next.phase] || 0);
    publish({ ...next, play: playing.current });
    scheduleSleep(sleepTime + 3500);
  }, [publish, scheduleSleep]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (event) => setReduced(event.matches);
    media.addEventListener('change', update);
    scheduleSleep();
    return () => {
      media.removeEventListener('change', update);
      clearTimeout(activity.current);
      clearTimeout(reveal.current);
      active.current = null;
      queued.current = null;
    };
  }, [scheduleSleep]);

  useEffect(() => {
    if (animated) return;
    if (current.current.play) publish({ ...current.current, play: false });
    showOutcome();
  }, [animated, publish, showOutcome]);

  function toggle() {
    const next = !enabled;
    try { localStorage.setItem(preferenceKey, next ? 'on' : 'off'); } catch { /* preference is optional */ }
    setEnabled(next);
  }

  function typing() {
    if (active.current || (animated && performance.now() < lockedUntil.current)) return;
    clearTimeout(activity.current);
    if (current.current.phase !== 'typing') publish({ ...idle, phase: 'typing' });
    activity.current = setTimeout(() => {
      publish(idle);
      scheduleSleep();
    }, 1050);
  }

  function start(code) {
    clearTimeout(activity.current);
    clearTimeout(reveal.current);
    queued.current = null;
    const attempt = ++sequence.current;
    active.current = { attempt, started: performance.now() };
    const lines = code.split('\n').filter((line) => line.trim()).slice(0, 4);
    publish({ phase: 'checking', attempt, lines });
    return attempt;
  }

  function finish(attempt, phase, status) {
    const inspection = active.current;
    if (inspection?.attempt !== attempt) return;
    queued.current = { ...current.current, phase, status };
    const remaining = playing.current && current.current.phase === 'checking'
      ? readingTime - (performance.now() - inspection.started)
      : 0;
    if (remaining > 0) reveal.current = setTimeout(showOutcome, remaining);
    else showOutcome();
  }

  const sceneAnimated = animated && state.play !== false;
  return { ...state, animated, sceneAnimated, reduced, toggle, typing, start, finish };
}
