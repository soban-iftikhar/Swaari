import {Route, Routes} from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import UserLogin from './pages/UserLogin';
import UserSignup from './pages/UserSignup';
import Driverlogin from './pages/Driverlogin';
import Driversignup from './pages/Driversignup';
import ChooseRole from './pages/ChooseRole';
import UserDashboard from './pages/UserDashboard';
import DriverDashboard from './pages/DriverDashboard';
import UserProtectedWrapper from './Components/UserProtectedWrapper';
import DriverProtectedWrapper from './Components/DriverProtectedWrapper';

function App() {
  return (
    <div className="App">
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/get-started" element={<ChooseRole />} />
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/signup" element={<UserSignup />} />
        <Route path="/driver/login" element={<Driverlogin />} />
        <Route path="/driver/signup" element={<Driversignup />} />
        <Route path="/user/dashboard" element={
          <UserProtectedWrapper>
            <UserDashboard />
          </UserProtectedWrapper>
        } />
        <Route path="/driver/dashboard" element={
          <DriverProtectedWrapper>
            <DriverDashboard />
          </DriverProtectedWrapper>
        } />
      </Routes>
    </div>
  );
}

export default App;