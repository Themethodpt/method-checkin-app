
import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [view, setView] = useState('checkin');
  const [clientName, setClientName] = useState('');
  const [partnered, setPartnered] = useState(false);
  const [partnerName, setPartnerName] = useState('');
  const [sessionCount, setSessionCount] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  const handleAddClient = async () => {
    if (!clientName || !sessionCount || !sessionType) {
      setStatusMessage('Please fill in all required fields.');
      return;
    }

    const { error } = await supabase.from('clients').insert([
      {
        name: clientName,
        remaining_sessions: parseInt(sessionCount),
        session_type: sessionType,
        partner_name: partnered ? partnerName : null,
        created_at: new Date().toISOString()
      }
    ]);

    if (error) {
      console.error(error);
      setStatusMessage('Error adding client.');
    } else {
      setStatusMessage('Client added successfully!');
      setClientName('');
      setPartnerName('');
      setSessionCount('');
      setSessionType('');
      setPartnered(false);
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">The Method Training App</h1>

      <div className="mb-4">
        <button onClick={() => setView('checkin')} className="mr-4">Check-In</button>
        <button onClick={() => setView('addClient')}>Add Client</button>
      </div>

      {view === 'addClient' && (
        <div className="space-y-4 border p-4 rounded">
          <h2 className="text-xl font-semibold">Add New Client</h2>

          <input
            className="w-full border p-2"
            type="text"
            placeholder="Client Name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />

          <div>
            <label className="mr-2">
              <input
                type="checkbox"
                checked={partnered}
                onChange={() => setPartnered(!partnered)}
              />{' '}
              Client has a partner?
            </label>
          </div>

          {partnered && (
            <input
              className="w-full border p-2"
              type="text"
              placeholder="Partner Name"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
            />
          )}

          <input
            className="w-full border p-2"
            type="number"
            placeholder="Session Count"
            value={sessionCount}
            onChange={(e) => setSessionCount(e.target.value)}
          />

          <select
            className="w-full border p-2"
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
          >
            <option value="">Select Session Type</option>
            <option value="1on1">1-on-1</option>
            <option value="partner">Partner</option>
            <option value="3plus">3+ Group</option>
          </select>

          <button onClick={handleAddClient} className="bg-blue-600 text-white px-4 py-2 rounded">
            Add Client
          </button>

          {statusMessage && <p className="mt-2 text-sm text-red-600">{statusMessage}</p>}
        </div>
      )}

      {view === 'checkin' && (
        <div className="text-gray-600">
          <p className="text-lg">✅ Check-in screen will go here next.</p>
        </div>
      )}
    </div>
  );
}
