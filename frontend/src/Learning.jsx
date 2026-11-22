import { useEffect, useRef, useState } from 'react';
import {
  BookOpen, Check, ChevronDown, CirclePlay, CodeXml,
  Layers3, LibraryBig, ListChecks, Search, Send, Terminal, Trophy,
} from 'lucide-react';
import { api } from './api';
import { demoCourses, verdicts } from './content';
import { CinematicJudge } from './judge/CinematicJudge';
import { useCinematicJudge } from './judge/useCinematicJudge';
import { Gate, Notice, RequestState, Verdict, useRequest } from './ui';

const artwork = import.meta.env.BASE_URL + 'hero.png';
const courseIcons = [CodeXml, Layers3, BookOpen];
const colors = ['lilac', 'peach', 'mint'];
const sortNames = ['id', 'title', '-title'];
const sortLabels = ['Бо тартиби илова', 'Ном: А–Я', 'Ном: Я–А'];

export function Hero({ onGuide }) {
  return <section className="hero" aria-labelledby="hero-title">
    <div className="hero-art" aria-hidden="true"><img src={artwork} alt="" fetchPriority="high" /></div>
    <div className="hero-content">
      <span className="hero-kicker"><span /> ПЛАТФОРМАИ ОМӮЗИШИ PYTHON</span>
      <h1 id="hero-title">Роҳ ба сӯи <span>маърифат</span></h1>
      <p>Барномасозиро қадам ба қадам омӯзед, масъалаҳоро ҳал кунед ва натиҷаатонро дарҳол бинед.</p>
      <div className="hero-actions">
        <a href="#courses" className="button button-hero"><BookOpen size={19} /> Дидани курсҳо</a>
        <button className="button button-ghost" onClick={onGuide}><CirclePlay size={19} /> Тарзи кор</button>
      </div>
    </div>
  </section>;
}

function Summary({ session, courseData, revision }) {
  const taskData = useRequest('/api/tasks/', Boolean(session), revision);
  const attempts = useRequest('/api/submissions/', Boolean(session), revision);
  const rows = Array.isArray(attempts.data) ? attempts.data : [];
  const accepted = new Set(rows.filter((row) => row.status === 'accepted' && row.user?.username === session?.username).map((row) => row.task_id));
  const metrics = session ? [
    { icon: LibraryBig, label: 'Курсҳои дастрас', value: courseData?.count ?? '—', tone: 'lilac' },
    { icon: Terminal, label: 'Масъалаҳо', value: taskData.data?.count ?? '—', tone: 'peach' },
    { icon: Trophy, label: 'Масъалаҳои ҳалшудаи ман', value: attempts.data ? accepted.size : '—', tone: 'mint' },
  ] : [
    { icon: LibraryBig, label: 'Курсҳои амалӣ', detail: 'Бо модулҳои пайдарпай', tone: 'lilac' },
    { icon: Terminal, label: 'Машқҳои Python', detail: 'Бо санҷиши худкор', tone: 'peach' },
    { icon: Trophy, label: 'Пешрафти шахсӣ', detail: 'Бо таърихи ҳалҳо', tone: 'mint' },
  ];

  return <div className="summary" aria-label="Имкониятҳои омӯзиш">
    {metrics.map(({ icon: Icon, label, value, detail, tone }) =>
      <div className="summary-item" key={label}>
        <span className={'tile-icon ' + tone}><Icon size={22} /></span>
        <div>{value !== undefined ? <><strong>{value}</strong><span>{label}</span></> : <><strong className="summary-label">{label}</strong><span>{detail}</span></>}</div>
      </div>
    )}
  </div>;
}

function CourseCard({ course, index, preview }) {
  const tone = colors[index % colors.length];
  const Icon = courseIcons[index % courseIcons.length];
  const modules = course.modules || [];
  const tasks = modules.reduce((total, module) => total + (module.tasks?.length || 0), 0);
  return <a href={'#' + (preview ? 'preview' : 'course') + '/' + course.id} className={'course-card card-' + tone}>
    <div className="course-cover" aria-hidden="true">
      <span className="cover-symbol"><Icon size={34} strokeWidth={1.65} /></span>
      <span className="cover-shape first" />
      <span className="cover-shape second" />
    </div>
    <div className="course-card-content">
      <h3>{course.title}</h3>
      <p>{course.description || 'Барои дидани модулҳо курсро кушоед.'}</p>
      <div className="course-meta">
        <span><Layers3 size={15} /> {modules.length} модул</span>
        <span><CodeXml size={15} /> {tasks} масъала</span>
      </div>
    </div>
  </a>;
}

