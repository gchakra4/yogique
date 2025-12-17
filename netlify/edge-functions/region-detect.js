export default async (request, context) => {
    // Detect country from common headers
    const headers = request.headers;
    const country =
        headers.get('x-nf-client-connection-country') ||
        headers.get('cf-ipcountry') ||
        headers.get('x-vercel-ip-country') ||
        headers.get('x-country') ||
        '';

    const region = country && country.toUpperCase() === 'IN' ? 'IN' : 'ROW';

    const cookieHeader = request.headers.get('cookie') || '';
    const hasRegionCookie = cookieHeader.includes('region=');

    // Continue to origin
    const response = await context.next();

    // If region cookie already present, pass response through unchanged
    if (hasRegionCookie) return response;

    // Otherwise set region cookie on the response
    const newHeaders = new Headers(response.headers);
    // 30 days
    const maxAge = 60 * 60 * 24 * 30;
    const cookieValue = `region=${region}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
    // Append Set-Cookie header (multiple set-cookie headers allowed)
    newHeaders.append('Set-Cookie', cookieValue);

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
    });
};
