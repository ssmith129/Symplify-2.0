import React, { useState, useMemo } from 'react';
import { Badge, DatePicker, Select, Slider, Tooltip, Popover } from 'antd';
import type { Dayjs } from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterState {
  priority: {
    levels: number[];
    categories: string[];
  };
  timeframe: {
    preset: string;
    custom: [Dayjs | null, Dayjs | null];
  };
  department: string[];
  sender: string[];
  status: string[];
  aiConfidence: [number, number];
  keywords: string;
  messageType: string[];
  riskLevel: string[];
  actionRequired: boolean | null;
  readStatus: string[];
}

interface FilterControlsProps {
  onFiltersChange: (filters: FilterState) => void;
  initialFilters?: Partial<FilterState>;
  totalCount: number;
  filteredCount: number;
  availableOptions: {
    departments: string[];
    senders: string[];
    messageTypes: string[];
  };
}

const AIFilterControls: React.FC<FilterControlsProps> = ({
  onFiltersChange,
  initialFilters = {},
  totalCount,
  filteredCount,
  availableOptions
}) => {
  const [filters, setFilters] = useState<FilterState>({
    priority: {
      levels: [],
      categories: []
    },
    timeframe: {
      preset: 'today',
      custom: [null, null]
    },
    department: [],
    sender: [],
    status: [],
    aiConfidence: [0, 100],
    keywords: '',
    messageType: [],
    riskLevel: [],
    actionRequired: null,
    readStatus: [],
    ...initialFilters
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedFilters, setSavedFilters] = useState<Array<{ name: string; filters: FilterState }>>([]);
  const [filterName, setFilterName] = useState('');

  // Priority categories with colors and descriptions
  const priorityCategories = [
    { 
      value: 'critical', 
      label: 'Critical', 
      color: '#dc3545', 
      description: 'Life-threatening emergencies requiring immediate action',
      icon: 'ti ti-alert-triangle-filled'
    },
    { 
      value: 'important', 
      label: 'Important', 
      color: '#ffc107', 
      description: 'Urgent matters requiring prompt attention',
      icon: 'ti ti-exclamation-circle'
    },
    { 
      value: 'routine', 
      label: 'Routine', 
      color: '#0dcaf0', 
      description: 'Standard notifications and updates',
      icon: 'ti ti-info-circle'
    },
    { 
      value: 'informational', 
      label: 'Informational', 
      color: '#6c757d', 
      description: 'General announcements and system updates',
      icon: 'ti ti-file-info'
    }
  ];

  // Risk levels
  const riskLevels = [
    { value: 'critical', label: 'Critical', color: '#dc3545' },
    { value: 'high', label: 'High', color: '#fd7e14' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'low', label: 'Low', color: '#198754' }
  ];

  // Timeframe presets
  const timeframePresets = [
    { value: 'today', label: 'Today', description: 'Last 24 hours' },
    { value: 'yesterday', label: 'Yesterday', description: 'Previous 24 hours' },
    { value: 'week', label: 'This Week', description: 'Last 7 days' },
    { value: 'month', label: 'This Month', description: 'Last 30 days' },
    { value: 'quarter', label: 'This Quarter', description: 'Last 90 days' },
    { value: 'custom', label: 'Custom Range', description: 'Select specific dates' }
  ];

  // Status options
  const statusOptions = [
    { value: 'unread', label: 'Unread', color: '#0d6efd', icon: 'ti ti-mail' },
    { value: 'read', label: 'Read', color: '#6c757d', icon: 'ti ti-mail-opened' },
    { value: 'flagged', label: 'Flagged', color: '#dc3545', icon: 'ti ti-flag' },
    { value: 'archived', label: 'Archived', color: '#198754', icon: 'ti ti-archive' },
    { value: 'pending', label: 'Pending Action', color: '#ffc107', icon: 'ti ti-clock' }
  ];

  // Update filters and notify parent
  const updateFilters = (newFilters: Partial<FilterState>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      priority: { levels: [], categories: [] },
      timeframe: { preset: 'today', custom: [null, null] },
      department: [],
      sender: [],
      status: [],
      aiConfidence: [0, 100],
      keywords: '',
      messageType: [],
      riskLevel: [],
      actionRequired: null,
      readStatus: []
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  // Save current filter preset
  const saveFilterPreset = () => {
    if (!filterName.trim()) return;
    
    const newPreset = {
      name: filterName.trim(),
      filters: { ...filters }
    };
    
    setSavedFilters(prev => [...prev, newPreset]);
    setFilterName('');
  };

  // Load saved filter preset
  const loadFilterPreset = (preset: { name: string; filters: FilterState }) => {
    setFilters(preset.filters);
    onFiltersChange(preset.filters);
  };

  // Quick filter presets
  const quickFilters = [
    {
      label: 'Critical Only',
      action: () => updateFilters({ 
        priority: { levels: [4, 5], categories: ['critical'] },
        status: ['unread']
      })
    },
    {
      label: 'Needs Action',
      action: () => updateFilters({ 
        actionRequired: true,
        status: ['unread', 'pending']
      })
    },
    {
      label: 'High Confidence',
      action: () => updateFilters({ 
        aiConfidence: [90, 100]
      })
    },
    {
      label: 'Recent Unread',
      action: () => updateFilters({ 
        timeframe: { preset: 'today', custom: [null, null] },
        status: ['unread']
      })
    }
  ];

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.priority.levels.length > 0) count++;
    if (filters.priority.categories.length > 0) count++;
    if (filters.timeframe.preset !== 'today') count++;
    if (filters.department.length > 0) count++;
    if (filters.sender.length > 0) count++;
    if (filters.status.length > 0) count++;
    if (filters.aiConfidence[0] > 0 || filters.aiConfidence[1] < 100) count++;
    if (filters.keywords.trim()) count++;
    if (filters.messageType.length > 0) count++;
    if (filters.riskLevel.length > 0) count++;
    if (filters.actionRequired !== null) count++;
    if (filters.readStatus.length > 0) count++;
    return count;
  }, [filters]);

  // Advanced Filters Popover Content
  const advancedFiltersContent = (
    <div className="advanced-filters-popup" style={{ width: '400px', maxHeight: '500px', overflowY: 'auto' }}>
      {/* AI Confidence Range */}
      <div className="filter-group mb-4">
        <label className="form-label fw-medium mb-2">
          <i className="ti ti-robot me-1"></i>
          AI Confidence Range
        </label>
        <Slider
          range
          value={filters.aiConfidence}
          onChange={(value) => updateFilters({ aiConfidence: value as [number, number] })}
          tipFormatter={(value) => `${value}%`}
          marks={{
            0: '0%',
            50: '50%',
            100: '100%'
          }}
        />
        <small className="text-muted">
          Current: {filters.aiConfidence[0]}% - {filters.aiConfidence[1]}%
        </small>
      </div>

      {/* Risk Level */}
      <div className="filter-group mb-4">
        <label className="form-label fw-medium mb-2">
          <i className="ti ti-shield-exclamation me-1"></i>
          Risk Level
        </label>
        <div className="risk-level-checkboxes">
          {riskLevels.map(risk => (
            <div key={risk.value} className="form-check mb-1">
              <input
                className="form-check-input"
                type="checkbox"
                id={`risk-${risk.value}`}
                checked={filters.riskLevel.includes(risk.value)}
                onChange={(e) => {
                  const newRiskLevels = e.target.checked
                    ? [...filters.riskLevel, risk.value]
                    : filters.riskLevel.filter(r => r !== risk.value);
                  updateFilters({ riskLevel: newRiskLevels });
                }}
              />
              <label className="form-check-label" htmlFor={`risk-${risk.value}`}>
                <span className="badge me-2" style={{ backgroundColor: risk.color, color: 'white', fontSize: '0.7rem' }}>
                  {risk.label}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Message Type */}
      <div className="filter-group mb-4">
        <label className="form-label fw-medium mb-2">
          <i className="ti ti-category me-1"></i>
          Message Type
        </label>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          placeholder="Select message types"
          value={filters.messageType}
          onChange={(value) => updateFilters({ messageType: value })}
        >
          {availableOptions.messageTypes.map(type => (
            <Option key={type} value={type}>{type}</Option>
          ))}
        </Select>
      </div>

      {/* Action Required */}
      <div className="filter-group mb-4">
        <label className="form-label fw-medium mb-2">
          <i className="ti ti-checklist me-1"></i>
          Action Required
        </label>
        <div className="action-required-options">
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="actionRequired"
              id="action-all"
              checked={filters.actionRequired === null}
              onChange={() => updateFilters({ actionRequired: null })}
            />
            <label className="form-check-label" htmlFor="action-all">All</label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="actionRequired"
              id="action-yes"
              checked={filters.actionRequired === true}
              onChange={() => updateFilters({ actionRequired: true })}
            />
            <label className="form-check-label" htmlFor="action-yes">Yes</label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              name="actionRequired"
              id="action-no"
              checked={filters.actionRequired === false}
              onChange={() => updateFilters({ actionRequired: false })}
            />
            <label className="form-check-label" htmlFor="action-no">No</label>
          </div>
        </div>
      </div>

      {/* Keywords Search */}
      <div className="filter-group mb-4">
        <label className="form-label fw-medium mb-2">
          <i className="ti ti-search me-1"></i>
          Keywords
        </label>
        <input
          type="text"
          className="form-control"
          placeholder="Search in message content..."
          value={filters.keywords}
          onChange={(e) => updateFilters({ keywords: e.target.value })}
        />
        <small className="text-muted">Search across titles and message content</small>
      </div>
    </div>
  );

  return (
    <div className="ai-filter-controls bg-white rounded-3 p-4 border">
      {/* Filter Header */}
      <div className="filter-header d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <h6 className="mb-0 fw-semibold">
            <i className="ti ti-filter me-2"></i>
            Smart Filters
          </h6>
          {activeFilterCount > 0 && (
            <Badge count={activeFilterCount} offset={[0, 0]} className="ms-2">
              <span className="badge bg-primary-transparent text-primary">Active</span>
            </Badge>
          )}
        </div>
        <div className="filter-stats text-muted fs-12">
          Showing {filteredCount.toLocaleString()} of {totalCount.toLocaleString()} messages
        </div>
      </div>

      {/* Quick Filter Buttons */}
      <div className="quick-filters mb-3">
        <div className="d-flex gap-2 flex-wrap">
          {quickFilters.map((quickFilter, index) => (
            <button
              key={`quickfilter-${quickFilter.label.toLowerCase().replace(/\s+/g, '-')}-${index}`}
              className="btn btn-outline-primary btn-sm"
              onClick={quickFilter.action}
            >
              {quickFilter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Filter Controls */}
      <div className="main-filters">
        <div className="row g-3">
          {/* Priority Categories */}
          <div className="col-lg-3 col-md-6">
            <label className="form-label fw-medium">Priority Category</label>
            <div className="priority-category-filters">
              {priorityCategories.map(category => (
                <div key={category.value} className="form-check mb-1">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`priority-${category.value}`}
                    checked={filters.priority.categories.includes(category.value)}
                    onChange={(e) => {
                      const newCategories = e.target.checked
                        ? [...filters.priority.categories, category.value]
                        : filters.priority.categories.filter(c => c !== category.value);
                      updateFilters({ 
                        priority: { ...filters.priority, categories: newCategories }
                      });
                    }}
                  />
                  <label className="form-check-label d-flex align-items-center" htmlFor={`priority-${category.value}`}>
                    <i className={`${category.icon} me-2`} style={{ color: category.color }}></i>
                    <span>{category.label}</span>
                    <Tooltip title={category.description}>
                      <i className="ti ti-info-circle ms-1 text-muted fs-12"></i>
                    </Tooltip>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Levels */}
          <div className="col-lg-2 col-md-6">
            <label className="form-label fw-medium">Priority Level</label>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="1-5"
              value={filters.priority.levels}
              onChange={(value) => updateFilters({ 
                priority: { ...filters.priority, levels: value }
              })}
            >
              {[1, 2, 3, 4, 5].map(level => (
                <Option key={level} value={level}>
                  <Badge count={level} color={level >= 4 ? '#dc3545' : level >= 3 ? '#ffc107' : '#0dcaf0'} />
                  <span className="ms-2">Priority {level}</span>
                </Option>
              ))}
            </Select>
          </div>

          {/* Timeframe */}
          <div className="col-lg-2 col-md-6">
            <label className="form-label fw-medium">Timeframe</label>
            <Select
              style={{ width: '100%' }}
              value={filters.timeframe.preset}
              onChange={(value) => updateFilters({ 
                timeframe: { ...filters.timeframe, preset: value }
              })}
            >
              {timeframePresets.map(preset => (
                <Option key={preset.value} value={preset.value}>
                  <Tooltip title={preset.description}>
                    {preset.label}
                  </Tooltip>
                </Option>
              ))}
            </Select>
            {filters.timeframe.preset === 'custom' && (
              <RangePicker
                style={{ width: '100%', marginTop: '0.5rem' }}
                value={filters.timeframe.custom}
                onChange={(dates) => updateFilters({
                  timeframe: { ...filters.timeframe, custom: dates || [null, null] }
                })}
              />
            )}
          </div>

          {/* Department */}
          <div className="col-lg-2 col-md-6">
            <label className="form-label fw-medium">Department</label>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="All departments"
              value={filters.department}
              onChange={(value) => updateFilters({ department: value })}
            >
              {availableOptions.departments.map(dept => (
                <Option key={dept} value={dept}>{dept}</Option>
              ))}
            </Select>
          </div>

          {/* Status */}
          <div className="col-lg-2 col-md-6">
            <label className="form-label fw-medium">Status</label>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              placeholder="All status"
              value={filters.status}
              onChange={(value) => updateFilters({ status: value })}
            >
              {statusOptions.map(status => (
                <Option key={status.value} value={status.value}>
                  <i className={`${status.icon} me-2`} style={{ color: status.color }}></i>
                  {status.label}
                </Option>
              ))}
            </Select>
          </div>

          {/* Advanced Filters Button */}
          <div className="col-lg-1 col-md-6 d-flex align-items-end">
            <Popover
              content={advancedFiltersContent}
              title="Advanced Filters"
              trigger="click"
              placement="bottomRight"
              open={showAdvanced}
              onOpenChange={setShowAdvanced}
            >
              <button className="btn btn-outline-secondary w-100">
                <i className="ti ti-adjustments"></i>
                <span className="d-none d-lg-inline ms-1">Advanced</span>
              </button>
            </Popover>
          </div>
        </div>
      </div>

      {/* Filter Actions */}
      <div className="filter-actions mt-3 pt-3 border-top">
        <div className="d-flex justify-content-between align-items-center">
          <div className="filter-presets d-flex align-items-center gap-2">
            <small className="text-muted">Quick save:</small>
            <div className="input-group input-group-sm" style={{ width: '200px' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Filter preset name"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
              <button 
                className="btn btn-outline-primary"
                onClick={saveFilterPreset}
                disabled={!filterName.trim()}
              >
                <i className="ti ti-device-floppy"></i>
              </button>
            </div>
            {savedFilters.length > 0 && (
              <Select
                style={{ width: '150px' }}
                placeholder="Load preset"
                onChange={(value) => {
                  const preset = savedFilters.find(p => p.name === value);
                  if (preset) loadFilterPreset(preset);
                }}
              >
                {savedFilters.map(preset => (
                  <Option key={preset.name} value={preset.name}>{preset.name}</Option>
                ))}
              </Select>
            )}
          </div>

          <div className="filter-reset">
            <button 
              className="btn btn-outline-secondary btn-sm"
              onClick={clearAllFilters}
              disabled={activeFilterCount === 0}
            >
              <i className="ti ti-refresh me-1"></i>
              Clear All ({activeFilterCount})
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="active-filters mt-3 pt-3 border-top">
          <small className="text-muted mb-2 d-block">Active filters:</small>
          <div className="d-flex gap-1 flex-wrap">
            {filters.priority.categories.map(category => (
              <span key={`cat-${category}`} className="badge bg-primary-transparent text-primary">
                {category}
                <button 
                  className="btn-close btn-close-white ms-1" 
                  style={{ fontSize: '0.6rem' }}
                  onClick={() => {
                    const newCategories = filters.priority.categories.filter(c => c !== category);
                    updateFilters({ priority: { ...filters.priority, categories: newCategories } });
                  }}
                ></button>
              </span>
            ))}
            {filters.department.map(dept => (
              <span key={`dept-${dept}`} className="badge bg-info-transparent text-info">
                {dept}
                <button 
                  className="btn-close btn-close-white ms-1" 
                  style={{ fontSize: '0.6rem' }}
                  onClick={() => {
                    const newDepts = filters.department.filter(d => d !== dept);
                    updateFilters({ department: newDepts });
                  }}
                ></button>
              </span>
            ))}
            {filters.keywords && (
              <span className="badge bg-warning-transparent text-warning">
                "{filters.keywords}"
                <button 
                  className="btn-close btn-close-white ms-1" 
                  style={{ fontSize: '0.6rem' }}
                  onClick={() => updateFilters({ keywords: '' })}
                ></button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFilterControls;
