// pages/profile.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userInfo = localStorage.getItem('user');

    if (!token || !userInfo) {
      router.push('/signin');
      return;
    }

    const userData = JSON.parse(userInfo);
    setUser(userData);
    setFormData(userData);
    setLoading(false);
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/users/${user.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const updated = await res.json();
        setUser(updated);
        localStorage.setItem('user', JSON.stringify(updated));
        setEditing(false);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <div className="container">
      <h1>Profile</h1>
      <div className="card">
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName || ''}
              onChange={handleInputChange}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName || ''}
              onChange={handleInputChange}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <textarea
              name="bio"
              placeholder="Bio"
              value={formData.bio || ''}
              onChange={handleInputChange}
              style={{ width: '100%', marginBottom: '10px' }}
            />
            <button type="submit">Save Changes</button>
            <button type="button" onClick={() => setEditing(false)} style={{ marginLeft: '10px' }}>Cancel</button>
          </form>
        ) : (
          <>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
            <button onClick={() => setEditing(true)}>Edit Profile</button>
          </>
        )}
      </div>
    </div>
  );
}
