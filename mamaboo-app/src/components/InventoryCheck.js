import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { INVENTORY_STORAGE_KEY, INVENTORY_CATEGORIES } from '../constants/inventory';

function InventoryCheck() {
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [lastCheckDate, setLastCheckDate] = useState('');

  // Load dữ liệu kiểm tra gần nhất
  React.useEffect(() => {
    try {
      const records = JSON.parse(localStorage.getItem(INVENTORY_STORAGE_KEY) || '[]');
      if (records.length > 0) {
        // Hỗ trợ cả format cũ và format mới (minimal)
        const latest = records[0]; // Đã là bản ghi mới nhất
        const date = latest.d || latest.date; // Hỗ trợ cả format viết tắt và đầy đủ
        const items = latest.i || latest.items; // Hỗ trợ cả format viết tắt và đầy đủ
        
        setLastCheckDate(date);
        
        // Load giá trị từ lần kiểm tra gần nhất
        const initialData = {};
        Object.keys(INVENTORY_CATEGORIES).forEach(categoryKey => {
          INVENTORY_CATEGORIES[categoryKey].items.forEach(item => {
            // Nếu có giá trị trong items thì dùng, không thì để rỗng
            initialData[item.id] = items && items[item.id] !== undefined ? items[item.id] : '';
          });
        });
        setFormData(initialData);
      } else {
        // Khởi tạo form rỗng
        const initialData = {};
        Object.keys(INVENTORY_CATEGORIES).forEach(categoryKey => {
          INVENTORY_CATEGORIES[categoryKey].items.forEach(item => {
            initialData[item.id] = '';
          });
        });
        setFormData(initialData);
      }
    } catch (e) {
      console.error('Error loading inventory data:', e);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
      // Tối ưu: chỉ lưu các giá trị không rỗng để tiết kiệm dung lượng
      const optimizedItems = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        if (value !== '' && value !== null && value !== undefined) {
          optimizedItems[key] = value;
        }
      });

      // Tối ưu tối đa: chỉ lưu bản ghi mới nhất và tối giản dữ liệu
      // Loại bỏ các trường không cần thiết để tiết kiệm dung lượng
      const minimalRecord = {
        d: dateStr, // date (viết tắt)
        c: userName, // checkedBy (viết tắt)
        i: optimizedItems // items (viết tắt)
      };
      
      try {
        // Xóa dữ liệu cũ trước để giải phóng dung lượng
        try {
          localStorage.removeItem(INVENTORY_STORAGE_KEY);
        } catch (e) {
          console.warn('Could not remove old data:', e);
        }
        
        // Lưu chỉ bản ghi mới nhất với format tối giản
        localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify([minimalRecord]));
        
        alert('Đã lưu kết quả kiểm tra nguyên vật liệu!');
        navigate('/nhan-vien');
      } catch (storageError) {
        // Nếu vẫn lỗi, thử xóa các localStorage key không cần thiết khác
        if (storageError.name === 'QuotaExceededError') {
          console.warn('Storage quota exceeded, attempting cleanup...');
          
          try {
            // Xóa các key không quan trọng để giải phóng dung lượng
            const keysToRemove = ['checkinStatus', 'overtimeData']; // Các key có thể xóa
            keysToRemove.forEach(key => {
              try {
                localStorage.removeItem(key);
              } catch (e) {
                console.warn(`Could not remove ${key}:`, e);
              }
            });
            
            // Thử lưu lại
            localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify([minimalRecord]));
            alert('Đã lưu kết quả kiểm tra nguyên vật liệu! (Đã dọn dẹp localStorage)');
            navigate('/nhan-vien');
          } catch (finalError) {
            // Nếu vẫn không được, có thể dữ liệu quá lớn
            console.error('Final error saving inventory:', finalError);
            alert('Dữ liệu quá lớn, không thể lưu vào localStorage. Vui lòng liên hệ admin hoặc thử xóa dữ liệu cũ trong trình duyệt.');
          }
        } else {
          throw storageError;
        }
      }
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Có lỗi xảy ra khi lưu dữ liệu! Vui lòng thử lại.');
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

        <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 24}}>
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
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16}}>
                  {category.items.map(item => (
                    <div key={item.id} style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                      <label style={{fontSize: '14px', fontWeight: 600, color: '#2b4c66'}}>
                        {item.name} ({item.unit})
                      </label>
                      <input
                        type="text"
                        value={formData[item.id] || ''}
                        onChange={(e) => handleInputChange(item.id, e.target.value)}
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
          })}

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
      </div>
    </div>
  );
}

export default InventoryCheck;

