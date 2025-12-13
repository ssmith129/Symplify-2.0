import React, { useState, useEffect } from 'react';
import { Badge, Tooltip, Modal } from 'antd';
import type { ProcessedNotification } from '../../../../../../core/services/ai-notification-service';

interface FlagConfig {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
  criteria: {
    priority?: number[];
    categories?: string[];
    keywords?: string[];
    confidence?: number;
    riskLevel?: string[];
    timeThreshold?: number; // minutes
  };
  animations?: {
    pulse?: boolean;
    glow?: boolean;
    shake?: boolean;
  };
  sound?: string;
  visualEffects?: {
    borderStyle?: string;
    backgroundColor?: string;
    textColor?: string;
    iconEffect?: string;
  };
}

interface VisualFlagsProps {
  notification: ProcessedNotification;
  compact?: boolean;
  showTooltips?: boolean;
  customFlags?: FlagConfig[];
  onFlagClick?: (flag: FlagConfig, notification: ProcessedNotification) => void;
  size?: 'small' | 'medium' | 'large';
}

const AIVisualFlags: React.FC<VisualFlagsProps> = ({
  notification,
  compact = false,
  showTooltips = true,
  customFlags = [],
  onFlagClick,
  size = 'medium'
}) => {
  const [activeFlags, setActiveFlags] = useState<FlagConfig[]>([]);
  const [showFlagDetails, setShowFlagDetails] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<FlagConfig | null>(null);

  // Default flag configurations
  const defaultFlags: FlagConfig[] = useMemo(() => [
    {
      id: 'emergency',
      name: 'Emergency',
      color: '#dc3545',
      icon: 'ti ti-alert-triangle-filled',
      description: 'Life-threatening emergency requiring immediate action',
      criteria: {
        priority: [5],
        categories: ['critical'],
        keywords: ['emergency', 'code blue', 'cardiac arrest', 'stat', 'urgent'],
        confidence: 0.9
      },
      animations: {
        pulse: true,
        glow: true,
        shake: true
      },
      sound: 'emergency-alert.mp3',
      visualEffects: {
        borderStyle: '3px solid #dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        textColor: '#dc3545',
        iconEffect: 'bounce'
      }
    },
    {
      id: 'urgent',
      name: 'Urgent',
      color: '#fd7e14',
      icon: 'ti ti-exclamation-circle',
      description: 'High priority requiring prompt attention',
      criteria: {
        priority: [4],
        categories: ['important'],
        keywords: ['urgent', 'asap', 'priority', 'critical'],
        confidence: 0.8
      },
      animations: {
        pulse: true,
        glow: false,
        shake: false
      },
      visualEffects: {
        borderStyle: '2px solid #fd7e14',
        backgroundColor: 'rgba(253, 126, 20, 0.1)',
        textColor: '#fd7e14',
        iconEffect: 'pulse'
      }
    },
    {
      id: 'time-sensitive',
      name: 'Time Sensitive',
      color: '#ffc107',
      icon: 'ti ti-clock-alert',
      description: 'Action required within specific timeframe',
      criteria: {
        timeThreshold: 60, // 1 hour
        keywords: ['deadline', 'schedule', 'appointment', 'surgery']
      },
      animations: {
        pulse: false,
        glow: true,
        shake: false
      },
      visualEffects: {
        borderStyle: '2px dashed #ffc107',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        textColor: '#ffc107',
        iconEffect: 'rotate'
      }
    },
    {
      id: 'high-confidence',
      name: 'AI Verified',
      color: '#198754',
      icon: 'ti ti-shield-check',
      description: 'High AI confidence in categorization',
      criteria: {
        confidence: 0.95
      },
      animations: {
        pulse: false,
        glow: false,
        shake: false
      },
      visualEffects: {
        borderStyle: '1px solid #198754',
        backgroundColor: 'rgba(25, 135, 84, 0.05)',
        textColor: '#198754',
        iconEffect: 'none'
      }
    },
    {
      id: 'medical',
      name: 'Medical',
      color: '#0dcaf0',
      icon: 'ti ti-stethoscope',
      description: 'Medical-related notification',
      criteria: {
        categories: ['medical'],
        keywords: ['patient', 'doctor', 'surgery', 'lab', 'medication', 'vitals']
      },
      visualEffects: {
        borderStyle: '1px solid #0dcaf0',
        backgroundColor: 'rgba(13, 202, 240, 0.05)',
        textColor: '#0dcaf0',
        iconEffect: 'none'
      }
    },
    {
      id: 'administrative',
      name: 'Administrative',
      color: '#6c757d',
      icon: 'ti ti-file-text',
      description: 'Administrative or system notification',
      criteria: {
        categories: ['informational'],
        keywords: ['system', 'admin', 'policy', 'announcement']
      },
      visualEffects: {
        borderStyle: '1px solid #6c757d',
        backgroundColor: 'rgba(108, 117, 125, 0.05)',
        textColor: '#6c757d',
        iconEffect: 'none'
      }
    },
    {
      id: 'action-required',
      name: 'Action Required',
      color: '#6f42c1',
      icon: 'ti ti-checklist',
      description: 'Requires user action or response',
      criteria: {
        keywords: ['approve', 'confirm', 'review', 'accept', 'decline', 'respond']
      },
      animations: {
        pulse: true
      },
      visualEffects: {
        borderStyle: '2px solid #6f42c1',
        backgroundColor: 'rgba(111, 66, 193, 0.1)',
        textColor: '#6f42c1',
        iconEffect: 'bounce'
      }
    },
    {
      id: 'patient-critical',
      name: 'Patient Critical',
      color: '#e91e63',
      icon: 'ti ti-heart-rate-monitor',
      description: 'Critical patient condition',
      criteria: {
        keywords: ['critical condition', 'deteriorating', 'unstable', 'intensive care']
      },
      animations: {
        pulse: true,
        glow: true
      },
      sound: 'patient-alert.mp3',
      visualEffects: {
        borderStyle: '3px solid #e91e63',
        backgroundColor: 'rgba(233, 30, 99, 0.1)',
        textColor: '#e91e63',
        iconEffect: 'heartbeat'
      }
    }
  ], []);

  // Combine default and custom flags
  const allFlags = useMemo(() => [...defaultFlags, ...customFlags], [defaultFlags, customFlags]);

  // Determine which flags apply to this notification
  useEffect(() => {
    const applicableFlags = allFlags.filter(flag => {
      const { criteria } = flag;
      
      // Check priority
      if (criteria.priority && !criteria.priority.includes(notification.aiPriority)) {
        return false;
      }
      
      // Check categories
      if (criteria.categories && !criteria.categories.includes(notification.aiCategory)) {
        return false;
      }
      
      // Check confidence
      if (criteria.confidence && notification.confidence < criteria.confidence) {
        return false;
      }
      
      // Check keywords
      if (criteria.keywords) {
        const messageText = `${notification.title} ${notification.message}`.toLowerCase();
        const hasKeyword = criteria.keywords.some(keyword => 
          messageText.includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }
      
      // Check time threshold
      if (criteria.timeThreshold) {
        const minutesSince = Math.floor((Date.now() - notification.timestamp.getTime()) / (1000 * 60));
        if (minutesSince > criteria.timeThreshold) {
          return false;
        }
      }
      
      return true;
    });
    
    setActiveFlags(applicableFlags);
  }, [notification, allFlags]);

  // Get size classes
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'flags-small';
      case 'large': return 'flags-large';
      default: return 'flags-medium';
    }
  };

  // Handle flag click
  const handleFlagClick = (flag: FlagConfig) => {
    if (onFlagClick) {
      onFlagClick(flag, notification);
    } else {
      setSelectedFlag(flag);
      setShowFlagDetails(true);
    }
  };

  // Get animation classes
  const getAnimationClasses = (flag: FlagConfig) => {
    const classes = [];
    if (flag.animations?.pulse) classes.push('flag-pulse');
    if (flag.animations?.glow) classes.push('flag-glow');
    if (flag.animations?.shake) classes.push('flag-shake');
    return classes.join(' ');
  };

  // Get visual effect styles
  const getVisualEffectStyles = (flag: FlagConfig) => {
    const styles: React.CSSProperties = {};
    if (flag.visualEffects?.backgroundColor) {
      styles.backgroundColor = flag.visualEffects.backgroundColor;
    }
    if (flag.visualEffects?.textColor) {
      styles.color = flag.visualEffects.textColor;
    }
    return styles;
  };

  if (activeFlags.length === 0) {
    return null;
  }

  return (
    <div className={`ai-visual-flags ${getSizeClass()} ${compact ? 'flags-compact' : ''}`}>
      {/* Flag Icons */}
      <div className="flag-icons d-flex align-items-center gap-1">
        {activeFlags.map((flag, _index) => {
          const flagElement = (
            <div
              key={flag.id}
              className={`flag-icon ${getAnimationClasses(flag)} ${flag.visualEffects?.iconEffect || ''}`}
              style={{
                color: flag.color,
                cursor: 'pointer',
                ...getVisualEffectStyles(flag)
              }}
              onClick={() => handleFlagClick(flag)}
            >
              <i className={`${flag.icon} fs-${size === 'large' ? '18' : size === 'small' ? '12' : '14'}`}></i>
              {!compact && size !== 'small' && (
                <span className="flag-label ms-1 fs-12 fw-medium d-none d-md-inline">
                  {flag.name}
                </span>
              )}
            </div>
          );

          return showTooltips ? (
            <Tooltip
              key={flag.id}
              title={
                <div>
                  <div className="fw-semibold mb-1">{flag.name}</div>
                  <div className="fs-12">{flag.description}</div>
                  {flag.criteria.confidence && (
                    <div className="fs-11 text-muted mt-1">
                      Min. Confidence: {Math.round(flag.criteria.confidence * 100)}%
                    </div>
                  )}
                </div>
              }
              placement="top"
            >
              {flagElement}
            </Tooltip>
          ) : (
            flagElement
          );
        })}
      </div>

      {/* Compact Badge Count */}
      {compact && activeFlags.length > 3 && (
        <Badge 
          count={`+${activeFlags.length - 3}`} 
          size="small"
          style={{ backgroundColor: '#6c757d' }}
        />
      )}

      {/* Flag Details Modal */}
      <Modal
        title={
          selectedFlag && (
            <div className="d-flex align-items-center">
              <i className={`${selectedFlag.icon} me-2`} style={{ color: selectedFlag.color }}></i>
              {selectedFlag.name}
            </div>
          )
        }
        open={showFlagDetails}
        onCancel={() => setShowFlagDetails(false)}
        footer={[
          <button key="close" className="btn btn-secondary" onClick={() => setShowFlagDetails(false)}>
            Close
          </button>
        ]}
        width={500}
      >
        {selectedFlag && (
          <div className="flag-details">
            <div className="mb-3">
              <h6 className="fw-semibold mb-2">Description</h6>
              <p className="text-muted">{selectedFlag.description}</p>
            </div>

            <div className="mb-3">
              <h6 className="fw-semibold mb-2">Criteria Met</h6>
              <ul className="list-unstyled">
                {selectedFlag.criteria.priority && (
                  <li>
                    <i className="ti ti-check-circle text-success me-2"></i>
                    Priority Level: {notification.aiPriority}
                  </li>
                )}
                {selectedFlag.criteria.categories && (
                  <li>
                    <i className="ti ti-check-circle text-success me-2"></i>
                    Category: {notification.aiCategory}
                  </li>
                )}
                {selectedFlag.criteria.confidence && (
                  <li>
                    <i className="ti ti-check-circle text-success me-2"></i>
                    AI Confidence: {Math.round(notification.confidence * 100)}%
                  </li>
                )}
                {selectedFlag.criteria.keywords && (
                  <li>
                    <i className="ti ti-check-circle text-success me-2"></i>
                    Contains relevant keywords
                  </li>
                )}
              </ul>
            </div>

            {selectedFlag.visualEffects && (
              <div className="mb-3">
                <h6 className="fw-semibold mb-2">Visual Effects</h6>
                <div 
                  className="visual-effect-preview p-3 rounded-3 border"
                  style={{
                    border: selectedFlag.visualEffects.borderStyle,
                    backgroundColor: selectedFlag.visualEffects.backgroundColor,
                    color: selectedFlag.visualEffects.textColor
                  }}
                >
                  <i className={`${selectedFlag.icon} me-2`}></i>
                  {selectedFlag.name} Flag Preview
                </div>
              </div>
            )}

            {(selectedFlag.animations?.pulse || selectedFlag.animations?.glow || selectedFlag.animations?.shake) && (
              <div className="mb-3">
                <h6 className="fw-semibold mb-2">Animations</h6>
                <div className="d-flex gap-2">
                  {selectedFlag.animations.pulse && (
                    <span className="badge bg-primary-transparent text-primary">Pulse</span>
                  )}
                  {selectedFlag.animations.glow && (
                    <span className="badge bg-warning-transparent text-warning">Glow</span>
                  )}
                  {selectedFlag.animations.shake && (
                    <span className="badge bg-danger-transparent text-danger">Shake</span>
                  )}
                </div>
              </div>
            )}

            {selectedFlag.sound && (
              <div className="mb-3">
                <h6 className="fw-semibold mb-2">Audio Alert</h6>
                <div className="d-flex align-items-center">
                  <i className="ti ti-volume me-2 text-info"></i>
                  <span className="text-muted">{selectedFlag.sound}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

// Flag Summary Component - shows all flags for a set of notifications
interface FlagSummaryProps {
  notifications: ProcessedNotification[];
  title?: string;
}

export const AIFlagSummary: React.FC<FlagSummaryProps> = ({
  notifications,
  title = "Flag Summary"
}) => {
  const [flagStats, setFlagStats] = useState<Record<string, number>>({});

  // Calculate flag statistics
  useEffect(() => {
    const stats: Record<string, number> = {};
    
    notifications.forEach(notification => {
      // This would typically use the same flag logic as above
      // For simplicity, we'll create basic stats based on notification properties
      
      if (notification.aiCategory === 'critical' || notification.aiPriority === 5) {
        stats['emergency'] = (stats['emergency'] || 0) + 1;
      }
      if (notification.aiCategory === 'important' || notification.aiPriority === 4) {
        stats['urgent'] = (stats['urgent'] || 0) + 1;
      }
      if (notification.confidence >= 0.95) {
        stats['high-confidence'] = (stats['high-confidence'] || 0) + 1;
      }
      if (notification.type === 'medical') {
        stats['medical'] = (stats['medical'] || 0) + 1;
      }
      if (notification.suggestedActions && notification.suggestedActions.length > 0) {
        stats['action-required'] = (stats['action-required'] || 0) + 1;
      }
    });
    
    setFlagStats(stats);
  }, [notifications]);

  const flagDetails = {
    'emergency': { name: 'Emergency', color: '#dc3545', icon: 'ti ti-alert-triangle-filled' },
    'urgent': { name: 'Urgent', color: '#fd7e14', icon: 'ti ti-exclamation-circle' },
    'high-confidence': { name: 'AI Verified', color: '#198754', icon: 'ti ti-shield-check' },
    'medical': { name: 'Medical', color: '#0dcaf0', icon: 'ti ti-stethoscope' },
    'action-required': { name: 'Action Required', color: '#6f42c1', icon: 'ti ti-checklist' }
  };

  return (
    <div className="ai-flag-summary bg-white rounded-3 p-3 border">
      <h6 className="mb-3 fw-semibold">{title}</h6>
      <div className="row g-2">
        {Object.entries(flagStats).map(([flagId, count]) => {
          const flag = flagDetails[flagId as keyof typeof flagDetails];
          if (!flag || count === 0) return null;
          
          return (
            <div key={flagId} className="col-6 col-md-4 col-lg-3">
              <div className="flag-stat text-center p-2 bg-light rounded-3">
                <i className={`${flag.icon} mb-1 d-block`} style={{ color: flag.color, fontSize: '1.5rem' }}></i>
                <div className="fw-bold" style={{ color: flag.color }}>{count}</div>
                <small className="text-muted">{flag.name}</small>
              </div>
            </div>
          );
        })}
      </div>
      {Object.keys(flagStats).length === 0 && (
        <p className="text-muted text-center mb-0">No flags detected</p>
      )}
    </div>
  );
};

export default AIVisualFlags;
