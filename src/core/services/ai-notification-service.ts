/**
 * AI-Enhanced Notification Service
 * Handles intelligent notification processing, prioritization, and grouping
 */

export interface NotificationInput {
  id: string;
  title: string;
  message: string;
  avatar?: string;
  timestamp: Date;
  isRead: boolean;
  type: 'appointment' | 'medical' | 'system' | 'urgent' | 'reminder';
  sender: string;
  metadata?: Record<string, any>;
}

interface NotificationData {
  id: string;
  title: string;
  message: string;
  avatar?: string;
  timestamp: Date;
  isRead: boolean;
  type: 'appointment' | 'medical' | 'system' | 'urgent' | 'reminder';
  sender: string;
  metadata?: Record<string, any>;
}

export interface ProcessedNotification extends NotificationData {
  // AI enhancements
  aiPriority: number; // 1-5 scale (5 being highest)
  aiCategory: 'critical' | 'important' | 'routine' | 'informational';
  category: 'critical' | 'important' | 'routine' | 'informational'; // Alias for aiCategory
  aiSummary?: string; // Shortened version for long notifications
  suggestedActions?: Array<{
    label: string;
    action: string;
    type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }>;
  groupId?: string; // For grouping similar notifications
  groupCount?: number; // How many notifications in this group
  isGrouped?: boolean;
  personalizedTiming?: {
    optimalTime?: Date;
    frequencyScore?: number;
    userEngagement?: number;
  };
  confidence: number; // AI confidence score 0-1
}

export interface AIEnhancedNotification extends ProcessedNotification {}

export interface AISettings {
  maxNotifications: number;
  enableGrouping: boolean;
  enableSmartPrioritization: boolean;
  confidenceThreshold: number;
  autoProcessing: boolean;
  refreshInterval: number;
  enableAnalytics: boolean;
}

interface UserBehaviorData {
  averageResponseTime: { [key: string]: number };
  preferredCategories: string[];
  activeHours: number[];
  clickThroughRates: { [key: string]: number };
  dismissalPatterns: { [key: string]: number };
}

export class AINotificationService {
  private userBehavior: UserBehaviorData;
  private isProcessing: boolean = false;
  private cache: Map<string, AIEnhancedNotification[]> = new Map();
  private settings: AISettings;

  constructor() {
    // Initialize with default user behavior data
    this.userBehavior = this.loadUserBehaviorData();
    this.settings = {
      maxNotifications: 50,
      enableGrouping: true,
      enableSmartPrioritization: true,
      confidenceThreshold: 0.7,
      autoProcessing: true,
      refreshInterval: 30000,
      enableAnalytics: true
    };
  }

