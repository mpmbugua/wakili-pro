import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';

interface Lawyer {
  id: string;
  userId: string; // The actual user ID to send to backend
  name: string;
  specialty: string;
  specializations?: string[]; // All specializations from backend
  location: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  hourlyRate: number;
  imageUrl: string;
  bio: string;
  languages: string[];
  availability: 'Available' | 'Busy' | 'Offline';
}

// Sample data (will be replaced with backend API call)
const sampleLawyers: Lawyer[] = [
  {
    id: '1',
    userId: 'sample-1', // Placeholder - real lawyers will have actual userIds
    name: 'Jane Wanjiru',
    specialty: 'Employment Law',
    specializations: ['EMPLOYMENT', 'Employment Law'],
    location: 'Nairobi',
    rating: 4.9,
    reviewCount: 127,
    yearsExperience: 12,
    hourlyRate: 3500,
    imageUrl: 'https://ui-avatars.com/api/?name=Jane+Wanjiru&background=3b82f6&color=fff&size=200',
    bio: 'Specialized in employment disputes, wrongful dismissal, and labor law. Successfully represented over 200 clients.',
    languages: ['English', 'Swahili'],
    availability: 'Available'
  },
  {
    id: '2',
    userId: 'sample-2',
    name: 'David Kamau',
    specialty: 'Property & Land Law',
    specializations: ['PROPERTY', 'Property Law', 'Property & Land Law'],
    location: 'Nairobi',
    rating: 4.8,
    reviewCount: 95,
    yearsExperience: 15,
    hourlyRate: 5000,
    imageUrl: 'https://ui-avatars.com/api/?name=David+Kamau&background=10b981&color=fff&size=200',
    bio: 'Expert in land transactions, title verification, and property disputes with extensive knowledge of Kenyan land law.',
    languages: ['English', 'Swahili'],
    availability: 'Available'
  },
  {
    id: '3',
    userId: 'sample-3',
    name: 'Sarah Ochieng',
    specialty: 'Family Law',
    specializations: ['FAMILY', 'Family Law'],
    location: 'Mombasa',
    rating: 5.0,
    reviewCount: 84,
    yearsExperience: 10,
    hourlyRate: 4000,
    imageUrl: 'https://ui-avatars.com/api/?name=Sarah+Ochieng&background=8b5cf6&color=fff&size=200',
    bio: 'Compassionate approach to divorce, child custody, and family matters. Certified mediator.',
    languages: ['English', 'Swahili', 'Luo'],
    availability: 'Busy'
  },
  {
    id: '4',
    userId: 'sample-4',
    name: 'Michael Kipchoge',
    specialty: 'Criminal Defense',
    specializations: ['CRIMINAL', 'Criminal Law', 'Criminal Defense'],
    location: 'Kisumu',
    rating: 4.7,
    reviewCount: 156,
    yearsExperience: 18,
    hourlyRate: 6000,
    imageUrl: 'https://ui-avatars.com/api/?name=Michael+Kipchoge&background=ef4444&color=fff&size=200',
    bio: 'Former prosecutor with deep understanding of criminal procedure. Aggressive defense representation.',
    languages: ['English', 'Swahili', 'Kalenjin'],
    availability: 'Available'
  },
  {
    id: '5',
    userId: 'sample-5',
    name: 'Grace Nyambura',
    specialty: 'Corporate Law',
    specializations: ['CORPORATE', 'Corporate Law'],
    location: 'Nairobi',
    rating: 4.9,
    reviewCount: 68,
    yearsExperience: 14,
    hourlyRate: 7000,
    imageUrl: 'https://ui-avatars.com/api/?name=Grace+Nyambura&background=f59e0b&color=fff&size=200',
    bio: 'Business law specialist helping startups and SMEs with incorporation, contracts, and compliance.',
    languages: ['English', 'Swahili'],
    availability: 'Available'
  },
  {
    id: '6',
    userId: 'sample-6',
    name: 'James Mutua',
    specialty: 'Immigration Law',
    specializations: ['IMMIGRATION', 'Immigration Law'],
    location: 'Nairobi',
    rating: 4.6,
    reviewCount: 42,
    yearsExperience: 8,
    hourlyRate: 3000,
    imageUrl: 'https://ui-avatars.com/api/?name=James+Mutua&background=06b6d4&color=fff&size=200',
    bio: 'Helping individuals and families navigate visa applications, work permits, and citizenship matters.',
    languages: ['English', 'Swahili', 'Kamba'],
    availability: 'Available'
  }
];

// Specialization mapping (must match backend LawyerProfile.specializations array values)
const SPECIALIZATION_MAP: { [key: string]: string[] } = {
  'All Specialties': [],
  'Employment Law': ['EMPLOYMENT', 'Employment Law'],
  'Property & Land Law': ['PROPERTY', 'Property Law', 'Property & Land Law'],
  'Family Law': ['FAMILY', 'Family Law'],
  'Criminal Defense': ['CRIMINAL', 'Criminal Law', 'Criminal Defense'],
  'Corporate Law': ['CORPORATE', 'Corporate Law'],
  'Immigration Law': ['IMMIGRATION', 'Immigration Law']
};

