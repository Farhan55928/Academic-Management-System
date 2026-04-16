import { useState } from 'react';
import api from '../api/axios';

const AddMember = ({ onMemberAdded }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [membershipType, setMembershipType] = useState('Monthly');
  const [weight, setWeight] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputStyle = {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    marginBottom: 12,
    background: '#1a1a1a',
    border: '1px solid #2e2e2e',
    borderRadius: 8,
    color: '#f0f0f0',
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  const handleAdd = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await api.post('/add', {
        name,
        age: Number(age),
        membershipType,
        weight: Number(weight),
      });
      setIsError(false);
      setMessage('✓ ' + res.data.message);
      setName(''); setAge(''); setMembershipType('Monthly'); setWeight('');
      if (onMemberAdded) onMemberAdded(res.data.data.member);
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.message || 'Error adding member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#111', border: '1px solid #222', borderRadius: 12, padding: 24, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 4, height: 22, background: '#c8f135', borderRadius: 2 }} />
        <h3 style={{ margin: 0, color: '#fff', fontSize: 16, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Add New Member
        </h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
        <input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
        <input placeholder="Age" type="number" value={age} onChange={e => setAge(e.target.value)} style={inputStyle} />
        <select value={membershipType} onChange={e => setMembershipType(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
          <option value="Monthly">Monthly</option>
          <option value="Yearly">Yearly</option>
          <option value="Weekly">Weekly</option>
        </select>
        <input placeholder="Weight (kg)" type="number" value={weight} onChange={e => setWeight(e.target.value)} style={inputStyle} />
      </div>
      <button onClick={handleAdd} disabled={loading} style={{
        width: '100%', padding: '13px', background: '#c8f135', color: '#0a0a0a',
        border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 800,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit',
      }}>
        {loading ? 'Adding...' : 'Add Member'}
      </button>
      {message && (
        <p style={{
          marginTop: 12, padding: '10px 14px',
          background: isError ? '#2a1010' : '#0f1f00',
          border: `1px solid ${isError ? '#5a1a1a' : '#3a5a00'}`,
          borderRadius: 6, color: isError ? '#ff6b6b' : '#c8f135', fontSize: 13, margin: '12px 0 0',
        }}>
          {message}
        </p>
      )}
    </div>
  );
};

export default AddMember;
