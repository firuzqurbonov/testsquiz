import { useId, useLayoutEffect, useState } from 'react';
import { AudioLines, Pause, Play, Sparkles } from 'lucide-react';
import './code-mentor.css';

const messages = {
  idle: ['ОМОДА', 'Лист на столе. Что сегодня проверим?'],
  typing: ['МЕХОНАМ', 'Вижу, код растёт. Отступы — тоже часть решения.'],
  sleeping: ['ТАНАФФУС', 'Минутка сна… Разбуди меня новой строкой.'],
  checking: ['САНҶИШ', 'Так, читаю по строчке…'],
  success: ['ҚАБУЛ ШУД', 'Отлично! Задача решена!'],
  wrong_answer: ['ҶАВОБИ НОДУРУСТ', 'Python не прощает ошибок 😅 Попробуй ещё раз!'],
  execution_error: ['ХАТОИ ИҶРО', 'Код споткнулся. Загляни в результат и попробуй ещё раз.'],
  network_error: ['ПАЙВАСТ НЕСТ', 'Проверка не ответила. Тут дело в связи, попробуй ещё раз.'],
  request_error: ['ДАРХОСТ', 'Не удалось отправить решение. Посмотри сообщение у редактора.'],
};

const confetti = [
  [-118, -37, 115, '#dbc5ff'], [-99, 50, 180, '#72d5c6'], [-87, -68, -135, '#f4c578'],
  [-70, 18, 130, '#ffb1af'], [-51, -81, 270, '#a790ff'], [-26, 64, -225, '#8de7cf'],
  [17, -91, 165, '#ffe4a7'], [32, 60, -210, '#ffb0cd'], [59, -69, 242, '#ccb2ff'],
  [72, 48, 184, '#ffd27d'], [98, -49, -140, '#78dbc5'], [123, 9, 257, '#ff9a9e'],
  [-127, 21, -172, '#79dace'], [95, 65, 195, '#a990ff'], [55, -94, 90, '#ffbb8d'],
  [-50, 51, 230, '#f8d797'], [-7, -78, -210, '#f3b8f2'], [123, -24, 225, '#a991ff'],
];

