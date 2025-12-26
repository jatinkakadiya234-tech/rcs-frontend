import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FaHome,FaPlus } from "react-icons/fa";
import { BiSolidReport } from "react-icons/bi";
import { BiLogOutCircle } from "react-icons/bi";
import { IoClose } from "react-icons/io5";
import { FiUser, FiSettings } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { Send } from '@mui/icons-material';
import { GoGraph } from "react-icons/go";
import { useAuth } from '../context/AuthContext';
import AccountStatusChecker from '../components/AccountStatusChecker';

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
    <>
    <AccountStatusChecker />
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
                  <p className="text-white/70 text-xs lg:text-sm">{user.companyname}</p>
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
              { to: '/reports', icon: <GoGraph />, label: 'Reports' },
             
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
                  <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-gray-900 truncate">Dashboard - {user.companyname}</h2>
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
    </>
  )
}






// import React, { useState, useEffect } from 'react';
// import {
//     Layout,
//     Menu,
//     Button,
//     Dropdown,
//     Avatar,
//     Space,
//     Drawer,
//     Divider,
//     Input,
// } from 'antd';
// import {
//     DashboardOutlined,
//     MessageOutlined,
//     FileTextOutlined,
//     BarChartOutlined,
//     SettingOutlined,
//     LogoutOutlined,
//     UserOutlined,
//     SearchOutlined,
//     MenuOutlined,
//     CloseOutlined,
//     HomeOutlined,
//     CreditCardOutlined,
//     MailOutlined,
//     PlusOutlined,
//     EyeOutlined,
//     CalendarOutlined,
//     SendOutlined,
//     ContactsOutlined,
// } from '@ant-design/icons';
// import { useNavigate, useLocation } from 'react-router-dom';
// import { THEME_CONSTANTS } from '../styles/theme';

// const { Sider, Header, Content, Footer } = Layout;

// const MainLayout = ({ children, isAdmin = false }) => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     const [drawerVisible, setDrawerVisible] = useState(false);
//     const [selectedKey, setSelectedKey] = useState(
//         location.pathname.slice(1) || 'dashboard'
//     );
//     const [isDesktop, setIsDesktop] = useState(
//         typeof window !== 'undefined' ? window.innerWidth >= THEME_CONSTANTS.breakpoints.lg : false
//     );
//     const [isMobile, setIsMobile] = useState(
//         typeof window !== 'undefined' ? window.innerWidth < THEME_CONSTANTS.breakpoints.md : false
//     );

//     // Sync selected menu with route
//     useEffect(() => {
//         const path = location.pathname.slice(1) || 'dashboard';
//         setSelectedKey(path);
//     }, [location.pathname]);

//     // Responsive breakpoint handling
//     useEffect(() => {
//         const handleResize = () => {
//             const desktop = window.innerWidth >= THEME_CONSTANTS.breakpoints.lg;
//             const mobile = window.innerWidth < THEME_CONSTANTS.breakpoints.md;
//             setIsDesktop(desktop);
//             setIsMobile(mobile);
//             if (desktop) setDrawerVisible(false);
//         };
//         window.addEventListener('resize', handleResize);
//         return () => window.removeEventListener('resize', handleResize);
//     }, []);

//     // Dynamic menu styles with theme constants
//     useEffect(() => {
//         const menuStyles = `
//       .custom-menu .ant-menu {
//         background: transparent !important;
//         border: none !important;
//       }

//       .custom-menu .ant-menu-item {
//         height: 56px !important;
//         line-height: 56px !important;
//         margin: ${THEME_CONSTANTS.spacing.sm} 0 !important;
//         border-radius: ${THEME_CONSTANTS.radius.lg} !important;
//         font-weight: ${THEME_CONSTANTS.typography.h5.weight} !important;
//         font-size: ${isMobile ? THEME_CONSTANTS.typography.body.size : THEME_CONSTANTS.typography.h5.size} !important;
//         padding: 0 ${THEME_CONSTANTS.spacing.xl} !important;
//         transition: ${THEME_CONSTANTS.transition.normal} !important;
//         display: flex !important;
//         align-items: center !important;
//         justify-content: flex-start !important;
//       }

