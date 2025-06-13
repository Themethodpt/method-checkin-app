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
  const [sessionTypes, setSessionTypes] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');

  const [clients, setClients] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState('');
  const [checkinMessage, setCheckinMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [sessionTypesRes, clientsRes, trainersRes] = await Promise.all([
        supabase.from('session_types').select('*'),
        supabase.from('clients').select('*'),
        supabase.from('trainers').select('*'),
      ]);

      if (!sessionTypesRes.error) setSessionTypes(sessionTypesRes.data);
      if (!clientsRes.error) setClients(clientsRes.data);
      if (!trainersRes.error) setTrainers(trainersRes.data);
    };
    fetchData();
  }, []);

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
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error(error);
      setStatusMessage('Error adding client.');
    } else {
      setStatusMessage('Client added successfully!');
      setClientName('');
      setPartnered(false);
      setPartnerName('');
      setSessionCount('');
      setSessionType('');
    }
  };

  const handleCheckIn = async () => {
    if (!selectedClient || !selectedTrainer || !selectedSessionType) {
      setCheckinMessage('Please select all fields.');
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    if (!client || client.remaining_sessions <= 0) {
      setCheckinMessage('Client has no remaining sessions.');
      return;
    }

    const { error: insertError } = await supabase.from('check_ins').insert([
      {
        client_id: selectedClient,
        trainer_id: selectedTrainer,
        session_type: selectedSessionType,
        timestamp: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      setCheckinMessage('Error recording check-in.');
      console.error(insertError);
      return;
    }

    const { error: updateError } = await supabase
      .from('clients')
      .update({ remaining_sessions: client.remaining_sessions - 1 })
      .eq('id', selectedClient);

    if (updateError) {
      setCheckinMessage('Check-in saved, but failed to update session count.');
      console.error(updateError);
    } else {
      setCheckinMessage('Check-in recorded and session count updated.');
      setSelectedClient('');
      setSelectedTrainer('');
      setSelectedSessionType('');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <button onClick={() => setView('checkin')} className="mr-2">Check-In</button>
        <button onClick={() => setView('addClient')}>Add Client</button>
      </div>

      {view === 'addClient' && (
        <div className="space-y-4">
          <input className="w-full border p-2" placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} />

          <div>
            <label className="block">Partnered?</label>
            <input type="checkbox" checked={partnered} onChange={(e) => setPartnered(e.target.checked)} />
          </div>

          {partnered && (
            <input className="w-full border p-2" placeholder="Partner Name" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} />
          )}

          <input className="w-full border p-2" type="number" placeholder="Session Count" value={sessionCount} onChange={(e) => setSessionCount(e.target.value)} />

          <select className="w-full border p-2" value={sessionType} onChange={(e) => setSessionType(e.target.value)}>
            <option value="">Select Session Type</option>
            {sessionTypes.map((type) => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>

          <button onClick={handleAddClient} className="bg-blue-600 text-white px-4 py-2 rounded">Add Client</button>

          {statusMessage && <p className="mt-2 text-sm text-red-600">{statusMessage}</p>}
        </div>
      )}

      {view === 'checkin' && (
        <div className="space-y-4">
          <select className="w-full border p-2" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
            <option value="">Select Client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>

          <select className="w-full border p-2" value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value)}>
            <option value="">Select Trainer</option>
            {trainers.map((trainer) => (
              <option key={trainer.id} value={trainer.id}>{trainer.name}</option>
            ))}
          </select>

          <select className="w-full border p-2" value={selectedSessionType} onChange={(e) => setSelectedSessionType(e.target.value)}>
            <option value="">Select Session Type</option>
            {sessionTypes.map((type) => (
              <option key={type.id} value={type.name}>{type.name}</option>
            ))}
          </select>

          <button onClick={handleCheckIn} className="bg-green-600 text-white px-4 py-2 rounded">Check In</button>

          {checkinMessage && <p className="mt-2 text-sm text-blue-600">{checkinMessage}</p>}
        </div>
      )}
    </div>
  );
}
