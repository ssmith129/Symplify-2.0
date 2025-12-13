import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Switch, Button, Skeleton } from 'antd';
import ImageWithBasePath from '../../imageWithBasePath';
import useAINotifications from '../../hooks/useAINotifications';
import { all_routes } from '../../../feature-module/routes/all_routes';

interface NotificationItemProps {
  notification: any;
  isAIEnabled: boolean;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onActionClick: (id: string, action: string) => void;
}

const EnhancedNotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  isAIEnabled,
  onMarkRead,
  onDismiss,
  onActionClick
}) => {
  const getPriorityClass = (priority: number, type: string) => {
    if (!isAIEnabled) return '';
    
    switch (type) {
      case 'critical':
        return 'notification-critical';
      case 'urgent':
        return 'notification-urgent';
      case 'routine':
        return '';
      default:
        return '';
    }
  };

  const getPriorityIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return 'ti ti-alert-triangle text-danger';
      case 'urgent':
        return 'ti ti-bell-ringing text-warning';
      case 'routine':
        return 'ti ti-bell text-info';
      default:
        return 'ti ti-bell text-muted';
    }
  };

  const formatTimeAgo = (timestamp: Date | string) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div 
      className={`dropdown-item notification-item py-3 text-wrap border-bottom ${getPriorityClass(notification.aiPriority, notification.type)}`}
      id={`notification-${notification.id}`}
    >
      <div className="d-flex">
        {/* Avatar with priority indicator */}
        <div className="me-2 position-relative flex-shrink-0">
          <ImageWithBasePath
            src={notification.avatar || "assets/img/doctors/doctor-01.jpg"}
            className="avatar-md rounded-circle"
            alt=""
          />
          {isAIEnabled && notification.type && (
            <div className="priority-indicator position-absolute" style={{ top: '-2px', right: '-2px' }}>
              <span className={`badge badge-sm bg-transparent p-0`}>
                <i className={`${getPriorityIcon(notification.type)} fs-10`}></i>
              </span>
            </div>
          )}
        </div>

        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start mb-1">
            <p className="mb-0 fw-medium text-dark">{notification.sender || notification.title}</p>
            {isAIEnabled && notification.aiPriority && (
              <Badge 
                count={notification.aiPriority} 
                size="small"
                style={{ 
                  backgroundColor: notification.type === 'critical' ? '#ef4444' : 
                                 notification.type === 'urgent' ? '#f59e0b' : '#3b82f6'
                }}
              />
            )}
          </div>

          <p className="mb-1 text-wrap">
            {notification.description}
            {notification.metadata?.patientName && (
              <span className="fw-medium text-dark ms-1">
                {notification.metadata.patientName}
              </span>
            )}
          </p>

          {/* AI Insight - only show in dropdown preview for critical items */}
          {isAIEnabled && notification.aiInsight && notification.type === 'critical' && (
            <div className="ai-insight-preview mb-2 p-2 bg-primary-transparent rounded-2">
              <small className="text-primary">
                <i className="ti ti-robot me-1 fs-10"></i>
                {notification.aiInsight.substring(0, 60)}...
              </small>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center">
            <span className="fs-12">
              <i className="ti ti-clock me-1" />
              {formatTimeAgo(notification.timestamp)}
            </span>

            <div className="notification-action d-flex align-items-center gap-2">
              {/* AI Quick Actions */}
              {isAIEnabled && notification.actionSuggested && notification.type === 'critical' && (
                <button
                  className="btn btn-xs btn-outline-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onActionClick(notification.id, notification.actionType || 'respond');
                  }}
                  title={`AI Suggested: ${notification.actionType}`}
                >
                  <i className="ti ti-robot fs-10"></i>
                </button>
              )}
              
              {/* Traditional actions */}
              <button
                className="btn btn-xs btn-outline-secondary rounded-circle"
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkRead(notification.id);
                }}
                title="Mark as Read"
              >
                <i className="ti ti-check fs-10" />
              </button>
              
              <button
                className="btn btn-xs btn-outline-danger rounded-circle"
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss(notification.id);
                }}
                title="Dismiss"
              >
                <i className="ti ti-x fs-10" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EnhancedNotificationDropdownProps {
  userRole?: string;
  department?: string;
}

