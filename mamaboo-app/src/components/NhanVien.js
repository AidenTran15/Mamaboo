import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROSTER_API, OVERTIME_GET_API, PENALTY_GET_API } from '../constants/api';

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
          // Cho phép hiển thị nút bắt đầu ca cho TẤT CẢ các ca để test (bỏ điều kiện thời gian và ngày)
          const canCheckIn = true; // Hiển thị nút cho tất cả ca để test
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

  const chipStyle = (type) => {
    const colors = { sang: '#e9f8ef', trua: '#fff5e5', toi: '#f3eaff' };
    const text = { sang: '#1e7e34', trua: '#c17d00', toi: '#6f42c1' };
    return { background: colors[type] || '#eef5ff', color: text[type] || '#1c222f', padding: '6px 10px', borderRadius: 999, fontWeight: 600, fontSize: 14 };
  };

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
      
      // Tính chu kỳ lương hiện tại: từ ngày 15 tháng này đến 14 tháng sau
      let periodYear, periodMonth;
      if (currentDay < 15) {
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
      // Chu kỳ lương: từ ngày 15 tháng này đến 14 tháng sau
      const start = new Date(periodYear, periodMonth, 15);
      const end = new Date(periodYear, periodMonth + 1, 15);
      
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
      
      // Duyệt qua tất cả ngày trong chu kỳ lương
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const ds = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
        const r = byDate.get(ds);
        if (!r) continue;
        
        // Kiểm tra các ca
        ['sang', 'trua', 'toi'].forEach(type => {
          const nameArr = r[type];
          const members = Array.isArray(nameArr) ? nameArr.filter(Boolean).map(norm) : (nameArr ? [norm(nameArr)] : []);
          if (members.length === 0) return;
          if (!members.includes(norm(userName))) return;
          
          // Đếm số ca (tất cả ca trong roster)
          totalShifts++;
          
          // Lưu thông tin ca vào danh sách
          shiftsList.push({
            date: ds,
            dateFormatted: formatDate(ds),
            type: type,
            shiftName: shiftNames[type]
          });
          
          // Tính lương dựa trên số người trong ca
          const hours = hoursByShift[type];
          const isSingle = members.length === 1;
          const rate = isSingle ? rateSingle : rateDouble;
          baseSalary += hours * rate;
        });
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
    <div className="login-page" style={{justifyContent: 'center', alignItems: 'flex-start'}}>
      <div className="login-container" style={{width: 750, maxWidth: '95vw', marginTop: 40, marginBottom: 32, alignItems:'stretch'}}>
        <h2 className="login-title" style={{color: '#2ecc71', alignSelf:'center'}}>Nhân Viên</h2>
        <div className="login-underline" style={{ background: '#2ecc71', alignSelf:'center' }}></div>
        <div style={{textAlign: 'center', fontSize: 20, marginTop: 10, marginBottom: 16}}>Xin chào {userName ? userName : 'bạn'}!</div>

        <div style={{display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap'}}>
          <button 
            onClick={calculateMonthlyStats}
            style={{
              padding: '12px 24px',
              background: '#2ecc71',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#27ae60';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#2ecc71';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            Xem thống kê tháng này
          </button>
          
          <button 
            onClick={() => navigate('/inventory-check')}
            style={{
              padding: '12px 24px',
              background: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: '16px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
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
            Kiểm tra nguyên vật liệu
          </button>
        </div>

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
                  <div style={{opacity:0.8}}>{formatDate(r.date)}</div>
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

export default NhanVien;

