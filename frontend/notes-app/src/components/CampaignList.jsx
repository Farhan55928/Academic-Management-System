import { useState } from 'react';
import api from '../api/axios';

const CampaignList = () => {
  const [members, setMembers] = useState([]);
  const [fetched, setFetched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    setLoading(true);
    const res = await api.get('/campaign/yearly-heavy');
    setMembers(res.data.data.members);
    setFetched(true);
    setLoading(false);
  };

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <div style={{ width: 4, height: 22, background: '#c8f135', borderRadius: 2 }} />
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Campaign List
        </h3>
      </div>
      <p style={{ color: '#555', fontSize: 13, margin: '0 0 18px 14px' }}>Yearly members · weight over 80 kg</p>

      <button onClick={handleFetch} disabled={loading} style={{
        padding: '11px 22px', background: 'transparent', color: '#c8f135',
        border: '1px solid #c8f135', borderRadius: 8, fontWeight: 700, fontSize: 13,
        letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
        marginBottom: 16, fontFamily: 'inherit',
      }}>
        {loading ? 'Loading...' : 'Load Campaign'}
      </button>

      {fetched && members.length === 0 && (
        <p style={{ color: '#555', fontSize: 14, padding: '12px 0' }}>No members match this criteria.</p>
      )}

      {members.map(m => (
        <div key={m._id} style={{
          background: '#161616', border: '1px solid #242424', borderRadius: 10,
          padding: '14px 18px', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <p style={{ margin: '0 0 4px', color: '#f0f0f0', fontWeight: 700, fontSize: 15 }}>{m.name}</p>
            <p style={{ margin: 0, color: '#666', fontSize: 13 }}>Age {m.age}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 4px', color: '#c8f135', fontWeight: 800, fontSize: 16 }}>{m.weight} kg</p>
            <span style={{
              display: 'inline-block', padding: '2px 10px', borderRadius: 20,
              fontSize: 11, fontWeight: 700, background: '#c8f135', color: '#0a0a0a', letterSpacing: '0.05em',
            }}>YEARLY</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CampaignList;
