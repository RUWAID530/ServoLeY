import { Home, List, Wallet, HelpCircle, User, Briefcase } from 'lucide-react';

interface NavigationProps {
  active: 'home' | 'services' | 'wallet' | 'support' | 'profile';
  onNavigate: (page: 'home' | 'services' | 'wallet' | 'support' | 'profile') => void;
  onProviderRegister?: () => void;
  onCustomerService?: () => void;
}

export default function Navigation({ active, onNavigate, onProviderRegister, onCustomerService }: NavigationProps) {
  const items = [
    { id: 'home' as const, label: 'Home', icon: Home },
    { id: 'services' as const, label: 'Services', icon: List },
    { id: 'wallet' as const, label: 'Wallet', icon: Wallet },
    { id: 'support' as const, label: 'Support', icon: HelpCircle },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-gray-800 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-around px-4 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 px-6 py-2 rounded-full transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-gray-300 hover:bg-dark-800'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Provider Registration Link */}
      {onProviderRegister && (
        <div className="absolute bottom-20 right-4 z-10">
          <button
            onClick={onProviderRegister}
            className="bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all"
            title="Register as a Service Provider"
          >
            <Briefcase className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Customer Service Dashboard Link */}
      <div className="absolute bottom-20 left-4 z-10">
        <button
          onClick={() => {
            if (onCustomerService) {
              onCustomerService();
            } else {
              window.location.href = '/customer-service-dashboard';
            }
          }}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-all"
          title="Customer Service Dashboard"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
}
