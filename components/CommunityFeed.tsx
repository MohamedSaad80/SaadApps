
import React, { useState, useEffect, useRef } from 'react';
import { User, Post } from '../types';
import { db } from '../services/databaseService';
import { GoogleGenAI } from "@google/genai";

interface CommunityFeedProps {
  user: User;
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = db.subscribeToFeed(user.id, user.friends, (newPosts) => {
      setPosts(newPosts);
    });
    return unsub;
  }, [user.id, user.friends]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPostImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async () => {
    if (!postText.trim() && !postImage) return;
    setIsPosting(true);
    try {
      await db.createPost(user, postText, postImage || undefined);
      setPostText('');
      setPostImage(null);
    } finally {
      setIsPosting(false);
    }
  };

  const suggestCaption = async () => {
    if (!postImage && !postText) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = postImage 
        ? "Look at this image description (optional) and draft text: '" + postText + "'. Suggest a catchy social media caption for this post."
        : "Draft text: '" + postText + "'. Rewrite this to be more engaging for a social feed.";
      
      const parts: any[] = [{ text: prompt }];
      if (postImage) {
        parts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: postImage.split(',')[1]
          }
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: { parts }
      });
      setPostText(response.text || postText);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 animate-fade-in overflow-hidden">
      <div className="p-6 bg-white border-b border-gray-100 flex-shrink-0">
        <h2 className="text-2xl font-black text-indigo-900 tracking-tighter uppercase">Community</h2>
        <p className="text-xs text-gray-400 mt-1 font-bold uppercase tracking-widest">Share with friends</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar space-y-6">
        {/* Create Post Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 animate-fade-in">
          <div className="flex space-x-4">
            <img src={user.avatar} className="w-12 h-12 rounded-2xl shadow-sm" alt="" />
            <div className="flex-1">
              <textarea 
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full bg-gray-50 rounded-2xl p-4 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all resize-none min-h-[100px]"
              />
              
              {postImage && (
                <div className="mt-4 relative group">
                  <img src={postImage} className="max-h-64 rounded-2xl object-cover w-full border border-gray-100" alt="Preview" />
                  <button 
                    onClick={() => setPostImage(null)}
                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex space-x-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                    title="Upload Image"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </button>
                  <button 
                    onClick={suggestCaption}
                    disabled={isGenerating || (!postText && !postImage)}
                    className="flex items-center space-x-2 px-4 py-2 text-violet-600 hover:bg-violet-50 rounded-xl transition-all disabled:opacity-30"
                  >
                    <svg className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">AI Caption</span>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
                <button 
                  onClick={handleCreatePost}
                  disabled={isPosting || (!postText.trim() && !postImage)}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-6 pb-12">
          {posts.length === 0 ? (
            <div className="py-20 text-center text-gray-300">
              <p className="text-sm font-black uppercase tracking-widest">No stories yet</p>
              <p className="text-[10px] mt-1">Be the first to post something amazing!</p>
            </div>
          ) : (
            posts.map(post => <PostCard key={post.id} post={post} user={user} />)
          )}
        </div>
      </div>
    </div>
  );
};

// Exporting PostCard for reuse in ProfileHome
export const PostCard: React.FC<{ post: Post, user: User }> = ({ post, user }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await db.addComment(post.id, user, commentText);
    setCommentText('');
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
    return new Date(ts).toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in group hover:shadow-xl transition-all duration-500">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <img src={post.authorAvatar} className="w-10 h-10 rounded-xl" alt="" />
            <div>
              <h4 className="text-sm font-black text-gray-900 tracking-tight">{post.authorName}</h4>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{formatTime(post.timestamp)}</p>
            </div>
          </div>
        </div>

        <p className="text-[14px] text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{post.text}</p>
        
        {post.image && (
          <div className="rounded-2xl overflow-hidden mb-4 border border-gray-50">
            <img src={post.image} className="w-full h-auto object-cover max-h-[500px]" alt="" />
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex space-x-1">
            <ReactionButton type="like" emoji="👍" count={post.reactions.like.length} active={post.reactions.like.includes(user.id)} onClick={() => db.addReaction(post.id, user.id, 'like')} />
            <ReactionButton type="love" emoji="❤️" count={post.reactions.love.length} active={post.reactions.love.includes(user.id)} onClick={() => db.addReaction(post.id, user.id, 'love')} />
            <ReactionButton type="haha" emoji="😆" count={post.reactions.haha.length} active={post.reactions.haha.includes(user.id)} onClick={() => db.addReaction(post.id, user.id, 'haha')} />
          </div>
          
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-[11px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            <span>{post.comments.length} Comments</span>
          </button>
        </div>

        {showComments && (
          <div className="mt-6 pt-6 border-t border-gray-50 space-y-4 animate-fade-in">
            {post.comments.map(comment => (
              <div key={comment.id} className="flex space-x-3 group/comment">
                <img src={comment.authorAvatar} className="w-8 h-8 rounded-lg shadow-sm" alt="" />
                <div className="flex-1 bg-gray-50 rounded-2xl p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-black text-gray-900">{comment.authorName}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase">{formatTime(comment.timestamp)}</span>
                  </div>
                  <p className="text-xs text-gray-600">{comment.text}</p>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} className="flex items-center space-x-2 mt-4">
              <img src={user.avatar} className="w-8 h-8 rounded-lg" alt="" />
              <input 
                type="text" 
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..." 
                className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-indigo-200 transition-all"
              />
              <button type="submit" className="p-2 text-indigo-600 hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/></svg>
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

const ReactionButton: React.FC<{ emoji: string, count: number, active: boolean, onClick: () => void, type: string }> = ({ emoji, count, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
      active ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
    }`}
  >
    <span>{emoji}</span>
    {count > 0 && <span>{count}</span>}
  </button>
);

export default CommunityFeed;
