import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx"; // Import XLSX to read Excel files
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react"; // Pagination and sorting icons
import { motion } from "framer-motion";
import Navbar from "../Components/Navbar";
import screenerXlsx from "/data/Ringkasan-Saham-20250912.xlsx"; // Make sure the path is correct

// Define columns for the data you want to display
const COLUMNS = [
  { id: "Ranking", label: "Ranking", type: "text" }, // Change "No" to "Ranking"
  { id: "Kode Saham", label: "Kode Saham", type: "text" },
  { id: "Nama Perusahaan", label: "Nama Perusahaan", type: "text" },
  // { id: "Remarks", label: "Remarks", type: "text" },
  // { id: "Sebelumnya", label: "Sebelumnya", type: "number" },
  // { id: "Open Price", label: "Open Price", type: "number" },
  // { id: "Tanggal Perdagangan Terakhir", label: "Tanggal Perdagangan Terakhir", type: "number" },
  // { id: "First Trade", label: "First Trade", type: "number" },
  // { id: "Tertinggi", label: "Tertinggi", type: "number" },
  // { id: "Terendah", label: "Terendah", type: "number" },
  // { id: "Penutupan", label: "Penutupan", type: "number" },
  // { id: "Selisih", label: "Selisih", type: "number" },
  { id: "Volume", label: "Volume", type: "number" },
  // { id: "Nilai", label: "Nilai", type: "number" },
  // { id: "Frekuensi", label: "Frekuensi", type: "number" },
  // { id: "Index Individual", label: "Index Individual", type: "number" },
  { id: "Offer", label: "Offer", type: "number" },
  { id: "Offer Volume", label: "Offer Volume", type: "number" },
  { id: "Bid", label: "Bid", type: "number" },
  { id: "Bid Volume", label: "Bid Volume", type: "number" },
  // { id: "Listed Shares", label: "Listed Shares", type: "number" },
  // { id: "Tradeble Shares", label: "Tradeble Shares", type: "number" },
  // { id: "Weight For Index", label: "Weight For Index", type: "number" },
  { id: "Foreign Sell", label: "Foreign Sell", type: "number" },
  { id: "Foreign Buy", label: "Foreign Buy", type: "number" },
  // { id: "Non Regular Volume", label: "Non Regular Volume", type: "number" },
  // { id: "Non Regular Value", label: "Non Regular Value", type: "number" },
  // { id: "Non Regular Frequency", label: "Non Regular Frequency", type: "number" },
];

