// import React, { useEffect, useMemo, useState } from "react";
// import {
//   ChevronLeft,
//   ChevronRight,
//   Play,
//   FlaskConicalIcon,
//   ArrowUpDown,
// } from "lucide-react";
// import { motion } from "framer-motion";
// import * as XLSX from "xlsx";
// import Navbar from "../Components/Navbar";
// import screenerXlsx from "/data/IDX-Stock-Screener-06Sep2025.xlsx";

// const COLUMNS = [
//   { id: "No", label: "No", type: "text" },
//   { id: "Nama Perusahaan", label: "Nama Perusahaan", type: "text" },
//   { id: "Kode Saham", label: "Kode Saham", type: "text" },
//   { id: "Kode Subindustri", label: "Kode Subindustri", type: "text" },
//   { id: "Sektor", label: "Sektor", type: "text" },
//   { id: "Subsektor", label: "Subsektor", type: "text" },
//   { id: "Industri", label: "Industri", type: "text" },
//   { id: "Subindustri", label: "Subindustri", type: "text" },
//   { id: "Index", label: "Index", type: "text" },
//   { id: "PER", label: "PER", type: "number" },
//   { id: "PBV", label: "PBV", type: "number" },
//   { id: "ROE %", label: "ROE %", type: "percent", unit: " %" },
//   { id: "ROA %", label: "ROA %", type: "percent", unit: " %" },
//   { id: "DER", label: "DER", type: "number" },
//   { id: "Mkt Cap", label: "Mkt Cap", type: "number", unit: "" },
//   { id: "Total Rev", label: "Total Rev", type: "number", unit: "" },
//   { id: "4-wk %Pr. Chg.", label: "4-wk %Pr. Chg.", type: "percent", unit: " %" },
//   { id: "13-wk %Pr. Chg.", label: "13-wk %Pr. Chg.", type: "percent", unit: " %" },
//   { id: "26-wk %Pr. Chg.", label: "26-wk %Pr. Chg.", type: "percent", unit: " %" },
//   { id: "52-wk %Pr. Chg.", label: "52-wk %Pr. Chg.", type: "percent", unit: " %" },
//   { id: "NPM %", label: "NPM %", type: "percent", unit: " %" },
//   { id: "MTD", label: "MTD", type: "percent", unit: " %" },
//   { id: "YTD", label: "YTD", type: "percent", unit: " %" },
// ];

// // Alias query
// const QUERY_ALIASES = {
//   ROE: "ROE %",
//   ROA: "ROA %",
//   PER: "PER",
//   PBV: "PBV",
//   DER: "DER",
//   "Mkt Cap": "Mkt Cap",
//   "Market Cap": "Mkt Cap",
//   Kode: "Kode Saham",
// };

// function toNumber(input) {
//   if (input === null || input === undefined) return 0;
//   let s = String(input).trim();
//   s = s.replace(/\s/g, "").replace(/%/g, "").replace(/,/g, "");
//   const n = parseFloat(s);
//   return isNaN(n) ? 0 : n;
// }

// function parseQuery(q) {
//   const parts = q
//     .split(/\bAND\b/i)
//     .map((p) => p.trim())
//     .filter(Boolean);
//   return parts
//     .map((cond) => {
//       const m = cond.match(/(.+?)\s*(>=|<=|=|>|<)\s*(-?\d+(?:\.\d+)?)/);
//       if (!m) return null;
//       let param = m[1].trim();
//       const op = m[2];
//       const val = parseFloat(m[3]);
//       if (QUERY_ALIASES[param]) param = QUERY_ALIASES[param];
//       return { parameter: param, operator: op, value: val };
//     })
//     .filter(Boolean);
// }

// function formatCell(val, type, unit = "") {
//   if (val === null || val === undefined) return "-";
//   if (type === "text") return String(val);
//   const num = typeof val === "number" ? val : toNumber(val);
//   if (!isFinite(num)) return "-";
//   if (type === "percent") return `${num.toFixed(2)}${unit}`;
//   return Number.isInteger(num)
//     ? num.toLocaleString()
//     : num.toLocaleString(undefined, { maximumFractionDigits: 2 });
// }

