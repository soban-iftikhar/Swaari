import { useState } from "react";
import UserDataContext from "./userDataContext";

const UserContext = ({ children }) => {
    const [user, setUser] = useState({
        fullname: {
            firstName: "",
            lastName: "",
        },
        email: "",
    });

  return (
    <UserDataContext.Provider value={{ user, setUser }}>
      {children}
    </UserDataContext.Provider>
  );
};

export default UserContext;