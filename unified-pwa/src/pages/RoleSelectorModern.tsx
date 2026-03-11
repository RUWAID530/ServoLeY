import React, { useMemo, useState } from 'react';
import { ArrowRight, Check, ChevronLeft } from 'lucide-react';

interface RoleSelectorProps {
  onNavigate: (page: string) => void;
}

type RoleId = 'customer' | 'provider' | 'store-owner';

const roleCards: Array<{
  id: RoleId;
  title: string;
  description: string;
  image: string;
}> = [
  {
    id: 'customer',
    title: 'Customer',
    description: 'Explore a world of services and products. Book appointments, shop locally, and manage your orders with ease.',
    image:
      'https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'provider',
    title: 'Service Provider',
    description: 'Offer your professional skills to local customers. Manage your schedule, earnings, and grow your reputation.',
    image:
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=900&q=80'
  },
  {
    id: 'store-owner',
    title: 'Store Owner',
    description: 'Open your digital storefront and reach thousands. Inventory management, sales tracking, and delivery logistics.',
    image:
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=80'
  }
];

const buttonLabel: Record<RoleId, string> = {
  customer: 'Continue with Customer Role',
  provider: 'Continue with Service Provider Role',
  'store-owner': 'Continue with Store Owner Role'
};

export default function RoleSelectorModern({ onNavigate }: RoleSelectorProps) {
  const [selectedRole, setSelectedRole] = useState<RoleId>('customer');

  const selectedCard = useMemo(
    () => roleCards.find((role) => role.id === selectedRole) || roleCards[0],
    [selectedRole]
  );

  const handleContinue = () => {
    if (selectedRole === 'customer') {
      onNavigate('customersignup');
      return;
    }

    if (selectedRole === 'provider') {
      onNavigate('providersignup');
      return;
    }

    onNavigate('providersignup?role=store-owner');
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-900">
      <div className="mx-auto w-full max-w-6xl px-3 pb-28 pt-3 sm:px-5 sm:pb-32 sm:pt-5">
        <header className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-200"
            aria-label="Go back"
          >
            <ChevronLeft size={20} />
          </button>
          <p className="text-sm font-semibold text-slate-900">Step 1 of 3</p>
          <div className="h-9 w-9" />
        </header>

        <section className="mb-6 text-center">
          <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">Choose Your Role</h1>
          <p className="mx-auto max-w-xl text-base text-slate-600 sm:text-lg">
            Select how you'd like to use the platform. You can add more roles later.
          </p>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roleCards.map((role) => {
            const isSelected = selectedRole === role.id;

            return (
              <button
                type="button"
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative overflow-hidden rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                  isSelected
                    ? 'border-[#168bb2] ring-1 ring-[#168bb2]'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {isSelected && (
                  <span className="absolute right-4 top-4 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#168bb2] text-white">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}

                <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                  <img src={role.image} alt={role.title} className="h-52 w-full object-cover md:h-48 xl:h-44" />
                </div>

                <h2 className="mb-2 text-3xl font-semibold leading-none tracking-tight text-slate-900 sm:text-4xl md:text-2xl">
                  {role.title}
                </h2>
                <p className="mb-4 text-sm leading-6 text-slate-600">{role.description}</p>

                <span className="inline-flex items-center text-sm font-semibold text-[#0d83a7]">
                  Learn more
                  <ArrowRight size={14} className="ml-1" />
                </span>
              </button>
            );
          })}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
          <div className="mb-3 flex items-center justify-center">
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80"
              alt="Community member 1"
              className="h-10 w-10 rounded-full border-2 border-white object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80"
              alt="Community member 2"
              className="-ml-3 h-10 w-10 rounded-full border-2 border-white object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
              alt="Community member 3"
              className="-ml-3 h-10 w-10 rounded-full border-2 border-white object-cover"
            />
            <span className="-ml-3 inline-flex h-10 min-w-10 items-center justify-center rounded-full border-2 border-white bg-[#168bb2] px-2 text-xs font-semibold text-white">
              +10k
            </span>
          </div>
          <p className="text-base text-slate-800">Join over 10,000 users connecting on the platform today.</p>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:px-5">
        <div className="mx-auto w-full max-w-6xl">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full rounded-xl bg-[#0f8fb7] px-4 py-3 text-base font-semibold text-white shadow-md transition hover:bg-[#0d7ea1]"
          >
            {buttonLabel[selectedCard.id]}
          </button>
          <p className="mt-3 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('auth')}
              className="font-semibold text-[#0f8fb7] hover:text-[#0d7ea1]"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