// // Syarat kelayakan ranking
// const qualifies = (row) =>
//   toNumber(row["PER"]) < 10 &&
//   toNumber(row["ROE %"]) > 10 &&
//   toNumber(row["PBV"]) < 1 &&
//   toNumber(row["DER"]) < 1;

// // Comparator ranking:
// // 1) ROE% makin besar makin baik
// // 2) PER makin kecil makin baik
// // 3) PBV makin kecil makin baik
// // 4) DER makin kecil makin baik
// const rankCompare = (a, b) => {
//   const roeDiff = toNumber(b["ROE %"]) - toNumber(a["ROE %"]);
//   if (roeDiff !== 0) return roeDiff;
//   const perDiff = toNumber(a["PER"]) - toNumber(b["PER"]);
//   if (perDiff !== 0) return perDiff;
//   const pbvDiff = toNumber(a["PBV"]) - toNumber(b["PBV"]);
//   if (pbvDiff !== 0) return pbvDiff;
//   return toNumber(a["DER"]) - toNumber(b["DER"]);
// };

// const StockScreener = () => {
//   const [rows, setRows] = useState([]);
//   const [filtered, setFiltered] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [query, setQuery] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
//   const [showQualifiedOnly, setShowQualifiedOnly] = useState(false);

//   // Pagination tabel utama
//   const perPage = 10;

//   // Pagination untuk Ranking Section
//   const [rankPage, setRankPage] = useState(1);
//   const rankPerPage = 10;

//   useEffect(() => {
//     const load = async () => {
//       try {
//         setLoading(true);

//         // Jika file di src/assets (menggunakan import screenerXlsx):
//         const res = await fetch(screenerXlsx);

//         // Jika file di /public, gunakan ini:
//         // const res = await fetch("/IDX-Stock-Screener-26Agt2025.xlsx");

//         if (!res.ok) throw new Error("Gagal memuat file XLSX dari assets/public");
//         const buf = await res.arrayBuffer();
//         const wb = XLSX.read(buf, { type: "array" });
//         const firstSheetName = wb.SheetNames[0];
//         const ws = wb.Sheets[firstSheetName];

//         // sheet_to_json akan membaca header dari baris pertama
//         const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

//         // Normalisasi agar sesuai COLUMNS
//         const normalized = data.map((r, i) => {
//           const obj = {};
//           COLUMNS.forEach((c) => {
//             const raw = r[c.id];
//             if (c.type === "number" || c.type === "percent") obj[c.id] = toNumber(raw);
//             else obj[c.id] = (raw ?? "").toString();
//           });
//           if (!obj["No"]) obj["No"] = String(i + 1);
//           return obj;
//         });

//         setRows(normalized);
//         setFiltered(normalized);
//         setLoading(false);
//       } catch (e) {
//         setError(e?.message || "Terjadi kesalahan saat memuat data");
//         setLoading(false);
//       }
//     };
//     load();
//   }, []);

//   // Ranking list global dari seluruh dataset
//   const qualifiedSorted = useMemo(() => {
//     return rows.filter(qualifies).sort(rankCompare);
//   }, [rows]);

//   // Peta: Kode Saham -> peringkat (1-based)
//   const rankMap = useMemo(() => {
//     const m = new Map();
//     qualifiedSorted.forEach((r, i) => {
//       m.set(r["Kode Saham"], i + 1);
//     });
//     return m;
//   }, [qualifiedSorted]);

//   // Pagination data Ranking
//   const rankTotalPages = Math.max(1, Math.ceil(qualifiedSorted.length / rankPerPage));
//   const rankSlice = useMemo(() => {
//     const start = (rankPage - 1) * rankPerPage;
//     return qualifiedSorted.slice(start, start + rankPerPage);
//   }, [qualifiedSorted, rankPage]);

//   const onSubmit = (e) => {
//     e.preventDefault();
//     if (!query.trim()) {
//       setFiltered(rows);
//       setCurrentPage(1);
//       return;
//     }
//     const conditions = parseQuery(query);
//     const out = rows.filter((row) => {
//       return conditions.every(({ parameter, operator, value }) => {
//         const col = row[parameter];
//         const n = typeof col === "number" ? col : toNumber(col);
//         switch (operator) {
//           case ">":
//             return n > value;
//           case "<":
//             return n < value;
//           case ">=":
//             return n >= value;
//           case "<=":
//             return n <= value;
//           case "=":
//             return Math.abs(n - value) < 1e-9;
//           default:
//             return true;
//         }
//       });
//     });
//     setFiltered(out);
//     setCurrentPage(1);
//   };

