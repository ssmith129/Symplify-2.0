import { Link } from "react-router";
import { useState, useEffect, useMemo } from "react";
import ImageWithBasePath from "../../../../../core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";

interface DoctorEmailMessage {
  id: string;
  from: string;
  subject: string;
  preview: string;
  timestamp: Date;
  isRead: boolean;
  avatar?: string;
  priority: 'life-threatening' | 'urgent' | 'routine' | 'administrative';
  medicalCategory: 'patient-emergency' | 'patient-care' | 'lab-results' | 'radiology' | 'consultation' | 'administrative' | 'medication' | 'surgery';
  aiClassification: {
    confidence: number;
    medicalUrgency: number; // 1-5 scale
    clinicalRelevance: 'high' | 'medium' | 'low';
    actionRequired: boolean;
    responseTimeframe: string;
    medicalKeywords: string[];
    patientId?: string;
    department?: string;
    specialtyRelevance?: string[];
    riskLevel?: 'critical' | 'moderate' | 'low';
  };
  attachments?: number;
  patientData?: {
    id: string;
    name: string;
    age: number;
    condition?: string;
    vitals?: any;
  };
  complianceLevel: 'hipaa' | 'phi' | 'standard';
  consultationType?: 'emergency' | 'routine' | 'follow-up' | 'second-opinion';
}

interface DoctorEmailFilters {
  priority: 'all' | 'life-threatening' | 'urgent' | 'routine' | 'administrative';
  medicalCategory: 'all' | 'patient-emergency' | 'patient-care' | 'lab-results' | 'radiology' | 'consultation' | 'administrative' | 'medication' | 'surgery';
  clinicalRelevance: 'all' | 'high' | 'medium' | 'low';
  timeRange: 'today' | 'week' | 'month';
  specialty: 'all' | 'cardiology' | 'emergency' | 'surgery' | 'internal-medicine' | 'radiology';
  patientRelated: boolean;
  actionRequired: boolean;
}

