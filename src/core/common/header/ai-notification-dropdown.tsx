import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from "react-router-dom";
import ImageWithBasePath from "../../imageWithBasePath";
import { all_routes } from "../../../feature-module/routes/all_routes";
import { aiNotificationService, type AIEnhancedNotification } from "../../services/ai-notification-service";

// Analytics tracking utility
const trackEvent = (eventName: string, properties: Record<string, any>) => {
  // Integration with analytics service (e.g., Google Analytics, Mixpanel)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, {
      custom_parameter_1: properties.notificationId,
      custom_parameter_2: properties.action,
      custom_parameter_3: properties.aiPriority,
      ...properties
    });
  }
  
  console.log('AI Notification Event:', eventName, properties);
};

interface AINotificationDropdownProps {
  className?: string;
  isLoading?: boolean;
  onError?: (error: Error) => void;
}

const AINotificationDropdown: React.FC<AINotificationDropdownProps> = ({
  className = "",
  isLoading: externalLoading = false,
  onError
}) => {
  // State management
  const [notifications, setNotifications] = useState<AIEnhancedNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock data for demonstration - in production this would come from an API
  const mockNotifications = useMemo(() => [
    {
      id: "1",
      title: "Dr. Smith",
      message: "updated the surgery schedule for tomorrow morning. Three operations have been rescheduled due to equipment maintenance. Please check the new schedule and confirm your availability.",
      avatar: "assets/img/doctors/doctor-01.jpg",
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      isRead: false,
      type: "medical" as const,
      sender: "Dr. Smith"
    },
    {
      id: "2",
      title: "Dr. Patel",
      message: "completed a follow-up report for patient Emily Johnson. Lab results show improvement in blood pressure. Recommend continuing current medication.",
      avatar: "assets/img/doctors/doctor-06.jpg",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      isRead: false,
      type: "medical" as const,
      sender: "Dr. Patel"
    },
    {
      id: "3",
      title: "Emily",
      message: "booked an appointment with Dr. Patel for April 15",
      avatar: "assets/img/doctors/doctor-02.jpg",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      type: "appointment" as const,
      sender: "Emily"
    },
    {
      id: "4",
      title: "Amelia",
      message: "completed the pre-visit health questionnaire for upcoming appointment",
      avatar: "assets/img/doctors/doctor-07.jpg",
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      isRead: false,
      type: "appointment" as const,
      sender: "Amelia"
    },
    {
      id: "5",
      title: "System Alert",
      message: "Emergency protocol activated in ICU Room 302. Immediate response required.",
      avatar: "assets/img/icons/alert-icon.svg",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      isRead: false,
      type: "urgent" as const,
      sender: "Emergency System"
    }
  ], []);

  // Load and process notifications
  const loadNotifications = useCallback(async () => {
    if (externalLoading) return;
    
    setIsLoading(true);
    setError(null);

    try {
      let processedNotifications;
      
      if (isAIEnabled) {
        // Process with AI enhancements
        processedNotifications = await aiNotificationService.processNotifications(mockNotifications);
        
        // Track AI processing
        trackEvent('ai_processing_completed', {
          notificationCount: mockNotifications.length,
          processingTime: Date.now() // In production, calculate actual processing time
        });
      } else {
        // Use basic processing
        processedNotifications = mockNotifications.map(notification => ({
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

      setNotifications(processedNotifications);
      setUnreadCount(processedNotifications.filter(n => !n.isRead).length);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load notifications');
      setError(error.message);
      onError?.(error);
      
      // Fallback to basic notifications
      setNotifications(mockNotifications.map(n => ({
        ...n,
        aiPriority: 3,
        aiCategory: 'routine' as const,
        confidence: 0.5,
        suggestedActions: []
      })));
    } finally {
      setIsLoading(false);
    }
  }, [mockNotifications, isAIEnabled, externalLoading, onError]);

  // Load notifications on component mount and when AI is toggled
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Format timestamp for display
  const formatTimeAgo = useCallback((timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  }, []);

  // Handle notification actions
  const handleNotificationAction = useCallback((
    notification: AIEnhancedNotification,
    action: string
  ) => {
    trackEvent('notification_action', {
      notificationId: notification.id,
      action,
      aiPriority: notification.aiPriority,
      aiCategory: notification.aiCategory,
      isAIEnabled
    });

    aiNotificationService.recordUserAction(notification.id, action);

    switch (action) {
      case 'mark-read':
        setNotifications(prev => prev.map(n => 
          n.id === notification.id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
        break;
      
      case 'dismiss':
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
        if (!notification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        break;
        
      default:
        console.log(`Action "${action}" performed on notification ${notification.id}`);
    }
  }, [isAIEnabled]);

  // Toggle group expansion
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  // Get priority class for styling
  const getPriorityClass = useCallback((notification: AIEnhancedNotification) => {
    if (!isAIEnabled) return '';
    
    switch (notification.aiCategory) {
      case 'critical':
        return 'notification-critical';
      case 'important':
        return 'notification-important';
      case 'routine':
        return 'notification-routine';
      default:
        return '';
    }
  }, [isAIEnabled]);

  // Get priority icon
  const getPriorityIcon = useCallback((notification: AIEnhancedNotification) => {
    if (!isAIEnabled) return null;
    
    switch (notification.aiCategory) {
      case 'critical':
        return <i className="ti ti-alert-triangle text-danger fs-12" title="Critical Priority" />;
      case 'important':
        return <i className="ti ti-exclamation-circle text-warning fs-12" title="Important" />;
      case 'routine':
        return <i className="ti ti-info-circle text-info fs-12" title="Routine" />;
      default:
        return null;
    }
  }, [isAIEnabled]);

  // Render individual notification
  const renderNotification = useCallback((notification: AIEnhancedNotification, index: number) => {
    const isExpanded = expandedGroups.has(notification.groupId || '');
    
    return (
      <div
        key={notification.id}
        className={`dropdown-item notification-item py-3 text-wrap ${
          index < notifications.length - 1 ? 'border-bottom' : ''
        } ${getPriorityClass(notification)} ${notification.isRead ? 'read' : 'unread'}`}
        id={`notification-${notification.id}`}
        role="listitem"
        aria-label={`Notification from ${notification.sender}: ${notification.message}`}
      >
        <div className="d-flex">
          {/* Avatar with AI priority indicator */}
          <div className="me-2 position-relative flex-shrink-0">
            <ImageWithBasePath
              src={notification.avatar || "assets/img/users/default-avatar.jpg"}
              className="avatar-md rounded-circle"
              alt={`Avatar of ${notification.sender}`}
            />
            {isAIEnabled && notification.aiPriority && (
              <span 
                className={`position-absolute top-0 start-100 translate-middle badge rounded-pill priority-badge priority-${notification.aiPriority}`}
                title={`AI Priority: ${notification.aiPriority}/5`}
                aria-label={`Priority level ${notification.aiPriority} out of 5`}
              >
                {notification.aiPriority}
              </span>
            )}
          </div>

          <div className="flex-grow-1">
            {/* Header with sender and AI indicators */}
            <div className="d-flex justify-content-between align-items-start mb-1">
              <div className="d-flex align-items-center gap-1">
                <p className="mb-0 fw-medium text-dark">{notification.sender}</p>
                {getPriorityIcon(notification)}
                {isAIEnabled && notification.confidence && (
                  <span 
                    className="badge bg-light text-muted fs-10"
                    title={`AI Confidence: ${Math.round(notification.confidence * 100)}%`}
                  >
                    AI
                  </span>
                )}
              </div>
              
              {/* Group indicator */}
              {notification.isGrouped && (
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => toggleGroup(notification.groupId!)}
                  aria-expanded={isExpanded}
                  aria-controls={`group-${notification.groupId}`}
                >
                  <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'} fs-12`} />
                  <span className="ms-1">{notification.groupCount}</span>
                </button>
              )}
            </div>

            {/* Message content */}
            <div className="notification-content">
              <p className="mb-1 text-wrap">
                {isAIEnabled && notification.aiSummary ? notification.aiSummary : notification.message}
              </p>
              
              {/* Show full message on hover/expand */}
              {isAIEnabled && notification.aiSummary && (
                <div className="full-message d-none">
                  {notification.message}
                </div>
              )}
            </div>

            {/* AI suggested actions */}
            {isAIEnabled && notification.suggestedActions && notification.suggestedActions.length > 0 && (
              <div className="ai-actions mb-2">
                <div className="d-flex gap-1 flex-wrap">
                  {notification.suggestedActions.slice(0, 2).map((action: any, actionIndex: number) => (
                    <button
                      key={actionIndex}
                      className={`btn btn-sm btn-${action.type} ai-suggested-action`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNotificationAction(notification, action.action);
                      }}
                      title={`AI Suggested: ${action.label}`}
                      aria-label={`AI suggested action: ${action.label}`}
                    >
                      <i className="ti ti-robot fs-10 me-1" />
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Footer with timestamp and actions */}
            <div className="d-flex justify-content-between align-items-center">
              <span className="fs-12 text-muted">
                <i className="ti ti-clock me-1" />
                {formatTimeAgo(notification.timestamp)}
                {isAIEnabled && notification.personalizedTiming?.optimalTime && (
                  <span 
                    className="ms-2 badge bg-info-transparent text-info fs-10"
                    title={`Optimal time: ${notification.personalizedTiming.optimalTime.toLocaleTimeString()}`}
                  >
                    ⏰ Optimal
                  </span>
                )}
              </span>

              <div className="notification-action d-flex align-items-center gap-2">
                {!notification.isRead && (
                  <button
                    className="btn btn-sm p-1 notification-read rounded-circle bg-primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotificationAction(notification, 'mark-read');
                    }}
                    title="Mark as Read"
                    aria-label="Mark notification as read"
                  >
                    <i className="ti ti-check fs-10 text-white" />
                  </button>
                )}
                
                <button
                  className="btn btn-sm p-1 rounded-circle bg-danger"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNotificationAction(notification, 'dismiss');
                  }}
                  title="Dismiss Notification"
                  aria-label="Dismiss notification"
                >
                  <i className="ti ti-x fs-10 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }, [notifications.length, expandedGroups, getPriorityClass, getPriorityIcon, isAIEnabled, formatTimeAgo, handleNotificationAction, toggleGroup]);

  return (
    <div className={`header-item ${className}`}>
      <div className="dropdown me-3">
        <button
          className="topbar-link btn btn-icon topbar-link dropdown-toggle drop-arrow-none position-relative"
          data-bs-toggle="dropdown"
          data-bs-offset="0,24"
          type="button"
          aria-haspopup="true"
          aria-expanded="false"
          aria-label={`Notifications. ${unreadCount} unread.`}
        >
          <i className={`ti ti-bell-check fs-16 ${unreadCount > 0 ? 'animate-ring' : ''}`} />
          {unreadCount > 0 && (
            <span 
              className="notification-badge position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div
          className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg ai-notification-dropdown"
          style={{ minHeight: 300, maxHeight: 600 }}
          role="listbox"
          aria-label="Notifications menu"
        >
          {/* Header with AI toggle */}
          <div className="p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center gap-2">
                <h6 className="m-0 fs-16 fw-semibold">Notifications</h6>
                {isAIEnabled && (
                  <span className="badge bg-primary-transparent text-primary fs-10">
                    <i className="ti ti-robot me-1" />
                    AI Enhanced
                  </span>
                )}
              </div>
              
              <div className="d-flex align-items-center gap-2">
                {/* AI Toggle */}
                <div className="form-check form-switch form-check-sm">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="aiToggle"
                    checked={isAIEnabled}
                    onChange={(e) => {
                      setIsAIEnabled(e.target.checked);
                      trackEvent('ai_toggle', { enabled: e.target.checked });
                    }}
                    aria-label="Toggle AI enhancements"
                  />
                  <label className="form-check-label fs-12 text-muted" htmlFor="aiToggle">
                    AI
                  </label>
                </div>
                
                {/* Refresh button */}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={loadNotifications}
                  disabled={isLoading}
                  title="Refresh notifications"
                  aria-label="Refresh notifications"
                >
                  <i className={`ti ti-refresh fs-12 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            {/* AI insights summary */}
            {isAIEnabled && notifications.length > 0 && (
              <div className="mt-2">
                <small className="text-muted">
                  {notifications.filter(n => n.aiCategory === 'critical').length > 0 && (
                    <span className="me-2">
                      <i className="ti ti-alert-triangle text-danger fs-10 me-1" />
                      {notifications.filter(n => n.aiCategory === 'critical').length} Critical
                    </span>
                  )}
                  {notifications.filter(n => n.aiCategory === 'important').length > 0 && (
                    <span className="me-2">
                      <i className="ti ti-exclamation-circle text-warning fs-10 me-1" />
                      {notifications.filter(n => n.aiCategory === 'important').length} Important
                    </span>
                  )}
                  <span>
                    <i className="ti ti-check-circle text-success fs-10 me-1" />
                    AI Processed
                  </span>
                </small>
              </div>
            )}
          </div>

          {/* Notification Body */}
          <div
            className="notification-body position-relative"
            data-simplebar=""
            style={{ maxHeight: '400px' }}
            role="list"
            aria-label="Notification list"
          >
            {/* Loading state */}
            {(isLoading || externalLoading) && (
              <div className="d-flex justify-content-center align-items-center p-4">
                <div className="spinner-border spinner-border-sm text-primary me-2" role="status" aria-hidden="true"></div>
                <span className="text-muted">{isAIEnabled ? 'AI processing...' : 'Loading...'}</span>
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="p-3 text-center">
                <div className="text-danger mb-2">
                  <i className="ti ti-exclamation-triangle fs-24" />
                </div>
                <p className="text-muted mb-2">{error}</p>
                <button 
                  className="btn btn-sm btn-outline-primary"
                  onClick={loadNotifications}
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !externalLoading && !error && notifications.length === 0 && (
              <div className="p-4 text-center">
                <div className="text-muted mb-2">
                  <i className="ti ti-bell-off fs-24" />
                </div>
                <p className="text-muted">No notifications</p>
              </div>
            )}

            {/* Notifications list */}
            {!isLoading && !externalLoading && !error && notifications.length > 0 && (
              <>
                {notifications.map((notification, index) => renderNotification(notification, index))}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 rounded-bottom border-top text-center">
            <Link
              to={all_routes.notifications}
              className="text-center text-decoration-underline fs-14 mb-0"
              onClick={() => trackEvent('view_all_notifications', { source: 'dropdown' })}
            >
              View All Notifications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AINotificationDropdown;
