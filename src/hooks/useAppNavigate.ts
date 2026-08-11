import { useNavigate, type NavigateOptions } from 'react-router-dom';
import { getBasePath } from '@/utils/basePath';

export function useAppNavigate() {
  const navigate = useNavigate();
  return (to: string | number, options?: NavigateOptions) => {
    if (typeof to === 'number') {
      navigate(to);
      return;
    }
    if (!to.startsWith('/')) {
      navigate(to, options);
      return;
    }
    const base = getBasePath();
    const resolvedTo = to === '/' ? base || '/' : (to.startsWith(base + '/') || to === base) ? to : `${base}${to}`;
    navigate(resolvedTo, options);
  };
}
