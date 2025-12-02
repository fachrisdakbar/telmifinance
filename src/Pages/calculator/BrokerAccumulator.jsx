import React, { useMemo, useState } from "react";
import { read, utils } from "xlsx";
import { Upload, TrendingUp, TrendingDown, FileSpreadsheet } from "lucide-react";

/** =========================
 * Broker Groups + Colors
 * ========================= */
const BROKER_GROUPS = {
  "Bandar Asing": ["AK", "BK", "RX"],
  Foreign: ["ZP", "YU", "KZ","DR","RB","AG","FS","XA","CS","GW","DP","AI","LS","LH","AH","DU","MS","CG","TP","BQ","HD"],
  "Bandar Lokal": ["BB", "RF", "KI", "MG", "LG"],
  Zombie: ["SS", "PP", "IN", "PG", "FZ"],
  Smartmoney: ["RF", "AK", "BK", "BB", "DX", "ZP", "HP", "KZ", "RX"],
  Ritel: ["YP", "XC", "XL", "PD", "KK", "CP", "AZ"],
  BUMN: ["CC"],
  BUMD: ["SQ"],
  Lokal:["MK","BW","DB","HG","ML","PI","EL","MI","EP","IF","AZ","ZR","AN","MU","YJ","BJ","BJ","BM","TA","LK","BD","KW","PK","FM","KS","BR","RG","ES","ID","QA","SF","GA","PS","OK","JB","YB","TS","FG","PC","PP","AT","PO","AR","SA","FO","IT","SC","SD","SY","CM","FA","SP","WW","DS","SM","DG","BP","AY","KC","HK","IH","PG","GR","PF","DM","DH","SH","AD","BS","RO","AP","II","BZ","AF","DD","RS","AO","IU","BF","TX","YO","CD","IP","TF"]
};

const GROUP_COLORS = {
  // sesuai request lu:
  Smartmoney: "#22c55e",       // Hijau
  "Bandar Lokal": "#3b82f6",   // Biru
  "Bandar Asing": "#facc15",   // Kuning
  Foreign: "#f97316",          // Oren
  Ritel: "#ef4444",            // Merah
  BUMN: "#a855f7",             // Ungu
  Zombie: "#6b7280",           // Abu
  Lokal: "#52eeff",          // Pink

  // bonus: Djarum lu belum minta warnanya, jadi gw set netral (bisa lu ubah)
  BUMD: "#ffff",           // hitam/charcoal
};
const norm = (v) => String(v ?? "").toUpperCase().trim();

/** broker -> [groups] (supports overlap) */
const BROKER_TO_GROUPS = (() => {
  const map = {};
  for (const [group, codes] of Object.entries(BROKER_GROUPS)) {
    for (const c of codes) {
      const code = norm(c);
      (map[code] ||= []).push(group);
    }
  }
  for (const k of Object.keys(map)) map[k] = [...new Set(map[k])];
  return map;
})();

const getGroupsForBroker = (broker) => {
  const code = norm(broker);
  return BROKER_TO_GROUPS[code] || ["Unknown"];
};

/** =========================
 * Sankey Chart (with group filter)
 * ========================= */
