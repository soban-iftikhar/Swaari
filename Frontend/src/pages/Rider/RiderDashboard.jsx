import React from 'react'
import Header from '../../Components/Header';
import Navbar from '../../Components/Navbar';

const RiderDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      

      <Navbar items={[
        { label: 'Home', to: '/rider/dashboard' },
        { label: 'History', to: '/rider/history' },
        { label: 'Contact', to: '/rider/contact' }
      ]} />
    </div>
  )
}

export default RiderDashboard
