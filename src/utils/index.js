export const devLog = (...args) => import.meta.env.DEV && console.warn('[DEV]', ...args);

export const isBase64 = (str) => {
  try {
    return btoa(atob(str)) === str;
  } catch (_err) {
    return false;
  }
};
