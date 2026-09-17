export function isPublicIntakePath(pathname: string): boolean {
  // HP staff intake requires corporate Trimble Identity authentication
  if (pathname.includes('/hp') || pathname.endsWith('/hp')) {
    return false;
  }
  return (
    pathname === '/login' ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/logout' ||
    pathname.startsWith('/intake') ||
    pathname.startsWith('/api/intake') ||
    pathname.startsWith('/api/bowling') ||
    pathname.startsWith('/api/feedback') ||
    pathname.startsWith('/api/v1/feedback')
  );
}