//   const handleSort = (key) => {
//     let direction = "asc";
//     if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
//     setSortConfig({ key, direction });

//     const colMeta = COLUMNS.find((c) => c.id === key);
//     const sorted = [...filtered].sort((a, b) => {
//       const av = a[key];
//       const bv = b[key];
//       if (colMeta?.type === "text") {
//         const as = (av ?? "").toString().toLowerCase();
//         const bs = (bv ?? "").toString().toLowerCase();
//         if (as < bs) return direction === "asc" ? -1 : 1;
//         if (as > bs) return direction === "asc" ? 1 : -1;
//         return 0;
//       } else {
//         const an = typeof av === "number" ? av : toNumber(av);
//         const bn = typeof bv === "number" ? bv : toNumber(bv);
//         if (an < bn) return direction === "asc" ? -1 : 1;
//         if (an > bn) return direction === "asc" ? 1 : -1;
//         return 0;
//       }
//     });
//     setFiltered(sorted);
//   };

//   // Data yang ditampilkan di tabel utama, tergantung toggle "Hanya yang Lulus Syarat"
//   const displayed = useMemo(() => {
//     return showQualifiedOnly ? filtered.filter(qualifies) : filtered;
//   }, [filtered, showQualifiedOnly]);

//   const totalPages = Math.max(1, Math.ceil(displayed.length / perPage));
//   const currentSlice = useMemo(() => {
//     const start = (currentPage - 1) * perPage;
//     return displayed.slice(start, start + perPage);
//   }, [displayed, currentPage]);

//   // Reset halaman ketika toggle filter ranking berubah
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [showQualifiedOnly]);

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center text-red-600">
//           <h2 className="mb-2 text-xl font-semibold">Error Loading Data</h2>
//           <p>{error}</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.5 }}
//       className="min-h-screen bg-gray-100"
//     >
//       <Navbar />

//       <div className="px-4 py-6 mx-auto max-w-7xl">
//         {/* RANKING SECTION with pagination */}
//         {qualifiedSorted.length > 0 && (
//           <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-xl font-semibold">
//                 Ranking Saham yang Lulus Syarat 
//                 {/* (PER&lt;10, ROE&gt;10%, PBV&lt;1, DER&lt;1) */}
//               </h3>
//               <span className="text-sm text-gray-500">
//                 Total: {qualifiedSorted.length.toLocaleString()} emiten
//               </span>
//             </div>

//             <div className="overflow-x-auto">
//               <table className="min-w-full divide-y divide-gray-200">
//                 <thead className="bg-gray-50">
//                   <tr>
//                     <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">#</th>
//                     <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Kode</th>
//                     <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Nama</th>
//                     <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">ROE %</th>
//                     <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">PER</th>
//                     <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">PBV</th>
//                     <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">DER</th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-gray-200">
//                   {rankSlice.map((r, i) => {
//                     const globalRank = (rankPage - 1) * rankPerPage + i + 1;
//                     return (
//                       <tr key={r["Kode Saham"] || globalRank} className="hover:bg-gray-50">
//                         <td className="px-4 py-2 text-sm">{globalRank}</td>
//                         <td className="px-4 py-2 text-sm font-medium">{r["Kode Saham"]}</td>
//                         <td className="px-4 py-2 text-sm">{r["Nama Perusahaan"]}</td>
//                         <td className="px-4 py-2 text-sm">{formatCell(r["ROE %"], "percent", " %")}</td>
//                         <td className="px-4 py-2 text-sm">{formatCell(r["PER"], "number")}</td>
//                         <td className="px-4 py-2 text-sm">{formatCell(r["PBV"], "number")}</td>
//                         <td className="px-4 py-2 text-sm">{formatCell(r["DER"], "number")}</td>
//                       </tr>
//                     );
//                   })}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination controls for ranking */}
//             <div className="flex items-center justify-center mt-3 space-x-4">
//               <button
//                 onClick={() => setRankPage((p) => Math.max(1, p - 1))}
//                 disabled={rankPage === 1}
//                 className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <ChevronLeft className="w-5 h-5" />
//               </button>
//               <span className="text-sm text-gray-600">
//                 Halaman {rankPage} dari {rankTotalPages}
//               </span>
//               <button
//                 onClick={() => setRankPage((p) => Math.min(rankTotalPages, p + 1))}
//                 disabled={rankPage === rankTotalPages}
//                 className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <ChevronRight className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         )}

