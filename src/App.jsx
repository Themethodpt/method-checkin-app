import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [view, setView] = useState('checkin');
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState('');

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase.from('clients').select('*');
      if (!error) setClients(data);
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearch.toLowerCase())
  );

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Client Check-In</h2>
      <input
        className="w-full border p-2 mb-2"
        placeholder="Search Client"
        value={clientSearch}
        onChange={(e) => setClientSearch(e.target.value)}
      />
      <ul className="border max-h-40 overflow-y-auto mb-4">
        {filteredClients.map(client => (
          <li
            key={client.id}
            onClick={() => {
              setSelectedClient(client.id);
              setClientSearch(client.name);
            }}
            className="p-2 hover:bg-gray-100 cursor-pointer"
          >
            {client.name}
          </li>
        ))}
      </ul>
      <p>Selected Client ID: {selectedClient}</p>
    </div>
  );
}