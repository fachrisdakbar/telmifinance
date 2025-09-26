import React from "react";
import { Link, useLocation } from "react-router-dom"; // Impor useLocation dari react-router-dom
import {
  BarChart3,
  Menu,
  X,
  Home,
  Settings,
  FileText,
  PieChart,
  Database,
  LogOut,
  Axis3dIcon,
  ChartBarStacked,
} from "lucide-react"; // Jika menggunakan React Router untuk navigasi

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation(); // Menangkap lokasi saat ini
  const menuItems = [
    { icon: Home, label: "Dashboard", to: "/" },
    { icon: Database, label: "Admin Panel", to: "/admin" },
    { icon: BarChart3, label: "Stock Data", to: "/stocks" }, // Pastikan path yang benar
    { icon: PieChart, label: "Broker Data", to: "/broker" },
    { icon: FileText, label: "Economics Data", to: "/economics" },
    { icon: ChartBarStacked, label: "Screener", to: "/screener" },
    { icon: Axis3dIcon, label: "AI Screener", to: "/ai-screener" },
    { icon: Settings, label: "Settings", to: "/settings" },
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
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-gradient-to-b from-slate-900 to-slate-800 text-white transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-20"
        } lg:${isOpen ? "w-64" : "w-20"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div
                className={`transition-all duration-300 ${
                  !isOpen && "lg:opacity-0 lg:w-0 lg:overflow-hidden"
                }`}
              >
                <h1 className="text-lg font-bold whitespace-nowrap">TFI Screener</h1>
                <p className="text-xs text-slate-400 whitespace-nowrap">Admin Portal</p>
              </div>
            </div>

            {/* Toggle button for desktop, close for mobile */}
            <button
              onClick={toggleSidebar}
              className="p-2 transition-colors border rounded-lg hover:bg-slate-700 bg-slate-800 border-slate-600"
            >
              {isOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              const isActive = location.pathname === item.to; // Check if the item is active based on the current location

              return (
                <Link
                  key={index}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group relative ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg"
                      : "hover:bg-slate-700"
                  }`}
                >
                  <IconComponent
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-slate-300"}`}
                  />
                  <span
                    className={`font-medium transition-all duration-300 ${
                      !isOpen
                        ? "lg:opacity-0 lg:w-0 lg:overflow-hidden"
                        : "opacity-100"
                    } ${isActive ? "text-white" : "text-slate-300"} whitespace-nowrap`}
                  >
                    {item.label}
                  </span>

                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="absolute z-50 invisible hidden px-2 py-1 ml-2 text-sm text-white transition-all duration-200 rounded opacity-0 left-full bg-slate-800 group-hover:opacity-100 group-hover:visible whitespace-nowrap lg:block">
                      {item.label}
                    </div>
                  )}

                  {/* Active indicator */}
                  {isActive && <div className="absolute w-2 h-2 bg-white rounded-full right-2 animate-pulse" />}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 px-3 py-2 transition-colors rounded-lg cursor-pointer hover:bg-slate-700">
              <LogOut className="flex-shrink-0 w-5 h-5 text-slate-400" />
              <span
                className={`text-slate-400 font-medium transition-all duration-300 ${
                  !isOpen
                    ? "lg:opacity-0 lg:w-0 lg:overflow-hidden"
                    : "opacity-100"
                } whitespace-nowrap`}
              >
                Logout
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
