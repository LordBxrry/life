// pages/index.js
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (token in localStorage)
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setUser(JSON.parse(localStorage.getItem('user') || '{}'));
    }
    setLoading(false);
  }, []);

  if (loading) return <div>Loading...</div>;

  if (user && user.userId) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Welcome, {user.username}!</h1>
        <nav>
          <Link href="/profile">Profile</Link> |
          <Link href="/messages">Messages</Link> |
          <Link href="/shop">Shop</Link> |
          <Link href="/events">Events</Link> |
          <Link href="/settings">Settings</Link>
        </nav>
        <button onClick={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.reload();
        }}>Logout</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Life Application</h1>
      <p>Welcome to the social platform with financial tracking, stories, and live streaming.</p>
      <Link href="/signin">Sign In / Sign Up</Link>
    </div>
  );
}
