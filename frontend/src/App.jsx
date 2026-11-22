import { useEffect, useState } from 'react';
import { BookOpen, ChevronDown, CodeXml, GraduationCap, House, LogIn, ShieldCheck, UserRound } from 'lucide-react';
import { getSession, setSession, subscribeToSession } from './api';
import { brand } from './content';
import { AdminPage, HistoryPage, ProfilePage } from './AccountPages';
import { Catalog, CoursePage, TaskPage } from './Learning';
import { AuthDialog, GuideDialog, useRequest } from './ui';

function getRoute() {
  const [name, id, source] = window.location.hash.slice(1).split('/');
  if (['course', 'task'].includes(name) && /^\d+$/.test(id)) {
    return { name, id, source: /^\d+$/.test(source) ? source : null };
  }
  if (name === 'preview' && /^[a-z]+$/.test(id)) return { name, id };
  if (['courses', 'history', 'profile', 'admin'].includes(name)) return { name };
  return { name: 'home' };
}

function Header({ route, session, isAdmin, onSignIn }) {
  const entries = [
    { page: 'home', label: 'Асосӣ', icon: House },
    { page: 'courses', label: 'Курсҳо', icon: BookOpen },
    { page: 'history', label: 'Ҳалҳои ман', icon: CodeXml },
  ];
  if (isAdmin) entries.push({ page: 'admin', label: 'Идоракунӣ', icon: ShieldCheck });
  const active = ['preview', 'course', 'task'].includes(route) ? 'courses' : route;

  return <header className="header">
    <div className="shell header-inner">
      <a href="#home" className="brand" aria-label={brand + ' · Саҳифаи асосӣ'}>
        <span className="brand-mark"><GraduationCap size={23} /></span><span>{brand}</span>
      </a>
      <nav className="main-nav" aria-label="Менюи асосӣ">
        {entries.map(({ page, label, icon: Icon }) =>
          <a className={active === page ? 'active' : ''} aria-current={active === page ? 'page' : undefined} href={'#' + page} key={page}>
            <Icon size={17} /> {label}
          </a>)}
      </nav>
      {session ? <a href="#profile" className="header-account" aria-label="Ҳисоби ман">
        <span className="avatar">{session.username[0]?.toLocaleUpperCase() || <UserRound size={16} />}</span><span>{session.username}</span><ChevronDown size={15} />
      </a> : <button className="header-account" onClick={onSignIn}><LogIn size={17} /><span>Ворид шудан</span></button>}
    </div>
  </header>;
}

function Site({ session, onSignIn, onGuide, onLogout, route }) {
  const [revision, setRevision] = useState(0);
  const admin = useRequest('/api/stats/', Boolean(session), revision);
  const isAdmin = Boolean(admin.data);
  const update = () => setRevision((old) => old + 1);

  let page;
  if (route.name === 'course' || route.name === 'preview') page = <CoursePage id={route.id} preview={route.name === 'preview'} session={session} onSignIn={onSignIn} revision={revision} />;
  else if (route.name === 'task') page = <TaskPage route={route} session={session} onSignIn={onSignIn} onSubmission={update} />;
  else if (route.name === 'history') page = <HistoryPage session={session} revision={revision} onSignIn={onSignIn} admin={isAdmin} />;
  else if (route.name === 'profile') page = <ProfilePage session={session} onSignIn={onSignIn} onLogout={onLogout} />;
  else if (route.name === 'admin') page = <AdminPage session={session} request={admin} onSignIn={onSignIn} onChange={update} />;
  else page = <Catalog session={session} revision={revision} onGuide={onGuide} onSignIn={onSignIn} />;

  return <>
    <Header route={route.name} session={session} isAdmin={isAdmin} onSignIn={onSignIn} />
    <main id="main-content" className="shell main" tabIndex={-1} key={['home','courses'].includes(route.name) ? 'home' : route.name + '/' + (route.id || '')}>{page}</main>
    <footer className="footer"><div className="shell footer-inner"><a href="#home"><GraduationCap size={20} /> {brand}</a>
      <button onClick={onGuide}>Тарзи кор</button>
    </div></footer>
  </>;
}

export default function App() {
  const [route, setRoute] = useState(getRoute);
  const [session, changeSession] = useState(getSession);
  const [dialog, setDialog] = useState(null);
  const login = () => setDialog('auth');
  const guide = () => setDialog('guide');
  const close = () => setDialog(null);

  useEffect(() => subscribeToSession(changeSession), []);
  useEffect(() => {
    const update = () => setRoute(getRoute());
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  useEffect(() => {
    const scroll = requestAnimationFrame(() => {
      if (route.name === 'courses') document.getElementById('courses')?.scrollIntoView({ block: 'start' });
      else window.scrollTo(0, 0);
    });
    return () => cancelAnimationFrame(scroll);
  }, [route, session?.username]);

  function logout() {
    setSession(null);
    window.location.hash = '#home';
  }

  return <>
    <a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus(); }}>Ба мундариҷа гузаштан</a>
    <Site key={session?.username || 'guest'} session={session} route={route} onSignIn={login} onGuide={guide} onLogout={logout} />
    {dialog === 'auth' && <AuthDialog onClose={() => {
      if (getSession() && route.name === 'preview') window.location.hash = '#courses';
      close();
    }} />}
    {dialog === 'guide' && <GuideDialog onClose={close} />}
  </>;
}
