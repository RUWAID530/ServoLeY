import { Settings } from 'lucide-react';

// Define types based on component usage
interface AddOn {
  id: string;
  name: string;
  price: number;
  created_at?: string;
  updated_at?: string;
}

interface SettingsType {
  id: string;
  currency: string;
  tax_rate: number;
  buffer_time_minutes: number;
  booking_window_days: number;
  auto_approve: boolean;
  require_deposit: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SummaryProps {
  activeCount: number;
  avgPrice: number;
  avgDuration: number;
  addOns: AddOn[];
  settings: SettingsType | null;
  onManage: () => void;
  onUpdateSettings: (settings: Partial<SettingsType>) => void;
}

export function Summary({
  activeCount,
  avgPrice,
  avgDuration,
  addOns,
  settings,
  onManage,
  onUpdateSettings,
}: SummaryProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Summary</h2>
        <button
          onClick={onManage}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg text-sm font-medium transition-colors"
        >
          Manage
        </button>
      </div>

      <div className="bg-teal-700 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Active services</h3>
        <p className="text-3xl font-bold">{activeCount}</p>
      </div>

      <div className="bg-teal-700 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Avg. price</h3>
        <p className="text-3xl font-bold">${Math.floor(avgPrice)}</p>
      </div>

      <div className="bg-teal-700 rounded-lg p-4">
        <h3 className="text-sm font-medium mb-2">Avg. duration</h3>
        <p className="text-3xl font-bold">{formatDuration(avgDuration)}</p>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold mb-3">Popular add-ons</h3>
        <ul className="space-y-2">
          {addOns.map((addOn) => (
            <li key={addOn.id} className="flex justify-between items-center text-sm">
              <span>{addOn.name}</span>
              <span className="font-semibold">+${Math.floor(addOn.price)}</span>
            </li>
          ))}
        </ul>
      </div>

      {settings && (
        <div className="bg-slate-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3">Default settings</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Buffer time</label>
              <div className="bg-slate-900 rounded px-3 py-2 text-sm">
                {settings.buffer_time_minutes} min
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Booking window</label>
              <div className="bg-slate-900 rounded px-3 py-2 text-sm">
                {settings.booking_window_days} days
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Auto-approve</label>
              <button
                onClick={() => onUpdateSettings({ auto_approve: !settings.auto_approve })}
                className="w-full flex items-center justify-between bg-slate-900 rounded px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
              >
                <span>{settings.auto_approve ? 'On' : 'Off'}</span>
                <div className={`w-3 h-3 rounded-full ${settings.auto_approve ? 'bg-green-500' : 'bg-slate-600'}`}></div>
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Require deposit</label>
              <button
                onClick={() => onUpdateSettings({ require_deposit: !settings.require_deposit })}
                className="w-full flex items-center justify-between bg-slate-900 rounded px-3 py-2 text-sm hover:bg-slate-700 transition-colors"
              >
                <span>{settings.require_deposit ? 'On' : 'Off'}</span>
                <div className={`w-3 h-3 rounded-full ${settings.require_deposit ? 'bg-green-500' : 'bg-slate-600'}`}></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
