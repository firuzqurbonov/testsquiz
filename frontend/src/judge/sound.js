let audio;
let noise;

export function primeJudgeSound() {
  try {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    audio ||= new Audio();
    if (audio.state === 'suspended') audio.resume().catch(() => {});
  } catch { /* sound is optional */ }
}

export function playJudgeSound(cue) {
  if (!audio || audio.state !== 'running') return;
  const now = audio.currentTime;
  const out = audio.createGain();
  out.connect(audio.destination);
  const duration = cue === 'pulse' ? .32 : cue === 'step' ? .095 : .19;
  out.gain.setValueAtTime(cue === 'step' ? .12 : .22, now);
  out.gain.exponentialRampToValueAtTime(.001, now + duration);
  const oscillator = audio.createOscillator();
  oscillator.type = cue === 'pulse' ? 'triangle' : 'sine';
  oscillator.frequency.setValueAtTime(cue === 'pulse' ? 290 : cue === 'step' ? 78 : 94, now);
  oscillator.frequency.exponentialRampToValueAtTime(cue === 'pulse' ? 57 : 36, now + duration);
  oscillator.connect(out);
  oscillator.start(now);
  oscillator.stop(now + duration);

  if (cue !== 'step') {
    if (!noise) {
      noise = audio.createBuffer(1, Math.round(audio.sampleRate * .23), audio.sampleRate);
      const buffer = noise.getChannelData(0);
      for (let index = 0; index < buffer.length; index++) buffer[index] = (Math.random() * 2 - 1) * .45;
    }
    const crack = audio.createBufferSource();
    crack.buffer = noise;
    const filter = audio.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cue === 'pulse' ? 1650 : 860;
    crack.connect(filter).connect(out);
    crack.start(now);
  }
  oscillator.onended = () => out.disconnect();
}
