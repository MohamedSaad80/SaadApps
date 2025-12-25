import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/databaseService';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import SearchUsers from './SearchUsers';
import ProfileSettings from './ProfileSettings';
import AIChat from './AIChat';
import CommunityFeed from './CommunityFeed';
import ProfileHome from './ProfileHome';
import { useLanguage } from '../LanguageContext';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const { t, isRTL } = useLanguage();
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'chats' | 'search' | 'settings' | 'ai-assistant' | 'community'>('profile');
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<User[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (activeTab !== 'chats') setSelectedFriendId(null);
  }, [activeTab]);

  useEffect(() => {
    let isMounted = true;
    const fetchRelatedUsers = async () => {
      try {
        const friendPromises = user.friends.map(id => db.getUser(id));
        const requestPromises = user.receivedRequests.map(id => db.getUser(id));
        
        const [friendResults, requestResults] = await Promise.all([
          Promise.all(friendPromises),
          Promise.all(requestPromises)
        ]);
        
        if (isMounted) {
          setFriends(friendResults.filter((u): u is User => u !== null));
          setPendingRequests(requestResults.filter((u): u is User => u !== null));
        }
      } catch (error) {
        console.error("Error fetching related users:", error);
      }
    };

    fetchRelatedUsers();
    return () => { isMounted = false; };
  }, [user.friends, user.receivedRequests]);

  useEffect(() => {
    const unsub = db.subscribeToAllUnread(user.id, (map) => {
      setUnreadMap(map);
    });
    return unsub;
  }, [user.id]);

  const totalUnread = Object.values(unreadMap).reduce((a, b) => a + b, 0);

  const NavItem = ({ tab, icon, label, badge }: { tab: typeof activeTab, icon: React.ReactNode, label: string, badge?: number }) => (
    <button 
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 relative ${
        activeTab === tab 
          ? 'bg-gray-900 text-white shadow-lg' 
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
      } ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}
    >
      {icon}
      <span className="text-xs font-semibold tracking-tight hidden md:inline">{label}</span>
      {badge ? (
        <span className={`absolute -top-1 ${isRTL ? '-left-1' : '-right-1'} w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white`}>
          {badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <div className={`flex flex-col h-screen bg-[#F5F5F7] ${isRTL ? 'font-arabic' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Apple-Style Top Navigation Bar */}
      <header className="glass sticky top-0 z-50 border-b border-gray-100 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button 
            onClick={() => setActiveTab('profile')}
            className="flex items-center space-x-3 group"
          >
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-100 shadow-md group-active:scale-95 transition-transform">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900 hidden sm:inline">{t('app_name')}</span>
          </button>

          <nav className="flex items-center space-x-1">
            <NavItem 
              tab="chats" 
              label={t('inbox')} 
              badge={totalUnread}
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>} 
            />
            <NavItem 
              tab="community" 
              label={t('community')} 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2zM14 3v5h5M7 8h5M7 12h10M7 16h10"/></svg>} 
            />
            <NavItem 
              tab="search" 
              label={t('discovery')} 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>} 
            />
            <NavItem 
              tab="ai-assistant" 
              label={t('ai_assistant')} 
              icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>} 
            />
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${activeTab === 'settings' ? 'border-gray-900 shadow-md ring-2 ring-gray-100' : 'border-transparent hover:border-gray-200'}`}
          >
            <img src={user.avatar} className="w-full h-full object-cover" alt="profile" />
          </button>
          <div className="h-6 w-px bg-gray-200 mx-2"></div>
          <button 
            onClick={onLogout} 
            className="text-gray-400 hover:text-red-500 transition-colors p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'chats' || activeTab === 'search' || activeTab === 'settings' ? (
          <aside className={`w-full md:w-80 lg:w-96 flex flex-col bg-white ${isRTL ? 'border-l' : 'border-r'} border-gray-100 flex-shrink-0 z-40`}>
            {activeTab === 'chats' ? (
              <Sidebar 
                user={user} 
                friends={friends} 
                pendingRequests={pendingRequests}
                unreadMap={unreadMap}
                selectedId={selectedFriendId}
                onSelectFriend={setSelectedFriendId} 
              />
            ) : activeTab === 'search' ? (
              <SearchUsers 
                currentUser={user} 
                onAddFriend={(id) => db.sendFriendRequest(user.id, id)} 
              />
            ) : activeTab === 'settings' ? (
              <ProfileSettings user={user} />
            ) : null}
          </aside>
        ) : null}

        <div className="flex-1 overflow-hidden bg-white/50 relative">
          {activeTab === 'profile' ? (
            <ProfileHome user={user} />
          ) : activeTab === 'community' ? (
            <CommunityFeed user={user} />
          ) : activeTab === 'ai-assistant' ? (
            <AIChat user={user} />
          ) : selectedFriendId ? (
            <ChatWindow 
              currentUser={user} 
              targetId={selectedFriendId} 
            />
          ) : (
            <div className="hidden md:flex flex-1 flex-col h-full items-center justify-center text-gray-300 space-y-6">
              <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-gray-100">
                <svg className="w-10 h-10 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"/></svg>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-400 tracking-tight">{t('app_name')}</p>
                <p className="text-xs text-gray-300 mt-1 uppercase tracking-widest font-medium">Select a conversation to start</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;