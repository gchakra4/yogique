export function getRegion(): 'IN' | 'INTL' {
  if (typeof document === 'undefined') return 'INTL';
  const m = document.cookie.match(/(?:^|; )region=(IN|INTL)(?:;|$)/);
  return (m ? (m[1] as 'IN' | 'INTL') : 'INTL');
}

export function setRegion(region: 'IN' | 'INTL') {
  if (typeof document === 'undefined') return;
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  const cookie = `region=${region}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
  document.cookie = cookie;
}

export default getRegion;
