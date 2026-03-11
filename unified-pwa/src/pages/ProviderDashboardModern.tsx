import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar, 
  Star, 
  MapPin,
  MessageSquare, 
  Settings, 
  Bell, 
  Search,
  Filter,
  Plus,
  ArrowUp,
  ArrowDown,
  Clock,
  Check,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Eye,
  Edit,
  MoreVertical,
  Download,
  BarChart3,
  PieChart,
  Target,
  X,
  Zap
} from 'lucide-react';
import { io } from 'socket.io-client';
import { Button } from '../ui/components/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/components/Card';
import { Input } from '../ui/components/Input';
import { Avatar } from '../ui/components/Avatar';
import { cn } from '../ui/utils/cn';

interface ProviderDashboardProps {
  onNavigate?: (page: string) => void;
}

const mockStats = {
  totalRevenue: 125000,
  monthlyRevenue: 25000,
  totalOrders: 156,
  activeOrders: 8,
  completionRate: 98,
  averageRating: 4.9,
  responseTime: '2 hours',
  repeatCustomers: 45
};

const mockRevenueData = [
  { month: 'Jan', revenue: 18000 },
  { month: 'Feb', revenue: 22000 },
  { month: 'Mar', revenue: 25000 },
  { month: 'Apr', revenue: 21000 },
  { month: 'May', revenue: 28000 },
  { month: 'Jun', revenue: 25000 }
];

const mockRecentOrders = [
  {
    id: 1,
    customer: 'Sarah Johnson',
    service: 'Home Cleaning',
    date: '2025-03-15',
    time: '10:00 AM',
    status: 'active',
    price: 1200,
    urgency: 'normal'
  },
  {
    id: 2,
    customer: 'Mike Chen',
    service: 'AC Repair',
    date: '2025-03-14',
    time: '2:00 PM',
    status: 'completed',
    price: 800,
    urgency: 'high'
  },
  {
    id: 3,
    customer: 'Emily Davis',
    service: 'Phone Repair',
    date: '2025-03-13',
    time: '11:00 AM',
    status: 'completed',
    price: 500,
    urgency: 'normal'
  },
  {
    id: 4,
    customer: 'Robert Wilson',
    service: 'Moving Service',
    date: '2025-03-12',
    time: '9:00 AM',
    status: 'cancelled',
    price: 2000,
    urgency: 'low'
  }
];

const mockServices = [
  {
    id: 1,
    name: 'Premium Home Cleaning',
    category: 'Cleaning',
    price: 1200,
    orders: 45,
    rating: 4.9,
    status: 'active'
  },
  {
    id: 2,
    name: 'AC Repair & Maintenance',
    category: 'Repairs',
    price: 800,
    orders: 32,
    rating: 4.8,
    status: 'active'
  },
  {
    id: 3,
    name: 'Phone Screen Replacement',
    category: 'Tech',
    price: 500,
    orders: 28,
    rating: 4.7,
    status: 'paused'
  }
];

interface IncomingRequest {
  id: string;
  providerId?: string;
  customer: string;
  rating: number;
  reviewCount: number;
  service: string;
  earnings: number;
  distance: string;
  address: string;
  expiresInSeconds: number;
}

