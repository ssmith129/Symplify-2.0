import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router';
import ImageWithBasePath from '../../../../../../core/imageWithBasePath';
import { Badge, Progress, Card, Timeline, Tabs, Alert, Rate, Tooltip, Modal } from 'antd';
import type { ProcessedNotification } from '../../../../../../core/services/ai-notification-service';

const { TabPane } = Tabs;

interface AIAnalysisDetails {
  confidence: number;
  processingTime: number;
  factorsConsidered: string[];
  alternativeCategories: Array<{
    category: string;
    confidence: number;
    reasoning: string;
  }>;
  keywordAnalysis: Array<{
    keyword: string;
    weight: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  sentimentAnalysis: {
    overall: 'positive' | 'negative' | 'neutral' | 'urgent';
    score: number;
    indicators: string[];
  };
  riskAssessment: {
    level: 'low' | 'medium' | 'high' | 'critical';
    factors: string[];
    recommendations: string[];
  };
}

interface MessageTimeline {
  timestamp: Date;
  action: string;
  actor: string;
  details: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface RelatedMessage {
  id: string;
  title: string;
  timestamp: Date;
  relevanceScore: number;
  reason: string;
}

const AIMessageDetailView: React.FC = () => {
  const { messageId } = useParams<{ messageId: string }>();
  const [message, setMessage] = useState<ProcessedNotification | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisDetails | null>(null);
  const [timeline, setTimeline] = useState<MessageTimeline[]>([]);
  const [relatedMessages, setRelatedMessages] = useState<RelatedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [showAIOverride, setShowAIOverride] = useState(false);
  const [userFeedback, setUserFeedback] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');

  // Mock detailed message data
  const mockDetailedMessage: ProcessedNotification = {
    id: messageId || "detailed-1",
    title: "Emergency Protocol Activation - ICU Room 302",
    message: "Code Blue activated in ICU Room 302. Patient John Doe (Age: 67, Bed 302-A) showing signs of cardiac arrest. Vital signs: HR 0, BP undetectable, O2 Sat 89%. Immediate resuscitation team required. Dr. Sarah Chen is the attending physician. Patient has history of coronary artery disease and diabetes. Emergency contact: Mary Doe (spouse) - 555-0123. Last medication administered: Metoprolol 25mg at 14:30. Current time: 15:45.",
    avatar: "assets/img/icons/emergency-icon.svg",
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    isRead: false,
    type: "urgent",
    sender: "Emergency Response System",
    aiPriority: 5,
    aiCategory: 'critical',
    confidence: 0.98,
    suggestedActions: [
      { label: 'Alert Code Team', action: 'emergency-alert', type: 'danger' },
      { label: 'Prepare Crash Cart', action: 'prep-equipment', type: 'warning' },
      { label: 'Contact Family', action: 'contact-family', type: 'primary' },
      { label: 'Document Event', action: 'document', type: 'secondary' }
    ],
    metadata: {
      patientId: 'P-JD-67-302',
      room: '302-A',
      attendingPhysician: 'Dr. Sarah Chen',
      emergencyContact: 'Mary Doe - 555-0123',
      medicalHistory: ['Coronary Artery Disease', 'Type 2 Diabetes'],
      lastVitals: { hr: 0, bp: 'undetectable', o2sat: 89 },
      urgencyLevel: 'immediate',
      department: 'ICU'
    }
  };

  const mockAiAnalysis: AIAnalysisDetails = {
    confidence: 0.98,
    processingTime: 0.3,
    factorsConsidered: [
      'Keyword urgency analysis',
      'Medical terminology detection',
      'Vital signs assessment',
      'Historical pattern matching',
      'Department context analysis',
      'Time sensitivity factors'
    ],
    alternativeCategories: [
      {
        category: 'important',
        confidence: 0.15,
        reasoning: 'Could be classified as important if not for critical vital signs'
      },
      {
        category: 'routine',
        confidence: 0.02,
        reasoning: 'Extremely low probability due to emergency keywords'
      }
    ],
    keywordAnalysis: [
      { keyword: 'Code Blue', weight: 0.95, impact: 'positive' },
      { keyword: 'cardiac arrest', weight: 0.90, impact: 'positive' },
      { keyword: 'HR 0', weight: 0.85, impact: 'positive' },
      { keyword: 'immediate', weight: 0.80, impact: 'positive' },
      { keyword: 'ICU', weight: 0.75, impact: 'positive' }
    ],
    sentimentAnalysis: {
      overall: 'urgent',
      score: 0.95,
      indicators: ['emergency keywords', 'critical vitals', 'immediate action required']
    },
    riskAssessment: {
      level: 'critical',
      factors: [
        'Patient life threatening condition',
        'Zero heart rate detected',
        'Immediate intervention required',
        'Multiple team coordination needed'
      ],
      recommendations: [
        'Activate emergency response protocol immediately',
        'Ensure all team members are notified',
        'Prepare for extended resuscitation efforts',
        'Document all actions for quality review'
      ]
    }
  };

  const mockTimeline: MessageTimeline[] = [
    {
      timestamp: new Date(Date.now() - 2 * 60 * 1000),
      action: 'Message Received',
      actor: 'Emergency System',
      details: 'Automated alert generated from ICU monitoring system',
      type: 'info'
    },
    {
      timestamp: new Date(Date.now() - 1.8 * 60 * 1000),
      action: 'AI Processing Complete',
      actor: 'AI Triage System',
      details: 'Classified as critical priority with 98% confidence',
      type: 'success'
    },
    {
      timestamp: new Date(Date.now() - 1.5 * 60 * 1000),
      action: 'Notification Dispatched',
      actor: 'Notification Service',
      details: 'Sent to 8 team members across 3 departments',
      type: 'info'
    },
    {
      timestamp: new Date(Date.now() - 1 * 60 * 1000),
      action: 'First Response',
      actor: 'Dr. Sarah Chen',
      details: 'Acknowledged alert and en route to room 302',
      type: 'success'
    },
    {
      timestamp: new Date(Date.now() - 0.5 * 60 * 1000),
      action: 'Team Assembly',
      actor: 'Code Team',
      details: '6 team members arrived at location',
      type: 'success'
    }
  ];

  const mockRelatedMessages: RelatedMessage[] = [
    {
      id: 'rel-1',
      title: 'Patient John Doe - Lab Results Critical',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      relevanceScore: 0.85,
      reason: 'Same patient, related to current emergency'
    },
    {
      id: 'rel-2',
      title: 'ICU Room 302 - Equipment Maintenance',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      relevanceScore: 0.72,
      reason: 'Same location, potential equipment issues'
    },
    {
      id: 'rel-3',
      title: 'Dr. Sarah Chen - Schedule Update',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      relevanceScore: 0.68,
      reason: 'Same attending physician'
    }
  ];

  useEffect(() => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      setMessage(mockDetailedMessage);
      setAiAnalysis(mockAiAnalysis);
      setTimeline(mockTimeline);
      setRelatedMessages(mockRelatedMessages);
      setLoading(false);
    }, 800);
  }, [messageId]);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'danger';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'secondary';
    }
  };

  const handleAIOverride = () => {
    setShowAIOverride(true);
  };

  const submitFeedback = () => {
    console.log('Feedback submitted:', { rating: userFeedback, comment: feedbackComment });
    setUserFeedback(null);
    setFeedbackComment('');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status"></div>
          <p>Loading message details...</p>
        </div>
      </div>
    );
  }

  if (!message) {
    return (
      <Alert
        message="Message Not Found"
        description="The requested message could not be found or may have been deleted."
        type="error"
        showIcon
        action={
          <Link to="/notifications" className="btn btn-outline-primary btn-sm">
            Back to Inbox
          </Link>
        }
      />
    );
  }

  return (
    <div className="ai-message-detail-view">
      {/* Header */}
      <div className="detail-header bg-white rounded-3 p-4 mb-4 border">
        <div className="d-flex justify-content-between align-items-start mb-3">
          <div className="d-flex align-items-center">
            <Link to="/notifications" className="btn btn-outline-secondary me-3">
              <i className="ti ti-arrow-left me-1"></i>
              Back to Inbox
            </Link>
            <div className={`priority-indicator me-3 p-2 rounded-circle bg-${getPriorityColor(message.aiCategory)}-transparent`}>
              <i className={`${getPriorityIcon(message.aiCategory)} text-${getPriorityColor(message.aiCategory)} fs-20`}></i>
            </div>
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Badge count={message.aiPriority} color={getPriorityColor(message.aiCategory)} />
                <span className={`badge bg-${getPriorityColor(message.aiCategory)}-transparent text-${getPriorityColor(message.aiCategory)} text-uppercase`}>
                  {message.aiCategory}
                </span>
                <span className={`badge bg-${getConfidenceColor(message.confidence)}-transparent text-${getConfidenceColor(message.confidence)}`}>
                  {Math.round(message.confidence * 100)}% Confidence
                </span>
                {!message.isRead && (
                  <span className="badge bg-primary">Unread</span>
                )}
              </div>
              <h4 className="mb-0 fw-bold">{message.title}</h4>
              <p className="text-muted mb-0">
                From: {message.sender} • {formatTimeAgo(message.timestamp)}
              </p>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button className="btn btn-outline-warning btn-sm" onClick={handleAIOverride}>
              <i className="ti ti-edit me-1"></i>
              Override AI
            </button>
            <div className="dropdown">
              <button className="btn btn-outline-secondary btn-sm" data-bs-toggle="dropdown">
                <i className="ti ti-dots-vertical"></i>
              </button>
              <ul className="dropdown-menu">
                <li><button className="dropdown-item">Mark as Read</button></li>
                <li><button className="dropdown-item">Flag for Review</button></li>
                <li><button className="dropdown-item">Export Details</button></li>
                <li><hr className="dropdown-divider" /></li>
                <li><button className="dropdown-item text-danger">Delete Message</button></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {message.suggestedActions && message.suggestedActions.length > 0 && (
          <div className="quick-actions">
            <h6 className="mb-2 fw-semibold">
              <i className="ti ti-robot text-primary me-1"></i>
              AI Recommended Actions
            </h6>
            <div className="d-flex gap-2 flex-wrap">
              {message.suggestedActions.map((action: any, index: number) => (
                <button
                  key={`${message.id}-action-${action.action}-${index}`}
                  className={`btn btn-${action.type} btn-sm`}
                  onClick={() => console.log(`Action: ${action.action}`)}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content Tabs */}
      <div className="detail-content">
        <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
          {/* Message Details Tab */}
          <TabPane tab="Message Details" key="details">
            <div className="row g-4">
              <div className="col-lg-8">
                <Card title="Message Content" className="mb-4">
                  <div className="d-flex align-items-start mb-4">
                    <div className="avatar-wrapper me-3">
                      <ImageWithBasePath
                        src={message.avatar}
                        className="avatar-lg rounded-circle"
                        alt="Sender Avatar"
                      />
                    </div>
                    <div className="flex-grow-1">
                      <div className="sender-info mb-3">
                        <h6 className="mb-1 fw-semibold">{message.sender}</h6>
                        <p className="text-muted mb-0 fs-14">
                          {message.metadata?.department || 'System'} • {formatTimeAgo(message.timestamp)}
                        </p>
                      </div>
                      <div className="message-body">
                        <p className="mb-0 lh-base">{message.message}</p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata */}
                  {message.metadata && (
                    <div className="message-metadata bg-light rounded-3 p-3">
                      <h6 className="mb-3 fw-semibold">Additional Information</h6>
                      <div className="row g-2">
                        {Object.entries(message.metadata).map(([key, value]) => (
                          <div key={key} className="col-md-6">
                            <div className="metadata-item">
                              <span className="fw-medium text-capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <span className="ms-2">
                                {Array.isArray(value) ? value.join(', ') : 
                                 typeof value === 'object' ? JSON.stringify(value) : 
                                 String(value)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              <div className="col-lg-4">
                {/* AI Confidence Card */}
                <Card title="AI Analysis Summary" className="mb-4">
                  <div className="confidence-display text-center mb-3">
                    <Progress
                      type="circle"
                      percent={Math.round(message.confidence * 100)}
                      strokeColor={getConfidenceColor(message.confidence) === 'success' ? '#28a745' : 
                                 getConfidenceColor(message.confidence) === 'warning' ? '#ffc107' : '#dc3545'}
                      size={80}
                    />
                    <p className="mt-2 mb-0 fw-medium">Confidence Score</p>
                  </div>
                  
                  <div className="analysis-summary">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Category:</span>
                      <span className={`badge bg-${getPriorityColor(message.aiCategory)}-transparent text-${getPriorityColor(message.aiCategory)}`}>
                        {message.aiCategory}
                      </span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="text-muted">Priority:</span>
                      <Badge count={message.aiPriority} color={getPriorityColor(message.aiCategory)} />
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="text-muted">Processing Time:</span>
                      <span className="fw-medium">{aiAnalysis?.processingTime || 0.3}s</span>
                    </div>
                  </div>
                </Card>

                {/* Feedback Card */}
                <Card title="Was this categorization helpful?" className="mb-4">
                  <div className="feedback-section">
                    <div className="text-center mb-3">
                      <Rate
                        value={userFeedback || 0}
                        onChange={setUserFeedback}
                        allowHalf
                        character={<i className="ti ti-star-filled"></i>}
                      />
                    </div>
                    <textarea
                      className="form-control mb-3"
                      rows={3}
                      placeholder="Additional feedback (optional)"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                    />
                    <button 
                      className="btn btn-primary btn-sm w-100"
                      onClick={submitFeedback}
                      disabled={!userFeedback}
                    >
                      Submit Feedback
                    </button>
                  </div>
                </Card>
              </div>
            </div>
          </TabPane>

          {/* AI Analysis Tab */}
          <TabPane tab="AI Analysis" key="analysis">
            {aiAnalysis && (
              <div className="row g-4">
                <div className="col-lg-6">
                  <Card title="Analysis Factors" className="mb-4">
                    <h6 className="mb-3">Factors Considered:</h6>
                    <ul className="list-unstyled">
                      {aiAnalysis.factorsConsidered.map((factor, index) => (
                        <li key={`factor-${index}-${factor.slice(0, 10)}`} className="mb-2">
                          <i className="ti ti-check-circle text-success me-2"></i>
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </Card>

                  <Card title="Alternative Classifications" className="mb-4">
                    <div className="alternatives-list">
                      {aiAnalysis.alternativeCategories.map((alt, index) => (
                        <div key={`alt-${alt.category}-${index}`} className="alternative-item mb-3 p-3 bg-light rounded-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-medium text-capitalize">{alt.category}</span>
                            <span className="badge bg-secondary">{Math.round(alt.confidence * 100)}%</span>
                          </div>
                          <small className="text-muted">{alt.reasoning}</small>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="col-lg-6">
                  <Card title="Keyword Analysis" className="mb-4">
                    <div className="keywords-list">
                      {aiAnalysis.keywordAnalysis.map((keyword, index) => (
                        <div key={`keyword-${keyword.keyword}-${index}`} className="keyword-item d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-medium">{keyword.keyword}</span>
                          <div className="d-flex align-items-center gap-2">
                            <Tooltip title={`Weight: ${keyword.weight}`}>
                              <Progress 
                                percent={Math.round(keyword.weight * 100)} 
                                size="small" 
                                showInfo={false}
                                strokeColor={keyword.impact === 'positive' ? '#28a745' : 
                                           keyword.impact === 'negative' ? '#dc3545' : '#6c757d'}
                                style={{ width: '60px' }}
                              />
                            </Tooltip>
                            <span className={`badge bg-${keyword.impact === 'positive' ? 'success' : 
                                          keyword.impact === 'negative' ? 'danger' : 'secondary'}-transparent`}>
                              {keyword.impact}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card title="Risk Assessment" className="mb-4">
                    <div className="risk-assessment">
                      <div className="risk-level mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span className="fw-medium">Risk Level:</span>
                          <span className={`badge bg-${getRiskColor(aiAnalysis.riskAssessment.level)}-transparent text-${getRiskColor(aiAnalysis.riskAssessment.level)} text-uppercase`}>
                            {aiAnalysis.riskAssessment.level}
                          </span>
                        </div>
                      </div>
                      
                      <div className="risk-factors mb-3">
                        <h6 className="mb-2">Risk Factors:</h6>
                        <ul className="list-unstyled">
                          {aiAnalysis.riskAssessment.factors.map((factor, index) => (
                            <li key={`risk-factor-${index}-${factor.slice(0, 10)}`} className="mb-1">
                              <i className="ti ti-alert-triangle text-warning me-2"></i>
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="recommendations">
                        <h6 className="mb-2">Recommendations:</h6>
                        <ul className="list-unstyled">
                          {aiAnalysis.riskAssessment.recommendations.map((rec, index) => (
                            <li key={`recommendation-${index}-${rec.slice(0, 10)}`} className="mb-1">
                              <i className="ti ti-bulb text-primary me-2"></i>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </TabPane>

          {/* Timeline Tab */}
          <TabPane tab="Activity Timeline" key="timeline">
            <Card title="Message Timeline">
              <Timeline>
                {timeline.map((item, index) => (
                  <Timeline.Item
                    key={`timeline-${item.action}-${index}`}
                    color={item.type === 'success' ? 'green' : 
                           item.type === 'warning' ? 'orange' : 
                           item.type === 'error' ? 'red' : 'blue'}
                  >
                    <div className="timeline-content">
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <h6 className="mb-0 fw-semibold">{item.action}</h6>
                        <small className="text-muted">{formatTimeAgo(item.timestamp)}</small>
                      </div>
                      <p className="mb-1 text-muted">by {item.actor}</p>
                      <p className="mb-0">{item.details}</p>
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>
          </TabPane>

          {/* Related Messages Tab */}
          <TabPane tab={`Related (${relatedMessages.length})`} key="related">
            <Card title="Related Messages">
              <div className="related-messages">
                {relatedMessages.map((related) => (
                  <div key={related.id} className="related-item d-flex justify-content-between align-items-center p-3 mb-3 bg-light rounded-3">
                    <div className="flex-grow-1">
                      <h6 className="mb-1 fw-medium">{related.title}</h6>
                      <p className="mb-1 text-muted fs-13">{related.reason}</p>
                      <small className="text-muted">{formatTimeAgo(related.timestamp)}</small>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Tooltip title={`Relevance: ${Math.round(related.relevanceScore * 100)}%`}>
                        <Progress
                          percent={Math.round(related.relevanceScore * 100)}
                          size="small"
                          showInfo={false}
                          style={{ width: '60px' }}
                        />
                      </Tooltip>
                      <Link to={`/notifications/${related.id}`} className="btn btn-outline-primary btn-sm">
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </div>

      {/* AI Override Modal */}
      <Modal
        title="Override AI Classification"
        open={showAIOverride}
        onCancel={() => setShowAIOverride(false)}
        footer={[
          <button key="cancel" className="btn btn-secondary" onClick={() => setShowAIOverride(false)}>
            Cancel
          </button>,
          <button key="submit" className="btn btn-primary">
            Update Classification
          </button>
        ]}
      >
        <div className="override-form">
          <div className="mb-3">
            <label className="form-label">New Priority Category</label>
            <select className="form-select">
              <option value="critical">Critical</option>
              <option value="important">Important</option>
              <option value="routine">Routine</option>
              <option value="informational">Informational</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">Priority Level (1-5)</label>
            <input type="range" className="form-range" min="1" max="5" defaultValue="3" />
          </div>
          <div className="mb-3">
            <label className="form-label">Reason for Override</label>
            <textarea className="form-control" rows={3} placeholder="Explain why you're overriding the AI classification..."></textarea>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AIMessageDetailView;
