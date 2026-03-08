import { useState } from "react";
import DataContext from "./DataContext";

const DriverContext = ({ children }) => {
    const [driver, setDriver] = useState({
        fullname: {
            firstName: "",
            lastName: "",
        },
        email: "",
    });

  return (
    <DataContext.Provider value={{ driver, setDriver }}>
      {children}
    </DataContext.Provider>
  );
};

export default DriverContext;