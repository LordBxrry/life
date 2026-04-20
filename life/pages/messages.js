// pages/messages.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Messages() {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [conversationId, setConversationId] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/signin');
      return;
    }

    // Fetch messages if conversationId is present
    if (conversationId) {
      fetchMessages();
    }
    setLoading(false);
  }, [conversationId, router]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/messages/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: messageText, toUserId: conversationId })
      });

      if (res.ok) {
        setMessageText('');
        fetchMessages();
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>Messages</h1>
      <div className="card">
        {!conversationId ? (
          <p>Select a conversation to start messaging</p>
        ) : (
          <>
            <div style={{ height: '400px', overflowY: 'auto', marginBottom: '20px', border: '1px solid #ddd', padding: '10px' }}>
              {messages.map(msg => (
                <div key={msg.id} style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                  <small>{new Date(msg.created_at).toLocaleString()}</small>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="Type a message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit">Send</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
