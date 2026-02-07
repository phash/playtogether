/**
 * FriendsPage - Freundesliste und Anfragen
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

interface Friend {
  userId: string;
  username: string;
  displayName: string | null;
  since: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromDisplayName: string | null;
  sentAt: string;
}

function getToken(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === 'token') return value;
  }
  return localStorage.getItem('token');
}

export default function FriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const token = getToken();

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const [friendsRes, requestsRes] = await Promise.all([
        fetch(`${SERVER_URL}/api/friends`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${SERVER_URL}/api/friends/requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (friendsRes.ok) {
        setFriends(await friendsRes.json());
      }
      if (requestsRes.ok) {
        setRequests(await requestsRes.json());
      }
    } catch {
      setError('Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSendRequest = async () => {
    if (!username.trim() || !token) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/friends/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Anfrage gesendet!');
        setUsername('');
      } else {
        setError(data.error || 'Fehler beim Senden');
      }
    } catch {
      setError('Netzwerkfehler');
    }
  };

  const handleAccept = async (friendId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/friends/accept/${friendId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSuccess('Anfrage angenommen!');
        fetchData();
      }
    } catch {
      setError('Fehler');
    }
  };

  const handleDecline = async (friendId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/friends/decline/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch {
      setError('Fehler');
    }
  };

  const handleRemove = async (friendId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/friends/${friendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSuccess('Freund entfernt');
        fetchData();
      }
    } catch {
      setError('Fehler');
    }
  };

  if (!token) {
    return (
      <div className="container fade-in" style={{ paddingTop: '2rem' }}>
        <div className="card text-center">
          <p>Melde dich an, um Freunde zu verwalten.</p>
          <button className="btn btn-primary mt-2" onClick={() => navigate('/')}>
            Zur Startseite
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '4rem' }}>
        <div className="loading">
          <div className="spinner" />
          <p className="mt-2 text-secondary">Lade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ paddingTop: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem' }}>Freunde</h1>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="card" style={{ background: 'rgba(239, 68, 68, 0.2)', borderLeft: '4px solid var(--error)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="card" style={{ background: 'rgba(34, 197, 94, 0.2)', borderLeft: '4px solid var(--success)', marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      {/* Add Friend */}
      <div className="card mb-3">
        <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Freund hinzufuegen</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Benutzername"
            style={{ flex: 1 }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
          />
          <button
            className="btn btn-primary"
            onClick={handleSendRequest}
            disabled={!username.trim()}
            style={{ width: 'auto', padding: '0.75rem 1.25rem' }}
          >
            Senden
          </button>
        </div>
      </div>

      {/* Incoming Requests */}
      {requests.length > 0 && (
        <div className="card mb-3">
          <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
            Anfragen ({requests.length})
          </h2>
          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0',
                borderBottom: '1px solid var(--surface-light)',
              }}
            >
              <span>{req.fromDisplayName || req.fromUsername}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleAccept(req.fromUserId)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    border: 'none',
                    background: 'var(--success)',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Annehmen
                </button>
                <button
                  onClick={() => handleDecline(req.fromUserId)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--error)',
                    background: 'transparent',
                    color: 'var(--error)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                  }}
                >
                  Ablehnen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Friends List */}
      <div className="card">
        <h2 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>
          Deine Freunde ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-secondary text-center" style={{ padding: '1rem 0' }}>
            Noch keine Freunde. Sende eine Anfrage!
          </p>
        ) : (
          friends.map((friend) => (
            <div
              key={friend.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.6rem 0',
                borderBottom: '1px solid var(--surface-light)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    color: 'white',
                  }}
                >
                  {(friend.displayName || friend.username).charAt(0).toUpperCase()}
                </div>
                <span>{friend.displayName || friend.username}</span>
              </div>
              <button
                onClick={() => handleRemove(friend.userId)}
                style={{
                  padding: '0.3rem 0.6rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--surface-light)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                }}
              >
                Entfernen
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
