/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Journal } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  Camera, 
  Calendar, 
  User, 
  Heart, 
  FileText,
  Sparkles,
  Award
} from 'lucide-react';

export const JournalTab: React.FC = () => {
  const { currentTrip, journals, members, currentUser, addJournal, deleteJournal } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCompressing, setIsCompressing] = useState(false);

  // Likes simulation state is purely client side and very cozy!
  const [likedPosts, setLikedPosts] = useState<{ [key: string]: boolean }>({});

  const toggleLike = (id: string) => {
    setLikedPosts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormContent('');
    setFormImages([]);
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsCompressing(true);
    const list = [...formImages];
    for (let i = 0; i < files.length; i++) {
      if (list.length >= 6) break; // Limit of 6 pictures per diary entry
      try {
        const compressedBase64 = await compressImage(files[i], 600, 600, 0.6);
        list.push(compressedBase64);
      } catch (err) {
        console.error("Journal photo compression failed:", err);
      }
    }
    setFormImages(list);
    setIsCompressing(false);
  };

  const handleRemoveImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) return;

    await addJournal({
      date: formDate,
      title: formTitle,
      content: formContent,
      images: formImages
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Hand journal scrapbook introduction banner */}
      <div className="relative bg-white border-[3px] border-cozy-gray rounded-3xl p-5 shadow-cozy overflow-hidden">
        <div className="absolute right-0 top-0 washi-tape-green w-28 h-6 rotate-12 -translate-y-1 translate-x-4"></div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="font-mono text-xs text-warm-accent font-bold tracking-widest uppercase flex items-center gap-1">
              <BookOpen size={12} /> COZY SCRAPBOOK STATION
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-warm-brown mt-1">旅行生活手札日誌</h1>
            <p className="text-xs text-stone-500 font-medium">記錄你們在旅途中的每個驚喜瞬間、手繪心情與風景隨筆！📸</p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="cursor-pointer bg-forest text-white border-2 border-cozy-gray hover:bg-forest-dark rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform shrink-0 self-start sm:self-auto"
          >
            <Plus size={14} /> 新增心情日誌
          </button>
        </div>
      </div>

      {/* Diary Feed list */}
      <div className="space-y-8 pb-4">
        {journals.length === 0 ? (
          <div className="p-12 text-center bg-white border-[3px] border-dashed border-cozy-gray rounded-3xl text-stone-500 space-y-2 select-none">
            <p className="text-sm font-bold">還沒有留下生活手帳 📔</p>
            <p className="text-xs">按下「新增心情日誌」貼下第一張旅行相片吧！</p>
          </div>
        ) : (
          journals.map((item, index) => {
            const author = members.find(m => m.id === item.authorId);
            const authorName = author?.name || '神祕島民';
            const authorAvatar = author?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80';
            const isLiked = likedPosts[item.id] || false;
            
            // Random slant angles for paper look realism
            const slantedStyle = index % 2 === 0 ? 'rotate-[-0.5deg]' : 'rotate-[0.5deg]';
            
            return (
              <article 
                key={item.id}
                className={`relative bg-white border-[3px] border-cozy-gray rounded-3xl p-5 shadow-cozy hover:shadow-md transition-shadow duration-300 ${slantedStyle} animate-pop`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Visual washi tape on each diary page inside scrapbook */}
                {index % 3 === 0 && <div className="absolute top-0 left-1/3 washi-tape-coral w-16 h-4.5 -translate-y-2 -rotate-2 opacity-85"></div>}
                {index % 3 === 1 && <div className="absolute top-0 right-1/4 washi-tape-green w-14 h-4 -translate-y-1.5 rotate-3 opacity-80"></div>}
                {index % 3 === 2 && <div className="absolute top-0 left-1/2 -translate-x-1/2 washi-tape-brown w-16 h-4 -translate-y-2 rotate-1 opacity-75"></div>}

                {/* Author profile attribute banner */}
                <div className="flex justify-between items-center pb-3 border-b border-dashed border-stone-200">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={authorAvatar}
                      alt={authorName}
                      className="w-8 h-8 rounded-full border border-cozy-gray object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <span className="text-xs font-bold text-warm-brown block leading-tight">{authorName}</span>
                      <span className="text-[9px] text-stone-400 font-mono block mt-0.5 flex items-center gap-0.5">
                        <Calendar size={10} /> {item.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleLike(item.id)}
                      className={`cursor-pointer p-1.5 rounded-lg border-2 transition-transform active:scale-90 ${
                        isLiked 
                          ? 'bg-rose-50 border-coral text-coral' 
                          : 'bg-stone-50 border-cozy-gray text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      <Heart size={14} fill={isLiked ? '#E78895' : 'transparent'} />
                    </button>
                    {(currentUser?.id === item.authorId || item.authorId === 'local-creator-id') && (
                      <button
                        onClick={async () => {
                          if (confirm('確定要撕掉這篇心情手帳嗎？📔')) {
                            await deleteJournal(item.id);
                          }
                        }}
                        className="cursor-pointer p-1.5 text-stone-400 hover:text-coral hover:bg-stone-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Journal body text */}
                <div className="space-y-4 pt-4">
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-warm-brown tracking-tight flex items-center gap-1.5">
                      <Sparkles size={14} className="text-warm-accent" />
                      {item.title}
                    </h3>
                  </div>

                  <div className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line font-medium text-justify">
                    {item.content}
                  </div>

                  {/* Attachment gallery of compact polaroids */}
                  {item.images && item.images.length > 0 && (
                    <div className="flex gap-4 pb-2 pt-1 overflow-x-auto no-scrollbar scroll-smooth">
                      {item.images.map((img, pi) => {
                        const rot = pi % 2 === 0 ? 'rotate-[-1.5deg]' : 'rotate-[1.5deg]';
                        return (
                          <div 
                            key={pi}
                            className={`shrink-0 bg-white border-2 border-cozy-gray p-2 pb-6 rounded-xs shadow-md ${rot} max-w-[200px] hover:rotate-0 hover:scale-105 transition-all duration-300`}
                          >
                            <img
                              src={img}
                              alt="travel scrapbook screenshot"
                              className="w-40 h-40 object-cover border border-stone-200 rounded-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-[9px] text-center text-stone-400 font-mono font-bold mt-2 tracking-widest">
                              #AMEMORY 🌿
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>

              </article>
            );
          })
        )}
      </div>

      {/* Add Journal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[3px] border-cozy-gray rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-pop modal-stage">
            <div className="bg-forest px-4 py-3.5 border-b-[3px] border-cozy-gray text-white font-bold flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-sm">
                <BookOpen size={16} /> 寫下旅行日記
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-stone-200 text-xl font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">手札日期 *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-2.5 py-1.5 text-xs text-warm-brown font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-400 mb-1">記錄人</label>
                  <div className="w-full bg-stone-100 border-2 border-stone-300 rounded-xl px-2.5 py-1.5 text-xs text-stone-500 font-bold">
                    👤 {currentUser?.name || '你'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">日記標題 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：清水寺的漂亮夕陽！🌸"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-sm text-warm-brown placeholder-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">心情隨筆日記內客 *</label>
                <textarea
                  required
                  placeholder="今天大家都去哪裡玩了？吃了什麼美味的蕎麥麵？快在此手寫記錄心情與趣事..."
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-xs text-warm-brown placeholder-stone-400 resize-none font-sans"
                />
              </div>

              {/* Photo Upload and Compressor */}
              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1 flex justify-between">
                  <span>多圖相片記錄 (最多 6 張，壓縮儲存)</span>
                  {isCompressing && <span className="text-forest animate-pulse">處理中...</span>}
                </label>
                <div className="flex gap-2 flex-wrap items-center">
                  {formImages.map((img, i) => (
                    <div key={i} className="relative w-12 h-12 border border-warm-brown rounded-md overflow-hidden">
                      <img src={img} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(i)}
                        className="absolute top-0 right-0 bg-red-400 text-white rounded-bl-sm w-4 h-4 text-[9px] flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {formImages.length < 6 && (
                    <label className="w-12 h-12 rounded-lg border-2 border-dashed border-stone-400 flex flex-col items-center justify-center text-stone-500 cursor-pointer hover:bg-stone-50">
                      <Camera size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isCompressing}
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-2 border-t border-dashed border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 border-2 border-cozy-gray rounded-full px-4 py-2 text-xs font-bold text-warm-brown cursor-pointer hover:bg-stone-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="flex-1 bg-forest hover:bg-forest-dark text-white border-2 border-cozy-gray rounded-full px-4 py-2 text-xs font-bold cursor-pointer active:scale-95 transition-all text-center"
                >
                  親手貼上
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
