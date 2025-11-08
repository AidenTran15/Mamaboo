import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_STORAGE_KEY, INVENTORY_ALERTS_KEY, INVENTORY_CATEGORIES } from '../constants/inventory';

function InventoryManagement() {
  const navigate = useNavigate();
  const [inventoryRecords, setInventoryRecords] = useState([]);
  const [alerts, setAlerts] = useState({});
  const [showingInputModal, setShowingInputModal] = useState(false);
  const [inputItemId, setInputItemId] = useState(null);
  const [inputQuantity, setInputQuantity] = useState('');

  // Load dữ liệu
  React.useEffect(() => {
    try {
      const records = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) || '[]');
      // Hỗ trợ cả format cũ và format mới (minimal)
      const normalizedRecords = records.map(record => ({
        date: record.d || record.date,
        checkedBy: record.c || record.checkedBy,
        items: record.i || record.items || {}
      }));
      setInventoryRecords(normalizedRecords.sort((a, b) => new Date(b.date) - new Date(a.date)));
      
      const savedAlerts = JSON.parse(localStorage.getItem(INVENTORY_ALERTS_KEY) || '{}');
      setAlerts(savedAlerts);
    } catch (e) {
      console.error('Error loading inventory data:', e);
    }
  }, []);

  // Lấy dữ liệu mới nhất
  const getLatestInventory = () => {
    if (inventoryRecords.length === 0) return {};
    return inventoryRecords[0].items || {};
  };

  const latestInventory = getLatestInventory();

  // Kiểm tra alert
  const checkAlert = (itemId) => {
    const alertThreshold = alerts[itemId];
    if (!alertThreshold || alertThreshold === '') return null;
    
    const currentValue = parseFloat(latestInventory[itemId] || 0);
    const threshold = parseFloat(alertThreshold);
    
    if (isNaN(currentValue) || isNaN(threshold)) return null;
    
    return currentValue < threshold;
  };

  // Xử lý nhập hàng
  const handleInputInventory = (itemId) => {
    setInputItemId(itemId);
    setInputQuantity('');
    setShowingInputModal(true);
  };

  // Lưu số lượng nhập
  const saveInputQuantity = () => {
    if (!inputItemId) return;
    
    const quantity = parseFloat(inputQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Vui lòng nhập số lượng hợp lệ (lớn hơn 0)');
      return;
    }

    try {
      // Lấy dữ liệu hiện tại
      const records = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) || '[]');
      if (records.length === 0) {
        alert('Chưa có dữ liệu kiểm tra. Vui lòng kiểm tra nguyên vật liệu trước.');
        setShowingInputModal(false);
        return;
      }

      // Cập nhật số lượng = số lượng hiện tại + số lượng nhập
      const currentValue = parseFloat(latestInventory[inputItemId] || 0);
      const newValue = currentValue + quantity;

      // Cập nhật record mới nhất
      const updatedRecords = [...records];
      const latestRecord = { ...updatedRecords[0] };
      const items = { ...(latestRecord.i || latestRecord.items || {}) };
      items[inputItemId] = newValue.toString();
      
      latestRecord.i = items;
      updatedRecords[0] = latestRecord;

      // Lưu lại
      localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(updatedRecords));
      
      // Cập nhật state để UI refresh
      const normalizedRecords = updatedRecords.map(record => ({
        date: record.d || record.date,
        checkedBy: record.c || record.checkedBy,
        items: record.i || record.items || {}
      }));
      setInventoryRecords(normalizedRecords.sort((a, b) => new Date(b.date) - new Date(a.date)));

      alert(`Đã nhập ${quantity} ${INVENTORY_CATEGORIES[Object.keys(INVENTORY_CATEGORIES).find(key => 
        INVENTORY_CATEGORIES[key].items.some(item => item.id === inputItemId)
      )].items.find(item => item.id === inputItemId).unit}. Tổng số lượng hiện tại: ${newValue}`);
      
      setShowingInputModal(false);
      setInputItemId(null);
      setInputQuantity('');
    } catch (error) {
      console.error('Error saving input quantity:', error);
      alert('Có lỗi xảy ra khi lưu số lượng!');
    }
  };

  return (
    <div className="login-page" style={{justifyContent: 'center', alignItems: 'flex-start'}}>
      <div className="login-container" style={{width: 1200, maxWidth: '95vw', marginTop: 24, marginBottom: 32}}>
        <h2 className="login-title" style={{color: '#3498db'}}>Quản lý nguyên vật liệu</h2>
        <div className="login-underline" style={{ background: '#3498db' }}></div>

        {inventoryRecords.length === 0 ? (
          <div style={{textAlign: 'center', padding: '40px 0', color: '#6b7a86'}}>
            Chưa có dữ liệu kiểm tra nguyên vật liệu
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
            <div style={{background: '#f0f8ff', padding: '16px', borderRadius: 12, border: '1px solid #3498db'}}>
              <div style={{fontSize: '14px', color: '#6b7a86', marginBottom: 4}}>Lần kiểm tra gần nhất</div>
              <div style={{fontSize: '18px', fontWeight: 700, color: '#2b4c66'}}>
                {inventoryRecords[0].date} - Kiểm tra bởi: {inventoryRecords[0].checkedBy}
              </div>
            </div>

            {Object.keys(INVENTORY_CATEGORIES).map(categoryKey => {
              const category = INVENTORY_CATEGORIES[categoryKey];
              return (
                <div key={categoryKey} style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: '20px'
                }}>
                  <h3 style={{
                    color: '#2b4c66',
                    marginBottom: 16,
                    fontSize: '18px',
                    fontWeight: 700,
                    borderBottom: '2px solid #3498db',
                    paddingBottom: 8
                  }}>
                    {category.name}
                  </h3>
                  <div style={{overflowX: 'auto'}}>
                    <table style={{width: '100%', borderCollapse: 'collapse'}}>
                      <thead>
                        <tr style={{background: '#f9fafb', borderBottom: '2px solid #e5e7eb'}}>
                          <th style={{padding: '12px', textAlign: 'left', fontWeight: 600, color: '#2b4c66'}}>Sản phẩm</th>
                          <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Đơn vị</th>
                          <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Số lượng</th>
                          <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Alert</th>
                          <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Trạng thái</th>
                          <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Thao tác</th>
                          <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Mua</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items.map(item => {
                          const currentValue = latestInventory[item.id] || '';
                          const hasAlert = checkAlert(item.id);
                          return (
                            <tr key={item.id} style={{
                              borderBottom: '1px solid #f1f4f7',
                              background: hasAlert ? '#fff5f5' : '#fff'
                            }}>
                              <td style={{padding: '12px', fontWeight: 600, color: '#2b4c66'}}>{item.name}</td>
                              <td style={{padding: '12px', textAlign: 'center', color: '#6b7a86'}}>{item.unit}</td>
                              <td style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>
                                {currentValue || '0'}
                              </td>
                              <td style={{padding: '12px', textAlign: 'center', color: '#6b7a86'}}>
                                {alerts[item.id] ? `< ${alerts[item.id]} ${item.unit}` : '-'}
                              </td>
                              <td style={{padding: '12px', textAlign: 'center'}}>
                                {hasAlert ? (
                                  <span style={{
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    padding: '4px 12px',
                                    borderRadius: 12,
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}>
                                    ⚠️ Sắp hết hàng
                                  </span>
                                ) : (
                                  <span style={{
                                    background: '#d1fae5',
                                    color: '#059669',
                                    padding: '4px 12px',
                                    borderRadius: 12,
                                    fontSize: '12px',
                                    fontWeight: 600
                                  }}>
                                    ✓ Đủ hàng
                                  </span>
                                )}
                              </td>
                              <td style={{padding: '12px', textAlign: 'center'}}>
                                <button
                                  onClick={() => handleInputInventory(item.id)}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#3498db',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Nhập
                                </button>
                              </td>
                              <td style={{padding: '12px', textAlign: 'center'}}>
                                <button
                                  onClick={() => {
                                    if (item.purchaseLink && item.purchaseLink.trim() !== '') {
                                      window.open(item.purchaseLink, '_blank', 'noopener,noreferrer');
                                    } else {
                                      alert('Chưa có link sản phẩm');
                                    }
                                  }}
                                  style={{
                                    padding: '6px 12px',
                                    background: '#3498db',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 6,
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  Mua
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{marginTop: 24, display: 'flex', justifyContent: 'center'}}>
          <button
            onClick={() => navigate('/admin')}
            className="login-button"
            style={{padding: '12px 36px'}}
          >
            Quay lại
          </button>
        </div>
      </div>

      {/* Modal nhập số lượng */}
      {showingInputModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: '24px',
            width: '400px',
            maxWidth: '90vw',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{
              marginTop: 0,
              marginBottom: 16,
              color: '#2b4c66',
              fontSize: '18px',
              fontWeight: 700
            }}>
              Nhập số lượng
            </h3>
            {inputItemId && (
              <div style={{marginBottom: 16, color: '#6b7a86', fontSize: '14px'}}>
                Sản phẩm: <strong>{INVENTORY_CATEGORIES[Object.keys(INVENTORY_CATEGORIES).find(key => 
                  INVENTORY_CATEGORIES[key].items.some(item => item.id === inputItemId)
                )].items.find(item => item.id === inputItemId).name}</strong>
                <br />
                Số lượng hiện tại: <strong>{latestInventory[inputItemId] || '0'}</strong> {INVENTORY_CATEGORIES[Object.keys(INVENTORY_CATEGORIES).find(key => 
                  INVENTORY_CATEGORIES[key].items.some(item => item.id === inputItemId)
                )].items.find(item => item.id === inputItemId).unit}
              </div>
            )}
            <div style={{marginBottom: 20}}>
              <label style={{display: 'block', marginBottom: 8, fontSize: '14px', fontWeight: 600, color: '#2b4c66'}}>
                Số lượng nhập:
              </label>
              <input
                type="number"
                value={inputQuantity}
                onChange={(e) => setInputQuantity(e.target.value)}
                placeholder="Nhập số lượng..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e6eef5',
                  borderRadius: 8,
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
                autoFocus
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    saveInputQuantity();
                  }
                }}
              />
            </div>
            <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end'}}>
              <button
                onClick={() => {
                  setShowingInputModal(false);
                  setInputItemId(null);
                  setInputQuantity('');
                }}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Hủy
              </button>
              <button
                onClick={saveInputQuantity}
                style={{
                  padding: '10px 20px',
                  background: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '14px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManagement;

