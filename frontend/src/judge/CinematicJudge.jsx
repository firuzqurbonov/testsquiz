import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AudioLines, Box, Check, CircleOff, Clapperboard, Focus, Radar, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { playJudgeSound } from './sound';
import { sceneTimeline } from './timeline';
import './judge.css';

const captions = {
  idle: ['НАБЛЮДЕНИЕ', 'Редактор готов к следующей отправке.'],
  typing: ['НАБОР КОДА', 'Вердикт появится после отправки решения.'],
  checking: ['ИСПОЛНЕНИЕ', 'Проверяющий запускает тесты.'],
  accepted: ['CODE ACCEPTED', 'Все тесты пройдены. Серия ошибок сброшена.'],
  wrong_answer: ['WRONG ANSWER', 'Проверь ожидаемый результат и попробуй снова.'],
  execution_error: ['ОШИБКА ВЫПОЛНЕНИЯ', 'Подробности в результате проверки.'],
  network_error: ['СБОЙ СВЯЗИ', 'Отправку можно повторить. Серия ошибок сохранена.'],
};

const fragments = Array.from({ length: 16 }, (_, index) => {
  const a = index * Math.PI * 2 / 16 + .1;
  const radius = 68 + index * 7 % 112;
  return {
    x: Math.cos(a) * radius, y: Math.sin(a) * radius,
    rotation: -200 + index * 29, delay: index % 4 * 17,
  };
});

function BrokenGlass({ beat }) {
  if (!beat) return null;
  return <div className={'judge-impact judge-impact-' + beat.kind} data-impact={beat.number} key={beat.number} aria-hidden="true">
    <div className="judge-shockwave" />
    <div className="judge-flash" />
    <svg className="judge-cracks" viewBox="0 0 800 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path pathLength="1" d="M400 280l-43-37-15-66-78-58-38-98m174 259 43-68 75-22 55-119 67-28 28-70m-268 307 82 7 64 63 71-18 150 43m-367-95 14 83-35 60 6 53-26 78m41-274-77 24-42 66-70 4-135 71m324-165-12-64 36-56-24-108" />
        <path pathLength="1" d="M357 243l-48 2-53-42-52 4-61-38-48 7m247 1 65-11 33 45m78-21 64 29 45-34 85 17m-166 138 9 54 53 27 29 81m-223-139 38 25 38-12 54 18m-246-27-4 38-43 62-6 61m101-278-31-39-28 24-48-14m175 103 45-17 18 27m72-8 82 34 26 41 64 3" />
        <path pathLength="1" d="M400 280l-19-12 2-15 20-9 20 14 1 22-15 15-24 1-8-17m-20-36-9 26 4 29 22 17 34-1 32-14 15-32-12-56m-20 46 23-11 26 14 10 26m-156 17 30-19 18 12m-35-129 25 8 40-27" />
      </g>
    </svg>
    <div className="judge-digital-slice" />
    {beat.kind === 'pulse' && <div className="judge-blackout" />}
    {fragments.map(({ x, y, rotation, delay }, index) => <i key={index} style={{
      '--shard-x': x + 'px', '--shard-y': y + 'px', '--shard-spin': rotation + 'deg', '--shard-delay': delay + 'ms',
    }} />)}
  </div>;
}

