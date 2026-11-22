const one = {
  duration: 2.7,
  cuts: [[0, 'idle'], [.22, 'walk'], [1, 'melee'], [1.79, 'retreat'], [2.5, 'idle']],
  impacts: [{ at: 1.43, kind: 'hit' }],
  steps: [.47, .83, 2.07, 2.35],
  distance: 1.47,
  advance: [.22, 1.13],
  retreat: [1.71, 2.55],
};

const two = {
  duration: 3.48,
  cuts: [[0, 'idle'], [.17, 'walk'], [.92, 'melee'], [1.59, 'ready_idle'], [1.73, 'melee'], [2.47, 'retreat'], [3.22, 'idle']],
  impacts: [{ at: 1.31, kind: 'hit' }, { at: 2.13, kind: 'hit' }],
  steps: [.43, .75, 2.8, 3.09],
  distance: 1.68,
  advance: [.17, 1.04],
  retreat: [2.36, 3.28],
};

const three = {
  duration: 3.93,
  cuts: [[0, 'idle'], [.22, 'walk'], [1.05, 'ready_idle'], [1.62, 'aim_idle'], [2.22, 'shoot'], [2.76, 'ready_idle']],
  impacts: [{ at: 2.26, kind: 'pulse' }],
  steps: [.52, .89],
  distance: 1.46,
  advance: [.23, 1.14],
  retreat: [2.83, 3.68],
  prop: [1.22, 2.89],
};

const accepted = {
  duration: 1.65,
  cuts: [[0, 'idle']],
  impacts: [],
  steps: [],
  distance: .22,
  advance: [0, .54],
  retreat: [1.23, 1.65],
};

export function sceneTimeline(scene) {
  if (scene.kind === 'accepted') return accepted;
  return [one, two, three][scene.level - 1];
}

const clamp = (value) => Math.min(1, Math.max(0, value));
const between = (value, start, end) => clamp((value - start) / (end - start));
const ease = (value) => value * value * (3 - 2 * value);
export const windowEase = (value, start, end) => ease(between(value, start, end));

export function sampleScene(scene, time) {
  const plan = sceneTimeline(scene);
  const cut = plan.cuts.findLastIndex(([at]) => time >= at);
  const impact = plan.impacts.findLast((beat) => time >= beat.at);
  const elapsed = impact ? time - impact.at : Infinity;
  const response = Math.exp(-elapsed * 6.5);
  const wobble = impact ? Math.sin(elapsed * 48) * Math.exp(-elapsed * 9) : 0;
  const travel = windowEase(time, ...plan.advance) * (1 - windowEase(time, ...plan.retreat));
  const propVisible = !!plan.prop && time >= plan.prop[0] && time <= plan.prop[1];

  return {
    shot: plan.cuts[cut]?.[1] || 'idle',
    cut,
    travel,
    advance: travel * plan.distance,
    propVisible,
    propLift: propVisible ? windowEase(time, 1.22, 1.83) : 0,
    recoil: impact ? response * (impact.kind === 'pulse' ? .47 : .27) : 0,
    wobble,
    glare: impact ? Math.exp(-elapsed * 17) : 0,
    nod: scene.kind === 'accepted' ? windowEase(time, .39, .65) * (1 - windowEase(time, .69, 1.03)) : 0,
  };
}
