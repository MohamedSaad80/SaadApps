import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { db } from '../services/databaseService';
import { GoogleGenAI } from "@google/genai";
import { PostCard } from './CommunityFeed';

interface ProfileHomeProps {
  user: User;
}

const ProfileHome: React.FC<ProfileHomeProps> = ({ user }) => {
  const [weather, setWeather] = useState<{ temp: number; condition: string } | null>(null);
  const [location, setLocation] = useState<{ city: string; country: string } | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('Welcome back!');
  const [prayers, setPrayers] = useState<any>(null);
  const [nextPrayer, setNextPrayer] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubFeed = db.subscribeToFeed(user.id, user.friends, (posts) => {
      const myPosts = posts.filter(p => p.authorId === user.id);
      setUserPosts(myPosts);
    });

    fetchExternalData();

    return () => {
      unsubFeed();
    };
  }, [user.id]);

  const fetchExternalData = () => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      
      try {
        const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
        const wData = await wRes.json();
        const condition = getConditionString(wData.current_weather.weathercode);
        const temp = Math.round(wData.current_weather.temperature);
        setWeather({ temp, condition });

        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const geoData = await geoRes.json();
        const city = geoData.address.city || geoData.address.town || geoData.address.village || 'Nearby';
        const country = geoData.address.country || '';
        setLocation({ city, country });

        generateAiAdvice(condition, temp, city);

        const pRes = await fetch(`https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=2`);
        const pData = await pRes.json();
        const timings = pData.data.timings;
        setPrayers(timings);
        findNextPrayer(timings);
      } catch (error) {
        console.error("External data fetch error:", error);
      } finally {
        setLoading(false);
      }
    }, () => {
      setLoading(false);
    });
  };

  const getConditionString = (code: number) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return 'Partly Cloudy';
    if (code >= 45 && code <= 48) return 'Foggy';
    if (code >= 51 && code <= 67) return 'Rain';
    return 'Overcast';
  };

  const generateAiAdvice = async (condition: string, temp: number, city: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I am at a personal social networking dashboard in ${city}. Current local weather is ${condition} at ${temp}°C. Give me one very short, helpful, and friendly sentence of lifestyle advice for today. Use a warm tone and a relevant emoji.`
      });
      setAiAdvice(response.text || "Have a wonderful day!");
    } catch (e) {
      setAiAdvice("Enjoy your day and stay positive! ✨");
    }
  };

  const findNextPrayer = (timings: any) => {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const order = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    for (const name of order) {
      const [h, m] = timings[name].split(':').map(Number);
      if (h * 60 + m > currentTime) {
        setNextPrayer(name);
        return;
      }
    }
    setNextPrayer('Fajr');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white">
        <div className="w-10 h-10 border-2 border-gray-100 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Loading Dashboard</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#F5F5F7] custom-scrollbar animate-fade-in pb-20">
      
      {/* Refined Minimalist Hero Section */}
      <section className="pt-12 pb-16 relative flex flex-col items-center">
        <div className="w-full max-w-5xl px-8">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="relative">
              <img 
                src={user.avatar} 
                className="w-40 h-40 md:w-48 md:h-48 rounded-full border-8 border-white shadow-xl bg-white object-cover" 
                alt={user.name} 
              />
              <div className="absolute bottom-2 right-2 w-8 h-8 bg-green-500 border-4 border-white rounded-full shadow-lg"></div>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight">{user.name}</h1>
              <p className="text-gray-500 font-medium text-sm mt-1">{user.bio || 'Digital Nomad'}</p>
            </div>
            
            <div className="flex space-x-4">
               <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-lg font-bold text-gray-900">{userPosts.length}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Stories</p>
               </div>
               <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100">
                  <p className="text-lg font-bold text-gray-900">{user.friends.length}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Mutuals</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      <div className="px-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="space-y-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] px-4">Recent Stories</h3>
            {userPosts.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm">
                <p className="text-gray-400 text-sm font-medium">No stories captured yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {userPosts.map(post => (
                  <PostCard key={post.id} post={post} user={user} />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* Weather Widget */}
          <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 group">
             <div className="flex justify-between items-center mb-6">
                <div>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Local</p>
                   <h4 className="text-xl font-bold text-gray-900">{location?.city}</h4>
                </div>
                <div className="text-3xl font-bold text-indigo-600">{weather?.temp}°</div>
             </div>
             <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-600 font-medium leading-relaxed italic">
                "{aiAdvice}"
             </div>
          </div>

          {/* Spiritual Widget */}
          <div className="bg-gray-900 rounded-[2rem] p-8 text-white shadow-lg overflow-hidden relative">
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Schedule</p>
              {nextPrayer && (
                <div className="px-3 py-1 bg-white/10 rounded-full">
                  <span className="text-[9px] font-bold uppercase tracking-widest">Next: {nextPrayer}</span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              {prayers && ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map(name => (
                <div key={name} className={`flex items-center justify-between p-3 rounded-xl transition-all ${nextPrayer === name ? 'bg-white text-gray-900' : 'text-gray-400'}`}>
                   <span className="text-[11px] font-bold uppercase tracking-widest">{name}</span>
                   <span className="text-xs font-mono">{prayers[name]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHome;