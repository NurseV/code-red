
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useCitizenAuth } from '../../hooks/useCitizenAuth';
import { FireExtinguisherIcon, UserIcon, LogOutIcon, LayoutDashboardIcon, SettingsIcon, ChevronDownIcon } from '../icons/Icons';
import Button from '../ui/Button';

const PublicNavbar: React.FC = () => {
  const { isAuthenticated, citizenUser, logout } = useCitizenAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'text-white bg-dark-border' : 'text-dark-text-secondary hover:text-white'
    }`;

  return (
    <header className="bg-dark-card border-b border-dark-border sticky top-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <NavLink to="/" className="flex-shrink-0 flex items-center">
              <FireExtinguisherIcon className="h-8 w-8 text-brand-primary" />
              <span className="text-white font-bold ml-3 text-lg">Anytown Fire Dept.</span>
            </NavLink>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <NavLink to="/announcements" className={navLinkClass}>Announcements</NavLink>
                <NavLink to="/about" className={navLinkClass}>About Us</NavLink>
                <NavLink to="/photo-gallery" className={navLinkClass}>Photo Gallery</NavLink>
                <NavLink to="/community-calendar" className={navLinkClass}>Calendar</NavLink>
                <NavLink to="/records-request" className={navLinkClass}>Records Request</NavLink>
                <NavLink to="/storm-shelter-registry" className={navLinkClass}>Storm Shelters</NavLink>
                <NavLink to="/burn-permit-application" className={navLinkClass}>Burn Permits</NavLink>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            {isAuthenticated && citizenUser ? (
              <div className="relative" ref={dropdownRef}>
                  <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-dark-border transition-colors duration-200"
                  >
                      <div className="h-8 w-8 rounded-full bg-brand-secondary flex items-center justify-center font-bold text-white">
                        {citizenUser.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-dark-text hidden md:inline">{citizenUser.name}</span>
                      <ChevronDownIcon className="h-5 w-5 text-dark-text-secondary hidden md:block" />
                  </button>
                  {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-dark-card border border-dark-border rounded-lg shadow-lg z-20">
                          <div className="p-2 border-b border-dark-border">
                              <p className="text-sm font-semibold text-dark-text px-2">{citizenUser.name}</p>
                              <p className="text-xs text-dark-text-secondary px-2">{citizenUser.email}</p>
                          </div>
                          <ul className="py-1">
                              <li>
                                  <Link to="/portal/dashboard" onClick={()=>setDropdownOpen(false)} className="flex items-center px-4 py-2 text-dark-text-secondary hover:bg-dark-border hover:text-dark-text transition-colors duration-200">
                                      <LayoutDashboardIcon className="h-5 w-5 mr-3" /> My Dashboard
                                  </Link>
                              </li>
                               <li>
                                  <Link to="/portal/settings" onClick={()=>setDropdownOpen(false)} className="flex items-center px-4 py-2 text-dark-text-secondary hover:bg-dark-border hover:text-dark-text transition-colors duration-200">
                                      <SettingsIcon className="h-5 w-5 mr-3" /> Account Settings
                                  </Link>
                              </li>
                              <li>
                                  <button
                                      onClick={handleLogout}
                                      className="w-full text-left flex items-center px-4 py-2 text-dark-text-secondary hover:bg-dark-border hover:text-dark-text transition-colors duration-200"
                                  >
                                      <LogOutIcon className="h-5 w-5 mr-3" /> Logout
                                  </button>
                              </li>
                          </ul>
                      </div>
                  )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button variant="ghost" onClick={() => navigate('/login')}>Login</Button>
                <Button variant="primary" onClick={() => navigate('/register')}>Register</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicNavbar;
