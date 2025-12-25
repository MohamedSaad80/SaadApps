
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { db } from '../services/databaseService';
import { useLanguage } from '../LanguageContext';

interface ProfileSettingsProps {
  user: User;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user }) => {
  const { t, setLanguage, language, isRTL } = useLanguage();
  const [name, setName] = useState(user.name);
  const [avatar, setAvatar] = useState(user.avatar);
  const [bio, setBio] = useState(user.bio);
  const [showPhone, setShowPhone] = useState(user.showPhone ?? true);
  const [selectedLang, setSelectedLang] = useState(user.language || 'en');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    try {
      await db.updateProfile(user.id, { 
        name, 
        avatar, 
        bio, 
        showPhone, 
        language: selectedLang as 'en' | 'ar' 
      });
      setLanguage(selectedLang as 'en' | 'ar');
      setMessage({ type: 'success', text: t('success_profile') });
    } catch (e) {
      setMessage({ type: 'error', text: t('error_profile') });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("Image is too large. Please select an image smaller than 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="p-6">
        <h2 className="text-2xl font-black text-indigo-900 tracking-tighter uppercase">{t('settings')}</h2>
        <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest">{t('language_desc')}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="bg-white rounded-[3rem] border border-gray-100 p-8 shadow-sm">
          <div className="flex flex-col items-center mb-10">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative group cursor-pointer"
            >
              <img src={avatar} className="w-32 h-32 rounded-[2.5rem] border-4 border-indigo-50 shadow-xl object-cover transition-transform group-hover:scale-[1.02]" alt="Profile" />
              <div className="absolute inset-0 bg-indigo-900/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            
            <div className="mt-4 text-center">
              <p className="text-sm font-black text-gray-800 tracking-tight">{user.phone}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">{t('display_name')}</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-semibold"
                required
              />
            </div>

            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('language')}</label>
                <p className="text-[11px] text-gray-500 font-medium leading-tight">{t('language_desc')}</p>
              </div>
              <div className="flex bg-white rounded-xl p-1 shadow-inner border border-gray-100">
                <button 
                  type="button"
                  onClick={() => setSelectedLang('en')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedLang === 'en' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
                >EN</button>
                <button 
                  type="button"
                  onClick={() => setSelectedLang('ar')}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${selectedLang === 'ar' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-indigo-600'}`}
                >AR</button>
              </div>
            </div>
            
            <div className="bg-slate-50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('phone_visibility')}</label>
              </div>
              <button
                type="button"
                onClick={() => setShowPhone(!showPhone)}
                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showPhone ? 'bg-indigo-600' : 'bg-gray-200'}`}
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${showPhone ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
              </button>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1 text-indigo-600">{t('bio')}</label>
              <textarea 
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all text-sm font-semibold resize-none leading-relaxed"
              />
            </div>

            {message && (
              <div className={`p-5 rounded-[2rem] text-xs font-bold animate-fade-in flex items-center space-x-3 ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                <span>{message.text}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSaving ? t('syncing') : t('update_identity')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
