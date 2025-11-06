import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, ReferenceLine } from 'recharts';

const CandlestickChart = () => {
  // Generate dummy data mirip pola di gambar: sideways -> rally -> correction -> stabilize
  const generateData = () => {
    const data = [];
    const startDate = new Date('2025-06-16');
    
    // Phase 1: Sideways (Jun-Aug) - sekitar 800-850
    for (let i = 0; i < 45; i++) {
      const base = 820 + Math.sin(i / 5) * 30;
      const volatility = 15;
      data.push({
        date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        open: base + (Math.random() - 0.5) * volatility,
        high: base + Math.random() * volatility + 5,
        low: base - Math.random() * volatility - 5,
        close: base + (Math.random() - 0.5) * volatility,
        volume: (5 + Math.random() * 15) * 1000000
      });
    }
    
    // Phase 2: Strong Rally (Sep awal) - 850 -> 1600
    for (let i = 0; i < 12; i++) {
      const base = 850 + (i * 60);
      const volatility = 30 + i * 3;
      data.push({
        date: new Date(startDate.getTime() + (45 + i) * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        open: base + (Math.random() - 0.3) * volatility,
        high: base + Math.random() * volatility + 20,
        low: base - Math.random() * volatility * 0.3,
        close: base + (Math.random() - 0.2) * volatility + 30,
        volume: (30 + Math.random() * 90) * 1000000
      });
    }
    
    // Phase 3: Peak & Correction (Sep akhir) - 1600 -> 1000
    for (let i = 0; i < 15; i++) {
      const base = 1550 - (i * 35);
      const volatility = 50;
      data.push({
        date: new Date(startDate.getTime() + (57 + i) * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        open: base + (Math.random() - 0.5) * volatility,
        high: base + Math.random() * volatility * 0.5,
        low: base - Math.random() * volatility,
        close: base + (Math.random() - 0.6) * volatility,
        volume: (20 + Math.random() * 60) * 1000000
      });
    }
    
    // Phase 4: Stabilization (Okt) - sekitar 1100-1300
    for (let i = 0; i < 25; i++) {
      const base = 1200 + Math.sin(i / 3) * 80;
      const volatility = 40;
      data.push({
        date: new Date(startDate.getTime() + (72 + i) * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
        open: base + (Math.random() - 0.5) * volatility,
        high: base + Math.random() * volatility + 10,
        low: base - Math.random() * volatility - 10,
        close: base + (Math.random() - 0.5) * volatility,
        volume: (10 + Math.random() * 30) * 1000000
      });
    }
    
    // Calculate Moving Averages
    data.forEach((item, index) => {
      item.open = Math.round(item.open);
      item.high = Math.round(item.high);
      item.low = Math.round(item.low);
      item.close = Math.round(item.close);
      
      // SMA5
      if (index >= 4) {
        item.sma5 = Math.round(data.slice(index - 4, index + 1).reduce((sum, d) => sum + d.close, 0) / 5);
      }
      
      // SMA20
      if (index >= 19) {
        item.sma20 = Math.round(data.slice(index - 19, index + 1).reduce((sum, d) => sum + d.close, 0) / 20);
      }
      
      // SMA60
      if (index >= 59) {
        item.sma60 = Math.round(data.slice(index - 59, index + 1).reduce((sum, d) => sum + d.close, 0) / 60);
      }
    });
    
    return data;
  };

  const [data] = useState(generateData());
  const lastData = data[data.length - 1];
  const prevData = data[data.length - 2];
  const change = lastData.close - prevData.close;
  const changePercent = ((change / prevData.close) * 100).toFixed(2);

  const CustomCandle = (props) => {
    const { x, y, width, height, payload } = props;
    const { open, close, high, low } = payload;
    
    if (!open || !close || !high || !low) return null;
    
    const isGreen = close >= open;
    const color = isGreen ? '#3b82f6' : '#ef4444';
    const candleWidth = Math.min(width * 0.6, 8);
    const xCenter = x + width / 2;
    
    // Calculate positions (inverted Y axis)
    const yScale = height / (1800 - 700);
    const yHigh = y + height - (high - 700) * yScale;
    const yLow = y + height - (low - 700) * yScale;
    const yOpen = y + height - (open - 700) * yScale;
    const yClose = y + height - (close - 700) * yScale;
    const bodyHeight = Math.abs(yClose - yOpen);
    
    return (
      <g>
        {/* Wick */}
        <line
          x1={xCenter}
          y1={yHigh}
          x2={xCenter}
          y2={yLow}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={xCenter - candleWidth / 2}
          y={Math.min(yOpen, yClose)}
          width={candleWidth}
          height={Math.max(bodyHeight, 1)}
          fill={color}
          stroke={color}
        />
      </g>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const change = data.close - data.open;
      const changePercent = ((change / data.open) * 100).toFixed(2);
      
      return (
        <div className="p-3 text-xs text-gray-800 bg-white border border-gray-300 rounded shadow-lg">
          <p className="mb-2 font-bold">{data.date}</p>
          <div className="space-y-1">
            <p>O: <span className="font-semibold">{data.open?.toLocaleString()}</span></p>
            <p>H: <span className="font-semibold">{data.high?.toLocaleString()}</span></p>
            <p>L: <span className="font-semibold">{data.low?.toLocaleString()}</span></p>
            <p>C: <span className="font-semibold">{data.close?.toLocaleString()}</span></p>
            <p className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
              {change > 0 ? '+' : ''}{change} ({changePercent}%)
            </p>
            <p className="text-gray-600">Vol: {(data.volume / 1000000).toFixed(1)}M</p>
            {data.sma5 && <p className="text-pink-500">SMA5: {data.sma5}</p>}
            {data.sma20 && <p className="text-cyan-500">SMA20: {data.sma20}</p>}
            {data.sma60 && <p className="text-purple-500">SMA60: {data.sma60}</p>}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full min-h-screen p-4 bg-gray-50">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-gray-800">
                AADI - Adaro Andalan Indonesia Tbk.
              </h1>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-600">Last: <span className="font-semibold text-gray-900">{lastData.close?.toLocaleString()}</span></span>
                <span className={change >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                  {change > 0 ? '▲' : '▼'} {Math.abs(change)} ({changePercent}%)
                </span>
                <span className="text-gray-600">Vol: <span className="text-gray-900">{(lastData.volume / 1000000).toFixed(1)}M</span></span>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-8 h-0.5 bg-pink-500"></div>
                <span className="text-gray-600">SMA5</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-8 h-0.5 bg-cyan-500"></div>
                <span className="text-gray-600">SMA20</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-8 h-0.5 bg-purple-500"></div>
                <span className="text-gray-600">SMA60</span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="p-4 mb-2 bg-white border border-gray-200 rounded-lg shadow">
          <div className="mb-2 text-xs text-gray-600">Candle Stick</div>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                interval={Math.floor(data.length / 10)}
              />
              <YAxis 
                domain={[700, 1800]}
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Moving Averages */}
              <Line type="monotone" dataKey="sma5" stroke="#ec4899" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="sma20" stroke="#06b6d4" strokeWidth={1} dot={false} />
              <Line type="monotone" dataKey="sma60" stroke="#a855f7" strokeWidth={1} dot={false} />
              
              {/* Candlesticks */}
              <Bar dataKey="high" shape={<CustomCandle />} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Volume Chart */}
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow">
          <div className="mb-2 text-xs text-gray-600">Volume</div>
          <ResponsiveContainer width="100%" height={150}>
            <BarChart data={data} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                interval={Math.floor(data.length / 10)}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fontSize: 10 }}
                width={60}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
                labelStyle={{ color: '#4b5563' }}
                formatter={(value) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']}
              />
              <Bar 
                dataKey="volume" 
                fill="#3b82f6"
                opacity={0.7}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-gray-400">Bullish</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-400">Bearish</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandlestickChart;