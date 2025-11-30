import React, { useState, useEffect } from 'react';
import { Briefcase, Plus, Package, Edit2, Trash2, Eye, DollarSign, Clock, Users, TrendingUp, ToggleLeft, ToggleRight } from 'lucide-react';
import { GlobalLayout } from '@/components/layout/GlobalLayout';
import axiosInstance from '@/services/axiosConfig';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  duration: string;
  deliveryTime: string;
  isActive: boolean;
  totalBookings: number;
  revenue: number;
  rating: number;
  tags: string[];
}

export const MyServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setLoading(true);
      // Mock service data
      const mockServices: Service[] = [
        {
          id: '1',
          title: 'Document Review & Certification',
          description: 'Professional legal document review with official certification and digital stamp',
          category: 'Document Services',
          price: 5000,
          duration: '2-3 days',
          deliveryTime: 'Express available',
          isActive: true,
          totalBookings: 45,
          revenue: 225000,
          rating: 4.8,
          tags: ['Certification', 'Legal Review', 'Official Stamp']
        },
        {
          id: '2',
          title: 'Contract Drafting',
          description: 'Custom contract drafting for employment, business partnerships, and commercial agreements',
          category: 'Legal Drafting',
          price: 15000,
          duration: '5-7 days',
          deliveryTime: 'Standard',
          isActive: true,
          totalBookings: 28,
          revenue: 420000,
          rating: 4.9,
          tags: ['Contracts', 'Business Law', 'Employment']
        },
        {
          id: '3',
          title: 'Legal Consultation (1 Hour)',
          description: 'One-on-one legal consultation session via video call or in-person',
          category: 'Consultation',
          price: 8000,
          duration: '1 hour',
          deliveryTime: 'Same day booking',
          isActive: true,
          totalBookings: 62,
          revenue: 496000,
          rating: 4.7,
          tags: ['Consultation', 'Video Call', 'Legal Advice']
        },
        {
          id: '4',
          title: 'Company Registration',
          description: 'End-to-end company registration services including documentation and filing',
          category: 'Corporate Services',
          price: 35000,
          duration: '10-14 days',
          deliveryTime: 'Government dependent',
          isActive: false,
          totalBookings: 12,
          revenue: 420000,
          rating: 5.0,
          tags: ['Corporate', 'Registration', 'Business']
        }
      ];
      setServices(mockServices);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const toggleServiceStatus = (serviceId: string) => {
    setServices(services.map(s => 
      s.id === serviceId ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const stats = {
    totalServices: services.length,
    activeServices: services.filter(s => s.isActive).length,
    totalBookings: services.reduce((sum, s) => sum + s.totalBookings, 0),
    totalRevenue: services.reduce((sum, s) => sum + s.revenue, 0)
  };

  return (
    <GlobalLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Services</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your service offerings and packages</p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Service
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalServices}</p>
              </div>
              <Package className="h-10 w-10 text-blue-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Services</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.activeServices}</p>
              </div>
              <Briefcase className="h-10 w-10 text-green-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{stats.totalBookings}</p>
              </div>
              <Users className="h-10 w-10 text-purple-600 opacity-20" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-indigo-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            </div>
          ) : services.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition group"
            >
              {/* Service Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{service.title}</h3>
                    <p className="text-sm text-gray-500">{service.category}</p>
                  </div>
                  <button
                    onClick={() => toggleServiceStatus(service.id)}
                    className="ml-2"
                    title={service.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {service.isActive ? (
                      <ToggleRight className="h-6 w-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
              </div>

              {/* Service Details */}
              <div className="p-6 space-y-4">
                {/* Price */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Price</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(service.price)}</span>
                </div>

                {/* Duration */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Duration</span>
                  <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {service.duration}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600">Bookings</p>
                    <p className="text-lg font-bold text-gray-900">{service.totalBookings}</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200"></div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(service.revenue)}</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200"></div>
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600">Rating</p>
                    <p className="text-lg font-bold text-yellow-600">★ {service.rating}</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {service.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    service.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-xs text-gray-500">{service.deliveryTime}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition flex items-center justify-center gap-1">
                  <Eye className="h-4 w-4" />
                  View
                </button>
                <button className="flex-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition flex items-center justify-center gap-1">
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
                <button className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GlobalLayout>
  );
};