//       .custom-menu .ant-menu-item:hover {
//         background-color: ${THEME_CONSTANTS.colors.primaryLight} !important;
//         color: ${THEME_CONSTANTS.colors.primary} !important;
//         box-shadow: ${THEME_CONSTANTS.shadow.md} !important;
//       }

//       .custom-menu .ant-menu-item-selected {
//         background-color: ${THEME_CONSTANTS.colors.primaryLight} !important;
//         color: ${THEME_CONSTANTS.colors.primary} !important;
//         font-weight: ${THEME_CONSTANTS.typography.h4.weight} !important;
//         box-shadow: ${THEME_CONSTANTS.shadow.lg} !important;
//       }

//       .custom-menu .ant-menu-submenu-title {
//         height: 56px !important;
//         line-height: 56px !important;
//         margin: ${THEME_CONSTANTS.spacing.sm} 0 !important;
//         border-radius: ${THEME_CONSTANTS.radius.lg} !important;
//         font-weight: ${THEME_CONSTANTS.typography.h5.weight} !important;
//         font-size: ${isMobile ? THEME_CONSTANTS.typography.body.size : THEME_CONSTANTS.typography.h5.size} !important;
//         padding: 0 ${THEME_CONSTANTS.spacing.xl} !important;
//         transition: ${THEME_CONSTANTS.transition.normal} !important;
//         display: flex !important;
//         align-items: center !important;
//         justify-content: flex-start !important;
//       }

//       .custom-menu .ant-menu-submenu-title:hover {
//         background-color: ${THEME_CONSTANTS.colors.primaryLight} !important;
//         color: ${THEME_CONSTANTS.colors.primary} !important;
//         box-shadow: ${THEME_CONSTANTS.shadow.md} !important;
//       }

//       .custom-menu .ant-menu-sub {
//         background: transparent !important;
//       }

//       .custom-menu .ant-menu-sub .ant-menu-item {
//         height: 48px !important;
//         line-height: 48px !important;
//         margin-left: ${THEME_CONSTANTS.spacing.xxl} !important;
//         font-size: ${THEME_CONSTANTS.typography.body.size} !important;
//         font-weight: ${THEME_CONSTANTS.typography.label.weight} !important;
//       }

//       .custom-menu .ant-menu-item .anticon,
//       .custom-menu .ant-menu-submenu-title .anticon {
//         margin-right: ${THEME_CONSTANTS.spacing.lg} !important;
//         font-size: ${isMobile ? '18px' : '20px'} !important;
//       }
//     `;
//         const styleEl = document.createElement('style');
//         styleEl.textContent = menuStyles;
//         document.head.appendChild(styleEl);
//         return () => document.head.removeChild(styleEl);
//     }, [isMobile]);

//     // ----- MENU DATA -----
//     const menuItems = isAdmin
//         ? [
//             {
//                 key: 'dashboard',
//                 icon: <DashboardOutlined className="text-xl" />,
//                 label: 'Dashboard',
//                 onClick: () => navigate('/admin/dashboard'),
//             },
//             {
//                 key: 'campaigns',
//                 icon: <SendOutlined className="text-xl" />,
//                 label: 'Campaigns',
//                 children: [
//                     {
//                         key: 'send-message',
//                         icon: <MessageOutlined className="text-lg" />,
//                         label: 'Send Campaign',
//                         onClick: () => navigate('/send-message'),
//                     },
//                     {
//                         key: 'campaigns-list',
//                         icon: <EyeOutlined className="text-lg" />,
//                         label: 'All Campaigns',
//                         onClick: () => navigate('/campaigns'),
//                     },
//                     {
//                         key: 'scheduled',
//                         icon: <CalendarOutlined className="text-lg" />,
//                         label: 'Scheduled',
//                         onClick: () => navigate('/scheduled'),
//                     },
//                 ],
//             },
//             {
//                 key: 'User Management',
//                 icon: <UserOutlined className="text-xl" />,
//                 label: 'User Management',
//                 onClick: () => navigate('/admin/users'),
//             },
//             {
//                 key: 'wallet requests',
//                 icon: <CreditCardOutlined className="text-xl" />,
//                 label: 'Wallet Requests',
//                 onClick: () => navigate('/admin/wallet-requests'),
//             },
//              {
//                 key: 'reports',
//                 icon: <CreditCardOutlined className="text-xl" />,
//                 label: 'Reports',
//                 onClick: () => navigate('/admin/reports'),
//             },
//         ]
//         : [
//             {
//                 key: 'dashboard',
//                 icon: <HomeOutlined className="text-xl" />,
//                 label: 'Dashboard',
//                 onClick: () => navigate('/dashboard'),
//             },
//             {
//                 key: 'send-message',
//                 icon: <SendOutlined className="text-xl" />,
//                 label: 'Send Message',
//                 onClick: () => navigate('/send-message'),
//             },
//             {
//                 key: 'create-template',
//                 icon: <FileTextOutlined className="text-xl" />,
//                 label: 'Templates',
//                 onClick: () => navigate('/create-template'),
//             },
//             {
//                 key: 'reports',
//                 icon: <BarChartOutlined className="text-xl" />,
//                 label: 'Reports',
//                 onClick: () => navigate('/reports'),
//             },
//         ];