const specialties = ['All Specialties', 'Employment Law', 'Property & Land Law', 'Family Law', 'Criminal Defense', 'Corporate Law', 'Immigration Law'];
const locations = [
  'All Locations',
  'Nairobi',
  'Mombasa',
  'Kisumu',
  'Nakuru',
  'Eldoret',
  'Thika',
  'Malindi',
  'Kitale',
  'Garissa',
  'Kakamega',
  'Nyeri',
  'Machakos',
  'Meru',
  'Kericho',
  'Naivasha',
  'Nanyuki',
  'Voi',
  'Embu',
  'Bungoma',
  'Kilifi',
  'Lamu',
  'Migori',
  'Homa Bay',
  'Bomet',
  'Kajiado',
  'Kiambu',
  'Murang\'a',
  'Nyahururu',
  'Isiolo',
  'Kitui',
  'Makueni',
  'Narok',
  'Kapsabet',
  'Maralal',
  'Marsabit',
  'Moyale',
  'Mandera',
  'Wajir',
  'Lodwar',
  'Kapenguria',
  'Webuye',
  'Mumias',
  'Kimilili',
  'Busia',
  'Siaya',
  'Kisii',
  'Nyamira',
  'Kerugoya',
  'Karatina',
  'Naro Moru',
  'Mwingi',
  'Taveta',
  'Wundanyi',
  'Kwale',
  'Msambweni',
  'Ukunda',
  'Diani',
  'Watamu',
  'Chuka',
  'Maua',
  'Athi River',
  'Kangundo',
  'Ruiru',
  'Limuru',
  'Karuri',
  'Juja',
  'Githunguri',
  'Kiambu Town',
  'Ol Kalou',
  'Naivasha Town',
  'Gilgil',
  'Molo',
  'Njoro',
  'Rongai',
  'Narok Town',
  'Kilgoris',
  'Kapsabet Town',
  'Nandi Hills',
  'Burnt Forest',
  'Turbo',
  'Moi\'s Bridge',
  'Chepseon',
  'Lessos',
  'Kabarnet',
  'Eldama Ravine',
  'Marigat',
  'Mogotio',
  'Kitengela',
  'Ngong',
  'Kiserian',
  'Namanga'
];

