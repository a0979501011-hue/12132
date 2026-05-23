/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Expense } from '../types';
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Layers,
  ArrowRightLeft,
  Check
} from 'lucide-react';

const POPULAR_CURRENCIES: { [key: string]: { name: string; symbol: string; defaultRate: number } } = {
  JPY: { name: '日圓', symbol: '¥', defaultRate: 0.21 },
  TWD: { name: '新台幣', symbol: 'NT$', defaultRate: 1.00 },
  USD: { name: '美金', symbol: '$', defaultRate: 32.20 },
  EUR: { name: '歐元', symbol: '€', defaultRate: 35.00 }
};

export const ExpenseTab: React.FC = () => {
  const { currentTrip, expenses, members, currentUser, addExpense, deleteExpense } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCurrency, setFormCurrency] = useState('JPY');
  const [formExchangeRate, setFormExchangeRate] = useState('0.21');
  const [formPaidBy, setFormPaidBy] = useState('');
  const [formSplitWith, setFormSplitWith] = useState<string[]>([]);
  const [formCategory, setFormCategory] = useState('餐飲美食');

  // Set initial form states
  const openAddModal = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormDesc('');
    setFormAmount('');
    setFormCurrency('JPY');
    setFormExchangeRate('0.21');
    setFormPaidBy(currentUser?.id || members[0]?.id || 'guest');
    // Default split with everyone
    setFormSplitWith(members.map(m => m.id));
    setIsModalOpen(true);
  };

  // Adjust exchange rate automatically when currency drops
  const handleCurrencyChange = (curr: string) => {
    setFormCurrency(curr);
    const rate = POPULAR_CURRENCIES[curr]?.defaultRate || 1.0;
    setFormExchangeRate(rate.toString());
  };

  // Sum calculations
  const stats = useMemo(() => {
    let totalTWD = 0;
    const currencyTotals: { [key: string]: number } = {};

    expenses.forEach(e => {
      totalTWD += e.amountTWD;
      currencyTotals[e.currency] = (currencyTotals[e.currency] || 0) + e.amount;
    });

    // Category distribution calculations
    const catMap: { [key: string]: number } = {};
    expenses.forEach(e => {
      catMap[e.category] = (catMap[e.category] || 0) + e.amountTWD;
    });

    return {
      totalTWD,
      currencyTotals,
      categories: Object.entries(catMap).map(([name, val]) => ({
        name,
        amount: val,
        percentage: totalTWD > 0 ? Math.round((val / totalTWD) * 100) : 0
      })).sort((a,b) => b.amount - a.amount)
    };
  }, [expenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(formAmount);
    const parsedRate = Number(formExchangeRate);
    if (!formDesc.trim() || !parsedAmount || parsedAmount <= 0) return;

    if (formSplitWith.length === 0) {
      alert('請至少選擇一位分攤對象喔！');
      return;
    }

    const calculatedTWD = parsedAmount * parsedRate;

    await addExpense({
      date: formDate,
      description: formDesc,
      amount: parsedAmount,
      currency: formCurrency,
      exchangeRate: parsedRate,
      amountTWD: calculatedTWD,
      paidBy: formPaidBy,
      splitWith: formSplitWith,
      category: formCategory
    });

    setIsModalOpen(false);
  };

  const handleToggleSplitMember = (mid: string) => {
    if (formSplitWith.includes(mid)) {
      setFormSplitWith(formSplitWith.filter(id => id !== mid));
    } else {
      setFormSplitWith([...formSplitWith, mid]);
    }
  };

  const handleSelectAllSplit = () => {
    setFormSplitWith(members.map(m => m.id));
  };

  const handleClearAllSplit = () => {
    setFormSplitWith([]);
  };

  return (
    <div className="space-y-6">
      {/* 🧾 Mechanical Receipt-Tape Styled Dashboard */}
      <div className="relative bg-white border-[3px] border-cozy-gray rounded-3xl p-6 shadow-cozy overflow-hidden">
        {/* Paper tape torn header jagged pattern */}
        <div className="absolute top-0 inset-x-0 h-2 bg-stone-300 bg-[linear-gradient(45deg,#fff_25%,transparent_25%),linear-gradient(-45deg,#fff_25%,transparent_25%)] bg-size-[8px_8px] bg-repeat-x"></div>
        <div className="absolute right-0 top-1 washi-tape-green w-24 h-5 rotate-[8deg] -translate-y-1 translate-x-5"></div>

        <div className="space-y-4 pt-2">
          <div className="pb-3 border-b border-dashed border-stone-300">
            <span className="font-mono text-xs font-bold text-warm-accent tracking-widest block">DAILY LEDGER RECEIPT</span>
            <span className="text-xs text-stone-500 font-mono font-bold block mt-1">
              RUN: 2026-05-23 ・ PRINTER EN
            </span>
          </div>

          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <span className="text-xs font-bold text-stone-500">團體共享累積花費 (折合TWD)</span>
              <div className="text-3xl font-black text-warm-brown tracking-tight font-mono">
                NT$ <span className="text-coral">{stats.totalTWD.toLocaleString()}</span>
              </div>
            </div>
            
            <button
              onClick={openAddModal}
              className="cursor-pointer bg-forest text-white border-2 border-cozy-gray hover:bg-forest-dark rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            >
              <Plus size={14} /> 新增支出
            </button>
          </div>

          {/* Sub currencies breakdown rows */}
          {Object.keys(stats.currencyTotals).length > 0 && (
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-1 text-xs font-mono font-bold">
              <div className="text-[10px] text-stone-400 font-sans tracking-wide mb-1.5 flex items-center gap-1">
                <ArrowRightLeft size={10} /> 原始幣別明細累積 (含自動換算率)：
              </div>
              {Object.entries(stats.currencyTotals).map(([cur, val]) => {
                const sym = POPULAR_CURRENCIES[cur]?.symbol || '';
                return (
                  <div key={cur} className="flex justify-between text-stone-600">
                    <span>{cur} ({POPULAR_CURRENCIES[cur]?.name || '外幣'}) :</span>
                    <span>{sym} {val.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Category Pure CSS Progress Bar Chart */}
      {stats.categories.length > 0 && (
        <div className="bg-white border-[3px] border-cozy-gray rounded-3xl p-5 shadow-cozy space-y-3">
          <h3 className="text-xs font-black text-warm-brown tracking-wider uppercase flex items-center gap-1.5">
            <Layers size={13} className="text-warm-accent" /> 旅行消費分類統計
          </h3>
          <div className="space-y-2.5">
            {stats.categories.map((cat, i) => (
              <div key={cat.name} className="space-y-1 text-xs">
                <div className="flex justify-between text-[11px] font-bold text-stone-600">
                  <span>{cat.name}</span>
                  <span className="font-mono">
                    NT$ {cat.amount.toLocaleString()} ({cat.percentage}%)
                  </span>
                </div>
                {/* Visual bar */}
                <div className="h-2 bg-stone-100 rounded-full border border-stone-200 overflow-hidden">
                  <div 
                    className="h-full bg-leaf rounded-full transition-all duration-500 border-r border-warm-brown/15"
                    style={{ 
                      width: `${cat.percentage}%`,
                      backgroundColor: i === 0 ? '#609966' : i === 1 ? '#C58940' : i === 2 ? '#E78895' : '#9DC08B'
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Chronological Visual List */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-warm-brown flex items-center gap-1.5 px-0.5">
          <span className="w-2.5 h-2.5 rounded-full bg-coral inline-block"></span>
          流水帳支出明細清單
        </h2>

        {expenses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-stone-300 text-stone-500 font-bold p-10 rounded-3xl text-center text-sm">
            🌾 目前還沒有記下任何費用。趕快按下「新增支出」記錄一筆吧！
          </div>
        ) : (
          <div className="space-y-3">
            {expenses.map((item, index) => {
              const paidByName = members.find(m => m.id === item.paidBy)?.name || '未知付款人';
              const currencySymbol = POPULAR_CURRENCIES[item.currency]?.symbol || '';
              const showExchange = item.currency !== 'TWD';
              const splitCount = item.splitWith.length;
              
              // Determine if current user is involved in this split
              const isInvolved = currentUser ? item.splitWith.includes(currentUser.id) : false;
              const perPersonPortion = Math.round(item.amountTWD / Math.max(1, splitCount));

              return (
                <div 
                  key={item.id} 
                  className="bg-white border-[3px] border-cozy-gray rounded-3xl p-4 shadow-cozy hover:translate-y-[-1px] transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-pop"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-amber-50 border border-cozy-gray rounded-xl text-warm-accent shrink-0 mt-0.5">
                      <TrendingDown size={16} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-warm-brown leading-tight">
                          {item.description}
                        </h4>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 rounded-md">
                          {item.category}
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="flex items-center gap-0.5 font-sans font-bold">
                          <Calendar size={10} /> {item.date}
                        </span>
                        <span>・ 付款人：<strong className="text-warm-brown">{paidByName}</strong></span>
                        <span>・ 分攤對象：<strong>{splitCount} 人</strong></span>
                      </div>

                      {/* Display small formula check if split user is involved */}
                      {isInvolved && currentUser && (
                        <div className="text-[9px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md inline-block font-bold">
                          💡 你需要分攤其中的 NT$ {perPersonPortion.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end gap-3 sm:gap-1.5 self-stretch sm:self-auto justify-between border-t sm:border-t-0 border-dashed border-stone-100 pt-3 sm:pt-0 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-black text-coral font-mono">
                        NT$ {Math.round(item.amountTWD).toLocaleString()}
                      </div>
                      {showExchange && (
                        <div className="text-[10px] font-medium text-stone-400 font-mono">
                          {currencySymbol}{item.amount.toLocaleString()} (匯率 {item.exchangeRate})
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm(`確認刪除「${item.description}」記帳嗎？`)) {
                          deleteExpense(item.id);
                        }
                      }}
                      className="cursor-pointer text-stone-400 hover:text-coral p-1.5 hover:bg-stone-50 rounded-lg"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border-[3px] border-cozy-gray rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl animate-pop modal-stage">
            <div className="bg-coral px-4 py-3.5 border-b-[3px] border-cozy-gray text-white font-bold flex justify-between items-center">
              <span className="flex items-center gap-1.5 text-sm">
                <Plus size={16} /> 填寫記帳支出
              </span>
              <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-stone-200 text-xl font-bold cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">消費日期 *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-2.5 py-1.5 text-xs text-warm-brown font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">支出種類 *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-2.5 py-1.5 text-xs text-warm-brown font-bold"
                  >
                    <option value="餐飲美食">🍜 餐飲美食</option>
                    <option value="交通接駁">🚲 交通接駁</option>
                    <option value="住宿裝備">⛺ 住宿裝備</option>
                    <option value="景點門票">🎟️ 景點門票</option>
                    <option value="購物紀念">🎁 購物紀念</option>
                    <option value="其他雜費">☕ 其他雜費</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">花費項目說明 *</label>
                <input
                  type="text"
                  required
                  placeholder="例如：清水寺御守、便利商店飲料、居酒屋晚餐"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-2 text-sm text-warm-brown placeholder-stone-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">幣別金客 (鍵盤限制) *</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    required
                    min="0.01"
                    placeholder="金額"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-1.5 text-xs text-warm-brown font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-brown mb-1">選擇幣別 *</label>
                  <select
                    value={formCurrency}
                    onChange={(e) => handleCurrencyChange(e.target.value)}
                    className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-2.5 py-1.5 text-xs text-warm-brown font-bold"
                  >
                    <option value="JPY">¥ JPY (日圓)</option>
                    <option value="TWD">NT$ TWD (台幣)</option>
                    <option value="USD">$ USD (美元)</option>
                    <option value="EUR">€ EUR (歐元)</option>
                  </select>
                </div>
              </div>

              {/* Exchange rate row auto estimation */}
              <div className="bg-lime-50/50 p-2.5 border border-cozy-gray rounded-xl text-[11px] text-stone-600 font-bold space-y-1.5">
                <div className="flex justify-between items-center">
                  <span>估計對台幣匯率:</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={formExchangeRate}
                    onChange={(e) => setFormExchangeRate(e.target.value)}
                    className="w-20 bg-white border border-stone-300 rounded px-1.5 py-0.5 text-right font-mono"
                  />
                </div>
                <div className="flex justify-between font-mono text-warm-brown">
                  <span>預估折合 NT$:</span>
                  <span>
                    NT$ {Math.round((Number(formAmount) || 0) * (Number(formExchangeRate) || 0)).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Paid By Selection */}
              <div>
                <label className="block text-xs font-bold text-warm-brown mb-1">是由誰付款的？ *</label>
                <select
                  value={formPaidBy}
                  onChange={(e) => setFormPaidBy(e.target.value)}
                  className="w-full bg-stone-50 border-2 border-warm-brown rounded-xl px-3 py-1.5 text-xs text-warm-brown font-bold"
                >
                  {members.map(m => (
                    <option key={m.id} value={m.id}>
                      👤 {m.name} {m.id === currentUser?.id ? '(你)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Split With Multi Selection */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-warm-brown">
                  <span>選擇分攤對象（多選）*</span>
                  <div className="space-x-1 font-mono">
                    <button 
                      type="button" 
                      onClick={handleSelectAllSplit} 
                      className="cursor-pointer text-[10px] bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded px-1.5 py-0.5 text-stone-600"
                    >
                      全選
                    </button>
                    <button 
                      type="button" 
                      onClick={handleClearAllSplit} 
                      className="cursor-pointer text-[10px] bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded px-1.5 py-0.5 text-stone-600"
                    >
                      清空
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto p-1.5 bg-stone-50 border border-stone-200 rounded-xl no-scrollbar">
                  {members.map(m => {
                    const selected = formSplitWith.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleToggleSplitMember(m.id)}
                        className={`cursor-pointer border-2 p-1.5 rounded-lg flex items-center gap-1 text-[10px] text-left font-bold transition-all ${
                          selected
                            ? 'bg-forest/10 border-forest text-warm-brown'
                            : 'bg-white border-cozy-gray text-stone-500'
                        }`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full border border-warm-brown flex items-center justify-center shrink-0 ${
                          selected ? 'bg-forest text-white' : 'bg-white'
                        }`}>
                          {selected && <Check size={10} />}
                        </div>
                        <span className="truncate">{m.name}</span>
                      </button>
                    );
                  })}
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
                  className="flex-1 bg-coral hover:bg-rose-600 text-white border-2 border-cozy-gray rounded-full px-4 py-2 text-xs font-bold cursor-pointer active:scale-95 transition-all text-center"
                >
                  確認入帳
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