function PaperBall({ className }) {
  return <svg viewBox="0 0 56 56" className={className} aria-hidden="true" focusable="false">
    <path d="M10 13 22 7 29 9 39 6 48 17 51 32 44 44 31 50 22 47 13 48 6 36 7 27 4 21Z" fill="#eee5fc" stroke="#482d69" strokeWidth="2" strokeLinejoin="round" />
    <path d="m8 23 9 4 7-8 6 7 11-8 6 6-4 11 1 8-15 5-7-6-8 3-6-11Z" fill="#b5a3d7" />
    <path d="m10 15 12-5 8 3 10-3 7 9-11-3-7 5-7-5-8 8Z" fill="#fff8ff" />
    <path d="m17 27 4 9 10-4 7 7m-8-13 1 6 10-8m-16-5 2-7M14 44l7-8" fill="none" stroke="#68558f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function Studio({ lines, phase }) {
  const id = useId().replace(/[^a-z0-9-]/gi, '');
  const uri = (name) => 'url(#' + id + '-' + name + ')';
  const reference = lines?.length ? lines : ['def solve():', '  a, b = map(...)', '  print(a + b)'];
  return <svg className="mentor-studio" viewBox="0 0 390 231" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={id + '-skin'} x1="0" x2="1" y1="0" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#ffdfc7" /><stop offset="1" stopColor="#e89d86" />
      </linearGradient>
      <linearGradient id={id + '-coat'} x2="1" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#9c83ef" /><stop offset="1" stopColor="#524180" />
      </linearGradient>
      <linearGradient id={id + '-paper'} x2="1" y2="1" gradientUnits="objectBoundingBox">
        <stop stopColor="#fff8ef" /><stop offset="1" stopColor="#e5d6fd" />
      </linearGradient>
      <radialGradient id={id + '-spot'}>
        <stop stopColor="#825eab" stopOpacity=".88" /><stop offset="1" stopColor="#37224c" stopOpacity="0" />
      </radialGradient>
      <pattern id={id + '-grid'} width="19" height="19" patternUnits="userSpaceOnUse">
        <path d="M19 0H0V19" fill="none" stroke="#b5a0d6" strokeOpacity=".15" strokeWidth=".7" />
      </pattern>
    </defs>

    <ellipse cx="199" cy="121" rx="161" ry="115" fill={uri('spot')} />
    <rect x="13" y="7" width="364" height="195" rx="17" fill={uri('grid')} />
    <path d="M14 54V21q0-11 11-11h30m280 0h30q11 0 11 11v33" stroke="#a78bc9" strokeOpacity=".27" fill="none" />
    <g className="mentor-console">
      <rect x="38" y="50" width="67" height="54" rx="8" fill="#241934" stroke="#6c578b" />
      <rect x="42" y="54" width="59" height="10" rx="4" fill="#38274d" />
      <circle cx="48" cy="59" r="1.3" fill="#f5a1a0" /><circle cx="54" cy="59" r="1.3" fill="#e9bb79" />
      <path d="m52 75 6 5-6 5m11 1h9" stroke="#95d7c9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M51 93h20m4 0h10" stroke="#a68bca" strokeOpacity=".58" strokeLinecap="round" />
    </g>
    <g transform="translate(303 39)">
      <rect width="44" height="30" rx="7" fill="#372645" stroke="#80669e" />
      <path d="M8 22v-6m7 6V11m7 11V9m7 13V6" stroke="#be9bef" strokeWidth="2.5" strokeLinecap="round" opacity=".75" />
      <circle cx="35" cy="9" r="2" fill="#ffcb91" />
    </g>

    <ellipse cx="200" cy="204" rx="142" ry="15" fill="#1b102b" opacity=".55" />
    <g className="prof-torso" fill={uri('coat')} stroke="#2d1f43" strokeWidth="2.4" strokeLinejoin="round">
      <path d="M161 135c-18 4-29 21-34 47l-6 13h152l-6-19c-7-23-15-36-36-42l-21-5Z" />
      <path d="M169 135 181 174l18-24 18 24 18-38-22-8h-28Z" fill="#f0e5f5" />
      <path d="m183 127 2 19 14 8 14-8 1-19Z" fill={uri('skin')} />
      <path d="m192 155 7-5 8 5-3 8 4 22h-17l4-22Z" fill="#4c3265" strokeWidth="1.7" />
      <path d="m166 138-4 15 12-1-5 11 13 17m51-42 4 15-12-1 5 11-13 17" fill="none" stroke="#c0a7f4" strokeOpacity=".7" strokeWidth="1.5" />
      <path d="M235 172h13" stroke="#e4b782" strokeWidth="2.6" strokeLinecap="round" />
    </g>

    <g className="prof-head">
      <path d="M148 88c-19-8-23 13-8 21l10 1m100-22c19-8 23 13 8 21l-10 1" fill={uri('skin')} stroke="#563148" strokeWidth="2.5" />
      <path d="M144 79c-4-26 14-49 44-53 27-4 56 7 65 28 8 18 2 48-7 64-11 18-28 28-47 28-23 0-39-9-49-29-6-12-7-25-6-38Z" fill={uri('skin')} stroke="#4b2d46" strokeWidth="2.7" />
      <path d="M143 88c-9-14-8-29-2-42-7 0-9-6-6-12 15 1 25-11 44-15 19-5 41 0 54 9 12 0 25 9 27 25 1 11-1 23-9 35l-3-19c-12-4-22-8-28-17-21 15-51 18-68 13l-5 22Z" fill="#252139" stroke="#191628" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M144 45c21-3 38-19 61-16m-44 17c18-4 29-12 43-10m25 1c8 1 14 6 17 11" fill="none" stroke="#77648c" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M141 53c-3 8-3 18 0 24m111-30c3 7 4 15 1 25" fill="none" stroke="#9090aa" strokeWidth="4.6" strokeLinecap="round" />
      <ellipse cx="160" cy="112" rx="9" ry="4" fill="#d97b81" opacity=".46" />
      <ellipse cx="237" cy="112" rx="9" ry="4" fill="#d97b81" opacity=".46" />
      <g className="prof-brows" fill="none" stroke="#39283a" strokeWidth="4.3" strokeLinecap="round">
        <path className="prof-brow-left" d="m159 79q9-5 18-2" /><path className="prof-brow-right" d="m215 77q9-3 18 2" />
      </g>
      <g className="prof-eyes">
        <ellipse cx="171" cy="95" rx="11" ry="9.5" fill="#fff7ef" /><ellipse cx="225" cy="95" rx="11" ry="9.5" fill="#fff7ef" />
        <g className="prof-pupils">
          <ellipse cx="172" cy="95" rx="4.6" ry="5.8" fill="#231e35" /><ellipse cx="225" cy="95" rx="4.6" ry="5.8" fill="#231e35" />
          <circle cx="173.7" cy="93.2" r="1.3" fill="white" /><circle cx="226.7" cy="93.2" r="1.3" fill="white" />
        </g>
      </g>
      <path className="prof-closed-eyes" d="M163 96q7 5 14 0m41 0q7 5 14 0" fill="none" stroke="#493044" strokeWidth="2.3" strokeLinecap="round" />
      <path d="M151 87h9m77 0h13m-64 1q12-7 24 0" fill="none" stroke="#30203c" strokeWidth="2.7" strokeLinecap="round" />
      <rect x="151" y="84" width="39" height="22" rx="8" fill="#e9cfff" fillOpacity=".12" stroke="#352743" strokeWidth="2.7" />
      <rect x="206" y="84" width="39" height="22" rx="8" fill="#e9cfff" fillOpacity=".12" stroke="#352743" strokeWidth="2.7" />
      <path d="m154 94 8-7m47 7 8-7" stroke="#f5eaff" strokeOpacity=".7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M198 98q-5 8-2 12 3 2 7-1" fill="none" stroke="#a75f60" strokeWidth="1.6" strokeLinecap="round" />
      <g fill="none" stroke="#784354" strokeWidth="2.15" strokeLinecap="round">
        <path className="prof-mouth neutral" d="M189 122q9 3 19-1" />
        <path className="prof-mouth reading" d="M191 121q8-3 16 0" />
        <path className="prof-mouth frown" d="M189 124q9-8 18-1m1 1 2 3" />
        <ellipse className="prof-mouth puzzled" cx="199" cy="122" rx="4.3" ry="5.1" fill="#784354" />
        <path className="prof-mouth smile" d="M184 118q15 6 29-1-4 15-15 15-9-1-14-14Z" fill="#72394c" />
        <path className="prof-mouth smile smile-light" d="M188 120q10 4 21 0" stroke="#fff3e7" strokeWidth="2.6" />
      </g>
    </g>

    <path d="M23 193h344q8 0 8 8v13H15v-13q0-8 8-8Z" fill="#4e345e" stroke="#321e41" strokeWidth="2.4" />
    <path d="M22 199h346m-342 10h336" stroke="#a27ab0" strokeOpacity=".39" strokeWidth="1.4" strokeLinecap="round" />
    <g transform="translate(44 174)">
      <path d="M0 12h62v9H0z" fill="#668eac" stroke="#332541" strokeWidth="1.9" />
      <path d="M4 4h48v8H4z" fill="#b58bc6" stroke="#332541" strokeWidth="1.9" />
      <path d="M7 0h45v4H7z" fill="#dbc3fa" stroke="#332541" strokeWidth="1.6" />
      <path d="M8 7h29m-29 9h35" stroke="#efe6f4" strokeOpacity=".7" strokeLinecap="round" />
    </g>
    <g className="prof-mug" transform="translate(302 163)">
      <path d="M20 9h7c7 0 6 10 0 12h-5" fill="none" stroke="#86c7b8" strokeWidth="3" />
      <path d="M1 5h24l-2 24q-1 5-9 5T5 29Z" fill="#529d9d" stroke="#203f50" strokeWidth="2" />
      <ellipse cx="13" cy="5" rx="12" ry="4" fill="#b3ded0" stroke="#24525b" strokeWidth="1.5" />
      <path d="m15 12-5 6h4l-3 7 8-9h-5Z" fill="#dbf7d7" />
      <path className="mentor-steam" d="M12-1q-6-5 0-10 4-5 0-8" fill="none" stroke="#f4d6fb" strokeOpacity=".7" strokeWidth="1.8" strokeLinecap="round" />
    </g>

    <g className="prof-forearm prof-left">
      <path d="M147 167q10 7 13 14l25 2 1 17-32 1q-15-6-15-20Z" fill={uri('coat')} stroke="#342344" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="M174 185q2 7 1 13" fill="none" stroke="#e1cfff" strokeWidth="2.1" />
      <path d="M181 186q8-7 15 0l5 3q3 9-10 10l-7-2Z" fill={uri('skin')} stroke="#63394e" strokeWidth="1.7" />
    </g>
    <g className="prof-forearm prof-right">
      <path d="M252 166q-8 6-13 15l-27 2 1 17 36 1q13-9 13-20Z" fill={uri('coat')} stroke="#342344" strokeWidth="2.3" strokeLinejoin="round" />
      <path d="m224 184 1 14" stroke="#e6d4fb" strokeWidth="2.1" />
      <path d="M218 186q-8-8-16-1l-5 4q-3 9 10 10l8-2Z" fill={uri('skin')} stroke="#63394e" strokeWidth="1.7" />
    </g>
    <g className="prof-sheet">
      <path d="M168 139h49l13 12v44h-62Z" fill={uri('paper')} stroke="#756098" strokeWidth="1.65" strokeLinejoin="round" />
      <path d="M217 140v12h12" fill="#c8b5e5" stroke="#8f74ac" strokeWidth="1.2" strokeLinejoin="round" />
      <rect x="174" y="145" width="23" height="7" rx="2" fill="#8155aa" />
      <text x="177" y="150" fill="#fff7ff" fontFamily="monospace" fontWeight="700" fontSize="4.9">PYTHON</text>
      {reference.map((line, index) => <text key={index} x="174" y={160 + index * 7.2} fill={index % 2 ? '#487e83' : '#633f83'} fontFamily="monospace" fontSize="5.5">
        {line.slice(0, 15)}
      </text>)}
      <path d="M173 189h36" stroke="#bca8d6" strokeWidth=".75" />
    </g>
    <path className="prof-sheet-glint" d="M152 139v-9m-5 4h10m95 25v-9m-4 4h8" fill="none" stroke="#f9d599" strokeWidth="1.9" strokeLinecap="round" />
    <g className="prof-thumbs">
      <path d="M248 182q-5-9 1-15l20-15 9 13-16 18q-7 5-14-1Z" fill={uri('coat')} stroke="#352246" strokeWidth="2.5" />
      <path d="M263 153q-4-6 1-11l6-3 1-13q1-8 6-7 5 0 5 6l-1 10 9-1q9 0 7 7l-4 14q-1 6-8 7l-12 1Z" fill={uri('skin')} stroke="#63364f" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="m288 141 8-2m-9 8 8-1m-9 7 7-1" stroke="#a56268" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m299 122 6-7m-2 12 9-1m-20-9 2-8" fill="none" stroke="#ffe0a1" strokeWidth="2.6" strokeLinecap="round" />
    </g>
    <g className="prof-crumple">
      <svg x="190" y="128" width="32" height="32"><PaperBall /></svg>
    </g>
    {phase === 'sleeping' && <g className="prof-zzz" fill="#d1b4ef" fontFamily="monospace" fontWeight="700">
      <text x="254" y="63" fontSize="13">z</text><text x="270" y="49" fontSize="17">z</text><text x="290" y="32" fontSize="22">z</text>
    </g>}
  </svg>;
}

