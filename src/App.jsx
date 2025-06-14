// App.jsx – Includes searchable client dropdown in Check-In panel
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
  const [clientSearch, setClientSearch] = useState('');

  const [history, setHistory] = useState([]);
  const [filterClient, setFilterClient] = useState('');
  const [filterTrainer, setFilterTrainer] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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
    const { error } = await supabase.from('clients').insert([{
      name: clientName,
      remaining_sessions: parseInt(sessionCount),
      session_type: sessionType,
      partner_name: partnered ? partnerName : null,
      created_at: new Date().toISOString(),
    }]);
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
    const { error: insertError } = await supabase.from('check_ins').insert([{
      client_id: selectedClient,
      trainer_id: selectedTrainer,
      session_type: selectedSessionType,
      timestamp: new Date().toISOString(),
    }]);
    if (insertError) {
      setCheckinMessage('Error recording check-in.');
      return;
    }
    const { error: updateError } = await supabase
      .from('clients')
      .update({ remaining_sessions: client.remaining_sessions - 1 })
      .eq('id', selectedClient);
    if (updateError) {
      setCheckinMessage('Check-in saved, but session count not updated.');
    } else {
      setCheckinMessage('Check-in recorded.');
      setSelectedClient('');
      setClientSearch('');
      setSelectedTrainer('');
      setSelectedSessionType('');
    }
  };

  const handleFetchHistory = async () => {
    let query = supabase.from('check_ins').select('*');
    if (filterClient) query = query.eq('client_id', filterClient);
    if (filterTrainer) query = query.eq('trainer_id', filterTrainer);
    if (startDate) query = query.gte('timestamp', startDate);
    if (endDate) query = query.lte('timestamp', endDate);
    const { data, error } = await query;
    if (!error) setHistory(data);
  };

  const getNameById = (id, type) => {
    const list = type === 'client' ? clients : trainers;
    const found = list.find((item) => item.id === id);
    return found ? found.name : id;
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="space-x-2">
        <button onClick={() => setView('checkin')}>Check-In</button>
        <button onClick={() => setView('addClient')}>Add Client</button>
        <button onClick={() => setView('history')}>View History</button>
      </div>

      {view === 'addClient' && (
        <div className="space-y-3">
          <input placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="border p-2 w-full" />
          <label><input type="checkbox" checked={partnered} onChange={() => setPartnered(!partnered)} /> Partnered?</label>
          {partnered && <input placeholder="Partner Name" value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className="border p-2 w-full" />}
          <input placeholder="Session Count" value={sessionCount} onChange={(e) => setSessionCount(e.target.value)} className="border p-2 w-full" type="number" />
          <select value={sessionType} onChange={(e) => setSessionType(e.target.value)} className="border p-2 w-full">
            <option value="">Select Session Type</option>
            {sessionTypes.map(type => <option key={type.id} value={type.name}>{type.name}</option>)}
          </select>
          <button onClick={handleAddClient} className="bg-blue-600 text-white px-4 py-2 rounded">Add Client</button>
          <p>{statusMessage}</p>
        </div>
      )}

      {view === 'checkin' && (
        <div className="space-y-3">
          <input
            placeholder="Search Client"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
            className="border p-2 w-full"
          />
          <ul className="border max-h-40 overflow-y-auto">
            {filteredClients.map(client => (
              <li key={client.id}
                  onClick={() => {
                    setSelectedClient(client.id);
                    setClientSearch(client.name);
                  }}
                  className="p-2 hover:bg-gray-100 cursor-pointer">
                {client.name}
              </li>
            ))}
          </ul>
          <select value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value)} className="border p-2 w-full">
            <option value="">Select Trainer</option>
            {trainers.map(tr => <option key={tr.id} value={tr.id}>{tr.name}</option>)}
          </select>
          <select value={selectedSessionType} onChange={(e) => setSelectedSessionType(e.target.value)} className="border p-2 w-full">
            <option value="">Select Session Type</option>
            {sessionTypes.map(st => <option key={st.id} value={st.name}>{st.name}</option>)}
          </select>
          <button onClick={handleCheckIn} className="bg-green-600 text-white px-4 py-2 rounded">Check In</button>
          <p>{checkinMessage}</p>
        </div>
      )}

      {view === 'history' && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Check-In History</h2>
          <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="border p-2 w-full">
            <option value="">Filter by Client</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterTrainer} onChange={(e) => setFilterTrainer(e.target.value)} className="border p-2 w-full">
            <option value="">Filter by Trainer</option>
            {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 w-full" />
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 w-full" />
          <button onClick={handleFetchHistory} className="bg-purple-600 text-white px-4 py-2 rounded">Fetch History</button>
          <div className="space-y-2">
            {history.map((entry, idx) => (
              <div key={idx} className="border p-2 rounded shadow-sm">
                <p><strong>Client:</strong> {getNameById(entry.client_id, 'client')}</p>
                <p><strong>Trainer:</strong> {getNameById(entry.trainer_id, 'trainer')}</p>
                <p><strong>Type:</strong> {entry.session_type}</p>
                <p><strong>Time:</strong> {new Date(entry.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
