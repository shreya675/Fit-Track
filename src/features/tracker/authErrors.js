export function signInErrorMessage(error, hostname = '') {
  const messages = {
    'auth/unauthorized-domain': `Sign-in is not enabled for ${hostname || 'this domain'}. Add this hostname in Firebase Console → Authentication → Settings → Authorized domains.`,
    'auth/operation-not-allowed': 'This sign-in method is not enabled yet. Please use another method or try the demo.',
    'auth/invalid-credential': 'The email or password is incorrect. Try again or reset your password.',
    'auth/wrong-password': 'The email or password is incorrect. Try again or reset your password.',
    'auth/user-not-found': 'The email or password is incorrect. Try again or create an account.',
    'auth/email-already-in-use': 'This email already has an account. Log in or reset your password.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/password-does-not-meet-requirements': 'Choose a stronger password with uppercase and lowercase letters, a number, and a symbol.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes before trying again.',
    'auth/user-disabled': 'This account is disabled. Contact the site owner for help.',
    'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups for this site, then try again.',
    'auth/popup-closed-by-user': 'The sign-in window closed before sign-in finished. Try again and keep the Google window open.',
    'auth/cancelled-popup-request': 'Another sign-in request is already open. Complete that request or try again.',
    'auth/network-request-failed': 'Could not reach the sign-in service. Check your connection and try again.',
    'auth/invalid-api-key': 'The Firebase API key is invalid. Check the Firebase settings in your local .env file and restart the server.',
    'auth/web-storage-unsupported': 'Your browser is blocking the storage needed for sign-in. Open this site in a regular browser window and allow site storage.',
    'auth/account-exists-with-different-credential': 'An account already exists with this email using another sign-in method. Use that method to access it.',
  };
  return messages[error?.code] || `Sign-in could not be completed. Please try again.${error?.code ? ` Error: ${error.code}` : ''}`;
}
