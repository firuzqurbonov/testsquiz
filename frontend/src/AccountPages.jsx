import { useState } from 'react';
import {
  BarChart3, BookOpen, Check, ClipboardList, CodeXml,
  Layers3, ListChecks, LogOut, Pencil, Plus, Save, ShieldCheck, Terminal, Trash2, Trophy, UserRound, Users,
} from 'lucide-react';
import { api } from './api';
import { verdicts } from './content';
import { Dialog, Gate, Notice, RequestState, Verdict, useRequest } from './ui';

export function HistoryPage({ session, revision, onSignIn, admin }) {
  const request = useRequest('/api/submissions/', Boolean(session), revision);
  const [status, setStatus] = useState('');
  if (!session) return <Gate onSignIn={onSignIn} />;

  return <section className="page">
    <div className="page-banner">
      <span className="tile-icon lilac"><ListChecks size={25} /></span>
      <div><h1>{admin ? 'Ҳамаи ҳалҳо' : 'Ҳалҳои ман'}</h1><p>Натиҷаи ҳар кӯшишро дар ин ҷо бинед.</p></div>
    </div>
    <RequestState request={request}>{(data) => {
      const attempts = [...data].sort((left, right) => right.id - left.id);
      const rows = status ? attempts.filter((row) => row.status === status) : attempts;
      return <>
        <div className="section-heading">
          <div><h2>Таърихи кӯшишҳо</h2><p>{attempts.length} кӯшиш</p></div>
          <label className="select-box"><select aria-label="Филтр аз рӯи натиҷа" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">Ҳамаи натиҷаҳо</option>
            {Object.entries(verdicts).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
          </select></label>
        </div>
        {rows.length ? <div className="attempt-list">{rows.map((row) =>
          <details className="attempt" key={row.id}>
            <summary><span className="tile-icon lilac"><Terminal size={19} /></span>
              <span><strong>Масъалаи №{row.task_id}</strong><small>Кӯшиши №{row.id}{admin && row.user?.username ? ' · ' + row.user.username : ''}</small></span>
              <Verdict value={row.status} />
            </summary>
            <div className="attempt-content"><pre><code>{row.code}</code></pre>
              <a className="button button-light" href={'#task/' + row.task_id}><CodeXml size={17} /> Кушодани масъала</a>
            </div>
          </details>)}</div> : <Notice icon={ClipboardList} title="Ҳал ёфт нашуд" text="Кӯшишҳои фиристодаи шумо дар ҳамин ҷо пайдо мешаванд.">
          <a className="button button-light" href="#courses">Дидани курсҳо</a>
        </Notice>}
      </>;
    }}</RequestState>
  </section>;
}

function ProfileForm({ profile, onLogout }) {
  const [bio, setBio] = useState(profile.bio || '');
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function save(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    setSaved(false);
    try {
      const next = await api('/account/profile/', { method: 'PATCH', body: { bio } });
      setBio(next.bio);
      setSaved(true);
    } catch (problem) {
      setError(problem.message);
    } finally {
      setPending(false);
    }
  }

  return <form className="paper profile-form" onSubmit={save}>
    <label className="form-label">Номи корбар<input value={profile.username} readOnly /></label>
    <label className="form-label">Дар бораи ман<textarea rows={5} placeholder="Чанд калима дар бораи худ…" value={bio} onChange={(event) => { setBio(event.target.value); setSaved(false); }} /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {saved && <p className="solved-message" role="status"><Check size={17} /> Тағйирот сабт шуд.</p>}
    <div className="form-actions">
      <button className="button button-primary" disabled={pending}><Save size={17} /> {pending ? 'Сабт шуда истодааст…' : 'Сабт кардан'}</button>
      <button type="button" className="button button-light" onClick={onLogout}><LogOut size={17} /> Баромадан</button>
    </div>
  </form>;
}

export function ProfilePage({ session, onSignIn, onLogout }) {
  const request = useRequest('/account/profile/', Boolean(session));
  if (!session) return <Gate onSignIn={onSignIn} />;
  return <section className="page">
    <div className="page-banner"><span className="tile-icon lilac"><UserRound size={25} /></span>
      <div><h1>Ҳисоби ман</h1><p>Маълумоти худро бинед ё нав кунед.</p></div>
    </div>
    <RequestState request={request}>{(profile) => <ProfileForm profile={profile} onLogout={onLogout} />}</RequestState>
  </section>;
}

const resources = {
  courses: { label: 'Курсҳо', icon: BookOpen, fields: [
    { name: 'title', label: 'Ном', required: true }, { name: 'description', label: 'Тавсиф', kind: 'text' },
  ] },
  modules: { label: 'Модулҳо', icon: Layers3, fields: [
    { name: 'title', label: 'Ном', required: true }, { name: 'course', label: 'ID-и курс', kind: 'number', required: true },
  ] },
  tasks: { label: 'Масъалаҳо', icon: CodeXml, fields: [
    { name: 'title', label: 'Ном', required: true }, { name: 'module', label: 'ID-и модул', kind: 'number', required: true }, { name: 'description', label: 'Шарти масъала', kind: 'text', required: true },
  ] },
  'test-cases': { label: 'Санҷишҳо', icon: ClipboardList, fields: [
    { name: 'task', label: 'ID-и масъала', kind: 'number', required: true }, { name: 'input_data', label: 'Воридот', kind: 'text' },
    { name: 'expected_output', label: 'Барориши интизорӣ', kind: 'text' },
  ] },
};

function ResourceForm({ resource, row, onClose, onSaved }) {
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const { fields, label } = resources[resource];

  async function save(event) {
    event.preventDefault();
    setPending(true);
    setError('');
    const values = new FormData(event.currentTarget);
    const body = Object.fromEntries(fields.map(({ name, kind }) => [name, kind === 'number' ? Number(values.get(name)) : values.get(name)]));
    try {
      await api('/api/' + resource + '/' + (row ? row.id + '/' : ''), { method: row ? 'PATCH' : 'POST', body });
      onSaved();
    } catch (problem) {
      setError(problem.message);
    } finally {
      setPending(false);
    }
  }

  return <Dialog label={label} onClose={onClose}>
    <h2>{row ? 'Тағйир додан' : 'Илова кардан'}</h2><p>{label}{row ? ' · №' + row.id : ''}</p>
    <form onSubmit={save}>
      {fields.map(({ name, label: fieldLabel, required, kind }) => <label className="form-label" key={name}>{fieldLabel}
        {kind === 'text' ? <textarea name={name} rows={3} required={required} defaultValue={row?.[name] ?? ''} /> :
          <input name={name} type={kind === 'number' ? 'number' : 'text'} min={kind === 'number' ? 1 : undefined} required={required} defaultValue={row?.[name] ?? ''} />}
      </label>)}
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary full-button" disabled={pending}><Save size={17} /> {pending ? 'Сабт шуда истодааст…' : 'Сабт кардан'}</button>
    </form>
  </Dialog>;
}

function Manager({ onChange }) {
  const [resource, setResource] = useState('courses');
  const [page, setPage] = useState(1);
  const [edit, setEdit] = useState(null);
  const [remove, setRemove] = useState(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const request = useRequest('/api/' + resource + '/?page=' + page);

  function saved() {
    setEdit(null);
    setRemove(null);
    request.reload();
    onChange();
  }

  async function deleteRow() {
    setError('');
    setPending(true);
    try {
      await api('/api/' + resource + '/' + remove.id + '/', { method: 'DELETE' });
      if (page > 1 && request.data?.results?.length === 1) setPage(page - 1);
      saved();
    } catch (problem) {
      setError(problem.message);
    } finally {
      setPending(false);
    }
  }

  return <section className="admin-manager">
    <div className="section-heading"><div><h2>Идоракунии мундариҷа</h2></div>
      <button className="button button-primary" onClick={() => setEdit({ new: true })}><Plus size={18} /> Илова кардан</button>
    </div>
    <div className="resource-tabs" aria-label="Навъи мундариҷа">
      {Object.entries(resources).map(([key, { label, icon: Icon }]) => <button key={key}
        className={resource === key ? 'active' : ''} onClick={() => { setResource(key); setPage(1); }}>
        <Icon size={17} /> {label}
      </button>)}
    </div>
    <RequestState request={request}>{(data) => {
      const rows = data.results || data;
      return <>
        {rows.length ? <div className="manage-list">{rows.map((row) => <div key={row.id} className="manage-row">
          <span><strong>{row.title || 'Санҷиш барои масъалаи №' + row.task}</strong><small>ID: {row.id}</small></span>
          <button className="icon-button" onClick={() => setEdit({ row })} aria-label={'Тағйир додани №' + row.id}><Pencil size={18} /></button>
          <button className="icon-button danger-icon" onClick={() => { setError(''); setRemove(row); }} aria-label={'Нест кардани №' + row.id}><Trash2 size={18} /></button>
        </div>)}</div> : <Notice title="Ҳоло сабте нест" />}
        {(data.previous || data.next) && <div className="pagination">
          <button className="button button-light" disabled={!data.previous} onClick={() => setPage(page - 1)}>Қаблӣ</button>
          <span>Саҳифаи {page}</span>
          <button className="button button-light" disabled={!data.next} onClick={() => setPage(page + 1)}>Баъдӣ</button>
        </div>}
      </>;
    }}</RequestState>
    {edit && <ResourceForm resource={resource} row={edit.row} onClose={() => setEdit(null)} onSaved={saved} />}
    {remove && <Dialog label="Нест кардани сабт" onClose={() => setRemove(null)}>
      <h2>Сабт нест карда шавад?</h2><p>Сабти №{remove.id} ва маълумоти ба он вобаста метавонанд нест шаванд.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="form-actions">
        <button className="button button-light" onClick={() => setRemove(null)}>Бекор кардан</button>
        <button className="button button-danger" disabled={pending} onClick={deleteRow}><Trash2 size={17} /> Нест кардан</button>
      </div>
    </Dialog>}
  </section>;
}

function Ranking({ title, items, name, value, icon: Icon }) {
  return <article className="paper ranking">
    <h3><Icon size={19} /> {title}</h3>
    {items.length ? <ol>{items.map((item) => <li key={item.id}><span>{item[name]}</span><strong>{item[value]}</strong></li>)}</ol> : <p>Ҳоло маълумот нест.</p>}
  </article>;
}

export function AdminPage({ session, request, onSignIn, onChange }) {
  if (!session) return <Gate onSignIn={onSignIn} />;
  return <section className="page">
    <div className="page-banner"><span className="tile-icon lilac"><ShieldCheck size={25} /></span>
      <div><h1>Идоракунӣ</h1><p>Омор ва мундариҷаи платформа.</p></div>
      <a className="button button-light" href="/swagger/" target="_blank" rel="noreferrer">Swagger</a>
    </div>
    <RequestState request={request}>{(stats) => <>
      <div className="summary admin-summary">
        {[
          ['Корбарон', stats.overall.users, Users, 'lilac'],
          ['Ҳалҳои фиристода', stats.overall.submissions, BarChart3, 'peach'],
          ['Ҳалҳои қабулшуда', stats.overall.accepted, Trophy, 'mint'],
        ].map(([label, value, Icon, tone]) => <div className="summary-item" key={label}>
          <span className={'tile-icon ' + tone}><Icon size={22} /></span><div><strong>{value}</strong><span>{label}</span></div>
        </div>)}
      </div>
      <div className="rankings">
        <Ranking title="Корбарони пешсаф" items={stats.top_users} name="username" value="accepted_count" icon={Users} />
        <Ranking title="Курсҳои маъмул" items={stats.popular_courses} name="title" value="submissions_count" icon={BookOpen} />
        <Ranking title="Масъалаҳои душвор" items={stats.hardest_tasks} name="title" value="failed_count" icon={CodeXml} />
      </div>
      <Manager onChange={onChange} />
    </>}</RequestState>
  </section>;
}
