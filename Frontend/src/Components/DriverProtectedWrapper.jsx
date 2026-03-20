import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const DriverProtectedWrapper = ({children}) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  
  useEffect(() => {
    if (!token || !role) {
      // No credentials at all - redirect to driver login
      navigate("/driver/login");
    } else if (role !== "driver") {
      // Has credentials but wrong role - just redirect without clearing
      navigate("/driver/login");
    }
  }, [token, role, navigate]);

  if (!token || role !== "driver") {
    return null;
  }

  return (
    <div>
      {children}
    </div>
  )
}

export default DriverProtectedWrapper
