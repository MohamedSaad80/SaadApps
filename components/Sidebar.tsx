import React from 'react';
import { User } from '../types';
import { db } from '../services/databaseService';
import { useLanguage } from '../LanguageContext';

interface SidebarProps {
  user: User;
  friends: User[];
  pendingRequests: User[];
  unreadMap: Record<string, number>;
  selectedId: string | null;
  onSelectFriend: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, friends, pendingRequests, unreadMap, selectedId, onSelectFriend }) => {
  const { t, isRTL } = useLanguage();
  return (
    <div className="flex flex-col h-full animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-4">{t('inbox')}</h2>
        <div className="relative group">
          <input 
            type="text" 
            placeholder={t('search_convos')}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all text-xs"
          />
          <svg className={`w-3.5 h-3.5 absolute top-3 text-gray-400 ${isRTL ? 'right-4' : 'left-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
        {pendingRequests.length > 0 && (
          <div className="mb-6">
            <h3 className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">{t('requests')}</h3>
            <div className="space-y-2">
              {pendingRequests.map(req => (
                <div key={req.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 transition-all">
                  <div className="flex items-center space-x-3 mb-3">
                    <img src={req.avatar} className="w-8 h-8 rounded-full" alt="" />
                    <p className="text-xs font-bold text-gray-900 truncate">{req.name}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => db.acceptFriendRequest(user.id, req.id)}
                      className="flex-1 bg-gray-900 text-white text-[10px] font-bold py-1.5 rounded-xl active:scale-95 transition-transform"
                    >
                      {t('accept')}
                    </button>
                    <button 
                      onClick={() => db.rejectFriendRequest(user.id, req.id)}
                      className="flex-1 bg-white text-gray-400 text-[10px] font-bold py-1.5 rounded-xl border border-gray-100 active:scale-95 transition-transform"
                    >
                      {t('ignore')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1">
          {friends.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-xs text-gray-300 font-medium">{t('no_active_chats')}</p>
            </div>
          ) : (
            friends.map(friend => {
              const unread = unreadMap[friend.id] || 0;
              return (
                <button
                  key={friend.id}
                  onClick={() => onSelectFriend(friend.id)}
                  className={`w-full p-3 flex items-center space-x-3 rounded-2xl transition-all border ${
                    selectedId === friend.id 
                      ? 'bg-gray-100 border-gray-100 shadow-sm' 
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={friend.avatar} className="w-11 h-11 rounded-full border border-gray-50" alt="" />
                    <div className={`absolute bottom-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full ${isRTL ? 'left-0' : 'right-0'}`}></div>
                  </div>
                  <div className={`flex-1 text-${isRTL ? 'right' : 'left'} min-w-0`}>
                    <div className="flex justify-between items-center">
                      <h4 className={`text-xs font-bold truncate ${unread > 0 ? 'text-gray-900' : 'text-gray-600'}`}>{friend.name}</h4>
                      {unread > 0 && (
                        <span className="flex-shrink-0 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] truncate mt-0.5 text-gray-400 font-medium">
                      {friend.bio || 'Available'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;