import React, { useState } from "react";
import { Card, Switch, Slider, Select, Radio, Checkbox, Button, Divider, Alert, Tabs } from "antd";

interface AISettings {
  enabled: boolean;
  priorityWeight: number;
  categoryWeights: {
    emergency: number;
    medical: number;
    appointment: number;
    administrative: number;
    reminder: number;
  };
  smartGrouping: boolean;
  groupSimilarThreshold: number;
  autoActions: {
    enabled: boolean;
    lowPriorityAutoRead: boolean;
    highPriorityAlerts: boolean;
    emergencyNotifications: boolean;
  };
  roleBasedFiltering: {
    enabled: boolean;
    roles: string[];
    departmentFilter: string[];
  };
  notificationMethods: {
    inApp: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    emergencyOverride: boolean;
  };
  learningMode: {
    enabled: boolean;
    adaptToBehavior: boolean;
    suggestOptimizations: boolean;
  };
}

const AINotificationSettings = () => {
  const [settings, setSettings] = useState<AISettings>({
    enabled: true,
    priorityWeight: 75,
    categoryWeights: {
      emergency: 100,
      medical: 85,
      appointment: 60,
      administrative: 40,
      reminder: 30
    },
    smartGrouping: true,
    groupSimilarThreshold: 70,
    autoActions: {
      enabled: true,
      lowPriorityAutoRead: false,
      highPriorityAlerts: true,
      emergencyNotifications: true
    },
    roleBasedFiltering: {
      enabled: true,
      roles: ['doctor', 'nurse'],
      departmentFilter: ['cardiology', 'emergency']
    },
    notificationMethods: {
      inApp: true,
      email: true,
      sms: false,
      push: true
    },
    quietHours: {
      enabled: true,
      startTime: "22:00",
      endTime: "06:00",
      emergencyOverride: true
    },
    learningMode: {
      enabled: true,
      adaptToBehavior: true,
      suggestOptimizations: true
    }
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateSettings = (path: string, value: any) => {
    const pathArray = path.split('.');
    const newSettings = { ...settings };
    let current: any = newSettings;

    for (let i = 0; i < pathArray.length - 1; i++) {
      current = current[pathArray[i]];
    }
    current[pathArray[pathArray.length - 1]] = value;
    
    setSettings(newSettings);
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    // In a real application, this would save to backend
    console.log('Saving AI settings:', settings);
    setHasUnsavedChanges(false);
    // Show success message
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      enabled: true,
      priorityWeight: 75,
      categoryWeights: {
        emergency: 100,
        medical: 85,
        appointment: 60,
        administrative: 40,
        reminder: 30
      },
      smartGrouping: true,
      groupSimilarThreshold: 70,
      autoActions: {
        enabled: true,
        lowPriorityAutoRead: false,
        highPriorityAlerts: true,
        emergencyNotifications: true
      },
      roleBasedFiltering: {
        enabled: true,
        roles: ['doctor'],
        departmentFilter: []
      },
      notificationMethods: {
        inApp: true,
        email: true,
        sms: false,
        push: true
      },
      quietHours: {
        enabled: false,
        startTime: "22:00",
        endTime: "06:00",
        emergencyOverride: true
      },
      learningMode: {
        enabled: false,
        adaptToBehavior: false,
        suggestOptimizations: false
      }
    });
    setHasUnsavedChanges(true);
  };

  const renderAIConfiguration = () => (
    <div className="ai-configuration-section">
      <Card title={
        <div className="d-flex align-items-center">
          <i className="ti ti-robot text-primary me-2 fs-20"></i>
          <span>AI Engine Configuration</span>
        </div>
      } className="mb-4">
        <div className="row">
          <div className="col-md-6">
            <div className="setting-item mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label fw-semibold mb-0">Enable AI Processing</label>
                <Switch
                  checked={settings.enabled}
                  onChange={(checked) => updateSettings('enabled', checked)}
                  checkedChildren="ON"
                  unCheckedChildren="OFF"
                />
              </div>
              <p className="text-muted fs-13">
                When enabled, AI will analyze and prioritize notifications automatically
              </p>
            </div>

            <div className="setting-item mb-4">
              <label className="form-label fw-semibold mb-3">
                AI Priority Weight: {settings.priorityWeight}%
              </label>
              <Slider
                value={settings.priorityWeight}
                onChange={(value) => updateSettings('priorityWeight', value)}
                disabled={!settings.enabled}
                marks={{
                  0: 'Manual',
                  25: 'Low',
                  50: 'Medium',
                  75: 'High',
                  100: 'Full AI'
                }}
                tooltip={{ formatter: (value) => `${value}% AI influence` }}
              />
              <p className="text-muted fs-12 mt-2">
                Controls how much AI influences notification prioritization
              </p>
            </div>
          </div>

          <div className="col-md-6">
            <div className="setting-item mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label fw-semibold mb-0">Smart Grouping</label>
                <Switch
                  checked={settings.smartGrouping}
                  onChange={(checked) => updateSettings('smartGrouping', checked)}
                  disabled={!settings.enabled}
                />
              </div>
              <p className="text-muted fs-13">
                Automatically group similar notifications to reduce clutter
              </p>
            </div>

            <div className="setting-item mb-4">
              <label className="form-label fw-semibold mb-3">
                Grouping Sensitivity: {settings.groupSimilarThreshold}%
              </label>
              <Slider
                value={settings.groupSimilarThreshold}
                onChange={(value) => updateSettings('groupSimilarThreshold', value)}
                disabled={!settings.enabled || !settings.smartGrouping}
                marks={{
                  0: 'Loose',
                  50: 'Medium',
                  100: 'Strict'
                }}
              />
              <p className="text-muted fs-12 mt-2">
                Higher values group only very similar notifications
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Category Weights */}
      <Card title="Category Priority Weights" className="mb-4">
        <p className="text-muted mb-4">
          Adjust how much importance AI places on different notification categories
        </p>
        <div className="row">
          {Object.entries(settings.categoryWeights).map(([category, weight]) => (
            <div key={category} className="col-md-6 col-lg-4 mb-4">
              <div className="category-weight-item">
                <div className="d-flex align-items-center mb-2">
                  <i className={`ti ti-${category === 'emergency' ? 'emergency-bed' : 
                    category === 'medical' ? 'stethoscope' :
                    category === 'appointment' ? 'calendar' :
                    category === 'administrative' ? 'file-text' : 'alarm'} 
                    text-${category === 'emergency' ? 'danger' : 
                    category === 'medical' ? 'success' :
                    category === 'appointment' ? 'primary' :
                    category === 'administrative' ? 'info' : 'warning'} me-2`}></i>
                  <span className="fw-medium text-capitalize">{category}</span>
                </div>
                <Slider
                  value={weight}
                  onChange={(value) => updateSettings(`categoryWeights.${category}`, value)}
                  disabled={!settings.enabled}
                  max={100}
                  marks={{
                    0: '0',
                    50: '50',
                    100: '100'
                  }}
                />
                <div className="d-flex justify-content-between mt-1">
                  <small className="text-muted">Low</small>
                  <small className="fw-medium">{weight}%</small>
                  <small className="text-muted">High</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderAutomationSettings = () => (
    <div className="automation-settings-section">
      <Card title={
        <div className="d-flex align-items-center">
          <i className="ti ti-automation text-primary me-2 fs-20"></i>
          <span>Automation & Actions</span>
        </div>
      } className="mb-4">
        <div className="automation-item mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <label className="form-label fw-semibold mb-1">Enable Auto Actions</label>
              <p className="text-muted fs-13 mb-0">Allow AI to perform automatic actions on notifications</p>
            </div>
            <Switch
              checked={settings.autoActions.enabled}
              onChange={(checked) => updateSettings('autoActions.enabled', checked)}
            />
          </div>
        </div>

        <div className="auto-actions-list">
          <div className="row">
            <div className="col-md-6">
              <div className="action-item p-3 border rounded-3 mb-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="fw-semibold mb-1">Auto-read Low Priority</h6>
                    <p className="text-muted fs-13 mb-0">
                      Automatically mark routine notifications as read after 24 hours
                    </p>
                  </div>
                  <Checkbox
                    checked={settings.autoActions.lowPriorityAutoRead}
                    onChange={(e) => updateSettings('autoActions.lowPriorityAutoRead', e.target.checked)}
                    disabled={!settings.autoActions.enabled}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="action-item p-3 border rounded-3 mb-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="fw-semibold mb-1">High Priority Alerts</h6>
                    <p className="text-muted fs-13 mb-0">
                      Send immediate alerts for high-priority notifications
                    </p>
                  </div>
                  <Checkbox
                    checked={settings.autoActions.highPriorityAlerts}
                    onChange={(e) => updateSettings('autoActions.highPriorityAlerts', e.target.checked)}
                    disabled={!settings.autoActions.enabled}
                  />
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="action-item p-3 border rounded-3 mb-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h6 className="fw-semibold mb-1">Emergency Notifications</h6>
                    <p className="text-muted fs-13 mb-0">
                      Override all settings for emergency notifications
                    </p>
                  </div>
                  <Checkbox
                    checked={settings.autoActions.emergencyNotifications}
                    onChange={(e) => updateSettings('autoActions.emergencyNotifications', e.target.checked)}
                    disabled={!settings.autoActions.enabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderRoleAndFiltering = () => (
    <div className="role-filtering-section">
      <Card title={
        <div className="d-flex align-items-center">
          <i className="ti ti-users text-primary me-2 fs-20"></i>
          <span>Role-Based Filtering</span>
        </div>
      } className="mb-4">
        <div className="setting-item mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <label className="form-label fw-semibold mb-1">Enable Role-Based Filtering</label>
              <p className="text-muted fs-13 mb-0">Filter notifications based on your role and department</p>
            </div>
            <Switch
              checked={settings.roleBasedFiltering.enabled}
              onChange={(checked) => updateSettings('roleBasedFiltering.enabled', checked)}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <div className="setting-item mb-4">
              <label className="form-label fw-semibold mb-3">Your Roles</label>
              <Select
                mode="multiple"
                placeholder="Select your roles"
                value={settings.roleBasedFiltering.roles}
                onChange={(values) => updateSettings('roleBasedFiltering.roles', values)}
                disabled={!settings.roleBasedFiltering.enabled}
                className="w-100"
                options={[
                  { label: 'Doctor', value: 'doctor' },
                  { label: 'Nurse', value: 'nurse' },
                  { label: 'Administrator', value: 'admin' },
                  { label: 'Receptionist', value: 'receptionist' },
                  { label: 'Lab Technician', value: 'lab-tech' },
                  { label: 'Department Head', value: 'dept-head' }
                ]}
              />
            </div>
          </div>

          <div className="col-md-6">
            <div className="setting-item mb-4">
              <label className="form-label fw-semibold mb-3">Department Filter</label>
              <Select
                mode="multiple"
                placeholder="Select departments"
                value={settings.roleBasedFiltering.departmentFilter}
                onChange={(values) => updateSettings('roleBasedFiltering.departmentFilter', values)}
                disabled={!settings.roleBasedFiltering.enabled}
                className="w-100"
                options={[
                  { label: 'Cardiology', value: 'cardiology' },
                  { label: 'Emergency', value: 'emergency' },
                  { label: 'Pediatrics', value: 'pediatrics' },
                  { label: 'Orthopedics', value: 'orthopedics' },
                  { label: 'Radiology', value: 'radiology' },
                  { label: 'Laboratory', value: 'laboratory' }
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Notification Methods */}
      <Card title="Notification Delivery Methods" className="mb-4">
        <div className="row">
          <div className="col-md-3 col-sm-6">
            <div className="notification-method p-3 border rounded-3 text-center">
              <i className="ti ti-bell fs-24 text-primary mb-2 d-block"></i>
              <h6 className="fw-semibold mb-2">In-App</h6>
              <Switch
                checked={settings.notificationMethods.inApp}
                onChange={(checked) => updateSettings('notificationMethods.inApp', checked)}
                size="small"
              />
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="notification-method p-3 border rounded-3 text-center">
              <i className="ti ti-mail fs-24 text-info mb-2 d-block"></i>
              <h6 className="fw-semibold mb-2">Email</h6>
              <Switch
                checked={settings.notificationMethods.email}
                onChange={(checked) => updateSettings('notificationMethods.email', checked)}
                size="small"
              />
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="notification-method p-3 border rounded-3 text-center">
              <i className="ti ti-message fs-24 text-success mb-2 d-block"></i>
              <h6 className="fw-semibold mb-2">SMS</h6>
              <Switch
                checked={settings.notificationMethods.sms}
                onChange={(checked) => updateSettings('notificationMethods.sms', checked)}
                size="small"
              />
            </div>
          </div>

          <div className="col-md-3 col-sm-6">
            <div className="notification-method p-3 border rounded-3 text-center">
              <i className="ti ti-device-mobile fs-24 text-warning mb-2 d-block"></i>
              <h6 className="fw-semibold mb-2">Push</h6>
              <Switch
                checked={settings.notificationMethods.push}
                onChange={(checked) => updateSettings('notificationMethods.push', checked)}
                size="small"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderAdvancedSettings = () => (
    <div className="advanced-settings-section">
      {/* Quiet Hours */}
      <Card title={
        <div className="d-flex align-items-center">
          <i className="ti ti-moon text-primary me-2 fs-20"></i>
          <span>Quiet Hours</span>
        </div>
      } className="mb-4">
        <div className="setting-item mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <label className="form-label fw-semibold mb-1">Enable Quiet Hours</label>
              <p className="text-muted fs-13 mb-0">Reduce non-critical notifications during specified hours</p>
            </div>
            <Switch
              checked={settings.quietHours.enabled}
              onChange={(checked) => updateSettings('quietHours.enabled', checked)}
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-4">
            <div className="setting-item mb-3">
              <label className="form-label fw-semibold mb-2">Start Time</label>
              <input
                type="time"
                className="form-control"
                value={settings.quietHours.startTime}
                onChange={(e) => updateSettings('quietHours.startTime', e.target.value)}
                disabled={!settings.quietHours.enabled}
              />
            </div>
          </div>

          <div className="col-md-4">
            <div className="setting-item mb-3">
              <label className="form-label fw-semibold mb-2">End Time</label>
              <input
                type="time"
                className="form-control"
                value={settings.quietHours.endTime}
                onChange={(e) => updateSettings('quietHours.endTime', e.target.value)}
                disabled={!settings.quietHours.enabled}
              />
            </div>
          </div>

          <div className="col-md-4">
            <div className="setting-item mb-3">
              <label className="form-label fw-semibold mb-2">Emergency Override</label>
              <div className="form-check form-switch mt-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.quietHours.emergencyOverride}
                  onChange={(e) => updateSettings('quietHours.emergencyOverride', e.target.checked)}
                  disabled={!settings.quietHours.enabled}
                />
                <label className="form-check-label fs-13 text-muted">
                  Allow emergency notifications
                </label>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* AI Learning Mode */}
      <Card title={
        <div className="d-flex align-items-center">
          <i className="ti ti-brain text-primary me-2 fs-20"></i>
          <span>AI Learning & Optimization</span>
        </div>
      } className="mb-4">
        <Alert
          message="Experimental Feature"
          description="AI Learning features are currently in beta. They help improve notification relevance over time."
          type="info"
          showIcon
          className="mb-4"
        />

        <div className="learning-options">
          <div className="row">
            <div className="col-md-4">
              <div className="learning-item p-3 border rounded-3 text-center">
                <i className="ti ti-bulb fs-24 text-warning mb-2 d-block"></i>
                <h6 className="fw-semibold mb-2">Learning Mode</h6>
                <p className="text-muted fs-12 mb-3">AI learns from your interaction patterns</p>
                <Switch
                  checked={settings.learningMode.enabled}
                  onChange={(checked) => updateSettings('learningMode.enabled', checked)}
                  size="small"
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="learning-item p-3 border rounded-3 text-center">
                <i className="ti ti-target fs-24 text-success mb-2 d-block"></i>
                <h6 className="fw-semibold mb-2">Adapt to Behavior</h6>
                <p className="text-muted fs-12 mb-3">Adjust priorities based on your actions</p>
                <Switch
                  checked={settings.learningMode.adaptToBehavior}
                  onChange={(checked) => updateSettings('learningMode.adaptToBehavior', checked)}
                  disabled={!settings.learningMode.enabled}
                  size="small"
                />
              </div>
            </div>

            <div className="col-md-4">
              <div className="learning-item p-3 border rounded-3 text-center">
                <i className="ti ti-chart-line fs-24 text-info mb-2 d-block"></i>
                <h6 className="fw-semibold mb-2">Suggest Optimizations</h6>
                <p className="text-muted fs-12 mb-3">Receive AI suggestions for better settings</p>
                <Switch
                  checked={settings.learningMode.suggestOptimizations}
                  onChange={(checked) => updateSettings('learningMode.suggestOptimizations', checked)}
                  disabled={!settings.learningMode.enabled}
                  size="small"
                />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const tabItems = [
    {
      key: "1",
      label: (
        <span>
          <i className="ti ti-robot me-2"></i>
          AI Configuration
        </span>
      ),
      children: renderAIConfiguration(),
    },
    {
      key: "2",
      label: (
        <span>
          <i className="ti ti-automation me-2"></i>
          Automation
        </span>
      ),
      children: renderAutomationSettings(),
    },
    {
      key: "3",
      label: (
        <span>
          <i className="ti ti-users me-2"></i>
          Roles & Delivery
        </span>
      ),
      children: renderRoleAndFiltering(),
    },
    {
      key: "4",
      label: (
        <span>
          <i className="ti ti-settings me-2"></i>
          Advanced
        </span>
      ),
      children: renderAdvancedSettings(),
    },
  ];

  return (
    <div className="ai-notification-settings">
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h4 className="fw-bold mb-1">AI Notification Settings</h4>
            <p className="text-muted mb-0">Configure intelligent notification processing and personalization</p>
          </div>
          <div className="d-flex gap-2">
            <Button onClick={handleReset} disabled={!hasUnsavedChanges}>
              Reset to Defaults
            </Button>
            <Button type="primary" onClick={handleSave} disabled={!hasUnsavedChanges}>
              <i className="ti ti-device-floppy me-1"></i>
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {hasUnsavedChanges && (
        <Alert
          message="You have unsaved changes"
          description="Don't forget to save your changes before leaving this page."
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Tabs
        defaultActiveKey="1"
        items={tabItems}
        className="ai-settings-tabs"
        tabPosition="top"
      />
    </div>
  );
};

export default AINotificationSettings;
