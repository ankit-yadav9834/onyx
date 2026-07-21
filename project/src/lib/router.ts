import { useEffect, useState, useCallback } from 'react';

export type Route =
  | { name: 'landing' }
  | { name: 'dashboard' }
  | { name: 'workspace' }
  | { name: 'consensus' }
  | { name: 'routing' }
  | { name: 'verification' }
  | { name: 'models' }
  | { name: 'audit' }
  | { name: 'settings' }
  | { name: 'admin' }
  | { name: 'search' };

const ALL_ROUTES: Route['name'][] = [
  'landing',
  'dashboard',
  'workspace',
  'consensus',
  'routing',
  'verification',
  'models',
  'audit',
  'settings',
  'admin',
  'search',
];

function parseHash(): Route {
  const h = window.location.hash.replace('#/', '').replace('#', '');
  const name = ALL_ROUTES.find((r) => r === h);
  return name ? ({ name } as Route) : { name: 'landing' };
}

export function routeToHash(name: Route['name']) {
  return `#/${name}`;
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(parseHash());

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((name: Route['name']) => {
    window.location.hash = routeToHash(name);
  }, []);

  return { route, navigate };
}
