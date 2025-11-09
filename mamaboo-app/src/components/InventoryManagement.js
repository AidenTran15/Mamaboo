import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ITEMS_GET_API, INVENTORY_ITEMS_BATCH_UPDATE_API } from '../constants/api';

function InventoryManagement() {
  const navigate = useNavigate();
  const [inventoryItems, setInventoryItems] = useState({}); // Map itemId -> item data from API
  const [itemsByCategory, setItemsByCategory] = useState({}); // Grouped by category
  const [loading, setLoading] = useState(true);
  const [showInputModal, setShowInputModal] = useState(false);
  const [selectedItemForInput, setSelectedItemForInput] = useState(null);
  const [inputQuantity, setInputQuantity] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch inventory items from API
  React.useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        setLoading(true);
        console.log('Fetching inventory items from API:', INVENTORY_ITEMS_GET_API);
        
        const response = await fetch(INVENTORY_ITEMS_GET_API);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Response:', data);
        
        // Parse body if it's a string
        const body = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        const items = body.items || [];
        
        console.log('Items from API:', items.length, 'items');
        
        if (items.length === 0) {
          console.warn('No items found in API response');
        }
        
        // Convert array to map for easy lookup
        const itemsMap = {};
        items.forEach(item => {
          itemsMap[item.itemId] = item;
        });
        
        setInventoryItems(itemsMap);
        
        // Group items by category
        const grouped = {};
        items.forEach(item => {
          const category = item.category || 'others';
          const categoryName = item.categoryName || 'OTHERS';
          
          if (!grouped[category]) {
            grouped[category] = {
              name: categoryName,
              items: []
            };
          }
          grouped[category].items.push(item);
        });
        
        // Sort items within each category by name
        Object.keys(grouped).forEach(category => {
          grouped[category].items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        });
        
        console.log('Grouped by category:', Object.keys(grouped).length, 'categories');
        setItemsByCategory(grouped);
      } catch (e) {
        console.error('Error loading inventory items:', e);
        alert('Không thể tải dữ liệu nguyên vật liệu từ API. Vui lòng kiểm tra kết nối và thử lại.\n\nLỗi: ' + e.message);
        // Không fallback về localStorage - để trống để user biết có lỗi
        setInventoryItems({});
        setItemsByCategory({});
      } finally {
        setLoading(false);
      }
    };

    fetchInventoryItems();
  }, []);

  // Get quantity for an item
  const getItemQuantity = (itemId) => {
    const item = inventoryItems[itemId];
    return item ? (item.quantity || '0') : '0';
  };

  // Get purchase link for an item
  const getItemPurchaseLink = (itemId) => {
    const item = inventoryItems[itemId];
    return item ? (item.purchaseLink || '') : '';
  };

  // Get alert threshold for an item (from database)
  const getItemAlertThreshold = (itemId) => {
    const item = inventoryItems[itemId];
    if (item && item.alertThreshold) {
      // If alertThreshold is '0' or empty, return empty string
      const threshold = item.alertThreshold.trim();
      return (threshold === '' || threshold === '0') ? '' : threshold;
    }
    return '';
  };

  // Kiểm tra alert
  const checkAlert = (itemId) => {
    const alertThreshold = getItemAlertThreshold(itemId);
    if (!alertThreshold || alertThreshold === '' || alertThreshold === '0') return null;
    
    const currentValue = parseFloat(getItemQuantity(itemId));
    const threshold = parseFloat(alertThreshold);
    
    if (isNaN(currentValue) || isNaN(threshold)) return null;
    
    return currentValue < threshold;
  };

  // Open modal to input quantity
  const handleOpenInputModal = (item) => {
    setSelectedItemForInput(item);
    setInputQuantity('');
    setShowInputModal(true);
  };

  // Close modal
  const handleCloseInputModal = () => {
    setShowInputModal(false);
    setSelectedItemForInput(null);
    setInputQuantity('');
  };

  // Update quantity for an item (add to current quantity)
  const handleUpdateQuantity = async () => {
    if (!selectedItemForInput) return;

    if (inputQuantity === '' || inputQuantity === null || inputQuantity === undefined) {
      alert('Vui lòng nhập số lượng!');
      return;
    }

    const inputValue = parseFloat(inputQuantity);
    if (isNaN(inputValue) || inputValue < 0) {
      alert('Số lượng không hợp lệ!');
      return;
    }

    setIsUpdating(true);

    try {
      // Get full item data from inventoryItems to include all required fields
      const fullItem = inventoryItems[selectedItemForInput.itemId];
      if (!fullItem) {
        throw new Error('Không tìm thấy thông tin sản phẩm. Vui lòng refresh trang và thử lại.');
      }

      // Get current quantity and add input value
      const currentQuantity = parseFloat(getItemQuantity(selectedItemForInput.itemId)) || 0;
      const newQuantity = currentQuantity + inputValue;

      // Use batch update API (same as form nguyên vật liệu)
      const response = await fetch(INVENTORY_ITEMS_BATCH_UPDATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: {
            [selectedItemForInput.itemId]: newQuantity.toString()
          }
        })
      });

      const result = await response.json();
      const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;

      if (response.ok && (body.ok || body.statusCode === 200)) {
        // Update local state
        setInventoryItems(prev => ({
          ...prev,
          [selectedItemForInput.itemId]: {
            ...prev[selectedItemForInput.itemId],
            quantity: newQuantity.toString()
          }
        }));

        alert(`Đã nhập hàng thành công!\nSố lượng cũ: ${currentQuantity} ${fullItem.unit || selectedItemForInput.unit}\nSố lượng nhập: ${inputValue} ${fullItem.unit || selectedItemForInput.unit}\nSố lượng mới: ${newQuantity} ${fullItem.unit || selectedItemForInput.unit}`);
        handleCloseInputModal();
      } else {
        throw new Error(body?.error || body?.errorMessage || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Có lỗi xảy ra khi cập nhật số lượng!\n\nChi tiết: ' + error.message);
    } finally {
      setIsUpdating(false);
    }
  };


  return (
    <div className="login-page" style={{justifyContent: 'center', alignItems: 'flex-start'}}>
      <div className="login-container" style={{width: 1200, maxWidth: '95vw', marginTop: 24, marginBottom: 32}}>
        <h2 className="login-title" style={{color: '#3498db'}}>Quản lý nguyên vật liệu</h2>
        <div className="login-underline" style={{ background: '#3498db' }}></div>

        {loading ? (
          <div style={{textAlign: 'center', padding: '40px 0', color: '#6b7a86'}}>
            Đang tải dữ liệu...
          </div>
        ) : (
          <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
            {Object.keys(itemsByCategory).length === 0 ? (
              <div style={{textAlign: 'center', padding: '40px 0', color: '#6b7a86'}}>
                Chưa có dữ liệu nguyên vật liệu
              </div>
            ) : (
              Object.keys(itemsByCategory).map(categoryKey => {
                const category = itemsByCategory[categoryKey];
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
                            <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Nhập hàng</th>
                            <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Mua</th>
                          </tr>
                        </thead>
                        <tbody>
                          {category.items.map(item => {
                            const currentQuantity = getItemQuantity(item.itemId);
                            const purchaseLink = getItemPurchaseLink(item.itemId);
                            const hasAlert = checkAlert(item.itemId);
                            return (
                              <tr key={item.itemId} style={{
                                borderBottom: '1px solid #f1f4f7',
                                background: hasAlert ? '#fff5f5' : '#fff'
                              }}>
                                <td style={{padding: '12px', fontWeight: 600, color: '#2b4c66'}}>{item.name}</td>
                                <td style={{padding: '12px', textAlign: 'center', color: '#6b7a86'}}>{item.unit}</td>
                                <td style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>
                                  {currentQuantity}
                                </td>
                                 <td style={{padding: '12px', textAlign: 'center', color: '#6b7a86'}}>
                                   {(() => {
                                     const alertThreshold = getItemAlertThreshold(item.itemId);
                                     return alertThreshold ? `< ${alertThreshold} ${item.unit}` : '-';
                                   })()}
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
                                    onClick={() => handleOpenInputModal(item)}
                                    style={{
                                      padding: '6px 12px',
                                      background: '#10b981',
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
                                      if (purchaseLink && purchaseLink.trim() !== '') {
                                        window.open(purchaseLink, '_blank', 'noopener,noreferrer');
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
              })
            )}
          </div>
        )}

              <div style={{marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12}}>
                <button
                  onClick={() => navigate('/inventory-history')}
                  className="login-button"
                  style={{
                    padding: '12px 36px',
                    background: '#9b59b6',
                    color: '#fff'
                  }}
                >
                  Lịch sử kiểm kê
                </button>
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
      {showInputModal && selectedItemForInput && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={handleCloseInputModal}>
          <div style={{
            background: '#fff',
            borderRadius: 12,
            padding: 24,
            minWidth: 400,
            maxWidth: '90vw',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{marginTop: 0, marginBottom: 16, color: '#2b4c66'}}>
              Nhập hàng: {selectedItemForInput.name}
            </h3>
            <div style={{marginBottom: 16}}>
              <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#2b4c66'}}>
                Số lượng hiện tại: <span style={{color: '#3498db', fontSize: '16px'}}>{getItemQuantity(selectedItemForInput.itemId)} {selectedItemForInput.unit}</span>
              </label>
              <label style={{display: 'block', marginBottom: 8, fontWeight: 600, color: '#2b4c66'}}>
                Số lượng nhập vào:
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={inputQuantity}
                onChange={(e) => setInputQuantity(e.target.value)}
                placeholder="Nhập số lượng cần thêm"
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
                    handleUpdateQuantity();
                  }
                }}
              />
            </div>
            <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end'}}>
              <button
                onClick={handleCloseInputModal}
                disabled={isUpdating}
                style={{
                  padding: '10px 20px',
                  background: '#e5e7eb',
                  color: '#2b4c66',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '14px',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleUpdateQuantity}
                disabled={isUpdating}
                style={{
                  padding: '10px 20px',
                  background: isUpdating ? '#94a3b8' : '#10b981',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '14px',
                  cursor: isUpdating ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                {isUpdating ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManagement;

