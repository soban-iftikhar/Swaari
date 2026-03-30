import {Route, Routes} from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import RiderLogin from './pages/Rider/RiderLogin';
import RiderSignup from './pages/Rider/RiderSignup';
import Driverlogin from './pages/Driver/Driverlogin';
import Driversignup from './pages/Driver/Driversignup';
import ChooseRole from './pages/ChooseRole';
import RiderDashboard from './pages/Rider/RiderDashboard';
import DriverDashboard from './pages/Driver/DriverDashboard';
import RiderProtectedWrapper from './Components/RiderProtectedWrapper';
import DriverProtectedWrapper from './Components/DriverProtectedWrapper';
import Contact from './pages/Contact';
import History from './pages/History';

function App() {
  return (
    <div className="App">
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/get-started" element={<ChooseRole />} />
        <Route path="/rider/login" element={<RiderLogin />} />
        <Route path="/rider/signup" element={<RiderSignup />} />
        <Route path="/driver/login" element={<Driverlogin />} />
        <Route path="/driver/signup" element={<Driversignup />} />
        <Route path="/rider/dashboard" element={
          <RiderProtectedWrapper>
            <RiderDashboard />
          </RiderProtectedWrapper>
        } />
        <Route path="/rider/history" element={
          <RiderProtectedWrapper>
            <History />
          </RiderProtectedWrapper>
        } />
        <Route path="/rider/contact" element={
          <RiderProtectedWrapper>
            <Contact />
          </RiderProtectedWrapper>
        } />
        <Route path="/driver/dashboard" element={
          <DriverProtectedWrapper>
            <DriverDashboard />
          </DriverProtectedWrapper>
        } />
        <Route path="/driver/history" element={
          <DriverProtectedWrapper>
            <History />
          </DriverProtectedWrapper>
        } />
        <Route path="/driver/contact" element={
          <DriverProtectedWrapper>
            <Contact />
          </DriverProtectedWrapper>
        } />
      </Routes>
    </div>
  );
}

export default App;