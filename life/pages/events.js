// pages/events.js
import { useEffect, useState } from 'react';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>Events</h1>
      <div style={{ display: 'grid', gap: '20px' }}>
        {events.map(event => (
          <div key={event.id} className="card">
            {event.image_url && <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />}
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p><small>📍 {event.location || 'Location TBA'}</small></p>
            <p><small>📅 {new Date(event.start_date).toLocaleDateString()}</small></p>
            <button>Join Event</button>
          </div>
        ))}
      </div>
    </div>
  );
}
