import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FaHome,FaPlus } from "react-icons/fa";
import { BiSolidReport } from "react-icons/bi";
import { BiLogOutCircle } from "react-icons/bi";
import { IoClose } from "react-icons/io5";
import { FiUser, FiSettings } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { Send } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="h-screen w-screen bg-[#F7F7FB] text-palette-text flex overflow-hidden">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className="flex w-full h-full min-w-0">
        {/* Sidebar */}
        <aside className={`fixed lg:relative inset-y-0 left-0 z-50 bg-[#6C3BFF] text-white w-64 sm:w-72 lg:w-72 transform transition-transform duration-300 ease-in-out flex flex-col h-full shadow-xl flex-shrink-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
          {/* Sidebar Header */}
          <div className="p-3 sm:p-4 lg:p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
                <div className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 rounded-2xl bg-white/10 flex items-center justify-center font-semibold text-lg sm:text-xl lg:text-2xl">
                  RCS
                </div>
                <div className="hidden sm:block">
                  <h2 className="font-bold text-base sm:text-lg lg:text-xl">RCS Dashboard</h2>
                  <p className="text-white/70 text-xs lg:text-sm">Admin Panel</p>
                </div>
              </div>
              
              {/* Close Button for Mobile */}
              <button 
                className="lg:hidden h-8 w-8 sm:h-10 sm:w-10 rounded-xl text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 flex items-center justify-center flex-shrink-0"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <IoClose className="text-lg sm:text-xl" />
              </button>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-3 sm:p-4 lg:p-6 space-y-1 sm:space-y-2 lg:space-y-3 overflow-y-auto overflow-x-hidden">
            <div className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3 sm:mb-4 lg:mb-6 px-2 lg:px-3">
              Main Menu
            </div>
            
            {[
              { to: '/', icon: <FaHome />, label: 'Dashboard' },
              { to: '/newCampaign', icon: <Send />, label: 'Send Messsage' },
              { to: '/templates', icon: <BiSolidReport />, label: 'Templates' },
              { to: '/reports', icon: <BiSolidReport />, label: 'Reports' },
             
            ].map(({ to, icon, label }) => (
              <NavLink 
                key={to} 
                to={to} 
                className={({isActive}) => `flex items-center gap-2 sm:gap-3 lg:gap-4 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'bg-white/25 text-white shadow-lg' 
                    : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="text-lg sm:text-xl lg:text-2xl">{icon}</span>
                <span className="font-semibold text-sm sm:text-base lg:text-lg">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-3 sm:p-4 lg:p-6 border-t border-white/10 flex-shrink-0">
            <button 
              onClick={logout}
              className="flex items-center gap-2 sm:gap-3 lg:gap-4 px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4 rounded-xl text-white/80 hover:bg-white/15 hover:text-white transition-all duration-200 w-full"
            >
              <BiLogOutCircle className="text-lg sm:text-xl lg:text-2xl" />
              <span className="font-semibold text-sm sm:text-base lg:text-lg">Logout</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 lg:ml-0 flex flex-col h-full overflow-hidden bg-white lg:bg-transparent min-w-0">
          {/* Header */}
          <div className="p-2 sm:p-3 md:p-4 lg:p-6 border-b border-gray-200 bg-white flex-shrink-0 shadow-sm">
            <div className="flex items-center justify-between w-full gap-2 sm:gap-3 md:gap-4 min-w-0">
              {/* Left Side (Menu button and title) */}
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                {!isMobileMenuOpen && (
                  <button 
                    className="lg:hidden h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 bg-[#6C3BFF] text-white rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                )}
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 truncate">Dashboard</h2>
                </div>
              </div>

              {/* Right Side (User Avatar) */}
              <div className="flex-shrink-0 relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 rounded-full bg-[#6C3BFF] text-white flex items-center justify-center font-semibold text-xs sm:text-sm md:text-base lg:text-lg shadow-sm hover:shadow-md transition-all duration-200"
                >
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </button>
                
                {/* Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <button 
                      onClick={() => {
                        navigate('/profile');
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <FiUser className="text-lg" />
                      <span>View Profile</span>
                    </button>
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => {
                          navigate('/admin');
                          setShowProfileDropdown(false);
                        }}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 w-full text-left"
                      >
                        <FiSettings className="text-lg" />
                        <span>Admin Panel</span>
                      </button>
                    )}
                    <button 
                      onClick={() => {
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <FiSettings className="text-lg" />
                      <span>Settings</span>
                    </button>
                    <hr className="my-2" />
                    <button 
                      onClick={() => {
                        logout();
                        setShowProfileDropdown(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 w-full text-left"
                    >
                      <BiLogOutCircle className="text-lg" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="flex-1 p-2 sm:p-3 lg:p-6 overflow-y-auto overflow-x-hidden bg-[#F7F7FB]">
            <div className="w-full max-w-7xl mx-auto">
              <Outlet />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

