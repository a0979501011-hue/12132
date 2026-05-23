/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PlanningType, PlanningItem } from '../types';
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  User, 
  Users, 
  Briefcase, 
  CheckCircle, 
  ClipboardList, 
  ShoppingBag,
  ListFilter
} from 'lucide-react';

export const PlanningTab: React.FC = () => {
  const { currentTrip, planning, members, currentUser, addPlanning, togglePlanningCompleted, deletePlanningItem } = useData();
  const [activeType, setActiveType] = useState<PlanningType>('todo');
  const [assignedFilter, setAssignedFilter] = useState<'all' | 'me'>('all');
  
  // Create state
  const [formText, setFormText] = useState('');
  const [formAssignedTo, setFormAssignedTo] = useState('all');

  // Filter lists
  const filteredList = useMemo(() => {
    return planning.filter(item => {
      const typeMatch = item.type === activeType;
      if (!typeMatch) return false;
      
      if (assignedFilter === 'me' && currentUser) {
        return item.assignedTo === currentUser.id || item.assignedTo === 'all';
      }
      return true;
    });
  }, [planning, activeType, assignedFilter, currentUser]);

  // Statistics
  const typeStats = useMemo(() => {
    const list = planning.filter(item => item.type === activeType);
    const completed = list.filter(item => item.completed).length;
    return {
      total: list.length,
      completed,
      pct: list.length > 0 ? Math.round((completed / list.length) * 100) : 0
    };
  }, [planning, activeType]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) return;

    await addPlanning(formText.trim(), activeType, formAssignedTo);
    setFormText('');
  };

  return (
    <div className="space-y-6">
      {/* Visual checklist description banner */}
      <div className="relative bg-white border-[3px] border-cozy-gray rounded-3xl p-5 shadow-cozy overflow-hidden">
        <div className="absolute right-0 top-0 washi-tape-green w-28 h-6 rotate-12 -translate-y-1 translate-x-4"></div>
        <div>
          <span className="font-mono text-xs text-warm-accent font-bold tracking-widest uppercase flex items-center gap-1">
            <ClipboardList size={12} /> INTERACTIVE TRIP FOLDER
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-warm-brown mt-1">出發前準備與清單</h1>
          <p className="text-xs text-stone-500">分工合作最輕鬆！在此規劃所有人與自己的行前待辦任務、行李備齊度和手信清單。</p>
        </div>
      </div>

      {/* Checklist Type Folders selection */}
      <div className="grid grid-cols-3 gap-2 border-b-[3px] border-cozy-gray pb-1">
        {[
          { type: 'todo' as PlanningType, label: '待辦事項', icon: <ClipboardList size={14} />, colorClass: 'border-emerald-500 bg-emerald-50 text-emerald-800' },
          { type: 'luggage' as PlanningType, label: '行李清單', icon: <Briefcase size={14} />, colorClass: 'border-amber-500 bg-amber-50 text-amber-900' },
          { type: 'shopping' as PlanningType, label: '採購手信', icon: <ShoppingBag size={14} />, colorClass: 'border-coral bg-rose-50 text-coral' },
        ].map(folder => {
          const active = activeType === folder.type;
          return (
            <button
              key={folder.type}
              onClick={() => setActiveType(folder.type)}
              className={`cursor-pointer py-3.5 px-1 sm:px-4 rounded-t-[1.5rem] border-[3px] border-b-0 text-xs sm:text-sm font-extrabold flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all ${
                active 
                  ? 'bg-white border-cozy-gray translate-y-[5px] z-10 shadow-sm font-black' 
                  : 'bg-stone-55 border-transparent text-stone-500 hover:bg-stone-50'
              }`}
            >
              {folder.icon}
              <span className="text-center truncate">{folder.label}</span>
            </button>
          );
        })}
      </div>

      {/* Progress slider bar */}
      <div className="bg-white border-[3px] border-cozy-gray p-4 rounded-2xl shadow-cozy space-y-2 animate-pop">
        <div className="flex justify-between items-center text-xs font-bold text-stone-600">
          <span className="flex items-center gap-1">
            <CheckCircle size={13} className="text-forest animate-pulse" />
            <span>目前分頁進度：</span>
          </span>
          <span className="font-mono">
            {typeStats.completed} / {typeStats.total} 項目 ({typeStats.pct}%)
          </span>
        </div>
        <div className="h-4 bg-stone-100 border-2 border-cozy-gray rounded-full overflow-hidden p-[2px]">
          <div 
            className="h-full bg-forest rounded-full transition-all duration-300"
            style={{ width: `${typeStats.pct}%` }}
          ></div>
        </div>
      </div>

      {/* Assignee Filter Controls */}
      <div className="flex justify-between items-center px-1">
        <div className="flex gap-1.5 p-0.5 bg-stone-100 border border-stone-300 rounded-xl">
          <button
            onClick={() => setAssignedFilter('all')}
            className={`cursor-pointer px-3.5 py-1 text-xs font-bold rounded-lg transition-all ${
              assignedFilter === 'all' ? 'bg-white text-stone-800 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            全體成員任務
          </button>
          <button
            onClick={() => setAssignedFilter('me')}
            className={`cursor-pointer px-3.5 py-1 text-xs font-bold rounded-lg transition-all ${
              assignedFilter === 'me' ? 'bg-white text-stone-800 shadow-xs' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            指派給我的 👤
          </button>
        </div>

        <span className="text-[11px] text-stone-400 font-mono">
          FILTERED LIST ({filteredList.length})
        </span>
      </div>

      {/* Quick Add Form directly inline for coziest Japanese handnote listing feel! */}
      <form onSubmit={handleAddItem} className="bg-white border-[3px] border-cozy-gray p-4 rounded-2xl shadow-cozy flex flex-col sm:flex-row gap-3 items-end sm:items-center">
        <div className="flex-1 w-full">
          <label className="block text-[10px] font-black text-stone-450 block font-mono mb-1">QUICK NEW TASK</label>
          <input
            type="text"
            required
            placeholder={activeType === 'todo' ? '如：辦理日文駕照譯本、購買海外險...' : activeType === 'luggage' ? '如：充電器、過敏藥、相機電池...' : '如：一澤信三郎帆布包、生巧克力...'}
            value={formText}
            onChange={(e) => setFormText(e.target.value)}
            className="w-full bg-stone-50 border-2 border-cozy-gray rounded-xl px-3 py-1.5 text-xs text-warm-brown placeholder-stone-400 font-semibold"
          />
        </div>

        <div className="w-full sm:w-36 shrink-0">
          <label className="block text-[10px] font-black text-stone-450 block font-mono mb-1">ASSIGNED MEMBER</label>
          <select
            value={formAssignedTo}
            onChange={(e) => setFormAssignedTo(e.target.value)}
            className="w-full bg-stone-50 border-2 border-cozy-gray rounded-xl px-2 py-1.5 text-xs text-warm-brown font-bold"
          >
            <option value="all">👥 全體成員</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                👤 {m.name} {m.id === currentUser?.id ? '(你)' : ''}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="cursor-pointer h-9 bg-forest hover:bg-forest-dark border-2 border-cozy-gray text-white font-extrabold text-xs px-4 rounded-xl flex items-center justify-center gap-1 w-full sm:w-auto shrink-0 active:scale-95 transition-transform"
        >
          <Plus size={14} /> 新增
        </button>
      </form>

      {/* Visual checklists item rows */}
      <div className="space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="p-10 bg-white border-2 border-stone-200 rounded-2xl text-center text-stone-400 font-bold text-xs select-none">
            🌲 目前沒有指派規劃項目。
          </div>
        ) : (
          filteredList.map((item, index) => {
            const assignee = item.assignedTo === 'all' 
              ? null
              : members.find(m => m.id === item.assignedTo);
            const creator = members.find(m => m.id === item.createdBy)?.name || '島民';

            return (
              <div
                key={item.id}
                className={`bg-white border-[3px] border-cozy-gray p-3.5 rounded-2xl shadow-cozy hover:translate-y-[-1px] hover:shadow-md transition-all flex justify-between items-center gap-3 animate-pop`}
                style={{ animationDelay: `${index * 20}ms` }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Cozy Checkbox */}
                  <button
                    type="button"
                    onClick={() => togglePlanningCompleted(item.id, !item.completed)}
                    className="cursor-pointer text-forest shrink-0 focus:outline-none transition-transform active:scale-90"
                  >
                    {item.completed ? (
                      <CheckSquare size={20} className="stroke-[2.5]" />
                    ) : (
                      <Square size={20} className="stroke-[2] text-stone-400" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <span className={`text-xs font-bold break-all leading-relaxed ${
                      item.completed ? 'line-through text-stone-400 font-medium' : 'text-warm-brown'
                    }`}>
                      {item.text}
                    </span>
                    
                    {/* Footnote attribution */}
                    <div className="flex items-center gap-1.5 text-[8.5px] text-stone-400 font-mono font-semibold mt-0.5">
                      <span>By: {creator}</span>
                      <span>・</span>
                      {assignee ? (
                        <span className="text-warm-accent flex items-center gap-0.5">
                          指派給: {assignee.name}
                        </span>
                      ) : (
                        <span className="text-forest flex items-center gap-0.5">
                          指派給: 全體成員 👥
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    await deletePlanningItem(item.id);
                  }}
                  className="cursor-pointer text-stone-300 hover:text-coral p-1.5 hover:bg-stone-50 rounded"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
