const sessionKey = 'marifat.session';
let refreshJob;
let currentSession;

try {
  currentSession = JSON.parse(sessionStorage.getItem(sessionKey) || 'null');
} catch {
  currentSession = null;
}

const listeners = new Set();

export function getSession() {
  return currentSession;
}

export function setSession(session) {
  currentSession = session;
  if (session) sessionStorage.setItem(sessionKey, JSON.stringify(session));
  else sessionStorage.removeItem(sessionKey);
  listeners.forEach((listener) => listener(session));
}

export function subscribeToSession(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function describeError(payload, status) {
  if (status === 401) return 'Вурудро санҷед ва дубора кӯшиш кунед.';
  if (status === 403) return 'Барои ин амал иҷозат надоред.';
  if (status === 404) return 'Ин маълумот ёфт нашуд.';
  if (status >= 500) return 'Пайвастшавӣ ба сервер муваққатан дастрас нест. Дубора кӯшиш кунед.';
  if (Array.isArray(payload)) return payload.join(' ');
  if (payload && typeof payload === 'object') {
    return Object.values(payload).flat().filter((value) => typeof value === 'string').join(' ') || 'Дархост иҷро нашуд.';
  }
  return 'Дархост иҷро нашуд.';
}

async function send(path, options, access) {
  const { method = 'GET', body, signal } = options;
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (access) headers.Authorization = 'Bearer ' + access;

  let response;
  try {
    response = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new ApiError(0, 'Пайвастшавӣ нест. Санҷед, ки сервери Django кор мекунад.');
  }

  const payload = response.headers.get('content-type')?.includes('json') ? await response.json() : null;
  if (!response.ok) throw new ApiError(response.status, describeError(payload, response.status));
  return payload;
}

async function renewSession() {
  if (!refreshJob) {
    const old = currentSession;
    if (!old?.refresh) return null;
    refreshJob = send('/account/token/refresh/', { method: 'POST', body: { refresh: old.refresh } })
      .then((tokens) => {
        if (currentSession !== old) return null;
        const session = { ...old, ...tokens };
        setSession(session);
        return session;
      })
      .catch((error) => {
        if (currentSession === old && [400, 401, 403].includes(error.status)) setSession(null);
        if (![400, 401, 403].includes(error.status)) throw error;
        return null;
      })
      .finally(() => { refreshJob = undefined; });
  }
  return refreshJob;
}

export async function api(path, options = {}) {
  const original = options.public ? null : currentSession;
  try {
    return await send(path, options, original?.access);
  } catch (error) {
    if (error.status !== 401 || !original?.refresh || !currentSession) throw error;
    const latest = currentSession === original ? await renewSession() : currentSession;
    if (!latest || latest.username !== original.username) throw error;
    return send(path, options, latest.access);
  }
}

export async function signIn(credentials, register = false) {
  if (register) await api('/account/register/', { method: 'POST', body: credentials, public: true });
  const tokens = await api('/account/login/', { method: 'POST', body: credentials, public: true });
  setSession({ ...tokens, username: credentials.username });
}