  /**
   * Process notifications with AI enhancements
   */
  async processNotifications(
    notifications: NotificationData[]
  ): Promise<AIEnhancedNotification[]> {
    this.isProcessing = true;
    
    try {
      // Apply AI processing to each notification
      const enhanced = await Promise.all(
        notifications.map(notification => this.enhanceNotification(notification))
      );

      // Apply intelligent grouping
      const grouped = this.intelligentGrouping(enhanced);

      // Apply smart prioritization
      const prioritized = this.smartPrioritization(grouped);

      // Cache results for performance
      this.cache.set('processed', prioritized);

      return prioritized;
    } catch (error) {
      console.error('AI processing failed:', error);
      // Fallback to basic processing
      return this.fallbackProcessing(notifications);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Enhance individual notification with AI features
   */
  private async enhanceNotification(
    notification: NotificationData
  ): Promise<AIEnhancedNotification> {
    // Calculate AI priority based on multiple factors
    const aiPriority = this.calculatePriority(notification);
    
    // Determine AI category
    const aiCategory = this.categorizeNotification(notification);
    
    // Generate AI summary for long messages
    const aiSummary = this.generateSummary(notification.message);
    
    // Suggest actions based on notification type and content
    const suggestedActions = this.generateSuggestedActions(notification);
    
    // Calculate personalized timing
    const personalizedTiming = this.calculatePersonalizedTiming(notification);
    
    // Calculate AI confidence
    const confidence = this.calculateConfidence(notification);

    return {
      ...notification,
      aiPriority,
      aiCategory,
      aiSummary,
      suggestedActions,
      personalizedTiming,
      confidence
    };
  }

  /**
   * Calculate notification priority using AI algorithms
   */
  private calculatePriority(notification: NotificationData): number {
    let priority = 3; // Default medium priority

    // Time-based urgency
    const timeSinceCreation = Date.now() - notification.timestamp.getTime();
    const hoursSince = timeSinceCreation / (1000 * 60 * 60);
    
    if (hoursSince < 1) priority += 1; // Recent notifications get higher priority
    if (hoursSince > 24) priority -= 1; // Old notifications get lower priority

    // Content-based priority
    const urgentKeywords = ['urgent', 'emergency', 'critical', 'stat', 'immediate'];
    const messageContent = notification.message.toLowerCase();
    
    if (urgentKeywords.some(keyword => messageContent.includes(keyword))) {
      priority += 2;
    }

    // Type-based priority
    const typePriorities = {
      'urgent': 5,
      'medical': 4,
      'appointment': 3,
      'system': 2,
      'reminder': 1
    };
    
    priority = Math.max(priority, typePriorities[notification.type] || 3);

    // User behavior adjustment
    const userEngagement = this.userBehavior.clickThroughRates[notification.type] || 0.5;
    priority = Math.round(priority * (0.5 + userEngagement));

    // Ensure priority is within bounds
    return Math.max(1, Math.min(5, priority));
  }

  /**
   * Categorize notification using AI
   */
  private categorizeNotification(
    notification: NotificationData
  ): 'critical' | 'important' | 'routine' | 'informational' {
    const message = notification.message.toLowerCase();
    const type = notification.type;

    // Critical indicators
    if (
      type === 'urgent' ||
      message.includes('emergency') ||
      message.includes('critical') ||
      message.includes('stat')
    ) {
      return 'critical';
    }

    // Important indicators
    if (
      type === 'medical' ||
      message.includes('patient') ||
      message.includes('doctor') ||
      message.includes('surgery') ||
      message.includes('appointment')
    ) {
      return 'important';
    }

    // Routine indicators
    if (
      type === 'appointment' ||
      message.includes('scheduled') ||
      message.includes('booked') ||
      message.includes('completed')
    ) {
      return 'routine';
    }

    return 'informational';
  }

  /**
   * Generate AI summary for long notifications
   */
  private generateSummary(message: string): string | undefined {
    if (message.length <= 100) return undefined;

    // Simple AI summary algorithm
    const sentences = message.split('.').filter(s => s.trim().length > 0);
    if (sentences.length <= 1) return undefined;

    // Extract key information
    const keyWords = ['patient', 'doctor', 'appointment', 'surgery', 'emergency', 'completed', 'scheduled'];
    const importantSentences = sentences.filter(sentence =>
      keyWords.some(word => sentence.toLowerCase().includes(word))
    );

    if (importantSentences.length > 0) {
      return importantSentences[0].trim() + '...';
    }

    // Fallback to first sentence
    return sentences[0].trim() + '...';
  }

  /**
   * Generate suggested actions based on notification content
   */
  private generateSuggestedActions(notification: NotificationData) {
    const actions = [];
    const message = notification.message.toLowerCase();
    const type = notification.type;

    // Common actions for all notifications
    actions.push({
      label: 'Mark as Read',
      action: 'mark-read',
      type: 'secondary' as const
    });

    // Type-specific actions
    if (type === 'appointment' || message.includes('appointment')) {
      actions.push({
        label: 'View Details',
        action: 'view-appointment',
        type: 'primary' as const
      });
      
      if (message.includes('booked') || message.includes('scheduled')) {
        actions.push({
          label: 'Confirm',
          action: 'confirm-appointment',
          type: 'success' as const
        });
      }
    }

    if (type === 'medical' || message.includes('patient')) {
      actions.push({
        label: 'View Patient',
        action: 'view-patient',
        type: 'primary' as const
      });
    }

    if (type === 'urgent' || message.includes('emergency')) {
      actions.push({
        label: 'Respond Now',
        action: 'emergency-response',
        type: 'danger' as const
      });
    }

    if (message.includes('completed') || message.includes('report')) {
      actions.push({
        label: 'Review',
        action: 'review-report',
        type: 'primary' as const
      });
    }

    return actions.slice(0, 3); // Limit to 3 actions max
  }

  /**
   * Apply intelligent grouping to similar notifications
   */
  private intelligentGrouping(
    notifications: AIEnhancedNotification[]
  ): AIEnhancedNotification[] {
    const groups = new Map<string, AIEnhancedNotification[]>();
    
    notifications.forEach(notification => {
      const groupKey = this.generateGroupKey(notification);
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      
      groups.get(groupKey)!.push(notification);
    });

    const result: AIEnhancedNotification[] = [];

    groups.forEach((groupNotifications, groupKey) => {
      if (groupNotifications.length > 1 && this.shouldGroup(groupNotifications)) {
        // Create grouped notification
        const representative = groupNotifications[0];
        const grouped: AIEnhancedNotification = {
          ...representative,
          id: `group-${groupKey}`,
          title: this.generateGroupTitle(groupNotifications),
          message: this.generateGroupMessage(groupNotifications),
          isGrouped: true,
          groupId: groupKey,
          groupCount: groupNotifications.length,
          aiPriority: Math.max(...groupNotifications.map(n => n.aiPriority)),
          timestamp: new Date(Math.max(...groupNotifications.map(n => n.timestamp.getTime())))
        };
        
        result.push(grouped);
      } else {
        // Add individual notifications
        result.push(...groupNotifications);
      }
    });

    return result;
  }

  /**
   * Generate group key for similar notifications
   */
  private generateGroupKey(notification: AIEnhancedNotification): string {
    // Group by type and similar content
    const type = notification.type;
    const sender = notification.sender;
    
    // Group appointments from same day
    if (type === 'appointment') {
      const date = notification.timestamp.toDateString();
      return `appointments-${date}`;
    }

    // Group system notifications
    if (type === 'system') {
      return 'system-notifications';
    }

    // Group by sender for reports
    if (notification.message.includes('completed') || notification.message.includes('report')) {
      return `reports-${sender}`;
    }

    return `individual-${notification.id}`;
  }

  /**
   * Determine if notifications should be grouped
   */
  private shouldGroup(notifications: AIEnhancedNotification[]): boolean {
    // Don't group critical notifications
    if (notifications.some(n => n.aiCategory === 'critical')) {
      return false;
    }

    // Group if there are 2 or more similar routine notifications
    return notifications.length >= 2 && 
           notifications.every(n => n.aiCategory === 'routine' || n.aiCategory === 'informational');
  }

  /**
   * Apply smart prioritization considering user behavior
   */
  private smartPrioritization(
    notifications: AIEnhancedNotification[]
  ): AIEnhancedNotification[] {
    return notifications.sort((a, b) => {
      // Primary sort by AI priority
      if (a.aiPriority !== b.aiPriority) {
        return b.aiPriority - a.aiPriority;
      }

      // Secondary sort by user engagement
      const aEngagement = this.userBehavior.clickThroughRates[a.type] || 0;
      const bEngagement = this.userBehavior.clickThroughRates[b.type] || 0;
      
      if (aEngagement !== bEngagement) {
        return bEngagement - aEngagement;
      }

      // Tertiary sort by timestamp
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  /**
   * Calculate personalized timing for notifications
   */
  private calculatePersonalizedTiming(notification: NotificationData) {
    const currentHour = new Date().getHours();
    // const isActiveHour = this.userBehavior.activeHours.includes(currentHour);

    // const avgResponseTime = this.userBehavior.averageResponseTime[notification.type] || 60;
    const userEngagement = this.userBehavior.clickThroughRates[notification.type] || 0.5;

    return {
      optimalTime: this.calculateOptimalTime(notification),
      frequencyScore: this.calculateFrequencyScore(notification),
      userEngagement: userEngagement
    };
  }

  /**
   * Calculate AI confidence score
   */
  private calculateConfidence(notification: NotificationData): number {
    let confidence = 0.8; // Base confidence

    // Increase confidence for well-structured notifications
    if (notification.metadata?.category) confidence += 0.1;
    if (notification.type) confidence += 0.05;
    if (notification.avatar) confidence += 0.05;

    return Math.min(1, confidence);
  }

  /**
   * Fallback processing when AI fails
   */
  private fallbackProcessing(notifications: NotificationData[]): AIEnhancedNotification[] {
    return notifications.map(notification => ({
      ...notification,
      aiPriority: 3,
      aiCategory: 'routine' as const,
      confidence: 0.5,
      suggestedActions: [{
        label: 'Mark as Read',
        action: 'mark-read',
        type: 'secondary' as const
      }]
    }));
  }

  /**
   * Load user behavior data (would normally come from API/localStorage)
   */
  private loadUserBehaviorData(): UserBehaviorData {
    // Mock data - in production this would come from analytics service
    return {
      averageResponseTime: {
        'urgent': 120, // 2 minutes
        'medical': 300, // 5 minutes
        'appointment': 900, // 15 minutes
        'system': 1800, // 30 minutes
        'reminder': 3600 // 1 hour
      },
      preferredCategories: ['medical', 'appointment', 'urgent'],
      activeHours: [8, 9, 10, 11, 14, 15, 16, 17], // 8-11 AM, 2-5 PM
      clickThroughRates: {
        'urgent': 0.9,
        'medical': 0.8,
        'appointment': 0.7,
        'system': 0.3,
        'reminder': 0.5
      },
      dismissalPatterns: {
        'urgent': 0.1,
        'medical': 0.2,
        'appointment': 0.3,
        'system': 0.7,
        'reminder': 0.5
      }
    };
  }

  /**
   * Helper methods for grouping
   */
  private generateGroupTitle(notifications: AIEnhancedNotification[]): string {
    const type = notifications[0].type;
    const count = notifications.length;
    
    switch (type) {
      case 'appointment':
        return `${count} Appointment Updates`;
      case 'system':
        return `${count} System Notifications`;
      case 'medical':
        return `${count} Medical Reports`;
      default:
        return `${count} Notifications`;
    }
  }

  private generateGroupMessage(notifications: AIEnhancedNotification[]): string {
    const senders = [...new Set(notifications.map(n => n.sender))];
    const type = notifications[0].type;
    
    if (senders.length === 1) {
      return `${senders[0]} sent ${notifications.length} ${type} notifications`;
    } else {
      return `${notifications.length} ${type} notifications from ${senders.length} sources`;
    }
  }

  private calculateOptimalTime(notification: NotificationData): Date {
    // Simple algorithm - optimal time is during user's active hours
    const now = new Date();
    const currentHour = now.getHours();
    
    if (this.userBehavior.activeHours.includes(currentHour)) {
      return now;
    }
    
    // Find next active hour
    const nextActiveHour = this.userBehavior.activeHours.find(hour => hour > currentHour) ||
                          this.userBehavior.activeHours[0] + 24;
    
    const optimalTime = new Date(now);
    optimalTime.setHours(nextActiveHour % 24, 0, 0, 0);
    
    return optimalTime;
  }

  private calculateFrequencyScore(notification: NotificationData): number {
    // Calculate how frequently this type of notification should be shown
    const dismissalRate = this.userBehavior.dismissalPatterns[notification.type] || 0.5;
    return 1 - dismissalRate; // Higher score means show more frequently
  }

  /**
   * Process single notification
   */
  processNotification(notification: NotificationInput): ProcessedNotification {
    const enhanced = this.enhanceNotificationSync(notification);
    return enhanced;
  }

  /**
   * Process multiple notifications synchronously
   */
  processMultipleNotifications(notifications: NotificationInput[]): ProcessedNotification[] {
    return notifications.map(notification => this.processNotification(notification));
  }

  /**
   * Update AI settings
   */
  updateSettings(newSettings: Partial<AISettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  /**
   * Get current settings
   */
  getSettings(): AISettings {
    return { ...this.settings };
  }

  /**
   * Synchronous version of enhance notification for immediate processing
   */
  private enhanceNotificationSync(notification: NotificationInput): ProcessedNotification {
    const aiPriority = this.calculatePriority(notification);
    const aiCategory = this.categorizeNotification(notification);
    const aiSummary = this.generateSummary(notification.message);
    const suggestedActions = this.generateSuggestedActions(notification);
    const personalizedTiming = this.calculatePersonalizedTiming(notification);
    const confidence = this.calculateConfidence(notification);

    return {
      ...notification,
      aiPriority,
      aiCategory,
      category: aiCategory,
      aiSummary,
      suggestedActions,
      personalizedTiming,
      confidence
    };
  }

  /**
   * Public methods for analytics and user feedback
   */
  recordUserAction(notificationId: string, action: string, timestamp: Date = new Date()) {
    // Record user action for learning
    console.log(`User action recorded: ${action} on ${notificationId} at ${timestamp}`);

    // In production, this would update the ML model
    this.updateUserBehavior(notificationId, action, timestamp);
  }

  private updateUserBehavior(_notificationId: string, _action: string, _timestamp: Date) {
    // Update user behavior patterns based on actions
    // This would normally integrate with an ML service
  }

  getProcessingStatus(): boolean {
    return this.isProcessing;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const aiNotificationService = new AINotificationService();
