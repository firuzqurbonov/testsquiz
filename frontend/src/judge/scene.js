import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { sampleScene, sceneTimeline, windowEase } from './timeline';

const asset = (file) => import.meta.env.BASE_URL + 'judge/' + file;
const boneKey = (name) => name.replace(/^mixamorig:?/, '').replace(/_\d+$/, '');
const world = (object) => object.getWorldPosition(new THREE.Vector3());

function bonesOf(object) {
  const bones = new Map();
  object.traverse((node) => {
    const key = boneKey(node.name);
    if (node.isBone && !bones.has(key)) bones.set(key, node);
  });
  return bones;
}

// The two assets use Mixamo bone-local axes. Only the pelvis changes coordinate
// systems. Target translations for all other joints keep its own proportions.
function retargetMotion(source, targetBones) {
  const reference = bonesOf(source.scene);
  const base = reference.get('Hips');
  const pelvis = targetBones.get('Hips');
  if (!base || !pelvis) throw new Error('The character has no compatible pelvis joint.');
  source.scene.updateMatrixWorld(true);
  pelvis.updateWorldMatrix(true, false);
  const unitScale = (world(pelvis).y - world(targetBones.get('LeftFoot')).y)
    / (world(base).y - world(reference.get('LeftFoot')).y);
  const inputBasis = base.parent.matrixWorld.clone();
  const outputBasis = pelvis.parent.matrixWorld.clone().invert();
  const rotation = pelvis.parent.getWorldQuaternion(new THREE.Quaternion()).invert()
    .multiply(base.parent.getWorldQuaternion(new THREE.Quaternion()));
  const q = new THREE.Quaternion();
  const vector = new THREE.Vector3();

  return new Map(source.animations.map((clip) => {
    const tracks = [];
    for (const track of clip.tracks) {
      const { nodeName, propertyName } = THREE.PropertyBinding.parseTrackName(track.name);
      const key = boneKey(nodeName);
      const bone = targetBones.get(key);
      if (!bone) continue;
      const name = bone.name + '.' + propertyName;
      if (propertyName === 'quaternion') {
        const values = track.values.slice();
        if (key === 'Hips') {
          for (let i = 0; i < values.length; i += 4) q.fromArray(values, i).premultiply(rotation).toArray(values, i);
        }
        tracks.push(new THREE.QuaternionKeyframeTrack(name, track.times, values));
      } else if (key === 'Hips' && propertyName === 'position') {
        const values = track.values.slice();
        for (let i = 0; i < values.length; i += 3) {
          vector.fromArray(values, i).applyMatrix4(inputBasis).multiplyScalar(unitScale).applyMatrix4(outputBasis).toArray(values, i);
        }
        tracks.push(new THREE.VectorKeyframeTrack(name, track.times, values));
      }
    }
    return [clip.name, new THREE.AnimationClip(clip.name, clip.duration, tracks)];
  }));
}

function release(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((node) => {
    if (node.geometry) geometries.add(node.geometry);
    const list = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material);
      for (const entry of Object.values(material)) if (entry?.isTexture) textures.add(entry);
    }
    node.skeleton?.dispose();
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}

async function loadProp() {
  const [mesh, texture] = await Promise.all([
    new OBJLoader().loadAsync(asset('pulse-prop.obj')),
    new THREE.TextureLoader().loadAsync(asset('pulse-prop.jpg')),
  ]);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: .38, metalness: .29, color: 0xabc2d3 });
  mesh.traverse((node) => {
    if (!node.isMesh) return;
    if (Array.isArray(node.material)) node.material.forEach((part) => part.dispose());
    else node.material?.dispose();
    node.material = material;
    node.castShadow = true;
  });
  const bounds = new THREE.Box3().setFromObject(mesh);
  const factor = .27 / (bounds.max.x - bounds.min.x);
  mesh.scale.setScalar(factor);
  mesh.position.set(-factor * (bounds.max.x - .73), -factor * (bounds.min.y + .82), 0);
  const rotated = new THREE.Group();
  rotated.rotation.y = Math.PI / 2;
  rotated.add(mesh);
  const prop = new THREE.Group();
  prop.visible = false;
  prop.add(rotated);
  return prop;
}

