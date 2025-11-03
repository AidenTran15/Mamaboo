import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';

const API_URL = 'https://ke8i236i4i.execute-api.ap-southeast-2.amazonaws.com/prod';
const ROSTER_API = 'https://ud7uaxjwtk.execute-api.ap-southeast-2.amazonaws.com/prod';
const UPDATE_ROSTER_API = 'https://rgnp5b26d5.execute-api.ap-southeast-2.amazonaws.com/prod/';
const STAFF_API = 'https://4j10nn65m6.execute-api.ap-southeast-2.amazonaws.com/prod';

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
  const handleLogout = () => { localStorage.removeItem('userName'); navigate('/login'); };
  return (
    <div className="login-page" style={{justifyContent: 'flex-start'}}>
      <div className="login-container">
        <h2 className="login-title" style={{color: '#2ecc71'}}>Nhân Viên</h2>
        <div className="login-underline" style={{ background: '#2ecc71' }}></div>
        <div style={{textAlign: 'center', fontSize: 20, marginTop: 30, marginBottom: 20}}>Xin chào {userName ? userName : 'bạn'}!</div>
        <button style={{marginTop: 32}} className="login-button" onClick={handleLogout}>Đăng xuất</button>
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
        if (!isMounted) return;
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
    const fmtLabel = (d) => `${d.toLocaleDateString('vi-VN', { day:'2-digit', month:'long', year:'numeric' })}`;
    return `${fmtLabel(start)} → ${fmtLabel(new Date(end.getFullYear(), end.getMonth(), 14))}`;
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
          </form>
        )}
        <button style={{marginTop: 20}} className="login-button" onClick={handleLogout}>Đăng xuất</button>
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
      </Routes>
    </Router>
  );
}

export default App;
