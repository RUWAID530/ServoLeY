import { Edit } from 'lucide-react';

// Define Service type based on component usage
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
    return `₹${Math.floor(price)}`;
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
    <div className="bg-slate-800 rounded-lg overflow-x-auto">
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
          {services.map((service, index) => (
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
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  getStatusStyle(service.status)
                }`}>
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
          ))}
        </tbody>
      </table>
    </div>
  );
}
