import React, { useState } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../../layouts/Navbar";

export default function BrokerAccumulator() {
  const [files, setFiles] = useState([]);
  const [netBuyData, setNetBuyData] = useState([]);
  const [netSellData, setNetSellData] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Handle file upload and parse Excel data
  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files);
    const allData = [];

    for (const file of uploadedFiles) {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
      });

      // Extract date from filename (format: DD-MM-YYYY.xlsx)
      const dateMatch = file.name.match(/(\d{2}-\d{2}-\d{4})/);
      const fileDate = dateMatch ? dateMatch[1] : "";

      allData.push({
        fileName: file.name,
        date: fileDate,
        data: jsonData,
      });
    }

    setFiles(allData);
    processData(allData);
  };

  // Process and accumulate Net Buy and Net Sell data
  //   const processData = (filesData) => {
  //     const buyAccumulator = {};
  //     const sellAccumulator = {};
  //     let minDate = null;
  //     let maxDate = null;

  //     filesData.forEach(({ date, data }) => {
  //       const [day, month, year] = date.split('-');
  //       const dateObj = new Date(`${year}-${month}-${day}`);

  //       if (!minDate || dateObj < minDate) minDate = dateObj;
  //       if (!maxDate || dateObj > maxDate) maxDate = dateObj;

  //       let headerRow = -1;
  //       for (let i = 0; i < Math.min(10, data.length); i++) {
  //         const row = data[i];
  //         const rowStr = row.map(cell => (cell || '').toString().toLowerCase()).join('|');
  //         if (rowStr.includes('net buy') && rowStr.includes('net sell')) {
  //           headerRow = i;
  //           break;
  //         }
  //       }

  //       if (headerRow === -1) return;

  //       const headerRowData = data[headerRow];
  //       let netBuyCol = -1;
  //       let netSellCol = -1;

  //       for (let col = 0; col < headerRowData.length; col++) {
  //         const cellValue = (headerRowData[col] || '').toString().toLowerCase();
  //         if (cellValue.includes('net') && cellValue.includes('buy')) {
  //           netBuyCol = col;
  //         }
  //         if (cellValue.includes('net') && cellValue.includes('sell')) {
  //           netSellCol = col;
  //         }
  //       }

  //       let brokerHeaderRow = headerRow + 1;

  //       let buyBrokerCol = -1;
  //       let sellBrokerCol = -1;

  //       if (brokerHeaderRow < data.length) {
  //         const brokerRow = data[brokerHeaderRow];
  //         for (let col = 0; col < brokerRow.length; col++) {
  //           const cellValue = (brokerRow[col] || '').toString().toLowerCase().trim();
  //           if (cellValue === 'broker') {
  //             if (buyBrokerCol === -1 && col < netSellCol) {
  //               buyBrokerCol = col;
  //             } else if (sellBrokerCol === -1 && col >= netSellCol) {
  //               sellBrokerCol = col;
  //             }
  //           }
  //         }
  //       }

  //       console.log('Net Sell Column:', netSellCol)
  //       // Logging for Buy Accumulator
  //       if (buyBrokerCol >= 0) {
  //         for (let i = brokerHeaderRow + 1; i < data.length; i++) {
  //           const row = data[i];
  //           if (!row[buyBrokerCol]) continue;

  //           const broker = row[buyBrokerCol].toString().trim();
  //           if (!broker || broker.toLowerCase() === 'broker') continue;

  //           const volume = parseFloat(row[buyBrokerCol + 1]) || 0;
  //           const value = parseFloat(row[buyBrokerCol + 2]) || 0;

  //           if (volume > 0 && value > 0) {
  //             if (!buyAccumulator[broker]) {
  //               buyAccumulator[broker] = { volume: 0, value: 0, dates: [] };
  //             }
  //             buyAccumulator[broker].volume += volume;
  //             buyAccumulator[broker].value += value;
  //             if (!buyAccumulator[broker].dates.includes(date)) {
  //               buyAccumulator[broker].dates.push(date);
  //             }
  //           }
  //         }
  //       }

  //       // Logging for Sell Accumulator
  //  if (sellBrokerCol >= 0) {
  //         for (let i = brokerHeaderRow + 1; i < data.length; i++) {
  //           const row = data[i];
  //           if (!row[sellBrokerCol]) continue;
  //           const broker = row[sellBrokerCol].toString().trim();
  //           if (!broker || broker.toLowerCase() === 'broker') continue;

  //           const volume = parseFloat(row[sellBrokerCol + 1]) || 0;
  //           const value = parseFloat(row[sellBrokerCol + 2]) || 0;

  //           // Process sell data (volume/value might be negative)
  //           if (volume !== 0 && value !== 0) {
  //             if (!sellAccumulator[broker]) sellAccumulator[broker] = { volume: 0, value: 0, dates: [] };
  //             sellAccumulator[broker].volume += volume;
  //             sellAccumulator[broker].value += value;
  //             if (!sellAccumulator[broker].dates.includes(date)) sellAccumulator[broker].dates.push(date);
  //           }
  //         }
  //       }
  //     });

  const processData = (filesData) => {
    const buyAccumulator = {};
    const sellAccumulator = {};
    let minDate = null;
    let maxDate = null;

    // Helper untuk deteksi grup kolom: broker | volume | value
    function findBrokerGroups(row) {
      const groups = [];
      for (let i = 0; i < row.length - 2; i++) {
        const c1 = (row[i] || "").toString().trim().toLowerCase();
        const c2 = (row[i + 1] || "").toString().trim().toLowerCase();
        const c3 = (row[i + 2] || "").toString().trim().toLowerCase();

        if (c1 === "broker" && c2 === "volume" && c3 === "value") {
          groups.push({
            brokerCol: i,
            volumeCol: i + 1,
            valueCol: i + 2,
          });
        }
      }
      return groups;
    }

    filesData.forEach(({ date, data }) => {
      // Parsing tanggal
      const [day, month, year] = date.split("-");
      const dateObj = new Date(`${year}-${month}-${day}`);

      if (!minDate || dateObj < minDate) minDate = dateObj;
      if (!maxDate || dateObj > maxDate) maxDate = dateObj;

      // Cari baris header yang mengandung "net buy" & "net sell"
      let headerRow = -1;
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        const rowStr = row
          .map((cell) => (cell || "").toString().toLowerCase())
          .join("|");
        if (rowStr.includes("net buy") && rowStr.includes("net sell")) {
          headerRow = i;
          break;
        }
      }

      if (headerRow === -1) return;

      // Baris berikutnya berisi header broker BUY/SELL
      const header2 = data[headerRow + 1];
      if (!header2) return;

      const groups = findBrokerGroups(header2);

      // ========================
      //  SECTION BUY
      // ========================
      if (groups.length >= 1) {
        const buyCols = groups[0];

        for (let i = headerRow + 2; i < data.length; i++) {
          const row = data[i];

          const broker = (row[buyCols.brokerCol] || "").trim();
          if (!broker || broker.toLowerCase() === "broker") continue;

          const volume = parseFloat(row[buyCols.volumeCol]) || 0;
          const value = parseFloat(row[buyCols.valueCol]) || 0;

          if (volume > 0 && value > 0) {
            if (!buyAccumulator[broker]) {
              buyAccumulator[broker] = { volume: 0, value: 0, dates: [] };
            }
            buyAccumulator[broker].volume += volume;
            buyAccumulator[broker].value += value;

            if (!buyAccumulator[broker].dates.includes(date)) {
              buyAccumulator[broker].dates.push(date);
            }
          }
        }
      }

      // ========================
      //  SECTION SELL
      // ========================
      if (groups.length >= 2) {
        const sellCols = groups[1];

        for (let i = headerRow + 2; i < data.length; i++) {
          const row = data[i];

          const broker = (row[sellCols.brokerCol] || "").trim();
          if (!broker || broker.toLowerCase() === "broker") continue;

          const volume = parseFloat(row[sellCols.volumeCol]) || 0;
          const value = parseFloat(row[sellCols.valueCol]) || 0;

          // SELL biasanya nilai negatif / volume negatif
          if (volume !== 0 && value !== 0) {
            if (!sellAccumulator[broker]) {
              sellAccumulator[broker] = { volume: 0, value: 0, dates: [] };
            }
            sellAccumulator[broker].volume += volume;
            sellAccumulator[broker].value += value;

            if (!sellAccumulator[broker].dates.includes(date)) {
              sellAccumulator[broker].dates.push(date);
            }
          }
        }
      }
    });

    // Log to see buy and sell accumulators
    console.log("Buy Accumulator:", buyAccumulator);
    console.log("Sell Akum:", sellAccumulator);

    // Sorting and setting the net buy and sell data
    const buyArray = Object.entries(buyAccumulator)
      .map(([broker, data]) => ({
        broker,
        volume: data.volume,
        value: data.value,
        avg: data.value / data.volume,
        dates: [...new Set(data.dates)].sort(),
      }))
      .sort((a, b) => b.value - a.value);

    const sellArray = Object.entries(sellAccumulator)
      .map(([broker, data]) => ({
        broker,
        volume: data.volume,
        value: data.value,
        avg: data.value / data.volume,
        dates: [...new Set(data.dates)].sort(),
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

    setNetBuyData(buyArray);
    setNetSellData(sellArray);

    if (minDate && maxDate) {
      setDateRange({
        start: minDate.toLocaleDateString("id-ID"),
        end: maxDate.toLocaleDateString("id-ID"),
      });
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat("id-ID").format(Math.round(num));
  };

  const formatValue = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(2) + "T";
    if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
    return formatNumber(num);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100"
    >
      <Navbar />
      <br />
      <br />

      <div className="mx-auto max-w-7xl">
        <div className="p-8 mb-6 bg-white shadow-xl rounded-2xl">
          <h1 className="flex items-center gap-3 mb-2 text-3xl font-bold text-gray-800">
            <FileSpreadsheet className="text-indigo-600" size={36} />
            Kalkulator Akumulasi Broker
          </h1>
          <p className="mb-6 text-gray-600">
            Upload multiple file Excel untuk mengkalkulasi akumulasi Net Buy dan
            Net Sell
          </p>

          <div className="p-8 text-center transition-colors border-2 border-indigo-300 border-dashed rounded-xl hover:border-indigo-500">
            <Upload className="mx-auto mb-4 text-indigo-400" size={48} />
            <label className="cursor-pointer">
              <span className="inline-block px-6 py-3 text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700">
                Pilih File Excel
              </span>
              <input
                type="file"
                multiple
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="mt-4 text-sm text-gray-500">
              Format: DD-MM-YYYY.xlsx (contoh: 20-11-2025.xlsx)
            </p>
          </div>

          {files.length > 0 && (
            <div className="p-4 mt-6 rounded-lg bg-indigo-50">
              <h3 className="mb-2 font-semibold text-gray-700">
                File yang diupload:
              </h3>
              <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 text-sm text-gray-700 bg-white border border-indigo-200 rounded-full"
                  >
                    {file.fileName}
                  </span>
                ))}
              </div>
              {dateRange.start && (
                <p className="mt-3 text-sm text-gray-600">
                  Periode:{" "}
                  <span className="font-semibold">{dateRange.start}</span> s/d{" "}
                  <span className="font-semibold">{dateRange.end}</span>
                </p>
              )}
              {netBuyData.length > 0 && (
                <p className="mt-2 text-sm font-semibold text-green-600">
                  ✓ Data berhasil diproses: {netBuyData.length} broker Net Buy,{" "}
                  {netSellData.length} broker Net Sell
                </p>
              )}
            </div>
          )}
        </div>

        {(netBuyData.length > 0 || netSellData.length > 0) && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Net Buy Table */}
            <div className="p-6 bg-white shadow-xl rounded-2xl">
              <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-green-600">
                <TrendingUp size={28} />
                Net Buy (Top 20)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-green-200">
                      <th className="px-2 py-3 font-semibold text-left text-gray-700">
                        #
                      </th>
                      <th className="px-2 py-3 font-semibold text-left text-gray-700">
                        Broker
                      </th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">
                        Volume
                      </th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">
                        Value
                      </th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">
                        Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {netBuyData.slice(0, 20).map((item, idx) => (
                      <tr
                        key={idx}
                        className="transition-colors border-b border-gray-100 hover:bg-green-50"
                      >
                        <td className="px-2 py-3 font-bold text-green-600">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-3 font-semibold text-gray-800">
                          {item.broker}
                        </td>
                        <td className="px-2 py-3 text-right text-gray-700">
                          {formatNumber(item.volume)}
                        </td>
                        <td className="px-2 py-3 font-semibold text-right text-gray-800">
                          {formatValue(item.value)}
                        </td>
                        <td className="px-2 py-3 text-right text-gray-600">
                          {formatNumber(item.avg)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Sell Table */}
            <div className="p-6 bg-white shadow-xl rounded-2xl">
              <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-red-600">
                <TrendingDown size={28} />
                Net Sell (Top 20)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-red-200">
                      <th className="px-2 py-3 font-semibold text-left text-gray-700">
                        #
                      </th>
                      <th className="px-2 py-3 font-semibold text-left text-gray-700">
                        Broker
                      </th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">
                        Volume
                      </th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">
                        Value
                      </th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">
                        Avg
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {netSellData.slice(0, 20).map((item, idx) => (
                      <tr
                        key={idx}
                        className="transition-colors border-b border-gray-100 hover:bg-red-50"
                      >
                        <td className="px-2 py-3 font-bold text-red-600">
                          {idx + 1}
                        </td>
                        <td className="px-2 py-3 font-semibold text-gray-800">
                          {item.broker}
                        </td>
                        <td className="px-2 py-3 text-right text-gray-700">
                          {formatNumber(item.volume)}
                        </td>
                        <td className="px-2 py-3 font-semibold text-right text-gray-800">
                          {formatValue(item.value)}
                        </td>
                        <td className="px-2 py-3 text-right text-gray-600">
                          {formatNumber(item.avg)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
