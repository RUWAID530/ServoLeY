import { Page } from '../App';
import { Check } from 'lucide-react';
import { useState } from 'react';

interface RoleSelectionProps {
  onNavigate: (page: Page) => void;
}

export default function RoleSelection({ onNavigate }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'provider'>('customer');

  return (
    <div className="min-h-screen">
      <nav className="flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 py-4 sm:py-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400"></div>
          <div>
            <div className="text-white text-lg font-bold">ServoLay</div>
            <div className="text-gray-400 text-xs tracking-wider">SMART SERVICES. DELIVERED FAST.</div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">How It Works</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Services</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Reviews</a>
          <a href="#" className="text-gray-300 hover:text-white transition-colors text-sm">Download App</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => onNavigate('login')}
            className="text-gray-300 hover:text-white transition-colors text-sm px-4 py-2"
          >
            Login
          </button>
          <button onClick={() => onNavigate('role')} className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 font-medium text-sm px-6 py-2.5 rounded-full hover:shadow-lg transition-all">
            Sign Up
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-16 lg:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            How will you use <span className="text-emerald-400">ServoLay</span> today?
          </h1>

          <p className="text-gray-400 mb-8 leading-relaxed">
            Pick the workspace that best matches what you want to do right now.
            You can always switch between customer and provider modes later.
          </p>

          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-gray-300">
              <span className="text-emerald-400 mt-1">●</span>
              <span>One secure account for both booking services and offering them.</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <span className="text-emerald-400 mt-1">●</span>
              <span>Context-aware dashboards tailored to your current role.</span>
            </li>
            <li className="flex items-start gap-3 text-gray-300">
              <span className="text-emerald-400 mt-1">●</span>
              <span>Instantly resume your last session in either customer or provider view.</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-3xl p-5 sm:p-8 border border-slate-700/50 shadow-2xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Select your starting role</h2>
              <p className="text-gray-400 text-sm">
                We'll tune navigation, shortcuts, and recommendations based on what you choose.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <div className="w-2 h-2 rounded-full bg-slate-600"></div>
            </div>
          </div>

          <div className="mb-3 text-xs text-gray-500 uppercase tracking-wider">Role selection</div>

          <div className="space-y-4 mb-6">
            <button
              onClick={() => setSelectedRole('customer')}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                selectedRole === 'customer'
                  ? 'bg-slate-700/30 border-emerald-400/50'
                  : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-semibold">Customer</span>
                    <span className="text-xs text-gray-400">Book services</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    Find vetted local pros, compare options, and schedule visits in a few taps.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-slate-700/50 text-gray-300 px-3 py-1 rounded-full">
                      Instant & scheduled bookings
                    </span>
                    <span className="text-xs bg-slate-700/50 text-gray-300 px-3 py-1 rounded-full">
                      Secure payments
                    </span>
                    <span className="text-xs bg-slate-700/50 text-gray-300 px-3 py-1 rounded-full">
                      Real-time tracking
                    </span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedRole === 'customer'
                    ? 'border-emerald-400 bg-emerald-400'
                    : 'border-slate-600'
                }`}>
                  {selectedRole === 'customer' && (
                    <Check size={14} className="text-slate-900" strokeWidth={3} />
                  )}
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedRole('provider')}
              className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                selectedRole === 'provider'
                  ? 'bg-slate-700/30 border-emerald-400/50'
                  : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-semibold">Provider</span>
                    <span className="text-xs text-gray-400">Earn with your skills</span>
                  </div>
                  <p className="text-gray-400 text-sm mb-3">
                    List your services, set your schedule, and get paid for high-intent local jobs.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-slate-700/50 text-gray-300 px-3 py-1 rounded-full">
                      Leads that match your skills
                    </span>
                    <span className="text-xs bg-slate-700/50 text-gray-300 px-3 py-1 rounded-full">
                      Smart routing
                    </span>
                    <span className="text-xs bg-slate-700/50 text-gray-300 px-3 py-1 rounded-full">
                      Automated payouts
                    </span>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selectedRole === 'provider'
                    ? 'border-emerald-400 bg-emerald-400'
                    : 'border-slate-600'
                }`}>
                  {selectedRole === 'provider' && (
                    <Check size={14} className="text-slate-900" strokeWidth={3} />
                  )}
                </div>
              </div>
            </button>
          </div>

          <button
            onClick={() => onNavigate(selectedRole === 'provider' ? 'provider-signup' : 'customersignup')}
            className="w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-yellow-400 text-slate-900 font-semibold py-4 rounded-full hover:shadow-xl transition-all mb-4"
          >
            Continue as {selectedRole === 'customer' ? 'Customer' : 'Provider'}
          </button>

          <div className="text-center">
            <p className="text-gray-400 text-sm mb-2">Want to start as a provider instead?</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              You can change roles anytime from your profile menu. Your data and preferences stay synced across both views.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
