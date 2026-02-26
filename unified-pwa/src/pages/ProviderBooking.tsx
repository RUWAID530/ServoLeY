import React from 'react';
import { Link } from 'react-router-dom';
import { Download, Search, ChevronRight, Plus, ExternalLink, Filter } from 'lucide-react';

interface BookingsProps {
  onNewBooking: () => void;
}

export const Bookings: React.FC<BookingsProps> = ({ onNewBooking }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-white">Bookings</h1>
          <Link to="/provider/dashboard" className="text-cyan-400 hover:text-cyan-300 text-sm">Back to Dashboard</Link>
        </div>
        <div className="flex gap-3">
          <button className="bg-slate-800 text-cyan-400 px-6 py-2.5 rounded-lg font-bold text-sm flex items-center gap-2 border border-cyan-500/10">
            <Download size={18}/> Export
          </button>
          <button className="bg-slate-800 text-cyan-400 px-6 py-2.5 rounded-lg font-bold text-sm border border-cyan-500/10">
            Bulk Actions
          </button>
          <button 
            onClick={onNewBooking}
            className="bg-cyan-500 text-[#0F1721] px-6 py-2.5 rounded-lg font-bold text-sm"
          >
            New Booking
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#152233] rounded-xl border border-slate-800 p-6 overflow-hidden">
               <h3 className="font-semibold text-white mb-4">All bookings</h3>
               <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex-1 min-w-[200px] relative">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                     <input type="text" placeholder="Search by name, service..." className="w-full bg-[#0B141E] border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-slate-300" />
                  </div>
                  <div className="bg-[#0B141E] border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-500">Status: Any</div>
                  <div className="bg-[#0B141E] border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-500">Service: All</div>
                  <div className="bg-[#0B141E] border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-500">Date: This month</div>
               </div>

               <table className="w-full text-left text-sm">
                  <thead className="bg-[#0D3B4C] text-cyan-200">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Customer</th>
                      <th className="px-4 py-3 font-semibold">Service</th>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold text-center">Status</th>
                      <th className="px-4 py-3 font-semibold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {[
                      { name: 'Alex Morgan', service: 'Deep Cleaning', date: 'Nov 11, 2025', status: 'Confirmed', statusColor: 'bg-orange-500 text-[#0F1721]' },
                      { name: 'Priya Shah', service: 'AC Service', date: 'Nov 12, 2025', status: 'Pending', statusColor: 'bg-orange-500/20 text-orange-400' },
                      { name: 'Jordan Lee', service: 'Haircut', date: 'Nov 13, 2025', status: 'Pending', statusColor: 'bg-orange-500/20 text-orange-400' },
                      { name: 'Mei Chen', service: 'Move-in Clean', date: 'Nov 15, 2025', status: 'Confirmed', statusColor: 'bg-orange-500 text-[#0F1721]' },
                      { name: 'Omar Nasser', service: 'AC Repair', date: 'Nov 27, 2025', status: 'Completed', statusColor: 'bg-green-500/20 text-green-400' },
                    ].map((b, i) => (
                      <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-4">
                           <div className="flex items-center gap-3">
                              <img src={`https://picsum.photos/seed/b${i}/100/100`} className="w-8 h-8 rounded-full" alt=""/>
                              <span className="text-white font-medium">{b.name}</span>
                           </div>
                        </td>
                        <td className="px-4 py-4 text-slate-300">{b.service}</td>
                        <td className="px-4 py-4 text-slate-300">{b.date}</td>
                        <td className="px-4 py-4 text-center">
                           <span className={`text-[10px] font-bold px-3 py-1 rounded uppercase ${b.statusColor}`}>
                              {b.status}
                           </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                           <button className="bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 px-4 py-1.5 rounded font-bold text-xs">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
               
               <div className="flex items-center justify-between mt-8">
                  <div className="flex gap-2">
                     <button className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400">Prev</button>
                     <button className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400">1</button>
                     <button className="px-3 py-1 bg-cyan-500 text-[#0F1721] font-bold rounded text-xs">2</button>
                     <button className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400">3</button>
                     <button className="px-3 py-1 bg-slate-800 rounded text-xs text-slate-400">Next</button>
                  </div>
                  <span className="text-xs text-slate-500">Showing 10 of 28 results</span>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-[#152233] rounded-xl border border-slate-800 p-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-white">Quick insights</h3>
                  <button className="text-xs bg-[#152B3C] text-cyan-400 px-2 py-1 rounded">Today</button>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[#0B141E] p-4 rounded-lg flex items-center justify-between">
                     <span className="text-xs text-slate-400">Today</span>
                     <span className="text-lg font-bold text-white">4</span>
                  </div>
                  <div className="bg-[#0B141E] p-4 rounded-lg flex items-center justify-between">
                     <span className="text-xs text-slate-400">Pending</span>
                     <span className="text-lg font-bold text-white">7</span>
                  </div>
                  <div className="bg-[#0B141E] p-4 rounded-lg flex items-center justify-between">
                     <span className="text-xs text-slate-400">This week</span>
                     <span className="text-lg font-bold text-white">18</span>
                  </div>
                  <div className="bg-[#0B141E] p-4 rounded-lg flex items-center justify-between">
                     <span className="text-xs text-slate-400">Completed</span>
                     <span className="text-lg font-bold text-white">42</span>
                  </div>
               </div>
            </div>

            <div className="bg-[#152233] rounded-xl border border-slate-800 p-6">
               <h3 className="font-semibold text-white mb-4">Upcoming today</h3>
               <div className="space-y-4">
                  {[
                     { name: 'Alex Morgan', service: 'Deep Cleaning', time: '10:00', avatar: 'https://picsum.photos/seed/am/100/100' },
                     { name: 'Priya Shah', service: 'AC Service', time: '14:30', avatar: 'https://picsum.photos/seed/ps/100/100' }
                  ].map((u, i) => (
                     <div key={i} className="p-3 bg-slate-800/20 border border-slate-800 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                           <img src={u.avatar} className="w-8 h-8 rounded-full" alt=""/>
                           <div className="flex-1">
                              <p className="text-xs font-bold text-white">{u.name}</p>
                              <p className="text-[10px] text-slate-500">{u.service}</p>
                           </div>
                           <span className="text-xs font-bold text-slate-300">{u.time}</span>
                        </div>
                        <button className="w-full bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 py-1.5 rounded text-[10px] font-bold">
                           {i === 0 ? 'Check in' : 'Message'}
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Bookings;

