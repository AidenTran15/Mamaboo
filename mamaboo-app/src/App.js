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
  const handleLogout = () => {
    localStorage.removeItem('userName');
    navigate('/login');
  };
  return (
    <div className="login-page" style={{justifyContent: 'flex-start'}}>
      <div className="login-container">
        <h2 className="login-title" style={{color: '#e67e22'}}>Quản trị viên</h2>
        <div className="login-underline" style={{ background: '#e67e22' }}></div>
        <div style={{textAlign:'center', fontSize:20, margin:'18px 0'}}>
          Xin chào {userName || 'Admin'}!
        </div>
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