export function Catalog({ session, revision, onGuide, onSignIn }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('id');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => { setQuery(search.trim()); setPage(1); }, 220);
    return () => clearTimeout(timer);
  }, [search]);

  const params = new URLSearchParams({ search: query, ordering: sort, page: String(page) });
  const catalog = useRequest('/api/courses/?' + params, Boolean(session), revision);
  const totals = useRequest('/api/courses/?page=1', Boolean(session), revision);
  const demo = demoCourses.filter((course) => course.title.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  if (sort !== 'id') demo.sort((left, right) => (sort === 'title' ? 1 : -1) * left.title.localeCompare(right.title));

  function renderCards(items, preview) {
    if (!items.length) return <Notice icon={Search} title={query ? 'Курсе ёфт нашуд' : 'Ҳоло курсе илова нашудааст'}
      text={query ? 'Номи дигареро ҷустуҷӯ кунед.' : 'Курсҳои дастрас дар ҳамин ҷо пайдо мешаванд.'} />;
    return <div className="course-grid">{items.map((course, index) => <CourseCard key={course.id} course={course} index={index} preview={preview} />)}</div>;
  }

  return <>
    <Hero onGuide={onGuide} />
    <Summary session={session} courseData={totals.data} revision={revision} />
    <section id="courses" className="catalog" aria-labelledby="courses-title">
      <div className="section-heading">
        <div>
          <div className="heading-line">
            <h2 id="courses-title">Курсҳо</h2>
            {!session && <span className="preview-label">Намуна</span>}
          </div>
          <p>{session ? 'Курсро интихоб кунед ва ба машқ оғоз намоед.' : 'Бо намунаҳо шинос шавед ё барои дидани курсҳо ворид шавед.'}</p>
        </div>
        <div className="catalog-controls">
          <label className="search-box"><Search size={19} aria-hidden="true" />
            <input type="search" aria-label="Ҷустуҷӯи курс" placeholder="Ҷустуҷӯи курс..." value={search} onChange={(event) => setSearch(event.target.value)} />
          </label>
          <label className="select-box">
            <select aria-label="Тартиби курсҳо" value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
              {sortNames.map((value, index) => <option key={value} value={value}>{sortLabels[index]}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </label>
        </div>
      </div>
      {session ? <RequestState request={catalog}>{(data) => <>
        {renderCards(data.results || [], false)}
        {(data.previous || data.next) && <div className="pagination" aria-label="Саҳифаҳои курсҳо">
          <button className="button button-light" disabled={!data.previous} onClick={() => setPage(page - 1)}>Қаблӣ</button>
          <span>Саҳифаи {page}</span>
          <button className="button button-light" disabled={!data.next} onClick={() => setPage(page + 1)}>Баъдӣ</button>
        </div>}
      </>}</RequestState> : <>
        {renderCards(demo, true)}
        <div className="catalog-signin"><span>Барои идомаи омӯзиш ба ҳисоби худ ворид шавед.</span><button className="button button-light" onClick={onSignIn}>Ворид шудан</button></div>
      </>}
    </section>
  </>;
}

function CourseBody({ course, preview, onSignIn }) {
  const modules = course.modules || [];
  return <section className="page course-page">
    <a href="#courses" className="back-link"><LibraryBig size={17} /> Курсҳо</a>
    <div className="page-banner">
      <span className="tile-icon lilac"><BookOpen size={25} /></span>
      <div><h1>{course.title}</h1><p>{course.description || 'Модулҳои курсро омӯзед.'}</p></div>
      {preview && <span className="preview-label">Намуна</span>}
    </div>
    <div className="section-heading"><div><h2>Модулҳои курс</h2><p>Модулро кушоед ва масъала интихоб кунед.</p></div></div>
    {modules.length ? <div className="module-list">{modules.map((module, index) =>
      <details className="module" key={module.id} open={index === 0 ? true : undefined}>
        <summary>
          <span className="module-icon"><Layers3 size={21} /></span>
          <span><strong>{module.title}</strong><small>{module.tasks?.length || 0} масъала</small></span>
          <ChevronDown className="module-chevron" size={19} />
        </summary>
        <div className="module-tasks">
          {module.tasks?.length ? module.tasks.map((task) => preview
            ? <button type="button" className="task-row" key={task.id} onClick={onSignIn}><CodeXml size={18} /><span>{task.title}</span></button>
            : <a className="task-row" key={task.id} href={'#task/' + task.id + '/' + course.id}><CodeXml size={18} /><span>{task.title}</span>
              {task.is_solved_by_me && <Check size={19} className="solved-icon" aria-label="Ҳал шуд" />}
            </a>)
            : <p className="empty-inline">Ба ин модул масъала илова нашудааст.</p>}
        </div>
      </details>)}</div> : <Notice icon={Layers3} title="Ҳоло модуле нест" text="Модулҳои нав дар ҳамин ҷо намоиш дода мешаванд." />}
    {preview && <div className="catalog-signin"><span>Ин курс намунавӣ аст. Барои дидани курсҳои дастрас ворид шавед.</span><button className="button button-primary" onClick={onSignIn}>Ворид шудан</button></div>}
  </section>;
}

export function CoursePage({ id, session, preview = false, onSignIn, revision }) {
  const request = useRequest('/api/courses/' + id + '/', Boolean(session && !preview), revision);
  if (preview) {
    const course = demoCourses.find((item) => item.id === id);
    return course ? <CourseBody course={course} preview onSignIn={onSignIn} /> : <Notice title="Курс ёфт нашуд" />;
  }
  if (!session) return <Gate onSignIn={onSignIn} />;
  return <RequestState request={request}>{(course) => <CourseBody course={course} />}</RequestState>;
}

function Editor({ task, route, session, onSubmission }) {
  const key = 'marifat.draft.' + session.username + '.' + task.id;
  const [code, setCode] = useState(() => sessionStorage.getItem(key) ?? '# Ҳалли худро дар ин ҷо нависед\n');
  const [result, setResult] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [solved, setSolved] = useState(task.is_solved_by_me);
  const inFlight = useRef(false);
  const judge = useCinematicJudge(session.username + '.' + task.id);
  const lines = code.split('\n').length;

  function changeCode(value) {
    setCode(value);
    sessionStorage.setItem(key, value);
    judge.typing();
  }

  function indent(event) {
    if (event.key !== 'Tab' || event.shiftKey) return;
    event.preventDefault();
    const input = event.currentTarget;
    const { selectionStart: start, selectionEnd: end } = input;
    changeCode(code.slice(0, start) + '    ' + code.slice(end));
    requestAnimationFrame(() => input.setSelectionRange(start + 4, start + 4));
  }

  async function submit(event) {
    event.preventDefault();
    if (inFlight.current || !code.trim()) return;
    inFlight.current = true;
    setPending(true);
    setError('');
    setResult(null);
    const attempt = judge.begin();
    try {
      const answer = await api('/api/submissions/', { method: 'POST', body: { task_id: task.id, code } });
      setResult(answer);
      if (answer.status === 'accepted') setSolved(true);
      judge.finish(attempt, answer.status);
      onSubmission();
    } catch (problem) {
      setError(problem.message);
      judge.fail(attempt);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
  }

  const verdict = result && verdicts[result.status];
  return <section className="page">
    <a href={route.source ? '#course/' + route.source : '#courses'} className="back-link"><BookOpen size={17} /> {route.source ? 'Ба курс' : 'Курсҳо'}</a>
    <div className="page-banner task-banner">
      <span className="tile-icon lilac"><CodeXml size={25} /></span>
      <div><h1>{task.title}</h1><p>Масъалаи №{task.id}</p></div>
      {solved && <Verdict value="accepted" />}
    </div>
    <div className="task-workspace-frame">
      <div className="workspace">
        <div className="problem-column">
          <article className="paper problem">
            <h2><BookOpen size={21} /> Шарти масъала</h2>
            <p className="problem-description">{task.description}</p>
            {solved && <p className="solved-message"><Check size={17} /> Шумо ин масъаларо ҳал кардаед.</p>}
          </article>
          <CinematicJudge controller={judge} />
        </div>
        <div className="editor-column">
          <form className="editor-panel" onSubmit={submit}>
            <div className="editor-heading"><span><Terminal size={18} /> Муҳаррири код</span><span className="language">Python</span></div>
            <div className="editor-body">
              <div className="line-numbers" aria-hidden="true">
                {Array.from({ length: Math.min(lines, 80) }, (_, index) => <span key={index}>{index + 1}</span>)}
              </div>
              <textarea aria-label="Коди Python" maxLength={20000} value={code} spellCheck={false} onChange={(event) => changeCode(event.target.value)} onKeyDown={indent}
                onScroll={(event) => { event.currentTarget.previousElementSibling.scrollTop = event.currentTarget.scrollTop; }} />
            </div>
            <div className="editor-footer"><span>{lines} сатр</span><button className="button button-hero" disabled={pending || !code.trim()}><Send size={17} /> {pending ? 'Санҷида истодааст…' : 'Ирсоли ҳал'}</button></div>
          </form>
          {(result || error) && <article className="paper result-panel" role={error ? 'alert' : 'status'}>
            <h2><ListChecks size={21} /> Натиҷаи санҷиш</h2>
            {result && <Verdict value={result.status} />}
            {verdict && <p>{verdict.detail}</p>}
            {error && <p className="form-error">{error}</p>}
          </article>}
        </div>
      </div>
    </div>
  </section>;
}

export function TaskPage({ route, session, onSignIn, onSubmission }) {
  const request = useRequest('/api/tasks/' + route.id + '/', Boolean(session));
  if (!session) return <Gate onSignIn={onSignIn} />;
  return <RequestState request={request}>{(task) => <Editor key={task.id} task={task} route={route} session={session} onSubmission={onSubmission} />}</RequestState>;
}
