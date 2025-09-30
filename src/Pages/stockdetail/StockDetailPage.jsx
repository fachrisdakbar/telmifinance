import React, { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, BarChart3, DollarSign, Building, Calendar, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// Mock data untuk demonstrasi
const mockStockData = {
  "BBCA": {
    code: "BBCA",
    name: "Bank Central Asia Tbk",
    price: 10200,
    change: 2.5,
    sector: "Perbankan",
    marketCap: "1.2T",
    volume: "15.2M",
    financialData: {
      revenue: [
        { year: "2020", value: 65000 },
        { year: "2021", value: 68000 },
        { year: "2022", value: 72000 },
        { year: "2023", value: 78000 },
        { year: "2024", value: 85000 }
      ],
      profit: [
        { year: "2020", value: 15000 },
        { year: "2021", value: 16500 },
        { year: "2022", value: 18000 },
        { year: "2023", value: 20000 },
        { year: "2024", value: 22500 }
      ],
      assets: [
        { year: "2020", value: 950000 },
        { year: "2021", value: 1050000 },
        { year: "2022", value: 1150000 },
        { year: "2023", value: 1250000 },
        { year: "2024", value: 1350000 }
      ],
      ratios: [
        { year: "2020", ROE: 14.2, PER: 12.5, PBV: 1.8, DER: 0.85 },
        { year: "2021", ROE: 15.1, PER: 11.8, PBV: 1.9, DER: 0.82 },
        { year: "2022", ROE: 16.3, PER: 10.5, PBV: 2.1, DER: 0.78 },
        { year: "2023", ROE: 17.8, PER: 9.2, PBV: 2.3, DER: 0.75 },
        { year: "2024", ROE: 18.5, PER: 8.5, PBV: 2.4, DER: 0.72 }
      ]
    }
  },
  "TLKM": {
    code: "TLKM",
    name: "Telkom Indonesia (Persero) Tbk",
    price: 3850,
    change: -1.2,
    sector: "Telekomunikasi",
    marketCap: "380B",
    volume: "25.8M",
    financialData: {
      revenue: [
        { year: "2020", value: 125000 },
        { year: "2021", value: 130000 },
        { year: "2022", value: 135000 },
        { year: "2023", value: 142000 },
        { year: "2024", value: 148000 }
      ],
      profit: [
        { year: "2020", value: 18000 },
        { year: "2021", value: 19500 },
        { year: "2022", value: 21000 },
        { year: "2023", value: 23500 },
        { year: "2024", value: 25000 }
      ],
      assets: [
        { year: "2020", value: 180000 },
        { year: "2021", value: 190000 },
        { year: "2022", value: 205000 },
        { year: "2023", value: 220000 },
        { year: "2024", value: 235000 }
      ],
      ratios: [
        { year: "2020", ROE: 12.5, PER: 15.2, PBV: 1.5, DER: 0.65 },
        { year: "2021", ROE: 13.2, PER: 14.8, PBV: 1.6, DER: 0.62 },
        { year: "2022", ROE: 14.1, PER: 13.5, PBV: 1.7, DER: 0.58 },
        { year: "2023", ROE: 15.3, PER: 12.2, PBV: 1.8, DER: 0.55 },
        { year: "2024", ROE: 16.2, PER: 11.5, PBV: 1.9, DER: 0.52 }
      ]
    }
  }
};

const StockDetailPage = () => {
  const [selectedStock, setSelectedStock] = useState("BBCA");
  const [activeTab, setActiveTab] = useState("overview");
  const [showValues, setShowValues] = useState(true);

  const stock = mockStockData[selectedStock];
  
  if (!stock) return <div>Stock not found</div>;

  const formatCurrency = (value) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}T`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}M`;
    }
    return value.toString();
  };

  const formatNumber = (value) => {
    return value.toLocaleString('id-ID');
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const revenueVsProfit = stock.financialData.revenue.map((item, index) => ({
    year: item.year,
    revenue: item.value,
    profit: stock.financialData.profit[index].value
  }));

  const latestRatios = stock.financialData.ratios[stock.financialData.ratios.length - 1];
  const ratioData = [
    { name: 'ROE', value: latestRatios.ROE, color: '#3B82F6' },
    { name: 'PER', value: latestRatios.PER, color: '#10B981' },
    { name: 'PBV', value: latestRatios.PBV, color: '#F59E0B' },
    { name: 'DER', value: latestRatios.DER, color: '#EF4444' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="px-4 py-8 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button className="flex items-center px-4 py-2 mr-6 text-gray-600 transition-colors bg-white rounded-lg shadow-sm hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Ranking
          </button>
          
          <select 
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.keys(mockStockData).map(code => (
              <option key={code} value={code}>{code} - {mockStockData[code].name}</option>
            ))}
          </select>
        </div>

        {/* Stock Header Card */}
        <div className="p-8 mb-8 bg-white shadow-xl rounded-2xl">
          <div className="flex flex-col items-start justify-between lg:flex-row lg:items-center">
            <div className="flex items-center mb-6 lg:mb-0">
              <div className="flex items-center justify-center w-16 h-16 mr-6 text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{stock.code}</h1>
                <p className="text-lg text-gray-600">{stock.name}</p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    {stock.sector}
                  </span>
                  <span>Market Cap: {stock.marketCap}</span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">
                Rp {formatNumber(stock.price)}
              </div>
              <div className={`flex items-center text-xl font-semibold ${
                stock.change > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {stock.change > 0 ? (
                  <TrendingUp className="w-5 h-5 mr-2" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-2" />
                )}
                {stock.change > 0 ? '+' : ''}{stock.change}%
              </div>
              <div className="mt-2 text-sm text-gray-500">
                Volume: {stock.volume}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px space-x-8">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'financial', name: 'Laporan Keuangan', icon: DollarSign },
                { id: 'ratios', name: 'Rasio Keuangan', icon: TrendingUp }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Revenue vs Profit Chart */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Pendapatan vs Laba Bersih</h3>
                <button
                  onClick={() => setShowValues(!showValues)}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  {showValues ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {showValues ? 'Sembunyikan' : 'Tampilkan'} Nilai
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueVsProfit}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" tickFormatter={formatCurrency} />
                  <Tooltip 
                    formatter={(value, name) => [
                      showValues ? `${formatCurrency(value)} Miliar` : 'Hidden', 
                      name === 'revenue' ? 'Pendapatan' : 'Laba Bersih'
                    ]}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Current Ratios Pie Chart */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Rasio Keuangan Terkini</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={ratioData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {ratioData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-4 mt-6">
                {ratioData.map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="w-4 h-4 mr-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm">
                      {item.name}: <strong>{item.value}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-8">
            {/* Assets Growth */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Perkembangan Aset (dalam Miliar)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stock.financialData.assets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value) => [`${formatCurrency(value)} Miliar`, 'Total Aset']} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue & Profit Comparison */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Perbandingan Pendapatan & Laba</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueVsProfit} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" tickFormatter={formatCurrency} />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${formatCurrency(value)} Miliar`, 
                      name === 'revenue' ? 'Pendapatan' : 'Laba Bersih'
                    ]}
                  />
                  <Bar dataKey="revenue" fill="#3B82F6" name="revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" fill="#10B981" name="profit" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'ratios' && (
          <div className="space-y-8">
            {/* ROE Trend */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Tren ROE (Return on Equity)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stock.financialData.ratios}>
                  <defs>
                    <linearGradient id="colorROE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip formatter={(value) => [`${value}%`, 'ROE']} />
                  <Area type="monotone" dataKey="ROE" stroke="#3B82F6" fillOpacity={1} fill="url(#colorROE)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* All Ratios Comparison */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">Perbandingan Semua Rasio</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stock.financialData.ratios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Line type="monotone" dataKey="ROE" stroke="#3B82F6" strokeWidth={2} name="ROE %" />
                  <Line type="monotone" dataKey="PER" stroke="#10B981" strokeWidth={2} name="PER" />
                  <Line type="monotone" dataKey="PBV" stroke="#F59E0B" strokeWidth={2} name="PBV" />
                  <Line type="monotone" dataKey="DER" stroke="#EF4444" strokeWidth={2} name="DER" />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="grid grid-cols-2 gap-6 mt-6 lg:grid-cols-4">
                {[
                  { name: 'ROE', value: latestRatios.ROE, suffix: '%', color: 'bg-blue-100 text-blue-800', desc: 'Return on Equity' },
                  { name: 'PER', value: latestRatios.PER, suffix: 'x', color: 'bg-green-100 text-green-800', desc: 'Price Earning Ratio' },
                  { name: 'PBV', value: latestRatios.PBV, suffix: 'x', color: 'bg-yellow-100 text-yellow-800', desc: 'Price to Book Value' },
                  { name: 'DER', value: latestRatios.DER, suffix: 'x', color: 'bg-red-100 text-red-800', desc: 'Debt to Equity Ratio' }
                ].map((ratio, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-50">
                    <div className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ratio.color}`}>
                      {ratio.name}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {ratio.value}{ratio.suffix}
                    </div>
                    <div className="text-sm text-gray-500">{ratio.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StockDetailPage;
