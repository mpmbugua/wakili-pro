import React from 'react';

interface MarketplaceFilterBarProps {
  onFilterChange?: (filters: { search?: string; category?: string; price?: string; rating?: string }) => void;
}

export const MarketplaceFilterBar: React.FC<MarketplaceFilterBarProps> = ({ onFilterChange }) => {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [rating, setRating] = React.useState('');

  React.useEffect(() => {
    if (onFilterChange) onFilterChange({ search, category, price, rating });
  }, [search, category, price, rating, onFilterChange]);

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-white rounded shadow">
      <input
        className="border rounded px-2 py-1"
        placeholder="Search documents..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <select
        className="border rounded px-2 py-1"
        value={category}
        onChange={e => setCategory(e.target.value)}
      >
        <option value="">All Categories</option>
        <option value="contracts">Contracts</option>
        <option value="forms">Forms</option>
        <option value="templates">Templates</option>
      </select>
      <select
        className="border rounded px-2 py-1"
        value={price}
        onChange={e => setPrice(e.target.value)}
      >
        <option value="">Any Price</option>
        <option value="free">Free</option>
        <option value="paid">Paid</option>
      </select>
      <select
        className="border rounded px-2 py-1"
        value={rating}
        onChange={e => setRating(e.target.value)}
      >
        <option value="">Any Rating</option>
        <option value="5">5 Stars</option>
        <option value="4">4+ Stars</option>
        <option value="3">3+ Stars</option>
      </select>
    </div>
  );
};
