import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const RiderProtectedWrapper = ({children}) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  
  useEffect(() => {
    if (!token || !role) {
      // No credentials at all - redirect to rider login
      navigate("/rider/login");
    } else if (role !== "rider") {
      // Has credentials but wrong role - just redirect without clearing
      navigate("/rider/login");
    }
  }, [token, role, navigate]);

  if (!token || role !== "rider") {
    return null;
  }

  return (
    <div>
      {children}
    </div>
  )
}

export default RiderProtectedWrapper
