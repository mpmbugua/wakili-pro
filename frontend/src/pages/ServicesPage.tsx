import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { Video, MessageSquare, FileCheck, Clock, Star, ArrowRight, Filter } from 'lucide-react';
import axiosInstance from '../lib/axios';

interface Service {
  id: string;
  title: string;
  description: string;
  lawyerName: string;
  lawyerRating: number;
  price: number;
  duration: string;
  category: string;
  availability: string;
}

export const ServicesPage: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Services' },
    { id: 'consultation', name: 'Video Consultations' },
    { id: 'review', name: 'Document Review' },
    { id: 'representation', name: 'Legal Representation' },
    { id: 'advisory', name: 'Legal Advisory' }
  ];

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API endpoint
        // const response = await axiosInstance.get('/api/marketplace/services');
        
        // Mock data for now
        const mockServices: Service[] = [
          {
            id: '1',
            title: '30-Minute Legal Consultation',
            description: 'Get expert legal advice on employment, business, property, or family law matters.',
            lawyerName: 'Advocate Jane Mwangi',
            lawyerRating: 4.8,
            price: 3500,
            duration: '30 minutes',
            category: 'consultation',
            availability: 'Available Today'
          },
          {
            id: '2',
            title: 'Contract Review & Analysis',
            description: 'Comprehensive review of employment contracts, lease agreements, or business contracts.',
            lawyerName: 'Advocate John Kamau',
            lawyerRating: 4.9,
            price: 5000,
            duration: '2-3 business days',
            category: 'review',
            availability: 'Available This Week'
          },
          {
            id: '3',
            title: 'Business Registration Package',
            description: 'Complete business registration service including name search, CR12, and KRA PIN.',
            lawyerName: 'Advocate Sarah Wanjiru',
            lawyerRating: 4.7,
            price: 15000,
            duration: '7-14 days',
            category: 'advisory',
            availability: 'Available Now'
          },
          {
            id: '4',
            title: 'Court Representation - Civil Cases',
            description: 'Professional court representation for civil disputes, debt recovery, and contract matters.',
            lawyerName: 'Advocate Peter Ochieng',
            lawyerRating: 4.9,
            price: 50000,
            duration: 'Varies by case',
            category: 'representation',
            availability: 'Consultation Required'
          },
          {
            id: '5',
            title: 'Land Title Transfer Services',
            description: 'End-to-end land transfer services including due diligence, consent, and registration.',
            lawyerName: 'Advocate Mary Njeri',
            lawyerRating: 4.6,
            price: 25000,
            duration: '30-45 days',
            category: 'advisory',
            availability: 'Available This Month'
          },
          {
            id: '6',
            title: 'Divorce & Custody Consultation',
            description: 'Confidential consultation on divorce proceedings, child custody, and property division.',
            lawyerName: 'Advocate Grace Akinyi',
            lawyerRating: 4.8,
            price: 5000,
            duration: '1 hour',
            category: 'consultation',
            availability: 'Available Today'
          }
        ];

        setServices(mockServices);
      } catch (error) {
        console.error('Failed to fetch services:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const filteredServices = selectedCategory === 'all' 
    ? services 
    : services.filter(s => s.category === selectedCategory);

  return (
    <GlobalLayout>
      {/* Hero Section */}
      <section className="bg-white border-b border-blue-200 py-12">
        <div className="max-w-3xl mx-auto text-center px-4">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Professional Legal Services
          </h1>
          <p className="text-lg text-slate-600">
            Book video consultations, document reviews, and legal representation from qualified Kenyan advocates
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center space-x-4 flex-wrap gap-4">
          <Filter className="h-5 w-5 text-slate-600" />
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-2 rounded-full font-semibold transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary text-white shadow-medium'
                  : 'bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Services Grid */}
      <section className="container py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading services...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices.map((service) => (
              <div key={service.id} className="card hover:shadow-large transition-all">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{service.title}</h3>
                      <p className="text-slate-600 text-sm line-clamp-2 mb-3">{service.description}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-4 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{service.lawyerName}</p>
                        <div className="flex items-center mt-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="ml-1 text-sm text-slate-600">{service.lawyerRating}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">KES {service.price.toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {service.duration}
                      </div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                        {service.availability}
                      </span>
                    </div>

                    <Link
                      to={`/services/${service.id}`}
                      className="btn-primary w-full text-center inline-flex items-center justify-center"
                    >
                      Book Service
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filteredServices.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-600 text-lg">No services found in this category.</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <div className="card-gradient bg-gradient-to-r from-secondary to-slate-700 text-white p-12 rounded-2xl text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Can't Find What You Need?
          </h2>
          <p className="text-slate-100 mb-8 max-w-2xl mx-auto">
            Ask our AI assistant for free legal guidance or browse our network of qualified lawyers.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link to="/ai" className="bg-white text-secondary px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors text-lg font-semibold shadow-large">
              Ask AI Assistant
            </Link>
            <Link to="/lawyers" className="bg-slate-900 text-white px-8 py-4 rounded-xl hover:bg-black transition-colors text-lg font-semibold border-2 border-white">
              Find a Lawyer
            </Link>
          </div>
        </div>
      </section>
    </GlobalLayout>
  );
};
