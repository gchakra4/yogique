export function getRegion(): 'IN' | 'INTL' {
  if (typeof document === 'undefined') return 'INTL';
  const m = document.cookie.match(/(?:^|; )region=(IN|INTL)(?:;|$)/);
  return (m ? (m[1] as 'IN' | 'INTL') : 'INTL');
}

export default getRegion;
