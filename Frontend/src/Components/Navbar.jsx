import React from 'react';
import { History, House, Phone } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const iconByLabel = {
  home: House,
  history: History,
  contact: Phone
};

const Navbar = ({ items }) => {
  const role = localStorage.getItem('role');
  const homePath = role === 'driver' ? '/driver/dashboard' : '/rider/dashboard';
  const historyPath = role === 'driver' ? '/driver/history' : '/rider/history';
  const contactPath = role === 'driver' ? '/driver/contact' : '/rider/contact';

  const navItems = items || [
    { label: 'Home', to: homePath },
    { label: 'History', to: historyPath },
    { label: 'Contact', to: contactPath }
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1 md:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-3">
        {navItems.map((item) => (
          <li key={item.label}>
            <NavLink
              to={item.label.toLowerCase() === 'home' ? homePath : item.to}
              aria-label={item.label}
            >
              {({ isActive }) => {
                const Icon = iconByLabel[item.label.toLowerCase()] || House;
                return (
                  <span className="flex flex-col items-center justify-center gap-1 py-2">
                    <Icon
                      className={`h-5 w-5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`}
                      strokeWidth={isActive ? 2.4 : 2}
                    />
                    <span
                      className={`text-[15px] leading-none ${
                        isActive ? 'font-semibold text-black' : 'font-medium text-slate-500'
                      }`}
                    >
                      {item.label}
                    </span>
                  </span>
                );
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default Navbar;