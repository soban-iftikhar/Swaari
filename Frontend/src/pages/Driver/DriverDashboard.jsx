import React from 'react'
import Header from '../../Components/Header';
import Navbar from '../../Components/Navbar';

const DriverDashboard = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 lg:px-8 md:pb-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h1 className="text-2xl font-bold text-slate-900">Driver Dashboard</h1>
          <p className="mt-3 text-slate-600">Welcome to your dashboard!</p>
        </div>
      </main>

      <Navbar items={[
        { label: 'Home', to: '/driver/dashboard' },
        { label: 'History', to: '/driver/history' },
        { label: 'Contact', to: '/driver/contact' }
      ]} />
    </div>
  )
}

export default DriverDashboard
