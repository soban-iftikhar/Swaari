import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ProtectedWrapper = ({children}) => {

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  useEffect(() => {
    if (!token) {
      navigate("/user/login");
    }
  }, [token, navigate]);

  if (!token) {
    return null;
  }

  return (
    <div>
      {children}
    </div>
  )
}

export default ProtectedWrapper