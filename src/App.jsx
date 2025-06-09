import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function App() {
  const [clients, setClients] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchClients();
    fetchTrainers();
  }, []);

 async function fetchClients() {
  const { data, error } = await supabase.from('clients').select('*');
  console.log("CLIENTS DATA:", data);
  console.log("CLIENTS ERROR:", error);
  if (!error) setClients(data);
}


 async function fetchTrainers() {
  const { data, error } = await supabase.from('trainers').select('*');
  console.log("TRAINERS DATA:", data);
  console.log("TRAINERS ERROR:", error);
  if (!error) setTrainers(data);
}


  async function handleCheckIn() {
    if (!selectedClient || !selectedTrainer) {
      setStatus('Please select both a client and trainer.');
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    if (client.remaining_sessions <= 0) {
      setStatus('Client has no remaining sessions.');
      return;
    }

    await supabase
      .from('clients')
      .update({ remaining_sessions: client.remaining_sessions - 1 })
      .eq('id', selectedClient);

    await supabase.from('checkins').insert([
      { client_id: selectedClient, trainer_id: selectedTrainer }
    ]);

    setStatus('Check-in successful!');
    setSelectedClient('');
    setSelectedTrainer('');
    fetchClients();
  }

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h2>Client Check-In</h2>

      <div>
        <label>Client: </label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
          <option value=''>Select Client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.remaining_sessions} left)
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Trainer: </label>
        <select value={selectedTrainer} onChange={e => setSelectedTrainer(e.target.value)}>
          <option value=''>Select Trainer</option>
          {trainers.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <button style={{ marginTop: 20 }} onClick={handleCheckIn}>
        Check In
      </button>

      {status && <p style={{ marginTop: 20, color: 'green' }}>{status}</p>}
    </div>
  );
}
