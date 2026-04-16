import { useState } from 'react';
import { useNavigate } from 'react-router';
import { MdOutlineSchool, MdEmail, MdLock, MdLogin } from 'react-icons/md';
import toast from 'react-hot-toast';

export default function LoginPage({ onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields');
    setLoading(true);
    try {
      await onLogin(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left Brand Panel */}
      <div className="login-brand-panel">
        <div className="login-brand-content anim-fade-up">
          <div className="login-brand-icon">
            <MdOutlineSchool color="#fff" size={30} />
          </div>
          <h1>AcademiQ</h1>
          <p>
            Your personal academic command centre. Track semesters, courses,
            attendance, labs, and exam scores — all in one place.
          </p>

          <div style={{ marginTop: 40, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            {['Attendance', 'Lab Reports', 'Exam Marks'].map((f, i) => (
              <div key={f} className={`anim-fade-up delay-${i + 2}`} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                color: 'rgba(255,255,255,0.6)', fontSize: 13
              }}>
                <span style={{ width: 6, height: 6, background: 'var(--blue-light)', borderRadius: '50%', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Decorative dots */}
        <div className="login-brand-dots">
          {Array.from({ length: 24 }).map((_, i) => <span key={i} />)}
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="login-form-panel">
        <div className="login-form-inner anim-fade-up delay-1">
          <h2>Sign in</h2>
          <p className="sub">Enter your credentials to access your dashboard</p>

          <form onSubmit={handleSubmit} className="login-form-group">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <MdEmail size={16} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="you@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <MdLock size={16} style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-navy w-full"
              style={{ justifyContent: 'center', marginTop: 8, padding: '12px 18px' }}
              disabled={loading}
            >
              {loading ? 'Signing in…' : <><MdLogin size={16} /> Sign In</>}
            </button>
          </form>

          <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-faint)', textAlign: 'center' }}>
            Islamic University of Technology &mdash; Academic Management
          </p>
        </div>
      </div>
    </div>
  );
}
