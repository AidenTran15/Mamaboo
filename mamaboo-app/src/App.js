import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import InventoryManagement from './components/InventoryManagement';
import InventoryHistory from './components/InventoryHistory';
import InventoryCheck from './components/InventoryCheck';
import EveningInventoryCheck from './components/EveningInventoryCheck';
import { IMAGE_UPLOAD_API } from './constants/api';

const API_URL = 'https://ke8i236i4i.execute-api.ap-southeast-2.amazonaws.com/prod';
const ROSTER_API = 'https://ud7uaxjwtk.execute-api.ap-southeast-2.amazonaws.com/prod';
const UPDATE_ROSTER_API = 'https://rgnp5b26d5.execute-api.ap-southeast-2.amazonaws.com/prod/';
const STAFF_API = 'https://4j10nn65m6.execute-api.ap-southeast-2.amazonaws.com/prod';
const CHECKLIST_GET_API = 'https://4qwg9i4he0.execute-api.ap-southeast-2.amazonaws.com/prod';
const OVERTIME_GET_API = 'https://enxgjymmjc.execute-api.ap-southeast-2.amazonaws.com/prod';
const OVERTIME_POST_API = 'https://c659yzs9hb.execute-api.ap-southeast-2.amazonaws.com/prod';
const OVERTIME_DELETE_API = 'https://rbyhzws278.execute-api.ap-southeast-2.amazonaws.com/prod';
const PENALTY_GET_API = 'https://lfp8b72mc5.execute-api.ap-southeast-2.amazonaws.com/prod';
const PENALTY_POST_API = 'https://1w4hxsqrtc.execute-api.ap-southeast-2.amazonaws.com/prod';
// const PENALTY_DELETE_API = 'YOUR_API_GATEWAY_URL'; // Cập nhật URL sau khi deploy Lambda DELETE

// Inventory API - tạm thời dùng localStorage, có thể thay bằng API sau
const INVENTORY_STORAGE_KEY = 'inventoryRecords';
const INVENTORY_ALERTS_KEY = 'inventoryAlerts';

// Cấu trúc dữ liệu nguyên vật liệu
const INVENTORY_CATEGORIES = {
  packaging: {
    name: 'PACKAGING',
    items: [
      { id: 'tui-dung-ly-doi', name: 'Túi đựng ly đôi', unit: 'kg' },
      { id: 'tui-dung-ly-don', name: 'Túi đựng ly đơn', unit: 'kg' },
      { id: 'tui-dung-da', name: 'Túi đựng đá', unit: 'kg' },
      { id: 'giay-nen', name: 'Giấy nến', unit: 'bịch' },
      { id: 'ong-hut', name: 'Ống hút', unit: 'bịch' },
      { id: 'muong', name: 'Muỗng', unit: 'bịch' },
      { id: 'ly-500ml', name: 'Ly 500ml', unit: 'ống' },
      { id: 'ly-700ml', name: 'Ly 700ml', unit: 'ống' },
      { id: 'ly-1lit', name: 'Ly 1 lít', unit: 'ống' },
      { id: 'nap-phang-sm', name: 'Nắp phẳng S,M', unit: 'ống' },
      { id: 'nap-cau-sm', name: 'Nắp cầu S,M', unit: 'ống' },
      { id: 'nap-cau-l', name: 'Nắp cầu L', unit: 'cái' },
      { id: 'the-tich-diem', name: 'Thẻ tích điểm', unit: 'hộp' },
      { id: 'bang-keo-co-dinh-ly', name: 'Băng keo cố định ly', unit: 'cuộn' }
    ]
  },
  guestCheck: {
    name: 'GUEST CHECK',
    items: [
      { id: 'biscoff-ca-he', name: 'Biscoff Cà Hê', unit: 'tờ' },
      { id: 'banofee-latte', name: 'Banofee Latte', unit: 'tờ' },
      { id: 'tiramisu-ca-he', name: 'Tiramisu Cà Hệ', unit: 'tờ' },
      { id: 'salted-caramel-ca-he', name: 'Salted Caramel Cà Hê', unit: 'tờ' },
      { id: 'maple-latte', name: 'Maple Latte', unit: 'tờ' },
      { id: 'matcha-original', name: 'Matcha Original', unit: 'tờ' },
      { id: 'matcha-chuoi-pu-di', name: 'Matcha Chúi Pú Đi', unit: 'tờ' },
      { id: 'matcha-rim-bu-le', name: 'Matcha Rim Bù Lé', unit: 'tờ' },
      { id: 'matcha-phom-biec', name: 'Matcha Phom Biéc', unit: 'tờ' },
      { id: 'matcha-e-gey', name: 'Matcha Ê Gêy', unit: 'tờ' },
      { id: 'matcha-zau-te', name: 'Matcha Zâu Te', unit: 'tờ' },
      { id: 'matcha-trui', name: 'Matcha Trúi', unit: 'tờ' },
      { id: 'matcha-j97', name: 'Matcha J97', unit: 'tờ' },
      { id: 'matcha-canada', name: 'Matcha Canada', unit: 'tờ' },
      { id: 'matcha-thon', name: 'Matcha Thon', unit: 'tờ' },
      { id: 'houjicha-original', name: 'Houjicha Original', unit: 'tờ' },
      { id: 'houjicha-chuoi-pu-di', name: 'Houjicha Chúi Pú Đi', unit: 'tờ' },
      { id: 'houjicha-phom-biec', name: 'Houjicha Phom Biéc', unit: 'tờ' },
      { id: 'houjicha-rim-bu-le', name: 'Houjicha Rim Bù Lé', unit: 'tờ' },
      { id: 'houjicha-e-gey', name: 'Houjicha Ê Gêy', unit: 'tờ' },
      { id: 'houjicha-carameo', name: 'Houjicha Carameo', unit: 'tờ' },
      { id: 'houjicha-j97', name: 'Houjicha J97', unit: 'tờ' },
      { id: 'houjicha-canada', name: 'Houjicha Canada', unit: 'tờ' },
      { id: 'houjicha-thon', name: 'Houjicha Thon', unit: 'tờ' },
      { id: 'cacao-original', name: 'Cacao Original', unit: 'tờ' },
      { id: 'cacao-chuoi-pu-di', name: 'Cacao Chúi Pú Đi', unit: 'tờ' },
      { id: 'cacao-6-mui', name: 'Cacao 6 múi', unit: 'tờ' },
      { id: 'cacao-pmb', name: 'Cacao PMB', unit: 'tờ' },
      { id: 'cacao-caramel', name: 'Cacao Caramel', unit: 'tờ' },
      { id: 'cacao-rim-bu-le', name: 'Cacao Rim Bù Lé', unit: 'tờ' },
      { id: 'ori-makiato', name: 'Ori Makiato', unit: 'tờ' }
    ]
  },
  bot: {
    name: 'BỘT',
    items: [
      { id: 'matcha-thuong', name: 'Matcha Thường', unit: 'hủ' },
      { id: 'matcha-premium', name: 'Matcha Premium', unit: 'hủ' },
      { id: 'houjicha-thuong', name: 'Houjicha Thường', unit: 'hủ' },
      { id: 'houjicha-premium', name: 'Houjicha Premium', unit: 'hủ' },
      { id: 'cacao-bot', name: 'Cacao', unit: 'bịch' },
      { id: 'ca-phe', name: 'Cà phê', unit: 'bịch' }
    ]
  },
  sot: {
    name: 'SỐT (BÁO TÌNH TRẠNG)',
    items: [
      { id: 'maple-syrup', name: 'Maple Syrup', unit: 'chai' },
      { id: 'sot-dau', name: 'Sốt Dâu', unit: 'hủ' },
      { id: 'sot-caramel', name: 'Sốt Caramel', unit: 'chai' },
      { id: 'earl-grey', name: 'Earl Grey', unit: 'chai' },
      { id: 'sot-lotus', name: 'Sốt Lotus', unit: 'chai' },
      { id: 'hershey-scl', name: 'Hershey Scl', unit: 'chai' },
      { id: 'sot-chuoi', name: 'Sốt Chuối', unit: 'hủ' },
      { id: 'sot-tiramisu', name: 'Sốt Tiramisu', unit: 'chai' }
    ]
  },
  botFoam: {
    name: 'BỘT FOAM (BÁO TÌNH TRẠNG)',
    items: [
      { id: 'bot-kem-beo', name: 'Bột Kem béo', unit: 'hủ' },
      { id: 'bot-whipping-cream', name: 'Bột Whipping Cream', unit: 'hủ' },
      { id: 'bot-foam-pho-mai', name: 'Bột Foam Phô Mai', unit: 'hủ' },
      { id: 'bot-milk-foam', name: 'Bột Milk Foam', unit: 'hủ' },
      { id: 'bot-milk-foam-muoi', name: 'Bột Milk Foam Muối', unit: 'hủ' },
      { id: 'bot-hdb', name: 'Bột HĐB', unit: 'hủ' },
      { id: 'bot-pudding-trung', name: 'Bột Pudding Trứng', unit: 'hủ' },
      { id: 'bot-cream-brulee', name: 'Bột Cream Brulee', unit: 'hủ' }
    ]
  },
  topping: {
    name: 'TOPPING',
    items: [
      { id: 'dalgona', name: 'Dalgona', unit: 'bịch' },
      { id: 'tran-chau-dua', name: 'Trân Châu Dừa', unit: 'bịch' },
      { id: 'panna-cotta', name: 'Panna Cotta', unit: 'hủ' },
      { id: 'banana-pudding-combo', name: 'Banana Pudding combo (Báo tình trạng)', unit: 'hộp' }
    ]
  },
  bananaPudding: {
    name: 'Banana Pudding',
    items: [
      { id: 'banana-pudding-s', name: 'Banana Pudding size S', unit: 'hộp' },
      { id: 'banana-pudding-l', name: 'Banana Pudding size L', unit: 'hộp' }
    ]
  },
  sua: {
    name: 'SỮA',
    items: [
      { id: 'sua-do', name: 'Sữa đỏ', unit: 'hộp' },
      { id: 'sua-milklab-bo', name: 'Sữa Milklab Bò', unit: 'hộp' },
      { id: 'sua-milklab-oat', name: 'Sữa Milklab Oat', unit: 'hộp' },
      { id: 'boring-milk', name: 'Boring Milk', unit: 'hộp' },
      { id: 'sua-dac', name: 'Sữa đặc', unit: 'hộp' },
      { id: 'arla', name: 'Arla', unit: 'hộp' }
    ]
  },
  cookies: {
    name: 'COOKIES',
    items: [
      { id: 'redvelvet', name: 'Redvelvet', unit: 'cái' },
      { id: 'double-choco', name: 'Double choco', unit: 'cái' },
      { id: 'brownie', name: 'Brownie', unit: 'cái' },
      { id: 'tra-xanh-pho-mai', name: 'Trà xanh Phô Mai', unit: 'cái' },
      { id: 'salted-caramel-cookie', name: 'Salted Caramel', unit: 'cái' },
      { id: 'ba-tuoc-vo-cam-pho-mai', name: 'Bá tước vỏ cam Phô mai', unit: 'cái' }
    ]
  },
  veSinh: {
    name: 'VỆ SINH (BÁO TÌNH TRẠNG)',
    items: [
      { id: 'xa-bong-rua-tay', name: 'Xà bông rửa tay', unit: 'chai' },
      { id: 'con-rua-tay', name: 'Cồn rửa tay', unit: 'chai' },
      { id: 'nuoc-rua-chen', name: 'Nước rửa chén', unit: 'chai' },
      { id: 'nuoc-lau-san', name: 'Nước lau sàn', unit: 'chai' },
      { id: 'khan-giay', name: 'Khăn giấy (báo số lượng)', unit: 'bịch' },
      { id: 'binh-xit-phong', name: 'Bình xịt phòng', unit: 'chai' }
    ]
  },
  others: {
    name: 'OTHERS (BÁO TÌNH TRẠNG)',
    items: [
      { id: 'nuoc-duong', name: 'Nước đường', unit: 'bình' },
      { id: 'banh-lotus', name: 'Bánh Lotus', unit: 'gram' },
      { id: 'oreo', name: 'Oreo (báo số lượng)', unit: 'bịch' }
    ]
  }
};

