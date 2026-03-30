import { useState } from "react";
import DataContext from "./DataContext";

const RiderContext = ({ children }) => {
  const [rider, setRider] = useState({
        fullname: {
            firstName: "",
            lastName: "",
        },
        email: "",
    });

  return (
    <DataContext.Provider value={{ rider, setRider }}>
      {children}
    </DataContext.Provider>
  );
};

export default RiderContext;