import { useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, Check, CodeXml, LibraryBig, ListChecks, LoaderCircle, LogIn, Sparkles, X } from 'lucide-react';
import { api, signIn } from './api';
import { guide, verdicts } from './content';

export function useRequest(path, enabled = true, revision = 0, load = api) {
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState({});
  const key = enabled && path ? [path, revision, retry].join('|') : null;

  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    load(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, path, data });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ key, path, error });
      });
    return () => controller.abort();
  }, [key, path, load]);

  const priorData = key && state.path === path ? state.data : undefined;
  return {
    data: priorData,
    error: key && state.key === key ? state.error : undefined,
    busy: Boolean(key && state.key !== key && priorData === undefined),
    reload: () => setRetry((attempt) => attempt + 1),
  };
}

export function Notice({ icon: Icon = AlertCircle, title, text, children, busy = false }) {
  return <div className="notice" role={busy ? 'status' : undefined}>
    <span className="notice-icon">{busy ? <LoaderCircle className="spin" size={23} /> : <Icon size={24} />}</span>
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {children}
  </div>;
}

export function RequestState({ request, children }) {
  if (request.busy) return <Notice busy title="Бор шуда истодааст…" />;
  if (request.error) return <Notice title="Маълумот дастрас нест" text={request.error.message}>
    <button className="button button-light" onClick={request.reload}>Дубора кӯшиш кардан</button>
  </Notice>;
  return request.data !== undefined ? children(request.data) : null;
}

export function Gate({ onSignIn }) {
  return <Notice icon={LogIn} title="Ба ҳисоби худ ворид шавед" text="Бо ҳисоби худ метавонед курсҳоро омӯзед, ҳал фиристед ва пешрафтатонро бинед.">
    <button className="button button-primary" onClick={onSignIn}><LogIn size={17} /> Ворид шудан</button>
  </Notice>;
}

export function Verdict({ value }) {
  const verdict = verdicts[value] || { label: value || 'Номаълум', tone: 'neutral' };
  return <span className={'verdict verdict-' + verdict.tone}>
    {value === 'accepted' ? <Check size={15} /> : <span className="verdict-dot" />}
    {verdict.label}
  </span>;
}

export function Dialog({ label, onClose, children }) {
  const dialog = useRef(null);

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      previous?.focus();
    };
  }, []);

  return <dialog ref={dialog} className="dialog" aria-label={label}
    onCancel={(event) => { event.preventDefault(); onClose(); }}
    onClick={(event) => { if (event.target === dialog.current) onClose(); }}>
    <div className="dialog-content">
      <button className="icon-button dialog-close" onClick={onClose} aria-label="Пӯшидан"><X size={21} /></button>
      {children}
    </div>
  </dialog>;
}

export function AuthDialog({ onClose }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function submit(event) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    setError('');
    setPending(true);
    try {
      await signIn({ username: values.get('username').trim(), password: values.get('password') }, register);
      onClose();
    } catch (problem) {
      setError(problem.message || 'Дубора кӯшиш кунед.');
    } finally {
      setPending(false);
    }
  }

  return <Dialog label="Вуруд ба ҳисоб" onClose={onClose}>
    <span className="dialog-mark"><BookOpen size={25} /></span>
    <h2>{register ? 'Ҳисоб созед' : 'Хуш омадед!'}</h2>
    <p>{register ? 'Барои оғоз номи корбар ва рамз интихоб кунед.' : 'Ба ҳисоби худ ворид шавед ва омӯзишро идома диҳед.'}</p>
    <div className="auth-tabs">
      <button type="button" className={!register ? 'selected' : ''} onClick={() => { setRegister(false); setError(''); }}>Вуруд</button>
      <button type="button" className={register ? 'selected' : ''} onClick={() => { setRegister(true); setError(''); }}>Сабти ном</button>
    </div>
    <form onSubmit={submit}>
      <label className="form-label">Номи корбар
        <input name="username" autoComplete="username" autoFocus maxLength={150} required placeholder="Номи корбар" />
      </label>
      <label className="form-label">Рамз
        <input name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required placeholder="Рамзро ворид кунед" />
      </label>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button button-primary full-button" disabled={pending}>
        {pending ? <LoaderCircle className="spin" size={17} /> : <LogIn size={17} />}
        {register ? 'Сабти ном' : 'Ворид шудан'}
      </button>
    </form>
  </Dialog>;
}

export function GuideDialog({ onClose }) {
  const icons = [LibraryBig, CodeXml, ListChecks];
  return <Dialog label="Тарзи кор" onClose={onClose}>
    <span className="dialog-mark"><Sparkles size={24} /></span>
    <h2>Чӣ тавр кор мекунад?</h2>
    <ol className="guide-list">
      {guide.map((item, index) => {
        const Icon = icons[index];
        return <li key={item.title}><span className="guide-icon"><Icon size={19} /></span>
          <div><strong>{item.title}</strong><p>{item.text}</p></div>
        </li>;
      })}
    </ol>
    <button className="button button-primary full-button" onClick={onClose}>Фаҳмо</button>
  </Dialog>;
}