function ProtectedRoute({ children }) {
  const loggedIn = !!localStorage.getItem('userName');
  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Simple multi-select dropdown with search & checkboxes (no external libs)
function MultiSelectDropdown({ options, value, onChange, placeholder = 'Chọn nhân viên' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const normalized = (s) => (s || '').toString().toLowerCase();
  const filtered = options.filter(o => normalized(o).includes(normalized(query)));

  const toggle = () => setOpen(o => !o);
  const isChecked = (name) => (value || []).includes(name);
  const handleCheck = (name) => {
    const set = new Set(value || []);
    if (set.has(name)) set.delete(name); else set.add(name);
    onChange(Array.from(set));
    setOpen(false); // Đóng dropdown sau khi chọn
  };

  // close when clicking outside (basic)
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest) return;
      if (!e.target.closest('.msd-root')) setOpen(false);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const label = (value && value.length) ? value.join(', ') : placeholder;

  return (
    <div className="msd-root" style={{ position: 'relative' }}>
      <button type="button" className="login-button" style={{
        width: '100%', background:'#fff', color:'#1c222f', border:'1px solid #d6e9f5',
        borderRadius:8, padding:'8px 10px', textAlign:'left', fontWeight:500
      }} onClick={(e)=>{e.stopPropagation(); toggle();}}>
        {label}
        <span style={{float:'right', opacity:0.6}}>▾</span>
      </button>
      {open && (
        <div style={{ position:'absolute', zIndex:1000, left:0, right:0, marginTop:6,
          background:'#fff', border:'1px solid #d6e9f5', borderRadius:10,
          boxShadow:'0 8px 26px rgba(0,0,0,0.08)', padding:8 }}
          onClick={(e)=>e.stopPropagation()}
        >
          <input
            placeholder="Tìm nhân viên..."
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            style={{ width:'100%', padding:'8px 10px', border:'1px solid #e6eef5', borderRadius:8, marginBottom:8 }}
          />
          <div style={{ maxHeight:180, overflow:'auto', paddingRight:4 }}>
            {value && value.length > 0 && (
              <div 
                style={{ padding:'8px 4px', cursor:'pointer', color:'#e67e22', fontWeight:600, borderBottom:'1px solid #eef5fa', marginBottom:4 }}
                onClick={() => { onChange([]); setOpen(false); }}
              >
                ✕ Xóa tất cả
              </div>
            )}
            {filtered.length === 0 && <div style={{padding:'6px 2px', color:'#8a97a8'}}>Không có kết quả</div>}
            {filtered.map(name => (
              <label 
                key={name} 
                style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 4px', cursor:'pointer' }}
                onClick={(e) => {
                  // Đóng dropdown khi click vào label (tên nhân viên)
                  if (e.target.tagName !== 'INPUT') {
                    handleCheck(name);
                  }
                }}
              >
                <input type="checkbox" checked={isChecked(name)} onChange={()=>handleCheck(name)} />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Simple single-select dropdown for filtering by employee
function StaffFilterDropdown({ options, value, onChange, placeholder = 'Lọc theo nhân viên' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const normalized = (s) => (s || '').toString().toLowerCase();
  const filtered = options.filter(o => normalized(o).includes(normalized(query)));

  const toggle = () => setOpen(o => !o);
  const handleSelect = (name) => {
    onChange(name);
    setOpen(false);
    setQuery('');
  };
  const handleClear = () => {
    onChange('');
    setOpen(false);
    setQuery('');
  };

  // close when clicking outside
  React.useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest) return;
      if (!e.target.closest('.staff-filter-root')) setOpen(false);
    };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const label = value || placeholder;

  return (
    <div className="staff-filter-root" style={{ position: 'relative', width: 'auto', minWidth: '140px' }}>
      <button type="button" style={{
        width: '100%', background:'#fff', color:'#1c222f', border:'1px solid #e6eef5',
        borderRadius:8, padding:'6px 8px', textAlign:'left', fontWeight:400,
        fontSize:'14px', cursor:'pointer', fontFamily:'inherit', boxSizing:'border-box'
      }} onClick={(e)=>{e.stopPropagation(); toggle();}}>
        <span style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%'}}>
          <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1}}>{label}</span>
          <span style={{opacity:0.6, marginLeft:8, flexShrink:0}}>▾</span>
        </span>
      </button>
      {open && (
        <div style={{ position:'absolute', zIndex:1000, left:0, right:0, marginTop:6,
          background:'#fff', border:'1px solid #d6e9f5', borderRadius:10,
          boxShadow:'0 8px 26px rgba(0,0,0,0.08)', padding:8 }}
          onClick={(e)=>e.stopPropagation()}
        >
          <input
            placeholder="Tìm nhân viên..."
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            style={{ width:'100%', padding:'8px 10px', border:'1px solid #e6eef5', borderRadius:8, marginBottom:8 }}
            onClick={(e)=>e.stopPropagation()}
          />
          <div style={{ maxHeight:180, overflow:'auto', paddingRight:4 }}>
            {value && (
              <div 
                style={{ padding:'8px 4px', cursor:'pointer', color:'#e67e22', fontWeight:600, borderBottom:'1px solid #eef5fa', marginBottom:4 }}
                onClick={handleClear}
              >
                ✕ Xóa lọc
              </div>
            )}
            {options.length === 0 ? (
              <div style={{padding:'6px 2px', color:'#8a97a8'}}>Đang tải danh sách nhân viên...</div>
            ) : filtered.length === 0 ? (
              <div style={{padding:'6px 2px', color:'#8a97a8'}}>Không có kết quả</div>
            ) : null}
            {filtered.map(name => (
              <div 
                key={name} 
                style={{ 
                  padding:'8px 4px', 
                  cursor:'pointer',
                  background: value === name ? '#e9f8ef' : 'transparent',
                  borderRadius:4,
                  fontWeight: value === name ? 600 : 400
                }}
                onClick={()=>handleSelect(name)}
                onMouseEnter={(e)=>e.target.style.background = value === name ? '#e9f8ef' : '#f5f9fc'}
                onMouseLeave={(e)=>e.target.style.background = value === name ? '#e9f8ef' : 'transparent'}
              >
                {name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      console.log('Gửi lên:', { username, password });
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      console.log('Response object:', response);
      const text = await response.text();
      console.log('Raw response text:', text);
      let data;
      try {
        data = JSON.parse(text);
        if (typeof data.body === 'string') data = JSON.parse(data.body);
      } catch (err) {
        console.log('Lỗi parse JSON:', err);
        setMessage('Phản hồi trả về không hợp lệ!');
        return;
      }
      console.log('Dữ liệu trả về:', data);
      if (data.success) {
        setMessage('Đăng nhập thành công! Đang chuyển trang...');
        localStorage.setItem('userName', data.user.Name || data.user.User_Name);
        setTimeout(() => {
          const tenDangNhap = (data.user && data.user.User_Name) ? data.user.User_Name : username;
          if (tenDangNhap === 'admin') navigate('/admin'); else navigate('/nhan-vien');
        }, 1200);
      } else {
        setMessage(data.message || 'Đăng nhập thất bại.');
      }
    } catch (error) {
      console.log('Lỗi gửi request:', error);
      setMessage('Có lỗi xảy ra khi kết nối đến máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2 className="login-title">ĐĂNG NHẬP</h2>
        <div className="login-underline"></div>
        <form className="login-form" onSubmit={handleSubmit}>
          <label className="login-label" htmlFor="username">Tài Khoản:</label>
          <input className="login-input" type="text" id="username" name="username" autoComplete="username" value={username} onChange={e => setUsername(e.target.value)} required />
          <label className="login-label" htmlFor="password">Mật Khẩu:</label>
          <input className="login-input" type="password" id="password" name="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="login-button" type="submit" disabled={loading}>{loading ? 'Đang kiểm tra...' : 'ĐĂNG NHẬP'}</button>
        </form>
        {message && <div style={{ marginTop: '18px', color: message.includes('thành công') ? '#43a8ef' : 'red', fontWeight: 600 }}>{message}</div>}
      </div>
    </div>
  );
}

function NhanVien() {
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); // [{date, weekday, shifts:[{text,type,canCheckOut}], isToday}]
  const [refreshKey, setRefreshKey] = useState(0); // Key để force reload
  const [showMonthlyStats, setShowMonthlyStats] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState({ 
    totalShifts: 0, 
    totalSalary: 0, 
    loading: false,
    shifts: [], // Danh sách các ca [{date, type, shiftName}]
    overtimeHours: 0,
    lateHours: 0,
    penaltyAmount: 0
  });

  const handleLogout = () => { localStorage.removeItem('userName'); navigate('/login'); };

  // Kiểm tra xem có thể bắt đầu ca không (cho phép bắt đầu từ 1 giờ trước giờ bắt đầu ca)
  const canCheckInNow = (dateStr, type) => {
    // Shift start times: sang 09:30, trua 13:30, toi 18:30 (24h)
    const startMap = { sang: { h:9, m:30 }, trua: { h:13, m:30 }, toi: { h:18, m:30 } };
    const tzNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const [y, mo, da] = dateStr.split('-').map(Number);
    
    // Tính giờ bắt đầu ca
    const shiftStart = new Date(y, mo - 1, da, (startMap[type]||{h:0}).h, (startMap[type]||{m:0}).m, 0);
    
    // Tính thời điểm cho phép bắt đầu (1 giờ trước giờ bắt đầu ca)
    const allowedStart = new Date(shiftStart.getTime() - 60 * 60 * 1000); // Trừ 1 giờ (60 phút * 60 giây * 1000ms)
    
    // Kiểm tra: phải cùng ngày và thời gian hiện tại >= thời điểm cho phép bắt đầu
    return tzNow.getFullYear() === y && 
           tzNow.getMonth() === (mo - 1) && 
           tzNow.getDate() === da && 
           tzNow.getTime() >= allowedStart.getTime();
  };

  // const canCheckOutNow = (dateStr, type) => {
  //   // Shift end times: sang 13:30, trua 18:30, toi 22:30 (24h)
  //   const endMap = { sang: { h:13, m:30 }, trua: { h:18, m:30 }, toi: { h:22, m:30 } };
  //   const tzNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  //   const [y, mo, da] = dateStr.split('-').map(Number);
  //   const end = new Date(y, mo - 1, da, (endMap[type]||{h:0}).h, (endMap[type]||{m:0}).m, 0);
  //   return tzNow.getFullYear() === y && tzNow.getMonth() === (mo - 1) && tzNow.getDate() === da && tzNow.getTime() >= end.getTime();
  // };

  // Không lưu checkinStatus vào localStorage nữa để tránh vượt quota
  // Chỉ lưu danh sách các ca đã kết vào 'checkinDone' (chỉ lưu key, rất nhẹ)
  // Xóa checkinStatus cũ để giải phóng dung lượng
  React.useEffect(() => {
    try {
      localStorage.removeItem('checkinStatus');
    } catch {}
  }, []);

  const handleCheckIn = (dateStr, type) => {
    // Không gửi "bat_dau" lên DynamoDB nữa, chỉ gửi "ket_ca" khi kết ca
    // Chuyển đến trang checklist
    navigate(`/checkin?date=${encodeURIComponent(dateStr)}&shift=${encodeURIComponent(type)}`);
  };

  // Không cần handleCheckOut nữa vì kết ca được thực hiện trong checklist

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(ROSTER_API);
        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); if (typeof data.body === 'string') data = JSON.parse(data.body); } catch { data = {}; }
        const all = Array.isArray(data.items) ? data.items : [];

        const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
        const curY = now.getFullYear();
        const curM = now.getMonth();
        const curD = now.getDate();
        // Window: from today to one month later
        const start = new Date(curY, curM, curD);
        const end = new Date(curY, curM + 1, curD);
        const byDate = new Map();
        all.forEach(r => byDate.set(r.date, r));

        const pad2 = (n) => n.toString().padStart(2, '0');
        const todayStr = `${curY}-${pad2(curM+1)}-${pad2(curD)}`;

        const result = [];
        const norm = (s) => (s || '').toString().trim();
        const build = (nameArr, tag, type, ds, isToday) => {
          const members = Array.isArray(nameArr) ? nameArr.filter(Boolean).map(norm) : (nameArr ? [norm(nameArr)] : []);
          if (members.length === 0) return null;
          if (!members.includes(norm(userName))) return null;
          const mates = members.filter(n => n !== norm(userName));
          const text = mates.length === 0 ? `${tag} · một mình` : `${tag} · cùng: ${mates.join(', ')}`;
          const key = `${userName}__${ds}__${type}`;
          // Kiểm tra xem có thể bắt đầu ca không (từ 1 giờ trước giờ bắt đầu ca)
          const canCheckIn = canCheckInNow(ds, type);
          const canCheckOut = true; // Cho phép kết ca cho tất cả
          const hasCheckedIn = false; // Không track nữa
          // Đọc từ localStorage
          let doneSet = new Set();
          try {
            const saved = localStorage.getItem('checkinDone');
            if (saved) doneSet = new Set(JSON.parse(saved));
          } catch {}
          const hasCheckedOut = doneSet.has(key);
          // Debug: log để kiểm tra
          if (hasCheckedOut) {
            console.log('Ca đã kết:', key);
          }
          return { text, type, canCheckIn, canCheckOut, hasCheckedIn, hasCheckedOut };
        };

        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          const ds = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
          const r = byDate.get(ds);
          if (!r) continue;
          const isToday = ds === todayStr;
          const shifts = [];
          const morning = build(r.sang, 'Ca sáng', 'sang', ds, isToday); if (morning) shifts.push(morning);
          const noon = build(r.trua, 'Ca trưa', 'trua', ds, isToday); if (noon) shifts.push(noon);
          const night = build(r.toi, 'Ca tối', 'toi', ds, isToday); if (night) shifts.push(night);
          if (shifts.length) {
            const weekday = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'][d.getDay()];
            result.push({ date: ds, weekday, shifts, isToday });
          }
        }
        if (mounted) setRows(result);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userName, location.pathname, refreshKey]); // Reload khi quay lại trang hoặc refreshKey thay đổi

  React.useEffect(() => {
    const el = document.getElementById('today-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [rows.length]);

  // Force reload khi quay lại trang từ checklist
  React.useEffect(() => {
    // Mỗi khi location thay đổi về /nhan-vien, force reload
    if (location.pathname === '/nhan-vien') {
      // Force reload bằng cách tăng refreshKey
      setRefreshKey(prev => prev + 1);
    }
  }, [location.pathname]);

  // Thêm listener để reload khi window focus (khi quay lại tab)
  React.useEffect(() => {
    const handleFocus = () => {
      // Reload khi quay lại tab
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const formatDate = (dateStr) => {
    // Format từ YYYY-MM-DD sang DD/MM/YYYY
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Tính thống kê tháng hiện tại - dựa trên roster giống như admin
  const calculateMonthlyStats = async () => {
    setMonthlyStats({ 
      totalShifts: 0, 
      totalSalary: 0, 
      loading: true,
      shifts: [],
      overtimeHours: 0,
      lateHours: 0,
      penaltyAmount: 0
    });
    setShowMonthlyStats(true);

    try {
      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-11
      const currentDay = now.getDate();
      
      // Tính chu kỳ lương hiện tại: từ ngày 16 tháng này đến 15 tháng sau (bao gồm cả ngày 16 và 15)
      let periodYear, periodMonth;
      if (currentDay < 16) {
        // Thuộc chu kỳ tháng trước
        if (currentMonth === 0) {
          periodYear = currentYear - 1;
          periodMonth = 11;
        } else {
          periodYear = currentYear;
          periodMonth = currentMonth - 1;
        }
      } else {
        // Thuộc chu kỳ tháng hiện tại
        periodYear = currentYear;
        periodMonth = currentMonth;
      }
      
      // Lấy dữ liệu roster
      const res = await fetch(ROSTER_API);
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); if (typeof data.body === 'string') data = JSON.parse(data.body); } catch { data = {}; }
      const all = Array.isArray(data.items) ? data.items : [];
      
      // Lấy dữ liệu overtime
      let overtimeRecords = [];
      try {
        const otRes = await fetch(OVERTIME_GET_API);
        const otText = await otRes.text();
        let otData = {};
        try { otData = JSON.parse(otText); if (typeof otData.body === 'string') otData = JSON.parse(otData.body); } catch {}
        overtimeRecords = Array.isArray(otData.items) ? otData.items : (Array.isArray(otData) ? otData : []);
      } catch (e) {
        console.error('Error fetching overtime:', e);
      }
      
      // Lấy dữ liệu penalty
      let penaltyRecords = [];
      try {
        const pRes = await fetch(PENALTY_GET_API);
        const pText = await pRes.text();
        let pData = {};
        try { pData = JSON.parse(pText); if (typeof pData.body === 'string') pData = JSON.parse(pData.body); } catch {}
        penaltyRecords = Array.isArray(pData.items) ? pData.items : (Array.isArray(pData) ? pData : []);
      } catch (e) {
        console.error('Error fetching penalty:', e);
      }

      const pad2 = (n) => n.toString().padStart(2, '0');
      const monthKey = `${periodYear}-${periodMonth + 1}`;
      
      // Tính số ca và lương dựa trên roster trong chu kỳ lương
      // Chu kỳ lương: từ ngày 16 tháng này đến 15 tháng sau (bao gồm cả ngày 16 và 15)
      const start = new Date(periodYear, periodMonth, 16);
      const end = new Date(periodYear, periodMonth + 1, 16); // exclusive, tức là bao gồm đến ngày 15
      
      const byDate = new Map();
      all.forEach(r => byDate.set(r.date, r));
      
      const norm = (s) => (s || '').toString().trim();
      const hoursByShift = { sang: 4, trua: 5, toi: 4 };
      const rateSingle = 20000;
      const rateDouble = 20000;
      const ratePerHour = 20000;
      
      let totalShifts = 0;
      let baseSalary = 0;
      const shiftsList = []; // Danh sách các ca
      const shiftNames = { sang: 'Ca sáng', trua: 'Ca trưa', toi: 'Ca tối' };
      
      // Lấy ngày hiện tại để so sánh (chỉ tính đến ngày hiện tại)
      const todayDateStr = `${currentYear}-${pad2(currentMonth+1)}-${pad2(currentDay)}`;
      
      // Duyệt qua tất cả ngày trong chu kỳ lương
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const ds = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
        const r = byDate.get(ds);
        if (!r) continue;
        
        // Chỉ tính các ca có ngày <= ngày hiện tại (bỏ qua các ca tương lai)
        // So sánh chuỗi ngày để tránh vấn đề về timezone
        if (ds > todayDateStr) continue;
        
        // Kiểm tra các ca
        const shiftTypes = ['sang', 'trua', 'toi'];
        for (let i = 0; i < shiftTypes.length; i++) {
          const type = shiftTypes[i];
          const nameArr = r[type];
          const members = Array.isArray(nameArr) ? nameArr.filter(Boolean).map(norm) : (nameArr ? [norm(nameArr)] : []);
          if (members.length === 0) continue;
          if (!members.includes(norm(userName))) continue;
          
          // Đếm số ca (tất cả các ca trong roster từ đầu chu kỳ đến ngày hiện tại)
          totalShifts++;
          
          // Lưu thông tin ca vào danh sách
          shiftsList.push({
            date: ds,
            dateFormatted: formatDate(ds),
            type: type,
            shiftName: shiftNames[type]
          });
          
          // Tính lương cho tất cả các ca trong roster (từ đầu chu kỳ đến ngày hiện tại)
          const hours = hoursByShift[type];
          const isSingle = members.length === 1;
          const rate = isSingle ? rateSingle : rateDouble;
          baseSalary += hours * rate;
        }
      }
      
      // Tính tăng ca và đi trễ theo chu kỳ lương
      let overtimeHours = 0;
      let lateHours = 0;
      
      const rebuildOvertimeData = (records) => {
        const data = {};
        if (!records || records.length === 0) return data;
        
        records.forEach(record => {
          // Tính chu kỳ lương của record
          let recordDateStr = record.date;
          if (typeof record.date !== 'string') {
            const d = new Date(record.date);
            recordDateStr = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
          }
          const [y, m, d] = recordDateStr.split('-').map(Number);
          let recordPeriodMonth = m - 1; // Convert to 0-based month
          let recordPeriodYear = y;
          if (d < 15) {
            // Thuộc chu kỳ tháng trước
            if (recordPeriodMonth === 0) {
              recordPeriodMonth = 11;
              recordPeriodYear = y - 1;
            } else {
              recordPeriodMonth = recordPeriodMonth - 1;
            }
          }
          const recordMonthKey = `${recordPeriodYear}-${recordPeriodMonth + 1}`;
          
          // Nếu record thuộc chu kỳ này và nhân viên khớp
          if (recordMonthKey === monthKey && record.staffName && norm(record.staffName) === norm(userName)) {
            if (record.type === 'overtime') {
              overtimeHours += parseFloat(record.hours || 0);
            } else if (record.type === 'late') {
              lateHours += parseFloat(record.hours || 0);
            }
          }
        });
      };
      
      rebuildOvertimeData(overtimeRecords);
      
      // Tính tiền phạt theo chu kỳ lương
      let penaltyAmount = 0;
      const PENALTY_RATES = {
        '0': 0, '1': 40000, '2': 80000, '3': 100000, '4': 150000, '5': 200000
      };
      
      penaltyRecords.forEach(record => {
        if (record.staffName && norm(record.staffName) === norm(userName)) {
          // Tính chu kỳ lương của record
          let recordDateStr = record.date;
          if (typeof record.date !== 'string') {
            const d = new Date(record.date);
            recordDateStr = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
          }
          const [y, m, d] = recordDateStr.split('-').map(Number);
          let recordPeriodMonth = m - 1; // Convert to 0-based month
          let recordPeriodYear = y;
          if (d < 15) {
            // Thuộc chu kỳ tháng trước
            if (recordPeriodMonth === 0) {
              recordPeriodMonth = 11;
              recordPeriodYear = y - 1;
            } else {
              recordPeriodMonth = recordPeriodMonth - 1;
            }
          }
          const recordMonthKey = `${recordPeriodYear}-${recordPeriodMonth + 1}`;
          
          // Nếu record thuộc chu kỳ này
          if (recordMonthKey === monthKey) {
            const level = String(record.level || record.penaltyLevel || '0');
            penaltyAmount += PENALTY_RATES[level] || 0;
          }
        }
      });
      
      // Mamaboo là chủ nên không tính lương (luôn = 0)
      const isMamaboo = norm(userName).toLowerCase() === 'mamaboo';
      const baseSalaryFinal = isMamaboo ? 0 : baseSalary;
      
      // Tính tổng lương: lương ca làm + tăng ca - đi trễ - phạt
      const overtimePay = overtimeHours * ratePerHour;
      const latePay = lateHours * ratePerHour;
      const totalSalary = baseSalaryFinal + overtimePay - latePay - penaltyAmount;
      
      setMonthlyStats({ 
        totalShifts, 
        totalSalary: Math.max(0, totalSalary), 
        loading: false,
        shifts: shiftsList,
        overtimeHours: overtimeHours,
        lateHours: lateHours,
        penaltyAmount: penaltyAmount
      });
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
      setMonthlyStats({ 
        totalShifts: 0, 
        totalSalary: 0, 
        loading: false,
        shifts: [],
        overtimeHours: 0,
        lateHours: 0,
        penaltyAmount: 0
      });
    }
  };

  return (
    <div className="login-page nhan-vien-page" style={{justifyContent: 'center', alignItems: 'flex-start'}}>
      <div className="login-container nhan-vien-container" style={{width: 750, maxWidth: '95vw', marginTop: 40, marginBottom: 32, alignItems:'stretch'}}>
        <h2 className="login-title" style={{color: '#2ecc71', alignSelf:'center'}}>Nhân Viên</h2>
        <div className="login-underline" style={{ background: '#2ecc71', alignSelf:'center' }}></div>
        <div style={{textAlign: 'center', fontSize: 18, marginTop: 10, marginBottom: 20, color: '#2b4c66'}}>
          Xin chào {userName ? userName : 'bạn'}!
        </div>

        <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 24, flexWrap: 'wrap'}}>
          <button 
            onClick={calculateMonthlyStats}
            style={{
              padding: '10px 20px',
              background: '#2ecc71',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#27ae60';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#2ecc71';
            }}
          >
            Xem thống kê tháng này
          </button>
          
          <button 
            onClick={() => navigate('/inventory-check')}
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2980b9';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#3498db';
            }}
          >
            Kiểm tra nguyên vật liệu
          </button>
        </div>

        <h3 style={{alignSelf:'center', margin:'12px 0 16px', fontSize: '18px', color: '#2b4c66'}}>Ca làm trong chu kỳ lương hiện tại</h3>
        {loading ? (
          <div style={{
            textAlign:'center',
            width:'100%',
            padding: '40px 20px',
            color:'#6b7a86',
            fontSize: '16px'
          }}>
            <div style={{fontSize: '32px', marginBottom: 12}}>⏳</div>
            Đang tải...
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:16, width:'100%', maxWidth: 720, margin:'0 auto 12px'}}>
            {rows.length === 0 ? (
              <div style={{
                textAlign:'center',
                color:'#6b7a86',
                padding: '40px 20px',
                background: '#f9fafb',
                borderRadius: 12,
                border: '1px dashed #e5e7eb'
              }}>
                <div style={{fontSize: '48px', marginBottom: 12}}>📋</div>
                <div style={{fontSize: '16px'}}>Không có ca trong chu kỳ này</div>
              </div>
            ) : rows.map((r) => (
              <div 
                id={r.isToday ? 'today-card' : undefined} 
                key={r.date} 
                className="shift-card"
                style={{
                  background: r.isToday ? '#f0fbff' : '#fff',
                  border: r.isToday ? '2px solid #3498db' : '1px solid #e9f2f8',
                  borderRadius: 12,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  padding: '14px 16px',
                  width: '100%',
                  margin: '0 auto'
                }}
              >
                <div style={{
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <div style={{fontWeight:700, color:'#2b4c66', fontSize: '16px'}}>{r.weekday}</div>
                  <div style={{
                    opacity:0.8,
                    color: '#6b7a86',
                    fontSize: '14px'
                  }}>{formatDate(r.date)}</div>
                </div>
                {/* Danh sách các ca trong ngày */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8
                }}>
                  {r.shifts.map((s, idx) => {
                    const shiftNames = { sang: 'Ca sáng', trua: 'Ca trưa', toi: 'Ca tối' };
                    const shiftColors = { 
                      sang: { bg: '#e9f8ef', text: '#1e7e34' },
                      trua: { bg: '#fff5e5', text: '#c17d00' },
                      toi: { bg: '#f3eaff', text: '#6f42c1' }
                    };
                    const color = shiftColors[s.type] || shiftColors.sang;
                    
                    return (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: s.hasCheckedOut ? '#f0f9ff' : color.bg,
                          border: `1px solid ${s.hasCheckedOut ? '#e0f2fe' : '#e5e7eb'}`,
                          borderRadius: 8
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          flex: 1
                        }}>
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontWeight: 600,
                              color: s.hasCheckedOut ? '#6b7a86' : color.text,
                              fontSize: '14px',
                              marginBottom: 2,
                              textDecoration: s.hasCheckedOut ? 'line-through' : 'none',
                              opacity: s.hasCheckedOut ? 0.7 : 1
                            }}>
                              {shiftNames[s.type]}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: '#6b7a86',
                              opacity: 0.8
                            }}>
                              {s.text}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          {s.hasCheckedOut ? (
                            <span style={{
                              fontWeight: 600,
                              color: '#2ecc71',
                              fontSize: '11px',
                              background: '#d1fae5',
                              padding: '4px 8px',
                              borderRadius: 4,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              ✅ Đã kết ca
                            </span>
                          ) : (s.canCheckIn || s.hasCheckedIn) ? (
                            <button
                              onClick={() => handleCheckIn(r.date, s.type)}
                              style={{
                                padding: '5px 10px',
                                background: '#667eea',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                whiteSpace: 'nowrap'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#5568d3';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = '#667eea';
                              }}
                            >
                              {s.hasCheckedIn ? 'Vào checklist' : 'Bắt đầu'}
                            </button>
                          ) : (
                            <span style={{
                              fontWeight: 500,
                              color: '#6b7a86',
                              fontSize: '11px',
                              background: '#f0f4f8',
                              padding: '4px 8px',
                              borderRadius: 4
                            }}>
                              Chưa tới giờ bắt đầu ca
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <button 
          style={{
            marginTop: 24,
            alignSelf:'center',
            padding: '10px 24px',
            background: '#e74c3c',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          className="login-button logout-btn"
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.target.style.background = '#c0392b';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#e74c3c';
          }}
        >
          Đăng xuất
        </button>
      </div>

      {/* Modal thống kê tháng */}
      {showMonthlyStats && (
        <div 
          style={{
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
          }}
          onClick={() => setShowMonthlyStats(false)}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowMonthlyStats(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#6b7a86',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#f0f0f0';
                e.target.style.color = '#2b4c66';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#6b7a86';
              }}
            >
              ×
            </button>
            
            <h2 style={{color: '#2ecc71', marginBottom: 24, textAlign: 'center', fontSize: '24px'}}>
              Thống kê tháng này
            </h2>
            
            {monthlyStats.loading ? (
              <div style={{textAlign: 'center', padding: '40px 0', color: '#6b7a86'}}>
                Đang tính toán...
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: 20}}>
                {/* Tổng số ca */}
                <div style={{
                  background: '#f0fbff',
                  padding: '20px',
                  borderRadius: 12,
                  border: '1px solid #e9f2f8'
                }}>
                  <div style={{fontSize: '14px', color: '#6b7a86', marginBottom: 8}}>Tổng số ca đã làm</div>
                  <div style={{fontSize: '32px', fontWeight: 700, color: '#2ecc71'}}>
                    {monthlyStats.totalShifts} ca
                  </div>
                </div>

                {/* Danh sách các ca */}
                {monthlyStats.shifts && monthlyStats.shifts.length > 0 && (
                  <div style={{
                    background: '#f9fafb',
                    padding: '16px',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    <div style={{fontSize: '14px', fontWeight: 600, color: '#2b4c66', marginBottom: 12}}>
                      Danh sách các ca:
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                      {monthlyStats.shifts.map((shift, idx) => (
                        <div key={idx} style={{
                          background: '#fff',
                          padding: '10px 12px',
                          borderRadius: 8,
                          border: '1px solid #e5e7eb',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{fontSize: '13px', fontWeight: 600, color: '#2b4c66'}}>
                              {shift.shiftName}
                            </div>
                            <div style={{fontSize: '12px', color: '#6b7a86', marginTop: 2}}>
                              {shift.dateFormatted}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tổng giờ tăng ca */}
                <div style={{
                  background: '#e8f5e9',
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid #c8e6c9'
                }}>
                  <div style={{fontSize: '14px', color: '#6b7a86', marginBottom: 4}}>Tổng số giờ tăng ca</div>
                  <div style={{fontSize: '24px', fontWeight: 700, color: '#2e7d32'}}>
                    {Number(monthlyStats.overtimeHours || 0).toFixed(2)} giờ
                  </div>
                </div>

                {/* Tổng giờ đi trễ */}
                <div style={{
                  background: '#fff3e0',
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid #ffcc80'
                }}>
                  <div style={{fontSize: '14px', color: '#6b7a86', marginBottom: 4}}>Tổng số giờ đi trễ</div>
                  <div style={{fontSize: '24px', fontWeight: 700, color: '#e65100'}}>
                    {Number(monthlyStats.lateHours || 0).toFixed(2)} giờ
                  </div>
                </div>

                {/* Tổng tiền phạt */}
                <div style={{
                  background: '#ffebee',
                  padding: '16px',
                  borderRadius: 12,
                  border: '1px solid #ffcdd2'
                }}>
                  <div style={{fontSize: '14px', color: '#6b7a86', marginBottom: 4}}>Tổng số tiền bị phạt</div>
                  <div style={{fontSize: '24px', fontWeight: 700, color: '#c62828'}}>
                    {Number(monthlyStats.penaltyAmount || 0).toLocaleString('vi-VN')} VND
                  </div>
                </div>
                
                {/* Tổng lương */}
                <div style={{
                  background: '#fff5e5',
                  padding: '20px',
                  borderRadius: 12,
                  border: '1px solid #ffe8cc'
                }}>
                  <div style={{fontSize: '14px', color: '#6b7a86', marginBottom: 8}}>Tổng lương tháng này</div>
                  <div style={{fontSize: '32px', fontWeight: 700, color: '#e67e22'}}>
                    {Number(monthlyStats.totalSalary).toLocaleString('vi-VN')} VND
                  </div>
                </div>
                
                <button
                  onClick={() => setShowMonthlyStats(false)}
                  style={{
                    marginTop: 8,
                    padding: '12px 24px',
                    background: '#2ecc71',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 12,
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = '#27ae60';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = '#2ecc71';
                  }}
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Admin() {
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState('');
  const [staffs, setStaffs] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [staffSalary, setStaffSalary] = useState({});
  // Checklist state
  const [ckFrom, setCkFrom] = useState('');
  const [ckTo, setCkTo] = useState('');
  const [ckUser, setCkUser] = useState('');
  const [ckLoading, setCkLoading] = useState(false);
  const [ckItems, setCkItems] = useState([]);
  const today = new Date();
  // Tính chu kỳ lương hiện tại: từ ngày 16 tháng này đến 15 tháng sau (bao gồm cả ngày 16 và 15)
  // Nếu ngày hiện tại < 16: chu kỳ là tháng trước (ví dụ: 4/11 → chu kỳ 10-11)
  // Nếu ngày hiện tại >= 16: chu kỳ là tháng hiện tại (ví dụ: 20/11 → chu kỳ 11-12)
  const getCurrentPayPeriod = () => {
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    const currentDay = today.getDate();
    
    if (currentDay < 16) {
      // Thuộc chu kỳ tháng trước
      if (currentMonth === 0) {
        // Tháng 1 → chu kỳ 12 năm trước
        return { year: currentYear - 1, month: 11 };
      } else {
        return { year: currentYear, month: currentMonth - 1 };
      }
    } else {
      // Thuộc chu kỳ tháng hiện tại
      return { year: currentYear, month: currentMonth };
    }
  };
  
  const currentPeriod = getCurrentPayPeriod();
  const [year, setYear] = useState(currentPeriod.year);
  const [month, setMonth] = useState(currentPeriod.month); // 0-11
  const [monthData, setMonthData] = useState([]); // [{date: 'YYYY-MM-DD', sang:[], trua:[], toi:[]}] hiện tại tháng
  const [monthEdit, setMonthEdit] = useState([]);
  // State cho tăng ca và đi trễ: { [year-month]: { [name]: { overtime: 0, lateCount: 0 } } }
  // Tính lại từ records để đảm bảo đúng chu kỳ lương
  // Hàm này có thể nhận records từ API hoặc localStorage
  const rebuildOvertimeDataFromRecords = (records) => {
    try {
      const data = {};
      
      if (!records || records.length === 0) return data;
      
      records.forEach(record => {
        // Tính chu kỳ lương: từ ngày 16 tháng này đến 15 tháng sau (bao gồm cả ngày 16 và 15)
        const [y, m, d] = record.date.split('-').map(Number);
        let periodMonth = m;
        let periodYear = y;
        if (d < 16) {
          // Thuộc chu kỳ tháng trước
          if (m === 1) {
            periodMonth = 12;
            periodYear = y - 1;
          } else {
            periodMonth = m - 1;
          }
        }
        const monthKey = `${periodYear}-${periodMonth}`;
        
        if (!data[monthKey]) data[monthKey] = {};
        if (!data[monthKey][record.staffName]) data[monthKey][record.staffName] = { overtime: 0, lateCount: 0 };
        
        if (record.type === 'overtime') {
          data[monthKey][record.staffName].overtime = (data[monthKey][record.staffName].overtime || 0) + record.hours;
        } else {
          data[monthKey][record.staffName].lateCount = (data[monthKey][record.staffName].lateCount || 0) + record.hours;
        }
      });
      
      return data;
    } catch {
      return {};
    }
  };
  
  // eslint-disable-next-line no-unused-vars
  const [overtimeData, setOvertimeData] = useState({});
  const [overtimeRecords, setOvertimeRecords] = useState([]); // Lưu records để dùng cho rebuild
  
  // Penalty records - fetch từ API hoặc localStorage
  const [penaltyRecords, setPenaltyRecords] = useState([]);
  
  // Fetch penalty records từ API hoặc localStorage
  React.useEffect(() => {
    (async () => {
      try {
        // Thử fetch từ API trước
        if (PENALTY_GET_API && !PENALTY_GET_API.includes('YOUR_API_GATEWAY_URL')) {
          const res = await fetch(PENALTY_GET_API);
          const text = await res.text();
          let parsed = {};
          try { parsed = JSON.parse(text); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch {}
          const items = Array.isArray(parsed.items) ? parsed.items : [];
          if (items.length >= 0) { // Luôn dùng API nếu có data (kể cả empty array)
            setPenaltyRecords(items);
            return;
          }
        }
      } catch (e) {
        console.log('Failed to fetch penalty from API, using localStorage:', e);
      }
      
      // Fallback: dùng localStorage
      try {
        const saved = localStorage.getItem('penaltyRecords');
        const records = saved ? JSON.parse(saved) : [];
        setPenaltyRecords(records);
      } catch (e) {
        console.error('Error loading penalty records:', e);
      }
    })();
  }, []);

  // Tạo danh sách các chu kỳ lương (từ 16 tháng này đến 15 tháng sau)
  const generatePayPeriods = () => {
    const periods = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Tạo 13 chu kỳ gần nhất (6 tháng trước đến 6 tháng sau)
    for (let i = -6; i <= 6; i++) {
      let year = currentYear;
      let month = currentMonth + i;
      
      // Xử lý overflow/underflow của tháng
      if (month < 0) {
        month += 12;
        year -= 1;
      } else if (month >= 12) {
        month -= 12;
        year += 1;
      }
      
      // Tính tháng tiếp theo
      let nextMonth = month + 1;
      if (nextMonth >= 12) {
        nextMonth = 0;
      }
      
      // Format: "YYYY-MM" cho key, "Tháng MM/MM+1" cho display
      const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const periodLabel = `Tháng ${String(month + 1).padStart(2, '0')}/${String(nextMonth + 1).padStart(2, '0')}`;
      
      periods.push({
        key: periodKey,
        label: periodLabel,
        year: year,
        month: month
      });
    }
    
    return periods.sort((a, b) => {
      // Sắp xếp theo năm và tháng (mới nhất trước)
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const payPeriods = generatePayPeriods();

  // Penalty rates: mức 0 = 0k (nhắc nhở), mức 1 = 40k, mức 2 = 80k, mức 3 = 100k, mức 4 = 150k, mức 5 = 200k
  const PENALTY_RATES = {
    '0': 0,
    '1': 40000,
    '2': 80000,
    '3': 100000,
    '4': 150000,
    '5': 200000
  };
  
  // Tính tổng tiền phạt cho nhân viên trong chu kỳ lương
  const calculatePenaltyAmount = (staffName, monthKey) => {
    try {
      let totalPenalty = 0;
      if (!penaltyRecords || penaltyRecords.length === 0) {
        return 0;
      }
      
      penaltyRecords.forEach(record => {
        // Kiểm tra xem record có thuộc chu kỳ lương này không
        if (!record.date || !record.staffName) return;
        
        const [recordYear, recordMonth, recordDay] = record.date.split('-').map(Number);
        let recordPeriodMonth = recordMonth;
        let recordPeriodYear = recordYear;
        
        // Tính chu kỳ lương của record (từ ngày 16 tháng này đến 15 tháng sau, bao gồm cả ngày 16 và 15)
        // Ví dụ: ngày 5/11 thuộc chu kỳ 10-11 (từ 16/10 đến 15/11)
        // Ngày 20/11 thuộc chu kỳ 11-12 (từ 16/11 đến 15/12)
        if (recordDay < 16) {
          if (recordMonth === 1) {
            recordPeriodMonth = 12;
            recordPeriodYear = recordYear - 1;
          } else {
            recordPeriodMonth = recordMonth - 1;
          }
        }
        
        const recordMonthKey = `${recordPeriodYear}-${recordPeriodMonth}`;
        
        // Nếu record thuộc chu kỳ này và nhân viên khớp
        if (recordMonthKey === monthKey && record.staffName === staffName) {
          const rate = PENALTY_RATES[record.penaltyLevel] || 0;
          totalPenalty += rate;
        }
      });
      
      return totalPenalty;
    } catch (error) {
      console.error('Error calculating penalty:', error);
      return 0;
    }
  };
  
  // Reload penaltyRecords khi localStorage thay đổi hoặc khi cần refresh
  React.useEffect(() => {
    const checkPenaltyRecords = async () => {
      try {
        // Thử reload từ API trước
        if (PENALTY_GET_API && !PENALTY_GET_API.includes('YOUR_API_GATEWAY_URL')) {
          try {
            const res = await fetch(PENALTY_GET_API);
            const text = await res.text();
            let parsed = {};
            try { parsed = JSON.parse(text); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch {}
            const items = Array.isArray(parsed.items) ? parsed.items : [];
            setPenaltyRecords(items);
            return;
          } catch (e) {
            console.log('Failed to reload from API:', e);
          }
        }
        
        // Fallback: dùng localStorage
        const saved = localStorage.getItem('penaltyRecords');
        const records = saved ? JSON.parse(saved) : [];
        setPenaltyRecords(records);
      } catch (e) {
        console.error('Error loading penalty records:', e);
      }
    };
    
    // Listen for storage changes
    window.addEventListener('storage', checkPenaltyRecords);
    
    // Check periodically (in case data changes)
    const interval = setInterval(checkPenaltyRecords, 2000);
    
    return () => {
      window.removeEventListener('storage', checkPenaltyRecords);
      clearInterval(interval);
    };
  }, []);
  
  // Fetch overtime records từ API hoặc localStorage
  React.useEffect(() => {
    (async () => {
      try {
        // Thử fetch từ API trước
        if (OVERTIME_GET_API && !OVERTIME_GET_API.includes('YOUR_API_GATEWAY_URL')) {
          const res = await fetch(OVERTIME_GET_API);
          const text = await res.text();
          let parsed = {};
          try { parsed = JSON.parse(text); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch {}
          const items = Array.isArray(parsed.items) ? parsed.items : [];
          if (items.length > 0) {
            setOvertimeRecords(items);
            const rebuilt = rebuildOvertimeDataFromRecords(items);
            setOvertimeData(rebuilt);
            return;
          }
        }
      } catch (e) {
        console.log('Failed to fetch from API, using localStorage:', e);
      }
      
      // Fallback: dùng localStorage
      try {
        const saved = localStorage.getItem('overtimeRecords');
        const records = saved ? JSON.parse(saved) : [];
        setOvertimeRecords(records);
        const rebuilt = rebuildOvertimeDataFromRecords(records);
        if (Object.keys(rebuilt).length > 0) {
          setOvertimeData(rebuilt);
        } else {
          // Không cần fallback từ localStorage nữa vì có thể tính lại từ records
          // Nếu records rỗng thì overtimeData cũng rỗng
          setOvertimeData({});
        }
      } catch (e) {
        console.error('Error loading overtime data:', e);
      }
    })();
  }, []);

  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  // const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  // const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        // Fetch roster (to get all days we have)
        const res = await fetch(ROSTER_API);
        const text = await res.text();
        let data = {};
        try { data = JSON.parse(text); if (typeof data.body === 'string') data = JSON.parse(data.body); } catch { data = {}; }
        const items = Array.isArray(data.items) ? data.items : [];
        setRoster(items);
        // Lấy danh sách nhân viên từ STAFF_API (không trộn dữ liệu ảo từ roster)
        let list = [];
        const salaryMap = {};
        try {
          const rs = await fetch(STAFF_API);
          const rsText = await rs.text();
          let parsed = {};
          try { parsed = JSON.parse(rsText); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch { parsed = {}; }
          const itemsStaff = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
          itemsStaff.forEach(s => {
            const name = (s.Name || s.User_Name || s.name || s['Tên'] || '').toString().trim();
            if (!name) return;
            // Loại bỏ "kiett" khỏi danh sách nhân viên
            if (name.toLowerCase() === 'kiett') return;
            list.push(name);
            const sal = Number(s.Salary || s.salary || 0);
            salaryMap[name] = isNaN(sal) ? 0 : sal;
          });
        } catch {}
        setStaffs(list.sort((a,b)=>a.localeCompare(b,'vi')));
        setStaffSalary(salaryMap);
      } catch (e) {
        if (isMounted) setError('Không tải được roster.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const fetchChecklist = async () => {
    setCkLoading(true);
    try {
      const url = new URL(CHECKLIST_GET_API);
      if (ckFrom) url.searchParams.set('from', ckFrom);
      if (ckTo) url.searchParams.set('to', ckTo);
      if (ckUser) url.searchParams.set('user', ckUser);
      const res = await fetch(url.toString());
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); if (typeof data.body === 'string') data = JSON.parse(data.body); } catch {}
      const items = Array.isArray(data.items) ? data.items : [];
      setCkItems(items);
    } catch (e) {
      console.log('Fetch checklist error', e);
    } finally {
      setCkLoading(false);
    }
  };

  // Xây dựng dữ liệu cho chu kỳ lương: từ ngày 16 tháng hiện tại đến 15 tháng sau (bao gồm cả ngày 16 và 15)
  const rebuildMonthData = React.useCallback(() => {
    const byDate = new Map();
    roster.forEach(r => { byDate.set(r.date, r); });

    const start = new Date(year, month, 16); // inclusive
    const end = new Date(year, month + 1, 16); // exclusive, tức là bao gồm đến ngày 15

    // Helper function để filter "kiett" ra khỏi mảng nhân viên
    const filterKiett = (arr) => {
      if (!Array.isArray(arr)) {
        arr = arr ? [arr] : [];
      }
      return arr.filter(name => {
        const n = (name || '').toString().trim().toLowerCase();
        return n !== 'kiett';
      });
    };

    const arr = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const base = byDate.get(dateStr) || { date: dateStr, sang: [], trua: [], toi: [] };
      arr.push({
        date: dateStr,
        sang: filterKiett(base.sang),
        trua: filterKiett(base.trua),
        toi: filterKiett(base.toi),
      });
    }
    setMonthData(arr);
    setMonthEdit(JSON.parse(JSON.stringify(arr)));
  }, [roster, year, month]);

  React.useEffect(() => { rebuildMonthData(); }, [rebuildMonthData]);
  
  // Rebuild overtimeData khi records thay đổi
  React.useEffect(() => {
    if (overtimeRecords.length > 0) {
      const rebuilt = rebuildOvertimeDataFromRecords(overtimeRecords);
      setOvertimeData(rebuilt);
      // Không lưu vào localStorage nữa vì có thể tính lại từ overtimeRecords
      // và để tránh vượt quota. Nếu cần, có thể tính lại từ overtimeRecords khi load.
      try {
        // Thử xóa overtimeData cũ nếu có để giải phóng dung lượng
        localStorage.removeItem('overtimeData');
      } catch (e) {
        // Ignore errors when removing
      }
    }
  }, [overtimeRecords]);

  const handleLogout = () => { localStorage.removeItem('userName'); navigate('/login'); };
  const prevMonth = () => { const m = month - 1; if (m < 0) { setMonth(11); setYear(y => y-1); } else setMonth(m); };
  const nextMonth = () => { const m = month + 1; if (m > 11) { setMonth(0); setYear(y => y+1); } else setMonth(m); };

  const handleEdit = () => { setEditMode(true); setInfo(''); };
  const handleCancel = () => { setMonthEdit(JSON.parse(JSON.stringify(monthData))); setEditMode(false); setInfo(''); };
  const handleChange = (rowIdx, ca, e) => {
    const values = Array.from(e.target.selectedOptions).map(o => o.value);
    setMonthEdit(prev => prev.map((r,i)=> i===rowIdx ? { ...r, [ca]: values } : r));
  };

  const handleSave = async () => {
    setSaving(true); setInfo('');
    let changed = 0;
    // Helper function để filter "kiett" ra khỏi mảng nhân viên
    const filterKiett = (arr) => {
      if (!Array.isArray(arr)) return [];
      return arr.filter(name => {
        const n = (name || '').toString().trim().toLowerCase();
        return n !== 'kiett';
      });
    };
    for (let i=0;i<monthEdit.length;i++) {
      const before = monthData[i];
      const after = monthEdit[i];
      if (!before || !after) continue;
      for (const ca of ['sang','trua','toi']) {
        // Filter "kiett" ra trước khi so sánh và lưu
        const filteredAfter = filterKiett(after[ca] || []);
        const a = JSON.stringify(filterKiett(before[ca]||[]));
        const b = JSON.stringify(filteredAfter);
        if (a !== b) {
          try {
            await fetch(UPDATE_ROSTER_API, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: after.date, ca, nhan_vien: filteredAfter })
            });
            changed++;
          } catch (e) { console.log('Update error', e); }
        }
      }
    }
    setSaving(false);
    setInfo(changed ? `Đã cập nhật ${changed} thay đổi!` : 'Không có thay đổi.');
    setEditMode(false);
    // cập nhật lại roster và monthData
    try {
      const res = await fetch(ROSTER_API);
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); if (typeof data.body === 'string') data = JSON.parse(data.body); } catch { data = {}; }
      const items = Array.isArray(data.items) ? data.items : [];
      setRoster(items);
    } catch {}
  };

  const monthLabel = (() => {
    const start = new Date(year, month, 15);
    const end = new Date(year, month + 1, 16); // exclusive, tức là bao gồm đến ngày 15
    const m1 = start.getMonth() + 1;
    const m2 = end.getMonth() + 1;
    const y1 = start.getFullYear();
    const y2 = end.getFullYear();
    const monthPart = `Tháng ${m1}-${m2}`;
    const yearPart = y1 === y2 ? `, ${y1}` : `, ${y1}-${y2}`;
    return monthPart + yearPart;
  })();
  const getWeekdayVi = (dateStr) => {
    const [yy, mm, dd] = dateStr.split('-').map(Number);
    const d = new Date(yy, mm - 1, dd);
    const names = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return names[d.getDay()];
  };

  const isToday = (dateStr) => {
    const today = new Date();
    const [yy, mm, dd] = dateStr.split('-').map(Number);
    const date = new Date(yy, mm - 1, dd);
    return today.getFullYear() === date.getFullYear() &&
           today.getMonth() === date.getMonth() &&
           today.getDate() === date.getDate();
  };

  const formatDate = (dateStr) => {
    // Format từ YYYY-MM-DD sang DD/MM/YYYY
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const computeTotals = (rows) => {
    const hoursByShift = { sang: 4, trua: 5, toi: 4 };
    const rateSingle = 20000; // VND per hour per person when only 1 person in shift
    const rateDouble = 20000; // VND per hour per person when >=2 people in shift

    const totalHours = new Map(); // name -> hours
    const singleHours = new Map(); // name -> single shift hours
    const doubleHours = new Map(); // name -> double shift hours
    const moneyMap = new Map(); // name -> money
    const allowanceCountMap = new Map(); // name -> số lần phụ cấp

    rows.forEach(r => {
      const shiftsByPerson = new Map(); // name -> Set of shifts worked on this day
      
      ['sang','trua','toi'].forEach(ca => {
        const members = Array.isArray(r[ca]) ? r[ca].filter(Boolean) : (r[ca] ? [r[ca]] : []);
        if (members.length === 0) return;
        const hours = hoursByShift[ca];
        const isSingle = members.length === 1;
        const rate = isSingle ? rateSingle : rateDouble;
        members.forEach(nameRaw => {
          const name = (nameRaw || '').toString().trim();
          if (!name) return;
          // Loại bỏ "kiett" khỏi tính toán lương
          if (name.toLowerCase() === 'kiett') return;
          
          // Track shifts worked by this person on this day
          if (!shiftsByPerson.has(name)) {
            shiftsByPerson.set(name, new Set());
          }
          shiftsByPerson.get(name).add(ca);
          
          totalHours.set(name, (totalHours.get(name) || 0) + hours);
          if (isSingle) {
            singleHours.set(name, (singleHours.get(name) || 0) + hours);
          } else {
            doubleHours.set(name, (doubleHours.get(name) || 0) + hours);
          }
          // Tính lương (Mamaboo sẽ được set = 0 ở bước sau)
          moneyMap.set(name, (moneyMap.get(name) || 0) + hours * rate);
        });
      });
      
      // Tính phụ cấp: nếu nhân viên làm 2 ca liên tiếp trong cùng ngày
      shiftsByPerson.forEach((shifts, name) => {
        const shiftArray = Array.from(shifts);
        // Kiểm tra các cặp ca liên tiếp: sáng+trưa, trưa+tối
        if (shiftArray.includes('sang') && shiftArray.includes('trua')) {
          allowanceCountMap.set(name, (allowanceCountMap.get(name) || 0) + 1);
        }
        if (shiftArray.includes('trua') && shiftArray.includes('toi')) {
          allowanceCountMap.set(name, (allowanceCountMap.get(name) || 0) + 1);
        }
      });
    });

    const arr = Array.from(totalHours.entries()).map(([name, hours]) => {
      const sh = singleHours.get(name) || 0;
      const dh = doubleHours.get(name) || 0;
      // Mamaboo là chủ nên không tính lương (luôn = 0)
      const money = (name.toLowerCase() === 'mamaboo') ? 0 : (moneyMap.get(name) || 0);
      const allowanceCount = allowanceCountMap.get(name) || 0;
      return [name, hours, sh, dh, money, allowanceCount];
    });
    return arr.sort((a,b)=> b[4]-a[4]);
  };

  return (
    <div className="login-page" style={{justifyContent: 'center', alignItems: 'flex-start'}}>
      <div className="login-container" style={{width: 750, maxWidth: '95vw', marginTop: 24}}>
        <h2 className="login-title" style={{color: '#e67e22'}}>Quản trị viên</h2>
        <div className="login-underline" style={{ background: '#e67e22' }}></div>
        <div style={{textAlign:'center', fontSize:20, margin:'12px 0'}}>Xin chào {userName || 'Admin'}!</div>

        <div className="admin-buttons-container" style={{display:'flex', justifyContent:'center', gap:16, marginBottom:24, flexWrap:'wrap'}}>
          <button 
            onClick={() => navigate('/checklist-report')} 
            className="admin-nav-button"
            style={{ 
              background: '#6c9bdc',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: 180,
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#5a8bc8';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#6c9bdc';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Xem báo cáo checklist
          </button>
          
          <button 
            onClick={() => navigate('/overtime-management')} 
            className="admin-nav-button"
            style={{ 
              background: '#6c9bdc',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: 180,
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#5a8bc8';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#6c9bdc';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Quản lý tăng ca/đi trễ
          </button>
          
          <button 
            onClick={() => navigate('/penalty-management')} 
            className="admin-nav-button"
            style={{ 
              background: '#6c9bdc',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: 180,
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#5a8bc8';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#6c9bdc';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Quản lý hình phạt
          </button>
          
          <button 
            onClick={() => navigate('/inventory-management')} 
            className="admin-nav-button"
            style={{ 
              background: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '16px 24px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: 180,
              textAlign: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#2980b9';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#3498db';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Quản lý nguyên vật liệu
          </button>
        </div>

        <div className="admin-date-nav" style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', margin:'4px 0 12px'}}>
          <button 
            onClick={prevMonth}
            className="admin-date-button"
            style={{ 
              background: '#6c9bdc',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: 140,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#5a8bc8';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#6c9bdc';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            ← Tháng trước
          </button>
          <div className="admin-month-label" style={{fontWeight:700, color:'#1c222f', fontSize:'16px'}}>{monthLabel}</div>
          <button 
            onClick={nextMonth}
            className="admin-date-button"
            style={{ 
              background: '#6c9bdc',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '12px 20px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: 140,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#5a8bc8';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#6c9bdc';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Tháng sau →
          </button>
        </div>

        <h3 style={{alignSelf:'flex-start', margin:'8px 0 6px'}}>Lịch phân ca theo tháng</h3>
        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div style={{color:'red'}}>{error}</div>
        ) : (
          <form onSubmit={(e)=>{e.preventDefault(); handleSave();}} style={{margin:0, width:'100%'}}>
            <div className="roster-scroll">
              <table className="roster-table" style={{ borderCollapse: 'separate', borderSpacing:0, borderRadius:12, boxShadow:'0 4px 20px rgba(0,0,0,0.08)', margin:'0 auto' }}>
                <thead>
                  <tr style={{background:'#f5fbff'}}>
                    <th style={{borderBottom:'1px solid #e6f2f8', padding:'10px 8px', textAlign:'left'}}>Ngày</th>
                    <th style={{borderBottom:'1px solid #e6f2f8', padding:'10px 8px', textAlign:'left'}}>Thứ</th>
                    <th style={{borderBottom:'1px solid #e6f2f8', padding:'10px 8px'}}>Ca Sáng</th>
                    <th style={{borderBottom:'1px solid #e6f2f8', padding:'10px 8px'}}>Ca Trưa</th>
                    <th style={{borderBottom:'1px solid #e6f2f8', padding:'10px 8px'}}>Ca Tối</th>
                  </tr>
                </thead>
                <tbody>
                  {(editMode ? monthEdit : monthData).map((row, idx) => {
                    const todayHighlight = isToday(row.date);
                    return (
                    <tr key={idx} style={{
                      background: todayHighlight ? '#fff9e6' : (idx%2===0 ? '#ffffff' : '#fbfdff'),
                      borderLeft: todayHighlight ? '4px solid #ff9800' : 'none',
                      fontWeight: todayHighlight ? 600 : 'normal'
                    }}>
                      <td style={{borderBottom:'1px solid #eef5fa', padding:'8px 8px', fontWeight:600, color: todayHighlight ? '#ff9800' : '#2b4c66'}}>{formatDate(row.date)}</td>
                      <td style={{borderBottom:'1px solid #eef5fa', padding:'8px 8px', color: todayHighlight ? '#ff9800' : '#6b7a86', fontWeight: todayHighlight ? 600 : 'normal'}}>{getWeekdayVi(row.date)}</td>
                      {['sang','trua','toi'].map(ca => (
                        <td style={{borderBottom:'1px solid #eef5fa', padding:'8px 8px', position:'relative'}} key={ca}>
                          {editMode ? (
                            <MultiSelectDropdown
                              options={staffs}
                              value={row[ca] || []}
                              onChange={(vals)=>handleChange(idx, ca, { target: { selectedOptions: vals.map(v=>({ value: v })) } })}
                            />
                          ) : (
                            <div style={{minHeight:24, color:'#1c222f'}}>{Array.isArray(row[ca]) ? row[ca].join(', ') : row[ca]}</div>
                          )}
                        </td>
                      ))}
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!editMode && <button type="button" className="login-button" style={{marginTop:16}} onClick={handleEdit}>Chỉnh sửa</button>}
            {editMode && (
              <>
                <button type="submit" className="login-button" style={{marginTop:16}} disabled={saving}>{saving ? 'Đang cập nhật...' : 'Cập nhật'}</button>
                <button type="button" className="login-button" style={{marginTop:12}} onClick={handleCancel}>Hủy</button>
              </>
            )}
            {info && <div style={{marginTop:12, color:'#2ecc71', fontWeight:600}}>{info}</div>}

            <h3 style={{textAlign:'left', margin:'18px 0 8px'}}>Tổng số giờ trong tháng</h3>
            <div className="roster-scroll">
              <table className="roster-table" style={{ borderCollapse: 'separate', borderSpacing:0, borderRadius:10, boxShadow:'0 3px 14px rgba(0,0,0,0.06)', margin:'0 auto' }}>
                <thead>
                  <tr style={{background:'#f7fafc'}}>
                    <th style={{padding:'10px 8px', borderBottom:'1px solid #eaeef2', textAlign:'left'}}>Nhân viên</th>
                    <th style={{padding:'10px 8px', borderBottom:'1px solid #eaeef2', width:120}}>Tổng giờ</th>
                    <th style={{padding:'10px 8px', borderBottom:'1px solid #eaeef2', width:120}}>Giờ ca đơn</th>
                    <th style={{padding:'10px 8px', borderBottom:'1px solid #eaeef2', width:120}}>Giờ ca đôi</th>
                    <th style={{padding:'10px 8px', borderBottom:'1px solid #eaeef2', width:160}}>Tổng tiền (VND)</th>
                    <th style={{padding:'10px 8px', borderBottom:'1px solid #eaeef2', width:120}}>Tăng ca (giờ)</th>
                    <th style={{padding:'10px 8px', borderBottom:'1px solid #eaeef2', width:120}}>Đi trễ (giờ)</th>
                    <th style={{padding:'10px 8px', borderBottom:'1px solid #eaeef2', width:160}}>Phạt (VND)</th>
                    <th style={{padding:'10px 8px', borderBottom:'1px solid #eaeef2', width:160}}>Phụ cấp</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Rebuild lại từ records để đảm bảo đúng chu kỳ lương
                    const currentOvertimeData = rebuildOvertimeDataFromRecords(overtimeRecords);
                    const monthKey = `${year}-${month + 1}`;
                    const ratePerHour = 20000;
                    let totalAllSalary = 0;
                    
                    return (
                      <>
                        {computeTotals(editMode ? monthEdit : monthData).map(([name, total, singleH, doubleH, money, allowanceCount]) => {
                          const staffData = currentOvertimeData[monthKey]?.[name] || { overtime: 0, lateCount: 0 };
                          // Tính tiền phạt
                          const penaltyAmount = calculatePenaltyAmount(name, monthKey);
                          
                          // Tính phụ cấp
                          const allowanceAmount = allowanceCount * 45000; // 45k mỗi lần
                          const formatAllowance = (count, amount) => {
                            if (count === 0) return '0';
                            const amountInK = Math.round(amount / 1000);
                            return `${amountInK}k (${count})`;
                          };
                          
                          // Mamaboo là chủ nên không tính lương (luôn = 0)
                          const isMamaboo = name.toLowerCase() === 'mamaboo';
                          const totalSalary = isMamaboo ? 0 : (() => {
                            // Tính tổng lương: lương ca làm + tăng ca - đi trễ - phạt + phụ cấp
                            const overtimePay = (staffData.overtime || 0) * ratePerHour;
                            const latePay = (staffData.lateCount || 0) * ratePerHour;
                            return money + overtimePay - latePay - penaltyAmount + allowanceAmount;
                          })();
                          
                          // Cộng vào tổng (trừ Mamaboo)
                          if (!isMamaboo) {
                            totalAllSalary += totalSalary;
                          }
                          
                          return (
                            <tr key={name} style={{background:'#fff'}}>
                              <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7'}}>{name}</td>
                              <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'center', fontWeight:600}}>{total}</td>
                              <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'center'}}>{singleH}</td>
                              <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'center'}}>{doubleH}</td>
                              <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'right', fontWeight:700}}>{Number(totalSalary).toLocaleString('vi-VN')}</td>
                              <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'center'}}>
                                <span>{Number(staffData.overtime) || 0}</span>
                              </td>
                              <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'center'}}>
                                <span>{Number(staffData.lateCount) || 0}</span>
                              </td>
                              <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'right', fontWeight:600, color: penaltyAmount > 0 ? '#e67e22' : '#6b7a86'}}>
                                {penaltyAmount > 0 ? Number(penaltyAmount).toLocaleString('vi-VN') : '0'}
                              </td>
                              <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'right', fontWeight:600, color: allowanceCount > 0 ? '#2e7d32' : '#6b7a86'}}>
                                {formatAllowance(allowanceCount, allowanceAmount)}
                              </td>
                            </tr>
                          );
                        })}
                        {/* Dòng tổng lương */}
                        <tr style={{background:'#f0f8ff', fontWeight:700}}>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef', fontWeight:700}}>TỔNG</td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef', textAlign:'center', fontWeight:700}} colSpan="3"></td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef', textAlign:'right', fontWeight:700, color:'#e67e22', fontSize:'1.1em'}}>
                            {Number(totalAllSalary).toLocaleString('vi-VN')}
                          </td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef'}} colSpan="2"></td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef'}}></td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef'}}></td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>

            {/* Checklist viewer */}
            {false && (
            <>
            <h3 style={{textAlign:'left', margin:'22px 0 8px'}}>Checklist đã lưu</h3>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
              <input type="date" value={ckFrom} onChange={(e)=>setCkFrom(e.target.value)} />
              <span>đến</span>
              <input type="date" value={ckTo} onChange={(e)=>setCkTo(e.target.value)} />
              <StaffFilterDropdown 
                options={staffs} 
                value={ckUser} 
                onChange={setCkUser}
                placeholder="Lọc theo nhân viên"
              />
              <button type="button" className="login-button" onClick={fetchChecklist} disabled={ckLoading}>
                {ckLoading ? 'Đang tải...' : 'Tải checklist'}
              </button>
            </div>
            <div className="roster-scroll" style={{marginTop:10}}>
              <table className="roster-table" style={{ borderCollapse: 'separate', borderSpacing:0, borderRadius:10, margin:'0 auto' }}>
                <thead>
                  <tr style={{background:'#f5fbff'}}>
                    <th>Ngày</th>
                    <th>Ca</th>
                    <th>Nhân viên</th>
                    <th>Số task hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {ckItems.length === 0 ? (
                    <tr><td colSpan={4} style={{padding:10, textAlign:'center', color:'#6b7a86'}}>Chưa có dữ liệu</td></tr>
                  ) : ckItems.map((it, i) => {
                    const tasks = it.tasks || {};
                    const doneCount = Object.values(tasks).filter((t)=>t && (t.done === true || t.done === 'true')).length;
                    return (
                      <tr key={i}>
                        <td>{it.date}</td>
                        <td>{it.shift}</td>
                        <td>{it.user}</td>
                        <td>{doneCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
            )}
          </form>
        )}
        <button style={{marginTop: 20}} className="login-button" onClick={handleLogout}>Đăng xuất</button>
      </div>
    </div>
  );
}

// Helper function để parse query params
function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

// Trang checklist ca làm việc (duy nhất một checklist cho mỗi ca)
function Checkin() {
  const navigate = useNavigate();
  const query = useQuery();
  const dateStr = query.get('date') || '';
  const shift = query.get('shift') || '';
  const userName = localStorage.getItem('userName') || '';

  // Checklist các task cần làm trong ca (theo từng ca)
  const SHIFT_TASK_TEMPLATES = {
    sang: [
      { id: 'Set up khu vực pha chế', label: 'Set up khu vực pha chế' },
      { id: 'Set up khu vực cashier', label: 'Set up khu vực cashier' },
      { id: 'Setup bàn ghế ngay ngắn, khăn bàn (khu vực trong và ngoài trời)', label: 'Setup bàn ghế ngay ngắn, khăn bàn (khu vực trong và ngoài trời)' },
      { id: 'Quét và lau sàn', label: 'Quét và lau sàn' },
      { id: 'Tưới cây', label: 'Tưới cây', requiresImage: false },
      { id: 'Quét sân', label: 'Quét sân' },
      { id: 'Kiểm tra vệ sinh toilet', label: 'Kiểm tra vệ sinh toilet' },
      { id: 'Chuẩn bị foam/ cốt phục vụ trong ngày (Cacao, các loại Foam)', label: 'Chuẩn bị foam/ cốt phục vụ trong ngày (Cacao, các loại Foam)' },
      { id: 'Bật nhạc, đèn, điều hòa/quạt ', label: 'Bật nhạc, đèn, điều hòa/quạt', requiresImage: false },
      { id: 'Đốt nhang, pha bạc sỉu để cúng', label: 'Đốt nhang, pha bạc sỉu để cúng' },
      { id: 'sắp xếp và dọn dẹp tủ lạnh ngăn nắp', label: 'sắp xếp và dọn dẹp tủ lạnh ngăn nắp' },
      { id: 'Tắt/bảo trì máy móc đúng cách (đổ nước máy nước nóng, rửa bình đánh coldwhisk, cắm sạc máy đánh...)  ', label: 'Tắt/bảo trì máy móc đúng cách (đổ nước máy nước nóng, rửa bình đánh coldwhisk, cắm sạc máy đánh...) ', requiresImage: false },
      { id: 'Kiểm két', label: 'Kiểm két', useTextInput: true }
    ],
    trua: [
      { id: 'Set up khu vực cashier', label: 'Set up khu vực cashier' },
      { id: 'Set up khu vực pha chế', label: 'Set up khu vực pha chế' },
      { id: 'Kiểm tra vệ sinh toilet', label: 'Kiểm tra vệ sinh toilet' },
      { id: 'Chuẩn bị foam/ cốt phục vụ trong ngày (Cacao, các loại Foam)', label: 'Chuẩn bị foam/ cốt phục vụ trong ngày (Cacao, các loại Foam)' },
      { id: 'Chà sàn nhà vệ sinh', label: 'Chà sàn nhà vệ sinh' },
      { id: 'Thay bao rác ', label: 'Thay bao rác ' }, 
      { id: 'sắp xếp và dọn dẹp tủ lạnh ngăn nắp', label: 'sắp xếp và dọn dẹp tủ lạnh ngăn nắp' },
      { id: 'Tắt/bảo trì máy móc đúng cách (đổ nước máy nước nóng, rửa bình đánh coldwhisk, cắm sạc máy đánh...)  ', label: 'Tắt/bảo trì máy móc đúng cách (đổ nước máy nước nóng, rửa bình đánh coldwhisk, cắm sạc máy đánh...) ', requiresImage: false },
      { id: 'Kiểm két', label: 'Kiểm két', useTextInput: true }


    ],
    toi: [
      { id: 'Đổ rác', label: 'Đổ rác' },
      { id: 'Dọn bàn ghé', label: 'Dọn bàn ghé' },
      { id: 'Kiểm tra nguyên vật liệu', label: 'Kiểm tra nguyên vật liệu', requiresImage: false, useForm: true },
      { id: 'Chà bồn cầu', label: 'Chà bồn cầu' },
      { id: 'Chà lababo', label: 'Chà lababo' },
      { id: 'Cắm sạc loa', label: 'Cắm sạc loa' },
      { id: 'Giặt cây lau nhà', label: 'Giặt cây lau nhà' },
      { id: 'Clean thùng đá', label: 'Clean thùng đá' },
      { id: 'Thay bao rác ', label: 'Thay bao rác ' }, 
      { id: 'Khoá cửa', label: 'Khoá cửa' },
      { id: 'Dắt xe', label: 'Dắt xe' },
      { id: 'Kiểm két', label: 'Kiểm két', useTextInput: true },
      { id: 'sắp xếp và dọn dẹp tủ lạnh ngăn nắp', label: 'sắp xếp và dọn dẹp tủ lạnh ngăn nắp' },
      { id: 'Đảm bảo tắt hết đèn, quạt, máy lạnh ', label: 'Đảm bảo tắt hết đèn, quạt, máy lạnh ' }
    ]
  };

  const defaultTasks = SHIFT_TASK_TEMPLATES[shift] || [
    { id: 'setup', label: 'Chuẩn bị ca làm việc' },
    { id: 'check', label: 'Kiểm tra thiết bị' }
  ];

  const storageKey = `checklist_bat_dau__${userName}__${dateStr}__${shift}`;
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
      return defaultTasks.map(t => ({
        ...t,
        done: !!(saved.tasks?.[t.id]?.done),
        image: saved.tasks?.[t.id]?.image || '',
        text: saved.tasks?.[t.id]?.text || '',
        requiresImage: t.requiresImage !== false, // Giữ lại thuộc tính requiresImage từ template
        useForm: t.useForm || false, // Giữ lại thuộc tính useForm từ template
        useTextInput: t.useTextInput || false // Giữ lại thuộc tính useTextInput từ template
      }));
    } catch {
      return defaultTasks.map(t => ({ 
        ...t, 
        done: false, 
        image: '', 
        text: '',
        requiresImage: t.requiresImage !== false,
        useForm: t.useForm || false,
        useTextInput: t.useTextInput || false
      }));
    }
  });

  const [showInventoryForm, setShowInventoryForm] = useState(false);

  const saveState = (nextTasks) => {
    try {
      const payload = { tasks: {} };
      nextTasks.forEach(t => { 
        payload.tasks[t.id] = { 
          done: t.done, 
          image: t.image || '', 
          text: t.text || '' 
        }; 
      });
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      // Quota exceeded - don't save to localStorage, but continue
      console.warn('localStorage quota exceeded, skipping save to localStorage');
    }
  };

  const toggleTask = (id) => {
    const next = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(next);
    saveState(next);
  };

  const handleTextChange = (id, text) => {
    const next = tasks.map(t => t.id === id ? { ...t, text } : t);
    setTasks(next);
    saveState(next);
  };

  // Helper function to resize and compress image
  // Improved compression to stay under DynamoDB 400KB limit
  const compressImage = (file, maxWidth = 600, maxHeight = 600, quality = 0.6) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions - more aggressive resizing
          const maxDimension = Math.max(width, height);
          if (maxDimension > maxWidth) {
            const ratio = maxWidth / maxDimension;
            width = width * ratio;
            height = height * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          // Improve image quality during resize
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          // Try progressively lower quality until under 200KB (to leave room for other data)
          let compressed = canvas.toDataURL('image/jpeg', quality);
          let currentQuality = quality;
          
          // If still too large, reduce quality further
          while (compressed.length > 200000 && currentQuality > 0.3) {
            currentQuality -= 0.1;
            compressed = canvas.toDataURL('image/jpeg', currentQuality);
          }
          
          // If still too large, reduce dimensions
          if (compressed.length > 200000) {
            const smallerCanvas = document.createElement('canvas');
            const smallerWidth = width * 0.8;
            const smallerHeight = height * 0.8;
            smallerCanvas.width = smallerWidth;
            smallerCanvas.height = smallerHeight;
            const smallerCtx = smallerCanvas.getContext('2d');
            smallerCtx.drawImage(img, 0, 0, smallerWidth, smallerHeight);
            compressed = smallerCanvas.toDataURL('image/jpeg', 0.5);
          }
          
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onUpload = async (id, file) => {
    if (!file) {
      console.log(`Task ${id}: No file selected`);
      return;
    }
    
    // Check file size before processing
    if (file.size > 5000000) { // 5MB limit
      alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn 5MB.');
      return;
    }
    
    console.log(`Task ${id}: Uploading image, file name:`, file.name, 'size:', file.size, 'type:', file.type);
    
    try {
      // Compress image before uploading - more aggressive compression
      console.log(`Task ${id}: Compressing image...`);
      const compressedImage = await compressImage(file, 600, 600, 0.6);
      console.log(`Task ${id}: Image compressed, original size:`, file.size, 'compressed length:', compressedImage.length);
      
      // DynamoDB limit is 400KB total item size
      // Each image should be under 150KB base64 (~100KB raw) to leave room for other data
      const MAX_IMAGE_SIZE = 150000; // 150KB base64
      
      if (compressedImage.length > MAX_IMAGE_SIZE) {
        console.warn(`Task ${id}: Compressed image still large (${compressedImage.length} chars). Compressing further...`);
        // Compress more aggressively - smaller dimensions and lower quality
        const moreCompressed = await compressImage(file, 500, 500, 0.5);
        console.log(`Task ${id}: Re-compressed length:`, moreCompressed.length);
        
        if (moreCompressed.length > MAX_IMAGE_SIZE) {
          // Final attempt with very aggressive compression
          const finalCompressed = await compressImage(file, 400, 400, 0.4);
          console.log(`Task ${id}: Final compressed length:`, finalCompressed.length);
          
          if (finalCompressed.length > MAX_IMAGE_SIZE) {
            alert(`Ảnh quá lớn sau khi nén (${Math.round(finalCompressed.length / 1024)}KB). Vui lòng chọn ảnh nhỏ hơn hoặc chụp lại với độ phân giải thấp hơn.`);
            return;
          }
          
          const next = tasks.map(t => t.id === id ? { ...t, image: finalCompressed } : t);
          setTasks(next);
          console.log(`Task ${id}: Image compressed to acceptable size:`, finalCompressed.length);
        } else {
          const next = tasks.map(t => t.id === id ? { ...t, image: moreCompressed } : t);
          setTasks(next);
          console.log(`Task ${id}: Image compressed to acceptable size:`, moreCompressed.length);
        }
      } else {
        const next = tasks.map(t => t.id === id ? { ...t, image: compressedImage } : t);
        setTasks(next);
        console.log(`Task ${id}: Image saved successfully, verified length:`, compressedImage.length);
      }
      
      // Try to save to localStorage, but don't fail if quota exceeded
      try {
        const finalImage = tasks.find(t => t.id === id)?.image || '';
        if (finalImage) {
          const currentTasks = tasks.map(t => t.id === id ? { ...t, image: finalImage } : t);
          saveState(currentTasks);
        }
      } catch (e) {
        console.warn(`Task ${id}: Could not save to localStorage (quota exceeded), but image is in state`);
      }
    } catch (error) {
      console.error(`Task ${id}: Error processing image:`, error);
      alert('Lỗi khi xử lý ảnh! ' + error.message);
    }
  };

  const handleEndShift = async () => {
    console.log('=== BẮT ĐẦU LƯU CHECKLIST ===');
    console.log('Current tasks state:', tasks.map(t => ({
      id: t.id,
      done: t.done,
      hasImage: !!(t.image && t.image.length > 10),
      imageLength: t.image ? t.image.length : 0
    })));
    
    // Collect images to upload to S3 first
    const imagesToUpload = {};
    const tasksWithImagesList = tasks.filter(t => t.image && t.image.length > 100);
    
    console.log(`Found ${tasksWithImagesList.length} tasks with images to upload`);
    
    // Upload images to S3 if IMAGE_UPLOAD_API is configured
    let imageUrls = {};
    
    if (tasksWithImagesList.length > 0 && IMAGE_UPLOAD_API && IMAGE_UPLOAD_API !== 'YOUR_API_GATEWAY_URL') {
      try {
        // Prepare images for upload
        tasksWithImagesList.forEach(t => {
          if (t.image && t.image.length > 100) {
            imagesToUpload[t.id] = t.image;
          }
        });
        
        console.log(`Uploading ${Object.keys(imagesToUpload).length} images to S3...`);
        
        const uploadResponse = await fetch(IMAGE_UPLOAD_API, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: imagesToUpload,
            user: userName,
            date: dateStr,
            shift: shift
          })
        });
        
        const uploadResult = await uploadResponse.json();
        const uploadBody = typeof uploadResult.body === 'string' ? JSON.parse(uploadResult.body) : uploadResult.body;
        
        if (uploadResponse.ok && uploadBody.ok) {
          imageUrls = uploadBody.urls || {};
          console.log(`✅ Uploaded ${Object.keys(imageUrls).length} images to S3`);
          if (uploadBody.errors && uploadBody.errors.length > 0) {
            console.warn('Upload errors:', uploadBody.errors);
            alert(`Cảnh báo: ${uploadBody.errors.length} ảnh không thể upload lên S3:\n${uploadBody.errors.join('\n')}`);
          }
        } else {
          console.warn('Image upload failed, will use base64 fallback');
        }
      } catch (error) {
        console.error('Error uploading images to S3:', error);
        console.warn('Will use base64 fallback');
      }
    }
    
    // Chuyển đổi tasks sang format cho API
    // Use S3 URLs if available, otherwise use base64
    // IMPORTANT: With S3, all images will be saved. Without S3, we may need to compress more.
    const tasksMap = tasks.reduce((acc, t) => {
      const img = t.image || '';
      
      // Build task data object
      const taskData = { done: !!t.done };
      
      // Use S3 URL if available (preferred - no size limit)
      if (imageUrls[t.id]) {
        taskData.imageUrl = imageUrls[t.id];
        console.log(`✓ Task ${t.id} using S3 URL: ${imageUrls[t.id]}`);
      } else if (img && img.length < 100) {
        // Image too short, treat as empty
        console.warn(`Task ${t.id}: Image too short (${img.length} chars), treating as empty`);
        taskData.imageUrl = '';
      } else if (img && img.length > 100) {
        // Use base64 as fallback (if S3 upload not configured or failed)
        // We'll keep all images and let Lambda handle size checking
        taskData.imageUrl = img;
        console.log(`✓ Task ${t.id} using base64 (length: ${img.length})`);
      } else {
        taskData.imageUrl = '';
        console.log(`✗ Task ${t.id} KHÔNG có ảnh`);
      }
      
      // Add inventory form data if exists (for "Kiểm tra nguyên vật liệu" task)
      if (t.inventoryFormData && Object.keys(t.inventoryFormData).length > 0) {
        taskData.inventoryFormData = t.inventoryFormData;
        console.log(`✓ Task ${t.id} có dữ liệu form kiểm tra nguyên vật liệu`);
      }
      
      // Add text data if exists (for "Kiểm két" task)
      if (t.text && t.text.trim().length > 0) {
        taskData.text = t.text.trim();
        console.log(`✓ Task ${t.id} có dữ liệu text: ${t.text.substring(0, 50)}...`);
      }
      
      acc[t.id] = taskData;
      return acc;
    }, {});
    
    console.log('Tasks map trước khi gửi:', Object.keys(tasksMap).map(k => ({
      taskId: k,
      done: tasksMap[k].done,
      hasImage: !!(tasksMap[k].imageUrl && tasksMap[k].imageUrl.length > 100),
      imageLength: tasksMap[k].imageUrl ? tasksMap[k].imageUrl.length : 0
    })));
    
    // Count tasks with valid images (chỉ đếm các task yêu cầu ảnh)
    const tasksRequiringImages = tasks.filter(t => t.requiresImage !== false);
    const tasksWithImages = tasksRequiringImages.filter(t => {
      const taskData = tasksMap[t.id];
      return taskData && taskData.imageUrl && taskData.imageUrl.length > 100;
    }).length;
    console.log(`Tổng số tasks: ${tasks.length}, Tasks yêu cầu ảnh: ${tasksRequiringImages.length}, Tasks có ảnh hợp lệ: ${tasksWithImages}`);
    
    // Kiểm tra xem có task nào chưa hoàn thành không (không bắt buộc)
    const allDone = tasks.every(t => t.done);
    if (!allDone && !window.confirm('Một số task chưa hoàn thành. Vẫn kết ca và lưu?')) {
      return;
    }

    // Gọi API để lưu checklist
    const CHECKLIST_API = 'https://5q97j7q6ce.execute-api.ap-southeast-2.amazonaws.com/prod/';
    
    // Calculate total payload size
    const payload = { 
      user: userName, 
      date: dateStr, 
      shift, 
      tasks: tasksMap, 
      checklistType: 'ket_ca',
      startedAt: null
    };
    const payloadStr = JSON.stringify(payload);
    const payloadSize = new Blob([payloadStr]).size;
    console.log('Total payload size:', payloadSize, 'bytes (', Math.round(payloadSize / 1024), 'KB)');
    
    // Warn if approaching limit
    if (payloadSize > 350000) { // 350KB
      const confirmMsg = `Cảnh báo: Dữ liệu checklist rất lớn (${Math.round(payloadSize / 1024)}KB), gần giới hạn 400KB của DynamoDB. Một số ảnh có thể bị loại bỏ. Bạn có muốn tiếp tục?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }
    
    // Verify tasks in payload
    const payloadTasksWithImages = Object.values(payload.tasks).filter(t => t.imageUrl && t.imageUrl.length > 100).length;
    console.log('Payload tasks có ảnh hợp lệ:', payloadTasksWithImages);
    
    try {
      console.log('Sending request to:', CHECKLIST_API);
      const resp = await fetch(CHECKLIST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payloadStr
      });
      
      console.log('Response status:', resp.status, resp.statusText);
      
      const txt = await resp.text();
      let data = {};
      try { 
        data = JSON.parse(txt);
        if (typeof data.body === 'string') {
          data = JSON.parse(data.body);
        }
      } catch (parseErr) { 
        console.error('JSON parse error:', parseErr);
        data = {};
      }
      
      if (!resp.ok || data.success === false) {
        alert(`Lưu checklist thất bại: ${data.message || 'Unknown error'}`);
        return;
      }
      
      console.log('✅ Lưu checklist thành công!');
      console.log('Response data:', data);
      // Chỉ đếm các task yêu cầu ảnh
      const tasksWithImagesCount = tasksRequiringImages.filter(t => {
        const taskData = tasksMap[t.id];
        return taskData && taskData.imageUrl && taskData.imageUrl.length > 100;
      }).length;
      console.log('Payload tasks có ảnh:', tasksWithImagesCount, '/', tasksRequiringImages.length, '(tổng tasks:', tasks.length, ')');
      
      // Verify: Fetch lại từ DynamoDB để xác nhận ảnh đã được lưu
      if (tasksWithImagesCount > 0) {
        console.log('🔍 Đang verify ảnh đã được lưu vào DynamoDB...');
        try {
          const CHECKLIST_GET_API = 'https://4qwg9i4he0.execute-api.ap-southeast-2.amazonaws.com/prod';
          const verifyUrl = new URL(CHECKLIST_GET_API);
          verifyUrl.searchParams.set('from', dateStr);
          verifyUrl.searchParams.set('to', dateStr);
          verifyUrl.searchParams.set('user', userName);
          
          // Wait a bit for DynamoDB to be consistent
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const verifyRes = await fetch(verifyUrl.toString());
          const verifyText = await verifyRes.text();
          let verifyData = {};
          try {
            verifyData = JSON.parse(verifyText);
            if (typeof verifyData.body === 'string') {
              verifyData = JSON.parse(verifyData.body);
            }
          } catch {}
          
          const verifyItems = Array.isArray(verifyData.items) ? verifyData.items : [];
          console.log(`🔍 Verify: Found ${verifyItems.length} items from DynamoDB`);
          console.log('🔍 Verify: Looking for item with:', { user: userName, date: dateStr, shift, checklistType: 'ket_ca' });
          
          // Log all items to see what we got
          if (verifyItems.length > 0) {
            console.log('🔍 Verify: All items found:');
            verifyItems.forEach((it, idx) => {
              const tasksObj = it.tasks || {};
              const tasksKeys = typeof tasksObj === 'object' && tasksObj !== null ? Object.keys(tasksObj) : [];
              const tasksCount = tasksKeys.length;
              console.log(`  Item ${idx}: user="${it.user}", date="${it.date}", shift="${it.shift}", checklistType="${it.checklistType || '(none)'}", date_shift="${it.date_shift || '(none)'}", tasksCount=${tasksCount}`);
              
              // For the first matching item, log detailed task info
              if (it.user === userName && it.date === dateStr && it.shift === shift) {
                console.log(`  ✅ Item ${idx} MATCHES search criteria!`);
                console.log(`    Tasks structure:`, tasksKeys.map(k => {
                  const t = tasksObj[k];
                  const hasImg = !!(t?.imageUrl || t?.image);
                  const imgLen = (t?.imageUrl || t?.image || '').toString().length;
                  return { taskId: k, done: t?.done, hasImage: hasImg, imageLength: imgLen };
                }));
              }
            });
          } else {
            console.warn('⚠ Verify: No items returned from DynamoDB GET');
          }
          
          const savedItem = verifyItems.find(it => 
            it.user === userName && 
            it.date === dateStr && 
            it.shift === shift &&
            it.checklistType === 'ket_ca'
          );
          
          console.log('🔍 Verify: savedItem found?', !!savedItem);
          
          if (savedItem) {
            console.log('🔍 Verify: savedItem keys:', Object.keys(savedItem));
            console.log('🔍 Verify: savedItem.tasks type:', typeof savedItem.tasks);
            console.log('🔍 Verify: savedItem.tasks is object?', typeof savedItem.tasks === 'object' && savedItem.tasks !== null);
            console.log('🔍 Verify: savedItem.tasks keys:', savedItem.tasks ? Object.keys(savedItem.tasks) : 'null');
            console.log('🔍 Verify: savedItem.tasks value (first 500 chars):', JSON.stringify(savedItem.tasks).substring(0, 500));
          } else {
            console.warn('⚠ Verify: savedItem NOT FOUND!');
            console.warn('  Search criteria:', { user: userName, date: dateStr, shift, checklistType: 'ket_ca' });
            console.warn('  Available items:', verifyItems.map(it => ({
              user: it.user,
              date: it.date,
              shift: it.shift,
              checklistType: it.checklistType || '(none)'
            })));
          }
          
          if (savedItem && savedItem.tasks) {
            const savedTasks = savedItem.tasks;
            console.log('Verify: savedTasks entries:', Object.entries(savedTasks).map(([k, v]) => ({
              taskId: k,
              hasImageUrl: !!(v?.imageUrl),
              hasImage: !!(v?.image),
              imageUrlLength: v?.imageUrl ? String(v.imageUrl).length : 0,
              imageLength: v?.image ? String(v.image).length : 0,
              taskDataType: typeof v
            })));
            
            let verifiedImages = 0;
            // Chỉ verify các task yêu cầu ảnh
            for (const task of tasksRequiringImages) {
              const taskData = savedTasks[task.id];
              if (taskData && typeof taskData === 'object') {
                const imgUrl = taskData.imageUrl || taskData.image || '';
                console.log(`Verify task ${task.id}: imageUrl length=${imgUrl.length}, type=${typeof imgUrl}`);
                if (imgUrl && imgUrl.length > 100) {
                  verifiedImages++;
                  console.log(`✅ Verified task ${task.id}: image saved, length=${imgUrl.length}`);
                } else {
                  console.warn(`⚠ Task ${task.id}: imageUrl empty or too short (length=${imgUrl.length})`);
                  console.warn(`  Task data:`, taskData);
                }
              } else {
                console.warn(`⚠ Task ${task.id}: taskData is not an object, type=${typeof taskData}`, taskData);
              }
            }
            
            if (verifiedImages === tasksWithImagesCount) {
              console.log(`✅ VERIFIED: Tất cả ${verifiedImages} ảnh đã được lưu vào DynamoDB!`);
              alert(`✅ Đã kết ca và lưu checklist thành công! ${verifiedImages} ảnh đã được lưu.`);
            } else {
              console.warn(`⚠ WARNING: Chỉ ${verifiedImages}/${tasksWithImagesCount} ảnh được verify trong DynamoDB`);
              console.warn('Verify: Expected tasks:', Object.keys(tasksMap));
              console.warn('Verify: Saved tasks:', Object.keys(savedTasks));
              alert(`⚠ Đã lưu checklist nhưng chỉ verify được ${verifiedImages}/${tasksWithImagesCount} ảnh. Vui lòng kiểm tra CloudWatch Logs.`);
            }
          } else {
            console.warn('⚠ WARNING: Không tìm thấy item đã lưu trong DynamoDB để verify');
            console.warn('Verify: verifyItems:', verifyItems);
            console.warn('Verify: Search criteria:', { user: userName, date: dateStr, shift });
            alert('⚠ Đã lưu checklist nhưng không thể verify ảnh. Vui lòng kiểm tra CloudWatch Logs của Lambda POST để xem ảnh có được lưu không.');
          }
        } catch (verifyErr) {
          console.error('Error verifying saved data:', verifyErr);
          alert('✅ Đã kết ca và lưu checklist! (Không thể verify ảnh tự động, vui lòng kiểm tra thủ công)');
        }
      } else {
        alert('Đã kết ca và lưu checklist!');
      }
      
      // Lưu trạng thái đã kết ca (chỉ lưu key, rất nhẹ)
      // Giới hạn chỉ lưu các ca trong 30 ngày gần nhất để tránh vượt quota
      const checkKey = `${userName}__${dateStr}__${shift}`;
      try {
        // Xóa checkinStatus cũ để giải phóng dung lượng
        try {
          localStorage.removeItem('checkinStatus');
        } catch {}
        
        // Đọc từ localStorage
        let doneSet = new Set();
        try {
          const saved = localStorage.getItem('checkinDone');
          if (saved) doneSet = new Set(JSON.parse(saved));
        } catch {}
        
        // Xóa các ca cũ hơn 30 ngày để giải phóng dung lượng
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const filteredKeys = Array.from(doneSet).filter(key => {
          // Key format: userName__YYYY-MM-DD__shift
          const parts = key.split('__');
          if (parts.length !== 3) return false;
          const keyDateStr = parts[1];
          try {
            const [y, m, d] = keyDateStr.split('-').map(Number);
            const keyDate = new Date(y, m - 1, d);
            return keyDate >= thirtyDaysAgo;
          } catch {
            return false;
          }
        });
        doneSet = new Set(filteredKeys);
        
        // Thêm ca mới
        doneSet.add(checkKey);
        
        // Lưu vào localStorage (chỉ lưu array các key, rất nhẹ)
        localStorage.setItem('checkinDone', JSON.stringify(Array.from(doneSet)));
        console.log('Đã lưu checkinDone:', checkKey, 'Tổng số ca đã kết:', doneSet.size);
      } catch (e) {
        console.warn('Không thể lưu checkinDone:', e);
        // Nếu vẫn vượt quota, thử xóa tất cả và chỉ lưu ca hiện tại
        try {
          // Xóa tất cả dữ liệu cũ trước
          try {
            localStorage.removeItem('checkinDone');
            localStorage.removeItem('checkinStatus');
          } catch {}
          const minimalSet = new Set([checkKey]);
          localStorage.setItem('checkinDone', JSON.stringify(Array.from(minimalSet)));
          console.log('Đã lưu checkinDone (minimal, đã xóa dữ liệu cũ):', checkKey);
        } catch (e2) {
          console.error('Không thể lưu checkinDone ngay cả với minimal set:', e2);
          // Không lưu vào localStorage nữa, nhưng vẫn navigate về để user thấy đã lưu
          // Trạng thái sẽ không được lưu, nhưng ít nhất checklist đã được lưu vào backend
        }
      }
      
      navigate('/nhan-vien');
    } catch (e) {
      console.error('Error saving checklist:', e);
      alert(`Không thể kết nối máy chủ lưu checklist: ${e.message}`);
    }
  };

  return (
    <div className="login-page" style={{justifyContent:'center', alignItems:'flex-start'}}>
      <div className="login-container" style={{width: 800, maxWidth: '96vw', marginTop: 28, marginBottom: 28, alignItems:'stretch'}}>
        <h2 className="login-title" style={{color:'#43a8ef', alignSelf:'center'}}>Checklist ca làm việc</h2>
        <div className="login-underline" style={{ background: '#43a8ef', alignSelf:'center' }}></div>
        <div style={{textAlign:'center', marginBottom:16}}>Ngày {dateStr} · {shift === 'sang' ? 'Ca sáng' : shift === 'trua' ? 'Ca trưa' : 'Ca tối'}</div>
        {/* Không hiển thị giờ bắt đầu ca nữa vì không lưu vào localStorage */}
        <div style={{marginBottom:12, padding:12, background:'#e9f8ef', borderRadius:8, color:'#1e7e34'}}>
          <strong>📋 Checklist các công việc cần làm trong ca:</strong>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:12}}>
          {tasks.map(t => (
            <div key={t.id} style={{background:'#fff', border:'1px solid #e6eef5', borderRadius:12, padding:'12px 14px', boxShadow:'0 6px 16px rgba(0,0,0,0.06)'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
                <label style={{display:'flex', alignItems:'center', gap:10, flex:1}}>
                  <input type="checkbox" checked={t.done} onChange={()=>toggleTask(t.id)} />
                  <span style={{fontWeight:600}}>{t.label}</span>
                </label>
                {t.useForm ? (
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <button
                      type="button"
                      onClick={() => setShowInventoryForm(true)}
                      style={{cursor:'pointer', padding:'6px 12px', background:'#3498db', color:'#fff', border:'none', borderRadius:6, fontSize:'0.9em', fontWeight:600}}
                    >
                      Điền form
                    </button>
                  </div>
                ) : t.requiresImage !== false && (
                  <div style={{display:'flex', alignItems:'center', gap:10}}>
                    <label style={{cursor:'pointer', padding:'6px 12px', background:'#43a8ef', color:'#fff', borderRadius:6, fontSize:'0.9em'}}>
                      Upload ảnh
                      <input type="file" accept="image/*" onChange={(e)=>onUpload(t.id, e.target.files?.[0])} style={{display:'none'}} />
                    </label>
                  </div>
                )}
              </div>
              {/* Text input cho task "Kiểm két" */}
              {t.useTextInput && (
                <div style={{marginTop:12}}>
                  <textarea
                    value={t.text || ''}
                    onChange={(e) => handleTextChange(t.id, e.target.value)}
                    placeholder="Nhập thông tin kiểm két (ví dụ: NHẬN CA: 914k, TIỀN MẶT: 30k, 100k, 120k, CHI: không có, KẾT CA: 1tr164k)"
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '10px',
                      border: '1px solid #e6eef5',
                      borderRadius: 8,
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              )}
              {t.image && (
                <div style={{marginTop:10}}>
                  <img src={t.image} alt={t.label} style={{maxWidth:'100%', maxHeight:200, borderRadius:8, border:'1px solid #eef5fa'}} />
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{marginTop:18, display:'flex', gap:12, alignItems:'stretch'}}>
          <button 
            onClick={handleEndShift} 
            style={{
              background:'#e67e22',
              color:'#fff',
              border:'none',
              borderRadius:12,
              padding:'12px 24px',
              fontSize:'1em',
              fontWeight:600,
              cursor:'pointer',
              boxShadow:'0 4px 12px rgba(0,0,0,0.1)',
              transition:'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#d35400'}
            onMouseLeave={(e) => e.target.style.background = '#e67e22'}
          >
            Kết ca và lưu
          </button>
          <button 
            onClick={() => navigate('/nhan-vien')} 
            style={{
              background:'#4A5568',
              color:'#fff',
              border:'none',
              borderRadius:12,
              padding:'12px 24px',
              fontSize:'1em',
              fontWeight:600,
              cursor:'pointer',
              flex:1,
              boxShadow:'0 4px 12px rgba(0,0,0,0.1)',
              transition:'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#2D3748'}
            onMouseLeave={(e) => e.target.style.background = '#4A5568'}
          >
            Quay lại
          </button>
        </div>
      </div>
      
      {/* Modal form kiểm tra nguyên vật liệu cho ca tối */}
      {showInventoryForm && (
        <EveningInventoryCheck
          onClose={() => setShowInventoryForm(false)}
          onSave={(itemsUpdated, formData) => {
            // Đánh dấu task "Kiểm tra nguyên vật liệu" là done và lưu dữ liệu form
            const inventoryTask = tasks.find(t => t.id === 'Kiểm tra nguyên vật liệu');
            if (inventoryTask) {
              const next = tasks.map(t => 
                t.id === 'Kiểm tra nguyên vật liệu' 
                  ? { ...t, done: true, inventoryFormData: formData || {} } 
                  : t
              );
              setTasks(next);
              saveState(next);
            }
            setShowInventoryForm(false);
          }}
        />
      )}
    </div>
  );
}

// Trang báo cáo checklist cho Admin
function ChecklistReport() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterPeriod, setFilterPeriod] = useState(''); // Filter theo chu kỳ lương (format: "YYYY-MM")
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchChecklist = React.useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL(CHECKLIST_GET_API);
      if (fromDate) url.searchParams.set('from', fromDate);
      if (toDate) url.searchParams.set('to', toDate);
      if (filterUser) url.searchParams.set('user', filterUser);
      
      console.log('=== FETCHING CHECKLIST ===');
      console.log('Filter user:', filterUser);
      console.log('URL:', url.toString());
      
      const res = await fetch(url.toString());
      const text = await res.text();
      console.log('=== FETCH CHECKLIST RESPONSE ===');
      console.log('Raw response length:', text.length);
      console.log('Raw response (first 500 chars):', text.substring(0, 500));
      
      let data = {};
      try { 
        data = JSON.parse(text); 
        if (typeof data.body === 'string') {
          console.log('Body is string, parsing again...');
          data = JSON.parse(data.body);
        }
        console.log('Parsed data keys:', Object.keys(data));
        console.log('Items count:', Array.isArray(data.items) ? data.items.length : 'N/A');
      } catch (parseErr) {
        console.error('Parse error:', parseErr);
      }
      
      let fetched = Array.isArray(data.items) ? data.items : [];
      
      // Client-side filter để đảm bảo filter hoạt động (nếu API không filter đúng)
      if (filterUser) {
        const beforeFilter = fetched.length;
        fetched = fetched.filter(item => {
          const itemUser = (item.user || '').toString().trim();
          const filterUserTrim = filterUser.trim();
          const matches = itemUser === filterUserTrim || itemUser.toLowerCase() === filterUserTrim.toLowerCase();
          if (!matches && beforeFilter > 0) {
            console.log(`Filtering out item: user="${itemUser}" (doesn't match "${filterUserTrim}")`);
          }
          return matches;
        });
        console.log(`Client-side filter: ${beforeFilter} items before, ${fetched.length} items after filtering by "${filterUser}"`);
      }
      
      // Log first item to check tasks structure
      if (fetched.length > 0) {
        const firstItem = fetched[0];
        const inventoryTask = firstItem.tasks?.['Kiểm tra nguyên vật liệu'];
        console.log('First item sample:', {
          user: firstItem.user,
          date: firstItem.date,
          shift: firstItem.shift,
          tasksKeys: firstItem.tasks ? Object.keys(firstItem.tasks) : [],
          inventoryTaskExists: !!inventoryTask,
          inventoryFormDataExists: !!(inventoryTask?.inventoryFormData),
          inventoryFormDataKeys: inventoryTask?.inventoryFormData ? Object.keys(inventoryTask.inventoryFormData) : [],
          inventoryFormDataSample: inventoryTask?.inventoryFormData ? Object.keys(inventoryTask.inventoryFormData).slice(0, 3).reduce((acc, key) => {
            acc[key] = inventoryTask.inventoryFormData[key];
            return acc;
          }, {}) : null
        });
      } else {
        console.log('No items found after filtering');
      }
      
      setItems(fetched);
    } catch (e) {
      console.error('Fetch checklist error', e);
      alert('Không thể tải checklist');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, filterUser]);

  React.useEffect(() => {
    // Fetch danh sách nhân viên
    (async () => {
      try {
        console.log('Fetching staff list from:', STAFF_API);
        const rs = await fetch(STAFF_API);
        const rsText = await rs.text();
        console.log('Staff API response text length:', rsText.length);
        console.log('Staff API response (first 500 chars):', rsText.substring(0, 500));
        
        let parsed = {};
        try { 
          parsed = JSON.parse(rsText); 
          if (typeof parsed.body === 'string') {
            console.log('Parsing body as string...');
            parsed = JSON.parse(parsed.body);
          }
        } catch (parseErr) {
          console.error('Error parsing staff response:', parseErr);
          parsed = {};
        }
        
        console.log('Parsed staff data:', parsed);
        console.log('Parsed keys:', Object.keys(parsed));
        
        const itemsStaff = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
        console.log('Items staff count:', itemsStaff.length);
        
        const list = [];
        itemsStaff.forEach(s => {
          const name = (s.Name || s.User_Name || s.name || s['Tên'] || '').toString().trim();
          if (!name) return;
          // Loại bỏ "kiett" khỏi danh sách nhân viên
          if (name.toLowerCase() === 'kiett') return;
          list.push(name);
        });
        
        console.log('Staff list after processing:', list);
        setStaffs(list.sort((a,b)=>a.localeCompare(b,'vi')));
      } catch (e) {
        console.error('Error fetching staff list:', e);
        alert('Không thể tải danh sách nhân viên. Vui lòng kiểm tra console để xem chi tiết.');
      }
    })();

    // Auto-set với current pay period
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const day = today.getDate();
    
    let fromY = y, fromM = m;
    if (day < 16) {
      fromM = m - 1;
      if (fromM < 0) {
        fromM = 11;
        fromY = y - 1;
      }
    }
    
    const pad = (n) => n.toString().padStart(2, '0');
    const currentPeriodKey = `${fromY}-${pad(fromM + 1)}`;
    setFilterPeriod(currentPeriodKey);
    
    // Set dates based on period
    const toY = fromM === 11 ? fromY + 1 : fromY;
    const toM = (fromM + 1) % 12;
    setFromDate(`${fromY}-${pad(fromM + 1)}-16`);
    setToDate(`${toY}-${pad(toM + 1)}-15`);
  }, []);
  
  // Fetch tất cả items khi component mount hoặc filterUser thay đổi
  React.useEffect(() => {
    const fetchAllChecklist = async () => {
      setLoading(true);
      try {
        // Fetch tất cả items (không gửi from/to để Lambda trả về tất cả)
        const url = new URL(CHECKLIST_GET_API);
        url.searchParams.set('all', 'true'); // Flag để Lambda biết trả về tất cả
        if (filterUser) url.searchParams.set('user', filterUser);
        
        console.log('=== FETCHING ALL CHECKLIST ITEMS ===');
        console.log('User filter:', filterUser || 'none');
        console.log('URL:', url.toString());
        
        const res = await fetch(url.toString());
        const text = await res.text();
        
        let data = {};
        try { 
          data = JSON.parse(text); 
          if (typeof data.body === 'string') {
            data = JSON.parse(data.body);
          }
        } catch (parseErr) {
          console.error('Parse error:', parseErr);
        }
        
        let fetched = Array.isArray(data.items) ? data.items : [];
        console.log('Total items fetched from DynamoDB:', fetched.length);
        
        // Client-side filter theo user nếu có
        if (filterUser) {
          fetched = fetched.filter(item => {
            const itemUser = (item.user || '').toString().trim();
            const filterUserTrim = filterUser.trim();
            return itemUser === filterUserTrim || itemUser.toLowerCase() === filterUserTrim.toLowerCase();
          });
        }
        
        console.log('Items after user filter:', fetched.length);
        setItems(fetched);
      } catch (e) {
        console.error('Fetch checklist error', e);
        alert('Không thể tải checklist');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllChecklist();
  }, [filterUser]);

  // Tạo danh sách các chu kỳ lương (từ 16 tháng này đến 15 tháng sau)
  const generatePayPeriods = React.useMemo(() => {
    const periods = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Tạo 13 chu kỳ gần nhất (6 tháng trước đến 6 tháng sau)
    for (let i = -6; i <= 6; i++) {
      let year = currentYear;
      let month = currentMonth + i;
      
      // Xử lý overflow/underflow của tháng
      if (month < 0) {
        month += 12;
        year -= 1;
      } else if (month >= 12) {
        month -= 12;
        year += 1;
      }
      
      // Tính tháng tiếp theo
      let nextMonth = month + 1;
      if (nextMonth >= 12) {
        nextMonth = 0;
      }
      
      // Format: "YYYY-MM" cho key, "Tháng MM/MM+1" cho display
      const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const periodLabel = `Tháng ${String(month + 1).padStart(2, '0')}/${String(nextMonth + 1).padStart(2, '0')}`;
      
      periods.push({
        key: periodKey,
        label: periodLabel,
        year: year,
        month: month
      });
    }
    
    return periods.sort((a, b) => {
      // Sắp xếp theo năm và tháng (mới nhất trước)
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  }, []);

  // Hàm fetch tất cả items (không filter theo date)
  const fetchAllChecklist = React.useCallback(async (user) => {
    setLoading(true);
    try {
      const url = new URL(CHECKLIST_GET_API);
      // Không set from/to để lấy tất cả items
      if (user) url.searchParams.set('user', user);
      
      console.log('=== FETCHING ALL CHECKLIST ITEMS ===');
      console.log('User filter:', user || 'none');
      console.log('URL:', url.toString());
      
      const res = await fetch(url.toString());
      const text = await res.text();
      
      let data = {};
      try { 
        data = JSON.parse(text); 
        if (typeof data.body === 'string') {
          data = JSON.parse(data.body);
        }
      } catch (parseErr) {
        console.error('Parse error:', parseErr);
      }
      
      let fetched = Array.isArray(data.items) ? data.items : [];
      console.log('Total items fetched from DynamoDB:', fetched.length);
      
      // Client-side filter theo user nếu có
      if (user) {
        fetched = fetched.filter(item => {
          const itemUser = (item.user || '').toString().trim();
          const filterUserTrim = user.trim();
          return itemUser === filterUserTrim || itemUser.toLowerCase() === filterUserTrim.toLowerCase();
        });
      }
      
      console.log('Items after user filter:', fetched.length);
      setItems(fetched);
    } catch (e) {
      console.error('Fetch checklist error', e);
      alert('Không thể tải checklist');
    } finally {
      setLoading(false);
    }
  }, []);

  // Khi chọn chu kỳ, chỉ cần set dates (không cần fetch vì đã có tất cả items)
  React.useEffect(() => {
    if (filterPeriod && generatePayPeriods.length > 0) {
      const period = generatePayPeriods.find(p => p.key === filterPeriod);
      if (period) {
        const pad = (n) => n.toString().padStart(2, '0');
        const toY = period.month === 11 ? period.year + 1 : period.year;
        const toM = (period.month + 1) % 12;
        const newFromDate = `${period.year}-${pad(period.month + 1)}-16`;
        const newToDate = `${toY}-${pad(toM + 1)}-15`;
        console.log('Setting dates from period:', filterPeriod, '->', newFromDate, 'to', newToDate);
        
        // Set dates (để dùng cho filter client-side)
        setFromDate(newFromDate);
        setToDate(newToDate);
      }
    }
  }, [filterPeriod, generatePayPeriods]);


  const getWeekdayVi = (dateStr) => {
    const [yy, mm, dd] = dateStr.split('-').map(Number);
    const d = new Date(yy, mm - 1, dd);
    const names = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return names[d.getDay()];
  };

  const getShiftName = (shift) => {
    const map = { sang: 'Ca sáng', trua: 'Ca trưa', toi: 'Ca tối' };
    return map[shift] || shift;
  };

  return (
    <div className="login-page" style={{justifyContent:'center', alignItems:'flex-start'}}>
      <div className="login-container" style={{width: 900, maxWidth: '96vw', marginTop: 24, marginBottom: 32}}>
        <h2 className="login-title" style={{color: '#e67e22'}}>Báo cáo Checklist</h2>
        <div className="login-underline" style={{ background: '#e67e22' }}></div>

        <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', margin:'16px 0'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <label style={{fontWeight:600, color:'#2b4c66', fontSize:'14px'}}>Lọc theo chu kỳ lương:</label>
            <select
              value={filterPeriod}
              onChange={(e) => {
                const newPeriod = e.target.value;
                console.log('Period changed to:', newPeriod);
                setFilterPeriod(newPeriod);
                // Không cần fetch, chỉ cần set period - filter sẽ được thực hiện khi render
              }}
              style={{
                padding:'6px 8px',
                border:'1px solid #e6eef5',
                borderRadius:8,
                fontSize:'14px',
                minWidth:140,
                background:'#fff',
                color:'#1c222f',
                cursor:'pointer',
                fontWeight:400,
                fontFamily:'inherit',
                boxSizing:'border-box'
              }}
            >
              <option value="">Chọn chu kỳ</option>
              {generatePayPeriods.map(period => (
                <option key={period.key} value={period.key}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
          <StaffFilterDropdown 
            options={staffs} 
            value={filterUser} 
            onChange={setFilterUser}
            placeholder="Lọc theo nhân viên"
          />
          <button className="login-button" onClick={() => {
            const fetchAll = async () => {
              setLoading(true);
              try {
                // Fetch tất cả items (không gửi from/to để Lambda trả về tất cả)
                const url = new URL(CHECKLIST_GET_API);
                url.searchParams.set('all', 'true'); // Flag để Lambda biết trả về tất cả
                if (filterUser) url.searchParams.set('user', filterUser);
                console.log('=== FETCHING ALL CHECKLIST ITEMS (manual) ===');
                console.log('URL:', url.toString());
                
                const res = await fetch(url.toString());
                const text = await res.text();
                
                let data = {};
                try { 
                  data = JSON.parse(text); 
                  if (typeof data.body === 'string') {
                    data = JSON.parse(data.body);
                  }
                } catch (parseErr) {
                  console.error('Parse error:', parseErr);
                }
                
                let fetched = Array.isArray(data.items) ? data.items : [];
                console.log('Total items fetched from DynamoDB:', fetched.length);
                
                if (filterUser) {
                  fetched = fetched.filter(item => {
                    const itemUser = (item.user || '').toString().trim();
                    const filterUserTrim = filterUser.trim();
                    return itemUser === filterUserTrim || itemUser.toLowerCase() === filterUserTrim.toLowerCase();
                  });
                }
                
                setItems(fetched);
              } catch (e) {
                console.error('Fetch checklist error', e);
                alert('Không thể tải checklist');
              } finally {
                setLoading(false);
              }
            };
            fetchAll();
          }} disabled={loading}>
            {loading ? 'Đang tải...' : 'Tải dữ liệu'}
          </button>
          <button className="login-button" onClick={() => navigate('/admin')} style={{background:'#6b7a86'}}>
            Quay lại
          </button>
        </div>

        <div className="roster-scroll" style={{marginTop:10}}>
          <table className="roster-table" style={{ borderCollapse: 'separate', borderSpacing:0, borderRadius:10, margin:'0 auto', minWidth:700 }}>
            <thead>
              <tr style={{background:'#f5fbff'}}>
                <th>Ngày</th>
                <th>Thứ</th>
                <th>Ca</th>
                <th>Nhân viên</th>
                <th>Task hoàn thành</th>
                <th>Ảnh</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                // Filter items theo chu kỳ lương được chọn (client-side để đảm bảo)
                let displayItems = items;
                if (filterPeriod && generatePayPeriods.length > 0) {
                  const period = generatePayPeriods.find(p => p.key === filterPeriod);
                  if (period) {
                    const pad = (n) => n.toString().padStart(2, '0');
                    const toY = period.month === 11 ? period.year + 1 : period.year;
                    const toM = (period.month + 1) % 12;
                    const periodFromDate = `${period.year}-${pad(period.month + 1)}-16`;
                    const periodToDate = `${toY}-${pad(toM + 1)}-15`;
                    
                    displayItems = items.filter(item => {
                      if (!item.date) return false;
                      return item.date >= periodFromDate && item.date <= periodToDate;
                    });
                    console.log('Display items filtered by period:', filterPeriod, 'from', periodFromDate, 'to', periodToDate, 'count:', displayItems.length, 'total items:', items.length);
                  }
                }
                
                if (displayItems.length === 0) {
                  return (
                    <tr><td colSpan={7} style={{padding:10, textAlign:'center', color:'#6b7a86'}}>
                      {loading ? 'Đang tải...' : 'Chưa có dữ liệu trong chu kỳ này'}
                    </td></tr>
                  );
                }
                
                return displayItems.map((it, i) => {
                const tasks = it.tasks || {};
                const taskList = Object.entries(tasks);
                const doneCount = taskList.filter(([_, t]) => t && (t.done === true || t.done === 'true')).length;
                const totalCount = taskList.length;
                
                // Debug: log để kiểm tra dữ liệu
                if (i === 0) {
                  console.log('=== DEBUG CHECKLIST ITEM ===');
                  console.log('Item:', it);
                  console.log('Tasks object:', tasks);
                  console.log('Task list entries:', taskList);
                  taskList.forEach(([taskId, t]) => {
                    console.log(`Task ${taskId}:`, t);
                    console.log(`  - imageUrl:`, t?.imageUrl ? (String(t.imageUrl).substring(0, 100) + '...') : 'null');
                    console.log(`  - image:`, t?.image ? (String(t.image).substring(0, 100) + '...') : 'null');
                  });
                }
                
                // Lấy tất cả ảnh từ tasks - kiểm tra cả imageUrl và image field
                const images = taskList
                  .map(([taskId, t]) => {
                    if (!t) {
                      if (i === 0) console.log(`Task ${taskId}: null task`);
                      return null;
                    }
                    // Ưu tiên imageUrl, nếu không có thì lấy image
                    const imgUrl = (t.imageUrl && String(t.imageUrl).trim()) || (t.image && String(t.image).trim()) || '';
                    
                    if (i === 0 && imgUrl) {
                      console.log(`Task ${taskId} có imgUrl, độ dài:`, imgUrl.length, 'Type:', typeof imgUrl);
                    }
                    
                    // Kiểm tra xem có ảnh thật không - giảm điều kiện strict hơn
                    if (imgUrl && imgUrl.length > 10) {
                      // Nếu là base64, phải có dữ liệu sau phần prefix
                      if (imgUrl.startsWith('data:')) {
                        const parts = imgUrl.split(',');
                        if (parts.length > 1 && parts[1].length > 10) { // Giảm từ 50 xuống 10 để dễ debug
                          // Base64 có dữ liệu thực
                          if (i === 0) console.log(`Task ${taskId}: Found valid base64 image, length:`, parts[1].length);
                          return { taskId, url: imgUrl };
                        } else {
                          if (i === 0) console.log(`Task ${taskId}: Base64 nhưng không đủ dữ liệu`, parts.length);
                        }
                      } else if (imgUrl.startsWith('http') || imgUrl.startsWith('/')) {
                        // URL hợp lệ
                        if (i === 0) console.log(`Task ${taskId}: Found valid URL`);
                        return { taskId, url: imgUrl };
                      } else {
                        if (i === 0) console.log(`Task ${taskId}: imgUrl không match format, giá trị:`, imgUrl.substring(0, 50));
                      }
                    } else {
                      if (i === 0 && taskList.length > 0) console.log(`Task ${taskId}: Không có imgUrl hoặc quá ngắn`);
                    }
                    return null;
                  })
                  .filter(Boolean);
                
                // Debug log để kiểm tra
                console.log(`Item ${i} (${it.date} ${it.shift}): Found ${images.length} images`);
                if (images.length > 0) {
                  console.log('Images found:', images.map(img => ({ taskId: img.taskId, urlLength: img.url.length })));
                } else if (taskList.length > 0) {
                  console.warn(`⚠ Item ${i} có ${taskList.length} tasks nhưng không tìm thấy ảnh nào!`);
                  console.warn('Task samples:', taskList.slice(0, 2).map(([tid, t]) => ({
                    id: tid,
                    hasImageUrl: !!(t?.imageUrl),
                    hasImage: !!(t?.image),
                    imageUrlLength: t?.imageUrl ? String(t.imageUrl).length : 0,
                    imageLength: t?.image ? String(t.image).length : 0
                  })));
                }
                
                return (
                  <tr key={i} style={{background: i%2===0 ? '#ffffff' : '#fbfdff'}}>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa'}}>{it.date}</td>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa', color:'#6b7a86'}}>{getWeekdayVi(it.date)}</td>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa'}}>{getShiftName(it.shift)}</td>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa'}}>{it.user}</td>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa', textAlign:'center'}}>
                      <span style={{fontWeight:600, color: doneCount === totalCount && totalCount > 0 ? '#2ecc71' : '#e67e22'}}>
                        {doneCount}/{totalCount}
                      </span>
                    </td>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa', textAlign:'center'}}>
                      {images.length === 0 ? (
                        <span style={{color:'#6b7a86', fontSize:'0.85em'}}>Không có ảnh</span>
                      ) : images.length === 1 ? (
                        <div style={{display:'flex', justifyContent:'center'}}>
                          <img 
                            src={images[0].url} 
                            alt={images[0].taskId}
                            style={{
                              width:60, height:60, objectFit:'cover', borderRadius:8,
                              border:'2px solid #43a8ef', cursor:'pointer',
                              boxShadow:'0 2px 8px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => setSelectedItem(it)}
                            title="Click để xem chi tiết"
                            onError={(e) => {
                              console.error('Image load error for', images[0].taskId, ':', images[0].url?.substring(0, 50));
                              e.target.style.display = 'none';
                              e.target.parentElement.innerHTML = '<span style="color:#e67e22;font-size:0.85em">Lỗi ảnh</span>';
                            }}
                          />
                        </div>
                      ) : (
                        <div style={{display:'flex', gap:4, alignItems:'center', justifyContent:'center'}}>
                          <img 
                            src={images[0].url} 
                            alt={images[0].taskId}
                            style={{
                              width:50, height:50, objectFit:'cover', borderRadius:6,
                              border:'2px solid #43a8ef', cursor:'pointer',
                              boxShadow:'0 2px 6px rgba(0,0,0,0.1)'
                            }}
                            onClick={() => setSelectedItem(it)}
                            title="Click để xem tất cả ảnh"
                            onError={(e) => {
                              console.error('Image load error for', images[0].taskId);
                              e.target.style.display = 'none';
                            }}
                          />
                          {images.length > 1 && (
                            <span style={{
                              fontSize:'0.75em', color:'#fff', fontWeight:700,
                              background:'#43a8ef', padding:'3px 8px', borderRadius:12,
                              minWidth:24, textAlign:'center'
                            }}>
                              +{images.length - 1}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa'}}>
                      <button 
                        className="login-button" 
                        style={{padding:'6px 12px', fontSize:'0.9em', width:'110px'}}
                        onClick={() => setSelectedItem(it)}
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
                });
              })()}
            </tbody>
          </table>
        </div>

        {/* Modal chi tiết */}
        {selectedItem && (
          <div style={{
            position:'fixed', top:0, left:0, right:0, bottom:0,
            background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center',
            zIndex:1000
          }} onClick={() => setSelectedItem(null)}>
            <div style={{
              background:'#fff', borderRadius:12, padding:20, maxWidth:600, width:'90vw',
              maxHeight:'80vh', overflow:'auto'
            }} onClick={(e)=>e.stopPropagation()}>
              <h3 style={{marginTop:0, color:'#e67e22'}}>Chi tiết Checklist</h3>
              <div style={{marginBottom:12}}>
                <strong>Nhân viên:</strong> {selectedItem.user}<br/>
                <strong>Ngày:</strong> {selectedItem.date} ({getWeekdayVi(selectedItem.date)})<br/>
                <strong>Ca:</strong> {getShiftName(selectedItem.shift)}<br/>
                <strong>Thời gian tạo:</strong> {new Date(selectedItem.createdAt).toLocaleString('vi-VN')}<br/>
                <strong>Cập nhật:</strong> {new Date(selectedItem.updatedAt).toLocaleString('vi-VN')}
              </div>
              <h4 style={{marginTop:16, marginBottom:8}}>Tasks:</h4>
              {(() => {
                // Debug: Log selectedItem khi mở modal
                console.log('[ChecklistDetail Modal] selectedItem:', {
                  user: selectedItem.user,
                  date: selectedItem.date,
                  shift: selectedItem.shift,
                  tasksKeys: selectedItem.tasks ? Object.keys(selectedItem.tasks) : [],
                  hasInventoryTask: !!(selectedItem.tasks?.['Kiểm tra nguyên vật liệu']),
                  inventoryTask: selectedItem.tasks?.['Kiểm tra nguyên vật liệu'],
                  inventoryFormData: selectedItem.tasks?.['Kiểm tra nguyên vật liệu']?.inventoryFormData
                });
                return null;
              })()}
              {Object.keys(selectedItem.tasks || {}).length === 0 ? (
                <div style={{color:'#6b7a86'}}>Không có task</div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:8}}>
                  {Object.entries(selectedItem.tasks || {}).map(([taskId, task]) => (
                    <div key={taskId} style={{
                      border:'1px solid #e6eef5', borderRadius:8, padding:12,
                      background: task.done ? '#e9f8ef' : '#fff5e5'
                    }}>
                      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                        <span style={{fontWeight:600}}>{taskId}</span>
                        <span style={{
                          padding:'2px 8px', borderRadius:4, fontSize:'0.85em',
                          background: task.done ? '#2ecc71' : '#e67e22',
                          color:'#fff'
                        }}>
                          {task.done ? '✓ Hoàn thành' : '✗ Chưa xong'}
                        </span>
                      </div>
                      {/* Hiển thị form kiểm tra nguyên vật liệu nếu có */}
                      {(() => {
                        // Debug: Log khi render task "Kiểm tra nguyên vật liệu"
                        if (taskId === 'Kiểm tra nguyên vật liệu') {
                          console.log('[ChecklistDetail] Task "Kiểm tra nguyên vật liệu":', {
                            taskId,
                            hasInventoryFormData: !!(task.inventoryFormData),
                            inventoryFormDataType: typeof task.inventoryFormData,
                            inventoryFormDataKeys: task.inventoryFormData ? Object.keys(task.inventoryFormData) : [],
                            inventoryFormDataLength: task.inventoryFormData ? Object.keys(task.inventoryFormData).length : 0,
                            allTaskKeys: Object.keys(task),
                            task: task
                          });
                        }
                        return taskId === 'Kiểm tra nguyên vật liệu' && task.inventoryFormData && Object.keys(task.inventoryFormData).length > 0;
                      })() && (
                        <div style={{marginTop:12, padding:12, background:'#f8f9fa', borderRadius:8, border:'1px solid #e0e0e0'}}>
                          <h5 style={{marginTop:0, marginBottom:12, color:'#e67e22', fontSize:'0.95em'}}>Kết quả kiểm tra nguyên vật liệu:</h5>
                          {(() => {
                            // Group items by category (same structure as EveningInventoryCheck)
                            const REQUIRED_ITEMS = {
                              'bot': { name: 'BỘT', items: ['matcha-thuong', 'matcha-premium', 'houjicha-thuong', 'houjicha-premium', 'cacao-bot', 'ca-phe'] },
                              'topping': { name: 'TOPPING', items: ['panna-cotta', 'banana-pudding-s', 'banana-pudding-l'] },
                              'sua': { name: 'SỮA', items: ['sua-do', 'sua-milklab-bo', 'sua-milklab-oat', 'boring-milk', 'sua-dac'] },
                              'cookies': { name: 'COOKIES', items: ['redvelvet', 'double-choco', 'brownie', 'tra-xanh-pho-mai', 'salted-caramel-cookie', 'ba-tuoc-vo-cam-pho-mai'] }
                            };
                            
                            const itemNames = {
                              'matcha-thuong': 'Matcha Thường', 'matcha-premium': 'Matcha Premium',
                              'houjicha-thuong': 'Houjicha Thường', 'houjicha-premium': 'Houjicha Premium',
                              'cacao-bot': 'Cacao', 'ca-phe': 'Cà phê',
                              'panna-cotta': 'Panna Cotta', 'banana-pudding-s': 'Banana Pudding size S', 'banana-pudding-l': 'Banana Pudding size L',
                              'sua-do': 'Sữa đỏ', 'sua-milklab-bo': 'Sữa Milklab Bò', 'sua-milklab-oat': 'Sữa Milklab Oat',
                              'boring-milk': 'Boring Milk', 'sua-dac': 'Sữa đặc',
                              'redvelvet': 'Redvelvet', 'double-choco': 'Double choco', 'brownie': 'Brownie',
                              'tra-xanh-pho-mai': 'Trà xanh Phô Mai', 'salted-caramel-cookie': 'Salted Caramel',
                              'ba-tuoc-vo-cam-pho-mai': 'Bá tước vỏ cam Phô mai'
                            };
                            
                            const itemUnits = {
                              'matcha-thuong': 'hủ', 'matcha-premium': 'hủ', 'houjicha-thuong': 'hủ', 'houjicha-premium': 'hủ',
                              'cacao-bot': 'bịch', 'ca-phe': 'bịch',
                              'panna-cotta': 'hủ', 'banana-pudding-s': 'hộp', 'banana-pudding-l': 'hộp',
                              'sua-do': 'hộp', 'sua-milklab-bo': 'hộp', 'sua-milklab-oat': 'hộp', 'boring-milk': 'hộp', 'sua-dac': 'hộp',
                              'redvelvet': 'cái', 'double-choco': 'cái', 'brownie': 'cái', 'tra-xanh-pho-mai': 'cái',
                              'salted-caramel-cookie': 'cái', 'ba-tuoc-vo-cam-pho-mai': 'cái'
                            };
                            
                            return Object.keys(REQUIRED_ITEMS).map(categoryKey => {
                              const category = REQUIRED_ITEMS[categoryKey];
                              const itemsWithData = category.items.filter(itemId => 
                                task.inventoryFormData[itemId] !== undefined && 
                                task.inventoryFormData[itemId] !== '' && 
                                task.inventoryFormData[itemId] !== null
                              );
                              
                              if (itemsWithData.length === 0) return null;
                              
                              return (
                                <div key={categoryKey} style={{marginBottom:12}}>
                                  <div style={{fontWeight:600, marginBottom:6, color:'#2c3e50', fontSize:'0.9em'}}>{category.name}</div>
                                  <div style={{display:'flex', flexDirection:'column', gap:4, paddingLeft:8}}>
                                    {itemsWithData.map(itemId => (
                                      <div key={itemId} style={{display:'flex', justifyContent:'space-between', fontSize:'0.85em'}}>
                                        <span>{itemNames[itemId] || itemId}</span>
                                        <span style={{fontWeight:600, color:'#e67e22'}}>
                                          {task.inventoryFormData[itemId]} {itemUnits[itemId] || ''}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      )}
                      {/* Hiển thị text cho task "Kiểm két" */}
                      {taskId === 'Kiểm két' && task.text && task.text.trim().length > 0 && (
                        <div style={{marginTop:12, padding:12, background:'#f0f7ff', borderRadius:8, border:'1px solid #b3d9ff'}}>
                          <h5 style={{marginTop:0, marginBottom:8, color:'#2c3e50', fontSize:'0.95em', fontWeight:600}}>Thông tin kiểm két:</h5>
                          <div style={{
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            fontSize: '14px',
                            lineHeight: '1.6',
                            color: '#2c3e50',
                            fontFamily: 'monospace',
                            background: '#fff',
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid #e0e0e0'
                          }}>
                            {task.text}
                          </div>
                        </div>
                      )}
                      {(task.imageUrl || task.image) && (() => {
                        const imgUrl = (task.imageUrl && String(task.imageUrl).trim()) || (task.image && String(task.image).trim());
                        // Kiểm tra xem ảnh có hợp lệ không
                        if (imgUrl && imgUrl.length > 20) {
                          const isValid = imgUrl.startsWith('data:') 
                            ? imgUrl.split(',').length > 1 && imgUrl.split(',')[1].length > 50
                            : imgUrl.startsWith('http') || imgUrl.startsWith('/');
                          
                          if (isValid) {
                            return (
                              <div style={{marginTop:8}}>
                                <img 
                                  src={imgUrl} 
                                  alt={taskId} 
                                  style={{
                                    maxWidth:'100%', maxHeight:300, borderRadius:8, 
                                    border:'2px solid #43a8ef', objectFit:'contain',
                                    background:'#f5f7fa'
                                  }}
                                  onError={(e) => {
                                    console.error('Image load error in modal for', taskId);
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<span style="color:#e67e22;font-size:0.9em">Không thể tải ảnh</span>';
                                  }}
                                />
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                    </div>
                  ))}
                </div>
              )}
              <button className="login-button" style={{marginTop:16}} onClick={() => setSelectedItem(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Trang quản lý tăng ca/đi trễ
function OvertimeManagement() {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    staffName: '',
    date: '',
    shift: '',
    type: 'overtime', // 'overtime' hoặc 'late'
    hours: 0
  });
  const [records, setRecords] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [filterStaff, setFilterStaff] = useState(''); // Filter theo nhân viên
  const [filterType, setFilterType] = useState(''); // Filter theo loại: 'overtime', 'late', hoặc '' (tất cả)
  const [filterPeriod, setFilterPeriod] = useState(''); // Filter theo chu kỳ lương (format: "YYYY-MM")

  // Fetch records từ API hoặc localStorage
  React.useEffect(() => {
    (async () => {
      try {
        // Thử fetch từ API trước
        if (OVERTIME_GET_API && !OVERTIME_GET_API.includes('YOUR_API_GATEWAY_URL')) {
          const res = await fetch(OVERTIME_GET_API);
          const text = await res.text();
          let parsed = {};
          try { parsed = JSON.parse(text); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch {}
          const items = Array.isArray(parsed.items) ? parsed.items : [];
          if (items.length > 0) {
            setRecords(items);
            // Vẫn lưu vào localStorage để tương thích ngược
            localStorage.setItem('overtimeRecords', JSON.stringify(items));
            return;
          }
        }
      } catch (e) {
        console.log('Failed to fetch from API, using localStorage:', e);
      }
      
      // Fallback: dùng localStorage
      try {
        const saved = localStorage.getItem('overtimeRecords');
        const records = saved ? JSON.parse(saved) : [];
        setRecords(records);
      } catch (e) {
        console.error('Error loading records:', e);
      }
    })();
  }, []);

  // Tạo danh sách các chu kỳ lương (từ 16 tháng này đến 15 tháng sau)
  const generatePayPeriods = () => {
    const periods = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Tạo 13 chu kỳ gần nhất (6 tháng trước đến 6 tháng sau)
    for (let i = -6; i <= 6; i++) {
      let year = currentYear;
      let month = currentMonth + i;
      
      // Xử lý overflow/underflow của tháng
      if (month < 0) {
        month += 12;
        year -= 1;
      } else if (month >= 12) {
        month -= 12;
        year += 1;
      }
      
      // Tính tháng tiếp theo
      let nextMonth = month + 1;
      if (nextMonth >= 12) {
        nextMonth = 0;
      }
      
      // Format: "YYYY-MM" cho key, "Tháng MM/MM+1" cho display
      const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const periodLabel = `Tháng ${String(month + 1).padStart(2, '0')}/${String(nextMonth + 1).padStart(2, '0')}`;
      
      periods.push({
        key: periodKey,
        label: periodLabel,
        year: year,
        month: month
      });
    }
    
    return periods.sort((a, b) => {
      // Sắp xếp theo năm và tháng (mới nhất trước)
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const payPeriods = generatePayPeriods();

  React.useEffect(() => {
    (async () => {
      try {
        const rs = await fetch(STAFF_API);
        const rsText = await rs.text();
        let parsed = {};
        try { parsed = JSON.parse(rsText); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch { parsed = {}; }
        const itemsStaff = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
        const list = [];
        itemsStaff.forEach(s => {
          const name = (s.Name || s.User_Name || s.name || s['Tên'] || '').toString().trim();
          if (!name) return;
          // Loại bỏ "kiett" và "Mamaboo" khỏi danh sách
          if (name.toLowerCase() === 'kiett' || name.toLowerCase() === 'mamaboo') return;
          list.push(name);
        });
        setStaffs(list.sort((a,b)=>a.localeCompare(b,'vi')));
      } catch (e) {
        console.error('Error fetching staff list:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Set default date to today
  React.useEffect(() => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setFormData(prev => prev.date ? prev : { ...prev, date: dateStr });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staffName || !formData.date || !formData.shift || formData.hours <= 0) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setSubmitting(true);

    try {
      // Ensure hours is a number (support decimals)
      const hoursValue = parseFloat(formData.hours);
      if (isNaN(hoursValue) || hoursValue <= 0) {
        alert('Số giờ/lần phải là số dương!');
        return;
      }

      const recordData = {
        staffName: formData.staffName,
        date: formData.date,
        shift: formData.shift,
        type: formData.type,
        hours: hoursValue  // Use parseFloat to preserve decimals
      };

      let newRecord;
      
      // Thử POST lên API trước
      if (OVERTIME_POST_API && !OVERTIME_POST_API.includes('YOUR_API_GATEWAY_URL')) {
        try {
          const res = await fetch(OVERTIME_POST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(recordData)
          });
          const text = await res.text();
          let parsed = {};
          try { parsed = JSON.parse(text); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch {}
          
          if (parsed.item && parsed.item.id) {
            newRecord = parsed.item;
          } else {
            // Nếu API không trả về item, tạo ID local
            newRecord = { ...recordData, id: Date.now().toString() };
          }
        } catch (apiError) {
          console.log('API POST failed, using localStorage:', apiError);
          // Fallback: dùng localStorage
          newRecord = { ...recordData, id: Date.now().toString() };
        }
      } else {
        // API chưa được cấu hình, dùng localStorage
        newRecord = { ...recordData, id: Date.now().toString() };
      }

      // Cập nhật state và localStorage
      const updatedRecords = [...records, newRecord];
      setRecords(updatedRecords);
      localStorage.setItem('overtimeRecords', JSON.stringify(updatedRecords));

      // Reset form và đóng form
      setFormData({
        staffName: '',
        date: new Date().toISOString().split('T')[0],
        shift: '',
        type: 'overtime',
        hours: 0
      });
      setShowForm(false);

      alert('Đã thêm thành công!');
    } catch (error) {
      console.error('Error submitting record:', error);
      alert('Có lỗi xảy ra khi thêm bản ghi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa bản ghi này?')) return;

    // Đảm bảo ID là string
    const recordId = String(id || '').trim();
    if (!recordId) {
      alert('Không tìm thấy ID của bản ghi cần xóa');
      return;
    }

    console.log('Deleting record with ID:', recordId);

    try {
      // Thử DELETE qua API trước
      if (OVERTIME_DELETE_API && !OVERTIME_DELETE_API.includes('YOUR_API_GATEWAY_URL')) {
        try {
          // Gửi ID trong request body thay vì query string vì API Gateway có thể không truyền query params
          console.log('DELETE URL:', OVERTIME_DELETE_API);
          console.log('DELETE ID:', recordId);
          
          const response = await fetch(OVERTIME_DELETE_API, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: recordId })
          });
          
          const text = await response.text();
          console.log('DELETE response:', text);
          
          let parsed = {};
          try { parsed = JSON.parse(text); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch {}
          
          console.log('DELETE parsed:', parsed);
          
          if (!response.ok || (parsed.error && !parsed.ok)) {
            throw new Error(parsed.error || `HTTP ${response.status}`);
          }
          
          // Xóa thành công, reload records từ API
          try {
            const res = await fetch(OVERTIME_GET_API);
            const resText = await res.text();
            let resParsed = {};
            try { resParsed = JSON.parse(resText); if (typeof resParsed.body === 'string') resParsed = JSON.parse(resParsed.body); } catch {}
            const items = Array.isArray(resParsed.items) ? resParsed.items : [];
            setRecords(items);
            localStorage.setItem('overtimeRecords', JSON.stringify(items));
            alert('Đã xóa thành công!');
            return;
          } catch (fetchError) {
            console.error('Error reloading records:', fetchError);
            // Fallback: xóa khỏi state
            const updatedRecords = records.filter(r => String(r.id) !== recordId);
            setRecords(updatedRecords);
            localStorage.setItem('overtimeRecords', JSON.stringify(updatedRecords));
            alert('Đã xóa thành công!');
            return;
          }
        } catch (apiError) {
          console.error('API DELETE failed:', apiError);
          console.error('Error details:', {
            id: recordId,
            idType: typeof recordId,
            url: `${OVERTIME_DELETE_API}?id=${encodeURIComponent(recordId)}`
          });
          alert(`Không thể xóa trên server: ${apiError.message}. Vui lòng thử lại sau.`);
          return;
        }
      }

      // Fallback: chỉ xóa từ localStorage nếu API chưa được cấu hình
      const updatedRecords = records.filter(r => String(r.id) !== recordId);
      setRecords(updatedRecords);
      localStorage.setItem('overtimeRecords', JSON.stringify(updatedRecords));
      alert('Đã xóa khỏi bộ nhớ local (API chưa được cấu hình)');
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Có lỗi xảy ra khi xóa bản ghi. Vui lòng thử lại.');
    }
  };

  const getShiftName = (shift) => {
    const map = { sang: 'Ca sáng', trua: 'Ca trưa', toi: 'Ca tối' };
    return map[shift] || shift;
  };

  if (loading) {
    return (
      <div className="login-page" style={{justifyContent:'center', alignItems:'center'}}>
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="login-page" style={{justifyContent:'center', alignItems:'flex-start'}}>
      <div className="login-container" style={{width: 900, maxWidth: '96vw', marginTop: 24, marginBottom: 32}}>
        <h2 className="login-title" style={{color: '#e67e22'}}>Quản lý tăng ca/đi trễ</h2>
        <div className="login-underline" style={{ background: '#e67e22' }}></div>

        <div style={{marginTop:24, display:'flex', justifyContent:'flex-start', gap:12}}>
          <button 
            type="button"
            className="login-button" 
            onClick={() => setShowForm(true)}
            style={{padding:'12px 36px'}}
          >
            Tạo
          </button>
        </div>

        {/* Modal */}
        {showForm && (
          <div 
            style={{
              position:'fixed',
              top:0,
              left:0,
              right:0,
              bottom:0,
              background:'rgba(0,0,0,0.5)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              zIndex:1000
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowForm(false);
                setFormData({
                  staffName: '',
                  date: new Date().toISOString().split('T')[0],
                  shift: '',
                  type: 'overtime',
                  hours: 0
                });
              }
            }}
          >
            <form 
              onSubmit={handleSubmit} 
              onClick={(e) => e.stopPropagation()}
              style={{
                background:'#fff',
                borderRadius:12,
                padding:24,
                boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
                width:'90%',
                maxWidth:500,
                maxHeight:'90vh',
                overflow:'auto'
              }}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h3 style={{margin:0, color:'#1c222f', fontSize:'20px', fontWeight:700}}>Thêm mới</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      staffName: '',
                      date: new Date().toISOString().split('T')[0],
                      shift: '',
                      type: 'overtime',
                      hours: 0
                    });
                  }}
                  style={{
                    background:'transparent',
                    border:'none',
                    fontSize:'24px',
                    cursor:'pointer',
                    color:'#6b7a86',
                    padding:0,
                    width:30,
                    height:30,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div>
                  <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>Nhân viên *</label>
                  <select
                    value={formData.staffName}
                    onChange={(e) => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                    required
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e6eef5', borderRadius:8, fontSize:'16px'}}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {staffs.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>Ngày *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e6eef5', borderRadius:8, fontSize:'16px'}}
                  />
                </div>

                <div>
                  <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>Ca *</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData(prev => ({ ...prev, shift: e.target.value }))}
                    required
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e6eef5', borderRadius:8, fontSize:'16px'}}
                  >
                    <option value="">-- Chọn ca --</option>
                    <option value="sang">Ca sáng</option>
                    <option value="trua">Ca trưa</option>
                    <option value="toi">Ca tối</option>
                  </select>
                </div>

                <div>
                  <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>Loại *</label>
                  <div style={{display:'flex', gap:16}}>
                    <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                      <input
                        type="radio"
                        name="type"
                        value="overtime"
                        checked={formData.type === 'overtime'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      />
                      <span>Tăng ca</span>
                    </label>
                    <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer'}}>
                      <input
                        type="radio"
                        name="type"
                        value="late"
                        checked={formData.type === 'late'}
                        onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                      />
                      <span>Đi trễ</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>
                    {formData.type === 'overtime' ? 'Số giờ tăng ca *' : 'Số lần đi trễ *'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={formData.hours}
                    onChange={(e) => setFormData(prev => ({ ...prev, hours: e.target.value }))}
                    required
                    placeholder={formData.type === 'overtime' ? 'Ví dụ: 1.5' : 'Ví dụ: 0.5, 1.5'}
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e6eef5', borderRadius:8, fontSize:'16px'}}
                  />
                </div>

                <div style={{display:'flex', gap:12, marginTop:8}}>
                  <button type="submit" className="login-button" style={{flex:1, padding:'12px', minWidth:0, width:'auto'}} disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Thêm'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        staffName: '',
                        date: new Date().toISOString().split('T')[0],
                        shift: '',
                        type: 'overtime',
                        hours: 0
                      });
                    }}
                    style={{flex:1, padding:'12px', background:'#6b7a86', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, minWidth:0, width:'auto'}}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filter section */}
        {records.length > 0 && (
          <div style={{marginTop:24, marginBottom:16}}>
            <div style={{display:'flex', gap:12, alignItems:'center', flexWrap:'wrap'}}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <label style={{fontWeight:600, color:'#2b4c66', fontSize:'14px'}}>Lọc theo chu kỳ lương:</label>
                <select
                  value={filterPeriod}
                  onChange={(e) => setFilterPeriod(e.target.value)}
                  style={{
                    padding:'6px 8px',
                    border:'1px solid #e6eef5',
                    borderRadius:8,
                    fontSize:'14px',
                    minWidth:140,
                    background:'#fff',
                    color:'#1c222f',
                    cursor:'pointer',
                    fontWeight:400,
                    fontFamily:'inherit',
                    boxSizing:'border-box'
                  }}
                >
                  <option value="">Tất cả chu kỳ</option>
                  {payPeriods.map(period => (
                    <option key={period.key} value={period.key}>
                      {period.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <label style={{fontWeight:600, color:'#2b4c66', fontSize:'14px'}}>Lọc theo nhân viên:</label>
                <StaffFilterDropdown 
                  options={staffs} 
                  value={filterStaff} 
                  onChange={setFilterStaff}
                  placeholder="Tất cả nhân viên"
                />
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <label style={{fontWeight:600, color:'#2b4c66', fontSize:'14px'}}>Lọc theo loại:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  style={{
                    padding:'6px 8px',
                    border:'1px solid #e6eef5',
                    borderRadius:8,
                    fontSize:'14px',
                    minWidth:140,
                    background:'#fff',
                    color:'#1c222f',
                    cursor:'pointer',
                    fontWeight:400,
                    fontFamily:'inherit',
                    boxSizing:'border-box'
                  }}
                >
                  <option value="">Tất cả</option>
                  <option value="overtime">Tăng ca</option>
                  <option value="late">Đi trễ</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {records.length > 0 && (
          <div style={{marginTop:records.length > 0 ? 0 : 24, width:'100%', overflow:'visible'}}>
            <h3 style={{marginBottom:16, color:'#1c222f'}}>Danh sách đã thêm</h3>
            <div className="roster-scroll" style={{width:'100%', overflowX:'auto', overflowY:'visible', WebkitOverflowScrolling:'touch'}}>
              <table className="roster-table" style={{ borderCollapse: 'separate', borderSpacing:0, borderRadius:10, boxShadow:'0 3px 14px rgba(0,0,0,0.06)', margin:'0 auto', minWidth:800, width:'auto' }}>
                <thead>
                  <tr style={{background:'#f7fafc'}}>
                    <th style={{padding:'12px 8px', borderBottom:'1px solid #eaeef2', textAlign:'left'}}>Nhân viên</th>
                    <th style={{padding:'12px 8px', borderBottom:'1px solid #eaeef2'}}>Ngày</th>
                    <th style={{padding:'12px 8px', borderBottom:'1px solid #eaeef2'}}>Ca</th>
                    <th style={{padding:'12px 8px', borderBottom:'1px solid #eaeef2'}}>Loại</th>
                    <th style={{padding:'12px 8px', borderBottom:'1px solid #eaeef2'}}>Số giờ/lần</th>
                    <th style={{padding:'12px 8px', borderBottom:'1px solid #eaeef2'}}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Filter records
                    const filtered = records.filter(record => {
                      // Filter theo nhân viên
                      if (filterStaff && record.staffName !== filterStaff) return false;
                      
                      // Filter theo loại
                      if (filterType && record.type !== filterType) return false;
                      
                      // Filter theo chu kỳ lương
                      if (filterPeriod) {
                        if (!record.date) return false;
                        const [recordYear, recordMonth, recordDay] = record.date.split('-').map(Number);
                        let periodMonth = recordMonth;
                        let periodYear = recordYear;
                        
                        // Tính chu kỳ lương của record (từ ngày 16 tháng này đến 15 tháng sau)
                        if (recordDay < 16) {
                          if (recordMonth === 1) {
                            periodMonth = 12;
                            periodYear = recordYear - 1;
                          } else {
                            periodMonth = recordMonth - 1;
                          }
                        }
                        
                        const recordPeriodKey = `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
                        if (recordPeriodKey !== filterPeriod) return false;
                      }
                      
                      return true;
                    });
                    
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} style={{padding:20, textAlign:'center', color:'#6b7a86'}}>
                            Không có dữ liệu phù hợp với bộ lọc
                          </td>
                        </tr>
                      );
                    }
                    
                    return filtered.map((record) => (
                      <tr key={record.id} style={{background:'#fff'}}>
                        <td style={{padding:'10px 8px', borderBottom:'1px solid #f1f4f7', fontWeight:600}}>{record.staffName}</td>
                        <td style={{padding:'10px 8px', borderBottom:'1px solid #f1f4f7'}}>{record.date}</td>
                        <td style={{padding:'10px 8px', borderBottom:'1px solid #f1f4f7'}}>{getShiftName(record.shift)}</td>
                        <td style={{padding:'10px 8px', borderBottom:'1px solid #f1f4f7'}}>
                          {record.type === 'overtime' ? 'Tăng ca' : 'Đi trễ'}
                        </td>
                        <td style={{padding:'10px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'center', fontWeight:600}}>
                          {record.hours}
                        </td>
                        <td style={{padding:'10px 8px', borderBottom:'1px solid #f1f4f7'}}>
                          <button
                            type="button"
                            onClick={() => handleDelete(record.id)}
                            style={{padding:'6px 12px', background:'#e67e22', color:'#fff', border:'none', borderRadius:6, cursor:'pointer', fontSize:'14px'}}
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{marginTop:24, display:'flex', justifyContent:'center', gap:12}}>
          <button className="login-button" onClick={() => navigate('/admin')} style={{padding:'12px 36px'}}>
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

// Trang kiểm tra nguyên vật liệu cho nhân viên
// NOTE: Component này đã được move ra file riêng: components/InventoryCheck.js
// Function này được giữ lại để tránh breaking changes, nhưng route đang dùng component từ file riêng
// eslint-disable-next-line no-unused-vars
function InventoryCheck_OLD() {
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

// Trang quản lý nguyên vật liệu cho admin
// NOTE: Component này đã được move ra file riêng: components/InventoryManagement.js
// Function này được giữ lại để tránh breaking changes, nhưng route đang dùng component từ file riêng
// eslint-disable-next-line no-unused-vars
function InventoryManagement_OLD() {
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
                          <th style={{padding: '12px', textAlign: 'center', fontWeight: 600, color: '#2b4c66'}}>Nhập Hàng</th>
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
                                    ✓ Còn hàng
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/nhan-vien" element={<ProtectedRoute><NhanVien /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/checklist-report" element={<ProtectedRoute><ChecklistReport /></ProtectedRoute>} />
        <Route path="/checkin" element={<ProtectedRoute><Checkin /></ProtectedRoute>} />
        <Route path="/overtime-management" element={<ProtectedRoute><OvertimeManagement /></ProtectedRoute>} />
        <Route path="/penalty-management" element={<ProtectedRoute><PenaltyManagement /></ProtectedRoute>} />
        <Route path="/inventory-check" element={<ProtectedRoute><InventoryCheck /></ProtectedRoute>} />
        <Route path="/inventory-management" element={<ProtectedRoute><InventoryManagement /></ProtectedRoute>} />
        <Route path="/inventory-history" element={<ProtectedRoute><InventoryHistory /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

// Trang quản lý hình phạt
function PenaltyManagement() {
  const navigate = useNavigate();
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    staffName: '',
    penaltyLevel: '',
    customAmount: '',
    date: '',
    reason: ''
  });
  const [records, setRecords] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [filterStaff, setFilterStaff] = useState(''); // Filter theo nhân viên
  const [filterPeriod, setFilterPeriod] = useState(''); // Filter theo chu kỳ lương (format: "YYYY-MM")
  const [isMobile, setIsMobile] = useState(window.innerWidth < 600);
  
  // Track window size for responsive design
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch penalty records từ API hoặc localStorage
  const fetchPenaltyRecords = React.useCallback(async () => {
    let apiSuccess = false;
    
    try {
      // Thử fetch từ API trước
      if (PENALTY_GET_API && !PENALTY_GET_API.includes('YOUR_API_GATEWAY_URL')) {
        // Thêm timestamp để tránh cache
        const apiUrl = `${PENALTY_GET_API}?t=${Date.now()}`;
        const res = await fetch(apiUrl);
        const text = await res.text();
        console.log('Penalty API response text:', text.substring(0, 500)); // Debug log
        let parsed = {};
        try { 
          parsed = JSON.parse(text); 
          if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); 
        } catch (parseError) {
          console.error('Error parsing penalty API response:', parseError);
          throw parseError; // Throw để rơi vào catch block
        }
        const items = Array.isArray(parsed.items) ? parsed.items : [];
        console.log('Penalty records fetched from API:', items.length, 'items'); // Debug log
        
        // QUAN TRỌNG: Set vào state ngay lập tức, không phụ thuộc vào localStorage
        setRecords(items);
        apiSuccess = true; // Đánh dấu API thành công
        
        // Cố gắng lưu vào localStorage (nhưng không bắt buộc - nếu lỗi thì bỏ qua)
        try {
          if (items.length === 0) {
            localStorage.removeItem('penaltyRecords');
          } else {
            localStorage.setItem('penaltyRecords', JSON.stringify(items));
          }
        } catch (storageError) {
          // Nếu localStorage đầy hoặc lỗi, chỉ log warning, không ảnh hưởng đến việc hiển thị
          console.warn('Could not save to localStorage (quota exceeded or other error):', storageError);
          // Cố gắng xóa một số key cũ để giải phóng space (optional)
          try {
            // Xóa các key không cần thiết nếu có
            const keysToRemove = ['old_penaltyRecords', 'temp_penaltyRecords'];
            keysToRemove.forEach(key => {
              try { localStorage.removeItem(key); } catch {}
            });
          } catch {}
        }
        return; // Quan trọng: return ngay sau khi set state từ API
      }
    } catch (e) {
      console.log('Failed to fetch from API, using localStorage:', e);
      apiSuccess = false;
    }
    
    // Fallback: dùng localStorage CHỈ KHI API không available hoặc lỗi
    // Và CHỈ khi API chưa thành công (tránh override dữ liệu từ API)
    if (!apiSuccess) {
      try {
        const saved = localStorage.getItem('penaltyRecords');
        const records = saved ? JSON.parse(saved) : [];
        console.log('Penalty records loaded from localStorage:', records.length, 'items'); // Debug log
        setRecords(records);
      } catch (e) {
        console.error('Error loading penalty records:', e);
        setRecords([]); // Set empty array nếu cả localStorage cũng lỗi
      }
    }
  }, []);

  React.useEffect(() => {
    fetchPenaltyRecords();
  }, [fetchPenaltyRecords]);

  // Debug: Log khi records thay đổi
  React.useEffect(() => {
    console.log('Penalty records state updated:', records.length, 'items');
  }, [records]);

  // Tạo danh sách các chu kỳ lương (từ 16 tháng này đến 15 tháng sau)
  const generatePayPeriods = () => {
    const periods = [];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11
    
    // Tạo 12 chu kỳ gần nhất (6 tháng trước đến 6 tháng sau)
    for (let i = -6; i <= 6; i++) {
      let year = currentYear;
      let month = currentMonth + i;
      
      // Xử lý overflow/underflow của tháng
      if (month < 0) {
        month += 12;
        year -= 1;
      } else if (month >= 12) {
        month -= 12;
        year += 1;
      }
      
      // Tính tháng tiếp theo
      let nextMonth = month + 1;
      if (nextMonth >= 12) {
        nextMonth = 0;
      }
      
      // Format: "YYYY-MM" cho key, "Tháng MM/MM+1" cho display
      const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const periodLabel = `Tháng ${String(month + 1).padStart(2, '0')}/${String(nextMonth + 1).padStart(2, '0')}`;
      
      periods.push({
        key: periodKey,
        label: periodLabel,
        year: year,
        month: month
      });
    }
    
    return periods.sort((a, b) => {
      // Sắp xếp theo năm và tháng (mới nhất trước)
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
  };

  const payPeriods = generatePayPeriods();

  // Fetch staff list
  React.useEffect(() => {
    (async () => {
      try {
        const rs = await fetch(STAFF_API);
        const rsText = await rs.text();
        let parsed = {};
        try { parsed = JSON.parse(rsText); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch { parsed = {}; }
        const itemsStaff = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.items) ? parsed.items : []);
        const list = [];
        itemsStaff.forEach(s => {
          const name = (s.Name || s.User_Name || s.name || s['Tên'] || '').toString().trim();
          if (!name) return;
          // Loại bỏ "kiett" và "Mamaboo" khỏi danh sách
          if (name.toLowerCase() === 'kiett' || name.toLowerCase() === 'mamaboo') return;
          list.push(name);
        });
        setStaffs(list.sort((a,b)=>a.localeCompare(b,'vi')));
      } catch (e) {
        console.error('Error fetching staff list:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Set default date to today
  React.useEffect(() => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setFormData(prev => prev.date ? prev : { ...prev, date: dateStr });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Penalty rates: mức 0 = 0k (nhắc nhở), mức 1 = 40k, mức 2 = 80k, mức 3 = 100k, mức 4 = 150k, mức 5 = 200k
  const PENALTY_RATES = {
    '0': 0,
    '1': 40000,
    '2': 80000,
    '3': 100000,
    '4': 150000,
    '5': 200000
  };

  // Format penalty rate to display (e.g., 40000 -> "40k")
  const formatPenaltyRate = (rate) => {
    if (rate === 0) return '';
    return `${rate / 1000}k`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.staffName || !formData.penaltyLevel || !formData.date || !formData.reason.trim()) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    
    // Validate custom amount nếu chọn tùy chỉnh
    if (formData.penaltyLevel === 'custom') {
      const customAmount = parseFloat(formData.customAmount);
      if (!formData.customAmount || isNaN(customAmount) || customAmount < 0) {
        alert('Vui lòng nhập giá phạt hợp lệ!');
        return;
      }
    }

    setSubmitting(true);

    // Tạo recordData cho cả custom và standard
    const recordData = {
      staffName: formData.staffName,
      penaltyLevel: formData.penaltyLevel,
      date: formData.date,
      reason: formData.reason.trim()
    };
    
    // Thêm customAmount nếu là custom
    if (formData.penaltyLevel === 'custom') {
      recordData.customAmount = parseFloat(formData.customAmount);
    }
    
    // Thử POST lên API trước
    if (PENALTY_POST_API && !PENALTY_POST_API.includes('YOUR_API_GATEWAY_URL')) {
      try {
        const res = await fetch(PENALTY_POST_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recordData)
        });
        const text = await res.text();
        let parsed = {};
        try { parsed = JSON.parse(text); if (typeof parsed.body === 'string') parsed = JSON.parse(parsed.body); } catch {}
        
        if (res.ok && parsed.ok) {
          // Thành công, reload records từ API
          await fetchPenaltyRecords();
          
          // Reset form và đóng form
          setFormData({
            staffName: '',
            penaltyLevel: '',
            customAmount: '',
            date: new Date().toISOString().split('T')[0],
            reason: ''
          });
          setShowForm(false);
          alert('Đã thêm thành công!');
          setSubmitting(false);
          return;
        } else {
          throw new Error(parsed.error || 'API returned error');
        }
      } catch (apiError) {
        console.error('API POST failed:', apiError);
        // Fall through to localStorage
      }
    }

    // Fallback: dùng localStorage (chỉ cho non-custom records)
    try {
      const newRecord = {
        id: Date.now().toString(),
        staffName: formData.staffName,
        penaltyLevel: formData.penaltyLevel,
        date: formData.date,
        reason: formData.reason.trim()
      };

      const updatedRecords = [...records, newRecord];
      setRecords(updatedRecords);
      
      // Thử lưu vào localStorage, nhưng không bắt buộc
      try {
        localStorage.setItem('penaltyRecords', JSON.stringify(updatedRecords));
      } catch (storageError) {
        if (storageError.name === 'QuotaExceededError') {
          console.warn('LocalStorage quota exceeded, chỉ lưu vào memory');
          // Vẫn tiếp tục, chỉ không lưu localStorage
        } else {
          throw storageError;
        }
      }

      // Reset form và đóng form
      setFormData({
        staffName: '',
        penaltyLevel: '',
        customAmount: '',
        date: new Date().toISOString().split('T')[0],
        reason: ''
      });
      setShowForm(false);

      alert('Đã thêm thành công!');
    } catch (error) {
      console.error('Error submitting record:', error);
      alert('Có lỗi xảy ra khi thêm bản ghi. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };


  if (loading) {
    return (
      <div className="login-page" style={{justifyContent:'center', alignItems:'center'}}>
        <div>Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="login-page" style={{
      justifyContent:'center', 
      alignItems:'center', 
      padding: isMobile ? '16px 24px' : '16px 48px'
    }}>
      <div className="login-container" style={{
        width: '100%', 
        maxWidth: 900, 
        marginTop: 16, 
        marginBottom: 16,
        marginLeft: 'auto',
        marginRight: 'auto'
      }}>
        <h2 className="login-title" style={{color: '#e67e22'}}>Quản lý hình phạt</h2>
        <div className="login-underline" style={{ background: '#e67e22' }}></div>

        <div style={{marginTop:24, display:'flex', justifyContent:'flex-start', gap:12, flexWrap:'wrap'}}>
          <button 
            type="button"
            className="login-button" 
            onClick={() => setShowForm(true)}
            style={{padding:'12px 36px'}}
          >
            Tạo
          </button>
        </div>

        {/* Modal */}
        {showForm && (
          <div 
            style={{
              position:'fixed',
              top:0,
              left:0,
              right:0,
              bottom:0,
              background:'rgba(0,0,0,0.5)',
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              zIndex:1000
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowForm(false);
                setFormData({
                  staffName: '',
                  penaltyLevel: '',
                  customAmount: '',
                  date: new Date().toISOString().split('T')[0],
                  reason: ''
                });
              }
            }}
          >
            <form 
              onSubmit={handleSubmit} 
              onClick={(e) => e.stopPropagation()}
              style={{
                background:'#fff',
                borderRadius:12,
                padding:24,
                boxShadow:'0 8px 32px rgba(0,0,0,0.2)',
                width:'90%',
                maxWidth:500,
                maxHeight:'90vh',
                overflow:'auto'
              }}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h3 style={{margin:0, color:'#1c222f', fontSize:'20px', fontWeight:700}}>Thêm mới</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setFormData({
                      staffName: '',
                      penaltyLevel: '',
                      customAmount: '',
                      date: new Date().toISOString().split('T')[0],
                      reason: ''
                    });
                  }}
                  style={{
                    background:'transparent',
                    border:'none',
                    fontSize:'24px',
                    cursor:'pointer',
                    color:'#6b7a86',
                    padding:0,
                    width:30,
                    height:30,
                    display:'flex',
                    alignItems:'center',
                    justifyContent:'center'
                  }}
                >
                  ×
                </button>
              </div>
              
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                <div>
                  <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>Nhân viên *</label>
                  <select
                    value={formData.staffName}
                    onChange={(e) => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                    required
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e6eef5', borderRadius:8, fontSize:'16px'}}
                  >
                    <option value="">-- Chọn nhân viên --</option>
                    {staffs.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>Mức độ phạt *</label>
                  <select
                    value={formData.penaltyLevel}
                    onChange={(e) => setFormData(prev => ({ ...prev, penaltyLevel: e.target.value, customAmount: e.target.value !== 'custom' ? '' : prev.customAmount }))}
                    required
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e6eef5', borderRadius:8, fontSize:'16px'}}
                  >
                    <option value="">-- Chọn mức độ --</option>
                    {Object.entries(PENALTY_RATES)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([level, rate]) => (
                        <option key={level} value={level}>
                          {level === '0' 
                            ? 'Mức 0 (nhắc nhở)'
                            : `Mức ${level} - ${formatPenaltyRate(rate)}`
                          }
                        </option>
                      ))}
                    <option value="custom">Tùy chỉnh</option>
                  </select>
                </div>
                
                {formData.penaltyLevel === 'custom' && (
                  <div>
                    <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>Giá phạt (VND) *</label>
                    <input
                      type="number"
                      value={formData.customAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, customAmount: e.target.value }))}
                      required
                      min="0"
                      step="0.01"
                      placeholder="Nhập giá phạt..."
                      style={{width:'100%', padding:'10px 12px', border:'1px solid #e6eef5', borderRadius:8, fontSize:'16px'}}
                    />
                  </div>
                )}

                <div>
                  <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>Ngày phạt *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e6eef5', borderRadius:8, fontSize:'16px'}}
                  />
                </div>

                <div>
                  <label style={{display:'block', marginBottom:8, fontWeight:600, color:'#2b4c66'}}>Lý do phạt *</label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    required
                    rows={4}
                    placeholder="Nhập lý do phạt..."
                    style={{width:'100%', padding:'10px 12px', border:'1px solid #e6eef5', borderRadius:8, fontSize:'16px', resize:'vertical', fontFamily:'inherit'}}
                  />
                </div>

                <div style={{display:'flex', gap:12, marginTop:8}}>
                  <button type="submit" className="login-button" style={{flex:1, padding:'12px', minWidth:0, width:'auto'}} disabled={submitting}>
                    {submitting ? 'Đang lưu...' : 'Thêm'}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForm(false);
                      setFormData({
                        staffName: '',
                        penaltyLevel: '',
                        customAmount: '',
                        date: new Date().toISOString().split('T')[0],
                        reason: ''
                      });
                    }}
                    style={{flex:1, padding:'12px', background:'#6b7a86', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, minWidth:0, width:'auto'}}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filter section */}
        {records.length > 0 && (
          <div style={{marginTop:24, marginBottom:16}}>
            <div style={{
              display:'flex', 
              gap:12, 
              flexWrap:'wrap',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'center'
            }}>
              <div style={{
                display:'flex', 
                alignItems:'center', 
                gap:8,
                flexDirection: isMobile ? 'column' : 'row',
                width: isMobile ? '100%' : 'auto'
              }}>
                <label style={{
                  fontWeight:600, 
                  color:'#2b4c66', 
                  fontSize:'14px',
                  marginBottom: isMobile ? 8 : 0,
                  width: isMobile ? '100%' : 'auto'
                }}>Lọc theo chu kỳ lương:</label>
                <div style={{width: isMobile ? '100%' : 'auto', minWidth: 200}}>
                  <select
                    value={filterPeriod}
                    onChange={(e) => setFilterPeriod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      border: '1px solid #e6eef5',
                      borderRadius: 8,
                      fontSize: '14px',
                      background: '#fff',
                      color: '#1c222f',
                      cursor: 'pointer',
                      fontWeight: 400,
                      fontFamily: 'inherit',
                      boxSizing: 'border-box'
                    }}
                  >
                    <option value="">Tất cả chu kỳ</option>
                    {payPeriods.map(period => (
                      <option key={period.key} value={period.key}>
                        {period.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{
                display:'flex', 
                alignItems:'center', 
                gap:8,
                flexDirection: isMobile ? 'column' : 'row',
                width: isMobile ? '100%' : 'auto'
              }}>
                <label style={{
                  fontWeight:600, 
                  color:'#2b4c66', 
                  fontSize:'14px',
                  marginBottom: isMobile ? 8 : 0,
                  width: isMobile ? '100%' : 'auto'
                }}>Lọc theo nhân viên:</label>
                <div style={{width: isMobile ? '100%' : 'auto', minWidth: 200}}>
                  <StaffFilterDropdown 
                    options={staffs} 
                    value={filterStaff} 
                    onChange={setFilterStaff}
                    placeholder="Tất cả nhân viên"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quỹ phạt - Tổng tiền phạt trong tháng */}
        {records.length > 0 && (() => {
          // Tính tổng tiền phạt từ các records đã filter
          const filteredForFund = records.filter(record => {
            // Filter theo nhân viên nếu có
            if (filterStaff && record.staffName !== filterStaff) return false;
            
            // Filter theo chu kỳ lương nếu có
            if (filterPeriod) {
              if (!record.date) return false;
              const [recordYear, recordMonth, recordDay] = record.date.split('-').map(Number);
              let periodMonth = recordMonth;
              let periodYear = recordYear;
              
              // Tính chu kỳ lương của record (từ ngày 16 tháng này đến 15 tháng sau)
              if (recordDay < 16) {
                if (recordMonth === 1) {
                  periodMonth = 12;
                  periodYear = recordYear - 1;
                } else {
                  periodMonth = recordMonth - 1;
                }
              }
              
              const recordPeriodKey = `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
              if (recordPeriodKey !== filterPeriod) return false;
            }
            
            return true;
          });
          
          // Tính tổng tiền phạt
          const totalPenaltyFund = filteredForFund.reduce((sum, record) => {
            if (record.penaltyLevel === 'custom') {
              return sum + (record.customAmount || 0);
            }
            const rate = PENALTY_RATES[record.penaltyLevel] || 0;
            return sum + rate;
          }, 0);
          
          // Lấy tên chu kỳ để hiển thị
          const periodLabel = filterPeriod 
            ? payPeriods.find(p => p.key === filterPeriod)?.label || filterPeriod
            : 'Tất cả chu kỳ';
          
          return (
            <div style={{
              marginTop: 24,
              marginBottom: 20,
              background: 'linear-gradient(135deg, #f5fbff 0%, #e6f2fa 100%)',
              border: '2px solid #d6e9f5',
              borderRadius: 12,
              padding: '18px 22px',
              boxShadow: '0 4px 20px rgba(67, 168, 239, 0.12)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '14px',
                color: '#2b4c66',
                marginBottom: 6,
                fontWeight: 600,
                letterSpacing: '0.3px'
              }}>
                Quỹ phạt {filterPeriod ? `(${periodLabel})` : ''}
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 800,
                color: '#43a8ef',
                textShadow: '0 2px 4px rgba(0,0,0,0.08)',
                letterSpacing: '-0.5px'
              }}>
                {Number(totalPenaltyFund).toLocaleString('vi-VN')} <span style={{fontSize: '20px', fontWeight: 600}}>VND</span>
              </div>
            </div>
          );
        })()}

        {records.length > 0 && (
          <div style={{marginTop:records.length > 0 ? 0 : 24, width:'100%', overflowX:'auto'}}>
            <h3 style={{marginBottom:16, color:'#1c222f', fontSize: isMobile ? '18px' : '20px'}}>Danh sách đã thêm</h3>
            <div className="roster-scroll" style={{width:'100%', overflowX:'auto'}}>
              <table className="roster-table" style={{ 
                borderCollapse: 'separate', 
                borderSpacing:0, 
                borderRadius:10, 
                boxShadow:'0 3px 14px rgba(0,0,0,0.06)', 
                margin:'0 auto', 
                width:'100%',
                minWidth: isMobile ? 600 : 'auto',
                tableLayout: 'fixed'
              }}>
                <thead>
                  <tr style={{background:'#f7fafc'}}>
                    <th style={{
                      padding: isMobile ? '10px 6px' : '12px 8px', 
                      borderBottom:'1px solid #eaeef2', 
                      textAlign:'left',
                      fontSize: isMobile ? '13px' : '14px'
                    }}>Nhân viên</th>
                    <th style={{
                      padding: isMobile ? '10px 6px' : '12px 8px', 
                      borderBottom:'1px solid #eaeef2',
                      fontSize: isMobile ? '13px' : '14px'
                    }}>Mức độ phạt</th>
                    <th style={{
                      padding: isMobile ? '10px 6px' : '12px 8px', 
                      borderBottom:'1px solid #eaeef2',
                      fontSize: isMobile ? '13px' : '14px'
                    }}>Ngày phạt</th>
                    <th style={{
                      padding: isMobile ? '10px 6px' : '12px 8px', 
                      borderBottom:'1px solid #eaeef2',
                      fontSize: isMobile ? '13px' : '14px',
                      maxWidth: isMobile ? '200px' : '300px',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word'
                    }}>Lý do phạt</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Filter records
                    const filtered = records.filter(record => {
                      // Filter theo nhân viên
                      if (filterStaff && record.staffName !== filterStaff) return false;
                      
                      // Filter theo chu kỳ lương
                      if (filterPeriod) {
                        if (!record.date) return false;
                        const [recordYear, recordMonth, recordDay] = record.date.split('-').map(Number);
                        let periodMonth = recordMonth;
                        let periodYear = recordYear;
                        
                        // Tính chu kỳ lương của record (từ ngày 16 tháng này đến 15 tháng sau)
                        if (recordDay < 16) {
                          if (recordMonth === 1) {
                            periodMonth = 12;
                            periodYear = recordYear - 1;
                          } else {
                            periodMonth = recordMonth - 1;
                          }
                        }
                        
                        const recordPeriodKey = `${periodYear}-${String(periodMonth).padStart(2, '0')}`;
                        if (recordPeriodKey !== filterPeriod) return false;
                      }
                      
                      return true;
                    });
                    
                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan={4} style={{padding:20, textAlign:'center', color:'#6b7a86'}}>
                            Không có dữ liệu phù hợp với bộ lọc
                          </td>
                        </tr>
                      );
                    }
                    
                    return filtered.map((record) => {
                      let penaltyRate = 0;
                      let penaltyLabel = '';
                      
                      if (record.penaltyLevel === 'custom') {
                        penaltyRate = record.customAmount || 0;
                        penaltyLabel = `Tùy chỉnh - ${Number(penaltyRate).toLocaleString('vi-VN')} VND`;
                      } else {
                        penaltyRate = PENALTY_RATES[record.penaltyLevel] || 0;
                        penaltyLabel = record.penaltyLevel === '0' 
                          ? 'Mức 0 (nhắc nhở)'
                          : `Mức ${record.penaltyLevel} - ${formatPenaltyRate(penaltyRate)}`;
                      }
                      
                      return (
                        <tr key={record.id} style={{background:'#fff'}}>
                          <td style={{
                            padding: isMobile ? '8px 6px' : '10px 8px', 
                            borderBottom:'1px solid #f1f4f7', 
                            fontWeight:600,
                            fontSize: isMobile ? '13px' : '14px'
                          }}>{record.staffName}</td>
                          <td style={{
                            padding: isMobile ? '8px 6px' : '10px 8px', 
                            borderBottom:'1px solid #f1f4f7', 
                            textAlign:'center', 
                            fontWeight:600,
                            fontSize: isMobile ? '12px' : '14px'
                          }}>{penaltyLabel}</td>
                          <td style={{
                            padding: isMobile ? '8px 6px' : '10px 8px', 
                            borderBottom:'1px solid #f1f4f7',
                            fontSize: isMobile ? '13px' : '14px'
                          }}>{record.date}</td>
                          <td style={{
                            padding: isMobile ? '8px 6px' : '10px 8px', 
                            borderBottom:'1px solid #f1f4f7',
                            fontSize: isMobile ? '13px' : '14px',
                            wordBreak: 'break-word',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            maxWidth: isMobile ? '200px' : '300px'
                          }}>{record.reason}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{marginTop:24, display:'flex', justifyContent:'center', gap:12}}>
          <button className="login-button" onClick={() => navigate('/admin')} style={{padding:'12px 36px'}}>
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
