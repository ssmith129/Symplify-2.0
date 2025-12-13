import React, { useState, useEffect, useMemo } from 'react';
import { Link } from "react-router";
import { all_routes } from "../../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";
import { Badge, Switch, Tooltip, Card, Statistic, Empty, Spin } from 'antd';
import type { ProcessedNotification } from '../../../../../../core/services/ai-notification-service';
import AIVisualFlags from '../notifications/ai-visual-flags';
import 'overlayscrollbars/overlayscrollbars.css';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: any[];
  aiEnhanced?: {
    priority: number;
    category: 'critical' | 'important' | 'routine' | 'informational';
    confidence: number;
    suggestedActions?: Array<{
      label: string;
      action: string;
      type: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
    }>;
    flags?: string[];
    metadata?: Record<string, any>;
  };
}

interface ChatUser {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: Date;
  isOnline: boolean;
  unreadCount: number;
  aiPriority?: number;
  aiCategory?: string;
}

interface TriageMetrics {
  totalChats: number;
  criticalCount: number;
  urgentCount: number;
  routineCount: number;
  avgResponseTime: number;
  accuracyScore: number;
  pendingAction: number;
}

const Chat = () => {
  // Core state
  const [isAIMode, setIsAIMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatUsers, setChatUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  // AI-specific state
  const [triageMetrics, setTriageMetrics] = useState<TriageMetrics>({
    totalChats: 0,
    criticalCount: 0,
    urgentCount: 0,
    routineCount: 0,
    avgResponseTime: 0,
    accuracyScore: 95,
    pendingAction: 0
  });

  const [filters, setFilters] = useState({
    priority: 'all' as 'all' | 'critical' | 'urgent' | 'routine',
    timeFrame: 'today' as 'today' | 'week' | 'month',
    department: 'all' as 'all' | 'emergency' | 'surgery' | 'general' | 'admin',
    status: 'all' as 'all' | 'unread' | 'pending' | 'actionable' | 'resolved',
    showAIFeatures: isAIMode
  });

  // Mock data with AI-enhanced features
  const mockChatUsers: ChatUser[] = [
    {
      id: "user-01",
      name: "Mark Smith",
      avatar: "assets/img/users/user-02.jpg",
      lastMessage: "Emergency patient in ICU needs immediate attention",
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      isOnline: true,
      unreadCount: 3,
      aiPriority: 5,
      aiCategory: 'critical'
    },
    {
      id: "user-02",
      name: "Eugene Sikora",
      avatar: "assets/img/users/user-03.jpg",
      lastMessage: "Surgery schedule needs adjustment for tomorrow",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      isOnline: true,
      unreadCount: 5,
      aiPriority: 4,
      aiCategory: 'important'
    },
    {
      id: "user-03",
      name: "Robert Fassett",
      avatar: "assets/img/users/user-04.jpg",
      lastMessage: "Lab results are ready for review",
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      isOnline: false,
      unreadCount: 2,
      aiPriority: 3,
      aiCategory: 'routine'
    },
    {
      id: "user-04",
      name: "Andrew Fletcher",
      avatar: "assets/img/users/user-05.jpg",
      lastMessage: "Use tools like Trello for project management",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      isOnline: true,
      unreadCount: 0,
      aiPriority: 2,
      aiCategory: 'routine'
    },
    {
      id: "user-05",
      name: "Tyron Derby",
      avatar: "assets/img/users/user-06.jpg",
      lastMessage: "Let's reconvene next week for the quarterly review",
      timestamp: new Date(Date.now() - 35 * 60 * 1000),
      isOnline: true,
      unreadCount: 0,
      aiPriority: 2,
      aiCategory: 'informational'
    },
    {
      id: "user-06",
      name: "Anna Johnson",
      avatar: "assets/img/users/user-06.jpg",
      lastMessage: "How are you today? Any updates on the project?",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      isOnline: false,
      unreadCount: 0,
      aiPriority: 1,
      aiCategory: 'routine'
    },
    {
      id: "user-07",
      name: "Emily Davis",
      avatar: "assets/img/users/user-07.jpg",
      lastMessage: "Sure, I can help with the documentation",
      timestamp: new Date(Date.now() - 55 * 60 * 1000),
      isOnline: true,
      unreadCount: 0,
      aiPriority: 2,
      aiCategory: 'routine'
    },
    {
      id: "user-08",
      name: "Susan Denton",
      avatar: "assets/img/users/user-08.jpg",
      lastMessage: "I'll share the meeting notes later today",
      timestamp: new Date(Date.now() - 65 * 60 * 1000),
      isOnline: false,
      unreadCount: 0,
      aiPriority: 2,
      aiCategory: 'informational'
    },
    {
      id: "user-09",
      name: "David Cruz",
      avatar: "assets/img/users/user-09.jpg",
      lastMessage: "Let me know if you need any assistance",
      timestamp: new Date(Date.now() - 75 * 60 * 1000),
      isOnline: true,
      unreadCount: 0,
      aiPriority: 1,
      aiCategory: 'routine'
    }
  ];

  const mockMessages: ChatMessage[] = [
    {
      id: "msg-01",
      senderId: "user-01",
      senderName: "Mark Smith",
      senderAvatar: "assets/img/users/user-02.jpg",
      message: "Emergency patient in ICU Room 302 - showing signs of respiratory distress. Need immediate medical team response.",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      isOwn: false,
      type: 'text',
      aiEnhanced: {
        priority: 5,
        category: 'critical',
        confidence: 0.98,
        suggestedActions: [
          { label: 'Alert Medical Team', action: 'alert-team', type: 'danger' },
          { label: 'Prepare Equipment', action: 'prep-equipment', type: 'warning' }
        ],
        flags: ['emergency', 'patient-critical'],
        metadata: {
          patientRoom: '302',
          condition: 'respiratory distress',
          urgencyLevel: 'immediate'
        }
      }
    },
    {
      id: "msg-02",
      senderId: "current-user",
      senderName: "You",
      senderAvatar: "assets/img/users/user-01.jpg",
      message: "Medical team has been notified. ETA 2 minutes. Preparing respiratory support equipment.",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      isOwn: true,
      type: 'text'
    },
    {
      id: "msg-03",
      senderId: "user-01",
      senderName: "Mark Smith",
      senderAvatar: "assets/img/users/user-02.jpg",
      message: "Patient's oxygen saturation improving. Crisis averted. Thank you for the quick response!",
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      isOwn: false,
      type: 'text',
      aiEnhanced: {
        priority: 2,
        category: 'informational',
        confidence: 0.85,
        flags: ['update', 'resolved']
      }
    },
    {
      id: "msg-04",
      senderId: "current-user",
      senderName: "You",
      senderAvatar: "assets/img/users/user-01.jpg",
      message: "Perfect! That layout will work great on the landing page. 👍",
      timestamp: new Date(Date.now() - 30 * 1000),
      isOwn: true,
      type: 'text'
    }
  ];

  // Initialize data
  useEffect(() => {
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setChatUsers(mockChatUsers);
      if (mockChatUsers.length > 0) {
        setSelectedUser(mockChatUsers[0]);
        setMessages(mockMessages);
      }
      
      // Calculate metrics
      const metrics: TriageMetrics = {
        totalChats: mockChatUsers.length,
        criticalCount: mockChatUsers.filter(u => u.aiCategory === 'critical').length,
        urgentCount: mockChatUsers.filter(u => u.aiCategory === 'important').length,
        routineCount: mockChatUsers.filter(u => u.aiCategory === 'routine').length,
        avgResponseTime: 1.5,
        accuracyScore: 95,
        pendingAction: mockChatUsers.filter(u => u.unreadCount > 0).length
      };
      
      setTriageMetrics(metrics);
      setLoading(false);
    }, 1000);
  }, []);

  // Update filters when AI mode changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, showAIFeatures: isAIMode }));
  }, [isAIMode]);

  // Filter chat users based on current filters
  const filteredChatUsers = useMemo(() => {
    return chatUsers.filter(user => {
      if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      if (isAIMode) {
        if (filters.priority !== 'all') {
          if (filters.priority === 'critical' && user.aiCategory !== 'critical') return false;
          if (filters.priority === 'urgent' && user.aiCategory !== 'important') return false;
          if (filters.priority === 'routine' && user.aiCategory !== 'routine') return false;
        }
        
        if (filters.status !== 'all') {
          if (filters.status === 'unread' && user.unreadCount === 0) return false;
          if (filters.status === 'pending' && user.unreadCount === 0) return false;
        }
      }
      
      return true;
    });
  }, [chatUsers, searchTerm, isAIMode, filters]);

  // Toggle AI mode
  const toggleAIMode = () => {
    setIsAIMode(!isAIMode);
  };

  // Handle user selection
  const handleUserSelect = (user: ChatUser) => {
    setSelectedUser(user);
    // In real implementation, would load messages for this user
    setMessages(mockMessages);
  };

  // Handle send message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: "current-user",
      senderName: "You",
      senderAvatar: "assets/img/users/user-01.jpg",
      message: newMessage,
      timestamp: new Date(),
      isOwn: true,
      type: 'text'
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  // Handle AI suggested actions
  const handleAIAction = (action: string, messageId: string) => {
    console.log(`Executing AI action: ${action} for message: ${messageId}`);
    // Implement AI action logic here
  };

  // Get priority color
  const getPriorityColor = (category?: string) => {
    switch (category) {
      case 'critical': return 'danger';
      case 'important': return 'warning';
      case 'routine': return 'info';
      case 'informational': return 'secondary';
      default: return 'secondary';
    }
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
        <span className="ms-3">Loading chat system...</span>
      </div>
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
          {/* Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3">
            <div className="flex-grow-1">
              <div className="d-flex align-items-center gap-3">
                <h4 className="fs-18 fw-semibold mb-0">
                  {isAIMode ? 'AI-Enhanced Chat' : 'Chat'}
                </h4>
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted fs-14">AI Mode</span>
                  <Switch
                    checked={isAIMode}
                    onChange={toggleAIMode}
                    checkedChildren={<i className="ti ti-robot" />}
                    unCheckedChildren={<i className="ti ti-message" />}
                    size="default"
                  />
                  {isAIMode && (
                    <Tooltip title="AI-powered message prioritization and suggested actions">
                      <i className="ti ti-info-circle text-primary"></i>
                    </Tooltip>
                  )}
                </div>
              </div>
              {isAIMode && (
                <p className="mb-0 text-muted fs-12">
                  Intelligent message prioritization with automated triage and suggested actions
                </p>
              )}
            </div>
            <div className="text-end">
              <ol className="breadcrumb m-0 py-0">
                <li className="breadcrumb-item">
                  <Link to={all_routes.dashboard}>Home</Link>
                </li>
                <li className="breadcrumb-item">
                  <Link to="#">Applications</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Chat
                </li>
              </ol>
            </div>
          </div>
          {/* End Page Header */}

          {/* AI Metrics Dashboard - Only shown in AI mode */}
          {isAIMode && (
            <div className="ai-metrics-dashboard mb-4">
              <div className="row g-3">
                <div className="col-xl-3 col-lg-6 col-md-6">
                  <Card className="text-center border-0 shadow-sm">
                    <Statistic
                      title="Active Chats"
                      value={triageMetrics.totalChats}
                      prefix={<i className="ti ti-messages text-primary me-1" />}
                    />
                    <small className="text-muted">Total conversations</small>
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
                    <small className="text-muted">High priority chats</small>
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
                    <small className="text-muted">Triage precision</small>
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
                <div className="row g-3 align-items-end">
                  <div className="col-md-3">
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
                    </select>
                  </div>
                  <div className="col-md-3">
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
                  <div className="col-md-3">
                    <label className="form-label fw-medium">Status</label>
                    <select 
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                    >
                      <option value="all">All Status</option>
                      <option value="unread">Unread Only</option>
                      <option value="pending">Pending Action</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <button 
                      className="btn btn-outline-secondary w-100"
                      onClick={() => setFilters(prev => ({ ...prev, priority: 'all', status: 'all', timeFrame: 'today' }))}
                    >
                      <i className="ti ti-refresh me-1"></i>
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card shadow-none mb-0">
            <div className="card-body p-0">
              <div className="d-md-flex">
                <div className="chat-user-nav">
                  <div>
                    <div className="d-flex align-items-center justify-content-between border-bottom p-3">
                      <div className="d-flex align-items-center">
                        <span className="avatar me-2 flex-shrink-0">
                          <ImageWithBasePath src="assets/img/users/user-01.jpg" alt="user" />
                        </span>
                        <div>
                          <h6 className="fs-14 mb-1">James Hong</h6>
                          <p className="mb-0">Admin</p>
                        </div>
                      </div>
                      <Link
                        to="#"
                        className="btn p-2 btn-primary"
                        data-bs-toggle="tooltip"
                        data-bs-placement="top"
                        data-bs-title="New Chat"
                      >
                        <i className="ti ti-plus" />
                      </Link>
                    </div>
                    <div>
                      <div className="input-group w-auto input-group-flat p-4 pb-0">
                        <span className="input-group-text border-end-0">
                          <i className="ti ti-search" />
                        </span>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search Keyword"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      
                      <OverlayScrollbarsComponent
                        style={{ maxHeight: "calc(100vh - 18rem)" }}
                        className="chat-users p-4"
                      >
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6 className="mb-0">
                            {isAIMode ? 'AI Triaged Messages' : 'All Messages'}
                          </h6>
                          {isAIMode && (
                            <Badge count={triageMetrics.pendingAction} size="small" />
                          )}
                        </div>
                        
                        {filteredChatUsers.map((user) => (
                          <div 
                            key={user.id}
                            className={`d-flex align-items-center justify-content-between rounded p-3 user-list mb-1 ${selectedUser?.id === user.id ? 'active' : ''}`}
                            onClick={() => handleUserSelect(user)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className="d-flex align-items-center">
                              <div className="position-relative me-2 flex-shrink-0">
                                <Link to="#" className="avatar">
                                  <ImageWithBasePath src={user.avatar} alt="user" />
                                </Link>
                                {user.isOnline && (
                                  <span className="position-absolute bottom-0 end-0 p-1 bg-success border border-white rounded-circle">
                                    <span className="visually-hidden">Online</span>
                                  </span>
                                )}
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <h6 className="fs-14 mb-0">
                                    <Link to="#" className="text-decoration-none">{user.name}</Link>
                                  </h6>
                                  {isAIMode && user.aiPriority && (
                                    <Badge 
                                      count={user.aiPriority} 
                                      color={getPriorityColor(user.aiCategory)} 
                                      size="small"
                                    />
                                  )}
                                </div>
                                <p className="mb-0 text-truncate">
                                  {user.lastMessage}
                                </p>
                                {isAIMode && user.aiCategory && (
                                  <div className="mt-1">
                                    <span className={`badge bg-${getPriorityColor(user.aiCategory)}-transparent text-${getPriorityColor(user.aiCategory)} fs-10`}>
                                      {user.aiCategory}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-end">
                              <span className="text-dark d-block mb-1 fs-12">
                                {formatTimeAgo(user.timestamp)}
                              </span>
                              {user.unreadCount > 0 && (
                                <span className="badge bg-danger rounded-circle message-count">
                                  {user.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                        
                        {filteredChatUsers.length === 0 && (
                          <div className="text-center py-4">
                            <Empty
                              description="No chats match your filters"
                              image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                          </div>
                        )}
                      </OverlayScrollbarsComponent>
                    </div>
                  </div>
                  {/* end card body */}
                </div>
                <div className="flex-fill chat-messages">
                  {selectedUser ? (
                    <div className="card border-0 mb-0">
                      <div className="card-header d-flex align-items-center justify-content-between flex-wrap row-gap-3 p-3">
                        <div className="d-flex align-items-center">
                          <span className="avatar me-2 flex-shrink-0">
                            <ImageWithBasePath src={selectedUser.avatar} alt="user" />
                          </span>
                          <div>
                            <h6 className="fs-14 fw-semibold mb-1">{selectedUser.name}</h6>
                            <p className="mb-0 d-inline-flex align-items-center">
                              <i className={`ti ti-point-filled ${selectedUser.isOnline ? 'text-success' : 'text-muted'}`} />
                              {selectedUser.isOnline ? 'Online' : 'Offline'}
                              {isAIMode && selectedUser.aiCategory && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className={`text-${getPriorityColor(selectedUser.aiCategory)} fw-medium`}>
                                    {selectedUser.aiCategory}
                                  </span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="gap-2 d-flex align-items-center flex-wrap">
                          <Link
                            to="#"
                            className="btn btn-icon btn-light"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            data-bs-title="Voice Call"
                          >
                            <i className="ti ti-phone" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-light"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            data-bs-title="Video Call"
                          >
                            <i className="ti ti-video" />
                          </Link>
                          <Link
                            to="#"
                            className="btn btn-icon btn-light"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            data-bs-title="Info"
                          >
                            <i className="ti ti-info-circle" />
                          </Link>
                          {isAIMode && (
                            <Link
                              to="#"
                              className="btn btn-icon btn-light"
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                              data-bs-title="AI Insights"
                            >
                              <i className="ti ti-robot" />
                            </Link>
                          )}
                          <Link
                            to="#"
                            className="btn btn-icon btn-light close-chat d-md-none"
                          >
                            <i className="ti ti-x" />
                          </Link>
                        </div>
                      </div>
                      <div className="card-body p-0">
                        <OverlayScrollbarsComponent 
                          style={{ maxHeight: "calc(100vh - 18.5rem)" }} 
                          className="message-body p-4"
                        >
                          {messages.map((message) => (
                            <div key={message.id} className={`chat-list mb-3 ${message.isOwn ? 'ms-auto' : ''}`}>
                              <div className={`d-flex align-items-start ${message.isOwn ? 'justify-content-end' : ''}`}>
                                {!message.isOwn && (
                                  <span className="avatar online me-2 flex-shrink-0">
                                    <ImageWithBasePath src={message.senderAvatar} alt="user" />
                                  </span>
                                )}
                                
                                <div className={message.isOwn ? 'text-end' : ''}>
                                  <div className={`d-flex align-items-center mb-1 ${message.isOwn ? 'justify-content-end' : ''}`}>
                                    {message.isOwn && (
                                      <p className="mb-0 d-inline-flex align-items-center">
                                        <i className="ti ti-checks text-success me-1" />
                                        {formatTimeAgo(message.timestamp)}
                                        <i className="ti ti-point-filled mx-2" />
                                      </p>
                                    )}
                                    <h6 className="fs-14 fw-semibold mb-0">{message.senderName}</h6>
                                    {!message.isOwn && (
                                      <p className="mb-0 d-inline-flex align-items-center">
                                        <i className="ti ti-point-filled mx-2" />
                                        {formatTimeAgo(message.timestamp)}
                                      </p>
                                    )}
                                  </div>
                                  
                                  <div className={`d-flex align-items-center ${message.isOwn ? 'flex-row-reverse' : ''}`}>
                                    <div className={`message-box ${message.isOwn ? 'sent-message ms-2' : 'receive-message me-2'} p-3`}>
                                      <p className="mb-0 fs-16">{message.message}</p>
                                      
                                      {/* AI Enhanced Features */}
                                      {isAIMode && message.aiEnhanced && (
                                        <div className="ai-enhancements mt-3">
                                          {/* AI Flags */}
                                          {message.aiEnhanced.flags && (
                                            <div className="ai-flags mb-2">
                                              <AIVisualFlags 
                                                notification={{
                                                  id: message.id,
                                                  title: `Message from ${message.senderName}`,
                                                  message: message.message,
                                                  timestamp: message.timestamp,
                                                  isRead: true,
                                                  type: 'medical',
                                                  sender: message.senderName,
                                                  avatar: message.senderAvatar,
                                                  aiPriority: message.aiEnhanced.priority,
                                                  aiCategory: message.aiEnhanced.category,
                                                  confidence: message.aiEnhanced.confidence,
                                                  suggestedActions: message.aiEnhanced.suggestedActions,
                                                  metadata: message.aiEnhanced.metadata
                                                }}
                                                size="small"
                                                compact={true}
                                              />
                                            </div>
                                          )}
                                          
                                          {/* AI Suggested Actions */}
                                          {message.aiEnhanced.suggestedActions && (
                                            <div className="ai-actions">
                                              <div className="d-flex align-items-center gap-2 mb-2">
                                                <i className="ti ti-robot text-primary fs-12"></i>
                                                <span className="fs-11 text-muted fw-medium">AI Suggestions:</span>
                                              </div>
                                              <div className="d-flex gap-1 flex-wrap">
                                                {message.aiEnhanced.suggestedActions.map((action, index) => (
                                                  <button
                                                    key={`${message.id}-action-${action.action}-${index}`}
                                                    className={`btn btn-${action.type} btn-sm fs-11`}
                                                    onClick={() => handleAIAction(action.action, message.id)}
                                                  >
                                                    {action.label}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* AI Metadata */}
                                          {message.aiEnhanced.metadata && (
                                            <div className="ai-metadata mt-2">
                                              <div className="d-flex gap-1 flex-wrap">
                                                {Object.entries(message.aiEnhanced.metadata).map(([key, value]) => (
                                                  <span key={key} className="badge bg-info-transparent text-info fs-10">
                                                    {key}: {String(value)}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* AI Confidence */}
                                          <div className="ai-confidence mt-2">
                                            <small className="text-muted fs-10">
                                              AI Confidence: {Math.round(message.aiEnhanced.confidence * 100)}%
                                            </small>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className={message.isOwn ? 'me-2' : 'ms-2'}>
                                      <Link to="#" data-bs-toggle="dropdown">
                                        <i className="ti ti-dots-vertical" />
                                      </Link>
                                      <ul className="dropdown-menu p-2">
                                        <li><Link className="dropdown-item" to="#">Reply</Link></li>
                                        <li><Link className="dropdown-item" to="#">Forward</Link></li>
                                        <li><Link className="dropdown-item" to="#">Copy</Link></li>
                                        <li><Link className="dropdown-item" to="#">Mark as Favourite</Link></li>
                                        {isAIMode && (
                                          <>
                                            <li><hr className="dropdown-divider" /></li>
                                            <li><Link className="dropdown-item" to="#">AI Analysis</Link></li>
                                            <li><Link className="dropdown-item" to="#">Override AI</Link></li>
                                          </>
                                        )}
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><Link className="dropdown-item text-danger" to="#">Delete</Link></li>
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                                
                                {message.isOwn && (
                                  <span className="avatar ms-2 online flex-shrink-0">
                                    <ImageWithBasePath src={message.senderAvatar} alt="user" />
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </OverlayScrollbarsComponent>
                        
                        <div className="message-footer d-flex align-items-center border-top p-3">
                          <div className="flex-fill">
                            <input
                              type="text"
                              className="form-control border-0"
                              placeholder="Type Something..."
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            />
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <Link
                              to="#"
                              className="btn btn-icon btn-light"
                            >
                              <i className="ti ti-photo-plus" />
                            </Link>
                            <Link
                              to="#"
                              className="btn btn-icon btn-light"
                            >
                              <i className="ti ti-mood-smile-beam" />
                            </Link>
                            {isAIMode && (
                              <Tooltip title="AI-powered smart compose">
                                <Link to="#" className="btn btn-icon btn-light">
                                  <i className="ti ti-robot" />
                                </Link>
                              </Tooltip>
                            )}
                            <button 
                              className="btn btn-primary"
                              onClick={handleSendMessage}
                              disabled={!newMessage.trim()}
                            >
                              <i className="ti ti-send" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <div className="text-center">
                        <i className="ti ti-message-circle-2 fs-64 text-muted mb-3"></i>
                        <h5 className="text-muted">Select a conversation to start chatting</h5>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* end card body */}
          </div>
          {/* end card */}
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
    </>
  );
};

export default Chat;