//         <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
//           <h2 className="mb-4 text-2xl font-semibold">Buat Query Pencarian</h2>
//           <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
//             <div>
//               <form onSubmit={onSubmit} className="space-y-4 text-md">
//                 <div>
//                   <label className="block mb-1 font-medium text-gray-700 text-md">
//                     Query
//                   </label>
//                   <textarea
//                     value={query}
//                     onChange={(e) => setQuery(e.target.value)}
//                     placeholder={"Contoh: PER < 12 AND ROE % > 15"}
//                     className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-0.8 focus:ring-blue-600 focus:border-blue-600 outline-none"
//                   />
//                 </div>

//                 <div className="flex flex-wrap items-center gap-3">
//                   <button
//                     type="submit"
//                     className="inline-flex items-center px-4 py-2 font-medium text-white bg-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//                   >
//                     <Play className="mr-2" size={16} />
//                     JALANKAN QUERY
//                   </button>

//                   <button
//                     type="button"
//                     onClick={() => setShowQualifiedOnly((v) => !v)}
//                     className={`inline-flex items-center px-4 py-2 rounded-md border ${
//                       showQualifiedOnly
//                         ? "bg-green-600 text-white border-green-600"
//                         : "border-gray-300 text-gray-700"
//                     }`}
//                   >
//                     <FlaskConicalIcon size={18} className="mr-2" />
//                     {showQualifiedOnly ? "Tampilkan Semua" : "Hanya yang Lulus Syarat"}
//                   </button>
//                 </div>
//               </form>
//             </div>

//             <div className="flex flex-col items-start p-6 space-y-4 border border-blue-100 rounded-lg bg-blue-50">
//               <div>
//                 <h3 className="mb-3 text-xl font-semibold">Contoh Query Kustom</h3>
//                 <p className="mb-4 text-lg text-gray-600">
//                   PER &lt; 12 AND <br /> ROE % &gt; 15 AND <br /> PBV &lt; 2
//                 </p>
//                 <a
//                   href="#"
//                   onClick={(e) => e.preventDefault()}
//                   className="text-blue-600 hover:text-blue-700 hover:underline text-md"
//                 >
//                   Panduan membuat screen (coming soon)
//                 </a>
//               </div>

//               <button className="flex items-center px-4 py-2 text-gray-600 border border-gray-600 rounded-md hover:text-blue-700">
//                 <FlaskConicalIcon size={24} className="mr-2" />
//                 TAMPILKAN SEMUA RASIO
//               </button>
//             </div>
//           </div>
//         </div>

//         <motion.div
//           initial={{ y: 20, opacity: 0 }}
//           animate={{ y: 0, opacity: 1 }}
//           transition={{ delay: 0.2 }}
//           className="overflow-hidden bg-white rounded-lg shadow-sm"
//         >
//           <div className="overflow-x-auto">
//             <table className="min-w-full divide-y divide-gray-200">
//               <thead className="bg-gray-50">
//                 <tr>
//                   {COLUMNS.map((col) => (
//                     <th
//                       key={col.id}
//                       className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
//                       onClick={() => handleSort(col.id)}
//                     >
//                       <div className="flex items-center gap-2">
//                         {col.label}
//                         <ArrowUpDown size={16} />
//                       </div>
//                     </th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="bg-white divide-y divide-gray-200">
//                 {currentSlice.map((row, idx) => (
//                   <tr key={idx} className="hover:bg-gray-50">
//                     {COLUMNS.map((col) => {
//                       const content = formatCell(row[col.id], col.type, col.unit);

//                       if (col.id === "Kode Saham") {
//                         const rank = rankMap.get(row["Kode Saham"]);
//                         return (
//                           <td
//                             key={col.id}
//                             className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
//                           >
//                             <div className="flex items-center gap-2">
//                               <span className="font-medium">{content}</span>
//                               {rank && (
//                                 <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
//                                   Rank #{rank}
//                                 </span>
//                               )}
//                             </div>
//                           </td>
//                         );
//                       }

