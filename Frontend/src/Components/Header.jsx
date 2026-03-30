import React, { useState } from 'react';
import axios from 'axios';
import { IdCard, LogOut, Menu, Settings, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ title }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleMenuClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const handleLogoutClick = async () => {
    setIsMenuOpen(false);

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const isDriver = role === 'driver';
    const apiPath = isDriver ? '/api/drivers/logout' : '/api/riders/logout';

    try {
      if (token) {
        await axios.get(`${import.meta.env.VITE_BASE_URL}${apiPath}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('firstName');

      navigate(isDriver ? '/driver/login' : '/rider/login');
    }
  };

  const role = localStorage.getItem('role');
  const firstName = localStorage.getItem('firstName');
  const fallbackName = role === 'driver' ? 'Driver' : 'Rider';
  const resolvedTitle = title || `Welcome ${firstName || fallbackName}`;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h3 className="text-base font-semibold text-slate-800 sm:text-lg">{resolvedTitle}</h3>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white transition hover:bg-slate-800"
          aria-label="Open profile"
        >
          <User className="h-5 w-5" />
        </button>
      </div>

      {isMenuOpen && (
        <div className="mx-4 mb-3 rounded-xl border border-slate-200 bg-white p-2 shadow-lg sm:mx-6 lg:mx-8">
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
              <IdCard className="h-4 w-4" />
            </span>
            Profile
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-100"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100">
              <Settings className="h-4 w-4" />
            </span>
            Settings
          </button>
          <button
            type="button"
            onClick={handleLogoutClick}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100">
              <LogOut className="h-4 w-4" />
            </span>
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;