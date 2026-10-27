export function isPublicIntakePath(pathname: string): boolean {
  // HP staff intake requires corporate Trimble Identity authentication
  if (/^\/intake\/[^/]+\/hp(?:\/|$)/.test(pathname)) {
    return false;
  }
  return (
    pathname === '/login' ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/logout' ||
    pathname.startsWith('/intake') ||
    pathname.startsWith('/api/intake')
  );
}
