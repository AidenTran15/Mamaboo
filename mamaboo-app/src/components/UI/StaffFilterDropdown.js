import React, { useState } from 'react';

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

export default StaffFilterDropdown;

