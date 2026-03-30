import { createContext, useState } from "react";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [rider, setRider] = useState({
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
    <DataContext.Provider value={{ rider, setRider, driver, setDriver }}>
      {children}
    </DataContext.Provider>
  );
};

export default DataContext;
