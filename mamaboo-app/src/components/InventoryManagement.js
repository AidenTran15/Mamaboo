import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ITEMS_GET_API, INVENTORY_ITEMS_POST_API } from '../constants/api';

function InventoryManagement() {
  const navigate = useNavigate();
  const [inventoryItems, setInventoryItems] = useState({}); // Map itemId -> item data from API
  const [itemsByCategory, setItemsByCategory] = useState({}); // Grouped by category
  const [loading, setLoading] = useState(true);
  const [showingInputModal, setShowingInputModal] = useState(false);
  const [inputItemId, setInputItemId] = useState(null);
  const [inputQuantity, setInputQuantity] = useState('');

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

  // Xử lý nhập hàng
  const handleInputInventory = (itemId) => {
    setInputItemId(itemId);
    setInputQuantity('');
    setShowingInputModal(true);
  };

  // Lưu số lượng nhập
  const saveInputQuantity = async () => {
    if (!inputItemId) return;
    
    const quantity = parseFloat(inputQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      alert('Vui lòng nhập số lượng hợp lệ (lớn hơn 0)');
      return;
    }

    try {
      // Lấy item hiện tại từ API
      const currentItem = inventoryItems[inputItemId];
      if (!currentItem) {
        alert('Không tìm thấy sản phẩm. Vui lòng tải lại trang.');
        setShowingInputModal(false);
        return;
      }

      // Tính số lượng mới = số lượng hiện tại + số lượng nhập
      const currentValue = parseFloat(currentItem.quantity || '0');
      const newValue = currentValue + quantity;

      // Update item via API
      const updateData = {
        itemId: currentItem.itemId,
        name: currentItem.name,
        unit: currentItem.unit,
        category: currentItem.category,
        categoryName: currentItem.categoryName || '',
        purchaseLink: currentItem.purchaseLink || '',
        quantity: newValue.toString()
      };

      const response = await fetch(INVENTORY_ITEMS_POST_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();
      const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;

      if (response.ok && body.ok) {
        // Update local state
        const updatedItem = {
          ...currentItem,
          quantity: newValue.toString()
        };
        
        setInventoryItems(prev => ({
          ...prev,
          [inputItemId]: updatedItem
        }));

        // Update itemsByCategory
        setItemsByCategory(prev => {
          const updated = { ...prev };
          const category = currentItem.category || 'others';
          if (updated[category]) {
            updated[category] = {
              ...updated[category],
              items: updated[category].items.map(item => 
                item.itemId === inputItemId ? updatedItem : item
              )
            };
          }
          return updated;
        });

        const unit = currentItem.unit || '';

        alert(`Đã nhập ${quantity} ${unit}. Tổng số lượng hiện tại: ${newValue}`);
        
        setShowingInputModal(false);
        setInputItemId(null);
        setInputQuantity('');
      } else {
        throw new Error(body.error || 'Failed to update quantity');
      }
    } catch (error) {
      console.error('Error saving input quantity:', error);
      alert('Có lỗi xảy ra khi lưu số lượng! ' + error.message);
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
                            <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Thao tác</th>
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
                                    onClick={() => handleInputInventory(item.itemId)}
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
            {inputItemId && (() => {
              const item = inventoryItems[inputItemId];
              return item ? (
                <div style={{marginBottom: 16, color: '#6b7a86', fontSize: '14px'}}>
                  Sản phẩm: <strong>{item.name}</strong>
                  <br />
                  Số lượng hiện tại: <strong>{getItemQuantity(inputItemId)}</strong> {item.unit}
                </div>
              ) : null;
            })()}
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

