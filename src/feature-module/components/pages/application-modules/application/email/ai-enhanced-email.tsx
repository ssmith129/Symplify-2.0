import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import ImageWithBasePath from "../../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../../routes/all_routes";

interface EmailMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: Date;
  isRead: boolean;
  avatar?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: 'medical' | 'administrative' | 'patient-communication' | 'emergency' | 'system';
  aiClassification: {
    confidence: number;
    urgency: number; // 1-5 scale
    actionRequired: boolean;
    estimatedResponseTime: string;
    tags: string[];
    department?: string;
    patientRelated?: boolean;
  };
  attachments?: number;
  encryption?: boolean;
  complianceLevel?: 'hipaa' | 'standard' | 'confidential';
}

interface AIEmailFilters {
  priority: 'all' | 'critical' | 'high' | 'medium' | 'low';
  category: 'all' | 'medical' | 'administrative' | 'patient-communication' | 'emergency' | 'system';
  aiConfidence: number;
  timeRange: 'today' | 'week' | 'month';
  department: 'all' | 'cardiology' | 'emergency' | 'surgery' | 'administration';
  complianceOnly: boolean;
}

const AIEnhancedEmail = () => {
  const [showMore, setShowMore] = useState(false);
  const [showMore2, setShowMore2] = useState(false);
  const [showMore3, setShowMore3] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [filters, setFilters] = useState<AIEmailFilters>({
    priority: 'all',
    category: 'all',
    aiConfidence: 0.7,
    timeRange: 'today',
    department: 'all',
    complianceOnly: false
  });
  const [aiInsights, setAiInsights] = useState({
    totalProcessed: 0,
    criticalCount: 0,
    avgResponseTime: '2.4h',
    complianceRate: 98.5,
    actionRequiredCount: 0
  });

  // Mock AI-enhanced email data
  const mockEmails: EmailMessage[] = [
    {
      id: "email-1",
      from: "Dr. Sarah Chen",
      subject: "URGENT: Patient Cardiac Emergency - Room 302",
      preview: "Code Blue activated. Patient shows severe bradycardia and hypotension. Immediate consultation required for emergency intervention...",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/doctors/doctor-02.jpg",
      priority: 'critical',
      category: 'emergency',
      aiClassification: {
        confidence: 0.98,
        urgency: 5,
        actionRequired: true,
        estimatedResponseTime: "Immediate (< 5 minutes)",
        tags: ["emergency", "cardiology", "patient-care", "code-blue"],
        department: "emergency",
        patientRelated: true
      },
      attachments: 2,
      encryption: true,
      complianceLevel: 'hipaa'
    },
    {
      id: "email-2",
      from: "Lab Department",
      subject: "Critical Lab Results - Patient Martinez, Elena",
      preview: "Blood work results show critically abnormal values requiring immediate physician review. Hemoglobin: 4.2 g/dL (Normal: 12-15.5)...",
      timestamp: new Date(Date.now() - 12 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/icons/lab-icon.svg",
      priority: 'critical',
      category: 'medical',
      aiClassification: {
        confidence: 0.95,
        urgency: 5,
        actionRequired: true,
        estimatedResponseTime: "Within 30 minutes",
        tags: ["lab-results", "critical-values", "anemia", "patient-care"],
        department: "laboratory",
        patientRelated: true
      },
      attachments: 1,
      encryption: true,
      complianceLevel: 'hipaa'
    },
    {
      id: "email-3",
      from: "Insurance Verification",
      subject: "Pre-authorization Approved - Procedure #INS-2024-0847",
      preview: "MRI scan pre-authorization has been approved for patient. Procedure can proceed as scheduled for next Tuesday at 2:00 PM...",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/icons/insurance-icon.svg",
      priority: 'medium',
      category: 'administrative',
      aiClassification: {
        confidence: 0.89,
        urgency: 3,
        actionRequired: true,
        estimatedResponseTime: "Within 4 hours",
        tags: ["insurance", "pre-authorization", "scheduling", "radiology"],
        department: "administration",
        patientRelated: true
      },
      complianceLevel: 'standard'
    },
    {
      id: "email-4",
      from: "Patient Portal System",
      subject: "New Patient Message - Appointment Rescheduling Request",
      preview: "Sarah Johnson has requested to reschedule her cardiology appointment due to family emergency. Current appointment: March 15, 2:30 PM...",
      timestamp: new Date(Date.now() - 35 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/profiles/avatar-14.jpg",
      priority: 'medium',
      category: 'patient-communication',
      aiClassification: {
        confidence: 0.87,
        urgency: 3,
        actionRequired: true,
        estimatedResponseTime: "Within 2 hours",
        tags: ["appointment", "rescheduling", "patient-request", "cardiology"],
        department: "cardiology",
        patientRelated: true
      },
      complianceLevel: 'hipaa'
    },
    {
      id: "email-5",
      from: "Pharmacy Department",
      subject: "Medication Stock Alert - Critical Shortage",
      preview: "Critical shortage detected for essential medications: Epinephrine (2 units), Morphine (5 units). Emergency reorder initiated...",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      isRead: true,
      avatar: "assets/img/icons/pharmacy-icon.svg",
      priority: 'high',
      category: 'system',
      aiClassification: {
        confidence: 0.94,
        urgency: 4,
        actionRequired: false,
        estimatedResponseTime: "Within 1 hour",
        tags: ["medication", "shortage", "supply-chain", "pharmacy"],
        department: "pharmacy",
        patientRelated: false
      },
      complianceLevel: 'standard'
    },
    {
      id: "email-6",
      from: "Quality Assurance",
      subject: "Monthly Compliance Report - March 2024",
      preview: "HIPAA compliance audit results for March. Overall score: 98.5%. Minor violations identified in documentation procedures...",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: true,
      avatar: "assets/img/icons/compliance-icon.svg",
      priority: 'low',
      category: 'administrative',
      aiClassification: {
        confidence: 0.82,
        urgency: 2,
        actionRequired: false,
        estimatedResponseTime: "Within 1 day",
        tags: ["compliance", "hipaa", "audit", "quality-assurance"],
        department: "administration",
        patientRelated: false
      },
      complianceLevel: 'confidential'
    }
  ];

  useEffect(() => {
    setEmails(mockEmails);
    // Calculate AI insights
    setAiInsights({
      totalProcessed: mockEmails.length,
      criticalCount: mockEmails.filter(e => e.priority === 'critical').length,
      avgResponseTime: '2.4h',
      complianceRate: 98.5,
      actionRequiredCount: mockEmails.filter(e => e.aiClassification.actionRequired && !e.isRead).length
    });
  }, []);

  // Filter emails based on AI criteria
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      if (filters.priority !== 'all' && email.priority !== filters.priority) return false;
      if (filters.category !== 'all' && email.category !== filters.category) return false;
      if (email.aiClassification.confidence < filters.aiConfidence) return false;
      if (filters.complianceOnly && email.complianceLevel !== 'hipaa') return false;
      
      return true;
    }).sort((a, b) => {
      // Sort by urgency first, then by timestamp
      if (a.aiClassification.urgency !== b.aiClassification.urgency) {
        return b.aiClassification.urgency - a.aiClassification.urgency;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [emails, filters]);

  const handleToggle = () => setShowMore(prev => !prev);
  const handleToggle2 = () => setShowMore2(prev => !prev);
  const handleToggle3 = () => setShowMore3(prev => !prev);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medical': return 'ti ti-stethoscope';
      case 'emergency': return 'ti ti-emergency-bed';
      case 'administrative': return 'ti ti-file-text';
      case 'patient-communication': return 'ti ti-message-circle';
      case 'system': return 'ti ti-settings';
      default: return 'ti ti-mail';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleBulkAction = (action: string) => {
    const selectedIds = Array.from(selectedEmails);
    console.log(`Performing ${action} on`, selectedIds);
    setSelectedEmails(new Set());
  };

  return (
    <>
      {/* Page Content */}
      <div className="page-wrapper">
        {/* Container */}
        <div className="content content-two p-0">
          <div className="d-md-flex">
            {/* Enhanced Email Sidebar */}
            <div className="email-sidebar border-end border-bottom">
              <div className="slimScrollDiv">
                <div className="active slimscroll">
                  <div className="slimscroll-active-sidebar">
                    <div className="p-3">
                      {/* AI Triage Header */}
                      <div className="ai-triage-header bg-primary-transparent rounded p-3 mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center">
                            <i className="ti ti-robot text-primary fs-20 me-2"></i>
                            <h6 className="mb-0 fw-bold text-primary">AI Email Triage</h6>
                          </div>
                          <span className="badge bg-success rounded-pill fs-10">Active</span>
                        </div>
                        <div className="row g-2 text-center">
                          <div className="col-6">
                            <div className="ai-metric">
                              <h6 className="mb-0 fw-bold text-danger">{aiInsights.criticalCount}</h6>
                              <small className="text-muted">Critical</small>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="ai-metric">
                              <h6 className="mb-0 fw-bold text-warning">{aiInsights.actionRequiredCount}</h6>
                              <small className="text-muted">Action Needed</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* User Profile */}
                      <div className="border bg-white rounded p-2 mb-3">
                        <div className="d-flex align-items-center">
                          <Link to="#" className="avatar avatar-md flex-shrink-0 me-2">
                            <ImageWithBasePath
                              src="assets/img/profiles/avatar-02.jpg"
                              className="rounded-circle"
                              alt="Admin"
                            />
                          </Link>
                          <div>
                            <h6 className="mb-1 fs-16 fw-medium">
                              <Link to="#">James Hong</Link>
                            </h6>
                            <p className="fs-14">Admin • Jnh343@example.com</p>
                          </div>
                        </div>
                      </div>

                      {/* Compose Button */}
                      <Link
                        to="#"
                        className="btn btn-primary w-100 mb-3"
                        data-bs-toggle="modal"
                        data-bs-target="#email-view"
                      >
                        <i className="ti ti-edit me-2" />
                        Compose
                      </Link>

                      {/* AI-Enhanced Folders */}
                      <div className="mt-4">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h5 className="mb-0">AI-Sorted Emails</h5>
                          <Link to="#" className="text-primary fs-12">
                            <i className="ti ti-settings"></i>
                          </Link>
                        </div>
                        <div className="d-block mb-3 pb-3 border-bottom email-tags">
                          <Link
                            to={all_routes.email}
                            className="d-flex bg-light align-items-center justify-content-between p-2 rounded active"
                          >
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-robot text-primary me-2" />
                              AI Triage Inbox
                            </span>
                            <span className="badge badge-danger bg-danger rounded-pill badge-xs">
                              {filteredEmails.filter(e => !e.isRead).length}
                            </span>
                          </Link>
                          
                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-alert-triangle text-danger me-2" />
                              Critical Priority
                            </span>
                            <span className="badge bg-danger-transparent text-danger rounded-pill">
                              {emails.filter(e => e.priority === 'critical').length}
                            </span>
                          </Link>

                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-stethoscope text-primary me-2" />
                              Medical
                            </span>
                            <span className="fw-semibold fs-12 rounded-pill">
                              {emails.filter(e => e.category === 'medical').length}
                            </span>
                          </Link>

                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-emergency-bed text-warning me-2" />
                              Emergency
                            </span>
                            <span className="rounded-pill">
                              {emails.filter(e => e.category === 'emergency').length}
                            </span>
                          </Link>

                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-shield-check text-success me-2" />
                              HIPAA Compliant
                            </span>
                            <span className="rounded-pill">
                              {emails.filter(e => e.complianceLevel === 'hipaa').length}
                            </span>
                          </Link>

                          {/* Regular email folders */}
                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-star text-gray me-2" />
                              Starred
                            </span>
                            <span className="fw-semibold fs-12 rounded-pill">46</span>
                          </Link>

                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-rocket text-gray me-2" />
                              Sent
                            </span>
                            <span className="rounded-pill">14</span>
                          </Link>

                          <div>
                            <div className="more-menu" style={{ display: showMore ? 'block' : 'none', marginTop: '10px' }}>
                              <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                                <span className="d-flex align-items-center fw-medium">
                                  <i className="ti ti-file text-gray me-2" />
                                  Drafts
                                </span>
                                <span className="rounded-pill">12</span>
                              </Link>
                              <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                                <span className="d-flex align-items-center fw-medium">
                                  <i className="ti ti-trash text-gray me-2" />
                                  Deleted
                                </span>
                                <span className="rounded-pill">08</span>
                              </Link>
                            </div>
                            <div className="view-all mt-2">
                              <Link to="#" className="viewall-button fw-medium" onClick={handleToggle}>
                                <span>{showMore ? 'Less' : 'Show More'}</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* AI Labels */}
                      <div className="border-bottom mb-3 pb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h5>AI Labels</h5>
                          <Link to="#">
                            <i className="ti ti-square-rounded-plus-filled text-primary fs-16" />
                          </Link>
                        </div>
                        <div>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-square-rounded text-danger me-2" />
                            Patient Critical
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-square-rounded text-warning me-2" />
                            Action Required
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-square-rounded text-success me-2" />
                            Compliance
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-square-rounded text-skyblue me-2" />
                            Emergency
                          </Link>
                        </div>
                      </div>

                      {/* Departments */}
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h5>Departments</h5>
                        </div>
                        <div>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-folder-filled text-danger me-2" />
                            Emergency
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-folder-filled text-warning me-2" />
                            Surgery
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-folder-filled text-success me-2" />
                            Administration
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Email List */}
            <div className="bg-white flex-fill border-end border-bottom mail-notifications">
              <div className="slimScrollDiv">
                <div className="active slimscroll">
                  <div className="slimscroll-active-sidebar">
                    {/* Enhanced Header */}
                    <div className="p-3 border-bottom">
                      <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
                        <div>
                          <h5 className="mb-1 d-flex align-items-center">
                            <i className="ti ti-robot text-primary me-2"></i>
                            AI-Enhanced Inbox
                          </h5>
                          <div className="d-flex align-items-center">
                            <span>{filteredEmails.length} Emails</span>
                            <i className="ti ti-point-filled text-primary mx-1" />
                            <span>{filteredEmails.filter(e => !e.isRead).length} Unread</span>
                            <i className="ti ti-point-filled text-primary mx-1" />
                            <span className="text-success">{Math.round(aiInsights.complianceRate)}% Compliant</span>
                          </div>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative input-icon">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="AI Smart Search..."
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-search" />
                            </span>
                          </div>
                          <div className="dropdown">
                            <button className="btn btn-outline-primary btn-sm" data-bs-toggle="dropdown">
                              <i className="ti ti-filter me-1"></i>
                              AI Filters
                            </button>
                            <div className="dropdown-menu dropdown-menu-end p-3" style={{ minWidth: '300px' }}>
                              <h6 className="mb-3">AI Filtering Options</h6>
                              
                              <div className="mb-3">
                                <label className="form-label">Priority Level</label>
                                <select 
                                  className="form-select form-select-sm"
                                  value={filters.priority}
                                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                                >
                                  <option value="all">All Priorities</option>
                                  <option value="critical">Critical Only</option>
                                  <option value="high">High Priority</option>
                                  <option value="medium">Medium Priority</option>
                                  <option value="low">Low Priority</option>
                                </select>
                              </div>

                              <div className="mb-3">
                                <label className="form-label">Category</label>
                                <select 
                                  className="form-select form-select-sm"
                                  value={filters.category}
                                  onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
                                >
                                  <option value="all">All Categories</option>
                                  <option value="medical">Medical</option>
                                  <option value="emergency">Emergency</option>
                                  <option value="administrative">Administrative</option>
                                  <option value="patient-communication">Patient Communication</option>
                                  <option value="system">System</option>
                                </select>
                              </div>

                              <div className="mb-3">
                                <label className="form-label">AI Confidence</label>
                                <input 
                                  type="range" 
                                  className="form-range" 
                                  min="0" 
                                  max="1" 
                                  step="0.1"
                                  value={filters.aiConfidence}
                                  onChange={(e) => setFilters(prev => ({ ...prev, aiConfidence: parseFloat(e.target.value) }))}
                                />
                                <small className="text-muted">Minimum: {Math.round(filters.aiConfidence * 100)}%</small>
                              </div>

                              <div className="form-check">
                                <input 
                                  className="form-check-input" 
                                  type="checkbox" 
                                  checked={filters.complianceOnly}
                                  onChange={(e) => setFilters(prev => ({ ...prev, complianceOnly: e.target.checked }))}
                                />
                                <label className="form-check-label">
                                  HIPAA Compliant Only
                                </label>
                              </div>
                            </div>
                          </div>
                          {selectedEmails.size > 0 && (
                            <div className="btn-group">
                              <button className="btn btn-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                                Actions ({selectedEmails.size})
                              </button>
                              <ul className="dropdown-menu">
                                <li><button className="dropdown-item" onClick={() => handleBulkAction('mark-read')}>Mark as Read</button></li>
                                <li><button className="dropdown-item" onClick={() => handleBulkAction('priority')}>Change Priority</button></li>
                                <li><button className="dropdown-item" onClick={() => handleBulkAction('forward')}>Forward to Team</button></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><button className="dropdown-item" onClick={() => handleBulkAction('archive')}>Archive Selected</button></li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Insights Bar */}
                      <div className="ai-insights-bar bg-light rounded p-2">
                        <div className="row g-2 text-center">
                          <div className="col-3">
                            <small className="text-muted d-block">Avg Response</small>
                            <span className="fw-bold text-info">{aiInsights.avgResponseTime}</span>
                          </div>
                          <div className="col-3">
                            <small className="text-muted d-block">Compliance</small>
                            <span className="fw-bold text-success">{aiInsights.complianceRate}%</span>
                          </div>
                          <div className="col-3">
                            <small className="text-muted d-block">Processed</small>
                            <span className="fw-bold text-primary">{aiInsights.totalProcessed}</span>
                          </div>
                          <div className="col-3">
                            <small className="text-muted d-block">AI Active</small>
                            <span className="fw-bold text-success">
                              <i className="ti ti-check-circle"></i>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Email List */}
                    <div className="list-group list-group-flush mails-list">
                      {filteredEmails.map((email) => (
                        <div key={email.id} className={`list-group-item border-bottom p-3 ${!email.isRead ? 'bg-soft-primary' : ''}`}>
                          <div className="d-flex align-items-center mb-2">
                            <div className="form-check form-check-md d-flex align-items-center flex-shrink-0 me-2">
                              <input 
                                className="form-check-input" 
                                type="checkbox"
                                checked={selectedEmails.has(email.id)}
                                onChange={(e) => {
                                  const newSet = new Set(selectedEmails);
                                  if (e.target.checked) {
                                    newSet.add(email.id);
                                  } else {
                                    newSet.delete(email.id);
                                  }
                                  setSelectedEmails(newSet);
                                }}
                              />
                            </div>
                            <div className="d-flex align-items-center flex-wrap row-gap-2 flex-fill">
                              <Link
                                to={all_routes.EmailReply}
                                className="avatar avatar-md avatar-rounded me-2 position-relative"
                              >
                                {email.avatar ? (
                                  <ImageWithBasePath src={email.avatar} alt="Avatar" />
                                ) : (
                                  <span className="avatar-title bg-primary">{email.from.slice(0, 2).toUpperCase()}</span>
                                )}
                                {/* Priority indicator */}
                                <span 
                                  className={`position-absolute top-0 start-100 translate-middle badge bg-${getPriorityColor(email.priority)} rounded-pill`}
                                  style={{ fontSize: '8px', padding: '2px 4px' }}
                                >
                                  {email.aiClassification.urgency}
                                </span>
                              </Link>
                              <div className="flex-fill">
                                <div className="d-flex align-items-start justify-content-between">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                      <h6 className="mb-0">
                                        <Link to={all_routes.EmailReply}>{email.from}</Link>
                                      </h6>
                                      
                                      {/* AI Classification Badges */}
                                      <span className={`badge bg-${getPriorityColor(email.priority)}-transparent text-${getPriorityColor(email.priority)} text-uppercase fs-10`}>
                                        {email.priority}
                                      </span>
                                      
                                      <span className="badge bg-light text-dark fs-10">
                                        <i className={`${getCategoryIcon(email.category)} me-1`}></i>
                                        {email.category.replace('-', ' ')}
                                      </span>
                                      
                                      {email.encryption && (
                                        <span className="badge bg-success-transparent text-success fs-10">
                                          <i className="ti ti-shield-lock me-1"></i>
                                          Encrypted
                                        </span>
                                      )}
                                      
                                      {email.aiClassification.actionRequired && (
                                        <span className="badge bg-warning-transparent text-warning fs-10">
                                          <i className="ti ti-clock me-1"></i>
                                          Action Required
                                        </span>
                                      )}
                                      
                                      {!email.isRead && (
                                        <span className="badge bg-primary">New</span>
                                      )}
                                    </div>
                                    <span className="fw-semibold">{email.subject}</span>
                                  </div>
                                  <div className="d-flex align-items-center">
                                    <div className="dropdown me-2">
                                      <button
                                        className="btn btn-icon btn-sm rounded-circle"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                      >
                                        <i className="ti ti-dots" />
                                      </button>
                                      <ul className="dropdown-menu dropdown-menu-end p-3">
                                        <li><Link className="dropdown-item rounded-1" to={all_routes.EmailReply}>Open Email</Link></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Reply</Link></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Forward</Link></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Override AI Priority</Link></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Add to Training</Link></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Archive</Link></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Delete</Link></li>
                                      </ul>
                                    </div>
                                    <span className="text-muted fs-12">
                                      <i className={`ti ti-point-filled text-${getPriorityColor(email.priority)}`} />
                                      {formatTimeAgo(email.timestamp)}
                                    </span>
                                  </div>
                                </div>
                                <p className="mb-1 text-muted fs-14">{email.preview}</p>
                                
                                {/* AI Insights */}
                                <div className="ai-email-insights mt-2">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                      {email.attachments && (
                                        <span className="d-flex align-items-center btn btn-sm bg-transparent-dark">
                                          <i className="ti ti-paperclip me-1" />
                                          {email.attachments}
                                        </span>
                                      )}
                                      {email.aiClassification.patientRelated && (
                                        <span className="badge bg-info-transparent text-info fs-10">
                                          <i className="ti ti-user me-1"></i>
                                          Patient Related
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="d-flex align-items-center gap-2">
                                      <small className="text-muted fs-10">
                                        AI Confidence: {Math.round(email.aiClassification.confidence * 100)}%
                                      </small>
                                      <small className="text-muted fs-10">
                                        Response: {email.aiClassification.estimatedResponseTime}
                                      </small>
                                      {email.complianceLevel && (
                                        <span className={`badge bg-${email.complianceLevel === 'hipaa' ? 'success' : 'secondary'}-transparent text-${email.complianceLevel === 'hipaa' ? 'success' : 'secondary'} fs-10`}>
                                          {email.complianceLevel.toUpperCase()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Tags */}
                                  {email.aiClassification.tags.length > 0 && (
                                    <div className="d-flex gap-1 mt-1 flex-wrap">
                                      {email.aiClassification.tags.slice(0, 3).map((tag, index) => (
                                        <span key={`${email.id}-tag-${tag}-${index}`} className="badge bg-light text-dark fs-10">
                                          {tag}
                                        </span>
                                      ))}
                                      {email.aiClassification.tags.length > 3 && (
                                        <span className="badge bg-light text-muted fs-10">
                                          +{email.aiClassification.tags.length - 3} more
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AIEnhancedEmail;
