export function signInErrorMessage(error, hostname = '') {
  const messages = {
    'auth/unauthorized-domain': `Sign-in is not enabled for ${hostname || 'this domain'}. Add this hostname in Firebase Console → Authentication → Settings → Authorized domains.`,
    'auth/operation-not-allowed': 'Google sign-in is disabled for this project. Enable Google in Firebase Console → Authentication → Sign-in method.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.',
    'auth/popup-closed-by-user': 'The sign-in window closed before sign-in finished. Try again and keep the Google window open.',
    'auth/cancelled-popup-request': 'Another sign-in request is already open. Complete that request or try again.',
    'auth/network-request-failed': 'Could not reach Google sign-in. Check your connection and try again.',
    'auth/invalid-api-key': 'The Firebase API key is invalid. Check the Firebase settings in your local .env file and restart the server.',
    'auth/web-storage-unsupported': 'Your browser is blocking the storage needed for sign-in. Open this site in a regular browser window and allow site storage.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method. Use that method to access it.',
  };
  return messages[error?.code] || `Sign-in could not be completed. Please try again.${error?.code ? ` Error: ${error.code}` : ''}`;
}
