export const getBasePath = () => {
  if (typeof window !== 'undefined') {
    return window.location.pathname.startsWith('/intern') ? '/intern' : '';
  }
  return '';
};

export const resolvePath = (path: string) => {
  if (!path.startsWith('/')) return path;
  const base = getBasePath();
  if (path === '/') return base || '/';
  if (path.startsWith(base + '/') || path === base) return path;
  return `${base}${path}`;
};
