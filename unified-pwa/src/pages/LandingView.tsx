import React, { useState, useEffect } from 'react';
import { Star, Smartphone, Bike, Car, Wind, User } from 'lucide-react';
import { CATEGORIES } from '../constant';
import CustomerHeader from '../components/CustomerHeader';
import Navigation from '../components/Navigation';
import { useUserImage } from '../hooks/useUserImage';
import { getServices } from '../services/api_new';

interface LandingViewProps {
  onStartService: (categoryId: string) => void;
}

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:8086').replace(/\/$/, '');

export const LandingView: React.FC<LandingViewProps> = ({ onStartService }) => {
  const [active, setActive] = useState<'home' | 'services' | 'wallet' | 'support' | 'profile'>('home');
  const [popularProviders, setPopularProviders] = useState<any[]>([]);
  const [popularProvidersLoading, setPopularProvidersLoading] = useState(true);
  const [platformUsers, setPlatformUsers] = useState(0);
  const [animatedUserCount, setAnimatedUserCount] = useState(0);
  const [countLoadFailed, setCountLoadFailed] = useState(false);
  const userImage = useUserImage();

  useEffect(() => {
    const loadPopularProviders = async () => {
      try {
        const services = await getServices();
        const providerMap = new Map<string, any>();

        (Array.isArray(services) ? services : []).forEach((service: any) => {
          const provider = service?.providers || service?.provider;
          if (!provider?.id) return;

          const providerName = [
            provider?.users?.profiles?.firstName,
            provider?.users?.profiles?.lastName
          ]
            .filter(Boolean)
            .join(' ')
            .trim() || provider?.businessName || 'Provider';

          const current = providerMap.get(provider.id);
          const rating = Number(provider?.rating || 0);
          const totalJobs = Number(provider?.totalOrders || 0);

          if (!current || rating > current.rating || (rating === current.rating && totalJobs > current.totalJobs)) {
            providerMap.set(provider.id, {
              id: provider.id,
              name: providerName,
              rating,
              totalJobs,
              image: provider?.users?.profiles?.avatar || null
            });
          }
        });

        const ranked = Array.from(providerMap.values())
          .sort((a, b) => (b.rating - a.rating) || (b.totalJobs - a.totalJobs))
          .slice(0, 4);

        setPopularProviders(ranked);
      } catch (error) {
        console.error('Failed to load popular providers:', error);
        setPopularProviders([]);
      } finally {
        setPopularProvidersLoading(false);
      }
    };

    loadPopularProviders();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadPlatformStats = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/services/stats/platform`);
        const raw = await response.text();
        const payload = raw ? JSON.parse(raw) : null;

        if (!mounted) return;
        if (
          response.ok &&
          payload?.success &&
          typeof payload?.data?.totalUsers === 'number'
        ) {
          setPlatformUsers(Math.max(payload.data.totalUsers, 0));
          setCountLoadFailed(false);
        } else {
          setPlatformUsers(0);
          setCountLoadFailed(true);
        }
      } catch (error) {
        if (mounted) {
          setPlatformUsers(0);
          setCountLoadFailed(true);
        }
      }
    };

    loadPlatformStats();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let animationFrame = 0;
    const durationMs = 1400;
    let startTime = 0;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);
      setAnimatedUserCount(Math.floor(progress * platformUsers));

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(step);
      }
    };

    setAnimatedUserCount(0);
    animationFrame = window.requestAnimationFrame(step);

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [platformUsers]);

  const handleNavigate = (page: 'home' | 'services' | 'wallet' | 'support' | 'profile' | 'CheckAvailability') => {
    // Only update active state for main navigation items
    if (page !== 'CheckAvailability') {
      setActive(page);
    }
    
    // Navigate to the appropriate route
    switch (page) {
      case 'home':
        window.location.href = '/customer/home';
        break;
      case 'services':
        window.location.href = '/customer/services';
        break;
      case 'wallet':
        window.location.href = '/customer/wallet';
        break;
      case 'support':
        window.location.href = '/customer/support/dashboard';
        break;
      case 'profile':
        window.location.href = '/customer/profile';
        break;
      case 'CheckAvailability':
        window.location.href = '/customer/check-availability';
        break;
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1721]">
      {/* Header */}
      <CustomerHeader userImage={userImage} />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
      
      {/* Hero Section */}
      <section className="relative rounded-[40px] overflow-hidden bg-gradient-to-r from-purple-600 to-pink-500 p-8 md:p-12 min-h-[400px] flex flex-col md:flex-row items-center gap-10">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
            Service at Your Doorstep
          </h1>
          <p className="text-white/90 text-lg max-w-md">
            From AC repairs to car care, book certified professionals with transparent pricing and swift support.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => onStartService('')}
              className="bg-[#9333EA] text-white px-8 py-3 rounded-full font-bold hover:bg-purple-700 transition-all shadow-lg"
            >
              Book Now
            </button>
            <button 
              onClick={() => handleNavigate('CheckAvailability')}
              className="bg-black text-white px-8 py-3 rounded-full font-bold hover:bg-black/80 transition-all shadow-lg"
            >
              Explore Services
            </button>
          </div>
        </div>
        <div className="flex-1 w-full max-w-xl">
          <div className="relative rounded-[32px] overflow-hidden border-4 border-white/20 shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&q=80&w=800" 
              alt="Home Service" 
              className="w-full h-[240px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-[#152233] border border-slate-800 rounded-[32px] p-8">
        <div className="text-center sm:text-left">
          <p className="text-4xl font-extrabold text-white">{animatedUserCount.toLocaleString('en-IN')}</p>
          <p className="text-slate-400 text-sm font-medium mt-1">Total Active Users</p>
        </div>
        <p className="text-slate-500 text-xs mt-4">
          Live user count from database for Tirunelveli.
          {countLoadFailed ? ' Unable to load latest count right now.' : ''}
        </p>
      </section>

      {/* Service Categories */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Service Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <button 
              key={cat.id} 
              onClick={() => onStartService(cat.id)}
              className="bg-[#152233] border border-slate-800 rounded-[24px] p-6 flex items-center gap-4 hover:border-pink-500/50 transition-all group"
            >
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center text-pink-600">
                {cat.id === 'mobile' && <Smartphone className="w-6 h-6" />}
                {cat.id === 'bike' && <Bike className="w-6 h-6" />}
                {cat.id === 'car' && <Car className="w-6 h-6" />}
                {cat.id === 'ac' && <Wind className="w-6 h-6" />}
              </div>
              <span className="text-lg font-bold text-slate-200 group-hover:text-white">{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Popular Providers */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Popular Providers</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularProvidersLoading ? (
            <div className="sm:col-span-2 lg:col-span-4 text-slate-300">Loading providers...</div>
          ) : popularProviders.length > 0 ? (
            popularProviders.map((provider) => (
              <div key={provider.id} className="bg-[#152233] border border-slate-800 rounded-[32px] p-6 space-y-4">
                <div className="flex items-center gap-3">
                  {provider.image ? (
                    <img src={provider.image} alt={provider.name} className="w-14 h-14 rounded-2xl object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <User className="w-6 h-6 text-slate-300" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-white">{provider.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span className="text-yellow-500 font-bold">{provider.rating > 0 ? provider.rating.toFixed(1) : 'New'}</span>
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      <span>{provider.totalJobs} jobs</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleNavigate('services')}
                  className="w-full bg-[#A855F7] text-white py-2.5 rounded-2xl font-bold text-sm hover:bg-purple-600 transition-all shadow-md"
                >
                  View Services
                </button>
              </div>
            ))
          ) : (
            <div className="sm:col-span-2 lg:col-span-4 text-slate-300">
              No provider data available yet.
            </div>
          )}
        </div>
      </section>

      {/* Home Services Banner */}
      <section className="bg-[#152233] border border-slate-800 rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4 text-center md:text-left">
          <h2 className="text-2xl font-bold text-white">Home Services at Your Home</h2>
          <p className="text-slate-400">Choose from curated at-home services delivered by vetted experts with premium quality standards.</p>
          <button className="px-6 py-2 border border-slate-700 rounded-full text-white text-sm font-semibold hover:bg-slate-800">
            Explore Services
          </button>
        </div>
        <div className="flex gap-2">
          {[1,2,3,4].map(i => (
             <img 
               key={i}
               src={`https://picsum.photos/400/400?random=service${i}`} 
               alt="" 
               className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover"
             />
          ))}
        </div>
      </section>

      {/* Special Offers */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Special Offers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Facial – Only ₹100", img: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=400", color: "border-pink-500" },
            { title: "AC Service – Flat 30% Off", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400", color: "border-purple-500" },
            { title: "Car Detailing – Save ₹500", img: "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=400", color: "border-pink-500" }
          ].map((offer, i) => (
            <div key={i} className={`relative rounded-[32px] overflow-hidden border-4 ${offer.color} group cursor-pointer h-[240px]`}>
              <img src={offer.img} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
              <div className="absolute inset-0 bg-black/40 flex items-end p-6">
                <span className="text-white font-bold text-lg">{offer.title}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Video Placeholder */}
      <section className="space-y-6 pb-24">
        <h2 className="text-2xl font-bold text-white">How to Book a Service</h2>
        <div className="bg-[#152233] border border-slate-800 border-dashed rounded-[32px] aspect-video flex items-center justify-center text-slate-500 font-medium">
          Video placeholder
        </div>
      </section>

      </div>
      
      {/* Navigation */}
      <Navigation 
        active={active}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default LandingView;
