import React from 'react';

// Badge for popularity analytics (e.g., trending, most popular)
export const DocumentAnalyticsBadge: React.FC<{ views: number; purchases: number; trendingScore: number }> = ({ views, purchases, trendingScore }) => {
  // Show badges based on analytics
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full border border-blue-300 ml-2">
      {/* Example: Trending */}
      {trendingScore > 5 && <span>🔥 Trending</span>}
      {/* Example: Most Popular */}
      {purchases > 100 && <span>🌟 Most Popular</span>}
      {/* Example: Views */}
      <span>{views} views</span>
    </span>
  );
};
