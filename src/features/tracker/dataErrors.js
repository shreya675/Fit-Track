export function dataErrorMessage(error, resource = 'account data') {
  const code = String(error?.code || 'unknown').replace(/^firestore\//, '');
  const reason = {
    'permission-denied': 'The database is refusing access to your account data. The site owner needs to update its access rules. Your saved entries have not been deleted.',
    'unavailable': 'The database is temporarily unavailable. Check your connection and retry.',
    'unauthenticated': 'Your session is no longer valid. Sign out and sign in again.',
    'failed-precondition': 'The database requires additional setup. Check the Firebase project configuration.',
    'resource-exhausted': 'The Firebase project has reached a usage limit. Check its quota.',
    'not-found': 'The requested database was not found. Check the Firebase project and database setup.',
  }[code] || 'The request failed. Retry or check the Firebase project configuration.';
  return `Could not load ${resource}. ${reason} (${code})`;
}
