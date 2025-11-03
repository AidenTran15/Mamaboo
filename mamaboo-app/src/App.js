import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';

const API_URL = 'https://ke8i236i4i.execute-api.ap-southeast-2.amazonaws.com/prod';
const ROSTER_API = 'https://ud7uaxjwtk.execute-api.ap-southeast-2.amazonaws.com/prod';
const UPDATE_ROSTER_API = 'https://rgnp5b26d5.execute-api.ap-southeast-2.amazonaws.com/prod/';
const STAFF_API = 'https://4j10nn65m6.execute-api.ap-southeast-2.amazonaws.com/prod';
const CHECKLIST_GET_API = 'https://4qwg9i4he0.execute-api.ap-southeast-2.amazonaws.com/prod';

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
          // Cho phép hiển thị nút bắt đầu ca nếu là ngày hôm nay (để test dễ hơn)
          const canCheckIn = isToday; // Bỏ điều kiện thời gian để test dễ hơn
          const canCheckOut = isToday && (canCheckOutNow(ds, type) || checkinStatus[key]); // Có thể kết ca nếu đã check-in hoặc đến giờ
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

    const arr = [];
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
      const base = byDate.get(dateStr) || { date: dateStr, sang: [], trua: [], toi: [] };
      arr.push({
        date: dateStr,
        sang: Array.isArray(base.sang) ? base.sang : (base.sang ? [base.sang] : []),
        trua: Array.isArray(base.trua) ? base.trua : (base.trua ? [base.trua] : []),
        toi: Array.isArray(base.toi) ? base.toi : (base.toi ? [base.toi] : []),
      });
    }
    setMonthData(arr);
    setMonthEdit(JSON.parse(JSON.stringify(arr)));
  }, [roster, year, month]);

  React.useEffect(() => { rebuildMonthData(); }, [rebuildMonthData]);

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
    for (let i=0;i<monthEdit.length;i++) {
      const before = monthData[i];
      const after = monthEdit[i];
      if (!before || !after) continue;
      for (const ca of ['sang','trua','toi']) {
        const a = JSON.stringify(before[ca]||[]);
        const b = JSON.stringify(after[ca]||[]);
        if (a !== b) {
          try {
            await fetch(UPDATE_ROSTER_API, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: after.date, ca, nhan_vien: after[ca] || [] })
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
    const rateSingle = 25000; // VND per hour per person when only 1 person in shift
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
          totalHours.set(name, (totalHours.get(name) || 0) + hours);
          if (isSingle) {
            singleHours.set(name, (singleHours.get(name) || 0) + hours);
          } else {
            doubleHours.set(name, (doubleHours.get(name) || 0) + hours);
          }
          moneyMap.set(name, (moneyMap.get(name) || 0) + hours * rate);
        });
      });
    });

    const arr = Array.from(totalHours.entries()).map(([name, hours]) => {
      const sh = singleHours.get(name) || 0;
      const dh = doubleHours.get(name) || 0;
      const money = moneyMap.get(name) || 0;
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
          <button className="login-button" onClick={() => navigate('/checklist-report')}>
            📋 Xem báo cáo checklist
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
                  </tr>
                </thead>
                <tbody>
                  {computeTotals(editMode ? monthEdit : monthData).map(([name, total, singleH, doubleH, money]) => (
                    <tr key={name} style={{background:'#fff'}}>
                      <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7'}}>{name}</td>
                      <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'center', fontWeight:600}}>{total}</td>
                      <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'center'}}>{singleH}</td>
                      <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'center'}}>{doubleH}</td>
                      <td style={{padding:'8px 8px', borderBottom:'1px solid #f1f4f7', textAlign:'right', fontWeight:700}}>{Number(money).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Checklist viewer */}
            <h3 style={{textAlign:'left', margin:'22px 0 8px'}}>Checklist đã lưu</h3>
            <div style={{display:'flex', gap:8, flexWrap:'wrap', alignItems:'center'}}>
              <input type="date" value={ckFrom} onChange={(e)=>setCkFrom(e.target.value)} />
              <span>đến</span>
              <input type="date" value={ckTo} onChange={(e)=>setCkTo(e.target.value)} />
              <input placeholder="Lọc theo nhân viên" value={ckUser} onChange={(e)=>setCkUser(e.target.value)} style={{padding:'6px 8px', border:'1px solid #e6eef5', borderRadius:8}} />
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
                    <th>Loại</th>
                    <th>Nhân viên</th>
                    <th>Số task hoàn thành</th>
                  </tr>
                </thead>
                <tbody>
                  {ckItems.length === 0 ? (
                    <tr><td colSpan={5} style={{padding:10, textAlign:'center', color:'#6b7a86'}}>Chưa có dữ liệu</td></tr>
                  ) : ckItems.map((it, i) => {
                    const tasks = it.tasks || {};
                    const doneCount = Object.values(tasks).filter((t)=>t && (t.done === true || t.done === 'true')).length;
                    const type = it.checklistType || (String(it.date_shift||'').endsWith('#ket_ca') ? 'ket_ca' : 'bat_dau');
                    return (
                      <tr key={i}>
                        <td>{it.date}</td>
                        <td>{it.shift}</td>
                        <td>{type}</td>
                        <td>{it.user}</td>
                        <td>{doneCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
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
      { id: 'open_bar', label: 'Mở máy/chuẩn bị quầy Barista' },
      { id: 'clean_tables', label: 'Vệ sinh bàn ghế khu vực khách' },
      { id: 'fridge_morning', label: 'Kiểm tra & vệ sinh tủ lạnh sáng' },
      { id: 'cash_open', label: 'Kiểm két đầu ca' },
      { id: 'prep_items', label: 'Chuẩn bị nguyên liệu cho ca sáng' }
    ],
    trua: [
      { id: 'stock_mid', label: 'Bổ sung nguyên liệu giữa ca' },
      { id: 'wc_mid', label: 'Vệ sinh nhà vệ sinh giữa ca' },
      { id: 'bar_mid', label: 'Vệ sinh quầy Barista giữa ca' },
      { id: 'check_orders', label: 'Kiểm tra đơn hàng và tồn kho' }
    ],
    toi: [
      { id: 'prep_evening', label: 'Chuẩn bị cho ca tối' },
      { id: 'clean_area', label: 'Vệ sinh khu vực làm việc' },
      { id: 'check_supplies', label: 'Kiểm tra nguyên liệu còn lại' }
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
    const payload = { tasks: {} };
    nextTasks.forEach(t => { payload.tasks[t.id] = { done: t.done, image: t.image }; });
    localStorage.setItem(storageKey, JSON.stringify(payload));
  };

  const toggleTask = (id) => {
    const next = tasks.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTasks(next);
    saveState(next);
  };

  const onUpload = (id, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = tasks.map(t => t.id === id ? { ...t, image: reader.result } : t);
      setTasks(next);
      saveState(next);
    };
    reader.readAsDataURL(file);
  };

  const handleEndShift = async () => {
    // Chuyển đổi tasks sang format cho API
    const tasksMap = tasks.reduce((acc, t) => {
      const img = t.image || '';
      acc[t.id] = { done: !!t.done, imageUrl: img };
      return acc;
    }, {});
    
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
      checklistType: 'bat_dau' // Sử dụng 'bat_dau' cho checklist duy nhất
    };
    
    try {
      const resp = await fetch(CHECKLIST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
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
      
      // Đánh dấu đã bắt đầu ca và đã kết ca
      const checkKey = `${userName}__${dateStr}__${shift}`;
      const status = JSON.parse(localStorage.getItem('checkinStatus') || '{}');
      status[checkKey] = { startedAt: new Date().toISOString() };
      status[checkKey + '_done'] = { doneAt: new Date().toISOString() };
      localStorage.setItem('checkinStatus', JSON.stringify(status));
      
      alert('Đã kết ca và lưu checklist!');
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
                    📷 Upload ảnh
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
              padding:'12px 16px',
              fontSize:'1em',
              fontWeight:600,
              cursor:'pointer',
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              justifyContent:'center',
              minHeight:80,
              width:100,
              boxShadow:'0 4px 12px rgba(0,0,0,0.1)',
              transition:'background 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#d35400'}
            onMouseLeave={(e) => e.target.style.background = '#e67e22'}
          >
            <span>Kết</span>
            <span>ca</span>
            <span>và</span>
            <span>lưu</span>
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
  const [filterType, setFilterType] = useState('ket_ca'); // 'all', 'bat_dau', 'ket_ca' - default chỉ kết ca
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
      
      const res = await fetch(url.toString());
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); if (typeof data.body === 'string') data = JSON.parse(data.body); } catch {}
      let fetched = Array.isArray(data.items) ? data.items : [];
      
      // Filter by type
      if (filterType !== 'all') {
        fetched = fetched.filter(it => {
          const type = it.checklistType || (String(it.date_shift||'').endsWith('#ket_ca') ? 'ket_ca' : 'bat_dau');
          return type === filterType;
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

  React.useEffect(() => {
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
          <input placeholder="Lọc theo nhân viên" value={filterUser} onChange={(e)=>setFilterUser(e.target.value)} style={{padding:'6px 8px', border:'1px solid #e6eef5', borderRadius:8}} />
          <select value={filterType} onChange={(e)=>setFilterType(e.target.value)} style={{padding:'6px 8px', border:'1px solid #e6eef5', borderRadius:8}}>
            <option value="ket_ca">Kết ca</option>
            <option value="all">Tất cả</option>
            <option value="bat_dau">Bắt đầu ca</option>
          </select>
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
                <th>Loại</th>
                <th>Nhân viên</th>
                <th>Task hoàn thành</th>
                <th>Ảnh</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} style={{padding:10, textAlign:'center', color:'#6b7a86'}}>
                  {loading ? 'Đang tải...' : 'Chưa có dữ liệu'}
                </td></tr>
              ) : items.map((it, i) => {
                const tasks = it.tasks || {};
                const taskList = Object.entries(tasks);
                const doneCount = taskList.filter(([_, t]) => t && (t.done === true || t.done === 'true')).length;
                const totalCount = taskList.length;
                const type = it.checklistType || (String(it.date_shift||'').endsWith('#ket_ca') ? 'ket_ca' : 'bat_dau');
                const typeLabel = type === 'ket_ca' ? 'Kết ca' : 'Bắt đầu ca';
                const typeColor = type === 'ket_ca' ? '#e67e22' : '#43a8ef';
                
                // Debug: log để kiểm tra dữ liệu
                if (i === 0) {
                  console.log('Sample checklist item:', it);
                  console.log('Tasks:', tasks);
                  console.log('Task list:', taskList);
                }
                
                // Lấy tất cả ảnh từ tasks - kiểm tra cả imageUrl và image field
                const images = taskList
                  .map(([taskId, t]) => {
                    if (!t) return null;
                    // Ưu tiên imageUrl, nếu không có thì lấy image
                    const imgUrl = (t.imageUrl && t.imageUrl.trim()) || (t.image && t.image.trim());
                    if (imgUrl && imgUrl.length > 10 && imgUrl !== 'data:image/jpeg;base64,') { 
                      // Có ảnh (có thể là URL hoặc base64, nhưng phải có dữ liệu thực)
                      return { taskId, url: imgUrl };
                    }
                    return null;
                  })
                  .filter(Boolean);
                
  return (
                  <tr key={i} style={{background: i%2===0 ? '#ffffff' : '#fbfdff'}}>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa'}}>{it.date}</td>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa', color:'#6b7a86'}}>{getWeekdayVi(it.date)}</td>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa'}}>{getShiftName(it.shift)}</td>
                    <td style={{padding:'8px 8px', borderBottom:'1px solid #eef5fa'}}>
                      <span style={{color:typeColor, fontWeight:600}}>{typeLabel}</span>
                    </td>
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
                        <img 
                          src={images[0].url} 
                          alt={images[0].taskId}
                          style={{
                            width:50, height:50, objectFit:'cover', borderRadius:6,
                            border:'1px solid #e6eef5', cursor:'pointer'
                          }}
                          onClick={() => setSelectedItem(it)}
                          title="Click để xem chi tiết"
                        />
                      ) : (
                        <div style={{display:'flex', gap:4, alignItems:'center'}}>
                          <img 
                            src={images[0].url} 
                            alt={images[0].taskId}
                            style={{
                              width:50, height:50, objectFit:'cover', borderRadius:6,
                              border:'1px solid #e6eef5', cursor:'pointer'
                            }}
                            onClick={() => setSelectedItem(it)}
                            title="Click để xem tất cả ảnh"
                          />
                          {images.length > 1 && (
                            <span style={{
                              fontSize:'0.75em', color:'#6b7a86', fontWeight:600,
                              background:'#f0f5f9', padding:'2px 6px', borderRadius:4
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
                        style={{padding:'4px 8px', fontSize:'0.85em'}}
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
                <strong>Loại:</strong> {selectedItem.checklistType === 'ket_ca' ? 'Kết ca' : 'Bắt đầu ca'}<br/>
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
                      {(task.imageUrl || task.image) && (
                        <div style={{marginTop:8}}>
                          <img src={task.imageUrl || task.image} alt={taskId} style={{
                            maxWidth:'100%', borderRadius:8, border:'1px solid #eef5fa'
                          }} />
                        </div>
                      )}
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
      </Routes>
    </Router>
  );
}

export default App;