//     const userMenuItems = [
//         {
//             key: 'profile',
//             icon: <UserOutlined />,
//             label: 'Profile Settings',
//             onClick: () => navigate('/profile'),
//         },
//         {
//             key: 'settings',
//             icon: <SettingOutlined />,
//             label: 'Account Settings',
//             onClick: () => navigate('/settings'),
//         },
//         { type: 'divider' },
//         {
//             key: 'logout',
//             icon: <LogoutOutlined />,
//             label: 'Sign Out',
//             danger: true,
//             onClick: () => navigate('/login'),
//         },
//     ];

// // Sidebar Logo Component
// const SidebarLogo = () => (
//     <div 
//         style={{
//             display: 'flex',
//             alignItems: 'center',
//             gap: THEME_CONSTANTS.spacing.lg,
//             padding: `${THEME_CONSTANTS.spacing.lg} ${THEME_CONSTANTS.spacing.xl}`,
//             height: THEME_CONSTANTS.layout.headerHeight,
//             borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`,
//             background: THEME_CONSTANTS.colors.surface,
//         }}
//     >
//         <div 
//             style={{
//                 width: isMobile ? '40px' : '48px',
//                 height: isMobile ? '40px' : '48px',
//                 background: THEME_CONSTANTS.colors.primaryLight,
//                 border: `1px solid ${THEME_CONSTANTS.colors.primary}20`,
//                 borderRadius: THEME_CONSTANTS.radius.xl,
//                 display: 'flex',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 boxShadow: THEME_CONSTANTS.shadow.sm,
//                 flexShrink: 0,
//             }}
//         >
//             <MailOutlined 
//                 style={{
//                     color: THEME_CONSTANTS.colors.primary,
//                     fontSize: isMobile ? '20px' : '24px'
//                 }} 
//             />
//         </div>
//         <div style={{ flex: 1, minWidth: 0 }}>
//             <h1 
//                 style={{
//                     color: THEME_CONSTANTS.colors.text,
//                     fontWeight: THEME_CONSTANTS.typography.h4.weight,
//                     fontSize: isMobile ? THEME_CONSTANTS.typography.h5.size : THEME_CONSTANTS.typography.h4.size,
//                     lineHeight: THEME_CONSTANTS.typography.h4.lineHeight,
//                     margin: 0,
//                     whiteSpace: 'nowrap',
//                     overflow: 'hidden',
//                     textOverflow: 'ellipsis',
//                 }}
//             >
//                 RCS Hub
//             </h1>
//             <p 
//                 style={{
//                     fontSize: THEME_CONSTANTS.typography.caption.size,
//                     color: THEME_CONSTANTS.colors.textSecondary,
//                     fontWeight: THEME_CONSTANTS.typography.label.weight,
//                     margin: 0,
//                     whiteSpace: 'nowrap',
//                     overflow: 'hidden',
//                     textOverflow: 'ellipsis',
//                 }}
//             >
//                 Messaging Platform
//             </p>
//         </div>
//     </div>
// );