// Function to convert string values to numbers (e.g. for volume, percentages, etc.)
function toNumber(input) {
  if (input === null || input === undefined) return 0;
  let s = String(input).trim();
  s = s.replace(/\s/g, "").replace(/%/g, "").replace(/,/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

const StockRankVolume = () => {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [topForeignBuyPage, setTopForeignBuyPage] = useState(1); // Page for top foreign buy
  const [topForeignSellPage, setTopForeignSellPage] = useState(1); // Page for top foreign sell
  const perPage = 10; // Number of rows per page for main table
  const perPageTop = 10; // Set perPage for top foreign buy/sell

  // Sort configuration state (which column and direction)
  const [sortConfig, setSortConfig] = useState({
    key: "Volume", // Default sort by Volume
    direction: "desc", // Default direction is descending
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetch(screenerXlsx); // Path to the XLSX file
        if (!res.ok) throw new Error("Failed to load Excel file");

        const buf = await res.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

        // Normalize and map the data into columns
        const normalized = data.map((r, i) => {
          const obj = {};
          COLUMNS.forEach((col) => {
            const raw = r[col.id];
            if (col.type === "number") obj[col.id] = toNumber(raw);
            else obj[col.id] = (raw ?? "").toString();
          });
          if (!obj["No"]) obj["No"] = String(i + 1);
          return obj;
        });

        setRows(normalized);
        setFiltered(normalized);
        setLoading(false);
      } catch (e) {
        setError(e?.message || "Error loading data");
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Sort the rows based on the column and direction specified in the sortConfig
  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const aValue = toNumber(a[sortConfig.key]);
      const bValue = toNumber(b[sortConfig.key]);

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [rows, sortConfig]);

  // Add ranking to sorted rows
  const rankedRows = useMemo(() => {
    return sortedRows.map((row, index) => {
      return { ...row, Ranking: index + 1 }; // Add the ranking based on sorted position
    });
  }, [sortedRows]);

  // Top Foreign Buy - Ensure it's calculated after rankedRows
  const topForeignBuy = useMemo(() => {
    if (!rankedRows || rankedRows.length === 0) return [];
    const sorted = [...rankedRows].sort((a, b) => toNumber(b["Foreign Buy"]) - toNumber(a["Foreign Buy"])); // Urutkan berdasarkan Foreign Buy

    // Tambahkan ranking dan ambil top 10
    return sorted.slice(0, 10).map((row, index) => ({
      ...row,
      Ranking: index + 1, // Menambahkan ranking berdasarkan urutan
    }));
  }, [rankedRows]);

  // Top Foreign Sell - Ensure it's calculated after rankedRows
  const topForeignSell = useMemo(() => {
    if (!rankedRows || rankedRows.length === 0) return [];
    const sorted = [...rankedRows].sort((a, b) => toNumber(b["Foreign Sell"]) - toNumber(a["Foreign Sell"])); // Urutkan berdasarkan Foreign Sell

    // Tambahkan ranking dan ambil top 10
    return sorted.slice(0, 10).map((row, index) => ({
      ...row,
      Ranking: index + 1, // Menambahkan ranking berdasarkan urutan
    }));
  }, [rankedRows]);

  // Pagination logic for main table
  const totalPages = Math.max(1, Math.ceil(rankedRows.length / perPage));
  const currentSlice = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return rankedRows.slice(start, start + perPage);
  }, [rankedRows, currentPage]);

  // Pagination for Top Foreign Buy
  const totalTopForeignBuyPages = Math.max(1, Math.ceil(topForeignBuy.length / perPageTop));
  const topForeignBuyPageData = useMemo(() => {
    const start = (topForeignBuyPage - 1) * perPageTop;
    return topForeignBuy.slice(start, start + perPageTop);
  }, [topForeignBuy, topForeignBuyPage]);

  // Pagination for Top Foreign Sell
  const totalTopForeignSellPages = Math.max(1, Math.ceil(topForeignSell.length / perPageTop));
  const topForeignSellPageData = useMemo(() => {
    const start = (topForeignSellPage - 1) * perPageTop;
    return topForeignSell.slice(start, start + perPageTop);
  }, [topForeignSell, topForeignSellPage]);

  // Handle sorting for columns
  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"; // Toggle direction if same column is clicked
    }
    setSortConfig({ key, direction });
  };

  // Handle Page Change for Top Foreign Buy
  const handleTopForeignBuyPageChange = (page) => setTopForeignBuyPage(page);

  // Handle Page Change for Top Foreign Sell
  const handleTopForeignSellPageChange = (page) => setTopForeignSellPage(page);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-red-600">
        <h2 className="text-xl font-semibold">Error Loading Data</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-100"
    >
      <Navbar />
      <div className="px-4 py-6 mx-auto max-w-7xl">
        <h1 className="mb-4 text-3xl font-bold">Stock Screener - Ranking by Volume</h1>

        {/* Main Table (Volume) */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                {COLUMNS.map((col) => (
                  <th
                    key={col.id}
                    className="px-6 py-3 text-xs font-medium text-left text-gray-500 cursor-pointer"
                    onClick={() => handleSort(col.id)} // Add click handler for sorting
                  >
                    {col.label}
                    {sortConfig.key === col.id && (
                      <ArrowUpDown
                        size={16}
                        className={sortConfig.direction === "asc" ? "transform rotate-180" : ""}
                      />
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {currentSlice.map((row) => (
                <tr key={row["Kode Saham"]} className="hover:bg-gray-50">
                  {COLUMNS.map((col) => (
                    <td key={col.id} className="px-6 py-4 text-sm text-gray-700">
                      {row[col.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination controls for Main Table */}
        <div className="flex items-center justify-center mt-4 space-x-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

{/* Top Foreign Buy Table with Pagination */}
<div className="mb-8 overflow-x-auto bg-white rounded-lg shadow-sm">
  <h2 className="mb-4 text-xl font-semibold">Top Foreign Buy</h2>
  <table className="min-w-full table-auto">
    <thead>
      <tr className="bg-gray-100">
        {/* Explicitly Render the Ranking Column */}
        <th className="px-6 py-3 text-xs font-medium text-left text-gray-500">Ranking</th>
        <th className="px-6 py-3 text-xs font-medium text-left text-gray-500">Kode Saham</th>
        <th className="px-6 py-3 text-xs font-medium text-left text-gray-500">Foreign Buy</th>
      </tr>
    </thead>
    <tbody>
      {topForeignBuyPageData.map((row, index) => (
        <tr key={row["Kode Saham"]} className="hover:bg-gray-50">
          {/* Explicitly Render the Ranking Column Value */}
          <td className="px-6 py-4 text-sm text-gray-700">{(topForeignBuyPage - 1) * perPageTop + index + 1}</td> {/* Adjusted ranking */}
          <td className="px-6 py-4 text-sm text-gray-700">{row["Kode Saham"]}</td>
          <td className="px-6 py-4 text-sm text-gray-700">{row["Foreign Buy"]}</td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* Pagination controls for Top Foreign Buy */}
  <div className="flex items-center justify-center mt-4 space-x-4">
    <button
      onClick={() => handleTopForeignBuyPageChange(Math.max(1, topForeignBuyPage - 1))}
      disabled={topForeignBuyPage === 1}
      className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <span className="text-sm text-gray-600">
      Page {topForeignBuyPage} of {totalTopForeignBuyPages}
    </span>
    <button
      onClick={() => handleTopForeignBuyPageChange(Math.min(totalTopForeignBuyPages, topForeignBuyPage + 1))}
      disabled={topForeignBuyPage === totalTopForeignBuyPages}
      className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
    >
      <ChevronRight className="w-5 h-5" />
    </button>
  </div>
</div>

{/* Top Foreign Sell Table with Pagination */}
<div className="overflow-x-auto bg-white rounded-lg shadow-sm">
  <h2 className="mb-4 text-xl font-semibold">Top Foreign Sell</h2>
  <table className="min-w-full table-auto">
    <thead>
      <tr className="bg-gray-100">
        {/* Explicitly Render the Ranking Column */}
        <th className="px-6 py-3 text-xs font-medium text-left text-gray-500">Ranking</th>
        <th className="px-6 py-3 text-xs font-medium text-left text-gray-500">Kode Saham</th>
        <th className="px-6 py-3 text-xs font-medium text-left text-gray-500">Foreign Sell</th>
      </tr>
    </thead>
    <tbody>
      {topForeignSellPageData.map((row, index) => (
        <tr key={row["Kode Saham"]} className="hover:bg-gray-50">
          {/* Explicitly Render the Ranking Column Value */}
          <td className="px-6 py-4 text-sm text-gray-700">{(topForeignSellPage - 1) * perPageTop + index + 1}</td> {/* Adjusted ranking */}
          <td className="px-6 py-4 text-sm text-gray-700">{row["Kode Saham"]}</td>
          <td className="px-6 py-4 text-sm text-gray-700">{row["Foreign Sell"]}</td>
        </tr>
      ))}
    </tbody>
  </table>

  {/* Pagination controls for Top Foreign Sell */}
  <div className="flex items-center justify-center mt-4 space-x-4">
    <button
      onClick={() => handleTopForeignSellPageChange(Math.max(1, topForeignSellPage - 1))}
      disabled={topForeignSellPage === 1}
      className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
    >
      <ChevronLeft className="w-5 h-5" />
    </button>
    <span className="text-sm text-gray-600">
      Page {topForeignSellPage} of {totalTopForeignSellPages}
    </span>
    <button
      onClick={() => handleTopForeignSellPageChange(Math.min(totalTopForeignSellPages, topForeignSellPage + 1))}
      disabled={topForeignSellPage === totalTopForeignSellPages}
      className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
    >
      <ChevronRight className="w-5 h-5" />
    </button>
  </div>
</div>
      </div>
    </motion.div>
  );
};

export default StockRankVolume;
