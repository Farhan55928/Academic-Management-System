import { useState } from 'react';
import AddMember from './components/AddMember';
import MemberList from './components/MemberList';
import FindMember from './components/FindMember';
import CampaignList from './components/CampaignList';

function App() {
  const [members, setMembers] = useState([]);

  const handleMemberAdded = (newMember) => {
    setMembers(prev => [...prev, newMember].sort((a, b) => a.age - b.age));
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: '40px 20px',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&display=swap" rel="stylesheet" />

      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <p style={{ margin: '0 0 4px', color: '#c8f135', fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Member Management
          </p>
          <h1 style={{ margin: 0, color: '#ffffff', fontSize: 30, fontWeight: 900, letterSpacing: '-0.02em' }}>
            No Pain No Lie Gym
          </h1>
        </div>

        <AddMember onMemberAdded={handleMemberAdded} />
        <MemberList members={members} setMembers={setMembers} />
        <FindMember />
        <CampaignList />
      </div>
    </div>
  );
}

export default App;