export function CinematicJudge({ controller }) {
  const inline = useRef(null);
  const fullscreen = useRef(null);
  const engine = useRef(null);
  const current = useRef(controller);
  current.current = controller;
  const [ready, setReady] = useState('loading');
  const [quality, setQuality] = useState();
  const [frame, setFrame] = useState({ id: 0, beat: null, reveal: false });
  const screen = ready === 'ready' && controller.enabled ? controller.scene : null;
  const session = useRef(null);
  const visible = useRef(true);
  const pageJolt = useRef(null);

  useEffect(() => {
    let stopped = false;
    let animation = 0;
    const observer = new IntersectionObserver(([entry]) => { visible.current = entry.isIntersecting; });
    observer.observe(inline.current);
    import('./scene').then(({ createJudgeScene }) => createJudgeScene({
      inlineParent: inline.current,
      onQuality: (tier) => { if (!stopped) setQuality(tier); },
      onLost: () => {
        if (stopped) return;
        engine.current?.destroy();
        engine.current = null;
        current.current.dismiss();
        setReady('unavailable');
      },
    })).then((instance) => {
      if (stopped) return instance.destroy();
      engine.current = instance;
      setReady('ready');
      instance.preloadProp();
      const tick = (now) => {
        const controls = current.current;
        const active = session.current;
        if (active && active.id === controls.scene?.id) {
          active.started ??= now;
          const time = Math.max(0, (now - active.started) / 1000);
          const plan = active.plan;
          if (time >= plan.duration) {
            pageJolt.current?.cancel();
            controls.dismiss(active.id);
            session.current = null;
          } else {
            while (active.step < plan.steps.length && time >= plan.steps[active.step]) {
              if (controls.sound && time - plan.steps[active.step] < .12) playJudgeSound('step');
              active.step++;
            }
            while (active.hit < plan.impacts.length && time >= plan.impacts[active.hit].at) {
              const beat = plan.impacts[active.hit++];
              if (document.hidden) continue;
              if (controls.sound) playJudgeSound(beat.kind);
              pageJolt.current?.cancel();
              pageJolt.current = document.getElementById('main-content')?.animate?.([
                { transform: 'translate(0)' },
                { transform: 'translate(7px, -3px)' },
                { transform: 'translate(-5px, 4px)' },
                { transform: 'translate(3px, -2px)' },
                { transform: 'translate(0)' },
              ], { duration: 235, easing: 'ease-out' });
              active.beat = { ...beat, number: active.hit };
              setFrame({ id: active.id, beat: active.beat, reveal: active.reveal });
            }
            if (!active.reveal && time >= (controls.scene.kind === 'accepted' ? .26 : 2.69) &&
                (controls.scene.level === 3 || controls.scene.kind === 'accepted')) {
              active.reveal = true;
              setFrame({ id: active.id, beat: active.beat, reveal: true });
            }
            engine.current?.draw({ scene: controls.scene, time, phase: controls.phase, enabled: controls.enabled }, now);
          }
        } else if (visible.current) {
          engine.current?.draw({ scene: null, phase: controls.phase, enabled: controls.enabled }, now);
        }
        if (!stopped && engine.current) animation = requestAnimationFrame(tick);
      };
      animation = requestAnimationFrame(tick);
    }).catch(() => {
      if (!stopped) setReady('unavailable');
    });

    return () => {
      stopped = true;
      observer.disconnect();
      cancelAnimationFrame(animation);
      pageJolt.current?.cancel();
      engine.current?.destroy();
      engine.current = null;
    };
  }, []);

  useLayoutEffect(() => {
    if (!engine.current) return;
    if (screen) {
      session.current = { id: screen.id, plan: sceneTimeline(screen), step: 0, hit: 0, beat: null, reveal: false };
      engine.current.mount(fullscreen.current);
    } else {
      session.current = null;
      pageJolt.current?.cancel();
      engine.current.mount(inline.current);
    }
  }, [screen, ready]);

  useEffect(() => {
    if (!controller.scene || ready === 'ready') return;
    const id = controller.scene.id;
    const timeout = setTimeout(() => current.current.dismiss(id), ready === 'unavailable' ? 0 : 1400);
    return () => clearTimeout(timeout);
  }, [controller.scene, ready]);

  useEffect(() => {
    if (!screen) return;
    const escape = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        current.current.dismiss(screen.id);
      }
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [screen]);

  const levels = ['Ожидание', 'Первый сбой', 'Повторный сбой', 'Финальный сбой'];
  const [title, detail] = captions[controller.phase] || captions.idle;
  const beat = screen && frame.id === screen.id ? frame.beat : null;
  const reveal = screen && frame.id === screen.id && frame.reveal;

  return <>
    <aside className="judge-card" data-judge-state={controller.phase} data-streak={controller.streak} data-renderer={ready === 'ready' ? 'webgl' : ready} aria-label="3D-проверяющий">
      <header className="judge-header">
        <span className="judge-brand-icon"><Box size={20} /></span>
        <div><h2>Python Judge</h2><p>Кинематографическая проверка</p></div>
        <span className="judge-mode"><span /> 3D</span>
      </header>
      <div className="judge-portrait">
        <div className="judge-grid" aria-hidden="true" />
        <div ref={inline} className="judge-inline-model" />
        {ready !== 'ready' && <div className="judge-model-status" role="status">
          <Radar size={29} />
          {ready === 'loading' ? 'Загружаю 3D-модель…' : '3D недоступно. Проверка работает в обычном режиме.'}
        </div>}
        <div className="judge-corner judge-corner-nw" aria-hidden="true" />
        <div className="judge-corner judge-corner-se" aria-hidden="true" />
      </div>
      <div className="judge-info">
        <div className="judge-info-heading"><strong><AudioLines size={14} /> {title}</strong>
          <span title={levels[controller.streak]}>ОШИБКИ <b>{controller.streak}</b> / 3</span></div>
        <p>{detail}</p>
      </div>
      <div className="judge-controls">
        <button type="button" aria-pressed={controller.enabled} disabled={controller.reduced}
          title={controller.reduced ? 'Движение ограничено системной настройкой' : undefined} onClick={controller.toggleEffects}>
          {controller.enabled ? <Clapperboard size={16} /> : <CircleOff size={16} />}
          Эффекты {controller.enabled ? 'вкл.' : 'выкл.'}
        </button>
        <button type="button" aria-pressed={controller.sound} onClick={controller.toggleSound}>
          {controller.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          Звук {controller.sound ? 'вкл.' : 'выкл.'}
        </button>
      </div>
    </aside>

    {screen && createPortal(<div className={'judge-screen judge-screen-' + (screen.kind === 'accepted' ? 'accepted' : screen.level)}
      data-level={screen.level} data-quality={quality} data-kind={screen.kind} key={screen.id}
      style={{ '--judge-duration': sceneTimeline(screen).duration + 's' }}>
      <div className="judge-screen-backdrop" />
      <div className="judge-screen-ground" />
      <div className="judge-full-model" ref={fullscreen} />
      <div className="judge-screen-lens" />
      <BrokenGlass beat={beat} />
      <div className="judge-screen-top"><span><Focus size={17} /> PYTHON JUDGE</span>
        <button type="button" className="judge-skip" onClick={() => current.current.dismiss(screen.id)}>
          <SkipForward size={17} /> Пропустить <kbd>Esc</kbd>
        </button></div>
      {reveal && <div className="judge-screen-message" role="status">
        <span>{screen.kind === 'accepted' ? <Check size={18} /> : <CircleOff size={17} />}</span>
        <strong>{screen.kind === 'accepted' ? 'CODE ACCEPTED' : 'EXECUTION FAILED — TRY AGAIN'}</strong>
      </div>}
    </div>, document.body)}
  </>;
}