export default function ProviderDashboardModern({ onNavigate }: ProviderDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');
  const [incomingRequest, setIncomingRequest] = useState<IncomingRequest | null>(null);
  const [expiresIn, setExpiresIn] = useState(0);

  const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  const getAuthToken = () =>
    localStorage.getItem('token') || localStorage.getItem('accessToken') || '';

  const normalizeIncomingOrder = (order: any): IncomingRequest => ({
    id: String(order?.id || order?.orderId || '').trim(),
    providerId: order?.providerId || order?.provider_id,
    customer: order?.customerName || order?.customer || order?.customer_name || 'New Customer',
    rating: Number(order?.rating ?? 4.9),
    reviewCount: Number(order?.reviewCount ?? order?.reviews ?? 0),
    service: order?.service || order?.serviceName || order?.service_name || 'Service Request',
    earnings: Number(order?.price ?? order?.amount ?? order?.earnings ?? 0),
    distance: String(order?.distance || order?.distanceAway || order?.distance_away || order?.location || 'N/A'),
    address: order?.location || order?.address || 'Location not provided',
    expiresInSeconds: Number(order?.countdown ?? order?.expiresInSeconds ?? 30)
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'paused': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'normal': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  React.useEffect(() => {
    const token = getAuthToken();
    const providerId = localStorage.getItem('providerId') || '';
    const socket = io(API_BASE || window.location.origin, {
      transports: ['websocket'],
      withCredentials: true,
      auth: token ? { token } : undefined
    });

    socket.emit('join_provider_room');

    socket.on('new_service_request', (order: any) => {
      if (providerId && order?.providerId && String(order.providerId) !== String(providerId)) return;
      const normalized = normalizeIncomingOrder(order);
      if (!normalized.id) return;
      setIncomingRequest(normalized);
      setExpiresIn(normalized.expiresInSeconds);
    });

    socket.on('order_taken', (payload: any) => {
      const takenId = String(payload?.orderId || payload || '').trim();
      if (!takenId) return;
      setIncomingRequest((current) => {
        if (current && current.id === takenId) {
          return null;
        }
        return current;
      });
    });

    socket.on('order_expired', (payload: any) => {
      const expiredId = String(payload?.orderId || payload || '').trim();
      if (!expiredId) return;
      setIncomingRequest((current) => {
        if (current && current.id === expiredId) {
          return null;
        }
        return current;
      });
    });

    socket.on('disconnect', () => {
      setIncomingRequest(null);
      setExpiresIn(0);
    });

    return () => {
      socket.off('new_service_request');
      socket.off('order_taken');
      socket.off('order_expired');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [API_BASE]);

  React.useEffect(() => {
    if (!incomingRequest) return;
    setExpiresIn(incomingRequest.expiresInSeconds);
    const timer = window.setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIncomingRequest(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [incomingRequest, API_BASE]);

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    const token = getAuthToken();
    if (!token) return;
    const endpoint = API_BASE ? `${API_BASE}/api/provider/orders/accept` : '/api/provider/orders/accept';
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId: incomingRequest.id })
      });
    } catch {
      // ignore for now
    }
    setIncomingRequest(null);
  };

  const handleDeclineRequest = async () => {
    if (!incomingRequest) return;
    const token = getAuthToken();
    if (!token) return;
    const endpoint = API_BASE ? `${API_BASE}/api/provider/orders/decline` : '/api/provider/orders/decline';
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ orderId: incomingRequest.id })
      });
    } catch {
      // ignore for now
    }
    setIncomingRequest(null);
  };

  const formatExpires = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const showAwayLabel = (value: string) => /mile|km|mi/i.test(String(value || ''));

  return (
    <div className="min-h-screen bg-gray-50">
      {incomingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-6 text-center text-white">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">New Service Request!</h2>
            </div>

            <div className="px-6 py-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-xs uppercase tracking-[0.2em] text-gray-400">
                    Client Profile
                  </div>
                  <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <h3 className="mt-4 text-xl font-semibold text-gray-900">{incomingRequest.customer}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  <span className="font-semibold text-orange-500">{incomingRequest.rating.toFixed(1)}</span>
                  <Star className="inline-block h-3.5 w-3.5 text-orange-400 ml-1 mr-1" />
                  ({incomingRequest.reviewCount} reviews)
                </p>
              </div>

              <div className="mt-6 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700 flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4" />
                </div>
                {incomingRequest.service}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Potential Earnings</p>
                  <p className="mt-2 text-2xl font-semibold text-orange-600">${incomingRequest.earnings.toFixed(2)}</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400">Location</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">{incomingRequest.distance}</p>
                  {showAwayLabel(incomingRequest.distance) && (
                    <p className="text-xs text-gray-500">away</p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <span>{incomingRequest.address}</span>
              </div>

              <div className="mt-6 space-y-3">
                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white" onClick={handleAcceptRequest}>
                  <Check className="h-4 w-4 mr-2" />
                  Accept Order
                </Button>
                <Button className="w-full" variant="outline" onClick={handleDeclineRequest}>
                  <X className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </div>
            </div>

            <div className="border-t border-gray-100 px-6 py-3 text-center text-xs text-gray-500">
              Expires in {formatExpires(expiresIn)}
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                <span className="text-white font-bold text-xl">S</span>
              </div>
              <div>
                <div className="text-gray-900 text-lg font-bold">ServoLay</div>
                <div className="text-gray-500 text-xs">Provider Dashboard</div>
              </div>
            </div>

            {/* Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <Input
                type="text"
                placeholder="Search orders, customers..."
                leftIcon={<Search className="h-5 w-5 text-gray-400" />}
              />
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <MessageSquare className="h-5 w-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-3">
                <Avatar size="sm" fallback="PS" />
                <div className="hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">Pro Services</div>
                  <div className="text-xs text-gray-500">Top Provider</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, Provider! 👋
          </h1>
          <p className="text-gray-600">
            Here's your business performance overview.
          </p>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-green-800">Revenue Overview</CardTitle>
              <div className="flex gap-2">
                {['week', 'month', 'year'].map((period) => (
                  <Button
                    key={period}
                    variant={selectedPeriod === period ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedPeriod(period)}
                    className={selectedPeriod === period ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <div className="text-3xl font-bold text-gray-900">₹{mockStats.monthlyRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mb-2">Monthly Revenue</div>
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">12%</span>
                    <span className="text-gray-600">vs last month</span>
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900">₹{mockStats.totalRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600 mb-2">Total Revenue</div>
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowUp className="h-4 w-4 text-green-600" />
                    <span className="text-green-600 font-medium">8%</span>
                    <span className="text-gray-600">vs last quarter</span>
                  </div>
                </div>
              </div>
              
              {/* Simple Revenue Chart */}
              <div className="h-32 flex items-end justify-between gap-2">
                {mockRevenueData.map((data, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div 
                      className="w-full bg-green-500 rounded-t"
                      style={{ height: `${(data.revenue / 28000) * 100}%` }}
                    ></div>
                    <span className="text-xs text-gray-600">{data.month}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-800">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Rating</span>
                </div>
                <span className="font-semibold text-gray-900">{mockStats.averageRating}/5.0</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Completion Rate</span>
                </div>
                <span className="font-semibold text-gray-900">{mockStats.completionRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Response Time</span>
                </div>
                <span className="font-semibold text-gray-900">{mockStats.responseTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm text-gray-700">Repeat Customers</span>
                </div>
                <span className="font-semibold text-gray-900">{mockStats.repeatCustomers}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{mockStats.totalOrders}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <ArrowUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{mockStats.activeOrders}</div>
              <div className="text-sm text-gray-600">Active Orders</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <ArrowUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">₹{mockStats.monthlyRevenue}</div>
              <div className="text-sm text-gray-600">Monthly Revenue</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-yellow-600" />
                </div>
                <ArrowUp className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{mockStats.repeatCustomers}%</div>
              <div className="text-sm text-gray-600">Repeat Rate</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card className="mb-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockRecentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{order.service}</h4>
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            getUrgencyColor(order.urgency)
                          )}>
                            {order.urgency}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{order.customer}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {order.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {order.time}
                          </span>
                          <span className="font-semibold text-gray-900">₹{order.price}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                          getStatusColor(order.status)
                        )}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Services Performance */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Services Performance</CardTitle>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockServices.map((service) => (
                    <div key={service.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{service.name}</h4>
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            getStatusColor(service.status)
                          )}>
                            {service.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{service.category}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ₹{service.price}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {service.orders} orders
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {service.rating}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Service
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  View Calendar
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Messages
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Business Insights */}
            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardContent className="p-6">
                <h4 className="font-semibold text-gray-900 mb-3">📈 Business Insights</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Best performing service</span>
                    <span className="font-medium text-gray-900">Home Cleaning</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peak booking time</span>
                    <span className="font-medium text-gray-900">10 AM - 2 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg. order value</span>
                    <span className="font-medium text-gray-900">₹850</span>
                  </div>
                </div>
                <Button size="sm" className="w-full mt-4">
                  View Detailed Analytics
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">Home Cleaning</h4>
                      <p className="text-xs text-gray-600">Tomorrow, 10:00 AM</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm">Service Review</h4>
                      <p className="text-xs text-gray-600">Pending response</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
