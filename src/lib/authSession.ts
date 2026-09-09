export const CURRENT_SESSION_COOKIE = "lh_session";

declare global {
  var __currentSessionToken: string | undefined;
}

export function setCurrentSession(token: string) {
  globalThis.__currentSessionToken = token;
}

export function clearCurrentSession() {
  globalThis.__currentSessionToken = undefined;
}

// Only the most recently issued token is valid — logging in anywhere
// invalidates every previously issued cookie by overwriting this.
export function isValidSession(token: string | undefined): boolean {
  return !!token && token === globalThis.__currentSessionToken;
}
