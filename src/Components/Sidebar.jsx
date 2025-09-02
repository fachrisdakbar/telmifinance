// Sidebar.js
import React from "react";
import { Link } from "react-router-dom"; // Jika menggunakan React Router untuk navigasi

const Sidebar = () => {
  return (
    <div className="flex flex-col w-64 h-screen text-white bg-gray-800">
      <div className="flex items-center justify-center h-16 text-2xl font-semibold bg-gray-900">
        <span>Admin Panel</span>
      </div>
      <nav className="flex-grow">
        <ul>
          <li>
            <Link to="/" className="block px-6 py-3 hover:bg-gray-700">
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/admin" className="block px-6 py-3 hover:bg-gray-700">
              Unggah Data
            </Link>
          </li>
          <li>
            <Link to="/settings" className="block px-6 py-3 hover:bg-gray-700">
              Pengaturan
            </Link>
          </li>
        </ul>
      </nav>
      <div className="px-6 py-3 text-sm text-center text-gray-400">
        <span>© 2025 Admin Panel</span>
      </div>
    </div>
  );
};

export default Sidebar;
