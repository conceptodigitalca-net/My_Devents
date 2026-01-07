
import React, { useState, useEffect, useContext, createContext } from 'react';
import { RouterProvider, createHashRouter, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { Calendar, Users as UsersIcon, Share2, TrendingUp, Clock } from 'lucide-react';
import Layout from './components/Layout';
import DynamicBuilder from './components/DynamicBuilder';
import WebBuilder from './components/WebBuilder';
import InvitationManager from './components/InvitationManager';
import Login from './components/Login';
import MyEvents from './components/MyEvents';
import ManagePartners from './components/ManagePartners';
import GuestManager from './components/GuestManager';
import GuestEventSelector from './components/GuestEventSelector';
import VenueEventSelector from './components/VenueEventSelector'; 
import VenueDesigner from './components/VenueDesigner'; 
import SeatingEventSelector from './components/SeatingEventSelector';
import SeatingChart from './components/SeatingChart';
import ScreenManager from './components/ScreenManager';
import ScreenBuilder from './components/ScreenBuilder';
import { UserRole, User } from './types';
import { loginUser, logoutUser, getCurrentSession } from './services/mockBackend';

// --- Auth Hook ---
const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setUser(session);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const user = await loginUser(email, pass);
    if (user) {
      setUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    logoutUser();
    setUser(null);
  };

  return { user, isLoading, login, logout };
};

// --- App Context ---
interface IAppContext {
    user: User | null;
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

const AppContext = createContext<IAppContext | null>(null);

const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useAppContext must be used within AppContext Provider");
    return context;
};

// --- Helper Components ---

// SafeRedirect ensures navigation happens after mount to avoid Router context race conditions
const SafeRedirect = ({ to }: { to: string }) => {
    const navigate = useNavigate();
    useEffect(() => {
        navigate(to, { replace: true });
    }, [navigate, to]);
    return null;
};

// --- Route Wrappers ---

const ProtectedLayout = () => {
    const { user, logout, isDarkMode, toggleTheme } = useAppContext();

    if (!user) {
        return <SafeRedirect to="/login" />;
    }

    return (
        <Layout user={user} onLogout={logout} isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
            <Outlet />
        </Layout>
    );
};

const LoginWrapper = () => {
    const { user, login } = useAppContext();

    if (user) {
        return <SafeRedirect to="/" />;
    }

    return <Login onLogin={login} />;
};

const DashboardWrapper = () => {
    const { user } = useAppContext();
    return <div className="animate-fade-in"><DashboardOverview user={user!} /></div>;
};

// Component Wrappers to pass user prop safely (Context Consumer Pattern)
const MyEventsWrapper = () => { const { user } = useAppContext(); return <MyEvents user={user!} />; };
const GuestEventSelectorWrapper = () => { const { user } = useAppContext(); return <GuestEventSelector user={user!} />; };
const VenueEventSelectorWrapper = () => { const { user } = useAppContext(); return <VenueEventSelector user={user!} />; };
const SeatingEventSelectorWrapper = () => { const { user } = useAppContext(); return <SeatingEventSelector user={user!} />; };
const InvitationManagerWrapper = () => { const { user } = useAppContext(); return <InvitationManager user={user!} />; };
const DynamicBuilderWrapper = () => { const { user } = useAppContext(); return <DynamicBuilder user={user!} />; };
const WebBuilderWrapper = () => { const { user } = useAppContext(); return <WebBuilder user={user!} />; };
const VenueDesignerWrapper = () => { const { user } = useAppContext(); return <VenueDesigner user={user!} />; };
const SeatingChartWrapper = () => { const { user } = useAppContext(); return <SeatingChart user={user!} />; };
const ScreenManagerWrapper = () => { const { user } = useAppContext(); return <ScreenManager user={user!} />; };
const ScreenBuilderWrapper = () => { const { user } = useAppContext(); return <ScreenBuilder user={user!} />; };

// --- Dashboard Component (Local) ---
const DashboardOverview: React.FC<{ user: User }> = ({ user }) => {
  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Total Events</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{isSuperAdmin ? '124' : '8'}</h3>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-3 rounded-xl">
                <Calendar size={24} />
            </div>
          </div>
          <div className="flex items-center text-sm">
             <TrendingUp size={16} className="text-green-500 mr-1" />
             <span className="text-green-600 font-medium">12% increase</span>
             <span className="text-slate-400 ml-2">vs last month</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">{isSuperAdmin ? 'Active Partners' : 'Total Views'}</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{isSuperAdmin ? '15' : '1,204'}</h3>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-3 rounded-xl">
                <UsersIcon size={24} />
            </div>
          </div>
           <div className="flex items-center text-sm">
             <span className="text-slate-600 dark:text-slate-400 font-medium">Platform wide metrics</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-all">
          <div className="flex items-start justify-between mb-4">
            <div>
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Invitations Sent</p>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{isSuperAdmin ? '89' : '45'}</h3>
            </div>
            <div className="bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 p-3 rounded-xl">
                <Share2 size={24} />
            </div>
          </div>
           <div className="flex items-center text-sm">
             <Clock size={16} className="text-orange-500 mr-1" />
             <span className="text-orange-600 font-medium">5 expiring soon</span>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6 transition-colors">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                      <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                              {isSuperAdmin ? 'P' : 'E'}
                          </div>
                          <div>
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{isSuperAdmin ? 'New Partner Registered' : 'New RSVP Received'}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">2 hours ago</p>
                          </div>
                      </div>
                      <button className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">View</button>
                  </div>
              ))}
          </div>
      </div>
    </div>
  );
};

const ManageUsers: React.FC = () => <div className="text-center p-10 text-slate-500">User Management Coming Soon</div>;


// --- Router Definition ---
// Must use createHashRouter (Data Router) to support features like useBlocker
const router = createHashRouter([
    {
      path: "/login",
      element: <LoginWrapper />
    },
    {
      path: "/",
      element: <ProtectedLayout />,
      children: [
        { index: true, element: <DashboardWrapper /> },
        { path: "partners", element: <ManagePartners /> }, 
        { path: "users", element: <ManageUsers /> },
        { path: "events", element: <MyEventsWrapper /> },
        { path: "guests", element: <GuestEventSelectorWrapper /> },
        { path: "events/:eventId/guests", element: <GuestManager /> },
        { path: "venue-select", element: <VenueEventSelectorWrapper /> },
        { path: "venue-designer/:eventId", element: <VenueDesignerWrapper /> },
        { path: "seating-select", element: <SeatingEventSelectorWrapper /> },
        { path: "seating-chart/:eventId", element: <SeatingChartWrapper /> },
        { path: "invitations", element: <InvitationManagerWrapper /> },
        { path: "builder/dynamic/:invitationId", element: <DynamicBuilderWrapper /> },
        { path: "builder/web/:invitationId", element: <WebBuilderWrapper /> },
        { path: "builder", element: <Navigate to="/invitations" replace /> },
        { path: "screens", element: <ScreenManagerWrapper /> },
        { path: "screen-builder/:designId", element: <ScreenBuilderWrapper /> },
        { path: "*", element: <Navigate to="/" replace /> }
      ]
    }
]);

// --- Main App Logic ---

const App: React.FC = () => {
  const { user, isLoading, login, logout } = useAuth();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ user, login, logout, isDarkMode, toggleTheme }}>
      <RouterProvider router={router} />
    </AppContext.Provider>
  );
};

export default App;
