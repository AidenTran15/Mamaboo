import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ROSTER_API = 'https://ud7uaxjwtk.execute-api.ap-southeast-2.amazonaws.com/prod';
const OVERTIME_GET_API = 'https://enxgjymmjc.execute-api.ap-southeast-2.amazonaws.com/prod';
const PENALTY_GET_API = 'https://lfp8b72mc5.execute-api.ap-southeast-2.amazonaws.com/prod';

function KeToan() {
  const userName = localStorage.getItem('userName');
  const navigate = useNavigate();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [monthData, setMonthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [penaltyRecords, setPenaltyRecords] = useState([]);

  // Tính chu kỳ từ đầu tháng đến cuối tháng
  const getMonthPeriod = (y, m) => {
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 1); // Ngày đầu tháng sau (exclusive)
    return { start, end };
  };

  // Fetch roster data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { start, end } = getMonthPeriod(year, month);
        const startStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
        const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
        
        const res = await fetch(`${ROSTER_API}?from=${startStr}&to=${endStr}`);
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
          if (typeof data.body === 'string') data = JSON.parse(data.body);
        } catch {}
        
        const items = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
        setMonthData(items);
      } catch (e) {
        console.error('Error fetching roster:', e);
        setMonthData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [year, month]);

  // Fetch overtime records
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(OVERTIME_GET_API);
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
          if (typeof data.body === 'string') data = JSON.parse(data.body);
        } catch {}
        const items = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
        setOvertimeRecords(items);
      } catch (e) {
        console.error('Error fetching overtime:', e);
        setOvertimeRecords([]);
      }
    })();
  }, []);

  // Fetch penalty records
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(PENALTY_GET_API);
        const text = await res.text();
        let data = {};
        try {
          data = JSON.parse(text);
          if (typeof data.body === 'string') data = JSON.parse(data.body);
        } catch {}
        const items = Array.isArray(data.items) ? data.items : (Array.isArray(data) ? data : []);
        setPenaltyRecords(items);
      } catch (e) {
        console.error('Error fetching penalty:', e);
        setPenaltyRecords([]);
      }
    })();
  }, []);

  // Rebuild overtime data từ records theo chu kỳ tháng (1 đến cuối tháng)
  const rebuildOvertimeDataFromRecords = (records) => {
    try {
      const data = {};
      if (!records || records.length === 0) return data;
      
      records.forEach(record => {
        const [y, m] = record.date.split('-').map(Number);
        const monthKey = `${y}-${m}`; // Format: YYYY-M (M là 1-12)
        
        if (!data[monthKey]) data[monthKey] = {};
        if (!data[monthKey][record.staffName]) {
          data[monthKey][record.staffName] = { overtime: 0, lateCount: 0 };
        }
        
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

  // Tính tiền phạt theo chu kỳ tháng (1 đến cuối tháng)
  const calculatePenaltyAmount = (staffName, monthKey) => {
    const PENALTY_RATES = {
      '0': 0, '1': 40000, '2': 80000, '3': 100000, '4': 150000, '5': 200000
    };
    
    let penaltyAmount = 0;
    const [y, m] = monthKey.split('-').map(Number);
    
    penaltyRecords.forEach(record => {
      if (record.staffName && (record.staffName || '').toString().trim().toLowerCase() === (staffName || '').toString().trim().toLowerCase()) {
        const [ry, rm] = record.date.split('-').map(Number);
        // Kiểm tra xem record có thuộc tháng này không
        if (ry === y && rm === m) {
          const level = String(record.level || record.penaltyLevel || '0');
          penaltyAmount += PENALTY_RATES[level] || 0;
        }
      }
    });
    
    return penaltyAmount;
  };

  // Tính tổng lương và giờ
  const computeTotals = (rows, selectedYear, selectedMonth) => {
    const hoursByShift = { sang: 4, trua: 5, toi: 4 };
    const rateSingle = 25000; // VND per hour per person when only 1 person in shift
    const rateDouble = 20000; // VND per hour per person when >=2 people in shift

    const totalHours = new Map(); // name -> hours
    const singleHours = new Map(); // name -> single shift hours
    const doubleHours = new Map(); // name -> double shift hours
    const moneyMap = new Map(); // name -> money
    const allowanceCountMap = new Map(); // name -> số lần phụ cấp

    // Filter rows để chỉ tính các ngày trong tháng được chọn
    const filteredRows = rows.filter(r => {
      if (!r.date) return false;
      const [y, m] = r.date.split('-').map(Number);
      return y === selectedYear && m === (selectedMonth + 1);
    });

    filteredRows.forEach(r => {
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

  const handleLogout = () => {
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const monthKey = `${year}-${month + 1}`;
  const currentOvertimeData = rebuildOvertimeDataFromRecords(overtimeRecords);
  const ratePerHour = 20000;

  return (
    <div className="login-page" style={{justifyContent: 'center', alignItems: 'flex-start', padding: '20px'}}>
      <div className="login-container" style={{width: 1200, maxWidth: '95vw', marginTop: 24}}>
        <h2 className="login-title" style={{color: '#2e7d32'}}>Kế Toán</h2>
        <div className="login-underline" style={{ background: '#2e7d32' }}></div>
        <div style={{textAlign:'center', fontSize:20, margin:'12px 0'}}>Xin chào {userName || 'Kế Toán'}!</div>

        {/* Chọn tháng/năm */}
        <div style={{display:'flex', gap:16, justifyContent:'center', marginBottom:24, flexWrap:'wrap', alignItems:'center'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <label style={{fontWeight:600, color:'#2b4c66', fontSize:'14px'}}>Tháng:</label>
            <select 
              value={month} 
              onChange={(e) => setMonth(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {[0,1,2,3,4,5,6,7,8,9,10,11].map(m => (
                <option key={m} value={m}>{m + 1}</option>
              ))}
            </select>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <label style={{fontWeight:600, color:'#2b4c66', fontSize:'14px'}}>Năm:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid #ddd',
                fontSize: '14px',
                width: 100
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:'center', padding:40, color:'#6b7a86'}}>Đang tải dữ liệu...</div>
        ) : (
          <>
            <h3 style={{textAlign:'left', margin:'18px 0 8px', color:'#1c222f', fontSize:'20px', fontWeight:700}}>
              Báo cáo lương tháng {month + 1}/{year} (Từ ngày 1 đến cuối tháng)
            </h3>
            <div className="roster-scroll" style={{overflowX:'auto', marginBottom:20}}>
              <table className="roster-table" style={{ borderCollapse: 'separate', borderSpacing:0, borderRadius:10, boxShadow:'0 3px 14px rgba(0,0,0,0.06)', margin:'0 auto', minWidth:800 }}>
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
                    let totalAllSalary = 0;
                    let totalAllHours = 0;
                    let totalSingleHours = 0;
                    let totalDoubleHours = 0;
                    
                    return (
                      <>
                        {computeTotals(monthData, year, month).map(([name, total, singleH, doubleH, money, allowanceCount]) => {
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
                            totalAllHours += total;
                            totalSingleHours += singleH;
                            totalDoubleHours += doubleH;
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
                        {/* Dòng tổng */}
                        <tr style={{background:'#f0f8ff', fontWeight:700}}>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef', fontWeight:700}}>TỔNG</td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef', textAlign:'center', fontWeight:700}}>{totalAllHours}</td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef', textAlign:'center', fontWeight:700}}>{totalSingleHours}</td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef', textAlign:'center', fontWeight:700}}>{totalDoubleHours}</td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef', textAlign:'right', fontWeight:700, color:'#e67e22', fontSize:'1.1em'}}>
                            {Number(totalAllSalary).toLocaleString('vi-VN')}
                          </td>
                          <td style={{padding:'10px 8px', borderTop:'2px solid #43a8ef'}} colSpan="4"></td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </>
        )}

        <button style={{marginTop: 20}} className="login-button" onClick={handleLogout}>Đăng xuất</button>
      </div>
    </div>
  );
}

export default KeToan;

