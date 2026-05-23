/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Schedule, ScheduleCategory } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  FileText, 
  Plus, 
  Trash2, 
  Edit2, 
  Image as ImageIcon, 
  CloudSun, 
  ExternalLink, 
  ArrowRight,
  ChevronRight,
  Sparkles,
  Smile
} from 'lucide-react';

export const ScheduleTab: React.FC = () => {
  const { currentTrip, schedules, members, currentUser, addSchedule, updateSchedule, deleteSchedule } = useData();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Schedule | null>(null);
  
  // Form States
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('10:00');
  const [formCategory, setFormCategory] = useState<ScheduleCategory>('景點');
  const [formLocation, setFormLocation] = useState('');
  const [formMapsUrl, setFormMapsUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  // Generate date range based on start/end dates
  const datesList = useMemo(() => {
    if (!currentTrip) return [];
    const start = new Date(currentTrip.startDate);
    const end = new Date(currentTrip.endDate);
    const list: string[] = [];
    
    // limit safety to prevent infinite loop
    let loops = 0;
    const current = new Date(start);
    while (current <= end && loops < 30) {
      list.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
      loops++;
    }
    
    // Auto-select first date if none selected and dates available
    if (list.length > 0 && !selectedDate) {
      setSelectedDate(list[0]);
    }
    
    return list;
  }, [currentTrip, selectedDate]);

  // Weather simulations for dates list
  const weatherMap = useMemo(() => {
    const icons = ["晴空萬里 ☀️ 24°C", "微風櫻吹雪 🌸 20°C", "溫暖多雲 ⛅ 22°C", "綿綿細雨 🌧️ 17°C", "流星夜空 🌌 16°C"];
    const desc = [
      "最適合拍照的晴朗天氣，記得帶遮陽帽！",
      "起風了，吹落櫻花的微風超級舒適清涼。",
      "雲朵像柔軟的棉花糖，非常舒服的散步氣候。",
      "帶上一把透明雨傘，雨中的道頓堀與霓虹招牌別有一番街頭風味。",
      "今晚是絕佳的流星觀賞日，向許願星許願吧！"
    ];
    const map: { [key: string]: { condition: string; tip: string } } = {};
    datesList.forEach((date, i) => {
      const index = i % icons.length;
      map[date] = {
        condition: icons[index],
        tip: desc[index]
      };
    });
    return map;
  }, [datesList]);

  // Filter and sort schedules for the active date
  const filteredSchedules = useMemo(() => {
    return schedules
      .filter(s => s.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [schedules, selectedDate]);

  // Countdown Calculator
  const countdownText = useMemo(() => {
    if (!currentTrip) return '';
    const today = new Date();
    today.setHours(0,0,0,0);
    const start = new Date(currentTrip.startDate);
    start.setHours(0,0,0,0);
    const end = new Date(currentTrip.endDate);
    end.setHours(0,0,0,0);

    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `離出發還有 ${diffDays} 天！🎒`;
    } else if (today >= start && today <= end) {
      return `行程進行中！美好的一天 🌸`;
    } else {
      return `精彩旅程已圓滿落幕 🏕️`;
    }
  }, [currentTrip]);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormTime('10:00');
    setFormCategory('景點');
    setFormLocation('');
    setFormMapsUrl('');
    setFormNotes('');
    setFormImages([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Schedule) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormTime(item.time);
    setFormCategory(item.category);
    setFormLocation(item.location);
    setFormMapsUrl(item.mapsUrl);
    setFormNotes(item.notes);
    setFormImages(item.images || []);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsCompressing(true);
    const compressedList: string[] = [...formImages];
    for (let i = 0; i < files.length; i++) {
      if (compressedList.length >= 4) break; // Limit of 4 pictures per schedule item to avoid large local states
      try {
        const compressedBase64 = await compressImage(files[i], 500, 500, 0.6);
        compressedList.push(compressedBase64);
      } catch (err) {
        console.error("Compression failed:", err);
      }
    }
    setFormImages(compressedList);
    setIsCompressing(false);
  };

  const handleRemoveImage = (index: number) => {
    setFormImages(formImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const payload = {
      date: selectedDate,
      time: formTime,
      title: formTitle,
      category: formCategory,
      location: formLocation,
      mapsUrl: formMapsUrl,
      notes: formNotes,
      images: formImages
    };

    if (editingItem) {
      await updateSchedule(editingItem.id, payload);
    } else {
      await addSchedule(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要刪除這個行程嗎？🐕')) {
      await deleteSchedule(id);
    }
  };

  // Category Color Map
  const getCategoryTheme = (cat: ScheduleCategory) => {
    switch (cat) {
      case '景點':
        return { 
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-400', 
          dot: 'bg-emerald-500',
          badge: 'border-emerald-500 bg-emerald-100'
        };
      case '美食':
        return { 
          bg: 'bg-amber-50 text-amber-900 border-amber-400', 
          dot: 'bg-amber-500',
          badge: 'border-amber-400 bg-amber-100'
        };
      case '交通':
        return { 
          bg: 'bg-sky-50 text-sky-900 border-sky-400', 
          dot: 'bg-sky-500',
          badge: 'border-sky-400 bg-sky-100'
        };
      case '住宿':
        return { 
          bg: 'bg-purple-50 text-purple-900 border-purple-400', 
          dot: 'bg-purple-500',
          badge: 'border-purple-400 bg-purple-100'
        };
      default:
        return { 
          bg: 'bg-stone-50 text-stone-800 border-stone-400', 
          dot: 'bg-stone-500',
          badge: 'border-stone-400 bg-stone-100'
        };
    }
  };

  const currentDayIndex = datesList.indexOf(selectedDate) + 1;

  return (
    <div className="space-y-6">
      {/* 倒數計時 & 手帳標頭 */}
      {currentTrip && (
        <div className="relative p-5 bg-white border-[3px] border-cozy-gray rounded-3xl shadow-cozy overflow-hidden">
          <div className="absolute right-0 top-0 washi-tape-green w-28 h-6 rotate-12 -translate-y-1 translate-x-4"></div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <span className="font-mono text-xs text-warm-accent font-bold tracking-widest uppercase flex items-center gap-1">
                <Sparkles size={12} /> ITINERARY DISCOVERY LIST
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-warm-brown mt-1">
                {currentTrip.name}
              </h1>
              <p className="text-xs text-stone-500 font-medium tracking-wide mt-0.5">
                📅 {currentTrip.startDate} ~ {currentTrip.endDate} 🌿
              </p>
            </div>
            <div className="hand-badge bg-amber-100 text-warm-brown font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 self-start sm:self-auto shrink-0 select-none">
              <Smile size={14} className="text-warm-accent animate-bounce" />
              <span>{countdownText}</span>
            </div>
          </div>
        </div>
      )}

      {/* Date Horizontal Selector */}
      {datesList.length > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-warm-brown flex items-center gap-1">
              <Calendar size={13} /> 橫向翻閱行程日期：
            </span>
            <span className="text-xs text-stone-500 font-mono font-bold">
              第 {currentDayIndex} / {datesList.length} 天
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-3 pt-1 no-scrollbar scroll-smooth snap-x">
            {datesList.map((date, idx) => {
              const active = date === selectedDate;
              const formatted = new Date(date);
              const dayStr = formatted.getDate();
              const weekday = formatted.toLocaleDateString('zh-TW', { weekday: 'short' });
              return (
                <button
                  key={date}
                  id={`date-tab-${date}`}
                  onClick={() => setSelectedDate(date)}
                  className={`relative flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all cursor-pointer snap-center select-none ${
                    active
                      ? 'bg-forest border-forest text-white translate-y-[-2px] shadow-cozy-green'
                      : 'bg-white border-cozy-gray text-warm-brown hover:bg-stone-50 hover:translate-y-[-1px] shadow-sm'
                  }`}
                >
                  <span className="text-[10px] font-bold opacity-80">{weekday}</span>
                  <span className="text-2xl font-black tracking-tighter mt-1">{dayStr}</span>
                  <span className="text-[9px] font-mono mt-0.5 opacity-70">
                    Day {idx + 1}
                  </span>
                  {active && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full border-2 border-warm-brown"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Weather Card for Selected Date */}
      {selectedDate && weatherMap[selectedDate] && (
        <div className="p-4 bg-[#B4E4F5] border-[3px] border-[#90CAF9] rounded-3xl flex items-center gap-4 shadow-cozy animate-pop text-stone-700">
          <div className="p-3 bg-white border-[3px] border-[#90CAF9] rounded-2xl shrink-0">
            <CloudSun className="text-warm-accent animate-spin-slow" size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-warm-accent tracking-wider">今日大阪預報 🌿</div>
            <div className="text-sm font-bold text-warm-brown mt-0.5">
              {weatherMap[selectedDate].condition}
            </div>
            <div className="text-xs text-stone-500 mt-1">
              {weatherMap[selectedDate].tip}
            </div>
          </div>
        </div>
      )}

      {/* Scheduled Itinerary Timeline */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h2 className="text-base font-bold text-warm-brown flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-forest inline-block"></span>
            今日旅遊手札與時間線
          </h2>
          <button
            onClick={handleOpenAddModal}
            className="cursor-pointer bg-forest text-white hover:bg-forest-dark border-2 border-cozy-gray rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
          >
            <Plus size={14} /> 新增行程
          </button>
        </div>

        {filteredSchedules.length === 0 ? (
          <div className="p-8 text-center bg-white border-[3px] border-dashed border-cozy-gray rounded-3xl text-stone-500 space-y-2 select-none">
            <p className="text-sm font-bold">這一天還空空如也 🌲</p>
            <p className="text-xs">按下方的按鈕添加第一個行程卡片吧！</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-2 text-xs bg-amber-100 hover:bg-amber-200 border-2 border-cozy-gray px-4 py-1.5 rounded-full font-bold text-warm-brown cursor-pointer active:scale-95 transition-all inline-flex items-center gap-1"
            >
              <Plus size={12} /> 馬上新增
            </button>
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[3px] before:border-l-[3px] before:border-dashed before:border-cozy-gray before:bg-transparent">
            {filteredSchedules.map((item, index) => {
              const thm = getCategoryTheme(item.category);
              const creator = members.find(m => m.id === item.createdBy)?.name || '小島民';

              return (
                <div 
                  key={item.id}
                  className="relative animate-pop"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Timeline bullet dot */}
                  <div className={`absolute left-[-21px] top-1.5 w-4.5 h-4.5 rounded-full border-2 border-cozy-gray ${thm.dot} z-10 shadow-sm`}></div>
                  
                  {/* Custom Note Card */}
                  <div className="bg-white border-[3px] border-cozy-gray rounded-3xl p-4 shadow-cozy hover:translate-y-[-2px] hover:shadow-md transition-all space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-sm font-bold text-warm-brown flex items-center gap-1 bg-stone-100 border border-stone-300 px-1.5 py-0.5 rounded-md">
                          <Clock size={12} /> {item.time}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-stone-800 ${thm.badge}`}>
                          {item.category}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-stone-500 hover:text-forest hover:bg-stone-100 rounded-lg cursor-pointer"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-stone-500 hover:text-coral hover:bg-stone-100 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-warm-brown flex items-center gap-1">
                        {item.title}
                      </h3>
                      {item.location && (
                        <div className="flex items-center gap-1 text-xs text-stone-600 font-medium mt-1">
                          <MapPin size={12} className="text-coral shrink-0" />
                          <span>{item.location}</span>
                          {item.mapsUrl && (
                            <a
                              href={item.mapsUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-forest hover:underline inline-flex items-center gap-0.5 shrink-0 font-bold ml-1"
                            >
                              開啟地圖 <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {item.notes && (
                      <div className="p-2.5 bg-amber-50/50 border border-warm-brown/30 rounded-xl text-xs text-stone-700 leading-relaxed font-medium">
                        <FileText size={12} className="text-warm-accent inline mr-1" />
                        {item.notes}
                      </div>
                    )}

                    {/* Image attachments visual polaroid row */}
                    {item.images && item.images.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto py-1 no-scrollbar">
                        {item.images.map((base64, pi) => (
                          <div 
                            key={pi} 
                            className="shrink-0 bg-white border border-stone-300 p-1 rounded-sm shadow-xs rotate-[1deg] hover:rotate-0 transition-transform"
                          >
                            <img
                              src={base64}
                              alt="polaroid upload"
                              className="w-18 h-18 object-cover rounded-xs"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="text-[10px] text-stone-400 font-mono pt-1 border-t border-dashed border-stone-200 flex justify-between">
                      <span>By: {creator}</span>
                      <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insert/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[3px] border-cozy-gray rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-pop modal-stage">
            <div className="bg-forest px-4 py-3.5 border-b-[3px] border-cozy-gray text-white font-bold flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-sm sm:text-base">
                <ChevronRight size={16} /> {editingItem ? '編輯行程手札' : '添寫新日程'}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:text-stone-200 text-xl font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">行程名稱 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：嵐山小火車預約、清水寺參拜"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-sm text-warm-brown placeholder-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">時間 *</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-sm text-warm-brown"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">類別 *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as ScheduleCategory)}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-2 py-2 text-sm text-warm-brown"
                  >
                    <option value="景點">🌲 景點</option>
                    <option value="美食">🍜 美食</option>
                    <option value="交通">🚲 交通</option>
                    <option value="住宿">⛺ 住宿</option>
                    <option value="其他">🎁 其他</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">地點位置</label>
                <input
                  type="text"
                  placeholder="如：野宮神社、金閣寺"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-sm text-warm-brown placeholder-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">地圖外部連結碼 (Maps URL)</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={formMapsUrl}
                  onChange={(e) => setFormMapsUrl(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-sm text-warm-brown placeholder-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">精簡備註及隨手記</label>
                <textarea
                  placeholder="像是必吃名單、票價、集合時間等等..."
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-sm text-warm-brown placeholder-stone-400 resize-none"
                />
              </div>

              {/* Photo Upload Compressed List */}
              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1 flex justify-between">
                  <span>相片記錄 (最多 4 張，經自動壓縮處理)</span>
                  {isCompressing && <span className="text-forest animate-pulse">壓縮中...</span>}
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

                  {formImages.length < 4 && (
                    <label className="w-12 h-12 rounded-lg border-2 border-dashed border-stone-400 flex flex-col items-center justify-center text-stone-500 cursor-pointer hover:bg-stone-50">
                      <ImageIcon size={14} />
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
                  className="flex-1 border-2 border-warm-brown rounded-full px-4 py-2 text-xs font-bold text-warm-brown cursor-pointer hover:bg-stone-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isCompressing}
                  className="flex-1 bg-forest hover:bg-forest-dark text-white border-2 border-warm-brown rounded-full px-4 py-2 text-xs font-bold cursor-pointer active:scale-95 transition-all text-center"
                >
                  {editingItem ? '確認更動' : '儲存記錄'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