//     const SidebarProfile = () => (
//         <div 
//             style={{
//                 padding: THEME_CONSTANTS.spacing.xl,
//                 borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                 background: `linear-gradient(to bottom, ${THEME_CONSTANTS.colors.surface}, ${THEME_CONSTANTS.colors.background})`,
//             }}
//         >
//             <Dropdown menu={{ items: userMenuItems }} placement="topRight" trigger={['click']}>
//                 <div 
//                     style={{
//                         background: THEME_CONSTANTS.colors.surface,
//                         border: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                         borderRadius: THEME_CONSTANTS.radius.xl,
//                         padding: isMobile ? THEME_CONSTANTS.spacing.md : THEME_CONSTANTS.spacing.lg,
//                         cursor: 'pointer',
//                         transition: THEME_CONSTANTS.transition.normal,
//                         boxShadow: THEME_CONSTANTS.shadow.sm,
//                     }}
//                     className="hover:border-blue-200 hover:bg-blue-50 hover:shadow-md"
//                 >
//                     <div 
//                         style={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: THEME_CONSTANTS.spacing.md,
//                         }}
//                     >
//                         <Avatar
//                             size={isMobile ? 36 : 44}
//                             icon={<UserOutlined />}
//                             style={{
//                                 background: `linear-gradient(135deg, ${THEME_CONSTANTS.colors.primary}, ${THEME_CONSTANTS.colors.primaryDark})`,
//                                 color: THEME_CONSTANTS.colors.surface,
//                                 boxShadow: THEME_CONSTANTS.shadow.md,
//                                 flexShrink: 0,
//                             }}
//                         />
//                         <div style={{ flex: 1, minWidth: 0 }}>
//                             <h4 
//                                 style={{
//                                     color: THEME_CONSTANTS.colors.text,
//                                     fontWeight: THEME_CONSTANTS.typography.h6.weight,
//                                     fontSize: THEME_CONSTANTS.typography.bodySmall.size,
//                                     margin: 0,
//                                     whiteSpace: 'nowrap',
//                                     overflow: 'hidden',
//                                     textOverflow: 'ellipsis',
//                                 }}
//                             >
//                                 John Doe
//                             </h4>
//                             <p 
//                                 style={{
//                                     color: THEME_CONSTANTS.colors.primary,
//                                     fontSize: THEME_CONSTANTS.typography.caption.size,
//                                     fontWeight: THEME_CONSTANTS.typography.h6.weight,
//                                     margin: 0,
//                                     whiteSpace: 'nowrap',
//                                     overflow: 'hidden',
//                                     textOverflow: 'ellipsis',
//                                 }}
//                             >
//                                 Premium User
//                             </p>
//                         </div>
//                     </div>
//                 </div>
//             </Dropdown>
//         </div>
//     );

//     return (
//         <Layout className="min-h-screen bg-gray-50">
//             {/* Desktop sidebar */}
//             {isDesktop && (
//                 <Sider
//                     width={parseInt(THEME_CONSTANTS.layout.sidebarWidth)}
//                     style={{
//                         position: 'fixed',
//                         left: 0,
//                         top: 0,
//                         bottom: 0,
//                         zIndex: THEME_CONSTANTS.zIndex.fixed,
//                         background: THEME_CONSTANTS.colors.surface,
//                         boxShadow: THEME_CONSTANTS.shadow.lg,
//                         display: 'flex',
//                         flexDirection: 'column',
//                         height: '100vh',
//                     }}
//                 >
//                     <SidebarLogo />
//                     <div 
//                         style={{
//                             flex: 1,
//                             overflowY: 'auto',
//                             padding: `${THEME_CONSTANTS.spacing.xxl} 0`,
//                         }}
//                     >
//                         <Menu
//                             mode="inline"
//                             selectedKeys={[selectedKey]}
//                             items={menuItems}
//                             className="border-0 bg-transparent custom-menu"
//                             style={{ 
//                                 background: 'transparent',
//                                 padding: `0 ${THEME_CONSTANTS.spacing.lg}`,
//                             }}
//                         />
//                     </div>
//                     <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
//                         <SidebarProfile />
//                     </div>
//                 </Sider>
//             )}

