import React, { useState } from 'react';
import * as XLSX from "xlsx";
import { 
  Upload, FileSpreadsheet, CheckCircle, AlertCircle, Zap, BarChart3, TrendingUp,
  Menu, X, Home, Settings, Users, FileText, PieChart, Database, Bell, LogOut,
  Axis3dIcon,
  ChartBarStacked
} from 'lucide-react';

// Responsive Sidebar component
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const menuItems = [
    { icon: Home, label: 'Dashboard', active: false },
    { icon: Database, label: 'Admin Panel', active: true },
    { icon: BarChart3, label: 'Stock Data', active: false },
    { icon: PieChart, label: 'Broker Data', active: false },
    { icon: FileText, label: 'Economics Data', active: false },
    { icon: ChartBarStacked, label: 'Screener', active: false },
    { icon: Axis3dIcon, label: 'AI Screener', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50
        bg-gradient-to-b from-slate-900 to-slate-800 text-white
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 w-64' : '-translate-x-full lg:translate-x-0 lg:w-20'}
        lg:${isOpen ? 'w-64' : 'w-20'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`transition-all duration-300 ${!isOpen && 'lg:opacity-0 lg:w-0 lg:overflow-hidden'}`}>
                <h1 className="text-lg font-bold whitespace-nowrap">TFI Screener</h1>
                <p className="text-xs text-slate-400 whitespace-nowrap">Admin Portal</p>
              </div>
            </div>
            
            {/* Toggle button for desktop, close for mobile */}
            <button
              onClick={toggleSidebar}
              className="p-2 transition-colors border rounded-lg hover:bg-slate-700 bg-slate-800 border-slate-600"
            >
              {isOpen ? (
                <X className="w-5 h-5 text-white" />
              ) : (
                <Menu className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div
                  key={index}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer
                    transition-all duration-200 group relative
                    ${item.active 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg' 
                      : 'hover:bg-slate-700'
                    }
                  `}
                >
                  <IconComponent className={`w-5 h-5 flex-shrink-0 ${item.active ? 'text-white' : 'text-slate-300'}`} />
                  
                  <span className={`
                    font-medium transition-all duration-300
                    ${!isOpen ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}
                    ${item.active ? 'text-white' : 'text-slate-300'}
                    whitespace-nowrap
                  `}>
                    {item.label}
                  </span>

                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="absolute z-50 invisible hidden px-2 py-1 ml-2 text-sm text-white transition-all duration-200 rounded opacity-0 left-full bg-slate-800 group-hover:opacity-100 group-hover:visible whitespace-nowrap lg:block">
                      {item.label}
                    </div>
                  )}

                  {/* Active indicator */}
                  {item.active && (
                    <div className="absolute w-2 h-2 bg-white rounded-full right-2 animate-pulse" />
                  )}
                </div>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 px-3 py-2 transition-colors rounded-lg cursor-pointer hover:bg-slate-700">
              <LogOut className="flex-shrink-0 w-5 h-5 text-slate-400" />
              <span className={`
                text-slate-400 font-medium transition-all duration-300
                ${!isOpen ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'}
                whitespace-nowrap
              `}>
                Logout
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const AdminPage = () => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null); // 'success', 'error', null
  const [dragActive, setDragActive] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState([]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setUploadStatus(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setUploadStatus(null);
      }
    }
  };

  const handleFileUpload = async () => {
    if (!file) {
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload time
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: "array" });
        
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(ws);
        
        setData(json);
        setUploadStatus('success');
        setIsUploading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setUploadStatus('error');
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setUploadStatus(null);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}`}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b shadow-sm lg:hidden border-slate-200">
          <button
            onClick={toggleSidebar}
            className="p-2 transition-colors rounded-lg hover:bg-slate-100"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-gradient-to-r from-blue-500 to-purple-600">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">StockScreener</h1>
          </div>
          <div className="w-10" />
        </div>

        <div className="p-4 lg:p-8">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-transparent lg:text-3xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">
                    Admin Dashboard
                  </h1>
                  <p className="text-base text-slate-600 lg:text-lg">Upload dan kelola data stock screener dengan mudah</p>
                </div>
              </div>
              
              {/* Desktop toggle button */}
              <button
                onClick={toggleSidebar}
                className="items-center justify-center hidden p-3 transition-all duration-200 bg-white border rounded-xl lg:flex hover:shadow-lg hover:bg-slate-50 border-slate-200 group"
              >
                <Menu className="w-6 h-6 transition-transform text-slate-700 group-hover:scale-110" />
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
            <div className="p-6 transition-all duration-300 bg-white border shadow-sm rounded-xl border-slate-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Uploads</p>
                  <p className="text-2xl font-bold text-slate-800">247</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 transition-all duration-300 bg-white border shadow-sm rounded-xl border-slate-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Success Rate</p>
                  <p className="text-2xl font-bold text-slate-800">98.5%</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="p-6 transition-all duration-300 bg-white border shadow-sm rounded-xl border-slate-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">Data Points</p>
                  <p className="text-2xl font-bold text-slate-800">15.2K</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Upload Section */}
          <div className="overflow-hidden bg-white border shadow-sm rounded-2xl border-slate-200">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Upload Data Stock Screener</h2>
                  <p className="text-blue-100">Drag & drop file Excel atau pilih file dari komputer Anda</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* File Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : file 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isUploading}
                />

                {!file ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="mb-2 text-xl font-semibold text-slate-800">
                        {dragActive ? 'Drop file di sini!' : 'Upload File Excel'}
                      </p>
                      <p className="text-slate-500">
                        Drag & drop file .xlsx atau .xls atau <span className="font-medium text-blue-600">klik untuk pilih file</span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-800">{file.name}</p>
                      <p className="text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      <button
                        onClick={removeFile}
                        className="mt-2 text-sm font-medium text-red-500 hover:text-red-700"
                        disabled={isUploading}
                      >
                        Hapus file
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Messages */}
              {uploadStatus === 'success' && (
                <div className="flex items-center gap-3 p-4 mt-6 border border-green-200 rounded-lg bg-green-50">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="font-medium text-green-800">File berhasil diupload dan diproses!</p>
                </div>
              )}

              {uploadStatus === 'error' && (
                <div className="flex items-center gap-3 p-4 mt-6 border border-red-200 rounded-lg bg-red-50">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="font-medium text-red-800">
                    {!file ? 'Pilih file terlebih dahulu!' : 'Terjadi error saat upload file!'}
                  </p>
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={handleFileUpload}
                  disabled={!file || isUploading}
                  className={`px-8 py-3 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:opacity-50 ${
                    isUploading
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Upload className="w-5 h-5" />
                      Upload File
                    </div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tips Section */}
          <div className="p-6 mt-8 border bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 rounded-xl">
            <h3 className="mb-3 text-lg font-semibold text-amber-800">💡 Tips Upload File</h3>
            <ul className="space-y-2 text-amber-700">
              <li>• Pastikan file dalam format .xlsx atau .xls</li>
              <li>• Ukuran file maksimal 10MB</li>
              <li>• Pastikan data memiliki header yang jelas</li>
              <li>• Periksa format data sebelum upload</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;