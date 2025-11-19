import React from 'react';
import { useLawyerCollaboration } from '@/hooks/lawyerServices/useLawyerCollaboration';

export const LawyerCollaborationHub: React.FC = () => {
  const { messages, referrals, forumPosts, isLoading } = useLawyerCollaboration();

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Collaboration & Networking</h2>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="mb-4">
            <h3 className="font-semibold">Messages</h3>
            <ul>
              {messages.map(m => (
                <li key={m.id}>{m.content}</li>
              ))}
            </ul>
          </div>
          <div className="mb-4">
            <h3 className="font-semibold">Referrals</h3>
            <ul>
              {referrals.map(r => (
                <li key={r.id}>{r.clientName} referred to {r.referredLawyer}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Forum</h3>
            <ul>
              {forumPosts.map(p => (
                <li key={p.id}><span className="font-bold">{p.title}</span>: {p.content}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
