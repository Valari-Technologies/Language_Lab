// The login of one browser tab (access token, refresh token and the user).
//
// Each tab keeps its own session, so a teacher and a school admin can be signed in side by side in one browser. When the
// session was kept for every tab together (localStorage), the second login replaced the first tab's tokens: the first tab
// still showed its page but sent the other person's token, and its saves failed until it was logged in again.

const KEYS = ['access_token', 'refresh_token', 'user'];
const memory = {}; // used only if the browser does not allow sessionStorage

const store = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

export const sessionGet = (key) => {
  try {
    const s = store();
    return s ? s.getItem(key) : (memory[key] ?? null);
  } catch {
    return memory[key] ?? null;
  }
};

export const sessionSet = (key, value) => {
  try {
    const s = store();
    if (s) s.setItem(key, value); else memory[key] = value;
  } catch {
    memory[key] = value;
  }
};

export const sessionRemove = (key) => {
  try {
    const s = store();
    if (s) s.removeItem(key);
  } catch {
    // nothing to remove
  }
  delete memory[key];
};

export const sessionClear = () => KEYS.forEach(sessionRemove);

// Once, when the page opens: a login that an older version of the site kept for all tabs moves into this tab, and the
// shared copy is removed so it can no longer be picked up by (or overwritten from) another tab.
export const adoptLegacySession = () => {
  try {
    if (!sessionGet('access_token') && localStorage.getItem('access_token') && localStorage.getItem('user')) {
      KEYS.forEach((key) => {
        const value = localStorage.getItem(key);
        if (value !== null) sessionSet(key, value);
      });
    }
    KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage is not available: there is nothing to move
  }
};
