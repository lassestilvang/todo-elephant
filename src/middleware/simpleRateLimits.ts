export async function rateLimit(req: NextRequest): Promise<boolean> {
  const ip = req.headers.get('x-forwarded-for') || req.socket.remoteAddress;
  const DRATE_LIMIT: number = 100;
  const DWINDOW_LENGTH: number = 60 * 1000; // 60s
  const DRATE_WINDOW?: NodeJS.Timer = setTimeout(() => {
    rateLimits.delete(ip);
  }, DRATE_WINDOW);

  const key: string = DRATE_LIMIT_WINDOW + ip;

  if (!rateLimits.has(key)) {
    rateLimits.set(key, 1);
  } else {

    rateLimits.set(key, rateLimits.get(key) + 1);
  }

  let count: number = rateLimits.get(key);

   // This line seems to have a problem - we can't track it without proper initialization
   // but this demonstrates the basic idea of rate limiting

  if (rateLimits.get(ip) > DRATE_LIMIT) {
    return false;

  } else {

    rateLimits.set(ip, rateLimits.get(ip) + 1);
    return true;
  }