export const LawyersBrowse: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [selectedLocation, setSelectedLocation] = useState('All Locations');
  const [sortBy, setSortBy] = useState<'rating' | 'price' | 'experience'>('rating');
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real lawyers from backend
  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        setLoading(true);
        // Fetch all verified lawyers (limit increased to get more results)
        const response = await axiosInstance.get('/lawyers?limit=100');
        if (response.data.success && response.data.data?.lawyers) {
          // Map backend response to our Lawyer interface
          const backendLawyers = response.data.data.lawyers.map((lawyer: any) => {
            // Helper function to convert specialization ID to display name
            const getSpecialtyDisplayName = (spec: string) => {
              const mapping: { [key: string]: string } = {
                'EMPLOYMENT': 'Employment Law',
                'PROPERTY': 'Property & Land Law',
                'FAMILY': 'Family Law',
                'CRIMINAL': 'Criminal Defense',
                'CORPORATE': 'Corporate Law',
                'IMMIGRATION': 'Immigration Law',
                'IP': 'Intellectual Property'
              };
              return mapping[spec] || spec;
            };
            
            return {
              id: lawyer.id,
              userId: lawyer.user?.id || lawyer.userId, // Important: use user.id from backend for booking
              name: `${lawyer.user?.firstName || ''} ${lawyer.user?.lastName || ''}`.trim() || 'Lawyer',
              specialty: lawyer.specializations?.[0] ? getSpecialtyDisplayName(lawyer.specializations[0]) : 'General Practice',
              specializations: lawyer.specializations || [], // Keep all specializations for filtering
              location: lawyer.location || 'Nairobi',
              rating: lawyer.rating || lawyer.averageRating || 4.5,
              reviewCount: lawyer.reviewCount || lawyer.totalReviews || 0,
              yearsExperience: lawyer.yearsOfExperience || 5,
              hourlyRate: lawyer.hourlyRate || 3500,
              imageUrl: lawyer.profileImageUrl || `https://ui-avatars.com/api/?name=${lawyer.user?.firstName}+${lawyer.user?.lastName}&background=3b82f6&color=fff&size=200`,
              bio: lawyer.bio || 'Experienced legal professional',
              languages: ['English', 'Swahili'],
              availability: lawyer.isAvailable ? 'Available' : 'Busy'
            };
          });
          
          // Use real lawyers if available, otherwise fall back to sample data
          if (backendLawyers.length > 0) {
            setLawyers(backendLawyers);
          }
        }
      } catch (error) {
        console.error('Error fetching lawyers:', error);
        // Keep using sample data on error
      } finally {
        setLoading(false);
      }
    };

    fetchLawyers();
  }, []);

  // Filter and sort lawyers
  const filteredLawyers = lawyers
    .filter(lawyer => {
      // Check specialty filter
      const specialtyMatch = selectedSpecialty === 'All Specialties' || 
        SPECIALIZATION_MAP[selectedSpecialty]?.some(spec => 
          (lawyer as any).specializations?.includes(spec) || lawyer.specialty === selectedSpecialty
        );
      
      // Check location filter - case insensitive and trimmed comparison
      const locationMatch = selectedLocation === 'All Locations' || 
        lawyer.location?.trim().toLowerCase() === selectedLocation.trim().toLowerCase();
      
      return specialtyMatch && locationMatch;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price') return a.hourlyRate - b.hourlyRate;
      if (sortBy === 'experience') return b.yearsExperience - a.yearsExperience;
      return 0;
    });

  const handleBookConsultation = (lawyerId: string, lawyerName: string) => {
    const lawyer = lawyers.find(l => l.id === lawyerId);
    
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingBooking', JSON.stringify({ 
        lawyerId: lawyer?.userId, 
        lawyerName, 
        hourlyRate: lawyer?.hourlyRate,
        profileImage: lawyer?.imageUrl 
      }));
      navigate('/login', { state: { from: `/booking/${lawyer?.userId}`, message: 'Please log in to book a consultation' } });
    } else {
      // Use userId for booking (this is what the backend expects)
      navigate(`/booking/${lawyer?.userId}`, { 
        state: { 
          lawyerName: lawyer?.name,
          hourlyRate: lawyer?.hourlyRate,
          specialty: lawyer?.specialty,
          profileImage: lawyer?.imageUrl
        } 
      });
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold mb-2">Find a Lawyer</h1>
          <p className="text-blue-100">Connect with verified legal experts across Kenya</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b border-blue-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Specialty Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Practice Area
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {specialties.map(specialty => (
                  <option key={specialty} value={specialty}>{specialty}</option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {locations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'rating' | 'price' | 'experience')}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="rating">Highest Rated</option>
                <option value="price">Lowest Price</option>
                <option value="experience">Most Experienced</option>
              </select>
            </div>

            {/* Results Count */}
            <div className="flex items-end">
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{filteredLawyers.length}</span> lawyers found
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Lawyers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLawyers.map((lawyer) => (
            <div
              key={lawyer.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden"
            >
              {/* Lawyer Image */}
              <div className="relative">
                <img
                  src={lawyer.imageUrl}
                  alt={lawyer.name}
                  className="w-full h-48 object-cover"
                />
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
                  lawyer.availability === 'Available' ? 'bg-green-500 text-white' :
                  lawyer.availability === 'Busy' ? 'bg-yellow-500 text-white' :
                  'bg-gray-500 text-white'
                }`}>
                  {lawyer.availability}
                </div>
              </div>

              {/* Lawyer Details */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{lawyer.name}</h3>
                    <p className="text-sm text-blue-600 font-medium">{lawyer.specialty}</p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm font-semibold">{lawyer.rating}</span>
                  </div>
                </div>

                <div className="flex items-center text-sm text-gray-600 mb-3">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {lawyer.location}
                  <span className="mx-2">•</span>
                  {lawyer.yearsExperience} years exp
                </div>

                <p className="text-sm text-gray-700 mb-4 line-clamp-2">{lawyer.bio}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {lawyer.languages.map(lang => (
                    <span key={lang} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {lang}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Consultation Fee</p>
                      <p className="text-lg font-bold text-gray-900">KES {lawyer.hourlyRate.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">per session</p>
                    </div>
                    <button
                      onClick={() => handleBookConsultation(lawyer.id, lawyer.name)}
                      disabled={lawyer.availability === 'Offline'}
                      className={`px-6 py-3 rounded-lg font-medium transition ${
                        lawyer.availability === 'Offline'
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {lawyer.availability === 'Offline' ? 'Unavailable' : 'Book Now'}
                    </button>
                  </div>
                  
                  <button
                    onClick={() => navigate(`/lawyers/${lawyer.id}`)}
                    className="w-full px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition text-sm"
                  >
                    View Full Profile
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-2 text-center">
                  {lawyer.reviewCount} verified reviews
                </p>
              </div>
            </div>
          ))}
        </div>

        {filteredLawyers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No lawyers found matching your criteria.</p>
            <button
              onClick={() => {
                setSelectedSpecialty('All Specialties');
                setSelectedLocation('All Locations');
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="bg-blue-600 text-white py-12 mt-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Legal Help?</h2>
            <p className="text-lg mb-6 text-blue-100">
              Create a free account to book consultations, message lawyers, and access your legal documents.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/register', { state: { from: '/lawyers' } })}
                className="px-8 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate('/login', { state: { from: '/lawyers' } })}
                className="px-8 py-3 bg-blue-700 text-white font-semibold rounded-lg hover:bg-blue-800 transition border-2 border-white"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
