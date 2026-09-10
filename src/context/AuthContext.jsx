/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, firebaseSetupError } from "../firebase"; // make sure this is the correct path to your firebase config
import { signInErrorMessage } from '../features/tracker/authErrors';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthError('');
      setLoading(false);
    }, (error) => {
      setCurrentUser(null);
      setAuthError(signInErrorMessage(error, window.location.hostname));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = () => (auth ? signOut(auth) : Promise.resolve());

  return (
    <AuthContext.Provider value={{ currentUser, loading, authError, firebaseSetupError, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
