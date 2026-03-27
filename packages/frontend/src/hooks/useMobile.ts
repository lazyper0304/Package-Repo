import { useMemo } from 'react';

export default function useMobile() {
  const isMobile = useMemo(() => {
    return typeof window !== 'undefined' && window.innerWidth < 768;
  }, []);

  return isMobile;
}
