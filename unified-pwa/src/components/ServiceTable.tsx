import { Edit } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  category_id: string;
  duration_minutes: number;
  price: number;
  status: string;
  category_name?: string;
  created_at?: string;
  updated_at?: string;
}

interface ServiceTableProps {
  services: Service[];
  onEdit: (id: string) => void;
  onDeactivate: (id: string) => void;
}

export function ServiceTable({ services, onEdit, onDeactivate }: ServiceTableProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const formatPrice = (price: number) => {
    return `Rs ${Math.floor(price)}`;
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-900/40 text-emerald-300';
      case 'pending_verification':
        return 'bg-amber-900/40 text-amber-300';
      case 'rejected':
        return 'bg-red-900/40 text-red-300';
      default:
        return 'bg-slate-700 text-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'pending_verification') return 'Pending Verification';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      <div className="lg:hidden space-y-3 p-3">
        {services.length === 0 ? (
          <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-4 text-center text-sm text-slate-300">
            No services found.
          </div>
        ) : (
          services.map((service) => (
            <div key={service.id} className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{service.name}</p>
                  <p className="text-xs text-slate-400">{service.category_name || 'N/A'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${getStatusStyle(service.status)}`}>
                  {getStatusLabel(service.status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div>
                  <p className="text-slate-400">Duration</p>
                  <p>{formatDuration(service.duration_minutes)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Price</p>
                  <p>{formatPrice(service.price)}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onEdit(service.id)}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded text-xs font-medium transition-colors flex items-center gap-1"
                >
                  <Edit size={13} />
                  Edit
                </button>
                {service.status === 'active' && (
                  <button
                    onClick={() => onDeactivate(service.id)}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 rounded text-xs font-medium transition-colors"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full min-w-[760px]">
          <thead className="bg-teal-700">
            <tr>
              <th className="text-left px-3 sm:px-6 py-3 text-sm font-semibold">Service</th>
              <th className="text-left px-3 sm:px-6 py-3 text-sm font-semibold">Category</th>
              <th className="text-left px-3 sm:px-6 py-3 text-sm font-semibold">Duration</th>
              <th className="text-left px-3 sm:px-6 py-3 text-sm font-semibold">Price</th>
              <th className="text-left px-3 sm:px-6 py-3 text-sm font-semibold">Status</th>
              <th className="text-left px-3 sm:px-6 py-3 text-sm font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {services.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-300">
                  No services found.
                </td>
              </tr>
            ) : (
              services.map((service, index) => (
                <tr
                  key={service.id}
                  className={`border-b border-slate-700 ${index % 2 === 0 ? 'bg-slate-800' : 'bg-slate-850'}`}
                >
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-600 rounded"></div>
                      <span className="font-medium">{service.name}</span>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4">{service.category_name || 'N/A'}</td>
                  <td className="px-3 sm:px-6 py-4">{formatDuration(service.duration_minutes)}</td>
                  <td className="px-3 sm:px-6 py-4">{formatPrice(service.price)}</td>
                  <td className="px-3 sm:px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(service.status)}`}>
                      {getStatusLabel(service.status)}
                    </span>
                  </td>
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => onEdit(service.id)}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 rounded text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <Edit size={14} />
                        Edit
                      </button>

                      {service.status === 'active' && (
                        <button
                          onClick={() => onDeactivate(service.id)}
                          className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 rounded text-sm font-medium transition-colors"
                        >
                          Deactivate
                        </button>
                      )}

                      {service.status === 'pending_verification' && (
                        <span className="px-3 py-1.5 bg-amber-900/40 text-amber-300 rounded text-sm font-medium">
                          Waiting admin review
                        </span>
                      )}

                      {service.status === 'rejected' && (
                        <span className="px-3 py-1.5 bg-red-900/40 text-red-300 rounded text-sm font-medium">
                          Rejected
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
