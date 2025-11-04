import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';

const API_URL = 'https://ke8i236i4i.execute-api.ap-southeast-2.amazonaws.com/prod';
const ROSTER_API = 'https://ud7uaxjwtk.execute-api.ap-southeast-2.amazonaws.com/prod';
const UPDATE_ROSTER_API = 'https://rgnp5b26d5.execute-api.ap-southeast-2.amazonaws.com/prod/';
const STAFF_API = 'https://4j10nn65m6.execute-api.ap-southeast-2.amazonaws.com/prod';
const CHECKLIST_GET_API = 'https://4qwg9i4he0.execute-api.ap-southeast-2.amazonaws.com/prod';
const OVERTIME_GET_API = 'https://enxgjymmjc.execute-api.ap-southeast-2.amazonaws.com/prod';
const OVERTIME_POST_API = 'https://c659yzs9hb.execute-api.ap-southeast-2.amazonaws.com/prod';
const OVERTIME_DELETE_API = 'https://rbyhzws278.execute-api.ap-southeast-2.amazonaws.com/prod';

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
              <label key={name} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 4px', cursor:'pointer' }}>
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
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]); // [{date, weekday, shifts:[{text,type,canCheckOut}], isToday}]

  const handleLogout = () => { localStorage.removeItem('userName'); navigate('/login'); };

  const canCheckInNow = (dateStr, type) => {
    // Shift start times: sang 09:30, trua 13:30, toi 18:30 (24h)
    const startMap = { sang: { h:9, m:30 }, trua: { h:13, m:30 }, toi: { h:18, m:30 } };
    const tzNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const [y, mo, da] = dateStr.split('-').map(Number);
    const start = new Date(y, mo - 1, da, (startMap[type]||{h:0}).h, (startMap[type]||{m:0}).m, 0);
    return tzNow.getFullYear() === y && tzNow.getMonth() === (mo - 1) && tzNow.getDate() === da && tzNow.getTime() >= start.getTime();
  };

  const canCheckOutNow = (dateStr, type) => {
    // Shift end times: sang 13:30, trua 18:30, toi 22:30 (24h)
    const endMap = { sang: { h:13, m:30 }, trua: { h:18, m:30 }, toi: { h:22, m:30 } };
    const tzNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
    const [y, mo, da] = dateStr.split('-').map(Number);
    const end = new Date(y, mo - 1, da, (endMap[type]||{h:0}).h, (endMap[type]||{m:0}).m, 0);
    return tzNow.getFullYear() === y && tzNow.getMonth() === (mo - 1) && tzNow.getDate() === da && tzNow.getTime() >= end.getTime();
  };

  const [checkinStatus, setCheckinStatus] = useState(() => {
    try { return JSON.parse(localStorage.getItem('checkinStatus') || '{}'); } catch { return {}; }
  });

  const handleCheckIn = (dateStr, type) => {
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
          // Cho phép hiển thị nút bắt đầu ca cho TẤT CẢ các ca để test (bỏ điều kiện thời gian và ngày)
          const canCheckIn = true; // Hiển thị nút cho tất cả ca để test
          const canCheckOut = true; // Cho phép kết ca cho tất cả
          const hasCheckedIn = !!checkinStatus[key];
          const hasCheckedOut = !!checkinStatus[key + '_done'];
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
  }, [userName, checkinStatus]);

  React.useEffect(() => {
    const el = document.getElementById('today-card');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [rows.length]);

  const chipStyle = (type) => {
    const colors = { sang: '#e9f8ef', trua: '#fff5e5', toi: '#f3eaff' };
    const text = { sang: '#1e7e34', trua: '#c17d00', toi: '#6f42c1' };
    return { background: colors[type] || '#eef5ff', color: text[type] || '#1c222f', padding: '6px 10px', borderRadius: 999, fontWeight: 600, fontSize: 14 };
  };

  return (
    <div className="login-page" style={{justifyContent: 'center', alignItems: 'flex-start'}}>
      <div className="login-container" style={{width: 750, maxWidth: '95vw', marginTop: 40, marginBottom: 32, alignItems:'stretch'}}>
        <h2 className="login-title" style={{color: '#2ecc71', alignSelf:'center'}}>Nhân Viên</h2>
        <div className="login-underline" style={{ background: '#2ecc71', alignSelf:'center' }}></div>
        <div style={{textAlign: 'center', fontSize: 20, marginTop: 10, marginBottom: 16}}>Xin chào {userName ? userName : 'bạn'}!</div>

        <h3 style={{alignSelf:'center', margin:'12px 0 14px'}}>Ca làm trong chu kỳ lương hiện tại</h3>
        {loading ? (
          <div style={{textAlign:'center', width:'100%'}}>Đang tải...</div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:12, width:'100%', maxWidth: 720, margin:'0 auto 12px'}}>
            {rows.length === 0 ? (
              <div style={{textAlign:'center', color:'#6b7a86'}}>Không có ca trong chu kỳ này</div>
            ) : rows.map((r) => (
              <div id={r.isToday ? 'today-card' : undefined} key={r.date} style={{
                background:r.isToday ? '#f0fbff' : '#fff', border:'1px solid #e9f2f8', borderRadius:14,
                boxShadow:'0 6px 22px rgba(0,0,0,0.06)', padding:'12px 14px',
                width:'100%', margin:'0 auto'
              }}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                  <div style={{fontWeight:700, color:'#2b4c66'}}>{r.weekday}</div>
                  <div style={{opacity:0.8}}>{r.date}</div>
                </div>
                <div style={{display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
                  {r.shifts.map((s, idx) => (
                    <span key={idx} style={chipStyle(s.type)}>{s.text}</span>
                  ))}
                  {r.shifts.map((s, idx) => {
                    if (s.hasCheckedOut) {
                      return (
                        <span key={`done-${idx}`} style={{fontWeight:600, color:'#2ecc71', fontSize:'0.9em'}}>
                          ✓ Đã kết ca
                        </span>
                      );
                    } else if (s.canCheckIn || s.hasCheckedIn) {
                      // Hiển thị nút để vào checklist (có thể đã bắt đầu ca hoặc chưa)
                      return (
                        <button key={`btn-in-${idx}`} className="login-button" style={{width:'auto', padding:'8px 12px', background: s.hasCheckedIn ? '#43a8ef' : '#43a8ef'}} onClick={()=>handleCheckIn(r.date, s.type)}>
                          {s.hasCheckedIn ? 'Vào checklist' : `Bắt đầu ca (${s.type === 'sang' ? 'Ca sáng' : s.type === 'trua' ? 'Ca trưa' : 'Ca tối'})`}
                        </button>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <button style={{marginTop: 24, alignSelf:'center'}} className="login-button" onClick={handleLogout}>Đăng xuất</button>
      </div>
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
  const [staffSalary, setStaffSalary] = useState({});
  // Checklist state
  const [ckFrom, setCkFrom] = useState('');
  const [ckTo, setCkTo] = useState('');
  const [ckUser, setCkUser] = useState('');
  const [ckLoading, setCkLoading] = useState(false);
  const [ckItems, setCkItems] = useState([]);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
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
        // Tính chu kỳ lương: từ ngày 15 tháng này đến 14 tháng sau
        const [y, m, d] = record.date.split('-').map(Number);
        let periodMonth = m;
        let periodYear = y;
        if (d < 15) {
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
  
  const [overtimeData, setOvertimeData] = useState({});
  const [overtimeRecords, setOvertimeRecords] = useState([]); // Lưu records để dùng cho rebuild
  
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
          // Fallback to old overtimeData format
          const savedOld = localStorage.getItem('overtimeData');
          if (savedOld) {
            setOvertimeData(JSON.parse(savedOld));
          }
        }
      } catch (e) {
        console.error('Error loading overtime data:', e);
      }
    })();
  }, []);

  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

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

  // Xây dựng dữ liệu cho chu kỳ lương: từ ngày 15 tháng hiện tại đến 15 tháng sau
  const rebuildMonthData = React.useCallback(() => {
    const byDate = new Map();
    roster.forEach(r => { byDate.set(r.date, r); });

    const start = new Date(year, month, 15); // inclusive
    const end = new Date(year, month + 1, 15); // exclusive

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
      // Vẫn lưu vào localStorage để tương thích ngược
      localStorage.setItem('overtimeData', JSON.stringify(rebuilt));
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
    const end = new Date(year, month + 1, 15);
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
  const computeTotals = (rows) => {
    const hoursByShift = { sang: 4, trua: 5, toi: 4 };
    const rateSingle = 20000; // VND per hour per person when only 1 person in shift
    const rateDouble = 20000; // VND per hour per person when >=2 people in shift

    const totalHours = new Map(); // name -> hours
    const singleHours = new Map(); // name -> single shift hours
    const doubleHours = new Map(); // name -> double shift hours
    const moneyMap = new Map(); // name -> money

    rows.forEach(r => {
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
    });

    const arr = Array.from(totalHours.entries()).map(([name, hours]) => {
      const sh = singleHours.get(name) || 0;
      const dh = doubleHours.get(name) || 0;
      // Mamaboo là chủ nên không tính lương (luôn = 0)
      const money = (name.toLowerCase() === 'mamaboo') ? 0 : (moneyMap.get(name) || 0);
      return [name, hours, sh, dh, money];
    });
    return arr.sort((a,b)=> b[4]-a[4]);
  };

  return (
    <div className="login-page" style={{justifyContent: 'center', alignItems: 'flex-start'}}>
      <div className="login-container" style={{width: 750, maxWidth: '95vw', marginTop: 24}}>
        <h2 className="login-title" style={{color: '#e67e22'}}>Quản trị viên</h2>
        <div className="login-underline" style={{ background: '#e67e22' }}></div>
        <div style={{textAlign:'center', fontSize:20, margin:'12px 0'}}>Xin chào {userName || 'Admin'}!</div>

        <div style={{display:'flex', justifyContent:'center', gap:12, marginBottom:16}}>
          <button className="login-button" onClick={() => navigate('/checklist-report')} style={{ margin: '0 24px', padding: '12px 36px' }}>
            Xem báo cáo checklist
          </button>
          <button className="login-button" onClick={() => navigate('/overtime-management')} style={{ margin: '0 24px', padding: '12px 36px' }}>
            Quản lý tăng ca/đi trễ
          </button>
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', margin:'4px 0 12px'}}>
          <button className="login-button" style={{width:120}} onClick={prevMonth}>{'← Tháng trước'}</button>
          <div style={{fontWeight:700, color:'#1c222f'}}>{monthLabel}</div>
          <button className="login-button" style={{width:120}} onClick={nextMonth}>{'Tháng sau →'}</button>
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
                  {(editMode ? monthEdit : monthData).map((row, idx) => (
                    <tr key={idx} style={{background: idx%2===0 ? '#ffffff' : '#fbfdff'}}>
                      <td style={{borderBottom:'1px solid #eef5fa', padding:'8px 8px', fontWeight:600, color:'#2b4c66'}}>{row.date}</td>
                      <td style={{borderBottom:'1px solid #eef5fa', padding:'8px 8px', color:'#6b7a86'}}>{getWeekdayVi(row.date)}</td>
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
                  ))}
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
                        {computeTotals(editMode ? monthEdit : monthData).map(([name, total, singleH, doubleH, money]) => {
                          const staffData = currentOvertimeData[monthKey]?.[name] || { overtime: 0, lateCount: 0 };
                          // Mamaboo là chủ nên không tính lương (luôn = 0)
                          const isMamaboo = name.toLowerCase() === 'mamaboo';
                          const totalSalary = isMamaboo ? 0 : (() => {
                            // Tính tổng lương: lương ca làm + tăng ca - đi trễ (đều tính 20000 VND/giờ)
                            const overtimePay = (staffData.overtime || 0) * ratePerHour;
                            const latePay = (staffData.lateCount || 0) * ratePerHour;
                            return money + overtimePay - latePay;
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
      { id: 'setup bàn tiếp khách, quầy thu ngân', label: 'setup bàn tiếp khách, quầy thu ngân' },
      { id: 'Quét và lau sàn', label: 'Quét và lau sàn' },
      { id: 'Kiểm tra nhà vệ sinh', label: 'Kiểm tra nhà vệ sinh' },
      { id: 'set up khu vực cashier', label: 'set up khu vực cashier' },
      { id: 'Chuẩn bị nguyên liệu cho ca sáng', label: 'Chuẩn bị nguyên liệu cho ca sáng' }
    ],
    trua: [
      { id: 'stock_mid', label: 'Bổ sung nguyên liệu giữa ca' },
      { id: 'wc_mid', label: 'Vệ sinh nhà vệ sinh giữa ca' },
      { id: 'bar_mid', label: 'Vệ sinh quầy Barista giữa ca' },
      { id: 'check_orders', label: 'Kiểm tra đơn hàng và tồn kho' }
    ],
    toi: [
      { id: 'Đổ rác', label: 'Đổ rác' },
      { id: 'Dọn bàn ghé', label: 'Dọn bàn ghé' },
      { id: 'Chà bồn cầu', label: 'Chà bồn cầu' },
      { id: 'Chà lababo', label: 'Chà lababo' },
      { id: 'Cắm sạc loa', label: 'Cắm sạc loa' },
      { id: 'Dắt xe', label: 'Dắt xe' },
      { id: 'Giặt cây lau nhà', label: 'Giặt cây lau nhà' },
      { id: 'Kiểm tra két', label: 'Kiểm tra két' },
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
        image: saved.tasks?.[t.id]?.image || ''
      }));
    } catch {
      return defaultTasks.map(t => ({ ...t, done: false, image: '' }));
    }
  });

  const saveState = (nextTasks) => {
    try {
      const payload = { tasks: {} };
      nextTasks.forEach(t => { payload.tasks[t.id] = { done: t.done, image: t.image }; });
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

  // Helper function to resize and compress image
  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with compression
          const compressed = canvas.toDataURL('image/jpeg', quality);
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
    
    console.log(`Task ${id}: Uploading image, file name:`, file.name, 'size:', file.size, 'type:', file.type);
    
    try {
      // Compress image before uploading
      console.log(`Task ${id}: Compressing image...`);
      const compressedImage = await compressImage(file, 800, 800, 0.75);
      console.log(`Task ${id}: Image compressed, original size:`, file.size, 'compressed length:', compressedImage.length);
      
      if (compressedImage.length > 300000) { // ~300KB base64 (~200KB raw)
        console.warn(`Task ${id}: Compressed image still large (${compressedImage.length} chars). Compressing further...`);
        // Compress more aggressively
        const moreCompressed = await compressImage(file, 600, 600, 0.6);
        console.log(`Task ${id}: Re-compressed length:`, moreCompressed.length);
        
        if (moreCompressed.length > 300000) {
          alert('Ảnh quá lớn! Vui lòng chọn ảnh nhỏ hơn.');
          return;
        }
        
        const next = tasks.map(t => t.id === id ? { ...t, image: moreCompressed } : t);
        setTasks(next);
        // Don't save to localStorage to avoid quota exceeded
        // saveState(next); 
        
        console.log(`Task ${id}: Image compressed and saved to state`);
      } else {
        const next = tasks.map(t => t.id === id ? { ...t, image: compressedImage } : t);
        setTasks(next);
        // Try to save to localStorage, but don't fail if quota exceeded
        try {
          saveState(next);
        } catch (e) {
          console.warn(`Task ${id}: Could not save to localStorage (quota exceeded), but image is in state`);
        }
        
        console.log(`Task ${id}: Image saved successfully, verified length:`, compressedImage.length);
      }
    } catch (error) {
      console.error(`Task ${id}: Error processing image:`, error);
      alert('Lỗi khi xử lý ảnh!');
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
    
    // Chuyển đổi tasks sang format cho API
    const tasksMap = tasks.reduce((acc, t) => {
      const img = t.image || '';
      
      // Validate image
      if (img && img.length < 100) {
        console.warn(`Task ${t.id}: Image too short (${img.length} chars), treating as empty`);
        acc[t.id] = { done: !!t.done, imageUrl: '' };
      } else {
        acc[t.id] = { done: !!t.done, imageUrl: img };
      }
      
      // Debug log để kiểm tra ảnh có được lưu không
      if (img && img.length > 100) {
        console.log(`✓ Task ${t.id} có ảnh khi lưu, độ dài:`, img.length, 'Preview:', img.substring(0, 50) + '...');
      } else {
        console.log(`✗ Task ${t.id} KHÔNG có ảnh khi lưu (length: ${img.length})`);
      }
      return acc;
    }, {});
    
    console.log('Tasks map trước khi gửi:', Object.keys(tasksMap).map(k => ({
      taskId: k,
      done: tasksMap[k].done,
      hasImage: !!(tasksMap[k].imageUrl && tasksMap[k].imageUrl.length > 100),
      imageLength: tasksMap[k].imageUrl ? tasksMap[k].imageUrl.length : 0
    })));
    
    // Count tasks with valid images
    const tasksWithImages = Object.values(tasksMap).filter(t => t.imageUrl && t.imageUrl.length > 100).length;
    console.log(`Tổng số tasks: ${tasks.length}, Tasks có ảnh hợp lệ: ${tasksWithImages}`);
    
    // Kiểm tra xem có task nào chưa hoàn thành không (không bắt buộc)
    const allDone = tasks.every(t => t.done);
    if (!allDone && !window.confirm('Một số task chưa hoàn thành. Vẫn kết ca và lưu?')) {
      return;
    }

    // Gọi API để lưu checklist
    const CHECKLIST_API = 'https://5q97j7q6ce.execute-api.ap-southeast-2.amazonaws.com/prod/';
    const payload = { 
      user: userName, 
      date: dateStr, 
      shift, 
      tasks: tasksMap, 
      checklistType: 'ket_ca' // Lưu với type 'ket_ca' khi bấm "Kết ca"
    };
    
    // Log payload size (truncate for readability)
    const payloadStr = JSON.stringify(payload);
    console.log('Payload size:', payloadStr.length, 'bytes');
    console.log('Payload preview (first 500 chars):', payloadStr.substring(0, 500));
    
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
      const tasksWithImagesCount = Object.keys(tasksMap).filter(k => {
        const t = tasksMap[k];
        return t.imageUrl && t.imageUrl.length > 100;
      }).length;
      console.log('Payload tasks có ảnh:', tasksWithImagesCount, '/', Object.keys(tasksMap).length);
      
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
            for (const [taskId, taskData] of Object.entries(savedTasks)) {
              if (taskData && typeof taskData === 'object') {
                const imgUrl = taskData.imageUrl || taskData.image || '';
                console.log(`Verify task ${taskId}: imageUrl length=${imgUrl.length}, type=${typeof imgUrl}`);
                if (imgUrl && imgUrl.length > 100) {
                  verifiedImages++;
                  console.log(`✅ Verified task ${taskId}: image saved, length=${imgUrl.length}`);
                } else {
                  console.warn(`⚠ Task ${taskId}: imageUrl empty or too short (length=${imgUrl.length})`);
                  console.warn(`  Task data:`, taskData);
                }
              } else {
                console.warn(`⚠ Task ${taskId}: taskData is not an object, type=${typeof taskData}`, taskData);
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
      
      // Đánh dấu đã bắt đầu ca và đã kết ca
      const checkKey = `${userName}__${dateStr}__${shift}`;
      const status = JSON.parse(localStorage.getItem('checkinStatus') || '{}');
      status[checkKey] = { startedAt: new Date().toISOString() };
      status[checkKey + '_done'] = { doneAt: new Date().toISOString() };
      localStorage.setItem('checkinStatus', JSON.stringify(status));
      
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
                <div style={{display:'flex', alignItems:'center', gap:10}}>
                  <label style={{cursor:'pointer', padding:'6px 12px', background:'#43a8ef', color:'#fff', borderRadius:6, fontSize:'0.9em'}}>
                    Upload ảnh
                    <input type="file" accept="image/*" onChange={(e)=>onUpload(t.id, e.target.files?.[0])} style={{display:'none'}} />
                  </label>
                </div>
              </div>
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
    </div>
  );
}

// Trang báo cáo checklist cho Admin
function ChecklistReport() {
  const navigate = useNavigate();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [staffs, setStaffs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const fetchChecklist = async () => {
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
        console.log('First item sample:', {
          user: fetched[0].user,
          date: fetched[0].date,
          shift: fetched[0].shift,
          tasksKeys: fetched[0].tasks ? Object.keys(fetched[0].tasks) : [],
          firstTaskSample: fetched[0].tasks ? (() => {
            const firstTaskKey = Object.keys(fetched[0].tasks)[0];
            const firstTask = fetched[0].tasks[firstTaskKey];
            return {
              taskId: firstTaskKey,
              done: firstTask?.done,
              hasImageUrl: !!(firstTask?.imageUrl),
              imageUrlLength: firstTask?.imageUrl ? String(firstTask.imageUrl).length : 0
            };
          })() : null
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
  };

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

    // Auto-fetch với current pay period
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const day = today.getDate();
    
    let fromY = y, fromM = m, fromD = 15;
    if (day < 15) {
      fromM = m - 1;
      if (fromM < 0) {
        fromM = 11;
        fromY = y - 1;
      }
    }
    
    const toY = fromM === 11 ? fromY + 1 : fromY;
    const toM = (fromM + 1) % 12;
    
    const pad = (n) => n.toString().padStart(2, '0');
    setFromDate(`${fromY}-${pad(fromM + 1)}-15`);
    setToDate(`${toY}-${pad(toM + 1)}-14`);
  }, []);

  React.useEffect(() => {
    if (fromDate && toDate) {
      fetchChecklist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount - fetch initial data

  // Auto-fetch khi filterUser thay đổi (nếu đã có date range)
  React.useEffect(() => {
    if (fromDate && toDate) {
      fetchChecklist();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterUser]); // Auto-fetch khi filter user thay đổi

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
          <input type="date" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} style={{padding:'6px 8px', border:'1px solid #e6eef5', borderRadius:8}} />
          <span>đến</span>
          <input type="date" value={toDate} onChange={(e)=>setToDate(e.target.value)} style={{padding:'6px 8px', border:'1px solid #e6eef5', borderRadius:8}} />
          <StaffFilterDropdown 
            options={staffs} 
            value={filterUser} 
            onChange={setFilterUser}
            placeholder="Lọc theo nhân viên"
          />
          <button className="login-button" onClick={fetchChecklist} disabled={loading}>
            {loading ? 'Đang tải...' : 'Tải dữ liệu'}
          </button>
          <button className="login-button" onClick={() => navigate('/admin')} style={{background:'#6b7a86'}}>
            Quay lại
          </button>
        </div>

        <div className="roster-scroll" style={{marginTop:10}}>
          <table className="roster-table" style={{ borderCollapse: 'separate', borderSpacing:0, borderRadius:10, margin:'0 auto' }}>
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
              {items.length === 0 ? (
                <tr><td colSpan={7} style={{padding:10, textAlign:'center', color:'#6b7a86'}}>
                  {loading ? 'Đang tải...' : 'Chưa có dữ liệu'}
                </td></tr>
              ) : items.map((it, i) => {
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
              })}
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
                    padding:'8px 12px',
                    border:'1px solid #e6eef5',
                    borderRadius:8,
                    fontSize:'14px',
                    minWidth:140,
                    background:'#fff',
                    cursor:'pointer'
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
          <div style={{marginTop:records.length > 0 ? 0 : 24}}>
            <h3 style={{marginBottom:16, color:'#1c222f'}}>Danh sách đã thêm</h3>
            <div className="roster-scroll">
              <table className="roster-table" style={{ borderCollapse: 'separate', borderSpacing:0, borderRadius:10, boxShadow:'0 3px 14px rgba(0,0,0,0.06)', margin:'0 auto', width:'100%' }}>
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
                      if (filterStaff && record.staffName !== filterStaff) return false;
                      if (filterType && record.type !== filterType) return false;
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
      </Routes>
    </Router>
  );
}

export default App;
