import { useState } from 'react';
import api from '../api/axios';

const FindMember = () => {
  const [id, setId] = useState('');
  const [member, setMember] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFind = async () => {
    setMember(null); setError(''); setLoading(true);
    try {
      const res = await api.get(`/${id}`);
      setMember(res.data.data.member);
    } catch (err) {
      setError(err.response?.data?.message || 'Member not found');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 4, height: 22, background: '#c8f135', borderRadius: 2 }} />
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Find Member by ID
        </h3>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <input
          placeholder="Paste Member ID here..."
          value={id}
          onChange={e => setId(e.target.value)}
          style={{
            flex: 1, padding: '12px 16px', background: '#1a1a1a', border: '1px solid #2e2e2e',
            borderRadius: 8, color: '#f0f0f0', fontSize: 14, outline: 'none', fontFamily: 'inherit',
          }}
        />
        <button onClick={handleFind} disabled={loading} style={{
          padding: '12px 22px', background: '#c8f135', color: '#0a0a0a',
          border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13,
          letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          {loading ? '...' : 'Find'}
        </button>
      </div>

      {error && (
        <p style={{ marginTop: 12, padding: '10px 14px', background: '#2a1010', border: '1px solid #5a1a1a', borderRadius: 6, color: '#ff6b6b', fontSize: 13 }}>
          {error}
        </p>
      )}

      {member && (
        <div style={{ marginTop: 16, background: '#161616', border: '1px solid #242424', borderRadius: 10, padding: 18 }}>
          <p style={{ margin: '0 0 12px', color: '#888', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Member Record</p>
          <p style={{ margin: '0 0 6px', color: '#fff', fontSize: 20, fontWeight: 800 }}>{member.name}</p>
          <div style={{ display: 'flex', gap: 24, marginTop: 10 }}>
            {[['Age', member.age], ['Weight', `${member.weight} kg`], ['Membership', member.membershipType]].map(([k, v]) => (
              <div key={k}>
                <p style={{ margin: '0 0 2px', color: '#555', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{k}</p>
                <p style={{ margin: 0, color: '#c8f135', fontWeight: 700, fontSize: 15 }}>{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FindMember;
