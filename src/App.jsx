import React from 'react';
import {Routes, Route} from 'react-router-dom';
import StockScrenner from './Pages/StockScreener';
import AdminPage from './Pages/admin/AdminPage';
import BandarmologiPage from './Pages/BandarmologiPage';
import StockRankVolume from './Pages/StockRankVolume';
import Stocks from './Pages/admin/stock/Stocks';
import StockDetailPage from './Pages/stockdetail/StockDetailPage';
import CandlestickChart from './Pages/stockdetail/CandleStickChart';


function App() {
  return (
    <Routes>
      <Route path="/" element={<StockScrenner />} />
       <Route path="/admin" element={<AdminPage />} />
      <Route path="/bandarmologi" element={<BandarmologiPage />} />
      <Route path="/stockrankvolume" element={<StockRankVolume />} />
      <Route path="/stocks" element={<Stocks />} />
      <Route path="/stock/:stockCode" element={<StockDetailPage />} />
      <Route path="/charts" element={<CandlestickChart />} />
    </Routes>
  );
}

export default App;