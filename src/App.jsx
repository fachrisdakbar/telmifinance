import React from 'react';
import {Routes, Route} from 'react-router-dom';

import StockScrenner from './Pages/StockScreener';
import AdminPage from './Pages/admin/AdminPage';
import Sidebar from './Components/Sidebar';
import BandarmologiPage from './Pages/BandarmologiPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<StockScrenner />} />
       <Route path="/admin" element={<AdminPage />} />
      <Route path="/bandarmologi" element={<BandarmologiPage />} />
    </Routes>

  );
}

export default App;