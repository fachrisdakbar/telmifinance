import React from "react";
import { motion } from "framer-motion";
import { Search, User, ChevronDown } from "lucide-react";
import logo from "../assets/png/logo.png";
import { Link } from "react-router-dom";

const Navbar = () => {
  
  return (
    <motion.nav
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="py-2 text-gray-500 bg-white shadow-md"
    >
      <div className="px-4 mx-auto max-w-7xl text-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src={logo} alt="Telmi Logo" className="w-auto h-20" />
          </div>

          <div className="flex items-center space-x-8 font-medium">
           <Link to="/bandarmologi" className="text-grey-600 hover:underline">BANDARMOLOGI</Link>
           <Link to="/stockrankvolume" className="text-grey-600 hover:underline">RANKING</Link>
            {/* <a href="#">SCREENS</a> */}
            <div className="relative group">
              <a href="#">
                ECONOMICS
                <ChevronDown className="inline-block ml-2 -mt-1" size={16} />
              </a>
              <div className="absolute left-0 hidden w-32 p-2 bg-white rounded-md shadow-lg top-8 group-hover:block">
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Tool 1
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                >
                  Tool 2
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 border border-gray-300 rounded-lg px-4 py-1.5 w-96">
            <Search className="text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search for a company"
              className="w-full placeholder-gray-500 bg-transparent text-md focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 border border-gray-300 rounded-lg px-4 py-1.5 cursor-pointer">
            <User className="text-blue-900" size={16} />
            <span className="text-gray-900 text-md">PROFILE</span>
            <ChevronDown className="text-gray-900" size={16} />
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
