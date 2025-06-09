import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
    if (error) console.error(error);
    else setClients(data);
  }

  async function fetchTrainers() {
    const { data, error } = await supabase.from('trainers').select('*');
    if (error) console.error(error);
    else setTrainers(data);
  }

  async function handleCheckIn() {
    if (!selectedClient || !selectedTrainer) {
      setStatus('Please select a client and trainer.');
      return;
    }

    const client = clients.find(c => c.id === selectedClient);
    if (client.remaining_sessions <= 0) {
      setStatus('No sessions remaining for this client.');
      return;
    }

    const { error: updateError } = await supabase
      .from('clients')
      .update({ remaining_sessions: client.remaining_sessions - 1 })
      .eq('id', selectedClient);

    const { error: insertError } = await supabase
      .from('checkins')
      .insert([
        {
          client_id: selectedClient,
          trainer_id: selectedTrainer,
        },
      ]);

    if (updateError || insertError) {
      setStatus('Error during check-in.');
      console.error(updateError || insertError);
    } else {
      setStatus('Check-in successful!');
      fetchClients();
    }

    setSelectedClient('');
    setSelectedTrainer('');
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Client Check-In</h1>
      <div>
        <label>Client:</label>
        <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
          <option value="">Select Client</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.name} ({client.remaining_sessions} left)
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: '10px' }}>
        <label>Trainer:</label>
        <select value={selectedTrainer} onChange={e => setSelectedTrainer(e.target.value)}>
          <option value="">Select Trainer</option>
          {trainers.map(trainer => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name}
            </option>
          ))}
        </select>
      </div>

      <button style={{ marginTop: '20px' }} onClick={handleCheckIn}>
        Check In
      </button>

      {status && <p style={{ marginTop: '15px', color: 'green' }}>{status}</p>}
    </div>
  );
}
