import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  BarChart3,
  DollarSign,
  Building,
  Eye,
  EyeOff,
  ChartBarStacked,
  CandlestickChartIcon,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
} from "recharts";
import * as XLSX from "xlsx";

const toNumber = (input) => {
  if (input === null || input === undefined) return 0;
  let s = String(input).trim();
  s = s.replace(/\s/g, "").replace(/%/g, "").replace(/,/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
};

const formatMarketCap = (value) => {
  const number = toNumber(value);
  if (number >= 1_000_000_000_000) {
    return `${(number / 1_000_000_000_000).toFixed(1)} T`;
  } else if (number >= 1_000_000_000) {
    return `${(number / 1_000_000_000).toFixed(1)} B`;
  } else if (number >= 1_000_000) {
    return `${(number / 1_000_000).toFixed(1)} M`;
  }
  return number.toLocaleString();
};

const loadExcelData = async (filename) => {
  try {
    // console.log(`Attempting to load ${filename}...`);
    
    // Try fetch from public folder (for local development)
    const response = await fetch(`/${filename}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - File ${filename} not found in public folder`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    // console.log(`${filename} loaded, size: ${arrayBuffer.byteLength} bytes`);
    
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    // console.log(`${filename} - Sheet name: ${sheetName}`);
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    // console.log(`${filename} - Rows parsed: ${jsonData.length}`);
    
    return jsonData;
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return [];
  }
};

const loadCSVData = async (filename) => {
  try {
    // console.log(`Attempting to load CSV ${filename}...`);
    
    const response = await fetch(`/${filename}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - File ${filename} not found`);
    }
    
    const text = await response.text();
    // console.log(`${filename} loaded, size: ${text.length} characters`);
    
    // Simple CSV parser
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    // console.log(`${filename} - Headers:`, headers);
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    // console.log(`${filename} - Rows parsed: ${data.length}`);
    return data;
  } catch (error) {
    console.error(`Error loading CSV ${filename}:`, error.message);
    return [];
  }
};

const processFinancialData = (revenueData, profitData, stockScreenerData, csvPriceData) => {
  const stockMap = {};
  
  // Process revenue data
  revenueData.forEach((row) => {
    const stockCode = row["Kode Saham"];
    if (!stockCode) return;
    
    if (!stockMap[stockCode]) {
      stockMap[stockCode] = {
        code: stockCode,
        name: `Perusahaan ${stockCode}`,
        price: 0,
        change: 0,
        sector: "Unknown",
        marketCap: "Unknown",
        volume: "Unknown",
        financialData: {
          revenue: [],
          profit: [],
          assets: [],
          ratios: [],
        },
      };
    }
    
    // Extract revenue by year
    const years = Object.keys(row).filter(key => !isNaN(key) && key !== "No");
    years.forEach(year => {
      const value = toNumber(row[year]);
      if (value > 0) {
        stockMap[stockCode].financialData.revenue.push({
          year: year,
          value: value, // Convert to billions
        });
      }
    });
  });
  
  // Process profit data
  profitData.forEach((row) => {
    const stockCode = row["Kode Saham"];
    if (!stockCode || !stockMap[stockCode]) return;
    
    const years = Object.keys(row).filter(key => !isNaN(key) && key !== "No");
    years.forEach(year => {
      const value = toNumber(row[year]);
      if (value > 0) {
        stockMap[stockCode].financialData.profit.push({
          year: year,
          value: value, // Convert to billions
        });
      }
    });
  });
  
  // Process CSV price data (stockrankpercentage.csv)
  if (csvPriceData && csvPriceData.length > 0) {
    // console.log("Processing CSV price data...");
    csvPriceData.forEach((row) => {
      const stockCode = row["Code"] || row["Kode"] || row["code"];
      if (stockCode && stockMap[stockCode]) {
        // Update price, volume, and change from CSV
        stockMap[stockCode].price = toNumber(row["Last"] || row["Price"] || row["last"] || row["price"]);
        stockMap[stockCode].change = toNumber(row["Change"] || row["change"] || row["Chg"]);
        stockMap[stockCode].volume = row["Volume"] || row["volume"] || row["Vol"] || "Unknown";
        
        // console.log(`Updated ${stockCode}: Price=${stockMap[stockCode].price}, Change=${stockMap[stockCode].change}%, Volume=${stockMap[stockCode].volume}`);
      }
    });
  }
  
  // Process stock screener data for current prices and ratios
  if (stockScreenerData && stockScreenerData.length > 0) {
    stockScreenerData.forEach((row) => {
      const stockCode = row["Kode Saham"];
      if (stockCode && stockMap[stockCode]) {
        stockMap[stockCode].name = row["Nama Perusahaan"] || stockMap[stockCode].name;
        
        // Only update price if not already set from CSV
        if (stockMap[stockCode].price === 0) {
          stockMap[stockCode].price = toNumber(row["Price"]);
        }
        if (stockMap[stockCode].change === 0) {
          stockMap[stockCode].change = toNumber(row["Change"]);
        }
        
        stockMap[stockCode].sector = row["Sektor"] || "Unknown";
        stockMap[stockCode].marketCap = row["Mkt Cap"] || "Unknown";
        
        if (stockMap[stockCode].volume === "Unknown") {
          stockMap[stockCode].volume = row["Volume"] || "Unknown";
        }
        
        // Add ratios if available
        const year = row["Year"] || "2024";
        if (stockMap[stockCode].financialData.ratios.length === 0 || 
            stockMap[stockCode].financialData.ratios[stockMap[stockCode].financialData.ratios.length - 1].year !== year) {
          stockMap[stockCode].financialData.ratios.push({
            year: year,
            ROE: toNumber(row["ROE %"]) || 15.5,
            PER: toNumber(row["PER"]) || 12.5,
            PBV: toNumber(row["PBV"]) || 2.1,
            DER: toNumber(row["DER"]) || 0.75,
          });
        }
      }
    });
  }
  
  // Generate assets and additional ratios based on revenue
  Object.keys(stockMap).forEach(code => {
    const stock = stockMap[code];
    
    // Generate assets (assuming assets = revenue * 5 as rough estimate)
    stock.financialData.assets = stock.financialData.revenue.map(rev => ({
      year: rev.year,
      value: rev.value * 5,
    }));
    
    // If no ratios exist, generate mock ratios
    if (stock.financialData.ratios.length === 0) {
      stock.financialData.revenue.forEach(rev => {
        stock.financialData.ratios.push({
          year: rev.year,
          ROE: 15.5 + Math.random() * 5,
          PER: 12.5 - Math.random() * 3,
          PBV: 2.1 + Math.random() * 0.5,
          DER: 0.75 - Math.random() * 0.1,
        });
      });
    }
  });
  
  return stockMap;
};

const StockDetailPage = () => {
  const [stockData, setStockData] = useState({});
  const [selectedStock, setSelectedStock] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [showValues, setShowValues] = useState(true);
  const [loading, setLoading] = useState(true);
   const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // console.log("Starting to load Excel files...");
        
        const [revenueData, profitData, screenerData, csvPriceData] = await Promise.all([
          loadExcelData("data/revenue-saham.xlsx"),
          loadExcelData("data/netprofit-saham.xlsx"),
          loadExcelData("data/IDX-Stock-Screener-06Sep2025.xlsx").catch(() => []),
          loadCSVData("data/stockrankpercentage.csv").catch(() => []),
        ]);
        
        // console.log("Revenue data loaded:", revenueData.length, "rows");
        // console.log("Profit data loaded:", profitData.length, "rows");
        // console.log("Screener data loaded:", screenerData.length, "rows");
        // console.log("CSV Price data loaded:", csvPriceData.length, "rows");
        
        if (revenueData.length === 0 && profitData.length === 0) {
          console.error("No data loaded from Excel files!");
          alert("Tidak dapat memuat file Excel. Pastikan file berada di folder public/data/");
        }
        
        const processedData = processFinancialData(revenueData, profitData, screenerData, csvPriceData);
        // console.log("Processed stocks:", Object.keys(processedData));
        setStockData(processedData);
        
        // Set first stock as default or use URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        const stockParam = window.location.pathname.split('/').pop()?.toUpperCase();
        
        if (stockParam && processedData[stockParam]) {
          setSelectedStock(stockParam);
        } else {
          const firstStock = Object.keys(processedData)[0];
          if (firstStock) {
            setSelectedStock(firstStock);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        alert(`Error: ${error.message}`);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

    const options = Object.keys(stockData).map((code) => ({
    value: code,
    label: `${code} - ${stockData[code].name}`,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stockData || Object.keys(stockData).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-xl text-gray-600">No stock data available</div>
      </div>
    );
  }

  const stock = stockData[selectedStock];
  if (!stock) return <div>Stock not found</div>;

const formatCurrency = (value) => {
  // console.log("Nilai yang diterima:", value); // Tambahkan log untuk memeriksa nilai yang diterima

  if (value >= 1000000000000) { // 1 Triliun
    return `${(value / 1000000000000).toFixed(1)}T`;
  } else if (value >= 1000000000) { // 1 Miliar
    return `${(value / 1000000000).toFixed(1)}M`;
  } else if (value >= 1000000) { // 1 Juta
    return `${(value / 1000000).toFixed(1)}Jt`;
  } else if (value >= 1000) { // 1 Ribu
    return `${(value / 1000).toFixed(1)}Rb`;
  }
  return value.toFixed(1); // Untuk angka yang lebih kecil dari 1000
};


  const formatNumber = (value) => {
    return value.toLocaleString("id-ID");
  };

  const revenueVsProfit = stock.financialData.revenue.map((item) => {
    const profitItem = stock.financialData.profit.find(p => p.year === item.year);
    return {
      year: item.year,
      revenue: item.value,
      profit: profitItem ? profitItem.value : 0,
    };
  });

  const latestRatios = stock.financialData.ratios[stock.financialData.ratios.length - 1] || {
    ROE: 0, PER: 0, PBV: 0, DER: 0
  };

  //Back
  const handleBackClick = () => {
    navigate("/");
  };


  const generateCandlestickData = () => {
  const data = [];
  const startDate = new Date('2025-06-01');
  
  // Generate 30 hari agar lebih terlihat
  for (let i = 0; i < 30; i++) {
    const base = 1000 + Math.sin(i / 3) * 50;
    const volatility = 30;
    
    const open = base + (Math.random() - 0.5) * volatility;
    const close = base + (Math.random() - 0.5) * volatility;
    
    // Pastikan high lebih tinggi dari max(open, close)
    // Dan low lebih rendah dari min(open, close)
    const high = Math.max(open, close) + Math.random() * 20 + 10;
    const low = Math.min(open, close) - Math.random() * 20 - 10;
    
    data.push({
      date: new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
        .toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      open: Math.round(open),
      high: Math.round(high),
      low: Math.round(low),
      close: Math.round(close),
      volume: Math.round((10 + Math.random() * 50) * 1000000),
    });
  }

  return data;
};

 const Candlestick = (props) => {
  const { x, y, width, height, payload } = props;
  const { open, close, high, low } = payload;
  
  if (!open || !close || !high || !low) return null;
  
  const isGreen = close >= open;
  const color = isGreen ? '#22c55e' : '#ef4444';
  
  // PENTING: Nilai ini HARUS SAMA dengan domain di YAxis
  const minPrice = 900;
  const maxPrice = 1100;
  const yScale = height / (maxPrice - minPrice);
  
  const candleWidth = Math.min(width * 0.6, 12);
  const xCenter = x + width / 2;
  
  // Konversi harga ke koordinat pixel
  const yHigh = y + height - (high - minPrice) * yScale;
  const yLow = y + height - (low - minPrice) * yScale;
  const yOpen = y + height - (open - minPrice) * yScale;
  const yClose = y + height - (close - minPrice) * yScale;
  const bodyHeight = Math.abs(yClose - yOpen);
  
  return (
    <g>
      {/* Sumbu/Wick */}
      <line
        x1={xCenter}
        y1={yHigh}
        x2={xCenter}
        y2={yLow}
        stroke={color}
        strokeWidth={1.5}
      />
      {/* Badan Candle */}
      <rect
        x={xCenter - candleWidth / 2}
        y={Math.min(yOpen, yClose)}
        width={candleWidth}
        height={Math.max(bodyHeight, 1)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};


// Custom Tooltip (opsional, tapi recommended)
const CandlestickTooltip = ({ active, payload }) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const change = data.close - data.open;
    const changePercent = ((change / data.open) * 100).toFixed(2);
    
    return (
      <div className="bg-white text-gray-800 p-3 border border-gray-300 rounded shadow-lg text-xs">
        <p className="font-bold mb-2">{data.date}</p>
        <div className="space-y-1">
          <p>Open: <span className="font-semibold">{data.open?.toLocaleString()}</span></p>
          <p>High: <span className="font-semibold">{data.high?.toLocaleString()}</span></p>
          <p>Low: <span className="font-semibold">{data.low?.toLocaleString()}</span></p>
          <p>Close: <span className="font-semibold">{data.close?.toLocaleString()}</span></p>
          <p className={change >= 0 ? 'text-green-600' : 'text-red-600'}>
            {change > 0 ? '+' : ''}{change} ({changePercent}%)
          </p>
          <p className="text-gray-600">Vol: {(data.volume / 1000000).toFixed(1)}M</p>
        </div>
      </div>
    );
  }
  return null;
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="px-4 py-8 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
          onClick={handleBackClick}
          className="flex items-center px-4 py-2 mr-6 text-gray-600 transition-colors bg-white rounded-lg shadow-sm hover:bg-gray-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Ranking
          </button>
          {/* <select
            value={selectedStock}
            onChange={(e) => setSelectedStock(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {Object.keys(stockData).map((code) => (
              <option key={code} value={code}>
                {code} - {stockData[code].name}
              </option>
            ))}
          </select> */}
            <Select
            value={options.find(option => option.value === selectedStock)}
            onChange={(e) => setSelectedStock(e.value)}
            options={options}
            className="w-72"
            placeholder="Pilih Stock..."
          />
        </div>

        {/* Stock Header Card */}
        <div className="p-8 mb-8 bg-white shadow-xl rounded-2xl">
          <div className="flex flex-col items-start justify-between lg:flex-row lg:items-center">
            <div className="flex items-center mb-6 lg:mb-0">
              <div className="flex items-center justify-center w-16 h-16 mr-6 text-white bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {stock.code}
                </h1>
                <p className="text-lg text-gray-600">{stock.name}</p>
                <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                  <span className="flex items-center">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    {stock.sector}
                  </span>
                  <span>Market Cap: {formatMarketCap(stock.marketCap)}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-4xl font-bold text-gray-900">
                Rp {formatNumber(stock.price)}
              </div>
              <div
                className={`flex items-center text-xl font-semibold ${
                  stock.change > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {stock.change > 0 ? (
                  <TrendingUp className="w-5 h-5 mr-2" />
                ) : (
                  <TrendingDown className="w-5 h-5 mr-2" />
                )}
                {stock.change > 0 ? "+" : ""}
                {stock.change}%
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
        { id: "overview", name: "Overview", icon: BarChart3 },
        { id: "charts", name: "Charts", icon: CandlestickChartIcon },
        { id: "financial", name: "Laporan Keuangan", icon: DollarSign },
        { id: "ratios", name: "Rasio Keuangan", icon: TrendingUp },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
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

        {activeTab === "charts" && (
  <div className="space-y-8">
    {/* Candlestick Chart */}
    <div className="p-6 bg-white shadow-lg rounded-xl">
      <h3 className="mb-6 text-xl font-semibold text-gray-900">Candlestick Chart</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={generateCandlestickData()}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            domain={[900, 1100]}  // ← PASTIKAN INI SESUAI
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CandlestickTooltip />} />
          <Bar dataKey="high" shape={<Candlestick />} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>

    {/* Opsional: Volume Chart */}
    <div className="p-6 bg-white shadow-lg rounded-xl">
      <h3 className="mb-6 text-xl font-semibold text-gray-900">Volume</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={generateCandlestickData()}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" />
          <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
          <Tooltip formatter={(value) => [`${(value / 1000000).toFixed(2)}M`, 'Volume']} />
          <Bar dataKey="volume" fill="#3b82f6" opacity={0.7} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
)}

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Revenue vs Profit Chart */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Pendapatan vs Laba Bersih (Miliar)
                </h3>
                <button
                  onClick={() => setShowValues(!showValues)}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  {showValues ? (
                    <EyeOff className="w-4 h-4 mr-1" />
                  ) : (
                    <Eye className="w-4 h-4 mr-1" />
                  )}
                  {showValues ? "Sembunyikan" : "Tampilkan"} Nilai
                </button>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueVsProfit}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value, name) => [
                      showValues ? `${formatCurrency(value)}` : "Hidden",
                      name === "revenue" ? "Pendapatan" : "Laba Bersih",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorProfit)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Rasio Terkini Pie Chart */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">
                Rasio Keuangan Terkini
              </h3>
              {(() => {
                const ratioData = [
                  { name: "ROE", value: latestRatios.ROE, color: "#3B82F6" },
                  { name: "PER", value: latestRatios.PER, color: "#10B981" },
                  { name: "PBV", value: latestRatios.PBV, color: "#F59E0B" },
                  { name: "DER", value: latestRatios.DER, color: "#EF4444" },
                ];

                return (
                  <>
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
                        <Tooltip formatter={(value) => [value.toFixed(2), ""]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      {ratioData.map((r, i) => (
                        <div key={i} className="flex items-center">
                          <span
                            className="inline-block w-4 h-4 mr-2 rounded"
                            style={{ backgroundColor: r.color }}
                          ></span>
                          <span className="text-sm text-gray-700">
                            {r.name}: {r.value.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === "financial" && (
          <div className="space-y-8">
            {/* Assets Growth */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">
                Perkembangan Aset (dalam Miliar)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stock.financialData.assets}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value) => [`${formatCurrency(value)}`, "Total Aset"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, stroke: "#8B5CF6", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue & Profit Comparison */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">
                Perbandingan Pendapatan & Laba (Miliar)
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={revenueVsProfit}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" tickFormatter={formatCurrency} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${formatCurrency(value)}`,
                      name === "revenue" ? "Pendapatan" : "Laba Bersih",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#3B82F6"
                    name="revenue"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="profit"
                    fill="#10B981"
                    name="profit"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "ratios" && (
          <div className="space-y-8">
            {/* ROE Trend */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">
                Tren ROE (Return on Equity)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stock.financialData.ratios}>
                  <defs>
                    <linearGradient id="colorROE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, "ROE"]} />
                  <Area
                    type="monotone"
                    dataKey="ROE"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorROE)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* All Ratios Comparison */}
            <div className="p-6 bg-white shadow-lg rounded-xl">
              <h3 className="mb-6 text-xl font-semibold text-gray-900">
                Perbandingan Semua Rasio
              </h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={stock.financialData.ratios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="year" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="ROE"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="ROE %"
                  />
                  <Line
                    type="monotone"
                    dataKey="PER"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="PER"
                  />
                  <Line
                    type="monotone"
                    dataKey="PBV"
                    stroke="#F59E0B"
                    strokeWidth={2}
                    name="PBV"
                  />
                  <Line
                    type="monotone"
                    dataKey="DER"
                    stroke="#EF4444"
                    strokeWidth={2}
                    name="DER"
                  />
                </LineChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 gap-6 mt-6 lg:grid-cols-4">
                {[
                  {
                    name: "ROE",
                    value: latestRatios.ROE,
                    suffix: "%",
                    color: "bg-blue-100 text-blue-800",
                    desc: "Return on Equity",
                  },
                  {
                    name: "PER",
                    value: latestRatios.PER,
                    suffix: "x",
                    color: "bg-green-100 text-green-800",
                    desc: "Price Earning Ratio",
                  },
                  {
                    name: "PBV",
                    value: latestRatios.PBV,
                    suffix: "x",
                    color: "bg-yellow-100 text-yellow-800",
                    desc: "Price to Book Value",
                  },
                  {
                    name: "DER",
                    value: latestRatios.DER,
                    suffix: "x",
                    color: "bg-red-100 text-red-800",
                    desc: "Debt to Equity Ratio",
                  },
                ].map((ratio, index) => (
                  <div key={index} className="p-4 rounded-lg bg-gray-50">
                    <div
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ratio.color}`}
                    >
                      {ratio.name}
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900">
                      {ratio.value.toFixed(2)}
                      {ratio.suffix}
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