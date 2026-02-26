import { ChevronLeft, MapPin, Share2, Heart, Crown, CheckCircle, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';


interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}

const SettingsItem = ({ icon, title, subtitle, onClick }: SettingsItemProps) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-gray-800/50 hover:bg-gray-800 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className="text-gray-400">{icon}</div>
      <span className="text-white font-medium text-sm sm:text-base">{title}</span>
    </div>
    <span className="text-gray-400 text-sm">{subtitle}</span>
  </button>
);

export const ProfilePage = () => {
  const { profile, signOut } = useAuth();

  if (!profile) {
    return <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center"><p>Please log in to view your profile.</p></div>;
  }

  const memberSinceYear = new Date(profile.member_since).getFullYear();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
          <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="text-sm sm:text-base font-medium">Profile</div>
          <div className="w-6 h-6"></div>
        </div>

        <div className="mb-6 sm:mb-8 lg:mb-10">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">ServoLey</h1>
          <p className="text-gray-400 text-sm sm:text-base lg:text-lg">Your Profile</p>
        </div>

        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-2xl sm:text-3xl font-bold">
                    {profile.full_name.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-xl sm:text-2xl font-bold">{profile.full_name}</h2>
                    {profile.is_premium && (
                      <span className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm sm:text-base">Member since {memberSinceYear} • ID: {profile.user_id_display}</p>
                </div>
              </div>
              <div className="flex gap-2 sm:self-center">
                <button className="p-2 sm:p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button className="p-2 sm:p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button className="p-2 sm:p-3 bg-gray-700/50 rounded-xl hover:bg-gray-700 transition-colors">
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mb-6">
              {profile.is_verified && (
                <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 text-xs sm:text-sm px-3 py-1.5 rounded-full">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                  Verified
                </div>
              )}
              <div className="flex items-center gap-1 bg-green-500/20 text-green-400 text-xs sm:text-sm px-3 py-1.5 rounded-full">
                <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                Push: {profile.push_enabled ? 'On' : 'Off'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
              <div className="bg-gray-800/50 rounded-2xl p-4 sm:p-5 lg:p-6">
                <p className="text-gray-400 text-sm sm:text-base mb-1">Total bookings</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{profile.total_bookings}</p>
              </div>
              <div className="bg-gray-800/50 rounded-2xl p-4 sm:p-5 lg:p-6">
                <p className="text-gray-400 text-sm sm:text-base mb-1">Active subscriptions</p>
                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">{profile.active_subscriptions}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8 lg:space-y-10">
          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 lg:mb-6">Account</h3>
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <SettingsItem
                icon={<span>👤</span>}
                title="Personal details"
                subtitle="Name, email, phone"
                onClick={() => alert('Personal details page would be implemented here')}
              />
              <SettingsItem
                icon={<span>🏠</span>}
                title="Addresses"
                subtitle="Home, office, others"
                onClick={() => alert('Addresses page would be implemented here')}
              />
              <SettingsItem
                icon={<span>💳</span>}
                title="Payment methods"
                subtitle="Cards, Apple Pay"
                onClick={() => alert('Payment methods page would be implemented here')}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 lg:mb-6">Preferences</h3>
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <SettingsItem
                icon={<Bell className="w-5 h-5" />}
                title="Notifications"
                subtitle="Reminders, promos"
                onClick={() => alert('Notifications page would be implemented here')}
              />
              <SettingsItem
                icon={<span>🌍</span>}
                title="Language & region"
                subtitle={profile.language}
                onClick={() => alert('Language & region settings would be implemented here')}
              />
              <SettingsItem
                icon={<span>🔒</span>}
                title="Privacy & security"
                subtitle="2FA, data controls"
                onClick={() => alert('Privacy & security settings would be implemented here')}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 lg:mb-6">Support</h3>
            <button className="w-full p-4 sm:p-5 rounded-2xl bg-gray-800/50 hover:bg-gray-800 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl">💬</span>
                  <span className="text-white font-medium text-sm sm:text-base">Need help with your account?</span>
                </div>
                <span className="bg-blue-600 text-white text-sm px-4 py-2 rounded-xl font-medium self-start sm:self-auto">Open</span>
              </div>
              <p className="text-gray-400 text-sm text-left ml-11 sm:ml-11">Access FAQs or contact premium support</p>
            </button>
          </div>

          <div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4 lg:mb-6 text-red-400">Danger zone</h3>
            <div className="space-y-2 sm:space-y-3 lg:space-y-4">
              <button
                onClick={signOut}
                className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-red-400">🚪</span>
                  <span className="text-red-400 font-medium">Sign out</span>
                </div>
                <span className="text-red-400/60 text-sm">From this device</span>
              </button>
              <button 
                onClick={() => alert('Delete account functionality would be implemented here')}
                className="w-full flex items-center justify-between p-4 sm:p-5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20"
              >
                <div className="flex items-center gap-3">
                  <span className="text-red-400">🗑️</span>
                  <span className="text-red-400 font-medium">Delete account</span>
                </div>
                <span className="text-red-400/60 text-sm">Permanently remove data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