function limitedGPU() {
  return innerWidth < 710 || (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
}

function addLight(scene, color, intensity, xyz, type = THREE.DirectionalLight) {
  const light = new type(color, intensity);
  light.position.set(...xyz);
  scene.add(light);
  return light;
}

const handA = new THREE.Vector3();
const handB = new THREE.Vector3();
const handC = new THREE.Vector3();
const dir = new THREE.Vector3();
const normal = new THREE.Vector3();
const target = new THREE.Vector3();
const elbow = new THREE.Vector3();
const deltaQ = new THREE.Quaternion();
const worldQ = new THREE.Quaternion();
const parentQ = new THREE.Quaternion();

function rotateJoint(joint, from, to, influence) {
  deltaQ.setFromUnitVectors(from.normalize(), to.normalize());
  joint.getWorldQuaternion(worldQ).premultiply(deltaQ);
  joint.parent.getWorldQuaternion(parentQ).invert();
  joint.quaternion.slerp(worldQ.premultiply(parentQ), influence);
  joint.updateWorldMatrix(true, true);
}

function poseReach(bones, side, influence, raised = false, fold = null) {
  const upper = bones.get(side + 'Arm');
  const lower = bones.get(side + 'ForeArm');
  const wrist = bones.get(side + 'Hand');
  if (!upper || !lower || !wrist || influence <= .001) return;
  upper.getWorldPosition(handA);
  lower.getWorldPosition(handB);
  wrist.getWorldPosition(handC);
  const upperLength = handB.distanceTo(handA), lowerLength = handC.distanceTo(handB);
  const sign = side === 'Right' ? -1 : 1;
  let reach = (upperLength + lowerLength) * (raised ? .90 : .985);
  if (fold) {
    target.set(fold.x - sign * .10, fold.y - (sign > 0 ? .16 : .22), fold.z + .23);
    dir.copy(target).sub(handA);
    reach = Math.min(reach, Math.max(Math.abs(upperLength - lowerLength) + .01, dir.length()));
    dir.normalize();
  } else {
    dir.set(-sign * (raised ? .47 : .32), raised ? -.008 : .16, 1).normalize();
  }
  target.copy(handA).addScaledVector(dir, reach);
  normal.set(sign * .86, -.57, 0);
  normal.addScaledVector(dir, -normal.dot(dir)).normalize();
  const projected = (upperLength ** 2 - lowerLength ** 2 + reach ** 2) / (2 * reach);
  const lift = Math.sqrt(Math.max(0, upperLength ** 2 - projected ** 2));
  elbow.copy(handA).addScaledVector(dir, projected).addScaledVector(normal, lift);
  rotateJoint(upper, handB.clone().sub(handA), elbow.clone().sub(handA), influence);
  lower.getWorldPosition(handB);
  wrist.getWorldPosition(handC);
  rotateJoint(lower, handC.sub(handB), target.sub(handB), influence);
}

export async function createJudgeScene({ inlineParent, onQuality, onLost }) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: !limitedGPU(), powerPreference: limitedGPU() ? 'low-power' : 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.setClearColor(0x000000, 0);
  const gl = renderer.getContext();
  const identification = gl.getExtension('WEBGL_debug_renderer_info');
  const software = identification && /swiftshader|llvmpipe|software/i.test(gl.getParameter(identification.UNMASKED_RENDERER_WEBGL));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.className = 'judge-canvas';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .025, 22);
  const key = addLight(scene, 0xffdecb, 3.2, [-2.2, 3.4, 3.7]);
  key.target.position.set(0, 1.05, .4);
  scene.add(key.target);
  key.shadow.mapSize.set(512, 512);
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 3, bottom: -2, near: .25, far: 10 });
  key.shadow.bias = -.003;
  key.shadow.normalBias = .015;
  const edge = addLight(scene, 0x9f80ff, 5.4, [2.15, 2.75, -1.7]);
  addLight(scene, 0x9cd8ed, 2.05, [2.7, 1.3, 2.25]);
  scene.add(new THREE.HemisphereLight(0xaec8f2, 0x8e6f82, 1.7));
  const pulse = addLight(scene, 0xecac83, 0, [0, 1.65, 2.65], THREE.PointLight);
  pulse.distance = 7;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: .34 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.006;
  floor.receiveShadow = true;
  scene.add(floor);

  let quality;
  let host;
  let disposed = false;
  let width = 0;
  let height = 0;
  let lowFPS = 0;
  let environment;
  let propsPromise;
  let prop;
  const changeSize = () => {
    const rect = host?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return;
    width = rect.width;
    height = rect.height;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observation = new ResizeObserver(changeSize);
  const setQuality = (tier) => {
    if (quality === tier) return;
    quality = tier;
    renderer.setPixelRatio(tier === 'low' ? 1 : Math.min(devicePixelRatio || 1, 1.6));
    renderer.shadowMap.enabled = tier === 'high';
    renderer.shadowMap.type = THREE.PCFShadowMap;
    key.castShadow = tier === 'high';
    changeSize();
    onQuality(tier);
  };
  const mount = (next) => {
    if (!next || next === host) return;
    observation.disconnect();
    host = next;
    host.append(renderer.domElement);
    observation.observe(host);
    changeSize();
  };
  const lost = (event) => { event.preventDefault(); onLost(); };
  renderer.domElement.addEventListener('webglcontextlost', lost);
  setQuality(limitedGPU() || software ? 'low' : 'high');
  mount(inlineParent);

  let rig;
  let mixer;
  let clips;
  let bones;
  const pivot = new THREE.Group();
  const neutral = new Map();
  scene.add(pivot);

  function destroy() {
    if (disposed) return;
    disposed = true;
    observation.disconnect();
    mixer?.stopAllAction();
    if (rig) mixer?.uncacheRoot(rig);
    release(scene);
    environment?.dispose();
    renderer.domElement.removeEventListener('webglcontextlost', lost);
    renderer.domElement.remove();
    renderer.dispose();
    renderer.forceContextLoss();
  }

  try {
    const loader = new GLTFLoader();
    const [figure, motion] = await Promise.all([
      loader.loadAsync(asset('judge.glb')),
      loader.loadAsync(asset('judge-motion.glb')),
    ]);
    rig = figure.scene;
    const headset = [];
    rig.traverse((node) => {
      if (!node.isMesh) return;
      if (/headphone/i.test(node.material?.name || '')) headset.push(node);
      node.castShadow = true;
      node.frustumCulled = false;
      if (node.material?.isMeshStandardMaterial) {
        if (!/head|skin/i.test(node.material.name)) node.material.color.multiply(new THREE.Color(0xdde6ff)).multiplyScalar(.87);
        node.material.envMapIntensity = .5;
      }
    });
    for (const node of headset) {
      node.removeFromParent();
      release(node);
    }
    bones = bonesOf(rig);
    clips = retargetMotion(motion, bones);
    mixer = new THREE.AnimationMixer(rig);
    mixer.clipAction(clips.get('idle')).play();
    mixer.update(.03);
    rig.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(rig, true);
    const factor = 1.8 / (box.max.y - box.min.y);
    const center = world(bones.get('Hips'));
    if (!Number.isFinite(factor) || factor <= 0) throw new Error('Invalid character scale.');
    rig.scale.multiplyScalar(factor);
    rig.position.sub(new THREE.Vector3(center.x, box.min.y, center.z).multiplyScalar(factor));
    pivot.add(rig);
    if (quality === 'high') {
      const room = new RoomEnvironment();
      const converter = new THREE.PMREMGenerator(renderer);
      environment = converter.fromScene(room, .06);
      scene.environment = environment.texture;
      scene.environmentIntensity = .55;
      room.dispose();
      converter.dispose();
    }
  } catch (error) {
    destroy();
    throw error;
  }

  function preloadProp() {
    propsPromise ||= loadProp().then((loaded) => {
      if (disposed) release(loaded);
      else {
        prop = loaded;
        scene.add(prop);
      }
      return loaded;
    }).catch(() => null);
    return propsPromise;
  }

  let lastFrame = 0;
  let lastCameraPose = '';
  let action = mixer.clipAction(clips.get('idle'));
  let marker = '';
  const lookAt = new THREE.Vector3();
  const adjustment = new THREE.Quaternion();
  const angle = new THREE.Euler();
  const head = bones.get('Head');
  const hand = bones.get('RightHand');
  const chest = bones.get('Spine2');
  const fingers = ['RightHandIndex1', 'RightHandMiddle1'].map((name) => bones.get(name)).filter(Boolean);
  let attention = 0;

  function switchMotion(name, selection) {
    if (selection === marker) return;
    marker = selection;
    const clip = clips.get(name === 'retreat' ? 'walk' : name);
    if (!clip) return;
    const next = mixer.clipAction(clip);
    if (next !== action) action?.fadeOut(.14);
    next.reset().setEffectiveWeight(1).setEffectiveTimeScale(name === 'retreat' ? -.90 : name === 'walk' ? 1.22 : 1);
    next.setLoop(['melee', 'shoot'].includes(name) ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
    next.clampWhenFinished = ['melee', 'shoot'].includes(name);
    if (name === 'retreat') next.time = clip.duration - .001;
    if (next !== action) next.fadeIn(.14);
    next.play();
    action = next;
  }

  function draw(frame, now) {
    if (disposed || !width || !height) return;
    const changed = frame.scene?.id + ':' + frame.phase + ':' + frame.enabled + ':' + width + 'x' + height;
    if (!frame.enabled && lastCameraPose === changed) return;
    if (!frame.scene && document.hidden) return;
    const elapsed = now - lastFrame;
    if (elapsed < (quality === 'low' ? 38 : 14) && lastCameraPose === changed) return;
    if (quality === 'high' && lastFrame && elapsed < 140) {
      lowFPS = elapsed > 38 ? lowFPS + 1 : Math.max(0, lowFPS - 1);
      if (lowFPS > 24) setQuality('low');
    }
    const dt = lastFrame && frame.enabled ? Math.min(elapsed / 1000, .085) : 0;
    lastFrame = now;
    lastCameraPose = changed;
    const take = frame.scene;
    const cue = take && sampleScene(take, frame.time);
    for (const [node, pose] of neutral) node.quaternion.copy(pose);
    neutral.clear();
    switchMotion(cue?.shot || 'idle', cue ? take.id + ':' + cue.cut : 'inline');
    mixer.update(dt);

    const needLook = frame.enabled && (frame.phase === 'typing' || frame.phase === 'checking') ? 1 : 0;
    attention += (needLook - attention) * Math.min(1, dt * 5.8);
    if (head && frame.enabled) {
      neutral.set(head, head.quaternion.clone());
      const idleLook = Math.sin(now * .00055) * .052;
      const yaw = take ? -idleLook * .2 : -.22 * attention + idleLook;
      angle.set((cue?.nod || 0) * .25 + (take ? 0 : .075 * attention), yaw, 0, 'XYZ');
      head.quaternion.multiply(adjustment.setFromEuler(angle));
    }
    if (!take && frame.enabled && hand) {
      neutral.set(hand, hand.quaternion.clone());
      const tap = Math.pow(Math.max(0, Math.sin(now * (attention > .2 ? .015 : .009))), 11);
      hand.quaternion.multiply(adjustment.setFromEuler(angle.set(tap * .08, 0, 0)));
      for (const finger of fingers) {
        neutral.set(finger, finger.quaternion.clone());
        finger.quaternion.multiply(adjustment.setFromEuler(angle.set(0, 0, .16 * tap * attention)));
      }
    }

    pivot.position.z = cue?.advance || 0;
    pivot.rotation.y = cue ? -.12 + cue.travel * .12 : -.16;
    const final = take?.level === 3;
    const face = take?.kind === 'accepted';
    edge.intensity = final ? 6.45 : face ? 4.25 : 5.35;
    edge.color.setHex(final ? 0xff6e48 : face ? 0x74f8d0 : 0xa68cff);
    key.intensity = final ? 2.7 : 3.6;
    pulse.intensity = cue ? cue.glare * (final ? 12 : 2) : 0;

    if (!take && frame.enabled && chest) {
      const local = now / 1000 % 12;
      const fold = windowEase(local, 4.7, 5.55) * (1 - windowEase(local, 8.9, 9.65)) * (1 - attention * .55);
      if (fold > .01) {
        const anchor = world(chest);
        for (const side of ['Right', 'Left']) {
          for (const jointKey of ['Arm', 'ForeArm']) {
            const joint = bones.get(side + jointKey);
            if (joint) neutral.set(joint, joint.quaternion.clone());
          }
          poseReach(bones, side, fold * .86, false, anchor);
        }
      }
    }

    if (cue) {
      const beats = sceneTimeline(take).impacts;
      const arm = beats.findIndex((beat) => Math.abs(frame.time - beat.at) <= .24 && beat.kind === 'hit');
      if (arm >= 0) {
        const at = beats[arm].at;
        const blend = windowEase(frame.time, at - .17, at - .043) * (1 - windowEase(frame.time, at + .035, at + .21));
        const side = arm ? 'Left' : 'Right';
        for (const key of ['Arm', 'ForeArm']) {
          const joint = bones.get(side + key);
          if (joint) neutral.set(joint, joint.quaternion.clone());
        }
        poseReach(bones, side, blend);
      }
      if (final && cue.propVisible) {
        for (const key of ['RightArm', 'RightForeArm']) {
          const joint = bones.get(key);
          if (joint) neutral.set(joint, joint.quaternion.clone());
        }
        poseReach(bones, 'Right', cue.propLift * .90, true);
      }
    }

    if (prop) {
      prop.visible = Boolean(cue?.propVisible && hand);
      if (prop.visible) {
        hand.getWorldPosition(prop.position);
        prop.position.y += .018;
        prop.rotation.set(.27 * (1 - cue.propLift) - cue.glare * .10, -.43 * (1 - cue.propLift), -.18 * (1 - cue.propLift));
      }
    }

    if (cue) {
      const intro = windowEase(frame.time, 0, .58);
      camera.fov = camera.aspect < 1 ? 45 : 35;
      camera.position.set(.22 * (1 - cue.travel) + cue.wobble * .07, 1.34 + cue.travel * .12 + cue.wobble * .028, 4.02 - intro * .34 + cue.recoil);
      lookAt.set(0, 1.06 + cue.travel * .40, cue.advance * .3);
    } else {
      camera.fov = 30;
      camera.position.set(.06, 1.53, 2.27);
      lookAt.set(0, 1.33, 0);
    }
    camera.updateProjectionMatrix();
    camera.lookAt(lookAt);
    renderer.render(scene, camera);
  }

  return { mount, draw, destroy, preloadProp };
}
