/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DataProvider, useData } from './context/DataContext';
import { ScheduleTab } from './components/ScheduleTab';
import { BookingTab } from './components/BookingTab';
import { ExpenseTab } from './components/ExpenseTab';
import { JournalTab } from './components/JournalTab';
import { PlanningTab } from './components/PlanningTab';
import { MembersTab } from './components/MembersTab';
import { 
  Calendar, 
  FileText, 
  DollarSign, 
  BookOpen, 
  ClipboardList, 
  Users, 
  Heart, 
  CloudSun,
  Loader2,
  AlertCircle
} from 'lucide-react';

type TabType = 'schedule' | 'bookings' | 'expense' | 'journal' | 'planning' | 'members';

const AppContent: React.FC = () => {
  const { currentTrip, isLoading, isCloudSyncing } = useData();
  const [activeTab, setActiveTab] = useState<TabType>('schedule');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-bg flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="relative">
          <Loader2 className="text-forest animate-spin" size={40} />
          <span className="absolute inset-0 flex items-center justify-center text-xs">🍃</span>
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-black text-warm-brown font-mono select-none tracking-widest animate-pulse">
            LOADING COZY JOURNAL...
          </h2>
          <p className="text-xs text-stone-400 font-medium font-sans">
            正在翻開您的九周年大阪遊手帳，請稍候 🌸
          </p>
        </div>
      </div>
    );
  }

  // Render the current active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'schedule':
        return <ScheduleTab />;
      case 'bookings':
        return <BookingTab />;
      case 'expense':
        return <ExpenseTab />;
      case 'journal':
        return <JournalTab />;
      case 'planning':
        return <PlanningTab />;
      case 'members':
        return <MembersTab />;
      default:
        return <ScheduleTab />;
    }
  };

  return (
    <div className="min-h-screen pb-28 pt-4 flex flex-col max-w-xl mx-auto relative px-4">
      
      {/* Handcrafted Header branding */}
      <header className="relative py-3 px-4 bg-white border-[3px] border-cozy-gray rounded-3xl shadow-cozy flex justify-between items-center bg-[radial-gradient(#E0E5D5_1px,transparent_1px)] bg-size-[12px_12px] mb-6">
        <div className="flex items-center gap-2">
          <span className="text-xl animate-spin-slow">🍃</span>
          <div>
            <h1 className="text-base font-black tracking-tight text-warm-brown flex items-center gap-1">
              九周年大阪遊
              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-forest text-white rounded-md scale-90">
                PWA
              </span>
            </h1>
            <p className="text-[9px] text-stone-550 font-bold leading-none font-mono">
              ARTISTIC GROUP PLANNER v1.0
            </p>
          </div>
        </div>

        {/* Syncing heartbeat pin dot indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              isCloudSyncing ? 'bg-forest' : 'bg-warm-accent'
            }`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              isCloudSyncing ? 'bg-forest' : 'bg-warm-accent'
            }`}></span>
          </span>
          <span className="text-[9px] font-black text-stone-500 font-mono">
            {isCloudSyncing ? 'REALTIME SYNC' : 'LOCAL MODE'}
          </span>
        </div>
      </header>

      {/* Primary Display Surface */}
      <main className="flex-1">
        {renderTabContent()}
      </main>

      {/* 📱 Persistent Tactile Bottom Navigation Bar for Mobile-first design */}
      <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[93%] max-w-md bg-white border-[3px] border-cozy-gray rounded-[2.5rem] p-1.5 z-40 shadow-cozy flex justify-between items-center transition-all bg-[radial-gradient(#E0E5D5_1.2px,transparent_1.2px)] bg-size-[10px_10px]">
        {[
          { key: 'schedule', label: '行程', icon: <Calendar size={18} /> },
          { key: 'bookings', label: '預訂', icon: <FileText size={18} /> },
          { key: 'expense', label: '記帳', icon: <DollarSign size={18} /> },
          { key: 'journal', label: '日誌', icon: <BookOpen size={18} /> },
          { key: 'planning', label: '準備', icon: <ClipboardList size={18} /> },
          { key: 'members', label: '成員', icon: <Users size={18} /> },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              id={`nav-${tab.key}`}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`cursor-pointer flex-1 py-2 flex flex-col items-center justify-center rounded-2xl transition-all font-bold ${
                active 
                  ? 'bg-forest border-2 border-cozy-gray text-white translate-y-[-2px] shadow-sm' 
                  : 'text-stone-500 hover:text-warm-brown hover:bg-stone-50 active:scale-95'
              }`}
            >
              <div className="transition-transform duration-200">
                {tab.icon}
              </div>
              <span className="text-[10px] sm:text-[11px] font-black tracking-wider mt-1 leading-none select-none">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
}