export function CodeMentor({ state }) {
  const { phase, status, lines, animated, sceneAnimated, reduced, toggle } = state;
  const [label, defaultMessage] = messages[phase] || messages.idle;
  const message = status === 'time_limit' ? 'Код задумался надолго. Попробуй упростить решение.' : defaultMessage;
  const controlLabel = reduced ? 'Ҳаракат дар танзимоти дастгоҳ маҳдуд аст' : 'Аниматсияи омӯзгор';
  return <aside className="mentor-card" data-mentor-state={phase} data-motion={sceneAnimated ? 'on' : 'off'} aria-label="Устод Пайтон">
    <div className="mentor-header">
      <span className="mentor-mark"><Sparkles size={18} /></span>
      <div className="mentor-title"><h2>Устод Пайтон</h2><span>Ёвари шумо ҳангоми санҷиш</span></div>
      <button className="mentor-toggle" type="button" disabled={reduced} aria-label={controlLabel} title={controlLabel} aria-pressed={animated} onClick={toggle}>
        {animated ? <Pause size={15} /> : <Play size={15} />}
        <span>{animated ? 'Ҳаракат фаъол' : 'Бе ҳаракат'}</span>
      </button>
    </div>
    <div className="mentor-scene">
      <Studio lines={lines} phase={phase} />
      {sceneAnimated && phase === 'success' && <div className="mentor-confetti" key={state.attempt} aria-hidden="true">
        {confetti.map(([x, y, angle, color], index) => <i key={index} style={{
          '--x': x + 'px', '--y': y + 'px', '--spin': angle + 'deg', '--color': color, '--wait': (index % 5) * 27 + 'ms',
        }} />)}
      </div>}
    </div>
    <div className="mentor-caption">
      <div className="mentor-status"><AudioLines size={15} aria-hidden="true" /> {label}</div>
      <p lang="ru">{message}</p>
    </div>
  </aside>;
}

