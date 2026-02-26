import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Star,
  MoreVertical
} from 'lucide-react';

interface Booking {
  id: string;
  service: string;
  professional: {
    name: string;
    rating: number;
    avatar: string;
  };
  date: string;
  time: string;
  location: string;
  status: 'confirmed' | 'pending';
}

const UpcomingBookings: React.FC = () => {
  const bookings: Booking[] = [
    {
      id: 'BK001',
      service: 'Home Cleaning',
      professional: {
        name: 'Sarah Johnson',
        rating: 4.8,
        avatar: 'https://picsum.photos/seed/sarah/100/100.jpg'
      },
      date: 'Nov 5, 2023',
      time: '10:00 AM',
      location: '123 Main St, Tirunelveli',
      status: 'confirmed'
    },
    {
      id: 'BK002',
      service: 'Plumbing Repair',
      professional: {
        name: 'Mike Chen',
        rating: 4.7,
        avatar: 'https://picsum.photos/seed/mike/100/100.jpg'
      },
      date: 'Nov 7, 2023',
      time: '2:30 PM',
      location: '456 Oak Ave, Tirunelveli',
      status: 'pending'
    },
    {
      id: 'BK003',
      service: 'Garden Maintenance',
      professional: {
        name: 'Emily Rodriguez',
        rating: 4.9,
        avatar: 'https://picsum.photos/seed/emily/100/100.jpg'
      },
      date: 'Nov 10, 2023',
      time: '9:00 AM',
      location: '789 Pine Rd, Tirunelveli',
      status: 'confirmed'
    }
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">Upcoming Bookings</h2>

      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center border border-gray-100">
          <div className="text-gray-400 mb-4">
            <Calendar className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming bookings</h3>
          <p className="text-gray-500">You don't have any upcoming bookings at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <motion.div
              key={booking.id}
              whileHover={{ scale: 1.01 }}
              className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-3">
                    <h3 className="text-lg font-medium text-gray-900 mr-3">{booking.service}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      booking.status === 'confirmed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="flex items-center mb-3">
                    <img
                      src={booking.professional.avatar}
                      alt={booking.professional.name}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{booking.professional.name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Star className="h-4 w-4 text-yellow-500 mr-1" />
                        {booking.professional.rating}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {booking.date}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      {booking.time}
                    </div>
                    <div className="flex items-center text-gray-600 sm:col-span-3">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {booking.location}
                    </div>
                  </div>
                </div>

                <button className="p-2 rounded-full hover:bg-gray-100">
                  <MoreVertical className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingBookings;
