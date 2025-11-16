import React, { useState } from 'react';

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

export default MultiSelectDropdown;

