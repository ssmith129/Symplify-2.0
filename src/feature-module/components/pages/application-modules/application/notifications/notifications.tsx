import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from "react-router";
import { Badge, Switch, Tooltip, Card, Statistic, Empty, Spin, Button, Alert, message, Select, Slider, Modal } from 'antd';
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import Modals from "./modals/modals";
import PredefinedDatePicker from "../../../../../../core/common/datePicker";
import useAINotifications from "../../../../../../core/hooks/useAINotifications";
import type { ProcessedNotification } from "../../../../../../core/services/ai-notification-service";
import AIVisualFlags from './ai-visual-flags';
import NotificationDetailView from './notification-detail-view';
import AINotificationSettings from './ai-notification-settings';

const { Option } = Select;

interface NotificationItem {
  id: string;
  type: 'critical' | 'urgent' | 'routine' | 'system';
  category: 'appointment' | 'medical' | 'administrative' | 'emergency' | 'reminder';
  aiPriority: number; // 1-5 scale
  title: string;
  description: string;
  timestamp: Date;
  isRead: boolean;
  isGrouped: boolean;
  groupId?: string;
  groupCount?: number;
  aiInsight?: string;
  actionSuggested?: boolean;
  actionType?: 'accept' | 'review' | 'respond' | 'acknowledge' | 'decline' | 'delete';
  avatar: string;
  sender: string;
  role: string[];
  metadata?: {
    patientId?: string;
    doctorId?: string;
    appointmentId?: string;
    [key: string]: any;
  };
  confidence?: number;
  suggestedActions?: Array<{
    label: string;
    action: string;
    type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  }>;
  flags?: string[];
}

interface FilterState {
  priority: string;
  category: string;
  timeFrame: string;
  status: string;
  showAIFeatures: boolean;
}

interface TriageMetrics {
  totalNotifications: number;
  criticalCount: number;
  urgentCount: number;
  routineCount: number;
  avgResponseTime: number;
  accuracyScore: number;
  pendingAction: number;
  processedToday: number;
}