//             {/* Mobile drawer */}
//             <Drawer
//                 placement="left"
//                 onClose={() => setDrawerVisible(false)}
//                 open={drawerVisible}
//                 closable={false}
//                 bodyStyle={{ padding: 0 }}
//                 width={isMobile ? '85vw' : parseInt(THEME_CONSTANTS.layout.sidebarWidth)}
//                 style={{ display: isDesktop ? 'none' : 'block' }}
//                 maskClosable
//                 zIndex={THEME_CONSTANTS.zIndex.modal}
//             >
//                 <Layout 
//                     style={{
//                         minHeight: '100vh',
//                         background: THEME_CONSTANTS.colors.surface,
//                         display: 'flex',
//                         flexDirection: 'column',
//                         position: 'relative',
//                     }}
//                 >
//                     <SidebarLogo />
//                     <div 
//                         style={{
//                             flex: 1,
//                             overflowY: 'auto',
//                             padding: `${THEME_CONSTANTS.spacing.xxl} 0`,
//                             paddingBottom: '120px',
//                         }}
//                     >
//                         <Menu
//                             mode="inline"
//                             selectedKeys={[selectedKey]}
//                             items={menuItems}
//                             onClick={() => setDrawerVisible(false)}
//                             className="border-0 bg-transparent custom-menu"
//                             style={{ 
//                                 background: 'transparent',
//                                 padding: `0 ${THEME_CONSTANTS.spacing.lg}`,
//                             }}
//                         />
//                     </div>
//                     <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
//                         <SidebarProfile />
//                     </div>
//                 </Layout>
//             </Drawer>

//             {/* Main layout */}
//             <Layout
//                 style={{
//                     minHeight: '100vh',
//                     background: THEME_CONSTANTS.colors.background,
//                     marginLeft: isDesktop ? THEME_CONSTANTS.layout.sidebarWidth : 0,
//                     transition: `margin-left ${THEME_CONSTANTS.transition.normal}`,
//                 }}
//             >
//                 {/* Header */}
//                 <Header 
//                     style={{
//                         position: 'sticky',
//                         top: 0,
//                         zIndex: THEME_CONSTANTS.zIndex.sticky,
//                         background: THEME_CONSTANTS.colors.surface,
//                         boxShadow: THEME_CONSTANTS.shadow.sm,
//                         borderBottom: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                         padding: `0 ${isMobile ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxxl}`,
//                         display: 'flex',
//                         alignItems: 'center',
//                         justifyContent: 'space-between',
//                         height: THEME_CONSTANTS.layout.headerHeight,
//                     }}
//                 >
//                     <div 
//                         style={{
//                             display: 'flex',
//                             alignItems: 'center',
//                             gap: THEME_CONSTANTS.spacing.lg,
//                             flex: 1,
//                         }}
//                     >
//                         {/* Mobile menu toggle */}
//                         {!isDesktop && (
//                             <Button
//                                 type="text"
//                                 size={isMobile ? 'middle' : 'large'}
//                                 icon={
//                                     drawerVisible ? (
//                                         <CloseOutlined style={{ fontSize: isMobile ? '16px' : '18px' }} />
//                                     ) : (
//                                         <MenuOutlined style={{ fontSize: isMobile ? '16px' : '18px' }} />
//                                     )
//                                 }
//                                 onClick={() => setDrawerVisible(!drawerVisible)}
//                                 style={{
//                                     color: THEME_CONSTANTS.colors.textSecondary,
//                                     borderRadius: THEME_CONSTANTS.radius.md,
//                                     transition: THEME_CONSTANTS.transition.normal,
//                                 }}
//                                 className="hover:text-blue-600 hover:bg-blue-50"
//                             />
//                         )}

//                         {/* Search */}
//                         {!isMobile && (
//                             <div style={{ display: 'flex', alignItems: 'center' }}>
//                                 <Input
//                                     placeholder="Search campaigns, templates, contacts..."
//                                     prefix={<SearchOutlined style={{ color: THEME_CONSTANTS.colors.textMuted }} />}
//                                     style={{
//                                         width: isDesktop ? '320px' : '240px',
//                                         height: THEME_CONSTANTS.forms.inputHeight,
//                                         borderRadius: THEME_CONSTANTS.radius.md,
//                                         borderColor: THEME_CONSTANTS.colors.border,
//                                         backgroundColor: THEME_CONSTANTS.colors.background,
//                                         fontSize: THEME_CONSTANTS.typography.body.size,
//                                         transition: THEME_CONSTANTS.transition.normal,
//                                     }}
//                                     className="hover:bg-white focus:bg-white"
//                                 />
//                             </div>
//                         )}
//                     </div>

