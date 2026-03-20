import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const UserProtectedWrapper = ({children}) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  
  useEffect(() => {
    if (!token || !role) {
      // No credentials at all - redirect to user login
      navigate("/user/login");
    } else if (role !== "user") {
      // Has credentials but wrong role - just redirect without clearing
      navigate("/user/login");
    }
  }, [token, role, navigate]);

  if (!token || role !== "user") {
    return null;
  }

  return (
    <div>
      {children}
    </div>
  )
}

export default UserProtectedWrapper
