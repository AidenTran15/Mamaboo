import React, { useState } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';

const API_URL = 'https://ke8i236i4i.execute-api.ap-southeast-2.amazonaws.com/prod';

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
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });
      console.log('Response object:', response);
      const text = await response.text();
      console.log('Raw response text:', text);
      let data;
      try {
        data = JSON.parse(text);
        if (typeof data.body === 'string') {
          data = JSON.parse(data.body);
        }
      } catch (err) {
        console.log('Lỗi parse JSON:', err);
        setMessage('Phản hồi trả về không hợp lệ!');
        return;
      }
      console.log('Dữ liệu trả về:', data);
      if (data.success) {
        setMessage('Đăng nhập thành công! Đang chuyển trang...');
        // Lưu tên user vào localStorage
        localStorage.setItem('userName', data.user.Name || data.user.User_Name);
        setTimeout(() => {
          const tenDangNhap = (data.user && data.user.User_Name) ? data.user.User_Name : username;
          if (tenDangNhap === 'admin') {
            navigate('/admin');
          } else {
            navigate('/nhan-vien');
          }
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
          <input
            className="login-input"
            type="text"
            id="username"
            name="username"
            autoComplete="username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
          <label className="login-label" htmlFor="password">Mật Khẩu:</label>
          <input
            className="login-input"
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? 'Đang kiểm tra...' : 'ĐĂNG NHẬP'}
          </button>
        </form>
        {message && <div style={{ marginTop: '18px', color: message.includes('thành công') ? '#43a8ef' : 'red', fontWeight: 600 }}>{message}</div>}
      </div>
    </div>
  );
}

function NhanVien() {
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('userName');
    navigate('/login');
  };
  return (
    <div className="login-page" style={{justifyContent: 'flex-start'}}>
      <div className="login-container">
        <h2 className="login-title" style={{color: '#2ecc71'}}>Nhân Viên</h2>
        <div className="login-underline" style={{ background: '#2ecc71' }}></div>
        <div style={{textAlign: 'center', fontSize: 20, marginTop: 30, marginBottom: 20}}>
          Xin chào {userName ? userName : 'bạn'}!
        </div>
        <button style={{marginTop: 32}} className="login-button" onClick={handleLogout}>Đăng xuất</button>
      </div>
    </div>
  );
}

