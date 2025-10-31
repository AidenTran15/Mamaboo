import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';

const API_URL = 'https://ke8i236i4i.execute-api.ap-southeast-2.amazonaws.com/prod';
const ROSTER_API = 'https://ud7uaxjwtk.execute-api.ap-southeast-2.amazonaws.com/prod';
const UPDATE_ROSTER_API = 'https://rgnp5b26d5.execute-api.ap-southeast-2.amazonaws.com/prod/';

function ProtectedRoute({ children }) {
  const loggedIn = !!localStorage.getItem('userName');
  if (!loggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
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
  const [editData, setEditData] = useState([]);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState('');
  const [staffs, setStaffs] = useState([]);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch(ROSTER_API);
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
          if (typeof data.body === 'string') data = JSON.parse(data.body);
        } catch { data = {}; }
        if (!isMounted) return;
        const items = Array.isArray(data.items) ? data.items : [];
        setRoster(items);
        setEditData(JSON.parse(JSON.stringify(items)));
        // derive staffs from roster names
        const setNames = new Set();
        items.forEach(r => ['sang','trua','toi'].forEach(ca => {
          const v = r[ca];
          if (Array.isArray(v)) v.forEach(n => n && setNames.add(n.trim()));
          else if (v) setNames.add(String(v).trim());
        }));
        setStaffs(Array.from(setNames).sort((a,b)=>a.localeCompare(b,'vi')));
      } catch (e) {
        if (isMounted) setError('Không tải được roster.');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => { localStorage.removeItem('userName'); navigate('/login'); };

  const handleEdit = () => { setEditMode(true); setInfo(''); };
  const handleCancel = () => { setEditData(JSON.parse(JSON.stringify(roster))); setEditMode(false); setInfo(''); };
  const handleChange = (rowIdx, ca, e) => {
    const values = Array.from(e.target.selectedOptions).map(o => o.value);
    setEditData(prev => prev.map((r,i)=> i===rowIdx ? { ...r, [ca]: values } : r));
  };

  const handleSave = async () => {
    setSaving(true); setInfo('');
    let changed = 0;
    for (let i=0;i<editData.length;i++) {
      const before = roster[i];
      const after = editData[i];
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
          } catch (e) {
            console.log('Update error', e);
          }
        }
      }
    }
    setSaving(false);
    setInfo(changed ? `Đã cập nhật ${changed} thay đổi!` : 'Không có thay đổi.');
    setEditMode(false);
    // reload roster
    try {
      const res = await fetch(ROSTER_API);
      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); if (typeof data.body === 'string') data = JSON.parse(data.body); } catch { data = {}; }
      const items = Array.isArray(data.items) ? data.items : [];
      setRoster(items);
      setEditData(JSON.parse(JSON.stringify(items)));
    } catch {}
  };

  return (
    <div className="login-page" style={{justifyContent: 'flex-start'}}>
      <div className="login-container">
        <h2 className="login-title" style={{color: '#e67e22'}}>Quản trị viên</h2>
        <div className="login-underline" style={{ background: '#e67e22' }}></div>
        <div style={{textAlign:'center', fontSize:20, margin:'18px 0'}}>Xin chào {userName || 'Admin'}!</div>
        <h3>Lịch phân ca (roster)</h3>
        {loading ? (
          <div>Đang tải...</div>
        ) : error ? (
          <div style={{color:'red'}}>{error}</div>
        ) : (
          <form onSubmit={(e)=>{e.preventDefault(); handleSave();}} style={{margin:0}}>
            <table style={{ width:'100%', borderCollapse: 'collapse', marginBottom:24 }}>
              <thead>
                <tr>
                  <th style={{border:'1px solid #ddd'}}>Ngày</th>
                  <th style={{border:'1px solid #ddd'}}>Ca Sáng</th>
                  <th style={{border:'1px solid #ddd'}}>Ca Trưa</th>
                  <th style={{border:'1px solid #ddd'}}>Ca Tối</th>
                </tr>
              </thead>
              <tbody>
                {(editMode ? editData : roster).map((row, idx) => (
                  <tr key={idx}>
                    <td style={{border:'1px solid #ddd', padding:'4px 6px'}}>{row.date}</td>
                    {['sang','trua','toi'].map(ca => (
                      <td style={{border:'1px solid #ddd', padding:'4px 6px'}} key={ca}>
                        {editMode ? (
                          <select multiple value={row[ca] || []} onChange={(e)=>handleChange(idx, ca, e)} style={{minWidth:'140px', minHeight:'36px'}}>
                            {staffs.length === 0 ? <option disabled>(Chưa có NV)</option> :
                              staffs.map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        ) : (
                          Array.isArray(row[ca]) ? row[ca].join(', ') : row[ca]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!editMode && <button type="button" className="login-button" onClick={handleEdit}>Chỉnh sửa</button>}
            {editMode && (
              <>
                <button type="submit" className="login-button" disabled={saving}>{saving ? 'Đang cập nhật...' : 'Cập nhật'}</button>
                <button type="button" className="login-button" style={{marginTop: 12}} onClick={handleCancel}>Hủy</button>
              </>
            )}
            {info && <div style={{marginTop:12, color:'#2ecc71', fontWeight:600}}>{info}</div>}
          </form>
        )}
        <button style={{marginTop: 32}} className="login-button" onClick={handleLogout}>Đăng xuất</button>
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