const DoctorAIEnhancedEmail = () => {
  const [showMore, setShowMore] = useState(false);
  // const [showMore2, setShowMore2] = useState(false);
  // const [showMore3, setShowMore3] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [emails, setEmails] = useState<DoctorEmailMessage[]>([]);
  const [filters, setFilters] = useState<DoctorEmailFilters>({
    priority: 'all',
    medicalCategory: 'all',
    clinicalRelevance: 'all',
    timeRange: 'today',
    specialty: 'all',
    patientRelated: false,
    actionRequired: false
  });
  const [doctorProfile] = useState({
    name: "Dr. Sarah Chen",
    specialty: "Cardiology",
    department: "Internal Medicine",
    email: "s.chen@hospital.com"
  });
  const [medicalInsights, setMedicalInsights] = useState({
    totalEmails: 0,
    lifeThreatening: 0,
    patientEmails: 0,
    avgResponseTime: '12m',
    pendingConsultations: 0,
    criticalLabs: 0
  });

  // Mock doctor-specific email data
  const mockDoctorEmails: DoctorEmailMessage[] = [
    {
      id: "doc-email-1",
      from: "Emergency Department",
      subject: "STAT Consult - Cardiac Event in ER",
      preview: "58-year-old male presenting with chest pain, ST elevation on EKG. BP 180/110, HR 125. Requesting immediate cardiology consultation for suspected STEMI.",
      timestamp: new Date(Date.now() - 3 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/icons/emergency-icon.svg",
      priority: 'life-threatening',
      medicalCategory: 'patient-emergency',
      aiClassification: {
        confidence: 0.98,
        medicalUrgency: 5,
        clinicalRelevance: 'high',
        actionRequired: true,
        responseTimeframe: "Immediate (< 5 minutes)",
        medicalKeywords: ["STEMI", "cardiac", "ST-elevation", "chest-pain", "emergency"],
        patientId: "PT-58291",
        department: "emergency",
        specialtyRelevance: ["cardiology", "emergency"],
        riskLevel: 'critical'
      },
      attachments: 3,
      patientData: {
        id: "PT-58291",
        name: "Robert Johnson",
        age: 58,
        condition: "Suspected STEMI",
        vitals: { bp: "180/110", hr: 125, temp: "98.6°F" }
      },
      complianceLevel: 'hipaa',
      consultationType: 'emergency'
    },
    {
      id: "doc-email-2",
      from: "Lab Department - Critical Results",
      subject: "CRITICAL: Troponin Levels - Patient Martinez",
      preview: "Troponin I: 45.2 ng/mL (Normal: <0.04). Patient Elena Martinez showing significant cardiac enzyme elevation. Previous EKG shows Q waves in leads II, III, aVF.",
      timestamp: new Date(Date.now() - 8 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/icons/lab-icon.svg",
      priority: 'life-threatening',
      medicalCategory: 'lab-results',
      aiClassification: {
        confidence: 0.96,
        medicalUrgency: 5,
        clinicalRelevance: 'high',
        actionRequired: true,
        responseTimeframe: "Within 15 minutes",
        medicalKeywords: ["troponin", "cardiac-enzymes", "myocardial-infarction", "critical-values"],
        patientId: "PT-42078",
        department: "laboratory",
        specialtyRelevance: ["cardiology", "internal-medicine"],
        riskLevel: 'critical'
      },
      attachments: 2,
      patientData: {
        id: "PT-42078",
        name: "Elena Martinez",
        age: 62,
        condition: "Elevated Cardiac Enzymes"
      },
      complianceLevel: 'hipaa',
      consultationType: 'emergency'
    },
    {
      id: "doc-email-3",
      from: "Dr. Michael Roberts - Surgery",
      subject: "Pre-operative Clearance Request",
      preview: "67-year-old female scheduled for elective coronary bypass surgery. History of diabetes, hypertension. Requesting cardiology clearance and optimization before procedure.",
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/doctors/doctor-07.jpg",
      priority: 'urgent',
      medicalCategory: 'consultation',
      aiClassification: {
        confidence: 0.92,
        medicalUrgency: 4,
        clinicalRelevance: 'high',
        actionRequired: true,
        responseTimeframe: "Within 4 hours",
        medicalKeywords: ["pre-operative", "cardiac-clearance", "coronary-bypass", "diabetes", "hypertension"],
        patientId: "PT-67043",
        department: "surgery",
        specialtyRelevance: ["cardiology", "surgery"],
        riskLevel: 'moderate'
      },
      patientData: {
        id: "PT-67043",
        name: "Margaret Williams",
        age: 67,
        condition: "Pre-op for CABG"
      },
      complianceLevel: 'hipaa',
      consultationType: 'routine'
    },
    {
      id: "doc-email-4",
      from: "Radiology Department",
      subject: "Urgent Echo Results - Possible PE",
      preview: "Echocardiogram shows right heart strain pattern. Patient presented with shortness of breath and chest pain. D-dimer elevated at 2.4. Recommend urgent CT-PA.",
      timestamp: new Date(Date.now() - 35 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/icons/radiology-icon.svg",
      priority: 'urgent',
      medicalCategory: 'radiology',
      aiClassification: {
        confidence: 0.94,
        medicalUrgency: 4,
        clinicalRelevance: 'high',
        actionRequired: true,
        responseTimeframe: "Within 1 hour",
        medicalKeywords: ["pulmonary-embolism", "echo", "right-heart-strain", "d-dimer", "ct-pa"],
        patientId: "PT-29847",
        department: "radiology",
        specialtyRelevance: ["cardiology", "emergency", "internal-medicine"],
        riskLevel: 'critical'
      },
      attachments: 1,
      patientData: {
        id: "PT-29847",
        name: "James Thompson",
        age: 45,
        condition: "Suspected PE"
      },
      complianceLevel: 'hipaa',
      consultationType: 'emergency'
    },
    {
      id: "doc-email-5",
      from: "Pharmacy - Drug Interaction Alert",
      subject: "Drug Interaction Warning - Patient Chen",
      preview: "Potential serious interaction detected: Warfarin + Amiodarone. Patient's INR may become dangerously elevated. Recommend immediate coagulation monitoring.",
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/icons/pharmacy-icon.svg",
      priority: 'urgent',
      medicalCategory: 'medication',
      aiClassification: {
        confidence: 0.91,
        medicalUrgency: 4,
        clinicalRelevance: 'high',
        actionRequired: true,
        responseTimeframe: "Within 2 hours",
        medicalKeywords: ["drug-interaction", "warfarin", "amiodarone", "inr", "anticoagulation"],
        patientId: "PT-19203",
        department: "pharmacy",
        specialtyRelevance: ["cardiology", "internal-medicine"],
        riskLevel: 'moderate'
      },
      patientData: {
        id: "PT-19203",
        name: "Lisa Chen",
        age: 73,
        condition: "Drug Interaction Risk"
      },
      complianceLevel: 'hipaa'
    },
    {
      id: "doc-email-6",
      from: "Patient Portal - Sarah Johnson",
      subject: "Follow-up Question - Post Procedure",
      preview: "Dr. Chen, I had my cardiac catheterization yesterday. I'm experiencing some chest discomfort and wondering if this is normal. Should I be concerned?",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isRead: false,
      avatar: "assets/img/profiles/avatar-14.jpg",
      priority: 'routine',
      medicalCategory: 'patient-care',
      aiClassification: {
        confidence: 0.87,
        medicalUrgency: 3,
        clinicalRelevance: 'medium',
        actionRequired: true,
        responseTimeframe: "Within 24 hours",
        medicalKeywords: ["post-procedure", "chest-discomfort", "cardiac-catheterization", "follow-up"],
        patientId: "PT-34892",
        department: "cardiology",
        specialtyRelevance: ["cardiology"],
        riskLevel: 'low'
      },
      patientData: {
        id: "PT-34892",
        name: "Sarah Johnson",
        age: 56,
        condition: "Post Cardiac Cath"
      },
      complianceLevel: 'hipaa',
      consultationType: 'follow-up'
    },
    {
      id: "doc-email-7",
      from: "Administration - CME Credits",
      subject: "Continuing Medical Education Reminder",
      preview: "Reminder: 15 CME credits required by December 31st. You currently have 8 credits completed. Upcoming cardiology conferences available for registration.",
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      isRead: true,
      avatar: "assets/img/icons/education-icon.svg",
      priority: 'administrative',
      medicalCategory: 'administrative',
      aiClassification: {
        confidence: 0.85,
        medicalUrgency: 1,
        clinicalRelevance: 'low',
        actionRequired: false,
        responseTimeframe: "Within 1 week",
        medicalKeywords: ["cme", "continuing-education", "cardiology", "conference"],
        department: "administration",
        specialtyRelevance: ["cardiology"]
      },
      complianceLevel: 'standard'
    }
  ];

  useEffect(() => {
    setEmails(mockDoctorEmails);
    
    // Calculate medical insights
    setMedicalInsights({
      totalEmails: mockDoctorEmails.length,
      lifeThreatening: mockDoctorEmails.filter(e => e.priority === 'life-threatening').length,
      patientEmails: mockDoctorEmails.filter(e => e.patientData).length,
      avgResponseTime: '12m',
      pendingConsultations: mockDoctorEmails.filter(e => e.consultationType && !e.isRead).length,
      criticalLabs: mockDoctorEmails.filter(e => e.medicalCategory === 'lab-results' && e.priority === 'life-threatening').length
    });
  }, []);

  // Filter emails based on medical criteria
  const filteredEmails = useMemo(() => {
    return emails.filter(email => {
      if (filters.priority !== 'all' && email.priority !== filters.priority) return false;
      if (filters.medicalCategory !== 'all' && email.medicalCategory !== filters.medicalCategory) return false;
      if (filters.clinicalRelevance !== 'all' && email.aiClassification.clinicalRelevance !== filters.clinicalRelevance) return false;
      if (filters.patientRelated && !email.patientData) return false;
      if (filters.actionRequired && !email.aiClassification.actionRequired) return false;
      
      return true;
    }).sort((a, b) => {
      // Sort by medical urgency first, then by timestamp
      if (a.aiClassification.medicalUrgency !== b.aiClassification.medicalUrgency) {
        return b.aiClassification.medicalUrgency - a.aiClassification.medicalUrgency;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [emails, filters]);

  const handleToggle = () => setShowMore(prev => !prev);
  // const handleToggle2 = () => setShowMore2(prev => !prev);
  // const handleToggle3 = () => setShowMore3(prev => !prev);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'life-threatening': return 'danger';
      case 'urgent': return 'warning';
      case 'routine': return 'info';
      case 'administrative': return 'secondary';
      default: return 'secondary';
    }
  };

  const getMedicalCategoryIcon = (category: string) => {
    switch (category) {
      case 'patient-emergency': return 'ti ti-emergency-bed';
      case 'patient-care': return 'ti ti-stethoscope';
      case 'lab-results': return 'ti ti-test-pipe';
      case 'radiology': return 'ti ti-scan';
      case 'consultation': return 'ti ti-user-check';
      case 'medication': return 'ti ti-pill';
      case 'surgery': return 'ti ti-cut';
      case 'administrative': return 'ti ti-file-text';
      default: return 'ti ti-mail';
    }
  };

  const getRiskLevelColor = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'critical': return 'danger';
      case 'moderate': return 'warning';
      case 'low': return 'success';
      default: return 'secondary';
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
            {/* Doctor Email Sidebar */}
            <div className="email-sidebar border-end border-bottom">
              <div className="slimScrollDiv">
                <div className="active slimscroll">
                  <div className="slimscroll-active-sidebar">
                    <div className="p-3">
                      {/* Medical AI Triage Header */}
                      <div className="medical-triage-header bg-primary-transparent rounded p-3 mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <div className="d-flex align-items-center">
                            <i className="ti ti-stethoscope text-primary fs-20 me-2"></i>
                            <h6 className="mb-0 fw-bold text-primary">Medical AI Triage</h6>
                          </div>
                          <span className="badge bg-success rounded-pill fs-10">Active</span>
                        </div>
                        <div className="row g-2 text-center">
                          <div className="col-4">
                            <div className="medical-metric">
                              <h6 className="mb-0 fw-bold text-danger">{medicalInsights.lifeThreatening}</h6>
                              <small className="text-muted">Life-Threatening</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="medical-metric">
                              <h6 className="mb-0 fw-bold text-warning">{medicalInsights.pendingConsultations}</h6>
                              <small className="text-muted">Consultations</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="medical-metric">
                              <h6 className="mb-0 fw-bold text-info">{medicalInsights.criticalLabs}</h6>
                              <small className="text-muted">Critical Labs</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Doctor Profile */}
                      <div className="border bg-white rounded p-2 mb-3">
                        <div className="d-flex align-items-center">
                          <Link to="#" className="avatar avatar-md flex-shrink-0 me-2">
                            <ImageWithBasePath
                              src="assets/img/doctors/doctor-02.jpg"
                              className="rounded-circle"
                              alt="Doctor"
                            />
                          </Link>
                          <div>
                            <h6 className="mb-1 fs-16 fw-medium">
                              <Link to="#">{doctorProfile.name}</Link>
                            </h6>
                            <p className="fs-14">{doctorProfile.specialty} • {doctorProfile.email}</p>
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
                        New Consultation
                      </Link>

                      {/* Medical Folders */}
                      <div className="mt-4">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h5 className="mb-0">Medical Categories</h5>
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
                              <i className="ti ti-stethoscope text-primary me-2" />
                              Medical Inbox
                            </span>
                            <span className="badge badge-danger bg-danger rounded-pill badge-xs">
                              {filteredEmails.filter(e => !e.isRead).length}
                            </span>
                          </Link>
                          
                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-emergency-bed text-danger me-2" />
                              Life-Threatening
                            </span>
                            <span className="badge bg-danger-transparent text-danger rounded-pill">
                              {emails.filter(e => e.priority === 'life-threatening').length}
                            </span>
                          </Link>

                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-user text-primary me-2" />
                              Patient Care
                            </span>
                            <span className="fw-semibold fs-12 rounded-pill">
                              {emails.filter(e => e.patientData).length}
                            </span>
                          </Link>

                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-test-pipe text-warning me-2" />
                              Lab Results
                            </span>
                            <span className="rounded-pill">
                              {emails.filter(e => e.medicalCategory === 'lab-results').length}
                            </span>
                          </Link>

                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-user-check text-info me-2" />
                              Consultations
                            </span>
                            <span className="rounded-pill">
                              {emails.filter(e => e.medicalCategory === 'consultation').length}
                            </span>
                          </Link>

                          {/* Regular folders */}
                          <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                            <span className="d-flex align-items-center fw-medium">
                              <i className="ti ti-star text-gray me-2" />
                              Starred
                            </span>
                            <span className="fw-semibold fs-12 rounded-pill">12</span>
                          </Link>

                          <div>
                            <div className="more-menu" style={{ display: showMore ? 'block' : 'none', marginTop: '10px' }}>
                              <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                                <span className="d-flex align-items-center fw-medium">
                                  <i className="ti ti-rocket text-gray me-2" />
                                  Sent
                                </span>
                                <span className="rounded-pill">24</span>
                              </Link>
                              <Link to="#" className="d-flex align-items-center justify-content-between p-2 rounded">
                                <span className="d-flex align-items-center fw-medium">
                                  <i className="ti ti-file text-gray me-2" />
                                  Drafts
                                </span>
                                <span className="rounded-pill">8</span>
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

                      {/* Medical Specialties */}
                      <div className="border-bottom mb-3 pb-3">
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h5>Specialties</h5>
                        </div>
                        <div>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-heart text-danger me-2" />
                            Cardiology
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-emergency-bed text-warning me-2" />
                            Emergency
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-cut text-success me-2" />
                            Surgery
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-scan text-skyblue me-2" />
                            Radiology
                          </Link>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div>
                        <div className="d-flex align-items-center justify-content-between mb-2">
                          <h5>Quick Actions</h5>
                        </div>
                        <div>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-calendar text-primary me-2" />
                            Patient Schedule
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-notes text-info me-2" />
                            Medical Notes
                          </Link>
                          <Link to="#" className="fw-medium d-flex align-items-center text-dark py-1">
                            <i className="ti ti-pill text-warning me-2" />
                            Prescriptions
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Medical Email List */}
            <div className="bg-white flex-fill border-end border-bottom mail-notifications">
              <div className="slimScrollDiv">
                <div className="active slimscroll">
                  <div className="slimscroll-active-sidebar">
                    {/* Enhanced Header */}
                    <div className="p-3 border-bottom">
                      <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3 mb-3">
                        <div>
                          <h5 className="mb-1 d-flex align-items-center">
                            <i className="ti ti-stethoscope text-primary me-2"></i>
                            Medical AI Inbox
                          </h5>
                          <div className="d-flex align-items-center">
                            <span>{filteredEmails.length} Medical Communications</span>
                            <i className="ti ti-point-filled text-primary mx-1" />
                            <span>{filteredEmails.filter(e => !e.isRead).length} Unread</span>
                            <i className="ti ti-point-filled text-primary mx-1" />
                            <span className="text-success">{medicalInsights.patientEmails} Patient Related</span>
                          </div>
                        </div>
                        
                        <div className="d-flex align-items-center gap-2">
                          <div className="position-relative input-icon">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Search patients, conditions..."
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-search" />
                            </span>
                          </div>
                          
                          <div className="dropdown">
                            <button className="btn btn-outline-primary btn-sm" data-bs-toggle="dropdown">
                              <i className="ti ti-filter me-1"></i>
                              Medical Filters
                            </button>
                            <div className="dropdown-menu dropdown-menu-end p-3" style={{ minWidth: '320px' }}>
                              <h6 className="mb-3">Medical Filtering Options</h6>
                              
                              <div className="mb-3">
                                <label className="form-label">Priority Level</label>
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

                              <div className="mb-3">
                                <label className="form-label">Medical Category</label>
                                <select 
                                  className="form-select form-select-sm"
                                  value={filters.medicalCategory}
                                  onChange={(e) => setFilters(prev => ({ ...prev, medicalCategory: e.target.value as any }))}
                                >
                                  <option value="all">All Categories</option>
                                  <option value="patient-emergency">Patient Emergency</option>
                                  <option value="patient-care">Patient Care</option>
                                  <option value="lab-results">Lab Results</option>
                                  <option value="radiology">Radiology</option>
                                  <option value="consultation">Consultation</option>
                                  <option value="medication">Medication</option>
                                  <option value="surgery">Surgery</option>
                                  <option value="administrative">Administrative</option>
                                </select>
                              </div>

                              <div className="mb-3">
                                <label className="form-label">Clinical Relevance</label>
                                <select 
                                  className="form-select form-select-sm"
                                  value={filters.clinicalRelevance}
                                  onChange={(e) => setFilters(prev => ({ ...prev, clinicalRelevance: e.target.value as any }))}
                                >
                                  <option value="all">All Relevance</option>
                                  <option value="high">High Relevance</option>
                                  <option value="medium">Medium Relevance</option>
                                  <option value="low">Low Relevance</option>
                                </select>
                              </div>

                              <div className="row g-2">
                                <div className="col-6">
                                  <div className="form-check">
                                    <input 
                                      className="form-check-input" 
                                      type="checkbox" 
                                      checked={filters.patientRelated}
                                      onChange={(e) => setFilters(prev => ({ ...prev, patientRelated: e.target.checked }))}
                                    />
                                    <label className="form-check-label">
                                      Patient Related Only
                                    </label>
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="form-check">
                                    <input 
                                      className="form-check-input" 
                                      type="checkbox" 
                                      checked={filters.actionRequired}
                                      onChange={(e) => setFilters(prev => ({ ...prev, actionRequired: e.target.checked }))}
                                    />
                                    <label className="form-check-label">
                                      Action Required
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {selectedEmails.size > 0 && (
                            <div className="btn-group">
                              <button className="btn btn-primary btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                                Medical Actions ({selectedEmails.size})
                              </button>
                              <ul className="dropdown-menu">
                                <li><button className="dropdown-item" onClick={() => handleBulkAction('consult')}>Request Consultation</button></li>
                                <li><button className="dropdown-item" onClick={() => handleBulkAction('priority')}>Update Priority</button></li>
                                <li><button className="dropdown-item" onClick={() => handleBulkAction('patient-chart')}>Add to Patient Chart</button></li>
                                <li><hr className="dropdown-divider" /></li>
                                <li><button className="dropdown-item" onClick={() => handleBulkAction('archive')}>Archive Selected</button></li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Medical Insights Bar */}
                      <div className="medical-insights-bar bg-light rounded p-2">
                        <div className="row g-2 text-center">
                          <div className="col-3">
                            <small className="text-muted d-block">Avg Response</small>
                            <span className="fw-bold text-info">{medicalInsights.avgResponseTime}</span>
                          </div>
                          <div className="col-3">
                            <small className="text-muted d-block">Patient Emails</small>
                            <span className="fw-bold text-success">{medicalInsights.patientEmails}</span>
                          </div>
                          <div className="col-3">
                            <small className="text-muted d-block">Consultations</small>
                            <span className="fw-bold text-warning">{medicalInsights.pendingConsultations}</span>
                          </div>
                          <div className="col-3">
                            <small className="text-muted d-block">AI Medical</small>
                            <span className="fw-bold text-success">
                              <i className="ti ti-check-circle"></i>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Medical Email List */}
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
                                {/* Medical urgency indicator */}
                                <span 
                                  className={`position-absolute top-0 start-100 translate-middle badge bg-${getPriorityColor(email.priority)} rounded-pill`}
                                  style={{ fontSize: '8px', padding: '2px 4px' }}
                                >
                                  {email.aiClassification.medicalUrgency}
                                </span>
                              </Link>
                              
                              <div className="flex-fill">
                                <div className="d-flex align-items-start justify-content-between">
                                  <div className="flex-grow-1">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                      <h6 className="mb-0">
                                        <Link to={all_routes.EmailReply}>{email.from}</Link>
                                      </h6>
                                      
                                      {/* Medical Priority Badge */}
                                      <span className={`badge bg-${getPriorityColor(email.priority)}-transparent text-${getPriorityColor(email.priority)} text-uppercase fs-10`}>
                                        {email.priority.replace('-', ' ')}
                                      </span>
                                      
                                      {/* Medical Category */}
                                      <span className="badge bg-light text-dark fs-10">
                                        <i className={`${getMedicalCategoryIcon(email.medicalCategory)} me-1`}></i>
                                        {email.medicalCategory.replace('-', ' ')}
                                      </span>
                                      
                                      {/* Risk Level */}
                                      {email.aiClassification.riskLevel && (
                                        <span className={`badge bg-${getRiskLevelColor(email.aiClassification.riskLevel)}-transparent text-${getRiskLevelColor(email.aiClassification.riskLevel)} fs-10`}>
                                          <i className="ti ti-shield me-1"></i>
                                          {email.aiClassification.riskLevel}
                                        </span>
                                      )}
                                      
                                      {/* Action Required */}
                                      {email.aiClassification.actionRequired && (
                                        <span className="badge bg-warning-transparent text-warning fs-10">
                                          <i className="ti ti-clock me-1"></i>
                                          Action Required
                                        </span>
                                      )}
                                      
                                      {/* Patient Related */}
                                      {email.patientData && (
                                        <span className="badge bg-info-transparent text-info fs-10">
                                          <i className="ti ti-user me-1"></i>
                                          Patient: {email.patientData.name}
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
                                        <li><Link className="dropdown-item rounded-1" to="#">Quick Reply</Link></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Consult Colleague</Link></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Add to Patient Chart</Link></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Schedule Follow-up</Link></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Override AI Priority</Link></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Medical AI Training</Link></li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li><Link className="dropdown-item rounded-1" to="#">Archive</Link></li>
                                      </ul>
                                    </div>
                                    <span className="text-muted fs-12">
                                      <i className={`ti ti-point-filled text-${getPriorityColor(email.priority)}`} />
                                      {formatTimeAgo(email.timestamp)}
                                    </span>
                                  </div>
                                </div>
                                
                                <p className="mb-1 text-muted fs-14">{email.preview}</p>
                                
                                {/* Medical AI Insights */}
                                <div className="medical-email-insights mt-2">
                                  <div className="d-flex align-items-center justify-content-between">
                                    <div className="d-flex align-items-center gap-2">
                                      {email.attachments && (
                                        <span className="d-flex align-items-center btn btn-sm bg-transparent-dark">
                                          <i className="ti ti-paperclip me-1" />
                                          {email.attachments}
                                        </span>
                                      )}
                                      
                                      {/* Consultation Type */}
                                      {email.consultationType && (
                                        <span className="badge bg-purple-transparent text-purple fs-10">
                                          <i className="ti ti-user-check me-1"></i>
                                          {email.consultationType}
                                        </span>
                                      )}
                                    </div>
                                    
                                    <div className="d-flex align-items-center gap-2">
                                      <small className="text-muted fs-10">
                                        Clinical Relevance: {email.aiClassification.clinicalRelevance}
                                      </small>
                                      <small className="text-muted fs-10">
                                        Response: {email.aiClassification.responseTimeframe}
                                      </small>
                                      <span className={`badge bg-${email.complianceLevel === 'hipaa' ? 'success' : 'secondary'}-transparent text-${email.complianceLevel === 'hipaa' ? 'success' : 'secondary'} fs-10`}>
                                        {email.complianceLevel.toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Medical Keywords */}
                                  {email.aiClassification.medicalKeywords.length > 0 && (
                                    <div className="d-flex gap-1 mt-1 flex-wrap">
                                      {email.aiClassification.medicalKeywords.slice(0, 4).map((keyword, index) => (
                                        <span key={`${email.id}-medical-tag-${index}`} className="badge bg-light text-dark fs-10">
                                          {keyword}
                                        </span>
                                      ))}
                                      {email.aiClassification.medicalKeywords.length > 4 && (
                                        <span className="badge bg-light text-muted fs-10">
                                          +{email.aiClassification.medicalKeywords.length - 4} more
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Patient Information */}
                                  {email.patientData && (
                                    <div className="patient-info-card bg-info-transparent rounded p-2 mt-2">
                                      <div className="d-flex justify-content-between align-items-center">
                                        <div>
                                          <small className="fw-bold text-info">Patient: {email.patientData.name}</small>
                                          <div className="d-flex gap-3 mt-1">
                                            <small>Age: {email.patientData.age}</small>
                                            {email.patientData.condition && (
                                              <small>Condition: {email.patientData.condition}</small>
                                            )}
                                          </div>
                                        </div>
                                        {email.patientData.vitals && (
                                          <div className="text-end">
                                            <small className="text-muted d-block">Vitals</small>
                                            <small>BP: {email.patientData.vitals.bp}</small>
                                            {email.patientData.vitals.hr && (
                                              <small className="ms-2">HR: {email.patientData.vitals.hr}</small>
                                            )}
                                          </div>
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

export default DoctorAIEnhancedEmail;
