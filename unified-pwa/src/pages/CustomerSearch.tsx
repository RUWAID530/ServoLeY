import React from "react";
import { Search, SlidersHorizontal, Smartphone, Bike, Car, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Service {
  image: string;
  title: string;
  provider: string;
  duration: string;
  price: number;
  rating: number;
  reviews: number;
  isMobile?: boolean;
}

const CustomerSearch = () => {
  
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filteredServices, setFilteredServices] = React.useState<Service[]>([]);


  const categories = [
    { icon: Smartphone, label: "Mobile", description: "Repairs • Setup • Battery" },
    { icon: Bike, label: "Bike", description: "Service • Repair • Detailing" },
    { icon: Car, label: "Car", description: "Maintenance • Wash • Detailing" },
  ];

  const services = [
    {
      image: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=200&h=200&fit=crop",
      title: "iPhone Screen Replacement",
      provider: "QuickFix Labs",
      duration: "45-60 mins",
      price: 129,
      rating: 4.9,
      reviews: 1200,
    },
    {
      image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&h=200&fit=crop",
      title: "Premium Car Detailing",
      provider: "ShinePro",
      duration: "2-3 hrs",
      price: 199,
      rating: 4.7,
      reviews: 860,
      isMobile: true,
    },
    {
      image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=200&h=200&fit=crop",
      title: "AC Deep Clean",
      provider: "ChillCare",
      duration: "60-90 mins",
      price: 89,
      rating: 4.8,
      reviews: 2100,
    },
  ];

  React.useEffect(() => {
    if (searchQuery) {
      const filtered = services.filter(service =>
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.provider.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices(services);
    }
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-dark-900 text-white pb-20 pt-4 animate-fadeIn">
      <div className="bg-gradient-to-b from-dark-800 to-dark-900 px-4 pt-3 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">ServoLey</h1>
            <p className="text-sm text-gray-400">Your trusted service partner</p>
          </div>
          <button onClick={() => navigate(-1)} className="p-2 bg-dark-700/60 rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>
      </div>

      <main className="px-4 pt-4 max-w-lg mx-auto">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories, services, providers"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-800/60 text-white placeholder-gray-400 pl-10 pr-12 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-dark-700 rounded-lg"
          >
            <SlidersHorizontal className="h-5 w-5 text-gray-300" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          <button className="px-4 py-2 bg-purple-600 text-white rounded-full text-sm whitespace-nowrap">
            All
          </button>
          <button className="px-4 py-2 bg-dark-800 text-gray-300 rounded-full text-sm whitespace-nowrap flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Offers
          </button>
          <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-full text-sm whitespace-nowrap">
            Same-day
          </button>
          <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-full text-sm whitespace-nowrap">
            Top
          </button>
        </div>

        {/* Categories */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3">Browse Categories</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category.label}
                onClick={() => navigate('/customer/services', { state: { category: category.label.toLowerCase() }})}
                className="flex-shrink-0 w-36 bg-dark-800/60 border border-dark-700 rounded-2xl p-4 hover:border-purple-500/50 transition-all"
              >
                <category.icon className="h-6 w-6 mb-2 text-purple-400" />
                <h3 className="font-semibold text-sm mb-1 text-white">{category.label}</h3>
                <p className="text-xs text-gray-400">{category.description}</p>
                {category.label === "Mobile" && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-400">
                    <Tag className="h-3 w-3" />
                    10% off
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Recommended */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3">Recommended for You</h2>
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <div key={service.title} className="bg-dark-800/60 rounded-xl p-4 flex gap-4 cursor-pointer" onClick={() => navigate('/provider-details', { 
                state: {
                  id: service.title,
                  name: service.provider,
                  category: service.title.includes("Car") ? "Car" : service.title.includes("iPhone") ? "Mobile" : "AC",
                  rating: service.rating,
                  jobsCompleted: service.reviews,
                  avatar: service.image,
                  verified: true
                } 
              })}>
                <img src={service.image} alt={service.title} className="w-20 h-20 rounded-lg object-cover" />
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{service.title}</h3>
                  <p className="text-sm text-gray-400 mb-2">{service.provider}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400">★ {service.rating}</span>
                      <span className="text-sm text-gray-400">({service.reviews})</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-white">${service.price}</p>
                      <p className="text-xs text-gray-400">{service.duration}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Popular Providers */}
        <section className="mb-6">
          <h2 className="text-lg font-bold mb-3">Popular Providers</h2>
          <div className="space-y-3">
            {[
              {
                name: "Sparkle Co.",
                category: "Cleaning",
                rating: 4.9,
                jobs: 2400,
                price: 59,
                avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
              },
              {
                name: "AquaTech",
                category: "Plumbing",
                rating: 4.7,
                jobs: 1100,
                price: 79,
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
              },
            ].map((provider) => (
              <div
                key={provider.name}
                className="flex items-center gap-3 bg-dark-800/60 border border-dark-700 rounded-2xl p-3 hover:border-purple-500/50 transition-all"
              >
                <img
                  src={provider.avatar}
                  alt={provider.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-white">{provider.name}</h3>
                  <p className="text-xs text-gray-400 mb-1">
                    {provider.category} • {provider.rating} ({provider.jobs}) • From ${provider.price}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/provider-details', { 
                    state: {
                      id: provider.name,
                      name: provider.name,
                      category: provider.category,
                      rating: provider.rating,
                      jobsCompleted: provider.jobs,
                      avatar: provider.avatar,
                      verified: true
                    } 
                  })}
                  className="px-3 py-1.5 bg-dark-700 text-white rounded-xl text-sm"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

    </div>
  );
};

export default CustomerSearch;
