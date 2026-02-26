import { useEffect, useState } from 'react';

// Define Customer interface based on component usage
interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  total_bookings: number;
  last_booking_date: string | null;
  lifetime_value: number;
  tags: string[];
  created_at: string;
}

export default function CustomerManager() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    // Mock data for customers
    const mockCustomers: Customer[] = [
      {
        id: 'c1',
        full_name: 'John Smith',
        email: 'john.smith@example.com',
        phone: '+1 (555) 123-4567',
        total_bookings: 8,
        last_booking_date: '2023-11-10',
        lifetime_value: 1240,
        tags: ['VIP', 'Regular'],
        created_at: '2023-01-15'
      },
      {
        id: 'c2',
        full_name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        phone: '+1 (555) 987-6543',
        total_bookings: 5,
        last_booking_date: '2023-11-08',
        lifetime_value: 875,
        tags: ['Regular'],
        created_at: '2023-02-20'
      },
      {
        id: 'c3',
        full_name: 'Michael Brown',
        email: 'michael.b@example.com',
        phone: '+1 (555) 246-8135',
        total_bookings: 3,
        last_booking_date: '2023-10-25',
        lifetime_value: 520,
        tags: ['New'],
        created_at: '2023-06-10'
      },
      {
        id: 'c4',
        full_name: 'Emily Davis',
        email: 'emily.d@example.com',
        phone: '+1 (555) 369-2580',
        total_bookings: 12,
        last_booking_date: '2023-11-12',
        lifetime_value: 1890,
        tags: ['VIP', 'Regular', 'Premium'],
        created_at: '2022-11-05'
      },
      {
        id: 'c5',
        full_name: 'Robert Wilson',
        email: 'robert.w@example.com',
        phone: '+1 (555) 147-2589',
        total_bookings: 2,
        last_booking_date: '2023-09-15',
        lifetime_value: 340,
        tags: ['New'],
        created_at: '2023-08-20'
      }
    ];

    setCustomers(mockCustomers);
    if (mockCustomers.length > 0) setSelectedCustomer(mockCustomers[0]);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors">
            Import
          </button>
          <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg transition-colors">
            Export
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button className="px-4 py-2 bg-cyan-600 text-white text-sm rounded-lg">All</button>
        <button className="px-4 py-2 bg-[#0a1929] text-gray-300 text-sm rounded-lg hover:bg-white/5">
          With bookings
        </button>
        <button className="px-4 py-2 bg-[#0a1929] text-gray-300 text-sm rounded-lg hover:bg-white/5">
          High value
        </button>
        <button className="px-4 py-2 bg-[#0a1929] text-gray-300 text-sm rounded-lg hover:bg-white/5">
          Inactive
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-[#0d2136] rounded-xl border border-cyan-900/30">
            <div className="p-6">
              <h2 className="text-lg font-bold text-white mb-4">Customer directory</h2>

              <div className="flex flex-col lg:flex-row gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  className="flex-1 bg-[#0a1929] text-white placeholder-gray-400 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button className="px-4 py-2 bg-[#0a1929] text-gray-300 text-sm rounded-lg hover:bg-white/5">
                  Segment: All
                </button>
                <button className="px-4 py-2 bg-[#0a1929] text-gray-300 text-sm rounded-lg hover:bg-white/5">
                  Tags: Any
                </button>
                <button className="px-4 py-2 bg-[#0a1929] text-gray-300 text-sm rounded-lg hover:bg-white/5">
                  Joined: Any time
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="bg-cyan-600/20">
                      <th className="text-left text-xs font-semibold text-cyan-400 px-4 py-3">Customer</th>
                      <th className="text-left text-xs font-semibold text-cyan-400 px-4 py-3">Email</th>
                      <th className="text-left text-xs font-semibold text-cyan-400 px-4 py-3">Phone</th>
                      <th className="text-left text-xs font-semibold text-cyan-400 px-4 py-3">Last booking</th>
                      <th className="text-left text-xs font-semibold text-cyan-400 px-4 py-3">Total spent</th>
                      <th className="text-left text-xs font-semibold text-cyan-400 px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.slice(0, 5).map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-t border-cyan-900/30 cursor-pointer hover:bg-white/5"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-xs font-medium">
                              {customer.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm text-white">{customer.full_name}</p>
                              <p className="text-xs text-gray-400">{customer.total_bookings} bookings</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300">{customer.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{customer.phone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">{formatDate(customer.last_booking_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-300">${customer.lifetime_value}</td>
                        <td className="px-4 py-3 space-x-2">
                          <button className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors">
                            Message
                          </button>
                          <button className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors">
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4">
                <p className="text-sm text-gray-400">Showing 5 of 248 customers</p>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors">
                    Prev
                  </button>
                  <button className="px-3 py-2 bg-cyan-600 text-white text-sm rounded-lg">1</button>
                  <button className="px-3 py-2 bg-[#0a1929] text-gray-300 text-sm rounded-lg hover:bg-white/5">2</button>
                  <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#0d2136] rounded-xl p-6 border border-cyan-900/30">
            <h2 className="text-lg font-bold text-white mb-4">Customer insights</h2>
            <div className="space-y-4">
              <div className="bg-cyan-600/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">248</p>
                <p className="text-sm text-cyan-400">Total customers</p>
              </div>
              <div className="bg-cyan-600/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-sm text-cyan-400">New this month</p>
              </div>
              <div className="bg-cyan-600/20 rounded-lg p-4">
                <p className="text-2xl font-bold text-white">68%</p>
                <p className="text-sm text-cyan-400">Repeat rate</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0d2136] rounded-xl p-6 border border-cyan-900/30">
            <h2 className="text-lg font-bold text-white mb-4">Quick actions</h2>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors">
                Bulk tag
              </button>
              <button className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors">
                Email segment
              </button>
              <button className="w-full px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg transition-colors">
                Archive inactive
              </button>
            </div>
          </div>

          {selectedCustomer && (
            <div className="bg-[#0d2136] rounded-xl p-6 border border-cyan-900/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Selected customer</h2>
                <button className="px-3 py-1 bg-cyan-600 hover:bg-cyan-700 text-white text-sm rounded-lg transition-colors">
                  Message
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center text-white text-lg font-medium">
                    {selectedCustomer.full_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{selectedCustomer.full_name}</p>
                    <p className="text-xs text-gray-400">{selectedCustomer.email}</p>
                    <p className="text-xs text-gray-400">{selectedCustomer.phone}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400">Lifetime value</p>
                    <p className="text-white font-medium">${selectedCustomer.lifetime_value}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Last booking</p>
                    <p className="text-white font-medium">{formatDate(selectedCustomer.last_booking_date)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Preferred services</p>
                  <p className="text-white text-sm">Deep Cleaning, Window cleaning</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedCustomer.tags.map(tag => (
                      <span key={tag} className="px-2 py-1 bg-cyan-600/20 text-cyan-400 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>
    </div>
  );
}

