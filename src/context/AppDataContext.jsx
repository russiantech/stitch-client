import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { pricingService, notificationService, usageService } from '../services/api.js';
import {
  MOCK_DELIVERY_AREAS, MOCK_GARMENT_PRICING, MOCK_LAUNDRY_SERVICES,
  MOCK_NOTIFICATIONS, MOCK_USAGE,
} from '../services/mockData.js';

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const [deliveryAreas, setDeliveryAreas] = useState(MOCK_DELIVERY_AREAS);
  const [garmentPricing, setGarmentPricing] = useState(MOCK_GARMENT_PRICING);
  const [laundryServices, setLaundryServices] = useState(MOCK_LAUNDRY_SERVICES);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(MOCK_NOTIFICATIONS.filter(n => !n.read).length);
  const [usageData, setUsageData] = useState(MOCK_USAGE);

  // Load pricing from backend; fallback to mock
  const loadPricing = useCallback(async () => {
    try {
      const [areasData, garmentsData, servicesData] = await Promise.allSettled([
        pricingService.areas(),
        pricingService.garments(),
        pricingService.services(),
      ]);
      if (areasData.status === 'fulfilled' && areasData.value?.areas) setDeliveryAreas(areasData.value.areas);
      if (garmentsData.status === 'fulfilled' && garmentsData.value?.garments) setGarmentPricing(garmentsData.value.garments);
      if (servicesData.status === 'fulfilled' && servicesData.value?.services) setLaundryServices(servicesData.value.services);
    } catch {}
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.list();
      if (data?.notifications) {
        setNotifications(data.notifications);
        setUnreadCount(data.notifications.filter(n => !n.read).length);
      }
    } catch {}
  }, []);

  // Load usage stats
  const loadUsage = useCallback(async () => {
    try {
      const data = await usageService.statistics();
      if (data) setUsageData(data);
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    loadPricing();
    loadNotifications();
    loadUsage();
  }, [loadPricing, loadNotifications, loadUsage]);

  const markNotificationRead = useCallback(async (id) => {
    try { await notificationService.markRead(id); } catch {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    try { await notificationService.markAllRead(); } catch {}
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  return (
    <AppDataContext.Provider value={{
      deliveryAreas, setDeliveryAreas, loadPricing,
      garmentPricing, setGarmentPricing,
      laundryServices, setLaundryServices,
      notifications, unreadCount,
      markNotificationRead, markAllRead,
      loadNotifications,
      usageData, setUsageData, loadUsage,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => useContext(AppDataContext);
