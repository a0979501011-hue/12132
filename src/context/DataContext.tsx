/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  db, 
  auth, 
  isFirebaseConfigured, 
  OperationType, 
  handleFirestoreError 
} from '../firebase';
import { 
  Trip, 
  Member, 
  Schedule, 
  Booking, 
  Expense, 
  Journal, 
  PlanningItem,
  ScheduleCategory,
  BookingType,
  PlanningType 
} from '../types';

// Let's import standard Firestore APIs on demand if Firebase is configured
import { 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';

interface DataContextType {
  currentTrip: Trip | null;
  members: Member[];
  schedules: Schedule[];
  bookings: Booking[];
  expenses: Expense[];
  journals: Journal[];
  planning: PlanningItem[];
  currentUser: Member | null;
  isLoading: boolean;
  isCloudSyncing: boolean;
  loginWithGoogle?: () => Promise<void>;
  logout?: () => Promise<void>;
  
  // Operations
  updateTrip: (name: string, startDate: string, endDate: string, bannerUrl?: string) => Promise<void>;
  upsertMember: (name: string, avatarUrl: string) => Promise<void>;
  addSchedule: (item: Omit<Schedule, 'id' | 'tripId' | 'createdBy' | 'createdAt'>) => Promise<void>;
  updateSchedule: (id: string, item: Partial<Schedule>) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
  
  addBooking: (booking: Omit<Booking, 'id' | 'tripId' | 'confirmedBy' | 'createdAt'>) => Promise<void>;
  updateBooking: (id: string, booking: Partial<Booking>) => Promise<void>;
  deleteBooking: (id: string) => Promise<void>;
  
  addExpense: (expense: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  
  addJournal: (journal: Omit<Journal, 'id' | 'tripId' | 'authorId' | 'createdAt'>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  
  addPlanning: (text: string, type: PlanningType, assignedTo: string) => Promise<void>;
  togglePlanningCompleted: (id: string, completed: boolean) => Promise<void>;
  updatePlanningItem: (id: string, text: string, assignedTo: string) => Promise<void>;
  deletePlanningItem: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Storage key names for offline fallback
const LOCAL_KEYS = {
  TRIP: 'cozy_travel_trip',
  MEMBERS: 'cozy_travel_members',
  SCHEDULES: 'cozy_travel_schedules',
  BOOKINGS: 'cozy_travel_bookings',
  EXPENSES: 'cozy_travel_expenses',
  JOURNALS: 'cozy_travel_journals',
  PLANNING: 'cozy_travel_planning',
  CURRENT_USER: 'cozy_travel_current_user'
};

const DEFAULT_TRIP_ID = 'cozy-default-trip';

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);
  const [planning, setPlanning] = useState<PlanningItem[]>([]);
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);

  // Set up and load mock initial values if LocalStorage is totally empty
  const loadMockInitialData = () => {
    const today = '2026-05-23';
    const day1 = '2026-06-02';
    const day2 = '2026-06-03';
    const day3 = '2026-06-04';
    const day4 = '2026-06-05';
    const day5 = '2026-06-06';
    const day6 = '2026-06-07';

    const initialTrip: Trip = {
      id: DEFAULT_TRIP_ID,
      name: '大阪手帳・ㄚㄚ與整隻魚的關西之旅 🌸',
      startDate: day1,
      endDate: day6,
      creatorId: 'local-creator-id',
      createdAt: new Date().toISOString()
    };

    const initialMembers: Member[] = [
      { id: 'local-creator-id', name: 'ㄚㄚ (你)', avatarUrl: 'https://i.pinimg.com/236x/82/cf/92/82cf929d20c58e578a2ea689fdfff9bb.jpg', joinedAt: new Date().toISOString() },
      { id: 'member-fish', name: '整隻魚', avatarUrl: 'https://i.pinimg.com/236x/ff/1d/15/ff1d15fd6cbdebc53dfadca2570bca41.jpg', joinedAt: new Date().toISOString() }
    ];

    const initialSchedules: Schedule[] = [
      {
        id: 'sch-donki',
        tripId: DEFAULT_TRIP_ID,
        date: day1,
        time: '22:00',
        title: '唐吉訶德 道頓堀店 🐧',
        category: '景點',
        location: '唐吉訶德 道頓堀店',
        mapsUrl: 'https://maps.google.com/?q=Don+Quijote+Dotonbori',
        notes: '24小時營業！著名的黃色六角形摩天輪分店，大肆採買零食、伴手禮與免稅藥妝 🛍️✨',
        images: ['https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=600&q=80'],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-1',
        tripId: DEFAULT_TRIP_ID,
        date: day1,
        time: '12:30',
        title: '高雄國際機場 (KHH) 集合',
        category: '交通',
        location: '高雄國際機場',
        mapsUrl: 'https://maps.google.com/?q=Kaohsiung+International+Airport',
        notes: '搭乘樂桃航空 MM032 前往大阪！起飛時間 14:15，請備妥護照，託運行李額度 20kg。',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-2',
        tripId: DEFAULT_TRIP_ID,
        date: day1,
        time: '14:15',
        title: '樂桃航空 MM032 啟航 ✈️',
        category: '交通',
        location: '樂桃航空 MM032',
        mapsUrl: '',
        notes: '高雄 (KHH) 14:15 -> 大阪關西 (KIX) 18:00。飛行時間約 2 小時 45 分。',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-3',
        tripId: DEFAULT_TRIP_ID,
        date: day1,
        time: '18:00',
        title: '抵達關西國際機場 (KIX)',
        category: '交通',
        location: '關西國際機場',
        mapsUrl: 'https://maps.google.com/?q=Kansai+International+Airport',
        notes: '預計 18:00 降落第一航廈。辦理通關、提領行李 (請注意託運 20kg 行李箱)。',
        images: [],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-4',
        tripId: DEFAULT_TRIP_ID,
        date: day1,
        time: '19:00',
        title: '搭乘 Innn 關西機場接送 🚗',
        category: '交通',
        location: '關西國際機場第一航廈接機大廳',
        mapsUrl: '',
        notes: '預約了 Innn 專車接送服務，司機會在接機大廳等候，直奔大阪市區民宿 blue shIMANOUCHI。',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-5',
        tripId: DEFAULT_TRIP_ID,
        date: day1,
        time: '20:30',
        title: '入住 blue shIMANOUCHI 民宿 🏡',
        category: '住宿',
        location: 'blue shIMANOUCHI',
        mapsUrl: 'https://maps.google.com/?q=Shimanouchi+Osaka',
        notes: '【溫馨公寓規格】\n- 獨立整套出租公寓：25 平方公尺舒適空間，可搭乘電梯輕鬆上樓 🛗\n- 舒眠床鋪：1 張雙人床 和 1 張沙發床（提供 2 床）\n- 私人廚房提供：洗衣機、冰箱、微波爐、基本廚房用具、電熱水壺、單口爐台，可簡單料理 🍳\n- 私人衛浴提供：舒適泡澡浴缸、淋浴間、免治溫水沖洗座、毛巾、吹風機、衛生紙 🛁\n- 公寓設備：獨立陽台市景、空調冷暖氣、免費高抗干擾 WiFi、舒適沙發\n- 評分高達 7.7 分（高CP值、設備齊全！）\n- 吸菸政策：室內全面禁菸 🚭\n入住時間 15:00 以後，退房時間 11:00 以前！',
        images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80'],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-6',
        tripId: DEFAULT_TRIP_ID,
        date: day2,
        time: '08:30',
        title: '日本環球影城狂歡一日遊 🎢',
        category: '景點',
        location: '日本環球影城 (USJ)',
        mapsUrl: 'https://maps.google.com/?q=Universal+Studios+Japan',
        notes: '6/3 行程是環球影城一整天！記得提早排隊衝瑪利歐與哈利波特園區，買足紀念品！',
        images: ['https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80'],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-7-1',
        tripId: DEFAULT_TRIP_ID,
        date: day3,
        time: '08:00',
        title: '日本橋 2 號出口集合出發 🚌',
        category: '交通',
        location: '近鐵日本橋駅 2 號出口 (大國藥妝店)',
        mapsUrl: 'https://maps.google.com/?q=1+Chome-3-6+Nipponbashi+Chuo+Ward+Osaka',
        notes: '【大阪出發・集合地詳情 📍】\n- 集合站點：近鐵日本橋駅 2 號出口（大國藥妝店前）\n- 日文地址：〒542-0073 大阪府大阪市中央區日本橋 1 丁目 3-6\n- 英文地址：1 Chome-3-6 Nipponbashi, Chuo Ward, Osaka, 542-0073 (或 1 Chome-18-14 Nipponbashi)\n- 集合時間：08:00 準時出發，請提前 10-15 分鐘抵達集合地點以免錯過精彩旅程！搭乘一日遊專車前往京都和奈良 🦌✨',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-7-2',
        tripId: DEFAULT_TRIP_ID,
        date: day3,
        time: '09:00',
        title: '奈良公園餵仙貝小鹿 🦌',
        category: '景點',
        location: '奈良公園',
        mapsUrl: 'https://maps.google.com/?q=Nara+Park',
        notes: '預計停留 60 分鐘。每組賓客特別贈送一盒鹿餅！餵鹿時請務必注意自身安全，提防貪吃小鹿喔！',
        images: ['https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=600&q=80'],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-7-3',
        tripId: DEFAULT_TRIP_ID,
        date: day3,
        time: '11:00',
        title: '伏見稻荷大社・千本鳥居 ⛩️',
        category: '景點',
        location: '伏見稻荷大社',
        mapsUrl: 'https://maps.google.com/?q=Fushimi+Inari+Taisha',
        notes: '預計停留 80 分鐘。漫步在充滿日式神祕感的朱紅色「千本鳥居」中，這裡是極具代表性的打卡聖地，帶上相機拍出優美和風吧！',
        images: ['https://images.unsplash.com/photo-1542931287-023b922fa89b?auto=format&fit=crop&w=600&q=80'],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-7-4',
        tripId: DEFAULT_TRIP_ID,
        date: day3,
        time: '13:20',
        title: '嵐山自由漫步 🏔️ 渡月橋與竹林',
        category: '景點',
        location: '京都嵐山',
        mapsUrl: 'https://maps.google.com/?q=Arashiyama',
        notes: '預計自由活動 180 分鐘！推薦亮點行程：\n1. 嵯峨野竹林小徑：沉浸在沁涼與幽靜的竹林美景。\n2. 世界文化遺產天龍寺：欣賞精緻絕倫的日式著名庭園。\n3. 嵐山車站足湯溫泉 (HANNARI-HOKKORI)：體驗日式暖心足湯。\n4. 友禪光林：欣賞 600 根圓柱化身絕美光影和服布料的森林。\n在渡月橋與保津川邊散步也超愜意！',
        images: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80'],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-7-5',
        tripId: DEFAULT_TRIP_ID,
        date: day3,
        time: '16:00',
        title: '整理心情・專車返程大阪 🚌',
        category: '交通',
        location: '京都站八條口 / 嵐山',
        mapsUrl: '',
        notes: '16:00 開始返回。約 16:40 會先經過「京都站八條口-站前觀光巴士停車場」讓京都上車的旅客下車，隨後直奔大阪。',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-7-6',
        tripId: DEFAULT_TRIP_ID,
        date: day3,
        time: '18:00',
        title: '返抵日本橋・自由晚餐與解散 🛍️',
        category: '景點',
        location: '日本橋地區',
        mapsUrl: 'https://maps.google.com/?q=Nihonbashi+Station+Osaka',
        notes: '預計 18:00 返抵大阪日本橋解散。晚上剛好可以在道頓堀/心齋橋大快朵頤，接著散步回 blue shIMANOUCHI 民宿休息！',
        images: [],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-8-1',
        tripId: DEFAULT_TRIP_ID,
        date: day4,
        time: '06:55',
        title: '日本橋 2 號出口 集合出發 🚇',
        category: '景點',
        location: '近鐵日本橋駅 2 號出口 (大國藥妝店)',
        mapsUrl: 'https://maps.google.com/?q=1+Chome-3-6+Nipponbashi+Chuo+Ward+Osaka',
        notes: '【大阪出發・集合地詳情 📍】\n- 集合站點：近鐵日本橋駅 2 號出口（大國藥妝店前）\n- 日文地址：〒542-0073 大阪府大阪市中央區日本橋 1 丁目 3-6\n- 英文地址：1 Chome-3-6 Nipponbashi, Chuo Ward, Osaka, 542-0073 (或 1 Chome-18-14 Nipponbashi)\n- 集合時間：06:55 準時集合出發，前往西舞鶴搭乘海上鐵道列車、探訪天橋立與伊根舟屋 🌊🛶',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-8-2',
        tripId: DEFAULT_TRIP_ID,
        date: day4,
        time: '09:10',
        title: '西舞鶴站 🚃 海上列車體驗',
        category: '交通',
        location: '西舞鶴站',
        mapsUrl: 'https://maps.google.com/?q=Nishi-Maizuru+Station',
        notes: '特別安排搭乘當地列車前往天橋立（參考班次：9:44 發車 ～ 10:28 抵達）。列車將沿著日本海岸線行駛，途經由良川橋樑，可欣賞宛如《神隱少女》般的「海上鐵道」絕美景色。包含 223D 號列車自由席車費，購票等候時間約 20 分鐘。',
        images: [],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-8-3',
        tripId: DEFAULT_TRIP_ID,
        date: day4,
        time: '10:30',
        title: '天橋立 View Land 觀景纜車 & 智恩寺 🏞️',
        category: '景點',
        location: '天橋立飛龍觀觀景台',
        mapsUrl: 'https://maps.google.com/?q=Amanohashidate+View+Land',
        notes: '日本三景之一。全長 3.6 公里的松林沙洲。行程亮點：\n1. 搭乘天橋立纜車登山（已含）俯瞰「飛龍觀」全景。\n2. 參拜供奉智慧之神的「智恩寺 (文殊堂)」。\n3. 觀賞不定時旋轉的「迴旋橋」。\n4. 漫步白沙松林「天橋立海水浴場」。',
        images: ['https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=400&q=80'],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-8-4',
        tripId: DEFAULT_TRIP_ID,
        date: day4,
        time: '13:40',
        title: '伊根舟屋 ＆ 餵海鷗伊根灣遊船 ⛵',
        category: '景點',
        location: '伊根舟屋',
        mapsUrl: 'https://maps.google.com/?q=Ine+no+Funaya',
        notes: '被譽為「日本威尼斯」的傳統漁村，沿著伊根灣分佈著 230 棟獨一無二的舟屋。特別贈送「伊根灣遊覽船（已含）」，從海上欣賞舟屋景緻，並親自體驗在船上餵食海鷗！打卡推薦：INE CAFE、舟之家日和。',
        images: ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80'],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-8-5',
        tripId: DEFAULT_TRIP_ID,
        date: day4,
        time: '15:50',
        title: '整理心情・專車返程大阪 🚌',
        category: '交通',
        location: '伊根町',
        mapsUrl: '',
        notes: '結束心曠神怡的日本三景與舟屋之旅，搭乘舒適專車啟程返回大阪市區。',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-8-6',
        tripId: DEFAULT_TRIP_ID,
        date: day4,
        time: '18:20',
        title: '抵達心齋橋・自由解散 🛍️',
        category: '景點',
        location: '大阪心齋橋區域',
        mapsUrl: 'https://maps.google.com/?q=Shinsaibashi+Osaka',
        notes: '預計 18:20 抵達心齋橋附近統一解散，剛好可以吃道頓堀熱騰騰的心齋橋晚餐、藥妝大採購，再散步回民宿 blue shIMANOUCHI！',
        images: [],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-9',
        tripId: DEFAULT_TRIP_ID,
        date: day5,
        time: '09:30',
        title: '大阪城天守閣歷史漫步 🏯',
        category: '景點',
        location: '大阪城天守閣',
        mapsUrl: 'https://maps.google.com/?q=Osaka+Castle',
        notes: '6/6 第一站！參觀雄偉的大阪城與草坪公園，登上天守閣俯瞰歷史景觀。',
        images: ['https://images.unsplash.com/photo-1542640244-7e672d6cef4e?auto=format&fit=crop&w=600&q=80'],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-10',
        tripId: DEFAULT_TRIP_ID,
        date: day5,
        time: '13:00',
        title: '難波八阪神社參拜 🦁',
        category: '景點',
        location: '難波八阪神社',
        mapsUrl: 'https://maps.google.com/?q=Namba+Yasaka+Shrine',
        notes: '6/6 第二站！非常推薦的巨型獅子殿造型神社，張著大嘴吸走厄運，祈求財運與好運！',
        images: [],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-11',
        tripId: DEFAULT_TRIP_ID,
        date: day5,
        time: '15:30',
        title: '通天閣 & 新世界散步 🗼',
        category: '景點',
        location: '通天閣',
        mapsUrl: 'https://maps.google.com/?q=Tsutenkaku',
        notes: '6/6 第三站！體驗老大阪新世界的懷舊魅力。摸摸比利肯神像鞋底祈福。',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-12',
        tripId: DEFAULT_TRIP_ID,
        date: day5,
        time: '18:00',
        title: '阿倍野 HARUKAS 300 望月夜景 🌆',
        category: '景點',
        location: '阿倍野 HARUKAS',
        mapsUrl: 'https://maps.google.com/?q=Abeno+Harukas',
        notes: '6/6 最精彩句點！登上高空展望台欣賞 360 度閃耀的大阪璀璨夜景！',
        images: [],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-13',
        tripId: DEFAULT_TRIP_ID,
        date: day6,
        time: '05:00',
        title: '搭乘 Innn 關西機場送機專車 🚗',
        category: '交通',
        location: 'blue shIMANOUCHI 民宿門口',
        mapsUrl: '',
        notes: '預約了 Innn 專車送機服務，上午 05:00 準時在民宿門口接送上車，直奔關西國際機場第一航廈。',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-13-airport',
        tripId: DEFAULT_TRIP_ID,
        date: day6,
        time: '08:00',
        title: '抵達關西機場第一航廈 & 辦理登機 ✈️',
        category: '交通',
        location: '關西國際機場第一航廈',
        mapsUrl: 'https://maps.google.com/?q=Kansai+International+Airport',
        notes: '準時抵達關西機場，提早整理好行李並準備辦理樂桃航空 MM031 登機與行李託運手續。',
        images: [],
        createdBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'sch-14',
        tripId: DEFAULT_TRIP_ID,
        date: day6,
        time: '11:15',
        title: '樂桃航空 MM031 起飛返台 🏡',
        category: '交通',
        location: '關西國際機場第一航廈',
        mapsUrl: '',
        notes: 'MM031 大阪 (KIX) 11:15 -> 高雄 (KHH) 13:30。回程行李託運注意不要超重！完美玩得超盡興！',
        images: [],
        createdBy: 'member-fish',
        createdAt: new Date().toISOString()
      }
    ];

    const initialBookings: Booking[] = [
      {
        id: 'bk-1',
        tripId: DEFAULT_TRIP_ID,
        type: 'flight',
        title: '去程：樂桃航空 MM032',
        date: day1,
        details: '航班 MM032\n去程 高雄 (KHH) 14:15 -> 大阪關西 (KIX) 18:00\n旅客：ㄚㄚ、整隻魚\n行李：託運 20kg / 人，手提 7kg\n備註：去回程來回機票總費用 NT$6,940',
        cost: 6940,
        currency: 'TWD',
        pinCode: '007',
        files: [],
        confirmedBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bk-2',
        tripId: DEFAULT_TRIP_ID,
        type: 'accommodation',
        title: 'blue shIMANOUCHI 舒適包棟公寓',
        date: day1,
        details: '【公寓詳情與設施】\n- 面積與房型：單臥室整套出租公寓 (25 平方公尺)\n- 床鋪配置：1張雙人床 & 1張沙發床 (共提供 2 張舒適床位)\n- 衛浴設施：附獨立浴缸、淋浴間、免治馬桶、吹風機、衛生紙與精緻毛巾 🛁\n- 廚房提供：獨立廚房配備洗衣機、冰箱、微波爐、電熱水壺、單口爐台與基本廚房用具 🍳\n- 公寓公共設施：WiFi 免費、空調與冷暖氣、景觀陽台 (市景)、可搭乘電梯直達 🛗\n- 禁菸特殊政策：全面室內禁菸 🚭\n- 入住時間：15:00 以後 / 退房時間：11:00 以前\n- 旅客：2 位 (ㄚㄚ跟整隻魚)\n- 評分：住客滿意評分高達 7.7 分！\n備註：預訂總費用 NT$7,000',
        cost: 7000,
        currency: 'TWD',
        pinCode: '008',
        files: [],
        confirmedBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bk-3',
        tripId: DEFAULT_TRIP_ID,
        type: 'car',
        title: 'Innn 關西機場單程接送',
        date: day1,
        details: '接機時間: 18:45-19:00 左右 (配合航班 MM032 抵達)\n乘車點: 關西國際機場第一航廈\n送達點: blue shIMANOUCHI\n車商：搭乘 Innn 機場接送專車\n備註：去回機接送總計 NT$930，去程分攤 NT$465',
        cost: 465,
        currency: 'TWD',
        pinCode: '009',
        files: [],
        confirmedBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bk-4',
        tripId: DEFAULT_TRIP_ID,
        type: 'flight',
        title: '回程：樂桃航空 MM031',
        date: day6,
        details: '航班 MM031\n回程 大阪關西 (KIX) 11:15 -> 高雄 (KHH) 13:30\n旅客：ㄚㄚ、整隻魚\n備註：費用已合併至去程項目 (NT$6,940) 中計算',
        cost: 0,
        currency: 'TWD',
        pinCode: '010',
        files: [],
        confirmedBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bk-5',
        tripId: DEFAULT_TRIP_ID,
        type: 'car',
        title: 'Innn 關西機場單程接送 (送機)',
        date: day6,
        details: '接送時間: 05:00 AM 準時在飯店/民宿門口接送\n乘車點: blue shIMANOUCHI 民宿門口\n送達點: 關西國際機場第一航廈\n車商：搭乘 Innn 關西機場單程接送專車\n備註：去回機接送總計 NT$930，回程分攤 NT$465',
        cost: 465,
        currency: 'TWD',
        pinCode: '011',
        files: [],
        confirmedBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bk-6',
        tripId: DEFAULT_TRIP_ID,
        type: 'ticket',
        title: '京都＆奈良經典一日遊 🦌⛩️ (6/4)',
        date: day3,
        details: '一日遊行程 (6/4)\n【大阪出發・集合地詳情 📍】\n- 集合站點：近鐵日本橋駅 2 號出口（大國藥妝店前）\n- 專車前往京都嵐山、伏見稻荷大社、奈良公園\n費用：NT$930',
        cost: 930,
        currency: 'TWD',
        pinCode: '012',
        files: [],
        confirmedBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bk-7',
        tripId: DEFAULT_TRIP_ID,
        type: 'ticket',
        title: '天橋立＆伊根舟屋一日遊 🌊🛶 (6/5)',
        date: day4,
        details: '一日遊行程 (6/5)\n【大阪出發・集合地詳情 📍】\n- 集合站點：近鐵日本橋駅 2 號出口（大國藥妝店前）\n- 搭乘海上列車體驗、探訪天橋立與伊根舟屋\n費用：NT$1,950',
        cost: 1950,
        currency: 'TWD',
        pinCode: '013',
        files: [],
        confirmedBy: 'member-fish',
        createdAt: new Date().toISOString()
      },
      {
        id: 'bk-8',
        tripId: DEFAULT_TRIP_ID,
        type: 'ticket',
        title: '日本環球影城電子門票 門票二人份 🎢',
        date: day2,
        details: '日本環球影城 (USJ) 一日門票\n旅客：ㄚㄚ、整隻魚 (2 人)\n備註：每人門票 NT$2,010，雙人總計 NT$4,020',
        cost: 4020,
        currency: 'TWD',
        pinCode: '014',
        files: [],
        confirmedBy: 'local-creator-id',
        createdAt: new Date().toISOString()
      }
    ];

    const initialExpenses: Expense[] = [
      {
        id: 'exp-1',
        tripId: DEFAULT_TRIP_ID,
        date: day2,
        description: '日本環球影城門票二人份 (USJ)',
        amount: 4020,
        currency: 'TWD',
        exchangeRate: 1.0,
        amountTWD: 4020,
        paidBy: 'local-creator-id',
        splitWith: ['local-creator-id', 'member-fish'],
        category: '景點門票',
        createdAt: new Date().toISOString()
      },
      {
        id: 'exp-2',
        tripId: DEFAULT_TRIP_ID,
        date: day1,
        description: 'blue shIMANOUCHI 民宿部分訂金',
        amount: 25000,
        currency: 'JPY',
        exchangeRate: 0.21,
        amountTWD: 5250,
        paidBy: 'member-fish',
        splitWith: ['local-creator-id', 'member-fish'],
        category: '住宿費用',
        createdAt: new Date().toISOString()
      }
    ];

    const initialJournals: Journal[] = [
      {
        id: 'jr-1',
        tripId: DEFAULT_TRIP_ID,
        date: today,
        authorId: 'local-creator-id',
        title: '高雄飛大阪 ㄚㄚ與整隻魚的驚喜冒險！✈️',
        content: '超期待 6/2-6/7 的大阪旅程呀！我們這次要搭乘樂桃航空 MM032，手提 7kg + 託運 20kg 行李，完全有足夠的扣度可以狂買！\n第一晚預約了溫馨的 Innn 關西機場接送，能直接舒適送達位於島之內的 blue shIMANOUCHI 住所，真是太棒了。 \n第二天更排定最狂熱的「日本環球影城」！期待跟整隻魚一起狂歡拍照，寫下我們滿滿的手帳旅行日記！',
        images: ['https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=400&q=80'],
        createdAt: new Date().toISOString()
      }
    ];

    const initialPlanning: PlanningItem[] = [
      { id: 'plan-1', tripId: DEFAULT_TRIP_ID, type: 'todo', text: '確認護照效期大於 6 個月', assignedTo: 'all', completed: true, createdBy: 'local-creator-id', createdAt: new Date().toISOString() },
      { id: 'plan-2', tripId: DEFAULT_TRIP_ID, type: 'todo', text: '上網登記 Visit Japan Web 申報資料', assignedTo: 'all', completed: false, createdBy: 'local-creator-id', createdAt: new Date().toISOString() },
      { id: 'plan-3', tripId: DEFAULT_TRIP_ID, type: 'todo', text: '預約 & 再次聯絡確認 Innn 機場接送車牌資訊', assignedTo: 'local-creator-id', completed: true, createdBy: 'local-creator-id', createdAt: new Date().toISOString() },
      { id: 'plan-4', tripId: DEFAULT_TRIP_ID, type: 'luggage', text: '準備 20kg 可託運行李箱與空包 (買好買滿)', assignedTo: 'all', completed: false, createdBy: 'member-fish', createdAt: new Date().toISOString() },
      { id: 'plan-5', tripId: DEFAULT_TRIP_ID, type: 'shopping', text: '環球影城馬利歐帽與限定水壺', assignedTo: 'member-fish', completed: false, createdBy: 'member-fish', createdAt: new Date().toISOString() },
      { id: 'plan-6', tripId: DEFAULT_TRIP_ID, type: 'todo', text: '換好並準備日幣現金：1 人 50,000 JPY 💳', assignedTo: 'all', completed: false, createdBy: 'local-creator-id', createdAt: new Date().toISOString() }
    ];

    localStorage.setItem(LOCAL_KEYS.TRIP, JSON.stringify(initialTrip));
    localStorage.setItem(LOCAL_KEYS.MEMBERS, JSON.stringify(initialMembers));
    localStorage.setItem(LOCAL_KEYS.SCHEDULES, JSON.stringify(initialSchedules));
    localStorage.setItem(LOCAL_KEYS.BOOKINGS, JSON.stringify(initialBookings));
    localStorage.setItem(LOCAL_KEYS.EXPENSES, JSON.stringify(initialExpenses));
    localStorage.setItem(LOCAL_KEYS.JOURNALS, JSON.stringify(initialJournals));
    localStorage.setItem(LOCAL_KEYS.PLANNING, JSON.stringify(initialPlanning));

    const defaultMe = initialMembers[0];
    localStorage.setItem(LOCAL_KEYS.CURRENT_USER, JSON.stringify(defaultMe));

    setCurrentTrip(initialTrip);
    setMembers(initialMembers);
    setSchedules(initialSchedules);
    setBookings(initialBookings);
    setExpenses(initialExpenses);
    setJournals(initialJournals);
    setPlanning(initialPlanning);
    setCurrentUser(defaultMe);
  };

  // Run Auth check & Realtime listeners or Local storage Loading
  useEffect(() => {
    // Clear old Kyoto or un-updated Osaka trip if cached, to force new Osaka trip with Tian Qiao Li, Nara day tour, blue shIMANOUCHI specs, exact avatars, Nihonbashi exit 2 details, Fushimi Inari, Osaka Castle, and Nara Park photos loading!
    const cachedTrip = localStorage.getItem(LOCAL_KEYS.TRIP);
    const cachedSchedulesStr = localStorage.getItem(LOCAL_KEYS.SCHEDULES);
    const cachedMembersStr = localStorage.getItem(LOCAL_KEYS.MEMBERS);
    const hasTienChiaoLi = cachedSchedulesStr && cachedSchedulesStr.includes('天橋立');
    const hasNara = cachedSchedulesStr && cachedSchedulesStr.includes('伏見稻荷');
    const hasShimanouchiSpec = cachedSchedulesStr && cachedSchedulesStr.includes('25 平方公尺');
    const hasNewAvatars = cachedMembersStr && cachedMembersStr.includes('82cf929d20c58e578a2ea689fdfff9bb');
    const hasNihonbashiExt = cachedSchedulesStr && cachedSchedulesStr.includes('大國藥妝店');
    const hasFushimiInariPic = cachedSchedulesStr && cachedSchedulesStr.includes('photo-1542931287-023b922fa89b');
    const hasNaraParkPic = cachedSchedulesStr && cachedSchedulesStr.includes('photo-1590502593747-42a996133562');
    const hasOsakaCastlePic = cachedSchedulesStr && cachedSchedulesStr.includes('photo-1542640244-7e672d6cef4e');
    const hasDonQuijoteNight = cachedSchedulesStr && cachedSchedulesStr.includes('唐吉訶德') && cachedSchedulesStr.includes('22:00');
    const hasInnnReturn = cachedSchedulesStr && cachedSchedulesStr.includes('Innn 關西機場送機專車');
    const cachedBookingsStr = localStorage.getItem(LOCAL_KEYS.BOOKINGS);
    const hasUpdatedPrices = cachedBookingsStr && cachedBookingsStr.includes('6940') && cachedBookingsStr.includes('1950');
    const hasUSJTicket = cachedBookingsStr && cachedBookingsStr.includes('4020');
    const cachedPlanningStr = localStorage.getItem(LOCAL_KEYS.PLANNING);
    const hasPocketMoney = cachedPlanningStr && cachedPlanningStr.includes('50,000');
    if (cachedTrip) {
      try {
         const tripObj = JSON.parse(cachedTrip);
         if (tripObj.name && (tripObj.name.includes('京都') || tripObj.name.includes('森林手帳') || !hasTienChiaoLi || !hasNara || !hasShimanouchiSpec || !hasNewAvatars || !hasNihonbashiExt || !hasFushimiInariPic || !hasNaraParkPic || !hasOsakaCastlePic || !hasDonQuijoteNight || !hasInnnReturn || !hasUpdatedPrices || !hasUSJTicket || !hasPocketMoney)) {
          localStorage.removeItem(LOCAL_KEYS.TRIP);
          localStorage.removeItem(LOCAL_KEYS.MEMBERS);
          localStorage.removeItem(LOCAL_KEYS.SCHEDULES);
          localStorage.removeItem(LOCAL_KEYS.BOOKINGS);
          localStorage.removeItem(LOCAL_KEYS.EXPENSES);
          localStorage.removeItem(LOCAL_KEYS.JOURNALS);
          localStorage.removeItem(LOCAL_KEYS.PLANNING);
          localStorage.removeItem(LOCAL_KEYS.CURRENT_USER);
        }
      } catch (err) {
        console.error("Cache parsing error", err);
      }
    }

    // Check if Local Database empty, seed it
    if (!localStorage.getItem(LOCAL_KEYS.TRIP)) {
      loadMockInitialData();
      setIsLoading(false);
      return;
    }

    if (!isFirebaseConfigured) {
      // Offline/Local sandbox state execution
      setIsCloudSyncing(false);
      try {
        const cachedTrip = localStorage.getItem(LOCAL_KEYS.TRIP);
        const cachedMembers = localStorage.getItem(LOCAL_KEYS.MEMBERS);
        const cachedSchedules = localStorage.getItem(LOCAL_KEYS.SCHEDULES);
        const cachedBookings = localStorage.getItem(LOCAL_KEYS.BOOKINGS);
        const cachedExpenses = localStorage.getItem(LOCAL_KEYS.EXPENSES);
        const cachedJournals = localStorage.getItem(LOCAL_KEYS.JOURNALS);
        const cachedPlanning = localStorage.getItem(LOCAL_KEYS.PLANNING);
        const cachedMe = localStorage.getItem(LOCAL_KEYS.CURRENT_USER);

        if (cachedTrip) setCurrentTrip(JSON.parse(cachedTrip));
        if (cachedMembers) setMembers(JSON.parse(cachedMembers));
        if (cachedSchedules) setSchedules(JSON.parse(cachedSchedules));
        if (cachedBookings) setBookings(JSON.parse(cachedBookings));
        if (cachedExpenses) setExpenses(JSON.parse(cachedExpenses));
        if (cachedJournals) setJournals(JSON.parse(cachedJournals));
        if (cachedPlanning) setPlanning(JSON.parse(cachedPlanning));
        if (cachedMe) setCurrentUser(JSON.parse(cachedMe));
      } catch (err) {
        console.error("Local deserialization error, clearing cache:", err);
      }
      setIsLoading(false);
    } else {
      // Firebase cloud sync setup
      setIsCloudSyncing(true);
      
      // Perform anonymous login automatically
      const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
        if (!user) {
          try {
            await signInAnonymously(auth);
          } catch (err) {
            console.warn("Anonymous authentication failed or restricted on Firebase Console. Falling back to local offline mode:", err);
            setIsCloudSyncing(false);
            try {
              const cachedTrip = localStorage.getItem(LOCAL_KEYS.TRIP);
              const cachedMembers = localStorage.getItem(LOCAL_KEYS.MEMBERS);
              const cachedSchedules = localStorage.getItem(LOCAL_KEYS.SCHEDULES);
              const cachedBookings = localStorage.getItem(LOCAL_KEYS.BOOKINGS);
              const cachedExpenses = localStorage.getItem(LOCAL_KEYS.EXPENSES);
              const cachedJournals = localStorage.getItem(LOCAL_KEYS.JOURNALS);
              const cachedPlanning = localStorage.getItem(LOCAL_KEYS.PLANNING);
              const cachedMe = localStorage.getItem(LOCAL_KEYS.CURRENT_USER);

              if (cachedTrip) setCurrentTrip(JSON.parse(cachedTrip));
              if (cachedMembers) setMembers(JSON.parse(cachedMembers));
              if (cachedSchedules) setSchedules(JSON.parse(cachedSchedules));
              if (cachedBookings) setBookings(JSON.parse(cachedBookings));
              if (cachedExpenses) setExpenses(JSON.parse(cachedExpenses));
              if (cachedJournals) setJournals(JSON.parse(cachedJournals));
              if (cachedPlanning) setPlanning(JSON.parse(cachedPlanning));
              if (cachedMe) setCurrentUser(JSON.parse(cachedMe));
            } catch (fallbackErr) {
              console.error("Local deserialization error in auth fallback:", fallbackErr);
            }
            setIsLoading(false);
          }
        } else {
          // Sync current logged in user as member
          const localMe = localStorage.getItem(LOCAL_KEYS.CURRENT_USER);
          let userObj: Member;
          if (localMe) {
            userObj = { ...JSON.parse(localMe), id: user.uid };
          } else {
            userObj = {
              id: user.uid,
              name: '新島民',
              avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
              joinedAt: new Date().toISOString()
            };
          }
          setCurrentUser(userObj);
          localStorage.setItem(LOCAL_KEYS.CURRENT_USER, JSON.stringify(userObj));
          
          // Setup real-time listeners for default trip
          const tripRef = doc(db, 'trips', DEFAULT_TRIP_ID);
          
          // Sync Trip document (create default if not exist)
          const unsubTrip = onSnapshot(tripRef, (snap) => {
            if (snap.exists()) {
              setCurrentTrip({ id: snap.id, ...snap.data() } as Trip);
            } else {
              // Create core default structure in firestore
              const defaultNewTrip: Trip = {
                id: DEFAULT_TRIP_ID,
                name: '九周年大阪遊・ㄚㄚ與整隻魚的關西之旅 🌸',
                startDate: '2026-06-02',
                endDate: '2026-06-07',
                creatorId: user.uid,
                createdAt: new Date().toISOString()
              };
              setDoc(tripRef, defaultNewTrip)
                .catch(e => handleFirestoreError(e, OperationType.WRITE, `trips/${DEFAULT_TRIP_ID}`));
            }
          }, (err) => handleFirestoreError(err, OperationType.GET, `trips/${DEFAULT_TRIP_ID}`));

          // Sync Members collection
          const membersRef = collection(db, 'trips', DEFAULT_TRIP_ID, 'members');
          const unsubMembers = onSnapshot(membersRef, (snap) => {
            const list: Member[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Member));
            
            // Auto add current user to members list if they don't exist yet
            const foundUser = list.find(m => m.id === user.uid);
            if (!foundUser && list.length < 50) {
              setDoc(doc(db, 'trips', DEFAULT_TRIP_ID, 'members', user.uid), userObj)
                .catch(e => handleFirestoreError(e, OperationType.WRITE, `trips/${DEFAULT_TRIP_ID}/members/${user.uid}`));
            }
            
            setMembers(list.length > 0 ? list : [userObj]);
          }, (err) => handleFirestoreError(err, OperationType.GET, `trips/${DEFAULT_TRIP_ID}/members`));

          // Sync Schedules
          const schedulesRef = collection(db, 'trips', DEFAULT_TRIP_ID, 'schedules');
          const unsubSchedules = onSnapshot(schedulesRef, (snap) => {
            const list: Schedule[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Schedule));
            setSchedules(list.sort((a,b) => a.time.localeCompare(b.time)));
          }, (err) => handleFirestoreError(err, OperationType.GET, `trips/${DEFAULT_TRIP_ID}/schedules`));

          // Sync Bookings
          const bookingsRef = collection(db, 'trips', DEFAULT_TRIP_ID, 'bookings');
          const unsubBookings = onSnapshot(bookingsRef, (snap) => {
            const list: Booking[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Booking));
            setBookings(list.sort((a,b) => a.date.localeCompare(b.date)));
          }, (err) => handleFirestoreError(err, OperationType.GET, `trips/${DEFAULT_TRIP_ID}/bookings`));

          // Sync Expenses
          const expensesRef = collection(db, 'trips', DEFAULT_TRIP_ID, 'expenses');
          const unsubExpenses = onSnapshot(expensesRef, (snap) => {
            const list: Expense[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Expense));
            setExpenses(list.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
          }, (err) => handleFirestoreError(err, OperationType.GET, `trips/${DEFAULT_TRIP_ID}/expenses`));

          // Sync Journals
          const journalsRef = collection(db, 'trips', DEFAULT_TRIP_ID, 'journals');
          const unsubJournals = onSnapshot(journalsRef, (snap) => {
            const list: Journal[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as Journal));
            setJournals(list.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
          }, (err) => handleFirestoreError(err, OperationType.GET, `trips/${DEFAULT_TRIP_ID}/journals`));

          // Sync Planning Checklist
          const planningRef = collection(db, 'trips', DEFAULT_TRIP_ID, 'planning');
          const unsubPlanning = onSnapshot(planningRef, (snap) => {
            const list: PlanningItem[] = [];
            snap.forEach((d) => list.push({ id: d.id, ...d.data() } as PlanningItem));
            setPlanning(list.sort((a,b) => b.createdAt.localeCompare(a.createdAt)));
          }, (err) => handleFirestoreError(err, OperationType.GET, `trips/${DEFAULT_TRIP_ID}/planning`));

          setIsLoading(false);
          
          return () => {
            unsubTrip();
            unsubMembers();
            unsubSchedules();
            unsubBookings();
            unsubExpenses();
            unsubJournals();
            unsubPlanning();
          };
        }
      });

      return () => unsubscribeAuth();
    }
  }, []);

  // Sync to local storage regularly if offline
  const saveLocalState = (key: string, data: any) => {
    if (!isFirebaseConfigured || !isCloudSyncing) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  };

  // --- TRIP OPERATIONS ---
  const updateTrip = async (name: string, startDate: string, endDate: string, bannerUrl?: string) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const docRef = doc(db, 'trips', DEFAULT_TRIP_ID);
      try {
        await updateDoc(docRef, { name, startDate, endDate, bannerUrl });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `trips/${DEFAULT_TRIP_ID}`);
      }
    } else {
      if (!currentTrip) return;
      const updated = { ...currentTrip, name, startDate, endDate, bannerUrl };
      setCurrentTrip(updated);
      saveLocalState(LOCAL_KEYS.TRIP, updated);
    }
  };

  // --- MEMBER OPERATIONS ---
  const upsertMember = async (name: string, avatarUrl: string) => {
    const updatedUser: Member = {
      id: currentUser?.id || 'local-creator-id',
      name,
      avatarUrl,
      joinedAt: currentUser?.joinedAt || new Date().toISOString()
    };
    setCurrentUser(updatedUser);
    localStorage.setItem(LOCAL_KEYS.CURRENT_USER, JSON.stringify(updatedUser));

    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser && currentUser) {
      const memberRef = doc(db, 'trips', DEFAULT_TRIP_ID, 'members', currentUser.id);
      try {
        await setDoc(memberRef, updatedUser);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `trips/${DEFAULT_TRIP_ID}/members/${currentUser.id}`);
      }
    } else {
      const matchIndex = members.findIndex(m => m.id === updatedUser.id);
      let updatedMembers = [...members];
      if (matchIndex >= 0) {
        updatedMembers[matchIndex] = updatedUser;
      } else {
        updatedMembers.push(updatedUser);
      }
      setMembers(updatedMembers);
      saveLocalState(LOCAL_KEYS.MEMBERS, updatedMembers);
    }
  };

  // --- SCHEDULE ITINERARY OPERATIONS ---
  const addSchedule = async (item: Omit<Schedule, 'id' | 'tripId' | 'createdBy' | 'createdAt'>) => {
    const id = 'sch-' + Math.random().toString(36).substr(2, 9);
    const mockCreatedBy = currentUser?.id || 'local-creator-id';
    const finalItem: Schedule = {
      ...item,
      id,
      tripId: DEFAULT_TRIP_ID,
      createdBy: mockCreatedBy,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const scheduleRef = doc(db, 'trips', DEFAULT_TRIP_ID, 'schedules', id);
      try {
        await setDoc(scheduleRef, {
          ...finalItem,
          createdAt: new Date().toISOString() // Let client timestamp pass but secure, or firebaseServerTimestamp
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `trips/${DEFAULT_TRIP_ID}/schedules/${id}`);
      }
    } else {
      const updated = [...schedules, finalItem].sort((a,b) => a.time.localeCompare(b.time));
      setSchedules(updated);
      saveLocalState(LOCAL_KEYS.SCHEDULES, updated);
    }
  };

  const updateSchedule = async (id: string, item: Partial<Schedule>) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const scRef = doc(db, 'trips', DEFAULT_TRIP_ID, 'schedules', id);
      try {
        await updateDoc(scRef, item);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `trips/${DEFAULT_TRIP_ID}/schedules/${id}`);
      }
    } else {
      const updatedList = schedules.map(s => {
        if (s.id === id) {
          return { ...s, ...item };
        }
        return s;
      });
      setSchedules(updatedList);
      saveLocalState(LOCAL_KEYS.SCHEDULES, updatedList);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const scRef = doc(db, 'trips', DEFAULT_TRIP_ID, 'schedules', id);
      try {
        await deleteDoc(scRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `trips/${DEFAULT_TRIP_ID}/schedules/${id}`);
      }
    } else {
      const updatedList = schedules.filter(s => s.id !== id);
      setSchedules(updatedList);
      saveLocalState(LOCAL_KEYS.SCHEDULES, updatedList);
    }
  };

  // --- BOOKING OPERATIONS ---
  const addBooking = async (booking: Omit<Booking, 'id' | 'tripId' | 'confirmedBy' | 'createdAt'>) => {
    const id = 'bk-' + Math.random().toString(36).substr(2, 9);
    const mockConfirmedBy = currentUser?.id || 'local-creator-id';
    const finalBooking: Booking = {
      ...booking,
      id,
      tripId: DEFAULT_TRIP_ID,
      confirmedBy: mockConfirmedBy,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const bookingRef = doc(db, 'trips', DEFAULT_TRIP_ID, 'bookings', id);
      try {
        await setDoc(bookingRef, {
          ...finalBooking,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `trips/${DEFAULT_TRIP_ID}/bookings/${id}`);
      }
    } else {
      const updated = [...bookings, finalBooking].sort((a,b) => a.date.localeCompare(b.date));
      setBookings(updated);
      saveLocalState(LOCAL_KEYS.BOOKINGS, updated);
    }
  };

  const updateBooking = async (id: string, booking: Partial<Booking>) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const bkRef = doc(db, 'trips', DEFAULT_TRIP_ID, 'bookings', id);
      try {
        await updateDoc(bkRef, booking);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `trips/${DEFAULT_TRIP_ID}/bookings/${id}`);
      }
    } else {
      const updatedList = bookings.map(b => (b.id === id ? { ...b, ...booking } : b));
      setBookings(updatedList);
      saveLocalState(LOCAL_KEYS.BOOKINGS, updatedList);
    }
  };

  const deleteBooking = async (id: string) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const bkRef = doc(db, 'trips', DEFAULT_TRIP_ID, 'bookings', id);
      try {
        await deleteDoc(bkRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `trips/${DEFAULT_TRIP_ID}/bookings/${id}`);
      }
    } else {
      const updatedList = bookings.filter(b => b.id !== id);
      setBookings(updatedList);
      saveLocalState(LOCAL_KEYS.BOOKINGS, updatedList);
    }
  };

  // --- EXPENSE OPERATIONS ---
  const addExpense = async (expense: Omit<Expense, 'id' | 'tripId' | 'createdAt'>) => {
    const id = 'exp-' + Math.random().toString(36).substr(2, 9);
    const finalExpense: Expense = {
      ...expense,
      id,
      tripId: DEFAULT_TRIP_ID,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const ref = doc(db, 'trips', DEFAULT_TRIP_ID, 'expenses', id);
      try {
        await setDoc(ref, {
          ...finalExpense,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `trips/${DEFAULT_TRIP_ID}/expenses/${id}`);
      }
    } else {
      const updated = [finalExpense, ...expenses];
      setExpenses(updated);
      saveLocalState(LOCAL_KEYS.EXPENSES, updated);
    }
  };

  const updateExpense = async (id: string, expense: Partial<Expense>) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const ref = doc(db, 'trips', DEFAULT_TRIP_ID, 'expenses', id);
      try {
        await updateDoc(ref, expense);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `trips/${DEFAULT_TRIP_ID}/expenses/${id}`);
      }
    } else {
      const updatedList = expenses.map(e => (e.id === id ? { ...e, ...expense } : e));
      setExpenses(updatedList);
      saveLocalState(LOCAL_KEYS.EXPENSES, updatedList);
    }
  };

  const deleteExpense = async (id: string) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const ref = doc(db, 'trips', DEFAULT_TRIP_ID, 'expenses', id);
      try {
        await deleteDoc(ref);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `trips/${DEFAULT_TRIP_ID}/expenses/${id}`);
      }
    } else {
      const updatedList = expenses.filter(e => e.id !== id);
      setExpenses(updatedList);
      saveLocalState(LOCAL_KEYS.EXPENSES, updatedList);
    }
  };

  // --- JOURNAL OPERATIONS ---
  const addJournal = async (journal: Omit<Journal, 'id' | 'tripId' | 'authorId' | 'createdAt'>) => {
    const id = 'jr-' + Math.random().toString(36).substr(2, 9);
    const mockAuthor = currentUser?.id || 'local-creator-id';
    const finalJournal: Journal = {
      ...journal,
      id,
      tripId: DEFAULT_TRIP_ID,
      authorId: mockAuthor,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const ref = doc(db, 'trips', DEFAULT_TRIP_ID, 'journals', id);
      try {
        await setDoc(ref, {
          ...finalJournal,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `trips/${DEFAULT_TRIP_ID}/journals/${id}`);
      }
    } else {
      const updated = [finalJournal, ...journals];
      setJournals(updated);
      saveLocalState(LOCAL_KEYS.JOURNALS, updated);
    }
  };

  const deleteJournal = async (id: string) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const ref = doc(db, 'trips', DEFAULT_TRIP_ID, 'journals', id);
      try {
        await deleteDoc(ref);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `trips/${DEFAULT_TRIP_ID}/journals/${id}`);
      }
    } else {
      const updatedList = journals.filter(j => j.id !== id);
      setJournals(updatedList);
      saveLocalState(LOCAL_KEYS.JOURNALS, updatedList);
    }
  };

  // --- CHECKLIST PLANNING OPERATIONS ---
  const addPlanning = async (text: string, type: PlanningType, assignedTo: string) => {
    const id = 'plan-' + Math.random().toString(36).substr(2, 9);
    const creator = currentUser?.id || 'local-creator-id';
    const finalItem: PlanningItem = {
      id,
      tripId: DEFAULT_TRIP_ID,
      type,
      text,
      assignedTo,
      completed: false,
      createdBy: creator,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const ref = doc(db, 'trips', DEFAULT_TRIP_ID, 'planning', id);
      try {
        await setDoc(ref, {
          ...finalItem,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `trips/${DEFAULT_TRIP_ID}/planning/${id}`);
      }
    } else {
      const updated = [finalItem, ...planning];
      setPlanning(updated);
      saveLocalState(LOCAL_KEYS.PLANNING, updated);
    }
  };

  const togglePlanningCompleted = async (id: string, completed: boolean) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const ref = doc(db, 'trips', DEFAULT_TRIP_ID, 'planning', id);
      try {
        await updateDoc(ref, { completed });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `trips/${DEFAULT_TRIP_ID}/planning/${id}`);
      }
    } else {
      const updatedList = planning.map(p => (p.id === id ? { ...p, completed } : p));
      setPlanning(updatedList);
      saveLocalState(LOCAL_KEYS.PLANNING, updatedList);
    }
  };

  const updatePlanningItem = async (id: string, text: string, assignedTo: string) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const ref = doc(db, 'trips', DEFAULT_TRIP_ID, 'planning', id);
      try {
        await updateDoc(ref, { text, assignedTo });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `trips/${DEFAULT_TRIP_ID}/planning/${id}`);
      }
    } else {
      const updatedList = planning.map(p => (p.id === id ? { ...p, text, assignedTo } : p));
      setPlanning(updatedList);
      saveLocalState(LOCAL_KEYS.PLANNING, updatedList);
    }
  };

  const deletePlanningItem = async (id: string) => {
    if (isFirebaseConfigured && db && isCloudSyncing && auth?.currentUser) {
      const ref = doc(db, 'trips', DEFAULT_TRIP_ID, 'planning', id);
      try {
        await deleteDoc(ref);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `trips/${DEFAULT_TRIP_ID}/planning/${id}`);
      }
    } else {
      const updatedList = planning.filter(p => p.id !== id);
      setPlanning(updatedList);
      saveLocalState(LOCAL_KEYS.PLANNING, updatedList);
    }
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseConfigured || !auth) {
      console.warn("Firebase is not configured for authentication.");
      return;
    }
    const provider = new GoogleAuthProvider();
    try {
      setIsLoading(true);
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Google Sign-In failed:", err);
      setIsLoading(false);
      alert("Google 登入失敗：" + (err instanceof Error ? err.message : String(err)));
    }
  };

  const logout = async () => {
    if (!isFirebaseConfigured || !auth) return;
    try {
      setIsLoading(true);
      await signOut(auth);
      // Reset to local mode upon signout
      setIsCloudSyncing(false);
      loadMockInitialData();
      setIsLoading(false);
    } catch (err) {
      console.error("Sign-Out failed:", err);
      setIsLoading(false);
    }
  };

  return (
    <DataContext.Provider value={{
      currentTrip,
      members,
      schedules,
      bookings,
      expenses,
      journals,
      planning,
      currentUser,
      isLoading,
      isCloudSyncing,
      loginWithGoogle,
      logout,
      
      // Operations
      updateTrip,
      upsertMember,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      addBooking,
      updateBooking,
      deleteBooking,
      addExpense,
      updateExpense,
      deleteExpense,
      addJournal,
      deleteJournal,
      addPlanning,
      togglePlanningCompleted,
      updatePlanningItem,
      deletePlanningItem
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
