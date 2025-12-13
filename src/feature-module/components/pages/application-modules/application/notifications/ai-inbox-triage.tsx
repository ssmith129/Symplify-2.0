import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router';
import ImageWithBasePath from '../../../../../../core/imageWithBasePath';
import { Badge, Progress, Card, Statistic, Tabs, Alert, Empty, Spin } from 'antd';
import { aiNotificationService } from '../../../../../../core/services/ai-notification-service';
import type { ProcessedNotification } from '../../../../../../core/services/ai-notification-service';

// const { TabPane } = Tabs;

interface TriageMetrics {
  totalMessages: number;
  criticalCount: number;
  urgentCount: number;
  routineCount: number;
  adminCount: number;
  avgProcessingTime: number;
  accuracyScore: number;
  pendingAction: number;
}

interface TriageFilters {
  priority: 'all' | 'critical' | 'urgent' | 'routine' | 'admin';
  timeFrame: 'today' | 'week' | 'month';
  department: 'all' | 'emergency' | 'surgery' | 'general' | 'admin';
  status: 'all' | 'unread' | 'pending' | 'actionable' | 'resolved';
}

const AIInboxTriage: React.FC = () => {
  // State Management
  const [notifications, setNotifications] = useState<ProcessedNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  // const [activeTab, setActiveTab] = useState('dashboard');
  const [triageMetrics, setTriageMetrics] = useState<TriageMetrics>({
    totalMessages: 0,
    criticalCount: 0,
    urgentCount: 0,
    routineCount: 0,
    adminCount: 0,
    avgProcessingTime: 0,
    accuracyScore: 95,
    pendingAction: 0
  });
  
  const [filters, setFilters] = useState<TriageFilters>({
    priority: 'all',
    timeFrame: 'today',
    department: 'all',
    status: 'all'
  });

  // Mock enhanced data for demonstration
  const mockTriageData = useMemo(() => [
    {
      id: "triage-1",
      title: "Emergency Protocol Activation",
      message: "Code Blue activated in ICU Room 302. Multiple team members required for immediate response. Patient showing cardiac arrest symptoms.",
      avatar: "assets/img/icons/emergency-icon.svg",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      isRead: false,
      type: "urgent" as const,
      sender: "Emergency System",
      aiPriority: 5,
      aiCategory: 'critical' as const,
      confidence: 0.98,
      suggestedActions: [
        { label: 'Alert Code Team', action: 'emergency-alert', type: 'danger' as const },
        { label: 'Prepare Equipment', action: 'prep-equipment', type: 'warning' as const }
      ],
      metadata: {
        department: 'emergency',
        patientId: 'P-302-001',
        urgencyLevel: 'immediate',
        estimatedResponseTime: '2 minutes'
      }
    },
    {
      id: "triage-2", 
      title: "Surgical Schedule Conflict",
      message: "Dr. Anderson has overlapping surgeries scheduled. OR-3 double-booked for 2 PM slot. Requires immediate rescheduling to avoid delays.",
      avatar: "assets/img/doctors/doctor-01.jpg",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      isRead: false,
      type: "medical" as const,
      sender: "Dr. Anderson",
      aiPriority: 4,
      aiCategory: 'important' as const,
      confidence: 0.92,
      suggestedActions: [
        { label: 'Reschedule Surgery', action: 'reschedule', type: 'primary' as const },
        { label: 'Contact Patients', action: 'notify-patients', type: 'secondary' as const }
      ],
      metadata: {
        department: 'surgery',
        affectedPatients: 2,
        orRoom: 'OR-3',
        conflictTime: '14:00'
      }
    },
    {
      id: "triage-3",
      title: "Lab Results - Critical Values",
      message: "Patient Emily Johnson's blood work shows critically low hemoglobin (4.2 g/dL). Immediate medical intervention required.",
      avatar: "assets/img/doctors/doctor-06.jpg",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isRead: false,
      type: "medical" as const,
      sender: "Lab Department",
      aiPriority: 5,
      aiCategory: 'critical' as const,
      confidence: 0.96,
      suggestedActions: [
        { label: 'Contact Physician', action: 'contact-doctor', type: 'danger' as const },
        { label: 'Prepare Transfusion', action: 'prep-transfusion', type: 'warning' as const }
      ],
      metadata: {
        department: 'general',
        patientId: 'P-EMJ-001',
        testType: 'CBC',
        criticalValue: '4.2 g/dL'
      }
    },
    {
      id: "triage-4",
      title: "Patient Discharge Updates",
      message: "5 patients ready for discharge today. Documentation complete, insurance verified, follow-up appointments scheduled.",
      avatar: "assets/img/icons/discharge-icon.svg",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      isRead: false,
      type: "appointment" as const,
      sender: "Discharge Coordinator",
      aiPriority: 2,
      aiCategory: 'routine' as const,
      confidence: 0.85,
      suggestedActions: [
        { label: 'Process Discharges', action: 'batch-discharge', type: 'success' as const }
      ],
      metadata: {
        department: 'admin',
        patientCount: 5,
        averageStay: '3.2 days'
      }
    },
    {
      id: "triage-5",
      title: "Medication Stock Alert",
      message: "Critical medication shortage detected: Epinephrine (2 units remaining), Morphine (5 units). Reorder required immediately.",
      avatar: "assets/img/icons/pharmacy-icon.svg",
      timestamp: new Date(Date.now() - 35 * 60 * 1000),
      isRead: false,
      type: "system" as const,
      sender: "Pharmacy System",
      aiPriority: 4,
      aiCategory: 'important' as const,
      confidence: 0.94,
      suggestedActions: [
        { label: 'Emergency Reorder', action: 'reorder-meds', type: 'warning' as const },
        { label: 'Contact Supplier', action: 'contact-supplier', type: 'primary' as const }
      ],
      metadata: {
        department: 'admin',
        medicationsAffected: ['Epinephrine', 'Morphine'],
        stockLevels: { epinephrine: 2, morphine: 5 }
      }
    }
  ], []);

  // Load and process notifications
  useEffect(() => {
    const loadTriageData = async () => {
      setLoading(true);
      try {
        const processed = await aiNotificationService.processNotifications(mockTriageData);
        setNotifications(processed);
        
        // Calculate metrics
        const metrics: TriageMetrics = {
          totalMessages: processed.length,
          criticalCount: processed.filter(n => n.aiCategory === 'critical').length,
          urgentCount: processed.filter(n => n.aiCategory === 'important').length,
          routineCount: processed.filter(n => n.aiCategory === 'routine').length,
          adminCount: processed.filter(n => n.type === 'system').length,
          avgProcessingTime: 1.2,
          accuracyScore: 95,
          pendingAction: processed.filter(n => !n.isRead && n.suggestedActions?.length).length
        };
        
        setTriageMetrics(metrics);
      } catch (err) {
        setError('Failed to load triage data');
        console.error('Triage loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTriageData();
  }, [mockTriageData]);

  // Filter notifications based on selected filters
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => {
      if (filters.priority !== 'all') {
        const priorityMap = {
          critical: ['critical'],
          urgent: ['important'],
          routine: ['routine'],
          admin: ['informational']
        };
        if (!priorityMap[filters.priority]?.includes(notification.aiCategory)) return false;
      }
      
      if (filters.status !== 'all') {
        if (filters.status === 'unread' && notification.isRead) return false;
        if (filters.status === 'actionable' && !notification.suggestedActions?.length) return false;
      }

      return true;
    });
  }, [notifications, filters]);

  // Priority distribution for visual indicators
  const priorityDistribution = useMemo(() => {
    const total = filteredNotifications.length;
    if (total === 0) return { critical: 0, urgent: 0, routine: 0, admin: 0 };
    
    return {
      critical: (triageMetrics.criticalCount / total) * 100,
      urgent: (triageMetrics.urgentCount / total) * 100,
      routine: (triageMetrics.routineCount / total) * 100,
      admin: (triageMetrics.adminCount / total) * 100
    };
  }, [filteredNotifications.length, triageMetrics]);

  // Get priority styling
  const getPriorityColor = (category: string) => {
    switch (category) {
      case 'critical': return 'danger';
      case 'important': return 'warning';
      case 'routine': return 'info';
      case 'informational': return 'secondary';
      default: return 'info';
    }
  };

  const getPriorityIcon = (category: string) => {
    switch (category) {
      case 'critical': return 'ti ti-alert-triangle-filled';
      case 'important': return 'ti ti-exclamation-circle';
      case 'routine': return 'ti ti-info-circle';
      case 'informational': return 'ti ti-file-info';
      default: return 'ti ti-bell';
    }
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    const selectedIds = Array.from(selectedNotifications);
    console.log(`Performing ${action} on`, selectedIds);
    
    if (action === 'mark-read') {
      setNotifications(prev => prev.map(n => 
        selectedIds.includes(n.id) ? { ...n, isRead: true } : n
      ));
    } else if (action === 'dismiss') {
      setNotifications(prev => prev.filter(n => !selectedIds.includes(n.id)));
    }
    
    setSelectedNotifications(new Set());
  };

  // Format time ago
  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <Spin size="large" />
        <span className="ms-3">AI processing triage data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Triage System Error"
        description={error}
        type="error"
        showIcon
        action={
          <button className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()}>
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="ai-inbox-triage">
      {/* Header */}
      <div className="page-header bg-white rounded-3 p-4 mb-4 border">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <div className="ai-branding me-3">
              <i className="ti ti-robot text-primary fs-24"></i>
            </div>
            <div>
              <h4 className="mb-1 fw-bold">AI Inbox Triage</h4>
              <p className="mb-0 text-muted">Intelligent message prioritization and workflow management</p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge count={triageMetrics.pendingAction} offset={[0, 0]}>
              <button className="btn btn-outline-primary">
                <i className="ti ti-bell me-1"></i>
                Pending Actions
              </button>
            </Badge>
            <Link to="#" className="btn btn-primary">
              <i className="ti ti-settings me-1"></i>
              Triage Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="triage-metrics mb-4">
        <div className="row g-3">
          <div className="col-xl-3 col-lg-6 col-md-6">
            <Card className="text-center">
              <Statistic
                title="Total Messages"
                value={triageMetrics.totalMessages}
                prefix={<i className="ti ti-inbox text-primary me-1" />}
              />
              <small className="text-muted">Last 24 hours</small>
            </Card>
          </div>
          <div className="col-xl-3 col-lg-6 col-md-6">
            <Card className="text-center">
              <Statistic
                title="Critical Priority"
                value={triageMetrics.criticalCount}
                prefix={<i className="ti ti-alert-triangle text-danger me-1" />}
                valueStyle={{ color: '#dc3545' }}
              />
              <small className="text-muted">Requires immediate attention</small>
            </Card>
          </div>
          <div className="col-xl-3 col-lg-6 col-md-6">
            <Card className="text-center">
              <Statistic
                title="AI Accuracy"
                value={triageMetrics.accuracyScore}
                suffix="%"
                prefix={<i className="ti ti-target text-success me-1" />}
                valueStyle={{ color: '#198754' }}
              />
              <small className="text-muted">Triage precision rate</small>
            </Card>
          </div>
          <div className="col-xl-3 col-lg-6 col-md-6">
            <Card className="text-center">
              <Statistic
                title="Avg Process Time"
                value={triageMetrics.avgProcessingTime}
                suffix="s"
                prefix={<i className="ti ti-clock text-info me-1" />}
                valueStyle={{ color: '#0dcaf0' }}
              />
              <small className="text-muted">AI processing speed</small>
            </Card>
          </div>
        </div>
      </div>

      {/* Priority Distribution */}
      <div className="priority-overview bg-white rounded-3 p-4 mb-4 border">
        <h6 className="mb-3 fw-semibold">Priority Distribution</h6>
        <div className="row g-3">
          <div className="col-md-3">
            <div className="priority-stat">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-danger fw-medium">Critical</span>
                <span className="badge bg-danger">{triageMetrics.criticalCount}</span>
              </div>
              <Progress percent={priorityDistribution.critical} strokeColor="#dc3545" showInfo={false} />
            </div>
          </div>
          <div className="col-md-3">
            <div className="priority-stat">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-warning fw-medium">Urgent</span>
                <span className="badge bg-warning">{triageMetrics.urgentCount}</span>
              </div>
              <Progress percent={priorityDistribution.urgent} strokeColor="#ffc107" showInfo={false} />
            </div>
          </div>
          <div className="col-md-3">
            <div className="priority-stat">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-info fw-medium">Routine</span>
                <span className="badge bg-info">{triageMetrics.routineCount}</span>
              </div>
              <Progress percent={priorityDistribution.routine} strokeColor="#0dcaf0" showInfo={false} />
            </div>
          </div>
          <div className="col-md-3">
            <div className="priority-stat">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="text-secondary fw-medium">Admin</span>
                <span className="badge bg-secondary">{triageMetrics.adminCount}</span>
              </div>
              <Progress percent={priorityDistribution.admin} strokeColor="#6c757d" showInfo={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="triage-filters bg-white rounded-3 p-4 mb-4 border">
        <div className="row g-3 align-items-end">
          <div className="col-md-2">
            <label className="form-label fw-medium">Priority Level</label>
            <select 
              className="form-select"
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical Only</option>
              <option value="urgent">Urgent Only</option>
              <option value="routine">Routine Only</option>
              <option value="admin">Admin Only</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label fw-medium">Time Frame</label>
            <select 
              className="form-select"
              value={filters.timeFrame}
              onChange={(e) => setFilters(prev => ({ ...prev, timeFrame: e.target.value as any }))}
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label fw-medium">Department</label>
            <select 
              className="form-select"
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value as any }))}
            >
              <option value="all">All Departments</option>
              <option value="emergency">Emergency</option>
              <option value="surgery">Surgery</option>
              <option value="general">General</option>
              <option value="admin">Administration</option>
            </select>
          </div>
          <div className="col-md-2">
            <label className="form-label fw-medium">Status</label>
            <select 
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            >
              <option value="all">All Status</option>
              <option value="unread">Unread Only</option>
              <option value="pending">Pending Action</option>
              <option value="actionable">Actionable</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="col-md-4">
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm">
                <i className="ti ti-filter me-1"></i>
                Clear Filters
              </button>
              <button className="btn btn-outline-primary btn-sm">
                <i className="ti ti-refresh me-1"></i>
                Refresh
              </button>
              {selectedNotifications.size > 0 && (
                <div className="btn-group">
                  <button 
                    className="btn btn-primary btn-sm dropdown-toggle" 
                    data-bs-toggle="dropdown"
                  >
                    Bulk Actions ({selectedNotifications.size})
                  </button>
                  <ul className="dropdown-menu">
                    <li><button className="dropdown-item" onClick={() => handleBulkAction('mark-read')}>Mark as Read</button></li>
                    <li><button className="dropdown-item" onClick={() => handleBulkAction('dismiss')}>Dismiss All</button></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><button className="dropdown-item" onClick={() => handleBulkAction('export')}>Export Selected</button></li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Triage List */}
      <div className="triage-list">
        {filteredNotifications.length === 0 ? (
          <Empty
            description="No messages match your current filters"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div className="row g-3">
            {filteredNotifications.map((notification) => (
              <div key={notification.id} className="col-12">
                <div className={`triage-card card border-0 shadow-sm ${!notification.isRead ? 'unread-card' : ''}`}>
                  <div className="card-body p-4">
                    {/* Card Header */}
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center">
                        <div className="form-check me-3">
                          <input 
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedNotifications.has(notification.id)}
                            onChange={(e) => {
                              const newSet = new Set(selectedNotifications);
                              if (e.target.checked) {
                                newSet.add(notification.id);
                              } else {
                                newSet.delete(notification.id);
                              }
                              setSelectedNotifications(newSet);
                            }}
                          />
                        </div>
                        <div className={`priority-indicator me-3 p-2 rounded-circle bg-${getPriorityColor(notification.aiCategory)}-transparent`}>
                          <i className={`${getPriorityIcon(notification.aiCategory)} text-${getPriorityColor(notification.aiCategory)} fs-16`}></i>
                        </div>
                        <div>
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <Badge count={notification.aiPriority} color={getPriorityColor(notification.aiCategory)} />
                            <span className={`badge bg-${getPriorityColor(notification.aiCategory)}-transparent text-${getPriorityColor(notification.aiCategory)} text-uppercase fs-10`}>
                              {notification.aiCategory}
                            </span>
                            <span className="badge bg-light text-dark fs-10">
                              AI Confidence: {Math.round(notification.confidence * 100)}%
                            </span>
                            {!notification.isRead && (
                              <span className="badge bg-primary">New</span>
                            )}
                          </div>
                          <h6 className="mb-0 fw-semibold">{notification.title}</h6>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-muted fs-12">{formatTimeAgo(notification.timestamp)}</span>
                        <div className="dropdown">
                          <button className="btn btn-sm btn-outline-light" data-bs-toggle="dropdown">
                            <i className="ti ti-dots-vertical"></i>
                          </button>
                          <ul className="dropdown-menu">
                            <li><Link to="#" className="dropdown-item">View Details</Link></li>
                            <li><button className="dropdown-item">Mark as Read</button></li>
                            <li><button className="dropdown-item">Override AI</button></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><button className="dropdown-item text-danger">Dismiss</button></li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className="d-flex align-items-start">
                      <div className="avatar-wrapper me-3">
                        <ImageWithBasePath
                          src={notification.avatar}
                          className="avatar-lg rounded-circle"
                          alt="Avatar"
                        />
                      </div>
                      <div className="flex-grow-1">
                        <div className="sender-info mb-2">
                          <span className="fw-medium text-dark">{notification.sender}</span>
                          <span className="text-muted ms-2 fs-12">
                            • {notification.metadata?.department || 'General'}
                          </span>
                        </div>
                        <p className="notification-message mb-3">
                          {notification.message}
                        </p>

                        {/* AI Suggested Actions */}
                        {notification.suggestedActions && notification.suggestedActions.length > 0 && (
                          <div className="ai-actions mb-3">
                            <div className="d-flex align-items-center gap-2 mb-2">
                              <i className="ti ti-robot text-primary fs-14"></i>
                              <span className="fs-12 text-muted fw-medium">AI Recommended Actions:</span>
                            </div>
                            <div className="d-flex gap-2 flex-wrap">
                              {notification.suggestedActions.map((action: any, index: number) => (
                                <button
                                  key={`${notification.id}-action-${action.action}-${index}`}
                                  className={`btn btn-${action.type} btn-sm`}
                                  onClick={() => console.log(`Action: ${action.action} for ${notification.id}`)}
                                >
                                  {action.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata Display */}
                        {notification.metadata && (
                          <div className="metadata-tags">
                            <div className="d-flex gap-1 flex-wrap">
                              {notification.metadata.patientId && (
                                <span className="badge bg-info-transparent text-info fs-10">
                                  Patient: {notification.metadata.patientId}
                                </span>
                              )}
                              {notification.metadata.urgencyLevel && (
                                <span className="badge bg-warning-transparent text-warning fs-10">
                                  Urgency: {notification.metadata.urgencyLevel}
                                </span>
                              )}
                              {notification.metadata.estimatedResponseTime && (
                                <span className="badge bg-secondary-transparent text-secondary fs-10">
                                  Response: {notification.metadata.estimatedResponseTime}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load More */}
      <div className="text-center mt-4">
        <button className="btn btn-outline-primary">
          <i className="ti ti-refresh me-1"></i>
          Load More Messages
        </button>
      </div>
    </div>
  );
};

export default AIInboxTriage;
