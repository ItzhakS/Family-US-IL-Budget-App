import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserPlus, Loader2, Check } from 'lucide-react';

export const FamilyManager: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      // 1. Get current user's profile to find their family_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('family_id')
        .eq('id', user.id)
        .single();

      if (!myProfile) throw new Error("Could not fetch your family profile");

      // 2. Call Supabase Edge Function or simple insert if using a whitelist table
      // For this implementation, we assume a 'family_invites' table exists
      const { error: inviteError } = await supabase
        .from('family_invites')
        .insert({
          family_id: myProfile.family_id,
          email: email.toLowerCase().trim(),
          invited_by: user.email
        });

      if (inviteError) throw inviteError;

      setMessage(`Invited ${email}! Once they log in, they will see this budget.`);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium bg-indigo-50 px-2 py-1 rounded"
      >
        <UserPlus size={14} /> Invite Spouse
      </button>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg border border-indigo-100 shadow-sm mt-2">
      <h4 className="text-sm font-bold text-gray-800 mb-2">Invite Family Member</h4>
      <form onSubmit={handleInvite} className="flex gap-2">
        <input
          type="email"
          placeholder="Spouse's Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-1.5 text-sm border rounded focus:ring-1 focus:ring-indigo-500 outline-none"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Add'}
        </button>
      </form>
      {message && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><Check size={12} /> {message}</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <button onClick={() => setIsOpen(false)} className="text-xs text-gray-400 mt-2 underline">Close</button>
    </div>
  );
};
