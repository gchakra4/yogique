export function getRegionFromCookie(): 'IN' | 'ROW' {
  if (typeof document === 'undefined') return 'IN';
  const m = document.cookie.match(/(?:^|; )region=(IN|ROW)(?:;|$)/);
  return m ? (m[1] as 'IN' | 'ROW') : 'IN';
}

export default getRegionFromCookie;
