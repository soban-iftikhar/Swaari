import {Route, Routes} from 'react-router-dom'
import Home from './pages/Home'
import UserLogin from './pages/UserLogin';
import UserSignup from './pages/UserSignup';
import Driverlogin from './pages/Driverlogin';
import Driversignup from './pages/Driversignup';
import ChooseRole from './pages/ChooseRole';

function App() {
  return (
    <div className="App">
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/get-started" element={<ChooseRole />} />
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/signup" element={<UserSignup />} />
        <Route path="/driver/login" element={<Driverlogin />} />
        <Route path="/driver/signup" element={<Driversignup />} />
      </Routes>
    </div>
  );
}

export default App;