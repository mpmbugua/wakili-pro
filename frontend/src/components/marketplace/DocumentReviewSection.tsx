import React from 'react';

import { useDocumentReviews, useAddReview } from '@/hooks/marketplace/useDocumentReviews';
import { useState } from 'react';

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string };
}

export const DocumentReviewSection: React.FC<{ documentId: string }> = ({ documentId }) => {
  const { data: reviews = [], isLoading } = useDocumentReviews(documentId);
  const addReview = useAddReview(documentId);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment) return;
    addReview.mutate({ rating, comment });
    setComment('');
    setRating(5);
  };

  return (
    <div className="mt-6">
      <h3 className="font-bold text-lg mb-2">Reviews</h3>
      {isLoading ? (
        <div>Loading reviews...</div>
      ) : (
        <ul className="mb-4">
          {reviews.map((r: Review) => (
            <li key={r.id} className="mb-2 border-b pb-2">
              <div className="font-semibold">{r.user.name} <span className="text-yellow-500">{'★'.repeat(r.rating)}</span></div>
              <div className="text-sm text-gray-700">{r.comment}</div>
              <div className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString()}</div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <label className="font-semibold">Add a Review</label>
        <select value={rating} onChange={e => setRating(Number(e.target.value))} className="border rounded px-2 py-1 w-24">
          {[5, 4, 3, 2, 1].map(star => (
            <option key={star} value={star}>{star} Star{star > 1 ? 's' : ''}</option>
          ))}
        </select>
        <textarea
          className="border rounded px-2 py-1"
          placeholder="Write your review..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded font-semibold" disabled={addReview.isLoading}>
          {addReview.isLoading ? 'Submitting...' : 'Submit Review'}
        </button>
        {addReview.isError && <div className="text-red-600 text-sm">Error submitting review.</div>}
      </form>
    </div>
  );
};
