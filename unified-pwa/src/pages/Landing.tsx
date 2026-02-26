import React from 'react';
import { Page } from '../App';
import { Star, ArrowRight } from 'lucide-react';

interface LandingProps {
  onNavigate: (page: Page) => void;
}

const services = [
  {
    icon: 'HC',
    title: 'Home Cleaning',
    description: 'Deep cleans, move-outs, and weekly upkeep tailored to your space.'
  },
  {
    icon: 'RI',
    title: 'Repairs & Install',
    description: 'ACs, appliances, fixtures and more - installed and fixed the right way.'
  },
  {
    icon: 'DT',
    title: 'Devices & Tech',
    description: 'Phone, laptop, and gadget rescue with certified technicians.'
  },
  {
    icon: 'AB',
    title: 'Auto & Bike Care',
    description: 'Deep detailing, servicing, and quick fixes for your ride.'
  },
  {
    icon: 'EP',
    title: 'Electrical & Plumbing',
    description: 'Licensed pros for wiring, leaks, fixtures, and emergency call-outs.'
  },
  {
    icon: 'MS',
    title: 'Move & Setup',
    description: 'Packers, movers and setup teams for a frictionless move-in day.'
  },
  {
    icon: 'HS',
    title: 'Home Styling',
    description: 'Painters, decorators and organizers to reset your surroundings.'
  },
  {
    icon: 'BS',
    title: 'Business Services',
    description: 'Office cleaning, maintenance and on-call support for teams.'
  }
];

const testimonials = [
  {
    name: 'Amira Khanna',
    role: 'Founder, SaaS Studio - Bengaluru',
    text: '"I tap a button on Friday, and my apartment is reset before Monday. Transparent pricing and the pros are always on time."',
    avatar: 'AK'
  },
  {
    name: 'Jordan Lee',
    role: 'Product Manager - Singapore',
    text: '"My AC failed mid-heatwave. ServoLay had a vetted technician at my door in under an hour."',
    avatar: 'JL'
  },
  {
    name: 'Luis Martinez',
    role: 'Designer - Madrid',
    text: '"From painting to furniture assembly, ServoLay turned my bare flat into a finished home in a weekend."',
    avatar: 'LM'
  }
];

const steps = [
  {
    num: 'Step 1',
    title: 'Describe your task',
    description: 'Search or pick a category, set your location and time window in under a minute.'
  },
  {
    num: 'Step 2',
    title: 'Match with vetted pros',
    description: 'We surface top-rated local professionals with transparent pricing and reviews.'
  },
  {
    num: 'Step 3',
    title: 'Track, rate & repeat',
    description: 'Track arrival in real-time, pay securely in-app, and favorite pros you love.'
  }
];