//                       return (
//                         <td
//                           key={col.id}
//                           className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
//                         >
//                           {content}
//                         </td>
//                       );
//                     })}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </motion.div>

//         <div className="flex items-center justify-center mt-4 space-x-4">
//           <button
//             onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//             disabled={currentPage === 1}
//             className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <ChevronLeft className="w-5 h-5" />
//           </button>
//           <span className="text-sm text-gray-600">
//             Halaman {currentPage} dari {totalPages}
//           </span>
//           <button
//             onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
//             disabled={currentPage === totalPages}
//             className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <ChevronRight className="w-5 h-5" />
//           </button>
//         </div>
//           <div className="px-6 py-3 text-xs text-gray-600 border-t">
//             <p>
//               <span className="font-semibold">Sumber: IDX</span>
//             </p>
//             <p>Data diupdate setiap hari.</p>
//           </div>
//       </div>
//     </motion.div>
//   );
// };

// export default StockScreener;
import React, { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  FlaskConicalIcon,
  ArrowUpDown,
} from "lucide-react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import Navbar from "../Components/Navbar";
import screenerXlsx from "/data/IDX-Stock-Screener-06Sep2025.xlsx";
import volumeXlsx from "/data/Ringkasan-Saham-20250912.xlsx"; // File untuk Volume dan Value

const COLUMNS = [
  { id: "No", label: "No", type: "text" },
  { id: "Nama Perusahaan", label: "Nama Perusahaan", type: "text" },
  { id: "Kode Saham", label: "Kode Saham", type: "text" },
  { id: "Kode Subindustri", label: "Kode Subindustri", type: "text" },
  { id: "Sektor", label: "Sektor", type: "text" },
  { id: "Subsektor", label: "Subsektor", type: "text" },
  { id: "Industri", label: "Industri", type: "text" },
  { id: "Subindustri", label: "Subindustri", type: "text" },
  { id: "Index", label: "Index", type: "text" },
  { id: "PER", label: "PER", type: "number" },
  { id: "PBV", label: "PBV", type: "number" },
  { id: "ROE %", label: "ROE %", type: "percent", unit: " %" },
  { id: "ROA %", label: "ROA %", type: "percent", unit: " %" },
  { id: "DER", label: "DER", type: "number" },
  { id: "Mkt Cap", label: "Mkt Cap", type: "number", unit: "" },
  { id: "Total Rev", label: "Total Rev", type: "number", unit: "" },
  { id: "4-wk %Pr. Chg.", label: "4-wk %Pr. Chg.", type: "percent", unit: " %" },
  { id: "13-wk %Pr. Chg.", label: "13-wk %Pr. Chg.", type: "percent", unit: " %" },
  { id: "26-wk %Pr. Chg.", label: "26-wk %Pr. Chg.", type: "percent", unit: " %" },
  { id: "52-wk %Pr. Chg.", label: "52-wk %Pr. Chg.", type: "percent", unit: " %" },
  { id: "NPM %", label: "NPM %", type: "percent", unit: " %" },
  { id: "MTD", label: "MTD", type: "percent", unit: " %" },
  { id: "YTD", label: "YTD", type: "percent", unit: " %" },
  { id: "Volume", label: "Volume", type: "number" }, // Kolom baru
  { id: "Nilai", label: "Value", type: "number" }, // Kolom baru
];

// Alias query
const QUERY_ALIASES = {
  ROE: "ROE %",
  ROA: "ROA %",
  PER: "PER",
  PBV: "PBV",
  DER: "DER",
  "Mkt Cap": "Mkt Cap",
  "Market Cap": "Mkt Cap",
  Kode: "Kode Saham",
  Volume: "Volume",
  Value: "Nilai",
};

