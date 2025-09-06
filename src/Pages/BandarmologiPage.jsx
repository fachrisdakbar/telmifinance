// BandarmologiPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../Components/Navbar";

// ===== Helpers =====
function toNumber(input) {
  if (input === null || input === undefined) return 0;
  let s = String(input).trim();
  s = s.replace(/\s/g, "").replace(/,/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}
const fmt = (n) => Number(n || 0).toLocaleString();
const rankCompareValue = (a, b) => b.totalValue - a.totalValue;
function matchesQuery(b, q) {
  const raw = q.trim().toLowerCase();
  if (!raw) return true;
  const tokens = raw.split(/[,\s]+/).filter(Boolean);
  const code = (b.code || "").toLowerCase();
  const name = (b.brokerName || "").toLowerCase();
  return tokens.every((t) => code.includes(t) || name.includes(t));
}

// ==== URL CSV (file dipindah ke public/data) ====
const ALLBROKER_URL = `${import.meta.env.BASE_URL}data/allbrokertrx.csv`;
const BROKSUM_URL   = `${import.meta.env.BASE_URL}data/broksum.csv`;

const BandarmologiPage = () => {
  // ========= Section 1: allbrokertrx.csv (Total Value ranking) =========
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [loadErr, setLoadErr] = useState(null);
  const perPage = 10;

  // ========= Section 2: broksum.csv (show all first, optional filter Sell Vol = 0) =========
  const [sumData, setSumData] = useState([]);
  const [sumLoading, setSumLoading] = useState(true);
  const [sumErr, setSumErr] = useState(null);
  const [sumPage, setSumPage] = useState(1);
  const sumPerPage = 10;
  const [sellZeroOnly, setSellZeroOnly] = useState(false); // toggle filter
  const [sumSort, setSumSort] = useState({ key: null, direction: "asc" }); // sort state

  // -------- Load allbrokertrx.csv --------
  useEffect(() => {
    Papa.parse(ALLBROKER_URL, {
      download: true,
      skipEmptyLines: true,
      complete: (result) => {
        try {
          const rows = result.data;
          const data = rows
            .slice(1)
            .map((row) => ({
              code: row[0],
              brokerName: row[1],
              totalBuy: toNumber(row[2]),
              totalSell: toNumber(row[3]),
              totalValue: toNumber(row[4]),
            }))
            .filter(
              (b) =>
                b.code &&
                b.brokerName &&
                (b.totalBuy || b.totalSell || b.totalValue)
            );

          data.sort(rankCompareValue);
          setBrokers(data);
          setFiltered(data);
        } catch (e) {
          setLoadErr("Gagal memproses allbrokertrx.csv");
          console.error(e);
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setLoadErr("Gagal memuat allbrokertrx.csv");
        setLoading(false);
        console.error(err);
      },
    });
  }, []);

  // -------- Load broksum.csv --------
  // Kolom (berdasarkan contoh):
  // 0: Code
  // 1: Net Val(M), 2: Net Vol
  // 3: Foreign Net Val(M), 4: Foreign Net Vol
  // 5: Buy Freq, 6: Buy Vol, 7: Buy Val(M), 8: Buy AVG
  // 9: Sell Freq, 10: Sell Vol, 11: Sell Val(M), 12: Sell AVG
  // 13: Frgn Buy Freq, 14: Frgn Buy Vol, 15: Frgn Buy Val(M), 16: Frgn Buy AVG
  // 17: Frgn Sell Freq, 18: Frgn Sell Vol, 19: Frgn Sell Val(M), 20: Frgn Sell AVG
  useEffect(() => {
    Papa.parse(BROKSUM_URL, {
      download: true,
      skipEmptyLines: true,
      complete: (result) => {
        try {
          // 1) bersihkan BOM/whitespace dan buang baris benar2 kosong
          const cleaned = result.data
            .map((row) =>
              Array.isArray(row)
                ? row.map((c) =>
                    typeof c === "string" ? c.replace(/\uFEFF/g, "").trim() : c
                  )
                : row
            )
            .filter(
              (row) =>
                Array.isArray(row) &&
                row.some((c) => String(c || "").trim() !== "")
            );

          // 2) cari index baris pertama yang tampak seperti kode saham (e.g. BUMI, KREN)
          const firstDataIdx = cleaned.findIndex((r) =>
            /^[A-Z]{2,5}$/.test(String(r?.[0] || ""))
          );

          // fallback kalau tidak ketemu, minimal buang 1 baris header
          const rows = cleaned.slice(firstDataIdx >= 0 ? firstDataIdx : 1);

          // 3) mapping kolom sesuai urutan CSV
          const data = rows
            .map((row) => ({
              code: row[0],
              netValM: toNumber(row[1]),
              netVol: toNumber(row[2]),
              frNetValM: toNumber(row[3]),
              frNetVol: toNumber(row[4]),
              buyFreq: toNumber(row[5]),
              buyVol: toNumber(row[6]),
              buyValM: toNumber(row[7]),
              buyAvg: toNumber(row[8]),
              sellFreq: toNumber(row[9]),
              sellVol: toNumber(row[10]),
              sellValM: toNumber(row[11]),
              sellAvg: toNumber(row[12]),
              fBuyFreq: toNumber(row[13]),
              fBuyVol: toNumber(row[14]),
              fBuyValM: toNumber(row[15]),
              fBuyAvg: toNumber(row[16]),
              fSellFreq: toNumber(row[17]),
              fSellVol: toNumber(row[18]),
              fSellValM: toNumber(row[19]),
              fSellAvg: toNumber(row[20]),
            }))
            // jaga2 kalau masih ada header sisa
            .filter((r) => r.code && /^[A-Z]{2,5}$/.test(r.code));

          setSumData(data);
        } catch (e) {
          setSumErr("Gagal memproses broksum.csv");
          console.error(e);
        } finally {
          setSumLoading(false);
        }
      },
      error: (err) => {
        setSumErr("Gagal memuat broksum.csv");
        setSumLoading(false);
        console.error(err);
      },
    });
  }, []);

  // ====== Section 1 pagination & search ======
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentSlice = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage]);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setFiltered([...brokers]);
      setCurrentPage(1);
      return;
    }
    const out = brokers.filter((b) => matchesQuery(b, query));
    setFiltered(out);
    setCurrentPage(1);
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    const sorted = [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      const isNumber = typeof av === "number" && typeof bv === "number";
      if (isNumber) {
        return direction === "asc" ? av - bv : bv - av;
      }
      const as = (av ?? "").toString().toLowerCase();
      const bs = (bv ?? "").toString().toLowerCase();
      if (as < bs) return direction === "asc" ? -1 : 1;
      if (as > bs) return direction === "asc" ? 1 : -1;
      return 0;
    });

    setFiltered(sorted);
    setCurrentPage(1);
  };

  // ====== Section 2: "Show all first" then filter Sell Vol = 0 ======
  // Saat filter aktif: hanya Sell Vol = 0 dan diurutkan Buy Vol desc.
  // Saat filter non-aktif: tampilkan semua baris, dengan sort sesuai klik header (default: Code asc).
  const sumDisplayed = useMemo(() => {
    let arr = [...sumData];
    if (sellZeroOnly) {
      arr = arr
        .filter((r) => r.sellVol === 0)
        .sort((a, b) => b.buyVol - a.buyVol);
      return arr;
    }
    // sort manual bila user klik header
    if (sumSort.key) {
      arr.sort((a, b) => {
        const av = a[sumSort.key];
        const bv = b[sumSort.key];
        const isNum = typeof av === "number" && typeof bv === "number";
        if (isNum) {
          return sumSort.direction === "asc" ? av - bv : bv - av;
        }
        const as = (av ?? "").toString().toLowerCase();
        const bs = (bv ?? "").toString().toLowerCase();
        if (as < bs) return sumSort.direction === "asc" ? -1 : 1;
        if (as > bs) return sumSort.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [sumData, sellZeroOnly, sumSort]);

  const sumTotalPages = Math.max(1, Math.ceil(sumDisplayed.length / sumPerPage));
  const sumSlice = useMemo(() => {
    const start = (sumPage - 1) * sumPerPage;
    return sumDisplayed.slice(start, start + sumPerPage);
  }, [sumDisplayed, sumPage]);

  const handleSumSort = (key) => {
    // Saat filter aktif (Sell Vol = 0), kita kunci sort = Buy Vol desc sesuai requirement
    if (sellZeroOnly) return;
    let direction = "asc";
    if (sumSort.key === key && sumSort.direction === "asc") direction = "desc";
    setSumSort({ key, direction });
    setSumPage(1);
  };

  // ===== Loading & Error (section 1) =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-b-2 border-blue-600 rounded-full animate-spin" />
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
        {/* Back Button */}
        <div className="mb-6 text-center">
          <Link
            to="/"
            className="inline-block px-6 py-2 text-lg text-white transition duration-300 transform bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 hover:scale-105"
          >
            Back to Stock Screener
          </Link>
        </div>

        <h1 className="mb-6 text-3xl font-semibold text-center text-blue-600">
          Bandarmologi Brokers — Rankings
        </h1>

        {/* =================== SECTION 1: Total Value Ranking =================== */}
        <div className="p-6 mb-8 bg-white rounded-lg shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">
            Ranking berdasarkan Total Value(K)
          </h2>

          {loadErr && (
            <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded bg-red-50">
              {loadErr}
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <form onSubmit={onSubmit}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari kode broker atau nama (contoh: AK, UBS, Mandiri)"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="w-full px-6 py-2 mt-4 text-white bg-green-600 rounded-md"
              >
                Search
              </button>
            </form>
          </div>

          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase">
                    #
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("brokerName")}
                  >
                    <div className="flex items-center gap-2">
                      Broker Name
                      <ArrowUpDown size={16} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("code")}
                  >
                    <div className="flex items-center gap-2">
                      Kode Broker
                      <ArrowUpDown size={16} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("totalBuy")}
                  >
                    <div className="flex items-center gap-2">
                      Total Buy(K)
                      <ArrowUpDown size={16} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("totalSell")}
                  >
                    <div className="flex items-center gap-2">
                      Total Sell(K)
                      <ArrowUpDown size={16} />
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                    onClick={() => handleSort("totalValue")}
                  >
                    <div className="flex items-center gap-2">
                      Total Value(K)
                      <ArrowUpDown size={16} />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentSlice.map((b, idx) => (
                  <tr key={`${b.code}-${idx}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">
                      {(currentPage - 1) * perPage + idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm">{b.brokerName}</td>
                    <td className="px-6 py-4 text-sm">{b.code}</td>
                    <td className="px-6 py-4 text-sm">{fmt(b.totalBuy)}</td>
                    <td className="px-6 py-4 text-sm">{fmt(b.totalSell)}</td>
                    <td className="px-6 py-4 text-sm">{fmt(b.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
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
        </div>

        {/* =================== SECTION 2: broksum (show all → optional filter Sell Vol = 0) =================== */}
        <div className="p-6 mb-8 bg-white rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Ringkasan Transaksi Harian</h2>

            <button
              onClick={() => {
                setSellZeroOnly((v) => !v);
                setSumPage(1);
              }}
              className={`px-4 py-2 rounded-md border ${
                sellZeroOnly
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-300 text-gray-700"
              }`}
              title="Filter hanya baris dengan Sell Vol = 0. Saat aktif, data diurutkan berdasarkan Buy Vol terbesar."
            >
              {sellZeroOnly ? "Filter: Sell Vol = 0 (ON)" : "Filter: Sell Vol = 0 (OFF)"}
            </button>
          </div>

          {sumErr && (
            <div className="p-3 mb-4 text-sm text-red-700 border border-red-200 rounded bg-red-50">
              {sumErr}
            </div>
          )}

          {sumLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-10 h-10 border-b-2 border-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase">
                        {sellZeroOnly ? "Rank" : "#"}
                      </th>

                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("code")}
                      >
                        <div className="flex items}{center gap-1">
                          Code {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>

                      {/* Net */}
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("netValM")}
                      >
                        <div className="flex items-center gap-1">
                          Net Val(M) {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("netVol")}
                      >
                        <div className="flex items-center gap-1">
                          Net Vol {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>

                      {/* Buy */}
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("buyFreq")}
                      >
                        <div className="flex items-center gap-1">
                          Buy Freq {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("buyVol")}
                      >
                        <div className="flex items-center gap-1">
                          Buy Vol {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("buyValM")}
                      >
                        <div className="flex items-center gap-1">
                          Buy Val(M) {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("buyAvg")}
                      >
                        <div className="flex items-center gap-1">
                          Buy AVG {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>

                      {/* Sell */}
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("sellFreq")}
                      >
                        <div className="flex items-center gap-1">
                          Sell Freq {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("sellVol")}
                      >
                        <div className="flex items-center gap-1">
                          Sell Vol {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("sellValM")}
                      >
                        <div className="flex items-center gap-1">
                          Sell Val(M) {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-xs font-medium text-left text-gray-500 uppercase cursor-pointer"
                        onClick={() => handleSumSort("sellAvg")}
                      >
                        <div className="flex items-center gap-1">
                          Sell AVG {!sellZeroOnly && <ArrowUpDown size={14} />}
                        </div>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-200">
                    {sumSlice.map((r, i) => {
                      const rowNo = (sumPage - 1) * sumPerPage + i + 1;
                      return (
                        <tr key={`${r.code}-${rowNo}`} className="hover:bg-gray-50">
                          <td className="px-3 py-2 text-sm">{rowNo}</td>
                          <td className="px-3 py-2 text-sm font-medium">{r.code}</td>
                          <td className="px-3 py-2 text-sm">{fmt(r.netValM)}</td>
                          <td className="px-3 py-2 text-sm">{fmt(r.netVol)}</td>

                          <td className="px-3 py-2 text-sm">{fmt(r.buyFreq)}</td>
                          <td className="px-3 py-2 text-sm">{fmt(r.buyVol)}</td>
                          <td className="px-3 py-2 text-sm">{fmt(r.buyValM)}</td>
                          <td className="px-3 py-2 text-sm">{fmt(r.buyAvg)}</td>

                          <td className="px-3 py-2 text-sm">{fmt(r.sellFreq)}</td>
                          <td className="px-3 py-2 text-sm">{fmt(r.sellVol)}</td>
                          <td className="px-3 py-2 text-sm">{fmt(r.sellValM)}</td>
                          <td className="px-3 py-2 text-sm">{fmt(r.sellAvg)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-center mt-4 space-x-4">
                <button
                  onClick={() => setSumPage((p) => Math.max(1, p - 1))}
                  disabled={sumPage === 1}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-600">
                  Halaman {sumPage} dari {sumTotalPages}
                </span>
                <button
                  onClick={() => setSumPage((p) => Math.min(sumTotalPages, p + 1))}
                  disabled={sumPage === sumTotalPages}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Catatan kecil */}
              <p className="mt-3 text-xs text-gray-500">
                Tip: Aktifkan filter “Sell Vol = 0” untuk menampilkan kandidat dengan{" "}
                <strong>Sell Vol = 0</strong> dan otomatis diurutkan menurut{" "}
                <strong>Buy Vol</strong> terbesar.
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default BandarmologiPage;
