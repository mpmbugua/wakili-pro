import React from 'react';

export const ReferralInvite: React.FC<{ onInvite: (email: string) => void }> = ({ onInvite }) => {
  const [email, setEmail] = React.useState('');
  return (
    <form className="flex gap-2 mt-4" onSubmit={e => { e.preventDefault(); onInvite(email); }}>
      <input className="border rounded px-2 py-1" placeholder="Invite by email" value={email} onChange={e => setEmail(e.target.value)} />
      <button className="bg-blue-600 text-white px-3 py-1 rounded" type="submit">Invite</button>
    </form>
  );
};
