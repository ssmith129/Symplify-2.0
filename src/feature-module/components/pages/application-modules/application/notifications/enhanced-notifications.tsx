import React, { useState, useCallback, useEffect } from 'react';
import { Button, Alert, Spin, Empty, message } from 'antd';
import { Link } from "react-router";
import AINotificationsFeed from './ai-notifications-feed';
import NotificationDetailView from './notification-detail-view';
import AINotificationSettings from './ai-notification-settings';
import useAINotifications from '../../../../../../core/hooks/useAINotifications';
import ImageWithBasePath from '../../../../../../core/imageWithBasePath';

interface EnhancedNotificationsProps {
  userRole?: string;
  department?: string;
  initialView?: 'feed' | 'settings';
}

const EnhancedNotifications: React.FC<EnhancedNotificationsProps> = ({
  userRole = 'doctor',
  department = 'general',
  initialView = 'feed'
}) => {
  const [currentView, setCurrentView] = useState<'feed' | 'settings'>(initialView);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);

  // Initialize AI notifications hook with role-based settings
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    settings,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    updateSettings,
    recordUserAction,
    refreshNotifications,
    // getHighPriorityNotifications,
    getNotificationsByType,
    getNotificationsByCategory
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
    refreshInterval: 30000,
    enableRealtime: true
  });

  // Check if this is the user's first time
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('ai-notifications-guide-seen');
    if (!hasSeenGuide) {
      setShowWelcomeGuide(true);
    }
  }, []);

  const handleNotificationClick = useCallback((notification: any) => {
    setSelectedNotification(notification);
    recordUserAction(notification.id, 'open_detail');
  }, [recordUserAction]);

  const handleNotificationAction = useCallback((action: string) => {
    if (!selectedNotification) return;

    recordUserAction(selectedNotification.id, action);

    switch (action) {
      case 'mark-read':
        markAsRead(selectedNotification.id);
        message.success('Notification marked as read');
        break;
      case 'dismiss':
        dismissNotification(selectedNotification.id);
        message.success('Notification dismissed');
        setSelectedNotification(null);
        break;
      case 'emergency-response':
        // Handle emergency response
        message.warning('Emergency response protocol initiated');
        markAsRead(selectedNotification.id);
        break;
      case 'contact-patient':
        // Handle patient contact
        message.info('Patient contact form opened');
        break;
      case 'schedule-followup':
        // Handle follow-up scheduling
        message.info('Follow-up scheduling opened');
        break;
      default:
        message.info(`Action performed: ${action}`);
    }
  }, [selectedNotification, recordUserAction, markAsRead, dismissNotification]);

  const handleSettingsUpdate = useCallback((newSettings: any) => {
    updateSettings(newSettings);
    message.success('AI settings updated successfully');
  }, [updateSettings]);

  const handleWelcomeGuideComplete = useCallback(() => {
    setShowWelcomeGuide(false);
    localStorage.setItem('ai-notifications-guide-seen', 'true');
  }, []);

  const criticalNotifications = getNotificationsByType('critical');
  const urgentNotifications = getNotificationsByType('urgent');

  if (currentView === 'settings') {
    return (
      <div className="enhanced-notifications-container">
        <div className="page-header d-flex justify-content-between align-items-center mb-4">
          <div>
            <h4 className="fw-bold mb-1">AI Notification Settings</h4>
            <p className="text-muted mb-0">Configure intelligent notification processing</p>
          </div>
          <Button onClick={() => setCurrentView('feed')} type="primary">
            <i className="ti ti-arrow-left me-1"></i>
            Back to Notifications
          </Button>
        </div>

        <AINotificationSettings
          onClose={() => setCurrentView('feed')}
        />
      </div>
    );
  }

  return (
    <div className="enhanced-notifications-container">
      {/* Welcome Guide */}
      {showWelcomeGuide && (
        <Alert
          message="Welcome to AI-Powered Notifications!"
          description={
            <div>
              <p className="mb-2">
                Your notifications are now enhanced with AI to help you focus on what matters most.
              </p>
              <ul className="mb-3">
                <li>🔴 Critical alerts are prioritized and highlighted</li>
                <li>🤖 AI provides insights and suggested actions</li>
                <li>📋 Similar notifications are grouped automatically</li>
                <li>⚙️ Settings adapt to your behavior over time</li>
              </ul>
              <Button size="small" onClick={handleWelcomeGuideComplete}>
                Got it, thanks!
              </Button>
            </div>
          }
          type="info"
          showIcon
          closable
          onClose={handleWelcomeGuideComplete}
          className="mb-4"
        />
      )}

      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center mb-2">
            <h4 className="fw-bold mb-0 me-3">Smart Notifications</h4>
            <div className="ai-status-indicator">
              <span className="badge bg-primary-transparent text-primary">
                <i className="ti ti-robot me-1"></i>
                AI Enhanced
              </span>
            </div>
          </div>
          <p className="text-muted mb-0">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
            {criticalNotifications.length > 0 && (
              <span className="text-danger ms-2">
                • {criticalNotifications.length} critical alert{criticalNotifications.length !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>

        <div className="header-actions d-flex align-items-center gap-2">
          <Button 
            onClick={refreshNotifications}
            loading={isLoading}
            title="Refresh notifications"
          >
            <i className="ti ti-refresh"></i>
          </Button>
          
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead}>
              <i className="ti ti-check-all me-1"></i>
              Mark All Read
            </Button>
          )}
          
          <Button onClick={() => setCurrentView('settings')}>
            <i className="ti ti-settings me-1"></i>
            AI Settings
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      {(criticalNotifications.length > 0 || urgentNotifications.length > 0) && (
        <div className="notification-stats mb-4">
          <div className="row g-3">
            {criticalNotifications.length > 0 && (
              <div className="col-auto">
                <div className="stat-card bg-danger-transparent border-danger">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-alert-triangle text-danger fs-20 me-2"></i>
                    <div>
                      <div className="fw-bold text-danger">{criticalNotifications.length}</div>
                      <small className="text-muted">Critical</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {urgentNotifications.length > 0 && (
              <div className="col-auto">
                <div className="stat-card bg-warning-transparent border-warning">
                  <div className="d-flex align-items-center">
                    <i className="ti ti-bell-ringing text-warning fs-20 me-2"></i>
                    <div>
                      <div className="fw-bold text-warning">{urgentNotifications.length}</div>
                      <small className="text-muted">Urgent</small>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="col-auto">
              <div className="stat-card bg-info-transparent border-info">
                <div className="d-flex align-items-center">
                  <i className="ti ti-clock text-info fs-20 me-2"></i>
                  <div>
                    <div className="fw-bold text-info">{Math.round(notifications.reduce((acc: number, n: any) => acc + n.aiPriority, 0) / notifications.length || 0)}</div>
                    <small className="text-muted">Avg Priority</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert
          message="Error Loading Notifications"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={refreshNotifications}>
              Retry
            </Button>
          }
          className="mb-4"
        />
      )}

      {/* Loading State */}
      {isLoading && notifications.length === 0 && (
        <div className="text-center py-5">
          <Spin size="large" />
          <p className="text-muted mt-3">Processing notifications with AI...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && notifications.length === 0 && !error && (
        <div className="empty-state text-center py-5">
          <Empty
            image={<ImageWithBasePath src="assets/img/icons/notification-empty.svg" alt="No notifications" />}
            description={
              <div>
                <h5 className="mb-2">All Clear!</h5>
                <p className="text-muted">No notifications to display right now.</p>
              </div>
            }
          >
            <Button type="primary" onClick={refreshNotifications}>
              <i className="ti ti-refresh me-1"></i>
              Check for Updates
            </Button>
          </Empty>
        </div>
      )}

      {/* Notifications Feed */}
      {notifications.length > 0 && (
        <AINotificationsFeed
          onNotificationClick={handleNotificationClick}
          onNotificationAction={recordUserAction}
        />
      )}

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <NotificationDetailView
          notification={selectedNotification}
          isVisible={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onAction={handleNotificationAction}
        />
      )}

      {/* Footer */}
      <div className="notifications-footer mt-4 pt-3 border-top text-center">
        <div className="d-flex justify-content-center align-items-center gap-4 text-muted">
          <span className="fs-12">
            <i className="ti ti-robot me-1"></i>
            AI processing enabled
          </span>
          <span className="fs-12">
            <i className="ti ti-shield-check me-1"></i>
            HIPAA compliant
          </span>
          <span className="fs-12">
            <i className="ti ti-clock me-1"></i>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
        
        <div className="mt-2">
          <Link to="/notifications/analytics" className="text-decoration-none fs-12">
            <i className="ti ti-chart-line me-1"></i>
            View Analytics
          </Link>
          <span className="mx-2">•</span>
          <Link to="/help/notifications" className="text-decoration-none fs-12">
            <i className="ti ti-help me-1"></i>
            Help & Documentation
          </Link>
        </div>
      </div>
    </div>
  );
};

// Helper function to get role-based category weights
function getRoleBasedCategoryWeights(role: string) {
  const weights = {
    doctor: {
      emergency: 100,
      medical: 90,
      appointment: 70,
      administrative: 30,
      reminder: 20
    },
    nurse: {
      emergency: 100,
      medical: 85,
      appointment: 60,
      administrative: 40,
      reminder: 50
    },
    admin: {
      emergency: 80,
      medical: 50,
      appointment: 80,
      administrative: 90,
      reminder: 60
    },
    receptionist: {
      emergency: 70,
      medical: 40,
      appointment: 95,
      administrative: 70,
      reminder: 80
    }
  };

  return weights[role as keyof typeof weights] || weights.doctor;
}

export default EnhancedNotifications;
