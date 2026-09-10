/* eslint-disable react-refresh/only-export-components */
// src/context/UserContext.js
import { createContext, useCallback, useState } from "react";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);

  const updateUserData = useCallback((data) => {
    setUserData(data);
  }, []);

  return (
    <UserContext.Provider value={{ userData, setUserData, updateUserData }}>
      {children}
    </UserContext.Provider>
  );
};