function toNumber(input) {
  if (input === null || input === undefined) return 0;
  let s = String(input).trim();
  s = s.replace(/\s/g, "").replace(/%/g, "").replace(/,/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

function parseQuery(q) {
  const parts = q
    .split(/\bAND\b/i)
    .map((p) => p.trim())
    .filter(Boolean);
  return parts
    .map((cond) => {
      const m = cond.match(/(.+?)\s*(>=|<=|=|>|<)\s*(-?\d+(?:\.\d+)?)/);
      if (!m) return null;
      let param = m[1].trim();
      const op = m[2];
      const val = parseFloat(m[3]);
      if (QUERY_ALIASES[param]) param = QUERY_ALIASES[param];
      return { parameter: param, operator: op, value: val };
    })
    .filter(Boolean);
}

function formatCell(val, type, unit = "") {
  if (val === null || val === undefined) return "-";
  if (type === "text") return String(val);
  const num = typeof val === "number" ? val : toNumber(val);
  if (!isFinite(num)) return "-";
  if (type === "percent") return `${num.toFixed(2)}${unit}`;
  return Number.isInteger(num)
    ? num.toLocaleString()
    : num.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// Syarat kelayakan ranking
const qualifies = (row) =>
  toNumber(row["PER"]) < 10 &&
  toNumber(row["ROE %"]) > 10 &&
  toNumber(row["PBV"]) < 1 &&
  toNumber(row["DER"]) < 1;

// Comparator ranking:
// 1) ROE% makin besar makin baik
// 2) PER makin kecil makin baik
// 3) PBV makin kecil makin baik
// 4) DER makin kecil makin baik
const rankCompare = (a, b) => {
  const roeDiff = toNumber(b["ROE %"]) - toNumber(a["ROE %"]);
  if (roeDiff !== 0) return roeDiff;
  const perDiff = toNumber(a["PER"]) - toNumber(b["PER"]);
  if (perDiff !== 0) return perDiff;
  const pbvDiff = toNumber(a["PBV"]) - toNumber(b["PBV"]);
  if (pbvDiff !== 0) return pbvDiff;
  return toNumber(a["DER"]) - toNumber(b["DER"]);
};

const StockScreener = () => {
  const [rows, setRows] = useState([]);
  const [volumeData, setVolumeData] = useState(new Map()); // Map untuk data volume/value
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [showQualifiedOnly, setShowQualifiedOnly] = useState(false);

  // Pagination tabel utama
  const perPage = 10;

  // Pagination untuk Ranking Section
  const [rankPage, setRankPage] = useState(1);
  const rankPerPage = 10;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // Load file pertama (screener data)
        const res1 = await fetch(screenerXlsx);
        if (!res1.ok) throw new Error("Gagal memuat file screener XLSX");
        const buf1 = await res1.arrayBuffer();
        const wb1 = XLSX.read(buf1, { type: "array" });
        const firstSheetName1 = wb1.SheetNames[0];
        const ws1 = wb1.Sheets[firstSheetName1];
        const data1 = XLSX.utils.sheet_to_json(ws1, { defval: "" });

        // Load file kedua (volume data)
        const res2 = await fetch(volumeXlsx);
        if (!res2.ok) throw new Error("Gagal memuat file volume XLSX");
        const buf2 = await res2.arrayBuffer();
        const wb2 = XLSX.read(buf2, { type: "array" });
        const firstSheetName2 = wb2.SheetNames[0];
        const ws2 = wb2.Sheets[firstSheetName2];
        const data2 = XLSX.utils.sheet_to_json(ws2, { defval: "" });

        // Buat Map untuk data volume berdasarkan Kode Saham
        const volumeMap = new Map();
        data2.forEach(row => {
          const kode = row["Kode Saham"];
          if (kode) {
            volumeMap.set(kode, {
              Volume: toNumber(row["Volume"]),
              Nilai: toNumber(row["Nilai"])
            });
          }
        });
        setVolumeData(volumeMap);

        // Normalisasi data screener dan gabungkan dengan data volume
        const normalized = data1.map((r, i) => {
          const obj = {};
          COLUMNS.forEach((c) => {
            if (c.id === "Volume" || c.id === "Nilai") {
              // Ambil data dari volumeMap berdasarkan Kode Saham
              const kode = r["Kode Saham"];
              const volumeInfo = volumeMap.get(kode);
              if (volumeInfo) {
                obj[c.id] = volumeInfo[c.id] || 0;
              } else {
                obj[c.id] = 0;
              }
            } else {
              const raw = r[c.id];
              if (c.type === "number" || c.type === "percent") obj[c.id] = toNumber(raw);
              else obj[c.id] = (raw ?? "").toString();
            }
          });
          if (!obj["No"]) obj["No"] = String(i + 1);
          return obj;
        });

        setRows(normalized);
        setFiltered(normalized);
        setLoading(false);
      } catch (e) {
        setError(e?.message || "Terjadi kesalahan saat memuat data");
        setLoading(false);
      }
    };
    load();
  }, []);

  // Ranking list global dari seluruh dataset
  const qualifiedSorted = useMemo(() => {
    return rows.filter(qualifies).sort(rankCompare);
  }, [rows]);

  // Peta: Kode Saham -> peringkat (1-based)
  const rankMap = useMemo(() => {
    const m = new Map();
    qualifiedSorted.forEach((r, i) => {
      m.set(r["Kode Saham"], i + 1);
    });
    return m;
  }, [qualifiedSorted]);

  // Pagination data Ranking
  const rankTotalPages = Math.max(1, Math.ceil(qualifiedSorted.length / rankPerPage));
  const rankSlice = useMemo(() => {
    const start = (rankPage - 1) * rankPerPage;
    return qualifiedSorted.slice(start, start + rankPerPage);
  }, [qualifiedSorted, rankPage]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setFiltered(rows);
      setCurrentPage(1);
      return;
    }
    const conditions = parseQuery(query);
    const out = rows.filter((row) => {
      return conditions.every(({ parameter, operator, value }) => {
        const col = row[parameter];
        const n = typeof col === "number" ? col : toNumber(col);
        switch (operator) {
          case ">":
            return n > value;
          case "<":
            return n < value;
          case ">=":
            return n >= value;
          case "<=":
            return n <= value;
          case "=":
            return Math.abs(n - value) < 1e-9;
          default:
            return true;
        }
      });
    });
    setFiltered(out);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });

    const colMeta = COLUMNS.find((c) => c.id === key);
    const sorted = [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (colMeta?.type === "text") {
        const as = (av ?? "").toString().toLowerCase();
        const bs = (bv ?? "").toString().toLowerCase();
        if (as < bs) return direction === "asc" ? -1 : 1;
        if (as > bs) return direction === "asc" ? 1 : -1;
        return 0;
      } else {
        const an = typeof av === "number" ? av : toNumber(av);
        const bn = typeof bv === "number" ? bv : toNumber(bv);
        if (an < bn) return direction === "asc" ? -1 : 1;
        if (an > bn) return direction === "asc" ? 1 : -1;
        return 0;
      }
    });
    setFiltered(sorted);
  };

  // Data yang ditampilkan di tabel utama, tergantung toggle "Hanya yang Lulus Syarat"
  const displayed = useMemo(() => {
    return showQualifiedOnly ? filtered.filter(qualifies) : filtered;
  }, [filtered, showQualifiedOnly]);

  const totalPages = Math.max(1, Math.ceil(displayed.length / perPage));
  const currentSlice = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return displayed.slice(start, start + perPage);
  }, [displayed, currentPage]);

  // Reset halaman ketika toggle filter ranking berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [showQualifiedOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <h2 className="mb-2 text-xl font-semibold">Error Loading Data</h2>
          <p>{error}</p>
        </div>
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
        {/* RANKING SECTION with pagination */}
        {qualifiedSorted.length > 0 && (
          <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">
                Ranking Saham yang Lulus Syarat 
                {/* (PER&lt;10, ROE&gt;10%, PBV&lt;1, DER&lt;1) */}
              </h3>
              <span className="text-sm text-gray-500">
                Total: {qualifiedSorted.length.toLocaleString()} emiten
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Kode</th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Nama</th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">ROE %</th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">PER</th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">PBV</th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">DER</th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Volume</th>
                    <th className="px-4 py-2 text-xs font-medium text-left text-gray-500 uppercase">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rankSlice.map((r, i) => {
                    const globalRank = (rankPage - 1) * rankPerPage + i + 1;
                    return (
                      <tr key={r["Kode Saham"] || globalRank} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{globalRank}</td>
                        <td className="px-4 py-2 text-sm font-medium">{r["Kode Saham"]}</td>
                        <td className="px-4 py-2 text-sm">{r["Nama Perusahaan"]}</td>
                        <td className="px-4 py-2 text-sm">{formatCell(r["ROE %"], "percent", " %")}</td>
                        <td className="px-4 py-2 text-sm">{formatCell(r["PER"], "number")}</td>
                        <td className="px-4 py-2 text-sm">{formatCell(r["PBV"], "number")}</td>
                        <td className="px-4 py-2 text-sm">{formatCell(r["DER"], "number")}</td>
                        <td className="px-4 py-2 text-sm">{formatCell(r["Volume"], "number")}</td>
                        <td className="px-4 py-2 text-sm">{formatCell(r["Nilai"], "number")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination controls for ranking */}
            <div className="flex items-center justify-center mt-3 space-x-4">
              <button
                onClick={() => setRankPage((p) => Math.max(1, p - 1))}
                disabled={rankPage === 1}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-gray-600">
                Halaman {rankPage} dari {rankTotalPages}
              </span>
              <button
                onClick={() => setRankPage((p) => Math.min(rankTotalPages, p + 1))}
                disabled={rankPage === rankTotalPages}
                className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        <div className="p-6 mb-6 bg-white rounded-lg shadow-sm">
          <h2 className="mb-4 text-2xl font-semibold">Buat Query Pencarian</h2>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <form onSubmit={onSubmit} className="space-y-4 text-md">
                <div>
                  <label className="block mb-1 font-medium text-gray-700 text-md">
                    Query
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={"Contoh: PER < 12 AND ROE % > 15 AND Volume > 1000000"}
                    className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:ring-0.8 focus:ring-blue-600 focus:border-blue-600 outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 font-medium text-white bg-blue-600 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Play className="mr-2" size={16} />
                    JALANKAN QUERY
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowQualifiedOnly((v) => !v)}
                    className={`inline-flex items-center px-4 py-2 rounded-md border ${
                      showQualifiedOnly
                        ? "bg-green-600 text-white border-green-600"
                        : "border-gray-300 text-gray-700"
                    }`}
                  >
                    <FlaskConicalIcon size={18} className="mr-2" />
                    {showQualifiedOnly ? "Tampilkan Semua" : "Hanya yang Lulus Syarat"}
                  </button>
                </div>
              </form>
            </div>

            <div className="flex flex-col items-start p-6 space-y-4 border border-blue-100 rounded-lg bg-blue-50">
              <div>
                <h3 className="mb-3 text-xl font-semibold">Contoh Query Kustom</h3>
                <p className="mb-4 text-lg text-gray-600">
                  PER &lt; 12 AND <br /> ROE % &gt; 15 AND <br /> PBV &lt; 2 AND <br /> Volume &gt; 1000000
                </p>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-blue-600 hover:text-blue-700 hover:underline text-md"
                >
                  Panduan membuat screen (coming soon)
                </a>
              </div>

              <button className="flex items-center px-4 py-2 text-gray-600 border border-gray-600 rounded-md hover:text-blue-700">
                <FlaskConicalIcon size={24} className="mr-2" />
                TAMPILKAN SEMUA RASIO
              </button>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="overflow-hidden bg-white rounded-lg shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {COLUMNS.map((col) => (
                    <th
                      key={col.id}
                      className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase cursor-pointer"
                      onClick={() => handleSort(col.id)}
                    >
                      <div className="flex items-center gap-2">
                        {col.label}
                        <ArrowUpDown size={16} />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSlice.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    {COLUMNS.map((col) => {
                      const content = formatCell(row[col.id], col.type, col.unit);

                      if (col.id === "Kode Saham") {
                        const rank = rankMap.get(row["Kode Saham"]);
                        return (
                          <td
                            key={col.id}
                            className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{content}</span>
                              {rank && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 border border-green-200">
                                  Rank #{rank}
                                </span>
                              )}
                            </div>
                          </td>
                        );
                      }

                      return (
                        <td
                          key={col.id}
                          className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap"
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="flex items-center justify-center mt-4 space-x-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            Halaman {currentPage} dari {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
          <div className="px-6 py-3 text-xs text-gray-600 border-t">
            <p>
              <span className="font-semibold">Sumber: IDX</span>
            </p>
            <p>Data diupdate setiap hari.</p>
          </div>
      </div>
    </motion.div>
  );
};

export default StockScreener;
