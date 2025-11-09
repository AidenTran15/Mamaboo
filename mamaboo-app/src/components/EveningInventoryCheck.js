import React, { useState, useEffect } from 'react';
import { INVENTORY_ITEMS_GET_API, INVENTORY_ITEMS_BATCH_UPDATE_API } from '../constants/api';

/**
 * Component form kiểm tra nguyên vật liệu cho ca tối
 * Chỉ kiểm tra các nguyên liệu chính theo form hàng ngày
 */
function EveningInventoryCheck({ onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [inventoryItems, setInventoryItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Danh sách các items cần kiểm tra (theo form)
  const REQUIRED_ITEMS = {
    'bot': {
      name: 'BỘT',
      items: [
        'matcha-thuong',
        'matcha-premium',
        'houjicha-thuong',
        'houjicha-premium',
        'cacao-bot',
        'ca-phe'
      ]
    },
    'topping': {
      name: 'TOPPING',
      items: [
        'panna-cotta',
        'banana-pudding-s',
        'banana-pudding-l'
      ]
    },
    'sua': {
      name: 'SỮA',
      items: [
        'sua-do',
        'sua-milklab-bo',
        'sua-milklab-oat',
        'boring-milk',
        'sua-dac'
      ]
    },
    'cookies': {
      name: 'COOKIES',
      items: [
        'redvelvet',
        'double-choco',
        'brownie',
        'tra-xanh-pho-mai',
        'salted-caramel-cookie',
        'ba-tuoc-vo-cam-pho-mai'
      ]
    }
  };

  // Fetch current inventory items
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(INVENTORY_ITEMS_GET_API);
        const data = await response.json();
        
        const body = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        const items = body.items || [];
        
        // Convert to map
        const itemsMap = {};
        items.forEach(item => {
          itemsMap[item.itemId] = item;
        });
        
        setInventoryItems(itemsMap);
        
        // Initialize form with current quantities
        const initialData = {};
        Object.values(REQUIRED_ITEMS).forEach(category => {
          category.items.forEach(itemId => {
            const item = itemsMap[itemId];
            initialData[itemId] = item ? (item.quantity || '') : '';
          });
        });
        
        setFormData(initialData);
      } catch (e) {
        console.error('Error loading inventory data:', e);
        alert('Không thể tải dữ liệu nguyên vật liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (itemId, value) => {
    setFormData(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const userName = localStorage.getItem('userName') || 'Unknown';
      
      // Prepare items to update - only include items with values
      const itemsToUpdate = {};
      Object.keys(formData).forEach(itemId => {
        const value = formData[itemId];
        if (value !== '' && value !== null && value !== undefined) {
          const trimmedValue = value.toString().trim();
          if (trimmedValue !== '') {
            const numValue = parseFloat(trimmedValue);
            if (!isNaN(numValue)) {
              itemsToUpdate[itemId] = trimmedValue;
            }
          }
        }
      });

      if (Object.keys(itemsToUpdate).length === 0) {
        alert('Vui lòng nhập ít nhất một số lượng!');
        setSubmitting(false);
        return;
      }

      // Call batch update API
      const response = await fetch(INVENTORY_ITEMS_BATCH_UPDATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsToUpdate,
          date: dateStr,
          checkedBy: userName
        })
      });

      const result = await response.json();
      
      // Handle Lambda timeout or error response
      if (result.errorType === 'Sandbox.Timedout' || result.errorMessage) {
        throw new Error(`Lambda function timeout: ${result.errorMessage || 'Function timed out'}`);
      }
      
      // Parse body
      let body;
      if (result.body) {
        body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      } else if (result.statusCode) {
        body = result;
      } else {
        body = result;
      }

      if (response.ok && body && (body.ok || body.statusCode === 200)) {
        const updatedCount = body.count || 0;
        const errorCount = body.errors ? body.errors.length : 0;
        
        if (errorCount > 0) {
          alert(`Đã cập nhật ${updatedCount} sản phẩm. Có ${errorCount} lỗi:\n${body.errors.join('\n')}`);
        } else {
          alert(`Đã lưu kết quả kiểm tra nguyên vật liệu! Cập nhật ${updatedCount} sản phẩm.`);
        }
        
        if (onSave) {
          onSave(itemsToUpdate);
        }
        if (onClose) {
          onClose();
        }
      } else {
        const errorMsg = body?.error || body?.errorMessage || 'Failed to update inventory';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu! ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getItemName = (itemId) => {
    const item = inventoryItems[itemId];
    return item ? item.name : itemId;
  };

  const getItemUnit = (itemId) => {
    const item = inventoryItems[itemId];
    return item ? item.unit : '';
  };

  if (loading) {
    return (
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
        zIndex: 2000
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          padding: '40px',
          textAlign: 'center',
          color: '#6b7a86'
        }}>
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  return (
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
      zIndex: 2000,
      overflowY: 'auto',
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '24px',
        width: '800px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <h2 style={{
            margin: 0,
            color: '#2b4c66',
            fontSize: '20px',
            fontWeight: 700
          }}>
            Kiểm tra nguyên vật liệu (Ca tối)
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7a86',
                padding: '0 8px'
              }}
            >
              ×
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.keys(REQUIRED_ITEMS).map(categoryKey => {
            const category = REQUIRED_ITEMS[categoryKey];
            return (
              <div key={categoryKey} style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 12,
                padding: '20px'
              }}>
                <h3 style={{
                  color: '#2b4c66',
                  marginBottom: 16,
                  fontSize: '16px',
                  fontWeight: 700,
                  borderBottom: '2px solid #3498db',
                  paddingBottom: 8
                }}>
                  {category.name}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16 }}>
                  {category.items.map(itemId => {
                    const item = inventoryItems[itemId];
                    if (!item) {
                      // Item not found in database, skip
                      return null;
                    }
                    return (
                      <div key={itemId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: '#2b4c66' }}>
                          {item.name} ({item.unit})
                        </label>
                        <input
                          type="text"
                          value={formData[itemId] || ''}
                          onChange={(e) => handleInputChange(itemId, e.target.value)}
                          placeholder="Nhập số lượng..."
                          style={{
                            padding: '10px 12px',
                            border: '1px solid #e6eef5',
                            borderRadius: 8,
                            fontSize: '14px'
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  background: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
            )}
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 24px',
                background: '#3498db',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '14px',
                fontWeight: 600,
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.6 : 1
              }}
            >
              {submitting ? 'Đang lưu...' : 'Lưu kết quả'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EveningInventoryCheck;