//                     <Space size={isMobile ? 'middle' : 'large'} style={{ display: 'flex', alignItems: 'center' }}>
//                         <Dropdown
//                             menu={{ items: userMenuItems }}
//                             placement="bottomRight"
//                             trigger={['click']}
//                             arrow
//                         >
//                             <Button
//                                 type="text"
//                                 size={isMobile ? 'middle' : 'large'}
//                                 style={{
//                                     display: 'flex',
//                                     alignItems: 'center',
//                                     gap: THEME_CONSTANTS.spacing.md,
//                                     borderRadius: THEME_CONSTANTS.radius.md,
//                                     padding: `${THEME_CONSTANTS.spacing.sm} ${THEME_CONSTANTS.spacing.md}`,
//                                     transition: THEME_CONSTANTS.transition.normal,
//                                 }}
//                                 className="hover:bg-blue-50"
//                             >
//                                 <Avatar
//                                     size={isMobile ? 32 : 40}
//                                     icon={<UserOutlined />}
//                                     style={{
//                                         background: THEME_CONSTANTS.colors.primary,
//                                         color: THEME_CONSTANTS.colors.surface,
//                                     }}
//                                 />
//                                 {!isMobile && (
//                                     <div 
//                                         style={{
//                                             display: 'flex',
//                                             flexDirection: 'column',
//                                             alignItems: 'flex-start',
//                                             lineHeight: 1,
//                                         }}
//                                     >
//                                         <span 
//                                             style={{
//                                                 fontSize: THEME_CONSTANTS.typography.bodySmall.size,
//                                                 fontWeight: THEME_CONSTANTS.typography.h6.weight,
//                                                 color: THEME_CONSTANTS.colors.text,
//                                                 lineHeight: 1,
//                                                 marginBottom: '2px',
//                                             }}
//                                         >
//                                             John Doe
//                                         </span>
//                                         <span 
//                                             style={{
//                                                 fontSize: THEME_CONSTANTS.typography.caption.size,
//                                                 color: THEME_CONSTANTS.colors.primary,
//                                                 fontWeight: THEME_CONSTANTS.typography.label.weight,
//                                                 lineHeight: 1,
//                                             }}
//                                         >
//                                             Premium User
//                                         </span>
//                                     </div>
//                                 )}
//                             </Button>
//                         </Dropdown>
//                     </Space>
//                 </Header>

//                 {/* Content */}
//                 <Content 
//                     style={{
//                         padding: isMobile 
//                             ? THEME_CONSTANTS.layout.contentPaddingMobile 
//                             : THEME_CONSTANTS.layout.contentPadding,
//                         background: THEME_CONSTANTS.colors.background,
//                         minHeight: `calc(100vh - ${parseInt(THEME_CONSTANTS.layout.headerHeight) + parseInt(THEME_CONSTANTS.layout.footerHeight)}px)`,
//                     }}
//                 >
//                     <div 
//                         style={{
//                             maxWidth: THEME_CONSTANTS.layout.maxContentWidth,
//                             margin: '0 auto',
//                             width: '100%',
//                         }}
//                     >
//                         {children}
//                     </div>
//                 </Content>

//                 {/* Footer */}
//                 <Footer 
//                     style={{
//                         background: THEME_CONSTANTS.colors.surface,
//                         borderTop: `1px solid ${THEME_CONSTANTS.colors.border}`,
//                         textAlign: 'center',
//                         padding: `${THEME_CONSTANTS.spacing.xl} ${isMobile ? THEME_CONSTANTS.spacing.lg : THEME_CONSTANTS.spacing.xxxl}`,
//                         height: THEME_CONSTANTS.layout.footerHeight,
//                     }}
//                 >
//                     <div 
//                         style={{
//                             maxWidth: THEME_CONSTANTS.layout.maxContentWidth,
//                             margin: '0 auto',
//                         }}
//                     >
//                         <Space direction="vertical" size={THEME_CONSTANTS.spacing.md}>
//                             <p 
//                                 style={{
//                                     fontSize: THEME_CONSTANTS.typography.bodySmall.size,
//                                     fontWeight: THEME_CONSTANTS.typography.label.weight,
//                                     color: THEME_CONSTANTS.colors.text,
//                                     margin: 0,
//                                 }}
//                             >
//                                 © 2025 RCS Messaging Hub. All rights reserved.
//                             </p>
                        
//                         </Space>
//                     </div>
//                 </Footer>
//             </Layout>
//         </Layout>
//     );
// };

// export default MainLayout;