export default function Landing({ onNavigate }: LandingProps) {
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
          <button onClick={() => window.scrollTo({ top: 550, behavior: 'smooth' })} className="text-gray-300 hover:text-white transition-colors text-sm">How It Works</button>
          <button onClick={() => window.scrollTo({ top: 900, behavior: 'smooth' })} className="text-gray-300 hover:text-white transition-colors text-sm">Services</button>
          <button onClick={() => window.scrollTo({ top: 1600, behavior: 'smooth' })} className="text-gray-300 hover:text-white transition-colors text-sm">Reviews</button>
          <button onClick={() => alert('App download feature coming soon!')} className="text-gray-300 hover:text-white transition-colors text-sm">Download App</button>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => onNavigate('login')}
            className="text-gray-300 hover:text-white transition-colors text-sm px-4 py-2"
          >
            Login
          </button>
          <button
            onClick={() => onNavigate('role')}
            className="bg-gradient-to-r from-emerald-400 to-cyan-400 text-slate-900 font-medium text-sm px-6 py-2.5 rounded-full hover:shadow-lg transition-all"
          >
            Sign Up
          </button>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-20 sm:mb-32">
          <div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              Upgrade Your <span className="text-emerald-400">Everyday</span>
              <br />
              <span className="text-emerald-300">Tasks</span>
            </h1>
            <p className="text-gray-400 text-lg mb-8">
              Trusted local professionals - Fast booking - Transparent pricing
            </p>

            <div className="flex flex-wrap gap-3 mb-8">
              <span className="text-xs bg-slate-800 text-gray-300 px-4 py-2 rounded-full border border-slate-700">Under 60s booking</span>
              <span className="text-xs bg-slate-800 text-gray-300 px-4 py-2 rounded-full border border-slate-700">Verified experts only</span>
              <span className="text-xs bg-slate-800 text-gray-300 px-4 py-2 rounded-full border border-slate-700">Real-time availability</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => onNavigate('login')}
                className="bg-emerald-400 text-slate-900 font-semibold px-8 py-3 rounded-full hover:shadow-lg transition-all"
              >
                Book a Service
              </button>
              <button onClick={() => window.scrollTo({ top: 900, behavior: 'smooth' })} className="border border-slate-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-slate-800/50 transition-all">
                Browse Categories
              </button>
            </div>

            <div className="mt-8 space-y-2">
              <p className="text-gray-400 text-sm">Search for service</p>
              <p className="text-gray-300 text-sm">Cleaning, AC repair, phone fi...</p>
              <p className="text-gray-400 text-sm mt-4">Select location</p>
              <p className="text-gray-300 text-sm">Use current location</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-3xl blur-3xl"></div>
            <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center backdrop-blur">
                <div className="text-2xl mb-2">PR</div>
                <p className="text-gray-300 text-xs">Phone repair</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center backdrop-blur mt-8">
                <div className="text-2xl mb-2">EL</div>
                <p className="text-gray-300 text-xs">Electrician</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center backdrop-blur">
                <div className="text-2xl mb-2">CD</div>
                <p className="text-gray-300 text-xs">Car detailing</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center backdrop-blur">
                <div className="text-2xl mb-2">BT</div>
                <p className="text-gray-300 text-xs">Bike tune</p>
              </div>
              <div className="bg-emerald-400 rounded-2xl p-6 text-center col-span-1">
                <div className="text-3xl">+</div>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center backdrop-blur">
                <div className="text-2xl mb-2">AC</div>
                <p className="text-gray-300 text-xs">AC service</p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center backdrop-blur">
                <div className="text-2xl mb-2">PL</div>
                <p className="text-gray-300 text-xs">Plumbing</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 mb-20 sm:mb-32">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Services for every task</h2>
            <p className="text-gray-400">From emergencies to everyday upkeep, handpicked pros are a tap away.</p>
          </div>
          <button onClick={() => onNavigate('login')} className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold">View all services</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {services.map((service, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 hover:bg-slate-800/80 transition-all">
              <div className="text-3xl mb-3">{service.icon}</div>
              <h3 className="text-white font-semibold mb-2">{service.title}</h3>
              <p className="text-gray-400 text-sm">{service.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 mb-20 sm:mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">Loved by busy professionals.</h2>
          <p className="text-gray-400">98% of bookings rated 4.8+ or higher across thousands of serviced homes and offices.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{testimonial.avatar}</div>
                <div>
                  <p className="text-white font-semibold text-sm">{testimonial.name}</p>
                  <p className="text-gray-400 text-xs">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-gray-300 text-sm italic">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-8 py-16 mb-20 sm:mb-32">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-white mb-2">How ServoLay works</h2>
          <p className="text-gray-400">Three streamlined steps from task to done.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="text-4xl font-bold text-emerald-400 mb-2">{idx + 1}</div>
              <h3 className="text-white font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-400 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-700/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400"></div>
                <div>
                  <div className="text-white font-bold text-sm">ServoLay</div>
                  <div className="text-gray-400 text-xs">SMART SERVICES. DELIVERED FAST.</div>
                </div>
              </div>
              <p className="text-gray-400 text-sm">
                A premium service marketplace for people who value their time as much as their space. Curated professionals, instant booking.
              </p>
            </div>

            <div>
              <p className="text-white font-semibold mb-4 text-sm">Company</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => alert('About page coming soon!')} className="hover:text-white transition">About</button></li>
                <li><button onClick={() => alert('Careers page coming soon!')} className="hover:text-white transition">Careers</button></li>
                <li><button onClick={() => alert('Press page coming soon!')} className="hover:text-white transition">Press</button></li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold mb-4 text-sm">Support</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => alert('Contact page coming soon!')} className="hover:text-white transition">Contact</button></li>
                <li><button onClick={() => alert('Help Center coming soon!')} className="hover:text-white transition">Help Center</button></li>
                <li><button onClick={() => alert('Safety information coming soon!')} className="hover:text-white transition">Safety</button></li>
              </ul>
            </div>

            <div>
              <p className="text-white font-semibold mb-4 text-sm">Get the app</p>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => alert('App Store download coming soon!')} className="hover:text-white transition">Download on the</button></li>
                <li className="font-semibold">App Store</li>
                <li><button onClick={() => alert('Google Play download coming soon!')} className="hover:text-white transition">Get it on</button></li>
                <li className="font-semibold">Google Play</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700/50 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">Â© 2025 ServoLay Technologies. All rights reserved.</p>
            <div className="flex gap-6 text-gray-400 text-sm">
              <button onClick={() => alert('Terms of Service coming soon!')} className="hover:text-white transition">Terms</button>
              <button onClick={() => alert('Privacy Policy coming soon!')} className="hover:text-white transition">Privacy</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

