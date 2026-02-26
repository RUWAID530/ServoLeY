import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, User, ChevronRight } from 'lucide-react';

interface Booking {
  id: string;
  service: string;
  professional: string;
  date: string;
  time: string;
  location: string;
  status: 'confirmed' | 'pending' | 'in-progress';
  image: string;
}

const UpcomingBookings: React.FC = () => {
  const bookings: Booking[] = [
    {
      id: 'BK001',
      service: 'Home Cleaning',
      professional: 'Sarah Johnson',
      date: 'Nov 5, 2023',
      time: '10:00 AM',
      location: '123 Main St, Tirunelveli',
      status: 'confirmed',
      image: 'https://picsum.photos/seed/cleaning/100/100.jpg'
    },
    {
      id: 'BK002',
      service: 'Plumbing Repair',
      professional: 'Mike Chen',
      date: 'Nov 7, 2023',
      time: '2:30 PM',
      location: '456 Oak Ave, Tirunelveli',
      status: 'confirmed',
      image: 'https://picsum.photos/seed/plumbing/100/100.jpg'
    },
    {
      id: 'BK003',
      service: 'Garden Maintenance',
      professional: 'Emily Rodriguez',
      date: 'Nov 10, 2023',
      time: '9:00 AM',
      location: '789 Pine Rd, Tirunelveli',
      status: 'pending',
      image: 'https://picsum.photos/seed/garden/100/100.jpg'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Upcoming Bookings</h2>
        <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {bookings.map((booking, index) => (
          <motion.div
            key={booking.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className="flex flex-col sm:flex-row sm:items-center p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
          >
            <div className="flex items-center mb-3 sm:mb-0 sm:mr-4">
              <img
                src={booking.image}
                alt={booking.service}
                className="h-16 w-16 rounded-lg object-cover mr-3"
              />
              <div>
                <h3 className="font-medium text-gray-900">{booking.service}</h3>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <User className="h-4 w-4 mr-1" />
                  {booking.professional}
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                {booking.date}
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-4 w-4 mr-1 text-gray-400" />
                {booking.time}
              </div>
              <div className="flex items-center text-gray-600">
                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                <span className="truncate">{booking.location}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 sm:mt-0 sm:ml-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                {booking.status}
              </span>
              <button className="ml-4 p-1 rounded-full hover:bg-gray-100">
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingBookings;
