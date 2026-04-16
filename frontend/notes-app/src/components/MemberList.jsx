import { useEffect, useState } from 'react';
import api from '../api/axios';

const badge = (text) => ({
  display: 'inline-block', padding: '2px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
  background: text === 'Yearly' ? '#c8f135' : text === 'Monthly' ? '#1e3a5f' : '#2e2e2e',
  color: text === 'Yearly' ? '#0a0a0a' : '#a0c4f0',
});

const MemberList = ({ members, setMembers }) => {
  const [editingId, setEditingId] = useState(null);
  const [weight, setWeight] = useState('');

  useEffect(() => {
    api.get('/sorted-by-age').then(res => setMembers(res.data.data.members));
  }, []);

  const startEdit = (m) => { setEditingId(m._id); setWeight(m.weight); };
  const cancelEdit = () => { setEditingId(null); setWeight(''); };

  const updateMember = async (id) => {
    const prev = members;
    setMembers(members.map(m => m._id === id ? { ...m, weight: Number(weight) } : m));
    setEditingId(null);
    try {
      await api.patch(`/update/${id}`, { weight: Number(weight) });
    } catch {
      setMembers(prev); setEditingId(id); alert('Update failed. Reverted.');
    }
  };

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 4, height: 22, background: '#c8f135', borderRadius: 2 }} />
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          All Members
        </h3>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: '#555', letterSpacing: '0.04em' }}>YOUNGEST → OLDEST</span>
      </div>

      {members.length === 0 && <p style={{ color: '#555', fontSize: 14 }}>No members yet.</p>}

      {members.map((m, i) => (
        <div key={m._id} style={{
          background: '#161616', border: '1px solid #242424', borderRadius: 10,
          padding: '14px 18px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            minWidth: 36, height: 36, borderRadius: '50%', background: '#c8f135',
            color: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, fontSize: 14,
          }}>
            {i + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <strong style={{ color: '#f0f0f0', fontSize: 15 }}>{m.name}</strong>
              <span style={badge(m.membershipType)}>{m.membershipType}</span>
            </div>
            <span style={{ fontSize: 13, color: '#666' }}>Age {m.age} &nbsp;·&nbsp; {m.weight} kg</span>
          </div>
          <div style={{ textAlign: 'right', minWidth: 160 }}>
            {editingId === m._id ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="number" value={weight} onChange={e => setWeight(e.target.value)}
                  placeholder="kg"
                  style={{
                    width: 70, padding: '7px 10px', background: '#1a1a1a',
                    border: '1px solid #c8f135', borderRadius: 6, color: '#f0f0f0',
                    fontSize: 14, outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <button onClick={() => updateMember(m._id)} style={{
                  padding: '7px 12px', background: '#c8f135', color: '#0a0a0a',
                  border: 'none', borderRadius: 6, fontWeight: 800, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                }}>Save</button>
                <button onClick={cancelEdit} style={{
                  padding: '7px 12px', background: '#2a2a2a', color: '#888',
                  border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                }}>✕</button>
              </div>
            ) : (
              <button onClick={() => startEdit(m)} style={{
                padding: '7px 16px', background: 'transparent', color: '#c8f135',
                border: '1px solid #c8f135', borderRadius: 6, fontSize: 12,
                fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', fontFamily: 'inherit',
              }}>
                Edit Weight
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MemberList;
