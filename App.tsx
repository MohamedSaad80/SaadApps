
import React, { useState, useEffect } from 'react';
import { User } from './types';
import { db } from './services/databaseService';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { LanguageProvider } from './LanguageContext';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = db.onAuthChange((userData) => {
      setUser(userData);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribeUser = db.subscribeToUser(user.id, (updatedUser) => {
      setUser(updatedUser);
    });
    return () => unsubscribeUser();
  }, [user?.id]);

  const handleLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      await db.login(email, password);
    } catch (error: any) {
      let msg = error.message;
      if (error.code === 'auth/invalid-credential') {
        msg = "Invalid email or password. Please try again or join us!";
      }
      alert("Oops! " + msg);
      setLoading(false);
    }
  };

  const handleRegister = async (name: string, email: string, phone: string, password: string) => {
    setLoading(true);
    try {
      await db.register(name, email, phone, password);
    } catch (error: any) {
      alert("Registration failed: " + error.message);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await db.logout();
    setUser(null);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-indigo-50/20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent shadow-xl"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
          </div>
        </div>
        <p className="mt-6 text-indigo-900/40 font-black uppercase tracking-widest text-[10px]">Saad Social App</p>
      </div>
    );
  }

  return (
    <LanguageProvider initialLanguage={user?.language || 'en'}>
      <div className="min-h-screen font-sans selection:bg-indigo-100 overflow-hidden">
        {!user ? (
          <Login onLogin={handleLogin} onRegister={handleRegister} />
        ) : (
          <Dashboard user={user} onLogout={handleLogout} />
        )}
      </div>
    </LanguageProvider>
  );
};

export default App;
