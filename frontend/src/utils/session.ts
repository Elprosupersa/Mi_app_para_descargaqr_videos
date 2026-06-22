export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('app_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('app_session_id', sessionId);
  }
  return sessionId;
};
