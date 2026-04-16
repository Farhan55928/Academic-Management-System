export default function StatCard({ label, value, sub, accentColor }) {
  return (
    <div className="stat-card" style={accentColor ? { borderTop: `3px solid ${accentColor}` } : {}}>
      <p className="stat-label">{label}</p>
      <p className="stat-value" style={accentColor ? { color: accentColor } : {}}>{value}</p>
      {sub && <p className="stat-sub">{sub}</p>}
    </div>
  );
}
