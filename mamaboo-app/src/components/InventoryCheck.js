import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_ITEMS_GET_API, INVENTORY_ITEMS_BATCH_UPDATE_API } from '../constants/api';

function InventoryCheck() {
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [inventoryItems, setInventoryItems] = useState({}); // Map itemId -> item data
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastCheckDate, setLastCheckDate] = useState('');

  // Fetch inventory items from API and load last check date
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch current inventory items
        const response = await fetch(INVENTORY_ITEMS_GET_API);
        const data = await response.json();
        
        // Parse body if it's a string
        const body = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        const items = body.items || [];
        
        // Convert array to map for easy lookup
        const itemsMap = {};
        items.forEach(item => {
          itemsMap[item.itemId] = item;
        });
        
        setInventoryItems(itemsMap);
        
        // Initialize form with current quantities from database
        const initialData = {};
        items.forEach(item => {
          // Pre-fill with current quantity from database
          initialData[item.itemId] = item.quantity || '';
        });
        
        setFormData(initialData);
        
        // TODO: Load last check date from inventory_records API if needed
        // For now, leave empty
        
      } catch (e) {
        console.error('Error loading inventory data:', e);
        alert('Không thể tải dữ liệu nguyên vật liệu. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Prepare items to update - include ALL items that have values (non-empty)
      // Lambda function will compare and only update if different
      const itemsToUpdate = {};
      Object.keys(formData).forEach(itemId => {
        const value = formData[itemId];
        
        // Include if value is not empty and is a valid number
        if (value !== '' && value !== null && value !== undefined) {
          const trimmedValue = value.toString().trim();
          if (trimmedValue !== '') {
            // Validate it's a number
            const numValue = parseFloat(trimmedValue);
            if (!isNaN(numValue)) {
              // Include all valid numbers - Lambda will check if it's different
              itemsToUpdate[itemId] = trimmedValue;
            }
          }
        }
      });

      console.log('Items to update:', itemsToUpdate);
      console.log('Request payload:', {
        items: itemsToUpdate,
        date: dateStr,
        checkedBy: userName || 'Unknown'
      });

      // Call batch update API
      const response = await fetch(INVENTORY_ITEMS_BATCH_UPDATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsToUpdate,
          date: dateStr,
          checkedBy: userName || 'Unknown'
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response body:', result);
      
      // Handle Lambda timeout or error response
      if (result.errorType === 'Sandbox.Timedout' || result.errorMessage) {
        throw new Error(`Lambda function timeout: ${result.errorMessage || 'Function timed out after 3 seconds. Please increase Lambda timeout or optimize the function.'}`);
      }
      
      // Parse body - handle both API Gateway format and direct response
      let body;
      if (result.body) {
        body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
      } else if (result.statusCode) {
        // Direct Lambda response format
        body = result;
      } else {
        // Fallback: use result directly
        body = result;
      }
      
      console.log('Parsed body:', body);

      // Check if response is successful
      if (response.ok && body && (body.ok || body.statusCode === 200)) {
        const updatedCount = body.count || 0;
        const errorCount = body.errors ? body.errors.length : 0;
        
        if (errorCount > 0) {
          alert(`Đã cập nhật ${updatedCount} sản phẩm. Có ${errorCount} lỗi:\n${body.errors.join('\n')}`);
        } else if (updatedCount > 0) {
          alert(`Đã lưu kết quả kiểm tra nguyên vật liệu! Cập nhật ${updatedCount} sản phẩm.`);
        } else {
          alert('Đã lưu kết quả kiểm tra nguyên vật liệu! (Không có sản phẩm nào thay đổi)');
        }
        
        navigate('/nhan-vien');
      } else {
        console.error('API Error:', body);
        const errorMsg = body?.error || body?.errorMessage || 'Failed to update inventory';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      console.error('Error stack:', error.stack);
      alert('Có lỗi xảy ra khi lưu dữ liệu!\n\nChi tiết: ' + error.message + '\n\nVui lòng mở Console (F12) để xem thêm thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (itemId, value) => {
    setFormData(prev => ({ ...prev, [itemId]: value }));
  };

  return (
    <div className="login-page" style={{justifyContent: 'center', alignItems: 'flex-start'}}>
      <div className="login-container" style={{width: 900, maxWidth: '95vw', marginTop: 24, marginBottom: 32}}>
        <h2 className="login-title" style={{color: '#3498db', alignSelf:'center'}}>Kiểm tra nguyên vật liệu</h2>
        <div className="login-underline" style={{ background: '#3498db', alignSelf:'center' }}></div>
        
        {lastCheckDate && (
          <div style={{textAlign: 'center', marginBottom: 16, color: '#6b7a86', fontSize: '14px'}}>
            Lần kiểm tra gần nhất: {lastCheckDate}
          </div>
        )}

        {loading ? (
          <div style={{textAlign: 'center', padding: '40px 0', color: '#6b7a86'}}>
            Đang tải dữ liệu...
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 24}}>
            {(() => {
              // Group items by category
              const itemsByCategory = {};
              Object.values(inventoryItems).forEach(item => {
                const category = item.category || 'others';
                const categoryName = item.categoryName || 'OTHERS';
                
                if (!itemsByCategory[category]) {
                  itemsByCategory[category] = {
                    name: categoryName,
                    items: []
                  };
                }
                itemsByCategory[category].items.push(item);
              });
              
              // Sort items within each category by name
              Object.keys(itemsByCategory).forEach(category => {
                itemsByCategory[category].items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
              });
              
              return Object.keys(itemsByCategory).map(categoryKey => {
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
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16}}>
                      {category.items.map(item => (
                        <div key={item.itemId} style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                          <label style={{fontSize: '14px', fontWeight: 600, color: '#2b4c66'}}>
                            {item.name} ({item.unit})
                          </label>
                          <input
                            type="text"
                            value={formData[item.itemId] || ''}
                            onChange={(e) => handleInputChange(item.itemId, e.target.value)}
                            placeholder={`Nhập số lượng...`}
                            style={{
                              padding: '10px 12px',
                              border: '1px solid #e6eef5',
                              borderRadius: 8,
                              fontSize: '14px'
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              });
            })()}

            <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16}}>
              <button
                type="button"
                onClick={() => navigate('/nhan-vien')}
                style={{
                  padding: '12px 24px',
                  background: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px 24px',
                  background: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                {submitting ? 'Đang lưu...' : 'Lưu kết quả kiểm tra'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default InventoryCheck;

