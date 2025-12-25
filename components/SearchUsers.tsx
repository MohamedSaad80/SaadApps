
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db } from '../services/databaseService';

interface SearchUsersProps {
  currentUser: User;
  onAddFriend: (id: string) => void;
}

const SearchUsers: React.FC<SearchUsersProps> = ({ currentUser, onAddFriend }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchResults();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchResults = async () => {
    setLoading(true);
    const users = await db.searchUsers(currentUser.id, searchTerm);
    setResults(users);
    setLoading(false);
  };

  const getButtonState = (targetUser: User) => {
    if (currentUser.friends.includes(targetUser.id)) {
      return { text: 'Friends', disabled: true, className: 'bg-green-100 text-green-700 border border-green-200' };
    }
    if (currentUser.sentRequests.includes(targetUser.id)) {
      return { text: 'Sent', disabled: true, className: 'bg-gray-100 text-gray-500 border border-gray-200' };
    }
    if (currentUser.receivedRequests.includes(targetUser.id)) {
      return { text: 'Action Needed', disabled: true, className: 'bg-amber-100 text-amber-700 border border-amber-200' };
    }
    return { text: 'Connect', disabled: false, className: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg' };
  };

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="p-6">
        <h2 className="text-2xl font-black text-indigo-900 tracking-tighter uppercase">Discovery</h2>
        <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest">Global Directory</p>
        
        <div className="mt-6 relative">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Name or phone number..." 
            className="w-full pl-11 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm shadow-sm"
          />
          <div className="absolute left-4 top-4.5">
            {loading ? (
               <div className="animate-spin h-5 w-5 border-2 border-indigo-600 border-t-transparent rounded-full"></div>
            ) : (
               <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
        <div className="grid grid-cols-1 gap-4">
          {results.length === 0 && !loading ? (
            <div className="py-20 text-center text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto mb-6 flex items-center justify-center border-2 border-dashed border-gray-200">
                <svg className="w-10 h-10 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest opacity-50">No explorers found</p>
              <p className="text-[10px] mt-1 italic">Try searching for a phone number or full name</p>
            </div>
          ) : (
            results.map(targetUser => {
              const btn = getButtonState(targetUser);
              return (
                <div key={targetUser.id} className="p-4 bg-white rounded-3xl border border-gray-50 shadow-sm flex items-center justify-between hover:shadow-xl hover:scale-[1.02] transition-all animate-fade-in group">
                  <div className="flex items-center space-x-4">
                    <img src={targetUser.avatar} className="w-14 h-14 rounded-2xl border-2 border-indigo-50 shadow-sm transition-transform group-hover:rotate-3" alt="" />
                    <div className="min-w-0">
                      <h4 className="text-sm font-black text-gray-900 truncate tracking-tight">{targetUser.name}</h4>
                      <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">
                        {targetUser.showPhone ? targetUser.phone : 'Phone Private'}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium truncate mt-1 italic">{targetUser.bio || 'Available'}</p>
                    </div>
                  </div>
                  <button
                    disabled={btn.disabled}
                    onClick={() => onAddFriend(targetUser.id)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-90 ${btn.className}`}
                  >
                    {btn.text}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchUsers;
