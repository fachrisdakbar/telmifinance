// AdminPage.js
import React, { useState } from 'react';
import * as XLSX from "xlsx";
import Sidebar from '../../Components/Sidebar';

const AdminPage = ({ onFileUpload }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = () => {
    if (!file) return alert("Pilih file terlebih dahulu!");

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });

      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);

      onFileUpload(json); // Mengirim data ke parent (StockScreener)
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Konten Halaman Admin */}
      <div className="flex-1 p-6 bg-gray-100">
        <h2 className="mb-4 text-2xl font-semibold">Unggah Data Stock Screener</h2>
        
        <div className="p-6 bg-white rounded-lg shadow-sm">
          <div className="space-y-4">
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleFileUpload}
              className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Unggah File
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