function GlassCracks() {
  return <svg className="mentor-glass" viewBox="0 0 360 280" aria-hidden="true" focusable="false">
    <circle className="mentor-shock-ring" cx="180" cy="140" r="46" />
    <g className="mentor-cracks" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path pathLength="1" d="m180 140-26-23-10-30-29-12-22-48m87 113 21-31 30-11 10-29 31-14 19-34m-111 119 30 6 37 23 28-3 44 21m-139-47 6 31-17 34 9 24-8 37m10-126-34 12-22 28-26 1-31 24m113-65-8-39 14-25-7-28" />
      <path pathLength="1" d="m154 117-32 3-23-23-35 1-33-16m113 5 30-12 26 8 31 15m10-29 28 9 30-11 31 7m-120 72 22-28 24 1 29-22m-38 72 4 25 26 20 11 42m-119-51 26 3 20-14 36 0m-105-42-4 36-18 22-8 34m3-124-32 15-25-15-38 7m167 44 33 16 11 24 25 11" />
      <path pathLength="1" d="m180 140-12-6 9-12 16 3 5 15-11 10-15 1-4-17m-11-6-12 14 12 16 17 10 19-1 17-13 5-16-11-18-18-10-18 1-11 17" />
    </g>
  </svg>;
}

export function MentorImpact({ state, frameRef }) {
  const [points, setPoints] = useState(null);
  const throwing = state.sceneAnimated && state.phase === 'wrong_answer';

  useLayoutEffect(() => {
    if (!throwing) return;
    const frame = frameRef.current;
    const scene = frame?.querySelector('.mentor-scene svg');
    const editor = frame?.querySelector('.editor-panel');
    if (!frame || !scene || !editor) return;
    const stage = frame.getBoundingClientRect();
    const source = scene.getBoundingClientRect();
    const target = editor.getBoundingClientRect();
    setPoints({
      '--launch-x': Math.round(source.left + source.width * .66 - stage.left) + 'px',
      '--launch-y': Math.round(source.top + source.height * .57 - stage.top) + 'px',
      '--hit-x': Math.round(target.left + target.width * .63 - stage.left) + 'px',
      '--hit-y': Math.round(target.top + target.height * .48 - stage.top) + 'px',
    });
  }, [throwing, state.attempt, frameRef]);

  if (!throwing || !points) return null;
  return <div className="mentor-impact" style={points} key={state.attempt} aria-hidden="true">
    <div className="mentor-flying-paper"><PaperBall /></div>
    <div className="mentor-collision"><GlassCracks /></div>
  </div>;
}