const EnhancedNotificationDropdown: React.FC<EnhancedNotificationDropdownProps> = ({
  userRole = 'doctor',
  department = 'general'
}) => {
  const [isAIEnabled, setIsAIEnabled] = useState(() => {
    const saved = localStorage.getItem('header-notifications-ai-enabled');
    return saved ? JSON.parse(saved) : true;
  });

  const [showAIControls, setShowAIControls] = useState(false);

  // Initialize AI notifications hook
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    dismissNotification,
    recordUserAction,
    refreshNotifications,
    getNotificationsByType
  } = useAINotifications({
    settings: {
      maxNotifications: 50,
      enableGrouping: true,
      enableSmartPrioritization: true,
      confidenceThreshold: 0.7,
      autoProcessing: true,
      refreshInterval: 30000,
      enableAnalytics: true
    },
    autoRefresh: true,
    refreshInterval: 30000
  });

  // Fallback traditional notifications (for when AI is disabled)
  const traditionalNotifications = useMemo(() => [
    {
      id: "trad-1",
      sender: "Dr. Smith",
      description: "updated the surgery schedule.",
      timestamp: new Date(Date.now() - 4 * 60 * 1000),
      avatar: "assets/img/doctors/doctor-01.jpg"
    },
    {
      id: "trad-2", 
      sender: "Dr. Patel",
      description: "completed a follow-up report for patient Emily.",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      avatar: "assets/img/doctors/doctor-06.jpg"
    },
    {
      id: "trad-3",
      sender: "Emily",
      description: "booked an appointment with Dr. Patel for April 15",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      avatar: "assets/img/doctors/doctor-02.jpg"
    },
    {
      id: "trad-4",
      sender: "Amelia", 
      description: "completed the pre-visit health questionnaire.",
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      avatar: "assets/img/doctors/doctor-07.jpg"
    }
  ], []);

  const displayNotifications = isAIEnabled ? notifications : traditionalNotifications;
  const displayUnreadCount = isAIEnabled ? unreadCount : traditionalNotifications.length;

  // Critical notifications for badge styling
  const criticalNotifications = isAIEnabled ? getNotificationsByType('critical') : [];
  const urgentNotifications = isAIEnabled ? getNotificationsByType('urgent') : [];

  const handleToggleAI = useCallback((enabled: boolean) => {
    setIsAIEnabled(enabled);
    localStorage.setItem('header-notifications-ai-enabled', JSON.stringify(enabled));
    
    // Record analytics
    if (enabled) {
      console.log('AI notifications enabled in header');
    } else {
      console.log('AI notifications disabled in header');
    }
  }, []);

  const handleMarkRead = useCallback((id: string) => {
    if (isAIEnabled) {
      markAsRead(id);
      recordUserAction(id, 'mark_read_header');
    } else {
      // Handle traditional notification read
      console.log(`Traditional notification ${id} marked as read`);
    }
  }, [isAIEnabled, markAsRead, recordUserAction]);

  const handleDismiss = useCallback((id: string) => {
    if (isAIEnabled) {
      dismissNotification(id);
      recordUserAction(id, 'dismiss_header');
    } else {
      // Handle traditional notification dismiss
      console.log(`Traditional notification ${id} dismissed`);
    }
  }, [isAIEnabled, dismissNotification, recordUserAction]);

  const handleActionClick = useCallback((id: string, action: string) => {
    if (isAIEnabled) {
      recordUserAction(id, `ai_action_${action}_header`);
      // Handle AI-suggested actions
      switch (action) {
        case 'respond':
          console.log(`Emergency response triggered for ${id}`);
          break;
        case 'accept':
          console.log(`Accepting action for ${id}`);
          break;
        case 'review':
          console.log(`Review action for ${id}`);
          break;
        default:
          console.log(`Action ${action} for ${id}`);
      }
    }
  }, [isAIEnabled, recordUserAction]);

  // Badge configuration based on notification priorities
  const badgeProps = useMemo(() => {
    if (!isAIEnabled || displayUnreadCount === 0) {
      return { count: displayUnreadCount };
    }

    if (criticalNotifications.length > 0) {
      return {
        count: criticalNotifications.length,
        style: { backgroundColor: '#ef4444' }
      };
    }

    if (urgentNotifications.length > 0) {
      return {
        count: urgentNotifications.length,
        style: { backgroundColor: '#f59e0b' }
      };
    }

    return { count: displayUnreadCount };
  }, [isAIEnabled, displayUnreadCount, criticalNotifications.length, urgentNotifications.length]);

  return (
    <div className="header-item">
      <div className="dropdown me-3">
        <button
          className="topbar-link btn btn-icon topbar-link dropdown-toggle drop-arrow-none position-relative"
          data-bs-toggle="dropdown"
          data-bs-offset="0,24"
          type="button"
          aria-haspopup="false"
          aria-expanded="false"
        >
          <Badge {...badgeProps} size="small">
            <i className={`ti ti-bell-check fs-16 ${criticalNotifications.length > 0 ? 'animate-ring text-danger' : 'animate-ring'}`} />
          </Badge>
        </button>

        <div
          className="dropdown-menu p-0 dropdown-menu-end dropdown-menu-lg enhanced-notification-dropdown"
          style={{ minHeight: 300, maxHeight: 500 }}
        >
          {/* Header with AI Toggle */}
          <div className="p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <h6 className="m-0 fs-16 fw-semibold d-flex align-items-center">
                  Notifications
                  {isAIEnabled && (
                    <span className="badge bg-primary-transparent text-primary ms-2 fs-10">
                      <i className="ti ti-robot me-1"></i>
                      AI
                    </span>
                  )}
                </h6>
                {isAIEnabled && (criticalNotifications.length > 0 || urgentNotifications.length > 0) && (
                  <small className="text-muted">
                    {criticalNotifications.length > 0 && (
                      <span className="text-danger">{criticalNotifications.length} critical</span>
                    )}
                    {criticalNotifications.length > 0 && urgentNotifications.length > 0 && ', '}
                    {urgentNotifications.length > 0 && (
                      <span className="text-warning">{urgentNotifications.length} urgent</span>
                    )}
                  </small>
                )}
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setShowAIControls(!showAIControls)}
                  title="AI Settings"
                >
                  <i className="ti ti-settings fs-12"></i>
                </button>
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={refreshNotifications}
                  disabled={isLoading}
                  title="Refresh"
                >
                  <i className={`ti ti-refresh fs-12 ${isLoading ? 'animate-spin' : ''}`}></i>
                </button>
              </div>
            </div>

            {/* AI Controls */}
            {showAIControls && (
              <div className="ai-controls mt-3 p-2 bg-light rounded-2">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <small className="fw-medium">AI Processing</small>
                  <Switch
                    size="small"
                    checked={isAIEnabled}
                    onChange={handleToggleAI}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                  />
                </div>
                <small className="text-muted">
                  {isAIEnabled 
                    ? 'AI categorizes and prioritizes notifications' 
                    : 'Traditional notification display'
                  }
                </small>
              </div>
            )}
          </div>

          {/* Notification Body */}
          <div className="notification-body position-relative" data-simplebar style={{ maxHeight: '350px' }}>
            {isLoading && displayNotifications.length === 0 ? (
              <div className="p-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="d-flex mb-3">
                    <Skeleton.Avatar active size="default" className="me-2" />
                    <div className="flex-grow-1">
                      <Skeleton active paragraph={{ rows: 2 }} title={{ width: '60%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-3 text-center">
                <div className="text-danger mb-2">
                  <i className="ti ti-exclamation-triangle fs-24"></i>
                </div>
                <small className="text-muted">{error}</small>
                <div className="mt-2">
                  <Button size="small" onClick={refreshNotifications}>
                    Retry
                  </Button>
                </div>
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-4 text-center">
                <div className="text-muted mb-2">
                  <i className="ti ti-bell-off fs-24"></i>
                </div>
                <small className="text-muted">No notifications</small>
              </div>
            ) : (
              displayNotifications.slice(0, 8).map((notification: any, index: number) => (
                <EnhancedNotificationItem
                  key={notification.id || `notification-${index}`}
                  notification={notification}
                  isAIEnabled={isAIEnabled}
                  onMarkRead={handleMarkRead}
                  onDismiss={handleDismiss}
                  onActionClick={handleActionClick}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 rounded-bottom border-top text-center">
            <div className="d-flex justify-content-between align-items-center">
              <Link
                to={all_routes.notifications}
                className="text-center text-decoration-underline fs-14 mb-0 flex-grow-1"
              >
                View All Notifications
              </Link>
              {isAIEnabled && displayNotifications.length > 0 && (
                <Link
                  to="/notifications/ai"
                  className="btn btn-sm btn-primary ms-2"
                >
                  <i className="ti ti-robot me-1 fs-10"></i>
                  Smart View
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedNotificationDropdown;
