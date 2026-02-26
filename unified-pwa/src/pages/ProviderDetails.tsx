import { ArrowLeft, MapPin, Share2, Star, Clock, Shield, Leaf, Award } from 'lucide-react';
import { Provider } from '../types/Index';
import { useNavigate } from 'react-router-dom';

interface ProviderDetailsProps {
  provider: Provider;
  onNavigate: (screen: string, data?: any) => void;
  onBack: () => void;
  
}


export default function ProviderDetails({ provider, onNavigate, onBack }: ProviderDetailsProps) {
  const timeSlots = ['10:00 AM', '12:30 PM', '03:00 PM', '05:30 PM'];
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20">
      <div className="sticky top-0 bg-gray-950/95 backdrop-blur-lg border-b border-gray-800 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-violet-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L3 7v6c0 4 7 7 7 7s7-3 7-7V7l-7-5z"/>
              </svg>
            </div>
            <h1 className="font-bold">{provider.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <MapPin size={20} className="text-violet-400" />
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Share2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="bg-gray-800/60 rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
              <img src={provider.avatar} alt={provider.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">{provider.name}</h2>
              <p className="text-sm text-gray-400 mb-2">
                {provider.category} • {provider.rating} • {provider.jobsCompleted.toLocaleString()} jobs
              </p>
              <div className="flex items-center gap-2">
                {provider.verified && (
                  <span className="flex items-center gap-1 px-2 py-1 bg-violet-500/20 text-violet-300 text-xs rounded-md">
                    <Shield size={12} />
                    Verified
                  </span>
                )}
                <span className="flex items-center gap-1 px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-md">
                  <Clock size={12} />
                  ETA 30-45m
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-gray-800/60 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-violet-400">
              <Award size={18} />
              <span className="text-xs text-gray-400">Experience</span>
            </div>
            <p className="text-lg font-bold">{provider.experience}</p>
          </div>
          <div className="bg-gray-800/60 p-4 rounded-xl">
            <div className="flex items-center gap-2 mb-2 text-violet-400">
              <MapPin size={18} />
              <span className="text-xs text-gray-400">Service Radius</span>
            </div>
            <p className="text-lg font-bold">{provider.serviceRadius}</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => navigate('/customer/bookings', { state: { provider }})}
            className="flex-1 py-3.5 bg-violet-600 hover:bg-violet-700 rounded-xl font-semibold transition-colors"
          >
            Book Now
          </button>
          <button
            onClick={() => onNavigate('chat', { providerId: provider.id })}
            className="flex-1 py-3.5 bg-gray-800 hover:bg-gray-700 rounded-xl font-semibold transition-colors"
          >
            Message
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Popular Services</h3>
          <div className="space-y-3">
            {provider.services.map((service) => (
              <div
                key={service.id}
                className="bg-gray-800/60 hover:bg-gray-800 rounded-xl p-4 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" strokeWidth="2"/></svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{service.title}</h4>
                      <p className="text-sm text-gray-400">Professional service with high quality standards</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold">${service.pricing[0]?.amount || 0}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Service Area</h3>
          <div className="bg-gray-800/60 rounded-xl overflow-hidden">
            <div className="h-48 bg-gray-700 relative">
              <img
                src="https://images.pexels.com/photos/2881229/pexels-photo-2881229.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Map"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-violet-400" />
                  <div>
                    <p className="font-semibold">Base: Tirunelveli</p>
                    <p className="text-sm text-gray-400">Up to 20 km</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">Availability Today</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {timeSlots.map((time, index) => (
              <button
                key={time}
                className={`py-3 rounded-xl font-semibold transition-colors ${
                  index === 1
                    ? 'bg-violet-600 hover:bg-violet-700'
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-4">About</h3>
          <div className="bg-gray-800/60 rounded-xl p-4">
            <p className="text-gray-300 leading-relaxed mb-4">{provider.about}</p>
            {provider.tags && (
              <div className="flex flex-wrap gap-2">
                {provider.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 rounded-lg text-sm"
                  >
                    {tag === 'Insurance' && <Shield size={14} className="text-violet-400" />}
                    {tag === 'Eco Products' && <Leaf size={14} className="text-green-400" />}
                    {tag === 'Top Rated' && <Award size={14} className="text-yellow-400" />}
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {provider.reviews && provider.reviews.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-4">Recent Reviews</h3>
            <div className="space-y-3">
              {provider.reviews.map((review) => (
                <div key={review.id} className="bg-gray-800/60 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-700 flex-shrink-0">
                      <img src={review.userAvatar} alt={review.userName} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{review.userName}</h4>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: review.rating }).map((_, i) => (
                            <Star key={i} size={12} fill="#FBBF24" className="text-yellow-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-300">{review.comment}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

