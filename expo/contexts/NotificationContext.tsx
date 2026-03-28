import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import { Notification } from '@/types/notification';

const NOTIFICATIONS_KEY = '@notifications';

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  useEffect(() => {
    if (notificationsQuery.data) {
      setNotifications(notificationsQuery.data);
    }
  }, [notificationsQuery.data]);

  const saveNotificationsMutation = useMutation({
    mutationFn: async (newNotifications: Notification[]) => {
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(newNotifications));
      return newNotifications;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const { mutate: saveNotifications } = saveNotificationsMutation;

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
      const newNotification: Notification = {
        ...notification,
        id: `notification_${Date.now()}`,
        timestamp: new Date().toISOString(),
        read: false,
      };
      const newNotifications = [newNotification, ...notifications];
      setNotifications(newNotifications);
      saveNotifications(newNotifications);
      return newNotification;
    },
    [notifications, saveNotifications]
  );

  const markAsRead = useCallback(
    (id: string) => {
      const newNotifications = notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      setNotifications(newNotifications);
      saveNotifications(newNotifications);
    },
    [notifications, saveNotifications]
  );

  const markAllAsRead = useCallback(() => {
    const newNotifications = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(newNotifications);
    saveNotifications(newNotifications);
  }, [notifications, saveNotifications]);

  const deleteNotification = useCallback(
    (id: string) => {
      const newNotifications = notifications.filter((n) => n.id !== id);
      setNotifications(newNotifications);
      saveNotifications(newNotifications);
    },
    [notifications, saveNotifications]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
    saveNotifications([]);
  }, [saveNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    isLoading: notificationsQuery.isLoading,
  };
});
