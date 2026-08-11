import { Link, type LinkProps } from 'react-router-dom';
import { resolvePath } from '@/utils/basePath';
import { forwardRef } from 'react';

export const AppLink = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, ...props }, ref) => {
    const resolvedTo = typeof to === 'string' ? resolvePath(to) : to;
    return <Link ref={ref} to={resolvedTo} {...props} />;
  }
);
AppLink.displayName = 'AppLink';
