import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { 
  Search, X, Clock, DollarSign, ChevronDown, CheckCircle,
  Home, Briefcase, Heart, Users, Copyright, Gavel, FileText, TrendingUp
} from 'lucide-react';
import { servicePackageExamples, serviceCategories, getExamplesByCategory } from '../data/servicePackageExamples';

const categoryIcons: Record<string, any> = {
  'Property & Conveyancing': Home,
  'Business & Corporate': Briefcase,
  'Family Law': Heart,
  'Employment Law': Users,
  'Intellectual Property': Copyright,
  'Immigration': Users,
  'Litigation': Gavel,
  'Tax & Compliance': TrendingUp
};

export const LegalServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState('All Prices');

  const filteredServices = servicePackageExamples.filter(service => {
    const matchesCategory = selectedCategory === 'All Categories' || service.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesPrice = true;
    if (priceRange !== 'All Prices') {
      const minPrice = service.priceRange.min;
      if (priceRange === 'Under KES 10,000') matchesPrice = minPrice < 10000;
      else if (priceRange === 'KES 10,000 - 30,000') matchesPrice = minPrice >= 10000 && minPrice <= 30000;
      else if (priceRange === 'KES 30,000 - 50,000') matchesPrice = minPrice >= 30000 && minPrice <= 50000;
      else if (priceRange === 'Over KES 50,000') matchesPrice = minPrice > 50000;
    }

    return matchesCategory && matchesSearch && matchesPrice;
  });

  return (
    <GlobalLayout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3 text-gray-900">Legal Service Packages</h1>
            <p className="text-lg text-gray-700 max-w-2xl mx-auto">
              Fixed-price legal services by verified lawyers. Transparent pricing, clear deliverables, professional results.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for legal services... (e.g., 'land conveyancing', 'company registration')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg border-0 text-gray-900 focus:ring-2 focus:ring-blue-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                >
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-gray-200 sticky top-14 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All Categories">All Categories</option>
                {serviceCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Price Range Filter */}
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="All Prices">All Prices</option>
                <option value="Under KES 10,000">Under KES 10,000</option>
                <option value="KES 10,000 - 30,000">KES 10,000 - 30,000</option>
                <option value="KES 30,000 - 50,000">KES 30,000 - 50,000</option>
                <option value="Over KES 50,000">Over KES 50,000</option>
              </select>
            </div>

            <div className="text-sm text-gray-600">
              {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
            </div>
          </div>
        </div>
      </section>

      {/* Service Packages Grid */}
      <section className="py-8 bg-gray-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {filteredServices.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No services found matching your criteria.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All Categories');
                  setPriceRange('All Prices');
                  setSearchQuery('');
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredServices.map((service) => {
                const IconComponent = categoryIcons[service.category] || Briefcase;
                return (
                  <div
                    key={service.id}
                    className="bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-lg transition-all p-6"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                            {service.category}
                          </span>
                          {service.subcategory && (
                            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                              {service.subcategory}
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {service.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {service.description}
                        </p>
                      </div>
                      <IconComponent className="h-6 w-6 text-gray-400 flex-shrink-0 ml-4" />
                    </div>

                    {/* Service Details */}
                    <div className="flex items-center justify-between text-sm mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>Delivery: {service.deliveryTime}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">Starting from</p>
                        <p className="text-xl font-bold text-gray-900">
                          KES {service.priceRange.min.toLocaleString()}
                        </p>
                        {service.priceRange.max !== service.priceRange.min && (
                          <p className="text-xs text-gray-500">
                            Up to KES {service.priceRange.max.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* What's Included - Collapsible */}
                    <details className="mb-4">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2 mb-2">
                        <ChevronDown className="h-4 w-4" />
                        What's included ({service.whatIncluded.length} items)
                      </summary>
                      <ul className="mt-3 space-y-2 pl-6">
                        {service.whatIncluded.map((item, idx) => (
                          <li key={idx} className="text-xs text-gray-600 flex items-start gap-2">
                            <CheckCircle className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </details>

                    {/* Target Clients */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Ideal for:</p>
                      <div className="flex flex-wrap gap-2">
                        {service.targetClients.map((client, idx) => (
                          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {client}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Legal Basis */}
                    {service.legalBasis && service.legalBasis.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-700 mb-2">Legal basis:</p>
                        <div className="flex flex-wrap gap-2">
                          {service.legalBasis.map((law, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                              {law}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* CTA */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => navigate('/lawyers')}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Find Lawyers
                      </button>
                      <button
                        onClick={() => navigate('/lawyers', { state: { fromService: service.title } })}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-gradient-to-br from-gray-50 to-blue-50 border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">Why Choose Our Legal Service Packages?</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Fixed Pricing</h3>
              <p className="text-sm text-gray-600">Know exactly what you'll pay upfront. No hidden fees or surprises.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Verified Lawyers</h3>
              <p className="text-sm text-gray-600">All lawyers are verified members of the Law Society of Kenya.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Clear Deliverables</h3>
              <p className="text-sm text-gray-600">Every package lists exactly what you'll receive.</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold mb-2">Time Estimates</h3>
              <p className="text-sm text-gray-600">Clear delivery timeframes so you can plan accordingly.</p>
            </div>
          </div>
        </div>
      </section>
    </GlobalLayout>
  );
};

export default LegalServicesPage;