const SankeyChart = ({ buyData = [], sellData = [], mode = "value" }) => {
  const getBrokerGroup = (broker) => {
    const code = norm(broker);
    for (const [group, list] of Object.entries(BROKER_GROUPS)) {
      if (list.includes(code)) return group;
    }
    return "Unknown";
  };

  const getBrokerColor = (broker) => {
    const group = getBrokerGroup(broker);
    return GROUP_COLORS[group] || GROUP_COLORS.Unknown;
  };

  const formatMini = (num) => {
    const n = Number(num || 0);
    const abs = Math.abs(n);
    if (abs >= 1e9) return (n / 1e9).toFixed(2) + " B";
    if (abs >= 1e6) return (n / 1e6).toFixed(2) + " M";
    if (abs >= 1e3) return (n / 1e3).toFixed(2) + " K";
    return n.toFixed(2);
  };

  const [activeGroup, setActiveGroup] = useState(null); // null = All

  const { filteredBuy, filteredSell } = useMemo(() => {
    if (!activeGroup) return { filteredBuy: buyData, filteredSell: sellData };
    const allowed = new Set(BROKER_GROUPS[activeGroup] || []);
    return {
      filteredBuy: (buyData || []).filter((x) => allowed.has(norm(x?.broker))),
      filteredSell: (sellData || []).filter((x) => allowed.has(norm(x?.broker))),
    };
  }, [buyData, sellData, activeGroup]);

  const topBuyers = (filteredBuy || []).slice(0, 7);
  const topSellers = (filteredSell || []).slice(0, 7);

  const chartHeight = 600;
  const margin = { top: 80, right: 140, bottom: 60, left: 140 };
  const nodeWidth = 20;
  const nodePadding = 20;
  const width = 1000;
  const innerHeight = chartHeight - margin.top - margin.bottom;

  const totalBuyValue = topBuyers.reduce(
    (sum, b) => sum + (mode === "value" ? Number(b?.value || 0) : Number(b?.volume || 0)),
    0
  );

  const totalSellValue = topSellers.reduce(
    (sum, s) => sum + Math.abs(mode === "value" ? Number(s?.value || 0) : Number(s?.volume || 0)),
    0
  );

  const maxTotal = Math.max(totalBuyValue, totalSellValue, 1);
  const noData = topBuyers.length === 0 || topSellers.length === 0;

  const clickableSpanBase =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition cursor-pointer select-none";

  const makeSpanA11y = (fn) => ({
    role: "button",
    tabIndex: 0,
    onClick: fn,
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") fn();
    },
  });

  return (
    <div className="w-full p-6 overflow-x-auto shadow-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-gray-300">
          Filter:{" "}
          <span className="font-semibold text-gray-100">{activeGroup ? activeGroup : "All"}</span>
        </div>

        {activeGroup && (
          <button
            type="button"
            onClick={() => setActiveGroup(null)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-600 bg-gray-800 text-gray-200 hover:border-gray-400 transition"
          >
            Clear
          </button>
        )}
      </div>

      {noData ? (
        <div className="w-full h-[420px] flex items-center justify-center text-gray-300">
          Tidak ada data untuk ditampilkan{activeGroup ? ` (filter: ${activeGroup})` : ""}.
        </div>
      ) : (
        <svg width={width} height={chartHeight} className="mx-auto">
          <defs>
            {topBuyers.map((buyer, i) =>
              topSellers.map((seller, j) => {
                const id = `gradient-${i}-${j}`;
                const buyColor = getBrokerColor(buyer?.broker);
                const sellColor = getBrokerColor(seller?.broker);
                return (
                  <linearGradient key={id} id={id} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={buyColor} stopOpacity="0.7" />
                    <stop offset="50%" stopColor={buyColor} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={sellColor} stopOpacity="0.7" />
                  </linearGradient>
                );
              })
            )}

            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255,255,255,0.03)"
                strokeWidth="1"
              />
            </pattern>
          </defs>

          <rect width={width} height={chartHeight} fill="url(#grid)" />

          <text
            x={margin.left - 20}
            y={margin.top - 30}
            textAnchor="start"
            className="text-lg font-bold fill-green-400"
            style={{ filter: "drop-shadow(0 0 6px rgba(34, 197, 94, 0.5))" }}
          >
            Buyer
          </text>
          <text
            x={width - margin.right + 20}
            y={margin.top - 30}
            textAnchor="end"
            className="text-lg font-bold fill-red-400"
            style={{ filter: "drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))" }}
          >
            Seller
          </text>

          {(() => {
            let currentBuyY = margin.top;
            const buyerPositions = topBuyers.map((buyer) => {
              const value = mode === "value" ? Number(buyer?.value || 0) : Number(buyer?.volume || 0);
              const height = (value / maxTotal) * innerHeight * 0.9;
              const safeHeight = Math.max(height, 8);
              const pos = { y: currentBuyY, height: safeHeight, value };
              currentBuyY += safeHeight + nodePadding;
              return pos;
            });

            let currentSellY = margin.top;
            const sellerPositions = topSellers.map((seller) => {
              const value = Math.abs(
                mode === "value" ? Number(seller?.value || 0) : Number(seller?.volume || 0)
              );
              const height = (value / maxTotal) * innerHeight * 0.9;
              const safeHeight = Math.max(height, 8);
              const pos = { y: currentSellY, height: safeHeight, value };
              currentSellY += safeHeight + nodePadding;
              return pos;
            });

            const safeTotalBuy = Math.max(totalBuyValue, 1);
            const safeTotalSell = Math.max(totalSellValue, 1);

            return (
              <>
                {/* Flows */}
                {topBuyers.map((buyer, buyerIdx) => {
                  const buyerPos = buyerPositions[buyerIdx];
                  const buyerValue =
                    mode === "value" ? Number(buyer?.value || 0) : Number(buyer?.volume || 0);

                  return topSellers.map((seller, sellerIdx) => {
                    const sellerPos = sellerPositions[sellerIdx];
                    const sellerValue = Math.abs(
                      mode === "value" ? Number(seller?.value || 0) : Number(seller?.volume || 0)
                    );

                    const flowRatio =
                      Math.min(buyerValue / safeTotalBuy, sellerValue / safeTotalSell) / topSellers.length;

                    const flowHeight = Math.max(flowRatio * innerHeight * 0.8, 2);

                    const x1 = margin.left + nodeWidth;
                    const x2 = width - margin.right;

                    const y1 = buyerPos.y + (buyerPos.height * sellerIdx) / topSellers.length;
                    const y2 = sellerPos.y + (sellerPos.height * buyerIdx) / topBuyers.length;

                    const cp1x = x1 + (x2 - x1) * 0.4;
                    const cp2x = x1 + (x2 - x1) * 0.6;

                    const path = `M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`;

                    return (
                      <path
                        key={`flow-${buyerIdx}-${sellerIdx}`}
                        d={path}
                        fill="none"
                        stroke={`url(#gradient-${buyerIdx}-${sellerIdx})`}
                        strokeWidth={flowHeight}
                        opacity="0.75"
                        style={{ mixBlendMode: "screen" }}
                      />
                    );
                  });
                })}

                {/* Buyer nodes */}
                {topBuyers.map((buyer, idx) => {
                  const pos = buyerPositions[idx];
                  const value = mode === "value" ? Number(buyer?.value || 0) : Number(buyer?.volume || 0);
                  const color = getBrokerColor(buyer?.broker);

                  return (
                    <g key={`buyer-${idx}`} style={{ filter: "url(#glow)" }}>
                      <rect x={margin.left - 45} y={pos.y} width={10} height={pos.height} fill={color} rx="5" opacity="0.8" />

                      <rect
                        x={margin.left}
                        y={pos.y}
                        width={nodeWidth}
                        height={pos.height}
                        fill={color}
                        stroke="rgba(0, 0, 0, 0.5)"
                        strokeWidth="2"
                        rx="3"
                      />

                      <text
                        x={margin.left - 55}
                        y={pos.y + pos.height / 2 - 8}
                        textAnchor="end"
                        dominantBaseline="middle"
                        className="text-lg font-bold fill-gray-100"
                      >
                        {buyer?.broker}
                      </text>

                      <text
                        x={margin.left - 55}
                        y={pos.y + pos.height / 2 + 10}
                        textAnchor="end"
                        dominantBaseline="middle"
                        className="text-sm font-medium fill-gray-400"
                      >
                        {formatMini(value)}
                      </text>
                    </g>
                  );
                })}

                {/* Seller nodes */}
                {topSellers.map((seller, idx) => {
                  const pos = sellerPositions[idx];
                  const value = Math.abs(
                    mode === "value" ? Number(seller?.value || 0) : Number(seller?.volume || 0)
                  );
                  const color = getBrokerColor(seller?.broker);

                  return (
                    <g key={`seller-${idx}`} style={{ filter: "url(#glow)" }}>
                      <rect
                        x={width - margin.right - nodeWidth}
                        y={pos.y}
                        width={nodeWidth}
                        height={pos.height}
                        fill={color}
                        stroke="rgba(0, 0, 0, 0.5)"
                        strokeWidth="2"
                        rx="3"
                      />

                      <rect x={width - margin.right + 35} y={pos.y} width={10} height={pos.height} fill={color} rx="5" opacity="0.8" />

                      <text
                        x={width - margin.right + 55}
                        y={pos.y + pos.height / 2 - 8}
                        textAnchor="start"
                        dominantBaseline="middle"
                        className="text-lg font-bold fill-gray-100"
                      >
                        {seller?.broker}
                      </text>

                      <text
                        x={width - margin.right + 55}
                        y={pos.y + pos.height / 2 + 10}
                        textAnchor="start"
                        dominantBaseline="middle"
                        className="text-sm font-medium fill-gray-400"
                      >
                        {formatMini(value)}
                      </text>
                    </g>
                  );
                })}
              </>
            );
          })()}
        </svg>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
        <span
          {...makeSpanA11y(() => setActiveGroup(null))}
          className={`${clickableSpanBase} ${
            !activeGroup
              ? "bg-indigo-500/20 border-indigo-400 text-indigo-200"
              : "bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500"
          }`}
          title="Tampilkan semua broker"
        >
          All
        </span>

        {Object.keys(BROKER_GROUPS).map((group) => {
          const isActive = activeGroup === group;
          const color = GROUP_COLORS[group] || GROUP_COLORS.Unknown;
          const toggle = () => setActiveGroup((prev) => (prev === group ? null : group));

          return (
            <span
              key={group}
              {...makeSpanA11y(toggle)}
              className={`${clickableSpanBase} ${
                isActive ? "bg-gray-700 border-gray-400" : "bg-gray-800 border-gray-700 hover:border-gray-500"
              }`}
              title={`Filter: ${group} (${BROKER_GROUPS[group].join(", ")})`}
            >
              <span className="w-5 h-5 rounded-md" style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}80` }} />
              <span className="text-sm font-semibold text-gray-200">
                ● {group}
                <span className="font-medium text-gray-400"> ({BROKER_GROUPS[group].join(", ")})</span>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
};

/** =========================
 * Group Aggregation + ranking fields
 * ========================= */
const buildGroupAggregation = (buyArr = [], sellArr = []) => {
  const acc = new Map();

  const ensure = (group) => {
    if (!acc.has(group)) {
      acc.set(group, {
        group,
        color: GROUP_COLORS[group] || GROUP_COLORS.Unknown,
        buyVolume: 0,
        buyValue: 0,
        sellVolume: 0,
        sellValue: 0,
        totalVolume: 0,
        totalValue: 0,
        netVolume: 0,
        netValue: 0,
      });
    }
    return acc.get(group);
  };

  // Keep stable order / existence
  Object.keys(BROKER_GROUPS).forEach(ensure);

  const add = (item, side) => {
    const vol = Number(item?.volume || 0);
    const val = Number(item?.value || 0);

    const groups = getGroupsForBroker(item?.broker);
    for (const g of groups) {
      const row = ensure(g);
      if (side === "buy") {
        row.buyVolume += vol;
        row.buyValue += val;
      } else {
        // sell -> absolute for readability
        row.sellVolume += Math.abs(vol);
        row.sellValue += Math.abs(val);
      }
    }
  };

  buyArr.forEach((x) => add(x, "buy"));
  sellArr.forEach((x) => add(x, "sell"));

  const out = Array.from(acc.values())
    .map((r) => {
      const totalVolume = r.buyVolume + r.sellVolume;
      const totalValue = r.buyValue + r.sellValue;
      const netVolume = r.buyVolume - r.sellVolume;
      const netValue = r.buyValue - r.sellValue;
      return { ...r, totalVolume, totalValue, netVolume, netValue };
    })
    .filter((r) => r.totalValue || r.totalVolume);

  // drop Unknown if truly empty (usually)
  const unknown = out.find((x) => x.group === "Unknown");
  if (unknown && unknown.totalValue === 0 && unknown.totalVolume === 0) {
    return out.filter((x) => x.group !== "Unknown");
  }

  return out;
};

/** =========================
 * Group Accumulation Chart (ranked high -> low)
 * Ranking basis: totalValue / totalVolume (depends mode)
 * ========================= */
const GroupAccumulationChart = ({ data = [], mode = "value", formatValue, formatNumber }) => {
  const buyKey = mode === "value" ? "buyValue" : "buyVolume";
  const sellKey = mode === "value" ? "sellValue" : "sellVolume";
  const totalKey = mode === "value" ? "totalValue" : "totalVolume";
  const netKey = mode === "value" ? "netValue" : "netVolume";

  const fmt = (n) => (mode === "value" ? formatValue(n) : formatNumber(n));

  // scale bars by max TOTAL (biar visual konsisten antar-group)
  const maxTotal = Math.max(1, ...data.map((d) => Number(d[totalKey] || 0)));

  return (
    <div className="p-6 bg-white shadow-xl rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Ranking Akumulasi Broker Group{" "}
          <span className="text-sm font-medium text-gray-500">
            ({mode === "value" ? "Value" : "Volume"})
          </span>
        </h2>

        <div className="text-sm text-gray-500">
          Skala (max total): <span className="font-semibold text-gray-700">{fmt(maxTotal)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((g, idx) => {
          const buy = Number(g[buyKey] || 0);
          const sell = Number(g[sellKey] || 0);
          const total = Number(g[totalKey] || 0);
          const net = Number(g[netKey] || 0);

          const buyW = `${(buy / maxTotal) * 100}%`;
          const sellW = `${(sell / maxTotal) * 100}%`;
          const totalW = `${(total / maxTotal) * 100}%`;

          return (
            <div key={g.group} className="p-4 border border-gray-100 rounded-xl">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-10 text-xs font-bold text-gray-500">#{idx + 1}</span>
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: g.color }} />
                  <div className="font-semibold text-gray-800">{g.group}</div>
                </div>

                <div className="text-xs text-right text-gray-500">
                  Total: <span className="font-semibold text-gray-700">{fmt(total)}</span> · Net:{" "}
                  <span className={`font-semibold ${net >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {net >= 0 ? "+" : "-"}
                    {fmt(Math.abs(net))}
                  </span>
                </div>
              </div>

              {/* Total Bar */}
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-indigo-600 w-14">TOTAL</div>
                <div className="flex-1 h-3 overflow-hidden bg-gray-100 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: totalW,
                      background: `linear-gradient(90deg, ${g.color}, rgba(79,70,229,0.9))`,
                    }}
                    title={`TOTAL ${g.group}: ${fmt(total)}`}
                  />
                </div>
                <div className="text-xs font-semibold text-right text-gray-700 w-28">{fmt(total)}</div>
              </div>

              {/* Buy Bar */}
              <div className="flex items-center gap-3 mt-2">
                <div className="text-xs font-semibold text-green-600 w-14">BUY</div>
                <div className="flex-1 h-3 overflow-hidden bg-gray-100 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: buyW,
                      background: `linear-gradient(90deg, rgba(34,197,94,0.95), ${g.color})`,
                    }}
                    title={`BUY ${g.group}: ${fmt(buy)}`}
                  />
                </div>
                <div className="text-xs text-right text-gray-600 w-28">{fmt(buy)}</div>
              </div>

              {/* Sell Bar */}
              <div className="flex items-center gap-3 mt-2">
                <div className="text-xs font-semibold text-red-600 w-14">SELL</div>
                <div className="flex-1 h-3 overflow-hidden bg-gray-100 rounded-full">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: sellW,
                      background: `linear-gradient(90deg, rgba(239,68,68,0.95), ${g.color})`,
                    }}
                    title={`SELL ${g.group}: ${fmt(sell)}`}
                  />
                </div>
                <div className="text-xs text-right text-gray-600 w-28">{fmt(sell)}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/** =========================
 * Main Page
 * ========================= */
export default function BrokerAccumulator() {
  const [files, setFiles] = useState([]);
  const [netBuyData, setNetBuyData] = useState([]);
  const [netSellData, setNetSellData] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [chartMode, setChartMode] = useState("value");

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files || []);
    const allData = [];

    for (const file of uploadedFiles) {
      const data = await file.arrayBuffer();
      const workbook = read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      const dateMatch = file.name.match(/(\d{2}-\d{2}-\d{4})/);
      const fileDate = dateMatch ? dateMatch[1] : "";

      allData.push({ fileName: file.name, date: fileDate, data: jsonData });
    }

    setFiles(allData);
    processData(allData);
  };

  const processData = (filesData) => {
    const buyAccumulator = {};
    const sellAccumulator = {};
    let minDate = null;
    let maxDate = null;

    function findBrokerGroups(row) {
      const groups = [];
      for (let i = 0; i < row.length - 2; i++) {
        const c1 = (row[i] || "").toString().trim().toLowerCase();
        const c2 = (row[i + 1] || "").toString().trim().toLowerCase();
        const c3 = (row[i + 2] || "").toString().trim().toLowerCase();
        if (c1 === "broker" && c2 === "volume" && c3 === "value") {
          groups.push({ brokerCol: i, volumeCol: i + 1, valueCol: i + 2 });
        }
      }
      return groups;
    }

    filesData.forEach(({ date, data }) => {
      if (date) {
        const [day, month, year] = date.split("-");
        const dateObj = new Date(`${year}-${month}-${day}`);
        if (!Number.isNaN(dateObj.getTime())) {
          if (!minDate || dateObj < minDate) minDate = dateObj;
          if (!maxDate || dateObj > maxDate) maxDate = dateObj;
        }
      }

      // find header row contains "net buy" and "net sell"
      let headerRow = -1;
      for (let i = 0; i < Math.min(10, data.length); i++) {
        const row = data[i];
        const rowStr = row.map((cell) => (cell || "").toString().toLowerCase()).join("|");
        if (rowStr.includes("net buy") && rowStr.includes("net sell")) {
          headerRow = i;
          break;
        }
      }
      if (headerRow === -1) return;

      const header2 = data[headerRow + 1];
      if (!header2) return;

      const groups = findBrokerGroups(header2);

      // BUY block (table 1)
      if (groups.length >= 1) {
        const buyCols = groups[0];
        for (let i = headerRow + 2; i < data.length; i++) {
          const row = data[i];
          const broker = (row[buyCols.brokerCol] || "").toString().trim();
          if (!broker || broker.toLowerCase() === "broker") continue;

          const volume = parseFloat(row[buyCols.volumeCol]) || 0;
          const value = parseFloat(row[buyCols.valueCol]) || 0;

          if (volume > 0 && value > 0) {
            if (!buyAccumulator[broker]) buyAccumulator[broker] = { volume: 0, value: 0, dates: [] };
            buyAccumulator[broker].volume += volume;
            buyAccumulator[broker].value += value;
            if (date && !buyAccumulator[broker].dates.includes(date)) buyAccumulator[broker].dates.push(date);
          }
        }
      }

      // SELL block (table 2)
      if (groups.length >= 2) {
        const sellCols = groups[1];
        for (let i = headerRow + 2; i < data.length; i++) {
          const row = data[i];
          const broker = (row[sellCols.brokerCol] || "").toString().trim();
          if (!broker || broker.toLowerCase() === "broker") continue;

          const volume = parseFloat(row[sellCols.volumeCol]) || 0;
          const value = parseFloat(row[sellCols.valueCol]) || 0;

          if (volume !== 0 && value !== 0) {
            if (!sellAccumulator[broker]) sellAccumulator[broker] = { volume: 0, value: 0, dates: [] };
            sellAccumulator[broker].volume += volume;
            sellAccumulator[broker].value += value;
            if (date && !sellAccumulator[broker].dates.includes(date)) sellAccumulator[broker].dates.push(date);
          }
        }
      }
    });

    const buyArray = Object.entries(buyAccumulator)
      .map(([broker, data]) => ({
        broker,
        volume: data.volume,
        value: data.value,
        avg: data.volume ? data.value / data.volume : 0,
        dates: [...new Set(data.dates)].sort(),
      }))
      .sort((a, b) => b.value - a.value);

    const sellArray = Object.entries(sellAccumulator)
      .map(([broker, data]) => ({
        broker,
        volume: data.volume,
        value: data.value,
        avg: data.volume ? data.value / data.volume : 0,
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
    } else {
      setDateRange({ start: "", end: "" });
    }
  };

  const formatNumber = (num) => new Intl.NumberFormat("id-ID").format(Math.round(Number(num || 0)));

  const formatValue = (num) => {
    const n = Number(num || 0);
    const abs = Math.abs(n);
    if (abs >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (abs >= 1e9) return (n / 1e9).toFixed(2) + "B";
    if (abs >= 1e6) return (n / 1e6).toFixed(2) + "M";
    return formatNumber(n);
  };

  /** ===== group aggregation + RANKING (highest -> lowest) ===== */
  const groupAggRanked = useMemo(() => {
    const agg = buildGroupAggregation(netBuyData, netSellData);
    const key = chartMode === "value" ? "totalValue" : "totalVolume";
    return [...agg].sort((a, b) => Number(b[key] || 0) - Number(a[key] || 0));
  }, [netBuyData, netSellData, chartMode]);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto max-w-7xl">
        <div className="p-8 mb-6 bg-white shadow-xl rounded-2xl">
          <h1 className="flex items-center gap-3 mb-2 text-3xl font-bold text-gray-800">
            <FileSpreadsheet className="text-indigo-600" size={36} />
            Kalkulator Akumulasi Broker
          </h1>
          <p className="mb-6 text-gray-600">
            Upload multiple file Excel untuk mengkalkulasi akumulasi Net Buy dan Net Sell
          </p>

          <div className="p-8 text-center transition-colors border-2 border-indigo-300 border-dashed rounded-xl hover:border-indigo-500">
            <Upload className="mx-auto mb-4 text-indigo-400" size={48} />
            <label className="cursor-pointer">
              <span className="inline-block px-6 py-3 text-white transition-colors bg-indigo-600 rounded-lg hover:bg-indigo-700">
                Pilih File Excel
              </span>
              <input type="file" multiple accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </label>
            <p className="mt-4 text-sm text-gray-500">Format: DD-MM-YYYY.xlsx (contoh: 20-11-2025.xlsx)</p>
          </div>

          {files.length > 0 && (
            <div className="p-4 mt-6 rounded-lg bg-indigo-50">
              <h3 className="mb-2 font-semibold text-gray-700">File yang diupload:</h3>
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
                  Periode: <span className="font-semibold">{dateRange.start}</span> s/d{" "}
                  <span className="font-semibold">{dateRange.end}</span>
                </p>
              )}
            </div>
          )}
        </div>

        {(netBuyData.length > 0 || netSellData.length > 0) && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Mode Chart</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setChartMode("value")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  chartMode === "value"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                Value
              </button>
              <button
                onClick={() => setChartMode("volume")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  chartMode === "volume"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                }`}
              >
                Volume
              </button>
            </div>
          </div>
        )}

        {/* Group Ranked Chart */}
        {netBuyData.length > 0 && netSellData.length > 0 && (
          <div className="mb-6">
            <GroupAccumulationChart
              data={groupAggRanked}
              mode={chartMode}
              formatValue={formatValue}
              formatNumber={formatNumber}
            />
          </div>
        )}

        {/* Sankey Chart */}
        {netBuyData.length > 0 && netSellData.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-4 text-2xl font-bold text-gray-800">Broker Flow Visualization</h2>
            <SankeyChart buyData={netBuyData} sellData={netSellData} mode={chartMode} />
          </div>
        )}

        {/* Tables */}
        {(netBuyData.length > 0 || netSellData.length > 0) && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-6 bg-white shadow-xl rounded-2xl">
              <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-green-600">
                <TrendingUp size={28} />
                Net Buy (Top 20)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-green-200">
                      <th className="px-2 py-3 font-semibold text-left text-gray-700">#</th>
                      <th className="px-2 py-3 font-semibold text-left text-gray-700">Broker</th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">Volume</th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">Value</th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netBuyData.slice(0, 20).map((item, idx) => (
                      <tr key={idx} className="transition-colors border-b border-gray-100 hover:bg-green-50">
                        <td className="px-2 py-3 font-bold text-green-600">{idx + 1}</td>
                        <td className="px-2 py-3 font-semibold text-gray-800">{item.broker}</td>
                        <td className="px-2 py-3 text-right text-gray-700">{formatNumber(item.volume)}</td>
                        <td className="px-2 py-3 font-semibold text-right text-gray-800">{formatValue(item.value)}</td>
                        <td className="px-2 py-3 text-right text-gray-600">{formatNumber(item.avg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 bg-white shadow-xl rounded-2xl">
              <h2 className="flex items-center gap-2 mb-4 text-2xl font-bold text-red-600">
                <TrendingDown size={28} />
                Net Sell (Top 20)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-red-200">
                      <th className="px-2 py-3 font-semibold text-left text-gray-700">#</th>
                      <th className="px-2 py-3 font-semibold text-left text-gray-700">Broker</th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">Volume</th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">Value</th>
                      <th className="px-2 py-3 font-semibold text-right text-gray-700">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {netSellData.slice(0, 20).map((item, idx) => (
                      <tr key={idx} className="transition-colors border-b border-gray-100 hover:bg-red-50">
                        <td className="px-2 py-3 font-bold text-red-600">{idx + 1}</td>
                        <td className="px-2 py-3 font-semibold text-gray-800">{item.broker}</td>
                        <td className="px-2 py-3 text-right text-gray-700">{formatNumber(item.volume)}</td>
                        <td className="px-2 py-3 font-semibold text-right text-gray-800">{formatValue(item.value)}</td>
                        <td className="px-2 py-3 text-right text-gray-600">{formatNumber(item.avg)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
