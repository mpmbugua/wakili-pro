import React, { useState } from 'react';
import { Award, Star, TrendingUp, MessageSquare, ThumbsUp, Clock, Target, Trophy } from 'lucide-react';

interface Review {
  id: string;
  client: string;
  rating: number;
  comment: string;
  service: string;
  date: string;
}

export const PerformancePage: React.FC = () => {
  const [reviews] = useState<Review[]>([
    {
      id: '1',
      client: 'John Doe',
      rating: 5,
      comment: 'Excellent service! Very professional and timely. Highly recommend.',
      service: 'Document Certification',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '2',
      client: 'Sarah Mwangi',
      rating: 5,
      comment: 'Outstanding legal expertise. The contract was drafted perfectly.',
      service: 'Contract Drafting',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      client: 'Peter Kamau',
      rating: 4,
      comment: 'Good service, but could have been a bit faster. Overall satisfied.',
      service: 'Legal Consultation',
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '4',
      client: 'Mary Wanjiru',
      rating: 5,
      comment: 'Very knowledgeable and helpful. Made the process easy to understand.',
      service: 'Document Review',
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]);

  const achievements = [
    { title: 'Top Rated Lawyer', description: '100+ 5-star reviews', icon: Trophy, color: 'text-yellow-600' },
    { title: 'Quick Responder', description: 'Average response time < 3 hours', icon: Clock, color: 'text-blue-600' },
    { title: 'High Success Rate', description: '95% client satisfaction', icon: Target, color: 'text-green-600' },
    { title: 'Trusted Professional', description: '200+ cases completed', icon: Award, color: 'text-purple-600' }
  ];

  const stats = {
    overallRating: 4.8,
    totalReviews: 147,
    fiveStarCount: 128,
    fourStarCount: 15,
    threeStarCount: 3,
    twoStarCount: 1,
    oneStarCount: 0,
    responseRate: 98,
    completionRate: 94,
    repeatClientRate: 68
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRatingPercentage = (count: number) => {
    return ((count / stats.totalReviews) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance & Reviews</h1>
          <p className="text-sm text-gray-600 mt-1">Track your ratings, reviews, and professional achievements</p>
        </div>

        {/* Overall Rating Card */}
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl border-2 border-yellow-200 p-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Star className="h-8 w-8 text-yellow-600 fill-yellow-600" />
                <span className="text-5xl font-bold text-gray-900">{stats.overallRating}</span>
              </div>
              <p className="text-gray-600">Overall Rating</p>
              <p className="text-sm text-gray-500 mt-1">Based on {stats.totalReviews} reviews</p>
            </div>
            
            <div className="flex-1 max-w-md w-full space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = rating === 5 ? stats.fiveStarCount :
                             rating === 4 ? stats.fourStarCount :
                             rating === 3 ? stats.threeStarCount :
                             rating === 2 ? stats.twoStarCount :
                             stats.oneStarCount;
                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-8">{rating}★</span>
                    <div className="flex-1 bg-white rounded-full h-3">
                      <div
                        className="bg-yellow-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${getRatingPercentage(count)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Response Rate</p>
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.responseRate}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${stats.responseRate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Completion Rate</p>
              <ThumbsUp className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.completionRate}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full"
                style={{ width: `${stats.completionRate}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600">Repeat Clients</p>
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-600">{stats.repeatClientRate}%</p>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${stats.repeatClientRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Achievements & Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, idx) => {
              const Icon = achievement.icon;
              return (
                <div key={idx} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-4 text-center">
                  <Icon className={`h-12 w-12 ${achievement.color} mx-auto mb-3`} />
                  <h3 className="font-bold text-gray-900 mb-1">{achievement.title}</h3>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Recent Reviews</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {reviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                      {review.client.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{review.client}</h4>
                      <p className="text-sm text-gray-500">{review.service}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 mb-1">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star
                          key={idx}
                          className={`h-4 w-4 ${
                            idx < review.rating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(review.date)}</p>
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50 text-center">
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              View All {stats.totalReviews} Reviews
            </button>
          </div>
        </div>
      </div>
  );
};
