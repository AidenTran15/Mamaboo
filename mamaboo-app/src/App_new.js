import React from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import components
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './components/LoginForm';
import NhanVien from './components/NhanVien';
import InventoryCheck from './components/InventoryCheck';
import InventoryManagement from './components/InventoryManagement';

// Import các components lớn còn lại từ file App.js cũ (sẽ tách sau)
// Tạm thời import từ file App.js cũ
import Admin from './components/Admin';
import Checkin from './components/Checkin';
import ChecklistReport from './components/ChecklistReport';
import OvertimeManagement from './components/OvertimeManagement';
import PenaltyManagement from './components/PenaltyManagement';

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
        <Route path="/overtime-management" element={<ProtectedRoute><OvertimeManagement /></ProtectedRoute>} />
        <Route path="/penalty-management" element={<ProtectedRoute><PenaltyManagement /></ProtectedRoute>} />
        <Route path="/inventory-check" element={<ProtectedRoute><InventoryCheck /></ProtectedRoute>} />
        <Route path="/inventory-management" element={<ProtectedRoute><InventoryManagement /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

