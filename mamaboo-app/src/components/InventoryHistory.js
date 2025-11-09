import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_RECORDS_GET_API, INVENTORY_ITEMS_GET_API } from '../constants/api';

function InventoryHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [inventoryItems, setInventoryItems] = useState({}); // Map itemId -> item data
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [filterCheckedBy, setFilterCheckedBy] = useState('');
  const [expandedRecords, setExpandedRecords] = useState(new Set()); // Track which records are expanded

  // Fetch inventory items to get names
  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const response = await fetch(INVENTORY_ITEMS_GET_API);
        const data = await response.json();
        const body = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        const items = body.items || [];
        
        const itemsMap = {};
        items.forEach(item => {
          itemsMap[item.itemId] = item;
        });
        setInventoryItems(itemsMap);
      } catch (e) {
        console.error('Error loading inventory items:', e);
      }
    };
    fetchInventoryItems();
  }, []);

  // Fetch inventory records
  useEffect(() => {
    const fetchRecords = async () => {
      try {
        setLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (filterDate) params.append('date', filterDate);
        if (filterCheckedBy) params.append('checkedBy', filterCheckedBy);
        params.append('limit', '100');
        
        const url = `${INVENTORY_RECORDS_GET_API}${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        const body = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        const recordsData = body.records || [];
        
        setRecords(recordsData);
      } catch (e) {
        console.error('Error loading inventory records:', e);
        alert('Không thể tải lịch sử kiểm kê. Vui lòng thử lại.\n\nLỗi: ' + e.message);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [filterDate, filterCheckedBy]);

  // Format timestamp to readable date/time
  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    try {
      // Handle different timestamp formats
      let dateStr = timestamp;
      // Remove timezone offset if present (e.g., +00:00Z)
      if (dateStr.includes('+')) {
        dateStr = dateStr.split('+')[0] + 'Z';
      }
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        return timestamp; // Return original if invalid
      }
      return date.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return timestamp;
    }
  };

  // Format date only
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Toggle expand/collapse record
  const toggleRecord = (recordKey) => {
    setExpandedRecords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(recordKey)) {
        newSet.delete(recordKey);
      } else {
        newSet.add(recordKey);
      }
      return newSet;
    });
  };

  // Get item name
  const getItemName = (itemId) => {
    const item = inventoryItems[itemId];
    return item ? item.name : itemId;
  };

  // Get item unit
  const getItemUnit = (itemId) => {
    const item = inventoryItems[itemId];
    return item ? item.unit : '';
  };

  return (
    <div className="login-page" style={{justifyContent: 'center', alignItems: 'flex-start'}}>
      <div className="login-container" style={{width: 1200, maxWidth: '95vw', marginTop: 24, marginBottom: 32}}>
        <h2 className="login-title" style={{color: '#3498db'}}>Lịch sử kiểm kê nguyên vật liệu</h2>
        <div className="login-underline" style={{ background: '#3498db' }}></div>

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <label style={{fontSize: '14px', fontWeight: 600, color: '#2b4c66'}}>Lọc theo ngày:</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e6eef5',
                borderRadius: 8,
                fontSize: '14px'
              }}
            />
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
            <label style={{fontSize: '14px', fontWeight: 600, color: '#2b4c66'}}>Lọc theo người kiểm tra:</label>
            <input
              type="text"
              value={filterCheckedBy}
              onChange={(e) => setFilterCheckedBy(e.target.value)}
              placeholder="Tên nhân viên..."
              style={{
                padding: '8px 12px',
                border: '1px solid #e6eef5',
                borderRadius: 8,
                fontSize: '14px',
                minWidth: 150
              }}
            />
          </div>
          {(filterDate || filterCheckedBy) && (
            <button
              onClick={() => {
                setFilterDate('');
                setFilterCheckedBy('');
              }}
              style={{
                padding: '8px 16px',
                background: '#95a5a6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Xóa bộ lọc
            </button>
          )}
        </div>

        {loading ? (
          <div style={{textAlign: 'center', padding: '40px 0', color: '#6b7a86'}}>
            Đang tải dữ liệu...
          </div>
        ) : records.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px 0', color: '#6b7a86'}}>
            Chưa có lịch sử kiểm kê
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
            {records.map((record, index) => {
              const items = record.items || {};
              const itemIds = Object.keys(items);
              const recordKey = `${record.date}-${record.timestamp}-${index}`;
              const isExpanded = expandedRecords.has(recordKey);
              
              return (
                <div key={recordKey} style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s ease'
                }}>
                  {/* Summary Header - Always Visible */}
                  <div 
                    onClick={() => toggleRecord(recordKey)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      background: isExpanded ? '#f0f7ff' : '#fff',
                      borderBottom: isExpanded ? '2px solid #3498db' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = '#fff';
                      }
                    }}
                  >
                    <div style={{flex: 1}}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        flexWrap: 'wrap'
                      }}>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#2b4c66'
                        }}>
                          {formatDate(record.date) || record.date || '-'}
                        </div>
                        <div style={{
                          fontSize: '13px',
                          color: '#6b7a86',
                          padding: '2px 8px',
                          background: '#e5e7eb',
                          borderRadius: 4
                        }}>
                          {formatDateTime(record.timestamp)}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#6b7a86'
                        }}>
                          👤 {record.checkedBy || 'Unknown'}
                        </div>
                        <div style={{
                          fontSize: '14px',
                          color: '#6b7a86',
                          fontWeight: 600
                        }}>
                          📦 {itemIds.length} món
                        </div>
                      </div>
                    </div>
                    <div style={{
                      fontSize: '20px',
                      color: '#3498db',
                      transition: 'transform 0.2s ease',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}>
                      ▼
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {isExpanded && (
                    <div style={{
                      padding: '20px',
                      background: '#fafbfc',
                      borderTop: '1px solid #e5e7eb'
                    }}>
                      {itemIds.length === 0 ? (
                        <div style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#6b7a86',
                          fontStyle: 'italic'
                        }}>
                          Không có nguyên vật liệu nào được kiểm tra
                        </div>
                      ) : (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                          gap: 10
                        }}>
                          {itemIds.map(itemId => (
                            <div key={itemId} style={{
                              background: '#fff',
                              border: '1px solid #e5e7eb',
                              borderRadius: 8,
                              padding: '10px 12px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#3498db';
                              e.currentTarget.style.boxShadow = '0 2px 4px rgba(52, 152, 219, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#e5e7eb';
                              e.currentTarget.style.boxShadow = 'none';
                            }}
                            >
                              <div style={{
                                fontSize: '13px',
                                fontWeight: 600,
                                color: '#2b4c66',
                                marginBottom: 4,
                                lineHeight: '1.4'
                              }}>
                                {getItemName(itemId)}
                              </div>
                              <div style={{
                                fontSize: '15px',
                                fontWeight: 700,
                                color: '#3498db'
                              }}>
                                {items[itemId]} {getItemUnit(itemId)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div style={{marginTop: 24, display: 'flex', justifyContent: 'center'}}>
          <button
            onClick={() => navigate('/inventory-management')}
            className="login-button"
            style={{padding: '12px 36px'}}
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default InventoryHistory;