function Admin() {
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();
  const [roster, setRoster] = useState([]);
  const [staffs, setStaffs] = useState([]); // danh sách nhân viên
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  // APIs
  const rosterApi = 'https://ud7uaxjwtk.execute-api.ap-southeast-2.amazonaws.com/prod';
  const staffApi = 'https://rgnp5b26d5.execute-api.ap-southeast-2.amazonaws.com/prod/';
  const updateRosterApi = 'https://your-update-roster-endpoint'; // Replace với endpoint update thực tế của bạn

  // Helper: hợp nhất tên NV từ roster
  const deriveStaffFromRoster = (rosterItems) => {
    const setNames = new Set();
    rosterItems.forEach(r => {
      ['sang','trua','toi'].forEach(ca => {
        const val = r[ca];
        if (Array.isArray(val)) val.forEach(n => n && setNames.add(n));
        else if (val) setNames.add(val);
      });
    });
    return Array.from(setNames);
  };

  // Helper: fetch danh sách nhân viên (có hợp nhất từ roster nếu cần)
  const fetchStaffList = async (fallbackRoster = []) => {
    let staffList = [];
    try {
      const rs = await fetch(staffApi, { cache: 'no-store' });
      const rsText = await rs.text();
      console.log('==> API staff raw', rsText);
      let data = {};
      try {
        data = JSON.parse(rsText);
        if (typeof data.body === 'string') {
          data = JSON.parse(data.body);
        }
      } catch { data = {}; }
      if (Array.isArray(data.items) && data.items.length > 0) {
        console.log('Nhân viên mẫu:', data.items[0]);
      }
      staffList = (Array.isArray(data.items) ? data.items : []).map(staff => {
        const nameVal = staff.name || staff.Name || staff.User_Name || staff['Tên'] || staff['ten'] || staff['HoTen'] || Object.values(staff)[0] || '';
        return typeof nameVal === 'string' ? nameVal.trim() : '';
      }).filter(Boolean);
    } catch (err) {
      staffList = [];
    }
    // Hợp nhất với tên suy ra từ roster để đảm bảo luôn có đầy đủ (kể cả người mới vừa có ca)
    const union = new Set(staffList);
    if (fallbackRoster.length > 0) {
      deriveStaffFromRoster(fallbackRoster).forEach(n => n && union.add((typeof n === 'string') ? n.trim() : n));
    }
    const finalList = Array.from(union).filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));
    setStaffs(finalList);
  };

  // Load roster + staff ban đầu
  React.useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      let rosterItems = [];
      try {
        const rs = await fetch(rosterApi);
        const rsText = await rs.text();
        let data = {};
        try {
          data = JSON.parse(rsText);
          if (typeof data.body === 'string') {
            data = JSON.parse(data.body);
          }
        } catch { data = {}; }
        rosterItems = Array.isArray(data.items) ? data.items : [];
        setRoster(rosterItems);
        setEditData(JSON.parse(JSON.stringify(rosterItems)));
      } catch {
        rosterItems = [];
        setRoster([]); setEditData([]);
      }
      await fetchStaffList(rosterItems);
      setLoading(false);
    }
    fetchAll();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const handleEdit = async () => {
    // Khi vào chế độ chỉnh sửa, làm mới danh sách NV để thấy nhân viên mới thêm
    await fetchStaffList(editData);
    setEditMode(true);
  };
  const handleRefreshStaff = async () => {
    await fetchStaffList(editData);
    setMessage('Đã làm mới danh sách nhân viên.');
  };
  const handleCancel = () => {
    setEditData(JSON.parse(JSON.stringify(roster)));
    setEditMode(false);
    setMessage('');
  };
  
  const handleChangeCa = (rowIdx, ca, e) => {
    const options = Array.from(e.target.selectedOptions).map(o => o.value);
    setEditData(ed => ed.map((row, i) => i===rowIdx ? { ...row, [ca]: options } : row));
  };

  const handleSaveUpdate = async () => {
    setUpdating(true);
    setMessage('');
    let okCount = 0;
    for (let i = 0; i < editData.length; ++i) {
      const orig = roster[i];
      const edited = editData[i];
      for (let ca of ['sang','trua','toi']) {
        if (JSON.stringify(orig[ca]) !== JSON.stringify(edited[ca])) {
          try {
            await fetch(updateRosterApi, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ date: edited.date, ca, nhan_vien: edited[ca] })
            });
            okCount++;
          } catch {}
        }
      }
    }
    setUpdating(false);
    setEditMode(false);
    setMessage(okCount > 0 ? `Đã cập nhật ${okCount} thay đổi!` : 'Không có thay đổi nào mới.');
    try {
      const rs = await fetch(rosterApi);
      const rsText = await rs.text();
      let data = {};
      try {
        data = JSON.parse(rsText);
        if (typeof data.body === 'string') {
          data = JSON.parse(data.body);
        }
      } catch { data = {}; }
      const newRoster = Array.isArray(data.items) ? data.items : [];
      setRoster(newRoster);
      setEditData(JSON.parse(JSON.stringify(newRoster)));
    } catch {}
  };

  return (
    <div className="login-page" style={{justifyContent: 'flex-start'}}>
      <div className="login-container">
        <h2 className="login-title" style={{color: '#e67e22'}}>Quản trị viên</h2>
        <div className="login-underline" style={{ background: '#e67e22' }}></div>
        <div style={{textAlign:'center', fontSize:20, margin:'18px 0'}}>
          Xin chào {userName || 'Admin'}!
        </div>
        <h3>Lịch phân ca (roster)</h3>
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <form style={{margin:0}} onSubmit={e => {e.preventDefault();handleSaveUpdate();}}>
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
              {(editMode ? editData : roster).map((row, i) => (
                <tr key={i}>
                  <td style={{border:'1px solid #ddd', padding:'4px 6px'}}>{row.date}</td>
                  {['sang','trua','toi'].map(ca => (
                    <td style={{border:'1px solid #ddd', padding:'4px 6px'}} key={ca}>
                      {editMode ? (
                        <select multiple value={row[ca] || []} onChange={e => handleChangeCa(i, ca, e)} style={{minWidth:'120px', minHeight:'34px'}}>
                          {staffs.length === 0 ? (
                            <option disabled>(Chưa có nhân viên)</option>
                          ) : (
                            staffs.map(staff => <option value={staff} key={staff}>{staff}</option>)
                          )}
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
          {!editMode && <button type="button" style={{marginRight:16}} className="login-button" onClick={handleEdit}>Chỉnh sửa</button>}
          {editMode && <>
            <button type="submit" className="login-button" disabled={updating}>{updating?'Đang cập nhật...':'Cập nhật'}</button>
            <button type="button" style={{marginLeft:16}} className="login-button" onClick={handleCancel}>Hủy</button>
            <button type="button" style={{marginLeft:16}} className="login-button" onClick={handleRefreshStaff}>Làm mới danh sách NV</button>
          </>}
          {message && <div style={{marginTop:12, color:'#2ecc71', fontWeight:500}}>{message}</div>}
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
        <Route
          path="/nhan-vien"
          element={
            <ProtectedRoute>
              <NhanVien />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
