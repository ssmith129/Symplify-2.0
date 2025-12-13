import { useState, useEffect, useCallback, useRef } from 'react';
import { AINotificationService } from '../services/ai-notification-service';
import type { NotificationInput, ProcessedNotification, AISettings } from '../services/ai-notification-service';

interface UseAINotificationsOptions {
  settings?: Partial<AISettings>;
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableRealtime?: boolean;
}

interface UseAINotificationsReturn {
  notifications: ProcessedNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  settings: AISettings;

  // Actions
  processNotification: (notification: NotificationInput) => ProcessedNotification;
  processMultipleNotifications: (notifications: NotificationInput[]) => ProcessedNotification[];
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  updateSettings: (newSettings: Partial<AISettings>) => void;
  recordUserAction: (notificationId: string, action: string) => void;
  refreshNotifications: () => Promise<void>;

  // Filtering and sorting
  getNotificationsByType: (type: ProcessedNotification['type']) => ProcessedNotification[];
  getNotificationsByCategory: (category: ProcessedNotification['category']) => ProcessedNotification[];
}

const defaultSettings: AISettings = {
  maxNotifications: 50,
  enableGrouping: true,
  enableSmartPrioritization: true,
  confidenceThreshold: 0.7,
  autoProcessing: true,
  refreshInterval: 30000,
  enableAnalytics: true
};

export const useAINotifications = (options: UseAINotificationsOptions = {}): UseAINotificationsReturn => {
  const {
    settings: initialSettings = {},
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableRealtime = true
  } = options;

  const [notifications, setNotifications] = useState<ProcessedNotification[]>([]);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<AISettings>({ ...defaultSettings, ...initialSettings });

  const aiService = useRef<AINotificationService>();
  const refreshTimer = useRef<ReturnType<typeof setInterval>>();
  const actionStartTimes = useRef<Map<string, number>>(new Map());

  // Initialize AI service
  useEffect(() => {
    aiService.current = new AINotificationService();
    aiService.current.updateSettings(settings);
  }, []);

  // Update AI service when settings change
  useEffect(() => {
    if (aiService.current) {
      aiService.current.updateSettings(settings);
    }
  }, [settings]);

  // Mock data fetcher - in a real app, this would fetch from an API
  const fetchNotifications = useCallback(async (): Promise<NotificationInput[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock notification data - generate with current timestamp to simulate real data
    const baseTime = Date.now();
    const mockNotifications: NotificationInput[] = [
      {
        id: "1",
        title: "Emergency Patient Alert",
        message: "Patient John Doe shows critical vitals - immediate attention required",
        sender: "Emergency System",
        timestamp: new Date(baseTime - 5 * 60 * 1000),
        isRead: false,
        type: "urgent",
        metadata: {
          patientId: "P-001"
        }
      },
      {
        id: "2",
        title: "Surgery Schedule Updated",
        message: "Dr. Smith updated tomorrow's surgery schedule - 3 operations rescheduled",
        sender: "Dr. Smith",
        timestamp: new Date(baseTime - 15 * 60 * 1000),
        isRead: false,
        type: "medical",
        metadata: {
          doctorId: "D-001"
        }
      },
      {
        id: "3",
        title: "Lab Results Available",
        message: "Patient Emily's blood work shows abnormal results requiring follow-up",
        sender: "Lab Department",
        timestamp: new Date(baseTime - 45 * 60 * 1000),
        isRead: false,
        type: "medical",
        metadata: {
          patientId: "P-002"
        }
      },
      {
        id: "4",
        title: "Appointment Booking",
        message: "5 new appointments booked for this week",
        sender: "Booking System",
        timestamp: new Date(baseTime - 30 * 60 * 1000),
        isRead: false,
        type: "appointment",
        metadata: {}
      },
      {
        id: "5",
        title: "Medication Reminder",
        message: "Patient reminder: Take morning medication",
        sender: "Reminder System",
        timestamp: new Date(baseTime - 2 * 60 * 60 * 1000),
        isRead: false,
        type: "reminder"
      }
    ];

    return mockNotifications;
  }, []); // Empty dependencies since this is mock data

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    if (!aiService.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const rawNotifications = await fetchNotifications();
      const processedNotifications = aiService.current.processMultipleNotifications(rawNotifications);
      setNotifications(processedNotifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, [fetchNotifications]); // fetchNotifications is stable so this is safe

  // Auto-refresh setup
  useEffect(() => {
    if (autoRefresh) {
      refreshNotifications();

      refreshTimer.current = setInterval(() => {
        refreshNotifications();
      }, refreshInterval);

      return () => {
        if (refreshTimer.current) {
          clearInterval(refreshTimer.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval]); // Removed refreshNotifications to prevent infinite loop

  // Realtime updates simulation
  useEffect(() => {
    if (!enableRealtime) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enableRealtime]); // Removed refreshNotifications to prevent infinite loop

  // Process single notification
  const processNotification = useCallback((notification: NotificationInput): ProcessedNotification => {
    if (!aiService.current) {
      throw new Error('AI service not initialized');
    }
    return aiService.current.processNotification(notification);
  }, []);

  // Process multiple notifications
  const processMultipleNotifications = useCallback((notifications: NotificationInput[]): ProcessedNotification[] => {
    if (!aiService.current) {
      throw new Error('AI service not initialized');
    }
    return aiService.current.processMultipleNotifications(notifications);
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setReadNotifications(prev => new Set([...prev, notificationId]));
    
    // Record user action timing
    const startTime = actionStartTimes.current.get(notificationId);
    if (startTime && aiService.current) {
      const responseTime = Date.now() - startTime;
      aiService.current.recordUserAction(notificationId, 'mark_read', responseTime);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map(n => n.id);
    setReadNotifications(new Set(allIds));
  }, [notifications]);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });

    // Record user action
    const startTime = actionStartTimes.current.get(notificationId);
    if (startTime && aiService.current) {
      const responseTime = Date.now() - startTime;
      aiService.current.recordUserAction(notificationId, 'dismiss', responseTime);
    }
    actionStartTimes.current.delete(notificationId);
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<AISettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  // Record user action
  const recordUserAction = useCallback((notificationId: string, action: string) => {
    if (!actionStartTimes.current.has(notificationId)) {
      actionStartTimes.current.set(notificationId, Date.now());
    }

    if (aiService.current) {
      aiService.current.recordUserAction(notificationId, action);
    }
  }, []);

  // Filter by type
  const getNotificationsByType = useCallback((type: ProcessedNotification['type']) => {
    return notifications.filter(n => n.type === type);
  }, [notifications]);

  // Filter by category
  const getNotificationsByCategory = useCallback((category: ProcessedNotification['category']) => {
    return notifications.filter(n => n.category === category);
  }, [notifications]);

  // Calculate unread count
  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    settings,

    // Actions
    processNotification,
    processMultipleNotifications,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    updateSettings,
    recordUserAction,
    refreshNotifications,

    // Filtering and sorting
    getNotificationsByType,
    getNotificationsByCategory
  };
};

export default useAINotifications;
