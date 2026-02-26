import React, { useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface CustomerHeaderProps {
  userImage?: string;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({ userImage }) => {
  const [searchValue, setSearchValue] = useState('');

  return (
    <header className="sticky top-0 z-50 bg-[#0F1721] border-b border-slate-800/50 px-4 md:px-8 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full opacity-80"></div>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">ServoLey</span>
        </div>

        {/* Search Bar */}
        <div className="flex-grow max-w-2xl relative hidden sm:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search for services, providers, or offers"
              className="w-full bg-[#1A1A1A] text-slate-200 border border-slate-800 rounded-full py-2.5 pl-12 pr-4 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all text-sm"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 bg-[#F3E8FF] text-[#1A1A1A] px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-white transition-colors">
            Tirunelveli
            <ChevronDown className="w-4 h-4" />
          </button>
          <img 
            src={userImage || "https://i.pravatar.cc/100?u=current_user"} 
            alt="Profile" 
            className="w-10 h-10 rounded-full border border-slate-800"
          />
        </div>
      </div>
    </header>
  );
};

export default CustomerHeader;