const Notifications = () => {
  // Core state
  const [isAIMode, setIsAIMode] = useState(() => {
    const saved = localStorage.getItem('notifications-ai-mode');
    return saved ? JSON.parse(saved) : false;
  });
  const [currentView, setCurrentView] = useState<'feed' | 'settings'>('feed');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);
  const [showWelcomeGuide, setShowWelcomeGuide] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    priority: 'all',
    category: 'all',
    timeFrame: 'today',
    status: 'all',
    showAIFeatures: isAIMode
  });

  // AI-specific state
  const [triageMetrics, setTriageMetrics] = useState<TriageMetrics>({
    totalNotifications: 0,
    criticalCount: 0,
    urgentCount: 0,
    routineCount: 0,
    avgResponseTime: 0,
    accuracyScore: 95,
    pendingAction: 0,
    processedToday: 0
  });

  // Initialize AI notifications hook
  const {
    notifications: aiNotifications,
    unreadCount,
    isLoading: aiLoading,
    error: aiError,
    settings,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    updateSettings,
    recordUserAction,
    refreshNotifications,
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
    autoRefresh: isAIMode,
    refreshInterval: 30000,
    enableRealtime: isAIMode
  });

  // Enhanced mock notifications with AI features
  const enhancedMockNotifications: NotificationItem[] = [
    {
      id: "1",
      type: "critical",
      category: "emergency",
      aiPriority: 5,
      title: "Dr. Smith",
      description: "Emergency patient in ICU Room 302 - showing signs of respiratory distress. Need immediate medical team response.",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      isRead: false,
      isGrouped: false,
      aiInsight: "Critical: Requires immediate medical intervention within 10 minutes",
      actionSuggested: true,
      actionType: "respond",
      avatar: "assets/img/doctors/doctor-01.jpg",
      sender: "Dr. Smith",
      role: ["doctor", "nurse"],
      confidence: 0.98,
      suggestedActions: [
        { label: 'Emergency Response', action: 'emergency-response', type: 'danger' },
        { label: 'Alert Team', action: 'alert-team', type: 'warning' }
      ],
      flags: ['emergency', 'patient-critical'],
      metadata: {
        patientRoom: '302',
        condition: 'respiratory distress',
        urgencyLevel: 'immediate'
      }
    },
    {
      id: "2",
      type: "urgent",
      category: "medical",
      aiPriority: 4,
      title: "Dr. Patel",
      description: "Lab Results Critical - Patient Emily's blood work shows abnormal results requiring immediate follow-up",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      isRead: false,
      isGrouped: false,
      aiInsight: "High priority: Abnormal lab values detected, requires doctor review within 2 hours",
      actionSuggested: true,
      actionType: "review",
      avatar: "assets/img/doctors/doctor-06.jpg",
      sender: "Dr. Patel",
      role: ["doctor", "nurse"],
      confidence: 0.92,
      suggestedActions: [
        { label: 'Review Results', action: 'review-results', type: 'warning' },
        { label: 'Contact Patient', action: 'contact-patient', type: 'primary' }
      ],
      flags: ['medical', 'lab-critical'],
      metadata: {
        patientId: 'P-001',
        labValues: 'abnormal',
        followUpRequired: true
      }
    },
    {
      id: "3",
      type: "routine",
      category: "appointment",
      aiPriority: 3,
      title: "Emily",
      description: "booked an appointment with Dr. Patel for April 15",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      isGrouped: true,
      groupId: "appointments-today",
      groupCount: 3,
      aiInsight: "Routine appointment booking - can be processed in batch",
      actionSuggested: true,
      actionType: "accept",
      avatar: "assets/img/doctors/doctor-02.jpg",
      sender: "Emily",
      role: ["admin", "receptionist"],
      confidence: 0.85,
      suggestedActions: [
        { label: 'Accept', action: 'accept', type: 'success' },
        { label: 'Reschedule', action: 'reschedule', type: 'secondary' }
      ],
      flags: ['appointment', 'routine']
    },
    {
      id: "4",
      type: "routine",
      category: "administrative",
      aiPriority: 2,
      title: "Amelia",
      description: "completed the pre-visit health questionnaire.",
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      isRead: false,
      isGrouped: false,
      aiInsight: "Routine administrative task - questionnaire completed successfully",
      actionSuggested: false,
      avatar: "assets/img/doctors/doctor-07.jpg",
      sender: "Amelia",
      role: ["admin", "nurse"],
      confidence: 0.78,
      flags: ['administrative', 'completed']
    },
    {
      id: "5",
      type: "routine",
      category: "appointment",
      aiPriority: 2,
      title: "Wick",
      description: "booked an appointment with Dr. smith for April 12",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      isRead: false,
      isGrouped: true,
      groupId: "appointments-today",
      groupCount: 3,
      aiInsight: "Part of appointment booking cluster",
      actionSuggested: true,
      actionType: "accept",
      avatar: "assets/img/users/user-05.jpg",
      sender: "Wick",
      role: ["admin", "receptionist"],
      confidence: 0.83,
      suggestedActions: [
        { label: 'Accept', action: 'accept', type: 'success' },
        { label: 'Decline', action: 'decline', type: 'secondary' }
      ],
      flags: ['appointment', 'routine']
    }
  ];

  // Initialize data and metrics
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      // Calculate metrics from enhanced notifications
      const metrics: TriageMetrics = {
        totalNotifications: enhancedMockNotifications.length,
        criticalCount: enhancedMockNotifications.filter(n => n.type === 'critical').length,
        urgentCount: enhancedMockNotifications.filter(n => n.type === 'urgent').length,
        routineCount: enhancedMockNotifications.filter(n => n.type === 'routine').length,
        avgResponseTime: 2.3,
        accuracyScore: 95,
        pendingAction: enhancedMockNotifications.filter(n => !n.isRead).length,
        processedToday: 24
      };
      
      setTriageMetrics(metrics);
      setLoading(false);
    }, 1000);
  }, []);

  // Update filters when AI mode changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, showAIFeatures: isAIMode }));
    localStorage.setItem('notifications-ai-mode', JSON.stringify(isAIMode));
  }, [isAIMode]);

  // Check for first time user
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem('ai-notifications-guide-seen');
    if (!hasSeenGuide && isAIMode) {
      setShowWelcomeGuide(true);
    }
  }, [isAIMode]);

  // Filter notifications based on current filters
  const filteredNotifications = useMemo(() => {
    return enhancedMockNotifications.filter(notification => {
      if (filters.priority !== 'all') {
        if (filters.priority === 'critical' && notification.type !== 'critical') return false;
        if (filters.priority === 'urgent' && notification.type !== 'urgent') return false;
        if (filters.priority === 'routine' && notification.type !== 'routine') return false;
      }
      
      if (filters.category !== 'all') {
        if (notification.category !== filters.category) return false;
      }
      
      if (filters.status !== 'all') {
        if (filters.status === 'unread' && notification.isRead) return false;
        if (filters.status === 'read' && !notification.isRead) return false;
      }
      
      return true;
    });
  }, [filters]);

  // Toggle AI mode
  const toggleAIMode = useCallback(() => {
    setIsAIMode(!isAIMode);
  }, [isAIMode]);

  // Handle notification actions
  const handleNotificationAction = useCallback((action: string, notificationId: string) => {
    const notification = enhancedMockNotifications.find(n => n.id === notificationId);
    if (!notification) return;

    if (isAIMode) {
      recordUserAction(notificationId, action);
    }

    switch (action) {
      case 'accept':
        message.success('Appointment accepted');
        break;
      case 'decline':
        message.info('Appointment declined');
        break;
      case 'delete':
        if (isAIMode) {
          dismissNotification(notificationId);
        }
        message.success('Notification deleted');
        break;
      case 'emergency-response':
        message.warning('Emergency response protocol initiated');
        break;
      case 'review-results':
        message.info('Lab results opened for review');
        break;
      case 'contact-patient':
        message.info('Patient contact initiated');
        break;
      default:
        message.info(`Action performed: ${action}`);
    }
  }, [isAIMode, recordUserAction, dismissNotification]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    if (isAIMode) {
      markAllAsRead();
    }
    message.success('All notifications marked as read');
  }, [isAIMode, markAllAsRead]);

  // Handle notification click
  const handleNotificationClick = useCallback((notification: NotificationItem) => {
    setSelectedNotification(notification);
    if (isAIMode) {
      recordUserAction(notification.id, 'open_detail');
    }
  }, [isAIMode, recordUserAction]);

  // Get priority color
  const getPriorityColor = (type: string) => {
    switch (type) {
      case 'critical': return 'danger';
      case 'urgent': return 'warning';
      case 'routine': return 'info';
      case 'system': return 'secondary';
      default: return 'secondary';
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} mins ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading || (isAIMode && aiLoading)) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spin size="large" />
        <span className="ms-3">Loading notification system...</span>
      </div>
    );
  }

  // Show settings view
  if (currentView === 'settings') {
    return (
      <AINotificationSettings
        settings={settings}
        onUpdateSettings={updateSettings}
        onClose={() => setCurrentView('feed')}
      />
    );
  }

  return (
    <>
      {/* ========================
        Start Page Content
      ========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="mb-3 pb-3 border-bottom mb-4">
            <div className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center gap-3">
                <h4 className="fw-bold mb-0">
                  {isAIMode ? 'Smart Notifications' : 'Notifications'}
                </h4>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted fs-14">AI Mode</span>
                  <Switch
                    checked={isAIMode}
                    onChange={toggleAIMode}
                    checkedChildren={<i className="ti ti-robot" />}
                    unCheckedChildren={<i className="ti ti-bell" />}
                    size="default"
                  />
                  {isAIMode && (
                    <Tooltip title="AI-powered notification prioritization and intelligent insights">
                      <i className="ti ti-info-circle text-primary"></i>
                    </Tooltip>
                  )}
                </div>
              </div>
              {isAIMode && (
                <Button 
                  icon={<i className="ti ti-settings" />}
                  onClick={() => setCurrentView('settings')}
                >
                  AI Settings
                </Button>
              )}
            </div>
            {isAIMode && (
              <p className="mb-0 text-muted fs-12 mt-2">
                Intelligent notification prioritization with automated triage and suggested actions
              </p>
            )}
          </div>
          {/* End Page Header */}

          {/* Welcome Guide Modal */}
          {showWelcomeGuide && (
            <Modal
              title="Welcome to Smart Notifications"
              open={showWelcomeGuide}
              onOk={() => {
                setShowWelcomeGuide(false);
                localStorage.setItem('ai-notifications-guide-seen', 'true');
              }}
              onCancel={() => setShowWelcomeGuide(false)}
              footer={[
                <Button key="close" type="primary" onClick={() => {
                  setShowWelcomeGuide(false);
                  localStorage.setItem('ai-notifications-guide-seen', 'true');
                }}>
                  Got it!
                </Button>
              ]}
            >
              <div className="welcome-content">
                <p>AI-powered notifications help you focus on what matters most:</p>
                <ul>
                  <li><strong>Smart Prioritization:</strong> Critical alerts are highlighted automatically</li>
                  <li><strong>Suggested Actions:</strong> AI recommends appropriate responses</li>
                  <li><strong>Intelligent Grouping:</strong> Similar notifications are grouped together</li>
                  <li><strong>Real-time Insights:</strong> Get context-aware recommendations</li>
                </ul>
                <p className="mb-0">Emergency notifications will always appear first with visual alerts.</p>
              </div>
            </Modal>
          )}

          {/* AI Metrics Dashboard - Only shown in AI mode */}
          {isAIMode && (
            <div className="ai-metrics-dashboard mb-4">
              <div className="row g-3">
                <div className="col-xl-3 col-lg-6 col-md-6">
                  <Card className="text-center border-0 shadow-sm">
                    <Statistic
                      title="Total Notifications"
                      value={triageMetrics.totalNotifications}
                      prefix={<i className="ti ti-bell text-primary me-1" />}
                    />
                    <small className="text-muted">Active notifications</small>
                  </Card>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                  <Card className="text-center border-0 shadow-sm">
                    <Statistic
                      title="Critical Priority"
                      value={triageMetrics.criticalCount}
                      prefix={<i className="ti ti-alert-triangle text-danger me-1" />}
                      valueStyle={{ color: '#dc3545' }}
                    />
                    <small className="text-muted">Require immediate attention</small>
                  </Card>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                  <Card className="text-center border-0 shadow-sm">
                    <Statistic
                      title="AI Accuracy"
                      value={triageMetrics.accuracyScore}
                      suffix="%"
                      prefix={<i className="ti ti-target text-success me-1" />}
                      valueStyle={{ color: '#198754' }}
                    />
                    <small className="text-muted">Classification precision</small>
                  </Card>
                </div>
                <div className="col-xl-3 col-lg-6 col-md-6">
                  <Card className="text-center border-0 shadow-sm">
                    <Statistic
                      title="Avg Response"
                      value={triageMetrics.avgResponseTime}
                      suffix="m"
                      prefix={<i className="ti ti-clock text-info me-1" />}
                      valueStyle={{ color: '#0dcaf0' }}
                    />
                    <small className="text-muted">Response time</small>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* AI Filter Controls - Only shown in AI mode */}
          {isAIMode && (
            <div className="ai-filter-section mb-4">
              <div className="bg-white rounded-3 p-4 border">
                <h6 className="fw-bold mb-3">Smart Filters</h6>
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
                    <label className="form-label fw-medium">Priority Level</label>
                    <Select 
                      value={filters.priority}
                      onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                      className="w-100"
                    >
                      <Option value="all">All Priorities</Option>
                      <Option value="critical">Critical Only</Option>
                      <Option value="urgent">Urgent Only</Option>
                      <Option value="routine">Routine Only</Option>
                    </Select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-medium">Category</label>
                    <Select 
                      value={filters.category}
                      onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                      className="w-100"
                    >
                      <Option value="all">All Categories</Option>
                      <Option value="emergency">Emergency</Option>
                      <Option value="medical">Medical</Option>
                      <Option value="appointment">Appointments</Option>
                      <Option value="administrative">Administrative</Option>
                    </Select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label fw-medium">Status</label>
                    <Select 
                      value={filters.status}
                      onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                      className="w-100"
                    >
                      <Option value="all">All Status</Option>
                      <Option value="unread">Unread Only</Option>
                      <Option value="read">Read Only</Option>
                    </Select>
                  </div>
                  <div className="col-md-3">
                    <button 
                      className="btn btn-outline-secondary w-100"
                      onClick={() => setFilters(prev => ({ ...prev, priority: 'all', category: 'all', status: 'all' }))}
                    >
                      <i className="ti ti-refresh me-1"></i>
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error Alert */}
          {isAIMode && aiError && (
            <Alert
              message="AI Processing Error"
              description={aiError}
              type="warning"
              showIcon
              closable
              className="mb-4"
            />
          )}

          <div className="row">
            {/* Notifications */}
            <div className="col-xl-12">
              <div className="notification-header">
                <div className="form-sort form-wrap">
                  <div className="d-flex right-content align-items-center flex-wrap">
                    <div className="position-relative">
                      <span className="input-icon-addon fs-14 text-dark">
                        <i className="ti ti-calendar" />
                      </span>
                      <PredefinedDatePicker />
                    </div>
                    {isAIMode && (
                      <div className="ms-3">
                        <span className="badge bg-primary-transparent text-primary">
                          <i className="ti ti-robot me-1"></i>
                          {filteredNotifications.length} AI Processed
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <ul>
                  <li>
                    <button 
                      className="btn"
                      onClick={handleMarkAllAsRead}
                    >
                      <i className="feather-check" /> Mark all as read
                    </button>
                  </li>
                  <li>
                    <Link to="#" className="btn btn-delete">
                      <i className="feather-trash-2" /> Delete all
                    </Link>
                  </li>
                  {isAIMode && (
                    <li>
                      <button 
                        className="btn btn-outline-primary"
                        onClick={refreshNotifications}
                      >
                        <i className="ti ti-refresh" /> Refresh AI
                      </button>
                    </li>
                  )}
                </ul>
              </div>
              
              <div className="notication-list">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-5">
                    <Empty
                      description={isAIMode ? "No notifications match your AI filters" : "No notifications"}
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notication-item bg-white ${isAIMode ? `ai-enhanced ${notification.type}` : ''} ${!notification.isRead ? 'unread' : ''}`}
                      style={{ 
                        borderLeft: isAIMode ? `4px solid var(--${getPriorityColor(notification.type)})` : undefined,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="row align-items-center">
                        <div className="col-lg-9">
                          <div className="notication-content">
                            <span className="position-relative">
                              <ImageWithBasePath
                                src={notification.avatar}
                                className="img-fluid"
                                alt="img"
                              />
                              {isAIMode && notification.type === 'critical' && (
                                <span className="position-absolute top-0 end-0 p-1 bg-danger border border-white rounded-circle animate-pulse">
                                  <span className="visually-hidden">Critical</span>
                                </span>
                              )}
                            </span>
                            <div className="notication-info">
                              <div>
                                <div className="d-flex align-items-center gap-2 mb-1">
                                  <p className="text-dark fw-semibold me-0 mb-0">
                                    {notification.title}
                                  </p>
                                  {isAIMode && (
                                    <>
                                      <Badge 
                                        count={notification.aiPriority} 
                                        color={getPriorityColor(notification.type)} 
                                        size="small"
                                      />
                                      <span className={`badge bg-${getPriorityColor(notification.type)}-transparent text-${getPriorityColor(notification.type)} fs-10`}>
                                        {notification.type}
                                      </span>
                                      {notification.confidence && (
                                        <span className="badge bg-light text-dark fs-10">
                                          {Math.round(notification.confidence * 100)}% confident
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                                <p className="notify-time mb-0">
                                  {notification.description}
                                </p>
                                
                                {/* AI Enhanced Features */}
                                {isAIMode && notification.aiInsight && (
                                  <div className="ai-insight mt-2 p-2 bg-primary-transparent rounded">
                                    <small className="text-primary fw-medium">
                                      <i className="ti ti-bulb me-1"></i>
                                      AI Insight: {notification.aiInsight}
                                    </small>
                                  </div>
                                )}

                                {/* AI Visual Flags */}
                                {isAIMode && notification.flags && (
                                  <div className="ai-flags mt-2">
                                    <AIVisualFlags 
                                      notification={{
                                        id: notification.id,
                                        title: notification.title,
                                        message: notification.description,
                                        timestamp: notification.timestamp,
                                        isRead: notification.isRead,
                                        type: notification.category,
                                        sender: notification.sender,
                                        avatar: notification.avatar,
                                        aiPriority: notification.aiPriority,
                                        aiCategory: notification.category,
                                        confidence: notification.confidence || 0.5,
                                        suggestedActions: notification.suggestedActions,
                                        metadata: notification.metadata
                                      }}
                                      size="small"
                                      compact={true}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="d-lg-flex align-items-center justify-content-between">
                            <div className="noti-btn">
                              {isAIMode && notification.suggestedActions ? (
                                <div className="d-flex gap-1 flex-wrap">
                                  {notification.suggestedActions.slice(0, 2).map((action, index) => (
                                    <button
                                      key={`${notification.id}-action-${index}`}
                                      className={`btn btn-${action.type} btn-sm`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNotificationAction(action.action, notification.id);
                                      }}
                                    >
                                      {action.label}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <>
                                  {notification.actionType === 'accept' && (
                                    <>
                                      <button 
                                        className="btn m-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleNotificationAction('decline', notification.id);
                                        }}
                                      >
                                        Decline
                                      </button>
                                      <button 
                                        className="btn btn-primary m-0"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleNotificationAction('accept', notification.id);
                                        }}
                                      >
                                        Accept
                                      </button>
                                    </>
                                  )}
                                  {notification.actionType === 'delete' && (
                                    <button 
                                      className="btn btn-danger"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleNotificationAction('delete', notification.id);
                                      }}
                                      data-bs-toggle="modal"
                                      data-bs-target="#delete_notification"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                            <p className="m-0 text-muted fs-12"> 
                              {formatTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* Notifications */}
          </div>
        </div>
        {/* End Content */}
        
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©{" "}
            <Link to="#" className="link-primary">
              Symplify
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
        End Page Content
      ========================= */}
      
      {/* Notification Detail Modal */}
      {selectedNotification && (
        <NotificationDetailView
          notification={{
            id: selectedNotification.id,
            title: selectedNotification.title,
            message: selectedNotification.description,
            timestamp: selectedNotification.timestamp,
            isRead: selectedNotification.isRead,
            type: selectedNotification.category,
            sender: selectedNotification.sender,
            avatar: selectedNotification.avatar,
            aiPriority: selectedNotification.aiPriority,
            aiCategory: selectedNotification.category,
            confidence: selectedNotification.confidence || 0.5,
            suggestedActions: selectedNotification.suggestedActions,
            metadata: selectedNotification.metadata
          }}
          isVisible={!!selectedNotification}
          onClose={() => setSelectedNotification(null)}
          onAction={(action) => {
            handleNotificationAction(action, selectedNotification.id);
            if (['accept', 'decline', 'delete', 'dismiss'].includes(action)) {
              setSelectedNotification(null);
            }
          }}
        />
      )}
      
      <Modals />
    </>
  );
};

export default Notifications;
