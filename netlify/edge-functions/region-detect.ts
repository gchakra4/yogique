export default async (request: Request, context: any) => {
  const headers = request.headers;
  const url = new URL(request.url);

  // Query param override has highest priority
  const qRegion = (url.searchParams.get('region') || '').toUpperCase();
  const queryRegion = qRegion === 'IN' || qRegion === 'INTL' ? qRegion : null;

  // Read cookie if present
  const cookieHeader = headers.get('cookie') || '';
  const cookieMatch = cookieHeader.match(/(?:^|; )region=(IN|INTL)(?:;|$)/);
  const cookieRegion = cookieMatch ? cookieMatch[1] : null;

  // Determine region: query -> cookie -> auto-detect
  let region: 'IN' | 'INTL' = 'INTL';
  if (queryRegion) {
    region = queryRegion as 'IN' | 'INTL';
  } else if (cookieRegion) {
    region = cookieRegion as 'IN' | 'INTL';
  } else {
    const country = (
      headers.get('x-country') ||
      headers.get('x-nf-client-connection-country') ||
      headers.get('cf-ipcountry') ||
      headers.get('x-vercel-ip-country') ||
      ''
    ).toUpperCase();
    region = country === 'IN' ? 'IN' : 'INTL';
  }

  // Let the request proceed to origin
  const response = await context.next();

  // Decide whether we need to set the cookie
  // If cookie already exists and matches desired region and no query override, do nothing
  const shouldSetCookie = !(cookieRegion === region && !queryRegion);
  if (!shouldSetCookie) return response;

  const maxAge = 60 * 60 * 24 * 30; // 30 days
  const cookieValue = `region=${region}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;

  // Append Set-Cookie (do not modify body)
  const newHeaders = new Headers(response.headers);
  newHeaders.append('Set-Cookie', cookieValue);

  // Return new response with Set-Cookie header
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};
