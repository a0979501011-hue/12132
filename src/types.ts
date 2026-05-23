/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  bannerUrl?: string;
  creatorId: string;
  createdAt: string;
}

export interface Member {
  id: string;
  name: string;
  avatarUrl: string;
  joinedAt: string;
}

export type ScheduleCategory = '景點' | '美食' | '交通' | '住宿' | '其他';

export interface Schedule {
  id: string;
  tripId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM or similar
  title: string;
  category: ScheduleCategory;
  location: string;
  mapsUrl: string;
  notes: string;
  images: string[]; // Base64 encoded or storage URLs
  createdBy: string;
  createdAt: string;
}

export type BookingType = 'flight' | 'accommodation' | 'car' | 'ticket';

export interface Booking {
  id: string;
  tripId: string;
  type: BookingType;
  title: string;
  date: string; // Flight date, Check-in date, etc.
  details: string; // Airline, confirmation code, check-out time, address, etc.
  cost: number;
  currency: string;
  pinCode?: string; // Optional security PIN code
  files: string[]; // List of files as Base64 data URLs or storage paths
  confirmedBy: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  tripId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  currency: string; // TWD, JPY, USD, etc.
  exchangeRate: number; // exchange rate to TWD (e.g., JPY to TWD is ~0.21)
  amountTWD: number; // calculated
  paidBy: string; // User ID/Name
  splitWith: string[]; // Array of member IDs
  category: string;
  createdAt: string;
}

export interface Journal {
  id: string;
  tripId: string;
  date: string; // YYYY-MM-DD
  authorId: string;
  title: string;
  content: string;
  images: string[]; // Base64 or storage URLs
  createdAt: string;
}

export type PlanningType = 'todo' | 'luggage' | 'shopping';

export interface PlanningItem {
  id: string;
  tripId: string;
  type: PlanningType;
  text: string;
  assignedTo: string; // Member ID or 'all'
  completed: boolean;
  createdBy: string;
  createdAt: string;
}
