import { useState } from "react";
import DataContext from "./DataContext";

const UserContext = ({ children }) => {
    const [user, setUser] = useState({
        fullname: {
            firstName: "",
            lastName: "",
        },
        email: "",
    });

  return (
    <DataContext.Provider value={{ user, setUser }}>
      {children}
    </DataContext.Provider>
  );
};

export default UserContext;