import { Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { all_routes } from "../../../../routes/all_routes";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";

interface DoctorChatMessage {
  id: string;
  from: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  avatar: string;
  priority: 'life-threatening' | 'urgent' | 'routine' | 'administrative';
  medicalCategory: 'patient-emergency' | 'patient-communication' | 'medical-consultation' | 'lab-coordination' | 'surgical-planning' | 'medication-review' | 'administrative';
  aiClassification: {
    confidence: number;
    medicalUrgency: number; // 1-5 scale
    clinicalSentiment: 'critical' | 'concerned' | 'routine' | 'positive';
    actionRequired: boolean;
    responseTimeframe: string;
    medicalKeywords: string[];
    patientId?: string;
    vitalSigns?: boolean;
    symptoms?: string[];
    diagnosis?: string[];
    medications?: string[];
    department?: string;
    riskAssessment?: 'high' | 'medium' | 'low';
  };
  messageType: 'text' | 'voice' | 'image' | 'medical-report' | 'video-call' | 'emergency-alert' | 'lab-result';
  isOnline: boolean;
  unreadCount?: number;
  patientInfo?: {
    id: string;
    name: string;
    age: number;
    room?: string;
    condition?: string;
    allergies?: string[];
    criticalAlerts?: string[];
  };
  complianceLevel: 'hipaa' | 'phi' | 'standard';
  consultationType?: 'emergency' | 'routine' | 'follow-up' | 'second-opinion' | 'telemedicine';
}

interface DoctorConversation {
  id: string;
  participant: string;
  role: 'doctor' | 'nurse' | 'resident' | 'patient' | 'family' | 'specialist' | 'lab-tech' | 'administrator';
  lastMessage: DoctorChatMessage;
  messages: DoctorChatMessage[];
  isPinned: boolean;
  isFavorite: boolean;
  totalUnread: number;
  department?: string;
  specialty?: string;
}

interface DoctorMessageFilters {
  priority: 'all' | 'life-threatening' | 'urgent' | 'routine' | 'administrative';
  medicalCategory: 'all' | 'patient-emergency' | 'patient-communication' | 'medical-consultation' | 'lab-coordination' | 'surgical-planning' | 'medication-review' | 'administrative';
  clinicalSentiment: 'all' | 'critical' | 'concerned' | 'routine' | 'positive';
  department: 'all' | 'cardiology' | 'emergency' | 'surgery' | 'icu' | 'laboratory' | 'radiology';
  role: 'all' | 'doctor' | 'nurse' | 'patient' | 'specialist';
  timeRange: 'today' | 'week' | 'month';
  onlineOnly: boolean;
  patientRelated: boolean;
  actionRequired: boolean;
}

const DoctorAIEnhancedMessages = () => {
  const [conversations, setConversations] = useState<DoctorConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<DoctorConversation | null>(null);
  const [filters, setFilters] = useState<DoctorMessageFilters>({
    priority: 'all',
    medicalCategory: 'all',
    clinicalSentiment: 'all',
    department: 'all',
    role: 'all',
    timeRange: 'today',
    onlineOnly: false,
    patientRelated: false,
    actionRequired: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorProfile] = useState({
    name: "Dr. Sarah Chen",
    specialty: "Cardiology",
    department: "Internal Medicine",
    id: "DOC-001"
  });
  const [medicalInsights, setMedicalInsights] = useState({
    totalConversations: 0,
    emergencyMessages: 0,
    patientMessages: 0,
    avgResponseTime: '6m',
    pendingConsultations: 0,
    criticalAlerts: 0,
    activeCodes: null as string | null
  });

  // Mock doctor-specific conversation data
  const mockDoctorConversations: DoctorConversation[] = [
    {
      id: "doc-conv-1",
      participant: "ER Nurse - Maria Santos",
      role: 'nurse',
      department: "emergency",
      isPinned: true,
      isFavorite: false,
      totalUnread: 2,
      lastMessage: {
        id: "doc-msg-1",
        from: "Maria Santos, RN",
        content: "Dr. Chen, incoming cardiac arrest! 45-year-old male, CPR in progress. ETA 3 minutes. Need you in trauma bay 1 immediately. Vitals: No pulse, compressions ongoing.",
        timestamp: new Date(Date.now() - 1 * 60 * 1000),
        isRead: false,
        avatar: "assets/img/profiles/avatar-10.jpg",
        priority: 'life-threatening',
        medicalCategory: 'patient-emergency',
        aiClassification: {
          confidence: 0.99,
          medicalUrgency: 5,
          clinicalSentiment: 'critical',
          actionRequired: true,
          responseTimeframe: "Immediate (< 2 minutes)",
          medicalKeywords: ["cardiac-arrest", "cpr", "trauma", "no-pulse", "emergency"],
          patientId: "PT-INCOMING-001",
          vitalSigns: true,
          symptoms: ["cardiac arrest", "no pulse"],
          department: "emergency",
          riskAssessment: 'high'
        },
        messageType: 'emergency-alert',
        isOnline: true,
        patientInfo: {
          id: "PT-INCOMING-001",
          name: "John Doe (Incoming)",
          age: 45,
          condition: "Cardiac Arrest",
          criticalAlerts: ["CPR in progress", "No pulse"]
        },
        complianceLevel: 'hipaa',
        consultationType: 'emergency'
      },
      messages: []
    },
    {
      id: "doc-conv-2",
      participant: "Lab Tech - Jennifer Wu",
      role: 'lab-tech',
      department: "laboratory",
      isPinned: false,
      isFavorite: true,
      totalUnread: 1,
      lastMessage: {
        id: "doc-msg-2",
        from: "Jennifer Wu",
        content: "Dr. Chen, CRITICAL lab alert for patient Martinez in room 302. Troponin levels are severely elevated at 48.3 ng/mL. This is a significant MI marker. Patient also showing new Q waves on latest EKG.",
        timestamp: new Date(Date.now() - 4 * 60 * 1000),
        isRead: false,
        avatar: "assets/img/users/user-09.jpg",
        priority: 'life-threatening',
        medicalCategory: 'lab-coordination',
        aiClassification: {
          confidence: 0.97,
          medicalUrgency: 5,
          clinicalSentiment: 'critical',
          actionRequired: true,
          responseTimeframe: "Within 10 minutes",
          medicalKeywords: ["troponin", "elevated", "myocardial-infarction", "q-waves", "critical"],
          patientId: "PT-302-001",
          vitalSigns: true,
          symptoms: ["elevated troponin"],
          diagnosis: ["myocardial infarction"],
          department: "laboratory",
          riskAssessment: 'high'
        },
        messageType: 'lab-result',
        isOnline: true,
        patientInfo: {
          id: "PT-302-001",
          name: "Elena Martinez",
          age: 68,
          room: "302",
          condition: "Elevated Cardiac Enzymes",
          criticalAlerts: ["Troponin 48.3 ng/mL", "New Q waves"]
        },
        complianceLevel: 'hipaa',
        consultationType: 'emergency'
      },
      messages: []
    },
    {
      id: "doc-conv-3",
      participant: "Dr. Michael Roberts - Surgery",
      role: 'doctor',
      department: "surgery",
      specialty: "Cardiac Surgery",
      isPinned: false,
      isFavorite: false,
      totalUnread: 1,
      lastMessage: {
        id: "doc-msg-3",
        from: "Dr. Michael Roberts",
        content: "Sarah, need your cardiology assessment for 72-year-old female scheduled for urgent valve replacement tomorrow. EF is 35%, but she's stable. Can you clear her for surgery? Recent echo shows severe aortic stenosis.",
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        isRead: false,
        avatar: "assets/img/doctors/doctor-07.jpg",
        priority: 'urgent',
        medicalCategory: 'medical-consultation',
        aiClassification: {
          confidence: 0.93,
          medicalUrgency: 4,
          clinicalSentiment: 'concerned',
          actionRequired: true,
          responseTimeframe: "Within 4 hours",
          medicalKeywords: ["valve-replacement", "ejection-fraction", "aortic-stenosis", "pre-operative", "clearance"],
          patientId: "PT-VALVE-001",
          vitalSigns: true,
          symptoms: ["aortic stenosis"],
          diagnosis: ["severe aortic stenosis", "reduced EF"],
          department: "surgery",
          riskAssessment: 'medium'
        },
        messageType: 'text',
        isOnline: true,
        patientInfo: {
          id: "PT-VALVE-001",
          name: "Margaret Thompson",
          age: 72,
          condition: "Severe Aortic Stenosis",
          allergies: ["Penicillin"]
        },
        complianceLevel: 'hipaa',
        consultationType: 'routine'
      },
      messages: []
    },
    {
      id: "doc-conv-4",
      participant: "Patient - Robert Johnson",
      role: 'patient',
      isPinned: false,
      isFavorite: false,
      totalUnread: 1,
      lastMessage: {
        id: "doc-msg-4",
        from: "Robert Johnson",
        content: "Dr. Chen, I'm having some chest discomfort since this morning. It's not severe, but it's been persistent. Should I be concerned? I took my medications as prescribed. Rate the pain about 4/10.",
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        isRead: false,
        avatar: "assets/img/profiles/avatar-15.jpg",
        priority: 'urgent',
        medicalCategory: 'patient-communication',
        aiClassification: {
          confidence: 0.89,
          medicalUrgency: 4,
          clinicalSentiment: 'concerned',
          actionRequired: true,
          responseTimeframe: "Within 2 hours",
          medicalKeywords: ["chest-discomfort", "persistent", "pain-scale", "medication-compliance"],
          patientId: "PT-JOHNSON-001",
          vitalSigns: false,
          symptoms: ["chest discomfort", "pain 4/10"],
          department: "cardiology",
          riskAssessment: 'medium'
        },
        messageType: 'text',
        isOnline: false,
        patientInfo: {
          id: "PT-JOHNSON-001",
          name: "Robert Johnson",
          age: 58,
          condition: "Post-MI Recovery",
          allergies: ["Aspirin"],
          criticalAlerts: ["Previous MI"]
        },
        complianceLevel: 'hipaa',
        consultationType: 'follow-up'
      },
      messages: []
    },
    {
      id: "doc-conv-5",
      participant: "ICU Nurse - David Kim",
      role: 'nurse',
      department: "icu",
      isPinned: false,
      isFavorite: false,
      totalUnread: 0,
      lastMessage: {
        id: "doc-msg-5",
        from: "David Kim, RN",
        content: "Patient Williams in ICU bed 5 is showing improvement. BP stabilized at 125/80, heart rate regular at 78. Urine output good. Family is asking about prognosis and when he can be moved to regular floor.",
        timestamp: new Date(Date.now() - 35 * 60 * 1000),
        isRead: true,
        avatar: "assets/img/profiles/avatar-12.jpg",
        priority: 'routine',
        medicalCategory: 'patient-communication',
        aiClassification: {
          confidence: 0.91,
          medicalUrgency: 2,
          clinicalSentiment: 'positive',
          actionRequired: false,
          responseTimeframe: "Within 4 hours",
          medicalKeywords: ["improvement", "vitals-stable", "prognosis", "family-communication"],
          patientId: "PT-ICU-005",
          vitalSigns: true,
          symptoms: ["stable vitals"],
          department: "icu",
          riskAssessment: 'low'
        },
        messageType: 'text',
        isOnline: true,
        patientInfo: {
          id: "PT-ICU-005",
          name: "Thomas Williams",
          age: 64,
          room: "ICU-5",
          condition: "Post-Cardiac Surgery Recovery"
        },
        complianceLevel: 'hipaa',
        consultationType: 'routine'
      },
      messages: []
    },
    {
      id: "doc-conv-6",
      participant: "Pharmacy - Dr. Lisa Park",
      role: 'specialist',
      department: "pharmacy",
      specialty: "Clinical Pharmacy",
      isPinned: false,
      isFavorite: false,
      totalUnread: 1,
      lastMessage: {
        id: "doc-msg-6",
        from: "Dr. Lisa Park, PharmD",
        content: "Dr. Chen, medication review needed for patient Chen in room 208. Potential interaction between Warfarin and new Amiodarone prescription. Recommend INR monitoring q24h and possible dose adjustment.",
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        isRead: false,
        avatar: "assets/img/doctors/doctor-05.jpg",
        priority: 'urgent',
        medicalCategory: 'medication-review',
        aiClassification: {
          confidence: 0.95,
          medicalUrgency: 4,
          clinicalSentiment: 'concerned',
          actionRequired: true,
          responseTimeframe: "Within 2 hours",
          medicalKeywords: ["drug-interaction", "warfarin", "amiodarone", "inr-monitoring", "dose-adjustment"],
          patientId: "PT-208-001",
          medications: ["Warfarin", "Amiodarone"],
          department: "pharmacy",
          riskAssessment: 'medium'
        },
        messageType: 'text',
        isOnline: true,
        patientInfo: {
          id: "PT-208-001",
          name: "Linda Chen",
          age: 75,
          room: "208",
          condition: "Atrial Fibrillation",
          allergies: ["Sulfa"]
        },
        complianceLevel: 'hipaa',
        consultationType: 'routine'
      },
      messages: []
    }
  ];

  useEffect(() => {
    setConversations(mockDoctorConversations);
    if (mockDoctorConversations.length > 0) {
      setSelectedConversation(mockDoctorConversations[0]);
    }
    
    // Calculate medical insights
    // const totalUnread = mockDoctorConversations.reduce((sum, conv) => sum + conv.totalUnread, 0);
    const emergencyCount = mockDoctorConversations.filter(conv => 
      conv.lastMessage.priority === 'life-threatening' || 
      conv.lastMessage.medicalCategory === 'patient-emergency'
    ).length;
    const patientCount = mockDoctorConversations.filter(conv => 
      conv.role === 'patient' || conv.lastMessage.patientInfo
    ).length;
    
    setMedicalInsights({
      totalConversations: mockDoctorConversations.length,
      emergencyMessages: emergencyCount,
      patientMessages: patientCount,
      avgResponseTime: '6m',
      pendingConsultations: mockDoctorConversations.filter(conv => 
        conv.lastMessage.consultationType && !conv.lastMessage.isRead
      ).length,
      criticalAlerts: mockDoctorConversations.filter(conv => 
        conv.lastMessage.patientInfo?.criticalAlerts?.length
      ).length,
      activeCodes: mockDoctorConversations.find(conv => 
        conv.lastMessage.aiClassification.medicalKeywords.includes('cardiac-arrest')
      )?.lastMessage.aiClassification.medicalKeywords.find(k => k.includes('arrest')) || null
    });
  }, []);

  // Filter conversations based on medical criteria
  const filteredConversations = useMemo(() => {
    return conversations.filter(conversation => {
      const message = conversation.lastMessage;
      
      if (filters.priority !== 'all' && message.priority !== filters.priority) return false;
      if (filters.medicalCategory !== 'all' && message.medicalCategory !== filters.medicalCategory) return false;
      if (filters.clinicalSentiment !== 'all' && message.aiClassification.clinicalSentiment !== filters.clinicalSentiment) return false;
      if (filters.role !== 'all' && conversation.role !== filters.role) return false;
      if (filters.onlineOnly && !message.isOnline) return false;
      if (filters.patientRelated && !message.patientInfo) return false;
      if (filters.actionRequired && !message.aiClassification.actionRequired) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!conversation.participant.toLowerCase().includes(searchLower) &&
            !message.content.toLowerCase().includes(searchLower) &&
            !message.aiClassification.medicalKeywords.some(keyword => keyword.includes(searchLower)) &&
            !(message.patientInfo?.name.toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      
      return true;
    }).sort((a, b) => {
      // Sort by medical urgency first, then by timestamp
      if (a.lastMessage.aiClassification.medicalUrgency !== b.lastMessage.aiClassification.medicalUrgency) {
        return b.lastMessage.aiClassification.medicalUrgency - a.lastMessage.aiClassification.medicalUrgency;
      }
      return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
    });
  }, [conversations, filters, searchTerm]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'life-threatening': return 'danger';
      case 'urgent': return 'warning';
      case 'routine': return 'info';
      case 'administrative': return 'secondary';
      default: return 'secondary';
    }
  };

  const getClinicalSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'critical': return 'ti ti-alert-triangle-filled';
      case 'concerned': return 'ti ti-mood-sad';
      case 'routine': return 'ti ti-mood-neutral';
      case 'positive': return 'ti ti-mood-smile';
      default: return 'ti ti-mood-neutral';
    }
  };

  const getMedicalCategoryIcon = (category: string) => {
    switch (category) {
      case 'patient-emergency': return 'ti ti-emergency-bed';
      case 'patient-communication': return 'ti ti-user';
      case 'medical-consultation': return 'ti ti-user-check';
      case 'lab-coordination': return 'ti ti-test-pipe';
      case 'surgical-planning': return 'ti ti-cut';
      case 'medication-review': return 'ti ti-pill';
      case 'administrative': return 'ti ti-file-text';
      default: return 'ti ti-message-circle';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor': return 'ti ti-stethoscope';
      case 'nurse': return 'ti ti-heart';
      case 'patient': return 'ti ti-user';
      case 'specialist': return 'ti ti-certificate';
      case 'lab-tech': return 'ti ti-test-pipe';
      case 'administrator': return 'ti ti-file-text';
      default: return 'ti ti-user';
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

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'voice': return 'ti ti-microphone';
      case 'image': return 'ti ti-photo';
      case 'medical-report': return 'ti ti-file-text';
      case 'video-call': return 'ti ti-video';
      case 'emergency-alert': return 'ti ti-emergency-bed';
      case 'lab-result': return 'ti ti-test-pipe';
      default: return 'ti ti-message';
    }
  };

  return (
    <>
      {/* Page Content */}
      <div className="page-wrapper">
        <div className="content content-two">
          <div className="chat-wrapper">
            {/* Enhanced Medical Chat Sidebar */}
            <div className="sidebar-group">
              <div id="chats" className="sidebar-content active slimscroll">
                <div className="slimscroll">
                  {/* Medical AI Triage Header */}
                  <div className="chat-search-header">
                    <div className="medical-triage-header bg-primary-transparent rounded p-3 mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center">
                          <i className="ti ti-stethoscope text-primary fs-20 me-2"></i>
                          <h6 className="mb-0 fw-bold text-primary">Medical AI Triage</h6>
                        </div>
                        <span className="badge bg-success rounded-pill fs-10">
                          {medicalInsights.activeCodes ? 'EMERGENCY ACTIVE' : 'Active'}
                        </span>
                      </div>
                      
                      {/* Emergency Alert */}
                      {medicalInsights.activeCodes && (
                        <div className="alert alert-danger py-2 mb-2">
                          <div className="d-flex align-items-center">
                            <i className="ti ti-emergency-bed text-danger me-2"></i>
                            <strong>ACTIVE EMERGENCY: CARDIAC ARREST</strong>
                          </div>
                        </div>
                      )}
                      
                      <div className="row g-2 text-center">
                        <div className="col-4">
                          <div className="medical-metric">
                            <h6 className="mb-0 fw-bold text-danger">{medicalInsights.emergencyMessages}</h6>
                            <small className="text-muted">Emergency</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="medical-metric">
                            <h6 className="mb-0 fw-bold text-info">{medicalInsights.patientMessages}</h6>
                            <small className="text-muted">Patients</small>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="medical-metric">
                            <h6 className="mb-0 fw-bold text-warning">{medicalInsights.criticalAlerts}</h6>
                            <small className="text-muted">Critical</small>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Profile */}
                    <div className="doctor-profile bg-light rounded p-2 mb-3">
                      <div className="d-flex align-items-center">
                        <div className="avatar avatar-md me-2">
                          <ImageWithBasePath
                            src="assets/img/doctors/doctor-02.jpg"
                            className="rounded-circle"
                            alt="Doctor"
                          />
                        </div>
                        <div>
                          <h6 className="mb-0 fw-semibold">{doctorProfile.name}</h6>
                          <small className="text-muted">{doctorProfile.specialty} • {doctorProfile.department}</small>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Search */}
                    <div className="search-wrap mb-3">
                      <form>
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Search patients, symptoms..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                          <span className="input-group-text">
                            <i className="isax isax-search-normal-1" />
                          </span>
                        </div>
                      </form>
                    </div>

                    {/* Medical Filter Controls */}
                    <div className="medical-filters mb-3">
                      <div className="row g-2">
                        <div className="col-6">
                          <select 
                            className="form-select form-select-sm"
                            value={filters.priority}
                            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
                          >
                            <option value="all">All Priorities</option>
                            <option value="life-threatening">Life-Threatening</option>
                            <option value="urgent">Urgent</option>
                            <option value="routine">Routine</option>
                            <option value="administrative">Administrative</option>
                          </select>
                        </div>
                        <div className="col-6">
                          <select 
                            className="form-select form-select-sm"
                            value={filters.role}
                            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value as any }))}
                          >
                            <option value="all">All Roles</option>
                            <option value="patient">Patients</option>
                            <option value="doctor">Doctors</option>
                            <option value="nurse">Nurses</option>
                            <option value="specialist">Specialists</option>
                            <option value="lab-tech">Lab Tech</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="row g-2 mt-1">
                        <div className="col-12">
                          <div className="d-flex gap-2">
                            <div className="form-check form-check-sm">
                              <input 
                                className="form-check-input" 
                                type="checkbox"
                                checked={filters.patientRelated}
                                onChange={(e) => setFilters(prev => ({ ...prev, patientRelated: e.target.checked }))}
                              />
                              <label className="form-check-label fs-12">Patient Related</label>
                            </div>
                            <div className="form-check form-check-sm">
                              <input 
                                className="form-check-input" 
                                type="checkbox"
                                checked={filters.actionRequired}
                                onChange={(e) => setFilters(prev => ({ ...prev, actionRequired: e.target.checked }))}
                              />
                              <label className="form-check-label fs-12">Action Required</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Medical Chat List */}
                  <div className="sidebar-body chat-body" id="chatsidebar">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="chat-title mb-0">Medical Communications ({filteredConversations.length})</h6>
                      <div className="dropdown">
                        <button className="btn btn-sm btn-outline-primary" data-bs-toggle="dropdown">
                          <i className="ti ti-adjustments"></i>
                        </button>
                        <div className="dropdown-menu dropdown-menu-end p-3">
                          <h6 className="mb-2">Medical Actions</h6>
                          <button className="dropdown-item btn-sm">Emergency Broadcast</button>
                          <button className="dropdown-item btn-sm">Patient Status Update</button>
                          <hr className="my-2" />
                          <button className="dropdown-item btn-sm">Medical AI Settings</button>
                        </div>
                      </div>
                    </div>

                    <div className="chat-users-wrap">
                      {filteredConversations.map((conversation) => (
                        <div key={conversation.id} className="chat-list position-relative">
                          <Link 
                            to={all_routes.chat} 
                            className={`chat-user-list ${selectedConversation?.id === conversation.id ? 'active' : ''}`}
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <div className="avatar avatar-lg me-2 position-relative">
                              <ImageWithBasePath
                                src={conversation.lastMessage.avatar}
                                className="rounded-circle"
                                alt="image"
                              />
                              
                              {/* Online Status */}
                              <span className={`position-absolute bottom-0 end-0 badge rounded-pill ${conversation.lastMessage.isOnline ? 'bg-success' : 'bg-secondary'}`} style={{ width: '12px', height: '12px' }}></span>
                              
                              {/* Medical Urgency Indicator */}
                              <span 
                                className={`position-absolute top-0 start-0 badge bg-${getPriorityColor(conversation.lastMessage.priority)} rounded-pill`}
                                style={{ fontSize: '8px', padding: '2px 4px' }}
                              >
                                {conversation.lastMessage.aiClassification.medicalUrgency}
                              </span>
                            </div>
                            
                            <div className="chat-user-info">
                              <div className="chat-user-msg">
                                <div className="d-flex align-items-center justify-content-between mb-1">
                                  <h6 className="mb-0 d-flex align-items-center">
                                    {conversation.participant}
                                    <i className={`${getRoleIcon(conversation.role)} ms-1 fs-12 text-muted`}></i>
                                    {conversation.isPinned && (
                                      <i className="ti ti-pin text-warning ms-1 fs-12"></i>
                                    )}
                                  </h6>
                                </div>
                                
                                {/* Medical Classification Badges */}
                                <div className="d-flex align-items-center gap-1 mb-1">
                                  <span className={`badge bg-${getPriorityColor(conversation.lastMessage.priority)}-transparent text-${getPriorityColor(conversation.lastMessage.priority)} fs-10`}>
                                    {conversation.lastMessage.priority.replace('-', ' ')}
                                  </span>
                                  
                                  <span className="badge bg-light text-dark fs-10">
                                    <i className={`${getMedicalCategoryIcon(conversation.lastMessage.medicalCategory)} me-1`}></i>
                                    {conversation.lastMessage.medicalCategory.replace('-', ' ')}
                                  </span>
                                  
                                  {conversation.lastMessage.aiClassification.actionRequired && (
                                    <span className="badge bg-warning-transparent text-warning fs-10">
                                      <i className="ti ti-clock me-1"></i>
                                      Action
                                    </span>
                                  )}
                                </div>
                                
                                {/* Patient Information */}
                                {conversation.lastMessage.patientInfo && (
                                  <div className="patient-info mb-1">
                                    <small className="text-info fw-bold">
                                      <i className="ti ti-user me-1"></i>
                                      {conversation.lastMessage.patientInfo.name}
                                      {conversation.lastMessage.patientInfo.room && (
                                        <span className="text-muted ms-1">• Room {conversation.lastMessage.patientInfo.room}</span>
                                      )}
                                    </small>
                                    {conversation.lastMessage.patientInfo.criticalAlerts && (
                                      <div className="d-flex gap-1 mt-1">
                                        {conversation.lastMessage.patientInfo.criticalAlerts.slice(0, 2).map((alert, index) => (
                                          <span key={`${selectedConversation?.id || 'unknown'}-clinical-flag-${index}`} className="badge bg-danger-transparent text-danger fs-10">
                                            {alert}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                <p className="mb-0 fs-12 text-truncate">
                                  <i className={`${getMessageTypeIcon(conversation.lastMessage.messageType)} me-1`}></i>
                                  {conversation.lastMessage.content}
                                </p>
                                
                                {/* Medical AI Insights */}
                                <div className="d-flex align-items-center justify-content-between mt-1">
                                  <div className="d-flex align-items-center gap-1">
                                    <span className={`text-${getPriorityColor(conversation.lastMessage.aiClassification.clinicalSentiment)} fs-10`}>
                                      <i className={getClinicalSentimentIcon(conversation.lastMessage.aiClassification.clinicalSentiment)}></i>
                                    </span>
                                    <small className="text-muted fs-10">
                                      AI: {Math.round(conversation.lastMessage.aiClassification.confidence * 100)}%
                                    </small>
                                    {conversation.lastMessage.aiClassification.riskAssessment && (
                                      <span className={`badge bg-${conversation.lastMessage.aiClassification.riskAssessment === 'high' ? 'danger' : conversation.lastMessage.aiClassification.riskAssessment === 'medium' ? 'warning' : 'success'}-transparent text-${conversation.lastMessage.aiClassification.riskAssessment === 'high' ? 'danger' : conversation.lastMessage.aiClassification.riskAssessment === 'medium' ? 'warning' : 'success'} fs-10`}>
                                        {conversation.lastMessage.aiClassification.riskAssessment} risk
                                      </span>
                                    )}
                                  </div>
                                  
                                  <span className={`badge bg-${conversation.lastMessage.complianceLevel === 'hipaa' ? 'success' : 'secondary'}-transparent text-${conversation.lastMessage.complianceLevel === 'hipaa' ? 'success' : 'secondary'} fs-10`}>
                                    {conversation.lastMessage.complianceLevel.toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="chat-user-time">
                                <span className="time fs-11">{formatTimeAgo(conversation.lastMessage.timestamp)}</span>
                                <div className="chat-pin">
                                  {conversation.totalUnread > 0 && (
                                    <span className="count-message fs-12 fw-semibold bg-primary text-white rounded-pill px-2">
                                      {conversation.totalUnread}
                                    </span>
                                  )}
                                  <small className="d-block text-muted fs-10 mt-1">
                                    {conversation.lastMessage.aiClassification.responseTimeframe.split(' ')[0]}
                                  </small>
                                </div>
                              </div>
                            </div>
                          </Link>
                          
                          {/* Chat Dropdown */}
                          <div className="chat-dropdown">
                            <Link className="#" to="#" data-bs-toggle="dropdown">
                              <i className="ti ti-dots-vertical" />
                            </Link>
                            <ul className="dropdown-menu dropdown-menu-end p-3">
                              <li><Link className="dropdown-item" to="#">Quick Response</Link></li>
                              <li><Link className="dropdown-item" to="#">Medical Consult</Link></li>
                              <li><Link className="dropdown-item" to="#">Add to Patient Chart</Link></li>
                              <li><hr className="dropdown-divider" /></li>
                              <li><Link className="dropdown-item" to="#">Override AI Priority</Link></li>
                              <li><Link className="dropdown-item" to="#">Medical AI Training</Link></li>
                              <li><hr className="dropdown-divider" /></li>
                              <li><Link className="dropdown-item text-danger" to="#">Emergency Escalation</Link></li>
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Medical Chat View */}
            <div className="chat chat-messages show" id="middle">
              {selectedConversation ? (
                <div>
                  {/* Enhanced Medical Chat Header */}
                  <div className="chat-header bg-white border-bottom p-3">
                    <div className="user-details">
                      <div className="d-xl-none">
                        <Link className="text-muted chat-close me-2" to="#">
                          <i className="fas fa-arrow-left" />
                        </Link>
                      </div>
                      <div className="avatar avatar-lg me-3 position-relative">
                        <ImageWithBasePath
                          src={selectedConversation.lastMessage.avatar}
                          className="rounded-circle"
                          alt="image"
                        />
                        <span className={`position-absolute bottom-0 end-0 badge rounded-pill ${selectedConversation.lastMessage.isOnline ? 'bg-success' : 'bg-secondary'}`} style={{ width: '12px', height: '12px' }}></span>
                      </div>
                      <div className="ms-2 overflow-hidden">
                        <h6 className="mb-1 d-flex align-items-center">
                          {selectedConversation.participant}
                          <span className={`badge bg-${getPriorityColor(selectedConversation.lastMessage.priority)} ms-2 fs-10`}>
                            {selectedConversation.lastMessage.priority.replace('-', ' ')}
                          </span>
                          <i className={`${getRoleIcon(selectedConversation.role)} ms-2 fs-14 text-muted`}></i>
                        </h6>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`last-seen ${selectedConversation.lastMessage.isOnline ? 'text-success' : 'text-muted'}`}>
                            {selectedConversation.lastMessage.isOnline ? 'Online' : 'Offline'}
                          </span>
                          {selectedConversation.department && (
                            <span className="badge bg-light text-dark fs-10">
                              {selectedConversation.department}
                            </span>
                          )}
                          {selectedConversation.specialty && (
                            <span className="badge bg-info-transparent text-info fs-10">
                              {selectedConversation.specialty}
                            </span>
                          )}
                          <span className={`badge bg-${selectedConversation.lastMessage.complianceLevel === 'hipaa' ? 'success' : 'secondary'}-transparent text-${selectedConversation.lastMessage.complianceLevel === 'hipaa' ? 'success' : 'secondary'} fs-10`}>
                            <i className="ti ti-shield-check me-1"></i>
                            {selectedConversation.lastMessage.complianceLevel.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="chat-options">
                      <ul className="list-unstyled">
                        {/* Medical Quick Actions */}
                        <li>
                          <Link
                            to="#"
                            className="btn chat-search-btn"
                            data-bs-toggle="tooltip"
                            data-bs-placement="bottom"
                            title="Medical Chart"
                          >
                            <i className="ti ti-file-text text-primary" />
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="btn chat-search-btn"
                            data-bs-toggle="tooltip"
                            data-bs-placement="bottom"
                            title="Vital Signs"
                          >
                            <i className="ti ti-activity text-success" />
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="#"
                            className="btn chat-search-btn"
                            data-bs-toggle="tooltip"
                            data-bs-placement="bottom"
                            title="Medical AI Insights"
                          >
                            <i className="ti ti-stethoscope text-primary" />
                          </Link>
                        </li>
                        <li>
                          <Link
                            className="btn no-bg"
                            to="#"
                            data-bs-toggle="dropdown"
                          >
                            <i className="ti ti-dots-vertical" />
                          </Link>
                          <ul className="dropdown-menu dropdown-menu-end p-3">
                            <li><Link to="#" className="dropdown-item">Emergency Call</Link></li>
                            <li><Link to="#" className="dropdown-item">Video Consultation</Link></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><Link to="#" className="dropdown-item">View Patient Chart</Link></li>
                            <li><Link to="#" className="dropdown-item">Medical History</Link></li>
                            <li><Link to="#" className="dropdown-item">Lab Results</Link></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><Link to="#" className="dropdown-item">Medical AI Analysis</Link></li>
                            <li><Link to="#" className="dropdown-item">Override Priority</Link></li>
                            <li><hr className="dropdown-divider" /></li>
                            <li><Link to="#" className="dropdown-item text-danger">Emergency Escalation</Link></li>
                          </ul>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Medical Insight Bar */}
                  <div className="medical-insights-bar bg-light border-bottom p-2">
                    <div className="row g-2 text-center">
                      <div className="col-2">
                        <small className="text-muted d-block">Urgency</small>
                        <span className={`fw-bold text-${getPriorityColor(selectedConversation.lastMessage.priority)}`}>
                          {selectedConversation.lastMessage.aiClassification.medicalUrgency}/5
                        </span>
                      </div>
                      <div className="col-2">
                        <small className="text-muted d-block">Sentiment</small>
                        <span className={`fw-bold text-${getPriorityColor(selectedConversation.lastMessage.aiClassification.clinicalSentiment)}`}>
                          <i className={getClinicalSentimentIcon(selectedConversation.lastMessage.aiClassification.clinicalSentiment)}></i>
                        </span>
                      </div>
                      <div className="col-2">
                        <small className="text-muted d-block">Confidence</small>
                        <span className="fw-bold text-primary">
                          {Math.round(selectedConversation.lastMessage.aiClassification.confidence * 100)}%
                        </span>
                      </div>
                      <div className="col-2">
                        <small className="text-muted d-block">Risk</small>
                        <span className={`fw-bold text-${selectedConversation.lastMessage.aiClassification.riskAssessment === 'high' ? 'danger' : selectedConversation.lastMessage.aiClassification.riskAssessment === 'medium' ? 'warning' : 'success'}`}>
                          {selectedConversation.lastMessage.aiClassification.riskAssessment || 'N/A'}
                        </span>
                      </div>
                      <div className="col-2">
                        <small className="text-muted d-block">Response</small>
                        <span className="fw-bold text-info fs-12">
                          {selectedConversation.lastMessage.aiClassification.responseTimeframe.split(' ')[0]}
                        </span>
                      </div>
                      <div className="col-2">
                        <small className="text-muted d-block">Patient</small>
                        <span className="fw-bold text-success">
                          {selectedConversation.lastMessage.patientInfo ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Patient Information Card */}
                  {selectedConversation.lastMessage.patientInfo && (
                    <div className="patient-info-card bg-info-transparent border-bottom p-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6 className="mb-1 text-info fw-bold">
                            <i className="ti ti-user me-1"></i>
                            {selectedConversation.lastMessage.patientInfo.name}
                          </h6>
                          <div className="d-flex gap-3">
                            <small>Age: {selectedConversation.lastMessage.patientInfo.age}</small>
                            {selectedConversation.lastMessage.patientInfo.room && (
                              <small>Room: {selectedConversation.lastMessage.patientInfo.room}</small>
                            )}
                            {selectedConversation.lastMessage.patientInfo.condition && (
                              <small>Condition: {selectedConversation.lastMessage.patientInfo.condition}</small>
                            )}
                          </div>
                          {selectedConversation.lastMessage.patientInfo.allergies && (
                            <div className="mt-1">
                              <small className="text-danger">
                                <i className="ti ti-alert-triangle me-1"></i>
                                Allergies: {selectedConversation.lastMessage.patientInfo.allergies.join(', ')}
                              </small>
                            </div>
                          )}
                        </div>
                        <div className="text-end">
                          <Link to="#" className="btn btn-sm btn-outline-primary">
                            <i className="ti ti-file-text me-1"></i>
                            View Chart
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chat Body */}
                  <div className="chat-body chat-page-group slimscroll">
                    <div className="messages">
                      <div className="chats">
                        <div className="chat-avatar">
                          <ImageWithBasePath
                            src={selectedConversation.lastMessage.avatar}
                            className="rounded-circle"
                            alt="image"
                          />
                        </div>
                        <div className="chat-content">
                          <div className="chat-info">
                            <div className="message-content bg-light rounded p-3">
                              {selectedConversation.lastMessage.content}
                              
                              {/* Medical Keywords */}
                              {selectedConversation.lastMessage.aiClassification.medicalKeywords.length > 0 && (
                                <div className="medical-keywords mt-2">
                                  <small className="text-muted d-block mb-1">Medical AI Detected:</small>
                                  <div className="d-flex gap-1 flex-wrap">
                                    {selectedConversation.lastMessage.aiClassification.medicalKeywords.slice(0, 5).map((keyword, index) => (
                                      <span key={`${selectedConversation.id}-medical-keyword-${index}`} className="badge bg-primary-transparent text-primary fs-10">
                                        {keyword}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Vital Signs Display */}
                              {selectedConversation.lastMessage.aiClassification.vitalSigns && (
                                <div className="vital-signs mt-2 p-2 bg-success-transparent rounded">
                                  <small className="text-success fw-bold">
                                    <i className="ti ti-activity me-1"></i>
                                    Vital Signs Mentioned
                                  </small>
                                </div>
                              )}

                              {/* Symptoms/Diagnosis */}
                              {(selectedConversation.lastMessage.aiClassification.symptoms || selectedConversation.lastMessage.aiClassification.diagnosis) && (
                                <div className="clinical-info mt-2">
                                  {selectedConversation.lastMessage.aiClassification.symptoms && (
                                    <div className="mb-1">
                                      <small className="text-warning fw-bold">Symptoms: </small>
                                      <small>{selectedConversation.lastMessage.aiClassification.symptoms.join(', ')}</small>
                                    </div>
                                  )}
                                  {selectedConversation.lastMessage.aiClassification.diagnosis && (
                                    <div>
                                      <small className="text-info fw-bold">Diagnosis: </small>
                                      <small>{selectedConversation.lastMessage.aiClassification.diagnosis.join(', ')}</small>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="chat-profile-name">
                            <h6>
                              {selectedConversation.lastMessage.from}
                              <i className="ti ti-circle-filled fs-7 mx-2" />
                              <span className="chat-time">{formatTimeAgo(selectedConversation.lastMessage.timestamp)}</span>
                              {selectedConversation.lastMessage.aiClassification.actionRequired && (
                                <span className="badge bg-warning ms-2 fs-10">Medical Action Required</span>
                              )}
                              {selectedConversation.lastMessage.consultationType && (
                                <span className="badge bg-info ms-2 fs-10">{selectedConversation.lastMessage.consultationType}</span>
                              )}
                            </h6>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Medical Message Input */}
                  <div className="chat-footer border-top p-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <div className="input-group">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Type your medical response..."
                          />
                          <button className="btn btn-outline-secondary" type="button">
                            <i className="ti ti-microphone"></i>
                          </button>
                          <button className="btn btn-outline-secondary" type="button">
                            <i className="ti ti-paperclip"></i>
                          </button>
                          <button className="btn btn-outline-info" type="button" title="Quick Medical Templates">
                            <i className="ti ti-stethoscope"></i>
                          </button>
                          <button className="btn btn-primary" type="button">
                            <i className="ti ti-send"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Medical AI Suggestions */}
                    {selectedConversation.lastMessage.aiClassification.actionRequired && (
                      <div className="medical-suggestions mt-2">
                        <small className="text-muted">Medical AI Suggested Responses:</small>
                        <div className="d-flex gap-2 mt-1">
                          <button className="btn btn-outline-danger btn-sm">
                            "On my way - ETA 2 minutes"
                          </button>
                          <button className="btn btn-outline-warning btn-sm">
                            "Need more information about vitals"
                          </button>
                          <button className="btn btn-outline-success btn-sm">
                            "Will review immediately"
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Medical Actions */}
                    <div className="quick-medical-actions mt-2">
                      <div className="d-flex gap-2">
                        <button className="btn btn-outline-primary btn-sm">
                          <i className="ti ti-calendar me-1"></i>
                          Schedule
                        </button>
                        <button className="btn btn-outline-info btn-sm">
                          <i className="ti ti-pill me-1"></i>
                          Prescribe
                        </button>
                        <button className="btn btn-outline-success btn-sm">
                          <i className="ti ti-test-pipe me-1"></i>
                          Order Lab
                        </button>
                        <button className="btn btn-outline-warning btn-sm">
                          <i className="ti ti-user-check me-1"></i>
                          Consult
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center">
                    <i className="ti ti-stethoscope fs-48 text-muted mb-3"></i>
                    <h5 className="text-muted">Select a medical conversation</h5>
                    <p className="text-muted">AI will help prioritize and categorize your medical communications</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorAIEnhancedMessages;
