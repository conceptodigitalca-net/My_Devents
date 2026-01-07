
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { LayoutDashboard, Users, Calendar, PenTool, LogOut, Bell, Moon, Sun, UserCog, ChevronLeft, ChevronRight, Building2, Armchair, Sofa, Tv } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, isDarkMode, toggleTheme }) => {
  const location = useLocation();
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isBuilder = location.pathname.includes('/builder') || location.pathname.includes('/venue-designer') || location.pathname.includes('/seating-chart') || location.pathname.includes('/screen-builder'); 

  const isActive = (path: string) => location.pathname === path 
    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
    : 'text-slate-400 hover:bg-slate-800 hover:text-white';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar */}
      {!isBuilder && (
      <aside 
        className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-slate-900 dark:bg-slate-950 text-white flex flex-col shadow-2xl z-30 border-r border-slate-800 transition-all duration-300 relative shrink-0`}
      >
        <button 
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-9 bg-indigo-600 text-white p-1 rounded-full shadow-lg border border-slate-800 hover:bg-indigo-700 transition-transform z-50"
        >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-6 border-b border-slate-800 flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center' : ''} h-20`}>
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-pink-500 rounded-lg shadow-lg shadow-indigo-500/50 flex-shrink-0"></div>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-2xl font-bold tracking-tight text-white">D'Events</h1>
            </div>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {!isSidebarCollapsed && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2 fade-in">Menu</p>
          )}
          
          <Link to="/" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive('/')} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Dashboard">
            <LayoutDashboard size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Dashboard</span>}
          </Link>

          {isSuperAdmin && (
            <>
              <Link to="/partners" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive('/partners')} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Manage Partners">
                <Building2 size={20} className="flex-shrink-0" />
                {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Manage Partners</span>}
              </Link>
              <Link to="/users" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive('/users')} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Manage Users">
                <UserCog size={20} className="flex-shrink-0" />
                {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Manage Users</span>}
              </Link>
            </>
          )}

          <Link to="/events" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive('/events')} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Events">
            <Calendar size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">{isSuperAdmin ? 'All Events' : 'My Events'}</span>}
          </Link>
          
          <Link to="/venue-select" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive('/venue-select')} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Venue Layouts">
            <Armchair size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Venue & Seating</span>}
          </Link>

          <Link to="/seating-select" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive('/seating-select')} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Assign Seats">
            <Sofa size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Assign Seats</span>}
          </Link>

          <Link to="/guests" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive('/guests')} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Guest Lists">
            <Users size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Guest Lists</span>}
          </Link>
          
          <Link to="/invitations" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive('/invitations')} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Invitations">
            <PenTool size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Invitations</span>}
          </Link>

          <Link to="/screens" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive('/screens')} ${isSidebarCollapsed ? 'justify-center' : ''}`} title="Welcome Screens">
            <Tv size={20} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-medium whitespace-nowrap">Welcome Screens</span>}
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50 dark:bg-slate-950/50">
          <div className={`flex items-center gap-3 mb-4 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
             <img 
               src={user.avatar} 
               alt={user.name} 
               className="w-10 h-10 rounded-full border-2 border-indigo-500/50 flex-shrink-0"
             />
             {!isSidebarCollapsed && (
               <div className="flex-1 min-w-0 overflow-hidden">
                 <p className="text-sm font-medium text-white truncate">{user.name}</p>
                 <p className="text-xs text-slate-400 truncate capitalize">{user.role.toLowerCase().replace('_', ' ')}</p>
               </div>
             )}
          </div>
          <button 
            onClick={onLogout} 
            className={`flex items-center justify-center space-x-2 w-full py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600 transition-all text-sm font-medium ${isSidebarCollapsed ? 'px-0' : ''}`}
            title="Sign Out"
          >
            <LogOut size={16} />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {!isBuilder && (
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-6 z-20 sticky top-0 transition-colors duration-300 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
               {location.pathname === '/' ? 'Overview' : location.pathname.substring(1).split('/')[0].replace('-', ' ').charAt(0).toUpperCase() + location.pathname.substring(1).split('/')[0].replace('-', ' ').slice(1)}
            </h2>
          </div>
          
          <div className="flex items-center space-x-6">
             <button 
                onClick={toggleTheme}
                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                title="Toggle Theme"
             >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             <button className="relative p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
             </button>
             <div className="h-8 w-px bg-slate-200 dark:bg-slate-700"></div>
             <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{new Date().toLocaleDateString()}</span>
             </div>
          </div>
        </header>
        )}

        <div className={`flex-1 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 ${isBuilder ? 'p-0 overflow-hidden' : 'p-8 overflow-y-auto scrollbar-hide'}`}>
          <div className={`${isBuilder ? 'h-full' : 'max-w-7xl mx-auto'}`}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
