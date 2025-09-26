import React, { useState, useEffect } from 'react';
import { Upload, RefreshCw, Download, TrendingUp, Database, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import Papa from 'papaparse';
import Sidebar from '../../../layouts/Sidebar'; // Pastikan Sidebar diimport dengan benar

function Stocks() {
  const [stockData, setStockData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [dataStats, setDataStats] = useState({
    totalStocks: 0,
    totalValue: 0,
    lastUpdate: null
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading existing data
      setTimeout(() => {
        const mockData = [
          {
            'Kode Saham': 'AADI',
            'Nama Perusahaan': 'Adaro Andalan Indonesia Tbk.',
            'Sebelumnya': '7600',
            'Penutupan': '7625',
            'Selisih': '25',
            'Volume': '15653800',
            'Nilai': '1.19498E+11'
          },
          {
            'Kode Saham': 'AALI', 
            'Nama Perusahaan': 'Astra Agro Lestari Tbk.',
            'Sebelumnya': '8200',
            'Penutupan': '8250',
            'Selisih': '50',
            'Volume': '3562000',
            'Nilai': '29139147500'
          }
        ];
        setStockData(mockData);
        updateStats(mockData);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error loading data:', error);
      setIsLoading(false);
    }
  };

  const updateStats = (data) => {
    const totalValue = data.reduce((sum, stock) => {
      const value = parseFloat(stock.Nilai) || 0;
      return sum + value;
    }, 0);
    
    setDataStats({
      totalStocks: data.length,
      totalValue: totalValue,
      lastUpdate: new Date().toLocaleString('id-ID')
    });
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      setSelectedFile(file);
      setUploadStatus(null);
    } else {
      setUploadStatus({ type: 'error', message: 'Please select a CSV or XLSX file' });
    }
  };

  const handleFileUpload = () => {
    if (!selectedFile) {
      setUploadStatus({ type: 'error', message: 'Please select a file first' });
      return;
    }

    setIsLoading(true);
    setUploadStatus({ type: 'loading', message: 'Processing file...' });

    if (selectedFile.name.endsWith('.csv')) {
      Papa.parse(selectedFile, {
        complete: (results) => {
          processUploadedData(results.data);
        },
        header: true,
        skipEmptyLines: true,
        error: (error) => {
          setUploadStatus({ type: 'error', message: `Error parsing CSV: ${error.message}` });
          setIsLoading(false);
        }
      });
    } else {
      // For XLSX files, we'll simulate processing
      setTimeout(() => {
        const mockNewData = [
          {
            'Kode Saham': 'BBCA',
            'Nama Perusahaan': 'Bank Central Asia Tbk.',
            'Sebelumnya': '10500',
            'Penutupan': '10550',
            'Selisih': '50',
            'Volume': '8945000',
            'Nilai': '94399750000'
          },
          {
            'Kode Saham': 'BMRI',
            'Nama Perusahaan': 'Bank Mandiri Tbk.',
            'Sebelumnya': '6200',
            'Penutupan': '6275',
            'Selisih': '75',
            'Volume': '12456000',
            'Nilai': '78159300000'
          }
        ];
        processUploadedData(mockNewData);
      }, 2000);
    }
  };

  const processUploadedData = (newData) => {
    try {
      // Clean headers by removing whitespace
      const cleanedData = newData.map(row => {
        const cleanRow = {};
        Object.keys(row).forEach(key => {
          const cleanKey = key.trim();
          cleanRow[cleanKey] = row[key];
        });
        return cleanRow;
      }).filter(row => row['Kode Saham']); // Filter out empty rows

      // Merge with existing data (replace if same stock code exists)
      const updatedData = [...stockData];
      cleanedData.forEach(newStock => {
        const existingIndex = updatedData.findIndex(stock => 
          stock['Kode Saham'] === newStock['Kode Saham']
        );
        if (existingIndex >= 0) {
          updatedData[existingIndex] = newStock;
        } else {
          updatedData.push(newStock);
        }
      });

      setStockData(updatedData);
      updateStats(updatedData);
      setUploadStatus({ 
        type: 'success', 
        message: `Successfully updated ${cleanedData.length} stocks!` 
      });
      setSelectedFile(null);
      
      // Clear the file input
      const fileInput = document.getElementById('file-input');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      setUploadStatus({ 
        type: 'error', 
        message: `Error processing data: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = () => {
    loadInitialData();
  };

  const formatNumber = (num) => {
    if (!num) return '0';
    const number = typeof num === 'string' ? parseFloat(num) : num;
    return new Intl.NumberFormat('id-ID').format(number);
  };

  const formatCurrency = (num) => {
    if (!num) return 'Rp 0';
    const number = typeof num === 'string' ? parseFloat(num) : num;
    return `Rp ${new Intl.NumberFormat('id-ID').format(number)}`;
  };

  const getChangeColor = (change) => {
    const value = parseFloat(change) || 0;
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-6">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}`}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Stock Data Management</h1>
              <p className="text-blue-200 text-lg">Real-time Indonesian Stock Market Data</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Stocks</p>
                <p className="text-3xl font-bold">{dataStats.totalStocks}</p>
              </div>
              <Database className="w-12 h-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Market Value</p>
                <p className="text-2xl font-bold">{formatCurrency(dataStats.totalValue)}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Last Update</p>
                <p className="text-lg font-bold">{dataStats.lastUpdate || 'Never'}</p>
              </div>
              <RefreshCw className="w-12 h-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 shadow-xl border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Upload Stock Data</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="relative">
                <input
                  id="file-input"
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileSelect}
                  className="block w-full text-white file:mr-4 file:py-3 file:px-6 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gradient-to-r file:from-blue-500 file:to-cyan-500 file:text-white hover:file:from-blue-600 hover:file:to-cyan-600 file:cursor-pointer bg-white/10 border border-white/20 rounded-lg p-3"
                />
              </div>

              <button
                onClick={handleFileUpload}
                disabled={!selectedFile || isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload & Update Data
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5" />
                  Supported Files
                </h3>
                <ul className="text-blue-200 text-sm space-y-1">
                  <li>• CSV files (.csv)</li>
                  <li>• Excel files (.xlsx)</li>
                  <li>• Stock screener exports</li>
                  <li>• Broker transaction files</li>
                </ul>
              </div>

              <button
                onClick={refreshData}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh Data
              </button>
            </div>
          </div>

          {/* Status Messages */}
          {uploadStatus && (
            <div className={`mt-6 p-4 rounded-lg border flex items-center gap-3 ${
              uploadStatus.type === 'success' 
                ? 'bg-green-500/20 border-green-500/40 text-green-100' 
                : uploadStatus.type === 'error'
                ? 'bg-red-500/20 border-red-500/40 text-red-100'
                : 'bg-blue-500/20 border-blue-500/40 text-blue-100'
            }`}>
              {uploadStatus.type === 'success' && <CheckCircle className="w-5 h-5" />}
              {uploadStatus.type === 'error' && <AlertCircle className="w-5 h-5" />}
              {uploadStatus.type === 'loading' && <RefreshCw className="w-5 h-5 animate-spin" />}
              <span>{uploadStatus.message}</span>
              {uploadStatus.type !== 'loading' && (
                <button
                  onClick={() => setUploadStatus(null)}
                  className="ml-auto hover:opacity-70"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-white/20">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Database className="w-6 h-6" />
              Current Stock Data ({stockData.length} stocks)
            </h2>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <RefreshCw className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-white text-lg">Loading stock data...</p>
                </div>
              </div>
            ) : stockData.length > 0 ? (
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-white font-medium">Stock Code</th>
                    <th className="px-6 py-4 text-left text-white font-medium">Company</th>
                    <th className="px-6 py-4 text-right text-white font-medium">Previous</th>
                    <th className="px-6 py-4 text-right text-white font-medium">Close</th>
                    <th className="px-6 py-4 text-right text-white font-medium">Change</th>
                    <th className="px-6 py-4 text-right text-white font-medium">Volume</th>
                    <th className="px-6 py-4 text-right text-white font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((stock, index) => (
                    <tr key={index} className="border-t border-white/10 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-blue-400 text-lg">
                          {stock['Kode Saham']}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white max-w-xs">
                        <span className="truncate block">
                          {stock['Nama Perusahaan']}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        {formatNumber(stock['Sebelumnya'])}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-medium">
                        {formatNumber(stock['Penutupan'])}
                      </td>
                      <td className={`px-6 py-4 text-right font-medium ${getChangeColor(stock['Selisih'])}`}>
                        {stock['Selisih'] > 0 ? '+' : ''}{formatNumber(stock['Selisih'])}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        {formatNumber(stock['Volume'])}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        {formatCurrency(stock['Nilai'])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Database className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                  <p className="text-white text-xl mb-2">No Stock Data Available</p>
                  <p className="text-gray-400">Upload a CSV or XLSX file to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Stocks;
