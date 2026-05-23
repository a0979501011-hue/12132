/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { compressImage } from '../utils/imageCompressor';
import { 
  Users, 
  User, 
  Camera, 
  Smile, 
  Clock, 
  UserCheck, 
  Edit3, 
  BadgeCheck,
  Award,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80', // Nook style
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80', // Isabelle style
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', // KK style
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', // Alice style
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80', // Isabelle 2
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80'  // Boy style
];

export const MembersTab: React.FC = () => {
  const { currentTrip, members, currentUser, upsertMember, isCloudSyncing, loginWithGoogle, logout } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [formName, setFormName] = useState(currentUser?.name || '');
  const [formAvatar, setFormAvatar] = useState(currentUser?.avatarUrl || PRESET_AVATARS[0]);
  const [isCompressing, setIsCompressing] = useState(false);

  const handleStartEdit = () => {
    setFormName(currentUser?.name || '');
    setFormAvatar(currentUser?.avatarUrl || PRESET_AVATARS[0]);
    setIsEditing(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsCompressing(true);
    try {
      // Compress and scale down avatar to ultra-compact base64 size (around 15-20KB Jpeg)
      const compressedAvatar = await compressImage(files[0], 250, 250, 0.7);
      setFormAvatar(compressedAvatar);
    } catch (err) {
      console.error("Avatar compression failed:", err);
    }
    setIsCompressing(false);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    await upsertMember(formName.trim(), formAvatar);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Visual membership banner */}
      <div className="relative bg-white border-[3px] border-cozy-gray rounded-3xl p-5 shadow-cozy overflow-hidden">
        <div className="absolute right-0 top-0 washi-tape-green w-28 h-6 rotate-12 -translate-y-1 translate-x-4"></div>
        <div>
          <span className="font-mono text-xs text-warm-accent font-bold tracking-widest uppercase flex items-center gap-1">
            <Users size={12} /> ISLAND TRAVEL CREW LOG
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-warm-brown mt-1">小組團員與地籍登記</h1>
          <p className="text-xs text-stone-500">查看這趟大阪之旅的所有隨行島民，隨時可在下方編輯您自定義的名字與頭像表情！</p>
        </div>
      </div>

      {/* Profile Settings (My Card Editor) */}
      {currentUser && (
        <div className="bg-white border-[3px] border-cozy-gray rounded-3xl p-5 shadow-cozy space-y-4 animate-pop">
          <div className="flex justify-between items-center border-b border-dashed border-stone-200 pb-3">
            <h3 className="text-sm font-black text-warm-brown flex items-center gap-1.5">
              <UserCheck size={14} className="text-warm-accent" />
              我當前的島民證件 (旅行身分)
            </h3>
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="cursor-pointer text-xs bg-amber-100 hover:bg-amber-200 border border-cozy-gray font-bold text-warm-brown px-3 py-1 rounded-full flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <Edit3 size={11} /> 變更有型頭誌
              </button>
            )}
          </div>

          {isEditing ? (
            /* Editable profile mode form */
            <form onSubmit={handleSubmitProfile} className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Profile picture attachment previews */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-2 border-cozy-gray overflow-hidden bg-stone-100">
                    <img 
                      src={formAvatar} 
                      alt="Avatar preview" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <label className="absolute bottom-0 right-0 p-1.5 bg-forest hover:bg-forest-dark border border-cozy-gray text-white rounded-full cursor-pointer hover:scale-105 transition-all">
                    <Camera size={11} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={isCompressing}
                    />
                  </label>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <label className="block text-[10px] font-black font-mono text-stone-400">ISLAND NICKNAME *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-cozy-gray rounded-xl px-3 py-1.5 text-xs text-warm-brown font-bold"
                    placeholder="輸入您的旅行暱稱"
                  />
                </div>
              </div>

              {/* Grid of default presets avatars */}
              <div className="space-y-2">
                <span className="block text-[10px] font-black font-mono text-stone-400">快速套用內建表情 Presets：</span>
                <div className="flex gap-2 pb-1 overflow-x-auto no-scrollbar">
                  {PRESET_AVATARS.map((pUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormAvatar(pUrl)}
                      className={`cursor-pointer shrink-0 w-11 h-11 rounded-full border-2 overflow-hidden transition-transform active:scale-95 ${
                        formAvatar === pUrl ? 'border-forest ring-offset-1 scale-105' : 'border-cozy-gray opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={pUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-dashed border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 border-2 border-cozy-gray rounded-full px-4 py-1.5 text-xs font-bold text-warm-brown cursor-pointer hover:bg-stone-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="flex-1 bg-forest hover:bg-forest-dark text-white border-2 border-cozy-gray rounded-full px-4 py-1.5 text-xs font-bold cursor-pointer active:scale-95 transition-all text-center"
                >
                  {isCompressing ? '處理中...' : '確認變更'}
                </button>
              </div>

            </form>
          ) : (
            /* Flat view profile card */
            <div className="flex items-center gap-3.5 bg-stone-50/50 p-3.5 rounded-2xl border-2 border-cozy-gray select-none">
              <div className="w-14 h-14 rounded-full border-2 border-cozy-gray overflow-hidden shrink-0">
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-extrabold text-warm-brown leading-none">{currentUser.name}</h4>
                  <span className="text-[9px] bg-forest/10 text-forest border border-forest/30 rounded-full px-2 py-0.5 font-bold flex items-center gap-0.5">
                    <BadgeCheck size={10} /> 你
                  </span>
                </div>
                <p className="text-[10px] text-stone-500 font-mono font-medium leading-none">
                  👤 UID: {currentUser.id.substring(0, 8)}...
                </p>
                <p className="text-[9px] text-stone-400 font-mono leading-none">
                  加入時間: {new Date(currentUser.joinedAt).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid listing of all members */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-sm font-black text-warm-brown tracking-wider uppercase flex items-center gap-1.5">
            <Users size={14} className="text-forest" />
            隨行島民大會冊 ({members.length})
          </h2>

          <div className="flex items-center gap-2 text-[10px] font-mono font-bold">
            {isCloudSyncing ? (
              <div className="flex items-center gap-2">
                <span className="text-forest flex items-center gap-1 shrink-0">
                  <RefreshCw size={10} className="animate-spin" />
                  雲端同步中
                </span>
                {logout && (
                  <button
                    onClick={logout}
                    className="cursor-pointer text-[10px] text-stone-500 hover:text-red-500 bg-stone-100 hover:bg-stone-200 border border-stone-300 font-bold px-2 py-0.5 rounded-full shadow-sm active:scale-95 transition-all"
                  >
                    登出
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-amber-600 flex items-center gap-1 shrink-0">
                  離線預覽模式
                </span>
                {loginWithGoogle && (
                  <button
                    onClick={loginWithGoogle}
                    className="cursor-pointer text-[10px] bg-sky-100 hover:bg-sky-200 border border-cozy-gray font-bold text-sky-800 px-2.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm active:scale-95 transition-all"
                  >
                    ✨ 登入 Google
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {members.map((item, index) => {
            const isMe = item.id === currentUser?.id;
            return (
              <div
                key={item.id}
                className="bg-white border-[3px] border-cozy-gray p-4 rounded-3xl shadow-cozy hover:translate-y-[-1px] transition-all flex flex-col items-center text-center gap-2.5 relative overflow-hidden animate-pop"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Little leaf sticker as corner decoration */}
                <div className="absolute top-2 right-2 text-forest/15 select-none rounded-full">
                  🍃
                </div>

                <div className="w-14 h-14 rounded-full border-2 border-cozy-gray overflow-hidden shadow-sm shrink-0">
                  <img
                    src={item.avatarUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="space-y-1 w-full truncate">
                  <span className="text-xs font-black text-warm-brown block truncate leading-tight">
                    {item.name}
                  </span>
                  {isMe ? (
                    <span className="text-[8px] bg-forest text-white border border-cozy-gray rounded-full px-2 py-0.5 font-bold uppercase inline-block">
                      Me
                    </span>
                  ) : (
                    <span className="text-[8px] bg-stone-100 text-stone-400 border border-stone-200 rounded-full px-2 py-0.5 font-bold tracking-wider inline-block">
                      島民
                    </span>
                  )}
                </div>

                <div className="text-[9px] text-stone-400 font-mono pt-1 text-center border-t border-dashed border-stone-100 w-full">
                  <Clock size={9} className="inline mr-1 text-stone-300" />
                  {new Date(item.joinedAt).toLocaleDateString()}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
