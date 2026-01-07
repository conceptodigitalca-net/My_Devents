import React, { useState } from 'react';
import { UserRole } from '../types';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await onLogin(email, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl p-8 space-y-8 relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        
        <div className="text-center">
          <h2 className="mt-2 text-4xl font-bold text-white tracking-tight">D'Events</h2>
          <p className="mt-2 text-sm text-gray-300">
            Professional Event Management Platform
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 bg-gray-800/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 transition-all"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full px-3 py-3 border border-gray-600 bg-gray-800/50 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400 transition-all"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded border border-red-500/20">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
           <div className="relative">
             <div className="absolute inset-0 flex items-center">
               <div className="w-full border-t border-gray-600"></div>
             </div>
             <div className="relative flex justify-center text-sm">
               <span className="px-2 bg-slate-800 text-gray-400 rounded">Demo Credentials</span>
             </div>
           </div>
           
           <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-400">
              <div 
                className="bg-gray-800/50 p-2 rounded cursor-pointer hover:bg-gray-700 transition"
                onClick={() => { setEmail('admin@devents.com'); setPassword('password'); }}
              >
                  <p className="font-bold text-white">Super Admin</p>
                  <p>admin@devents.com</p>
              </div>
              <div 
                 className="bg-gray-800/50 p-2 rounded cursor-pointer hover:bg-gray-700 transition"
                 onClick={() => { setEmail('partner@devents.com'); setPassword('password'); }}
              >
                  <p className="font-bold text-white">Partner</p>
                  <p>partner@devents.com</p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Login;