import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { pricingService, notificationService, usageService } from '@/services/api.ts';
import type {
  DeliveryArea, GarmentType, LaundryService,
  AppNotification, UsageStats,
} from '@/types/index.ts';

const EMPTY_USAGE: UsageStats = {
  total_units: 0,
  units_used: 0,
  remaining_units: 0,
  usage_percentage: 0,
  subscriptions: [],
};

interface AppDataContextValue {
  deliveryAreas: DeliveryArea[];
  setDeliveryAreas: (v: DeliveryArea[]) => void;
  garmentPricing: GarmentType[];
  setGarmentPricing: (v: GarmentType[]) => void;
  laundryServices: LaundryService[];
  setLaundryServices: (v: LaundryService[]) => void;
  notifications: AppNotification[];
  unreadCount: number;
  markNotificationRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  loadNotifications: () => Promise<void>;
  usageData: UsageStats;
  setUsageData: (v: UsageStats) => void;
  loadUsage: () => Promise<void>;
  loadPricing: () => Promise<void>;
  pricingLoaded: boolean;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [garmentPricing, setGarmentPricing] = useState<GarmentType[]>([]);
  const [laundryServices, setLaundryServices] = useState<LaundryService[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [usageData, setUsageData] = useState<UsageStats>(EMPTY_USAGE);
  const [pricingLoaded, setPricingLoaded] = useState(false);

  const loadPricing = useCallback(async () => {
    try {
      const [areas, garments, servicesList] = await Promise.allSettled([
        pricingService.areas(),
        pricingService.garments(),
        pricingService.services(),
      ]);
      if (areas.status === 'fulfilled') setDeliveryAreas(areas.value);
      if (garments.status === 'fulfilled') setGarmentPricing(garments.value);
      if (servicesList.status === 'fulfilled') setLaundryServices(servicesList.value);
    } finally {
      setPricingLoaded(true);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const d = await notificationService.list();
      setNotifications(d.items);
      setUnreadCount(d.items.filter(n => !n.is_read).length);
    } catch { /* ignore — non-critical */ }
  }, []);

  const loadUsage = useCallback(async () => {
    try {
      const d = await usageService.statistics();
      setUsageData(d);
    } catch { /* ignore — non-critical, e.g. staff accounts with no subscriptions */ }
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('access_token')) return;
    loadPricing();
    loadNotifications();
    loadUsage();
  }, [loadPricing, loadNotifications, loadUsage]);

  const markNotificationRead = useCallback(async (id: number) => {
    try { await notificationService.markRead(id); } catch { /* ignore */ }
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(p => Math.max(0, p - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    try { await notificationService.markAllRead(); } catch { /* ignore */ }
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, []);

  return (
    <AppDataContext.Provider value={{
      deliveryAreas, setDeliveryAreas, garmentPricing, setGarmentPricing,
      laundryServices, setLaundryServices, notifications, unreadCount,
      markNotificationRead, markAllRead, loadNotifications,
      usageData, setUsageData, loadUsage, loadPricing, pricingLoaded,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = (): AppDataContextValue => {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
};
