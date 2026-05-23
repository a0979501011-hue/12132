/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Booking, BookingType } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { 
  Plane, 
  MapPin, 
  Key, 
  Lock, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  HelpCircle, 
  DollarSign, 
  Users, 
  Car, 
  Ticket, 
  Hotel,
  CheckCircle,
  FileText,
  Clock,
  Unlock,
  AlertCircle,
  Calendar,
  ArrowRight
} from 'lucide-react';

export const BookingTab: React.FC = () => {
  const { currentTrip, bookings, members, currentUser, addBooking, updateBooking, deleteBooking } = useData();
  const [activeType, setActiveType] = useState<BookingType | 'all'>('all');
  
  // Privacy Lock State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [showPinError, setShowPinError] = useState(false);
  const [tempUnlockedId, setTempUnlockedId] = useState<string | null>(null);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Booking | null>(null);
  const [formType, setFormType] = useState<BookingType>('flight');
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formDetails, setFormDetails] = useState('');
  const [formCost, setFormCost] = useState<number>(0);
  const [formCurrency, setFormCurrency] = useState('JPY');
  const [formPinCode, setFormPinCode] = useState('007');
  const [formFiles, setFormFiles] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  // Calculate split estimates
  const groupSize = members.length || 1;

  // Filter list
  const filteredBookings = bookings.filter(b => activeType === 'all' || b.type === activeType);

  const handleUnlockGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '007') {
      setIsUnlocked(true);
      setShowPinError(false);
      setPinInput('');
    } else {
      setShowPinError(true);
    }
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormType('flight');
    setFormTitle('');
    setFormDate('');
    setFormDetails('');
    setFormCost(0);
    setFormCurrency('JPY');
    setFormPinCode('007');
    setFormFiles([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Booking) => {
    setEditingItem(item);
    setFormType(item.type);
    setFormTitle(item.title);
    setFormDate(item.date);
    setFormDetails(item.details);
    setFormCost(item.cost || 0);
    setFormCurrency(item.currency || 'JPY');
    setFormPinCode(item.pinCode || '007');
    setFormFiles(item.files || []);
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsCompressing(true);
    const list = [...formFiles];
    for (let i = 0; i < files.length; i++) {
      if (list.length >= 3) break;
      try {
        const compressedBase64 = await compressImage(files[i], 600, 600, 0.5);
        list.push(compressedBase64);
      } catch (err) {
        console.error("Voucher photo compression failed:", err);
      }
    }
    setFormFiles(list);
    setIsCompressing(false);
  };

  const handleRemoveFile = (index: number) => {
    setFormFiles(formFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const payload = {
      type: formType,
      title: formTitle,
      date: formDate,
      details: formDetails,
      cost: Number(formCost),
      currency: formCurrency,
      pinCode: formPinCode,
      files: formFiles
    };

    if (editingItem) {
      await updateBooking(editingItem.id, payload);
    } else {
      await addBooking(payload);
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('確定要退訂或刪除此預訂憑證嗎？')) {
      await deleteBooking(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Privacy Gate Header */}
      <div className="bg-white border-[3px] border-cozy-gray rounded-3xl p-5 shadow-cozy flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 washi-tape-coral w-28 h-6 rotate-[-12deg] -translate-y-1 -translate-x-4"></div>
        <div className="space-y-1">
          <span className="font-mono text-xs text-coral font-bold tracking-widest uppercase flex items-center gap-1">
            <Lock size={12} /> SECURE BOOKING PASSES
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-warm-brown">住宿機票與租車憑證</h1>
          <p className="text-xs text-stone-500 font-medium leading-relaxed">
            保護隱私防洩漏！查看或編輯敏感價格與憑證照片，需要解鎖登島密碼。
          </p>
        </div>

        {/* PIN Unlocking Indicator */}
        {isUnlocked ? (
          <button
            onClick={() => setIsUnlocked(false)}
            className="cursor-pointer bg-amber-50 hover:bg-amber-100 text-warm-accent border-2 border-cozy-gray rounded-2xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <Unlock size={14} className="animate-pulse" />
            <span>手札已開鎖 (點擊上鎖)</span>
          </button>
        ) : (
          <form onSubmit={handleUnlockGlobal} className="flex gap-2 w-full md:w-auto shrink-0 mt-1 md:mt-0">
            <div className="relative flex-1 md:flex-initial">
              <span className="absolute left-3 top-2.5 text-stone-400">
                <Key size={14} />
              </span>
              <input
                type="password"
                placeholder="輸入 PIN 解鎖 (e.g. 007)"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setShowPinError(false);
                }}
                className={`w-full md:w-44 bg-stone-50 border-2 rounded-xl pl-9 pr-3 py-1.5 text-xs text-warm-brown ${
                  showPinError ? 'border-red-400 animate-bounce font-bold' : 'border-cozy-gray'
                }`}
              />
            </div>
            <button
              type="submit"
              className="cursor-pointer bg-forest text-white hover:bg-forest-dark border-2 border-cozy-gray rounded-xl px-4 py-1.5 text-xs font-bold active:scale-95 transition-all shrink-0"
            >
              解鎖
            </button>
          </form>
        )}
      </div>

      {showPinError && (
        <div className="p-3 bg-red-50 border-2 border-red-300 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-pop">
          <AlertCircle size={14} />
          <span>密碼不對喔！偷偷提示您，預設登島密碼為「007」✨</span>
        </div>
      )}

      {/* Booking Type Select Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { key: 'all', label: '全部憑證', icon: <FileText size={13} /> },
          { key: 'flight', label: '機票艙位', icon: <Plane size={13} /> },
          { key: 'accommodation', label: '飯店住宿', icon: <Hotel size={13} /> },
          { key: 'car', label: '自駕租車', icon: <Car size={13} /> },
          { key: 'ticket', label: '票券預訂', icon: <Ticket size={13} /> },
        ].map(item => (
          <button
            key={item.key}
            onClick={() => setActiveType(item.key as BookingType | 'all')}
            className={`cursor-pointer px-4 py-2 rounded-full border-2 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
              activeType === item.key
                ? 'bg-warm-brown text-white border-cozy-gray shadow-cozy translate-y-[-2px]'
                : 'bg-white text-stone-700 border-cozy-gray hover:bg-stone-50'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Button to Add New Voucher */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-stone-500">
          📋 共計 {filteredBookings.length} 筆預訂項目
        </span>
        <button
          onClick={handleOpenAddModal}
          className="cursor-pointer bg-forest text-white border-2 border-cozy-gray hover:bg-forest-dark rounded-full px-4 py-1.5 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={14} /> 新增憑證
        </button>
      </div>

      {/* Cards List rendering */}
      <div className="grid grid-cols-1 gap-6">
        {filteredBookings.length === 0 ? (
          <div className="bg-white border-2 border-stone-300 rounded-3xl p-10 text-center text-stone-500 font-bold text-sm">
            🌾 還沒有記錄這個類別的預訂呢！
          </div>
        ) : (
          filteredBookings.map((item) => {
            const isFlight = item.type === 'flight';
            const isHotel = item.type === 'accommodation';
            const isCar = item.type === 'car';
            const costText = isUnlocked 
              ? `${item.cost.toLocaleString()} ${item.currency}` 
              : '🔒 密碼保護中';

            // Splits
            const splitAmount = isUnlocked && item.cost 
              ? Math.round(item.cost / groupSize) 
              : 0;

            return (
              <div key={item.id} className="animate-pop">
                {isFlight ? (
                  (() => {
                    let fromAirport = "KHH";
                    let toAirport = "KIX";
                    let airlineHeader = "PEACH AVIATION / BOARDING PASS";

                    if (item.details) {
                      const matches = item.details.match(/\(([A-Z]{3})\)/g);
                      if (matches && matches.length >= 2) {
                        fromAirport = matches[0].replace(/[()]/g, '');
                        toAirport = matches[1].replace(/[()]/g, '');
                      } else {
                        const plainCodes = item.details.match(/[A-Z]{3}/g);
                        if (plainCodes && plainCodes.length >= 2) {
                          fromAirport = plainCodes[0];
                          toAirport = plainCodes[1];
                        }
                      }
                    }

                    if (item.title) {
                      if (item.title.includes("樂桃") || item.title.includes("MM")) {
                        airlineHeader = "PEACH AVIATION / BOARDING PASS";
                      } else if (item.title.includes("長榮") || item.title.includes("BR")) {
                        airlineHeader = "EVA AIR / BOARDING PASS";
                      } else {
                        airlineHeader = "AIRLINE / BOARDING PASS";
                      }
                    }

                    return (
                      /* ✈️ Premium Boarding Pass Airplane design */
                      <div className="relative bg-[#FFF9F0] border-[3px] border-cozy-gray rounded-3xl shadow-cozy overflow-hidden flex flex-col md:flex-row">
                        <div className="bg-[#FFF9F0]/60 p-5 md:w-3/4 flex flex-col justify-between gap-4 border-r-2 border-dashed border-cozy-gray/60 relative">
                          
                          {/* Airplane pass cut notches on responsive layout */}
                          <div className="hidden md:block absolute right-[-10px] top-[50%] -translate-y-[10px] w-5 h-5 bg-cream-bg border-l-2 border-cozy-gray rounded-full"></div>
                          <div className="hidden md:block absolute left-[-10px] top-[50%] -translate-y-[10px] w-5 h-5 bg-cream-bg border-r-2 border-cozy-gray rounded-full"></div>

                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className="p-2 bg-white rounded-xl border border-cozy-gray text-coral">
                                <Plane size={18} />
                              </span>
                              <div>
                                <span className="text-[10px] font-bold text-stone-400 font-mono">{airlineHeader}</span>
                                <h3 className="text-sm font-extrabold text-warm-brown">{item.title}</h3>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] font-bold text-stone-400 font-mono block">DEP DATE</span>
                              <span className="text-xs font-bold text-warm-brown">{item.date}</span>
                            </div>
                          </div>

                          {/* Flight Details text */}
                          <div className="bg-white border border-cozy-gray/30 p-3 rounded-2xl">
                            <pre className="text-xs text-stone-600 font-medium whitespace-pre-line leading-relaxed font-sans cursor-text">
                              {item.details}
                            </pre>
                          </div>

                          {/* Currency / Paid sharing indicator */}
                          <div className="flex justify-between items-center text-xs font-bold text-warm-brown">
                            <div className="flex items-center gap-1">
                              <DollarSign size={13} className="text-warm-accent" />
                              <span>機票款：</span>
                              <span className="text-coral underline font-mono">{costText}</span>
                            </div>
                            {isUnlocked && (
                              <span className="text-[10px] bg-stone-100 border border-cozy-gray/40 rounded-full px-2 py-0.5">
                                每人分攤: {splitAmount.toLocaleString()} {item.currency}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Flight coupon stub right side */}
                        <div className="bg-[#FDF9F2] p-5 md:w-1/4 flex flex-col justify-between items-center text-center gap-4 relative">
                          <div className="space-y-1">
                            <div className="text-[9px] font-bold text-stone-400 block font-mono">SECTOR STUB</div>
                            <div className="text-lg font-black text-warm-brown flex items-center justify-center gap-1.5">
                              {fromAirport} <ArrowRight size={14} className="text-stone-400" /> {toAirport}
                            </div>
                            <span className="text-[10px] text-stone-500 font-bold block">{item.date}</span>
                          </div>

                          {/* Barcode details */}
                          <div className="space-y-1.5 w-full">
                            <div className="h-9 bg-warm-brown rounded-xs flex overflow-hidden justify-around opacity-90 p-0.5 items-stretch bg-[repeating-linear-gradient(90deg,#8D6E63,#8D6E63_1px,#fff_1px,#fff_3px)]"></div>
                            <span className="text-[8px] font-mono font-bold tracking-widest text-stone-500 block">GATE C7 / SEAT 12A</span>
                          </div>

                          {/* Trash/Edit control */}
                          <div className="flex gap-2 w-full z-10">
                            <button
                              onClick={() => handleOpenEditModal(item)}
                              className="flex-1 bg-white border border-cozy-gray hover:bg-stone-50 text-stone-600 py-1 text-[10px] font-bold rounded-lg cursor-pointer"
                            >
                              修改
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 bg-white border border-cozy-gray hover:bg-rose-50 text-coral rounded-lg cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* 🏨 / 🚗 / 🎟️ Other reservations styled like beautiful note sheets */
                  <div className="bg-white border-[3px] border-cozy-gray rounded-3xl p-5 shadow-cozy space-y-4 hover:shadow-md transition-all relative overflow-hidden">
                    
                    {/* Washi tape decor based on card type */}
                    {isHotel && <div className="absolute left-1/2 -translate-x-1/2 top-0 washi-tape-green w-16 h-4 -translate-y-2 opacity-80"></div>}
                    {isCar && <div className="absolute left-1/2 -translate-x-1/2 top-0 washi-tape-brown w-16 h-4 -translate-y-2 opacity-80"></div>}

                    <div className="flex justify-between items-start gap-2 border-b border-dashed border-stone-200 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-stone-100 border border-cozy-gray rounded-xl text-warm-accent">
                          {isHotel ? <Hotel size={16} /> : isCar ? <Car size={16} /> : <Ticket size={16} />}
                        </span>
                        <div>
                          <span className="text-[10px] font-black text-stone-400 block font-mono">
                            {item.type.toUpperCase()} BOOKING SLIP
                          </span>
                          <h3 className="text-base font-extrabold text-warm-brown">{item.title}</h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1 text-stone-500 hover:text-forest hover:bg-stone-100 rounded-lg cursor-pointer"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 text-stone-500 hover:text-coral hover:bg-stone-100 rounded-lg cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Check In / Date time timelines */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3 rounded-2xl border border-cozy-gray/40 text-xs text-stone-600">
                      <div className="flex items-center gap-1.5 text-stone-600 font-bold">
                        <Calendar size={13} className="text-stone-400 shrink-0" />
                        <span>安排日期：{item.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600 font-bold">
                        <CheckCircle size={13} className="text-forest shrink-0" />
                        <span>登記者：{members.find(m => m.id === item.confirmedBy)?.name || '小島民'}</span>
                      </div>
                    </div>

                    {/* Details content */}
                    <div className="text-xs text-stone-600 leading-relaxed bg-[#FFF9F0] p-3.5 border border-cozy-gray/40 rounded-2xl whitespace-pre-line font-medium">
                      {item.details}
                    </div>

                    {/* Split ledger panel inside lodging card */}
                    {item.cost > 0 && (
                      <div className="bg-stone-50 border border-cozy-gray/40 rounded-2xl p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-bold">
                        <div className="flex items-center gap-1">
                          <DollarSign size={14} className="text-coral" />
                          <span>費用總額：</span>
                          <span className="text-coral underline font-mono">{costText}</span>
                        </div>
                        {isUnlocked && (
                          <div className="flex items-center gap-1 text-stone-600">
                            <Users size={13} className="text-forest" />
                            <span>每人平均分攤費：</span>
                            <span className="text-forest underline font-mono">
                              {splitAmount.toLocaleString()} {item.currency} / {groupSize}人
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attached file vouchers visible only when unlocked */}
                    {item.files && item.files.length > 0 && (
                      <div className="space-y-1.5 pb-1">
                        <span className="text-[10px] font-black text-stone-400 block font-mono">ATTACHED VOUCHERS CARDS</span>
                        {isUnlocked ? (
                          <div className="flex gap-2 pb-1 overflow-x-auto">
                            {item.files.map((b64, idx) => (
                              <a 
                                key={idx} 
                                href={b64}
                                download={`voucher_${idx}.jpg`}
                                className="shrink-0 relative group border-2 border-stone-300 p-1 bg-white rounded-lg hover:border-forest transition-colors shadow-sm"
                              >
                                <img src={b64} alt="voucher doc attachment" className="w-16 h-20 object-cover rounded-md" referrerPolicy="no-referrer" />
                                <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[8px] font-mono px-1 rounded-sm">下傳</span>
                              </a>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-stone-100 border border-stone-300 rounded-xl text-center text-[11px] text-stone-500 font-bold flex items-center justify-center gap-1.5">
                            <Lock size={12} />
                            <span>憑證已加密保護，請用 PIN 解鎖查看照片。</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Insert Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[3px] border-cozy-gray rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-pop modal-stage">
            <div className="bg-coral px-4 py-3.5 border-b-[3px] border-cozy-gray text-white font-bold flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-sm sm:text-base">
                <Plus size={16} /> {editingItem ? '修改預訂憑證' : '登記預訂憑證'}
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-stone-200 text-xl font-bold cursor-pointer">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">憑證類別 *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as BookingType)}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-2 py-2 text-xs text-warm-brown font-bold"
                  >
                    <option value="flight">✈️ 航班/機票</option>
                    <option value="accommodation">🏨 住宿/飯店</option>
                    <option value="car">🚗 租車自駕</option>
                    <option value="ticket">🎟️ 票券/門票</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">確認日期 *</label>
                  <input
                    type="text"
                    required
                    placeholder="如：5/24 或 Check-in 日"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-1.5 text-xs text-warm-brown font-semibold placeholder-stone-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">憑證名稱 / 航班 / 飯店地點 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：樂桃航空 MM860 / 虹夕諾雅舒適雙人房"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-sm text-warm-brown placeholder-stone-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">詳細預訂資訊 (地址、確認代號、說明)</label>
                <textarea
                  placeholder="輸入詳細 check-in/out 時間、確認代碼、搭乘細節..."
                  rows={4}
                  value={formDetails}
                  onChange={(e) => setFormDetails(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-xs text-warm-brown placeholder-stone-400 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">費用總額</label>
                  <input
                    type="number"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(Number(e.target.value))}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-1.5 text-xs text-warm-brown font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">貨幣種類</label>
                  <input
                    type="text"
                    value={formCurrency}
                    onChange={(e) => setFormCurrency(e.target.value.toUpperCase())}
                    placeholder="TWD, JPY, USD"
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-1.5 text-xs text-warm-brown font-mono placeholder-stone-400 uppercase font-bold"
                  />
                </div>
              </div>

              {/* Secure code setting */}
              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1 flex items-center gap-1">
                  <span>🔒 當前憑證 PIN 密碼</span>
                  <HelpCircle size={11} className="text-stone-400" title="進入此預訂詳情時要輸入的驗證碼" />
                </label>
                <input
                  type="text"
                  value={formPinCode}
                  onChange={(e) => setFormPinCode(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-1.5 text-xs text-warm-brown font-mono font-bold"
                />
              </div>

              {/* Upload Voucher Image file */}
              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1 flex justify-between">
                  <span>上傳憑證/QR Code 截圖 (最多3張，經壓縮)</span>
                  {isCompressing && <span className="text-coral animate-pulse">處理中...</span>}
                </label>
                <div className="flex gap-2 flex-wrap items-center">
                  {formFiles.map((f, idx) => (
                    <div key={idx} className="relative w-12 h-12 border border-stone-300 rounded-md overflow-hidden">
                      <img src={f} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="absolute top-0 right-0 bg-red-400 text-white rounded-bl-sm w-4 h-4 text-[9px] flex items-center justify-center font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {formFiles.length < 3 && (
                    <label className="w-12 h-12 rounded-lg border-2 border-dashed border-stone-400 flex flex-col items-center justify-center text-stone-500 cursor-pointer hover:bg-stone-50 transition-colors">
                      <Plus size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleFileUpload}
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
                  className="flex-1 bg-coral text-white border-2 border-cozy-gray rounded-full px-4 py-2 text-xs font-bold cursor-pointer hover:bg-rose-600 active:scale-95 transition-all text-center"
                >
                  {editingItem ? '確認更動' : '儲存預訂'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
