import React from 'react';
import {Routes, Route} from 'react-router-dom';

import StockScrenner from './Pages/StockScreener';
import AdminPage from './Pages/admin/AdminPage';
import Sidebar from '../../telmi-vite/src/layouts/Sidebar';

function App() {
  return (
    <Routes>
      <Route path="/" element={<StockScrenner />} />
       <Route path="/admin" element={<AdminPage />} />
      <Route path="/sidebar" element={<Sidebar />} />
    </Routes>

  );
}

export default App;