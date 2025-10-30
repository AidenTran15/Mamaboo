import React, { useState } from 'react';
import './App.css';

const API_URL = 'https://ke8i236i4i.execute-api.ap-southeast-2.amazonaws.com/prod';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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
        // Nếu body là chuỗi, parse lần nữa
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
        setMessage(`Đăng nhập thành công! Xin chào, ${data.user.Name || data.user.User_Name}`);
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

export default App;
