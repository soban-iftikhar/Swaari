import { createContext, useState } from "react";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [user, setUser] = useState({
    fullname: {
      firstName: "",
      lastName: "",
    },
    email: "",
  });

  const [driver, setDriver] = useState({
    fullname: {
      firstName: "",
      lastName: "",
    },
    email: "",
  });

  return (
    <DataContext.Provider value={{ user, setUser, driver, setDriver }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
