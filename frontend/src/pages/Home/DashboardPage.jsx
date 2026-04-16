import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { MdAdd, MdStar, MdCalendarToday, MdBook, MdScience, MdHistory, MdArrowForward } from 'react-icons/md';
import toast from 'react-hot-toast';
import moment from 'moment';
import { getSemesters } from '../../api/semesters.js';
import { getCourses } from '../../api/courses.js';
import { getAttendance } from '../../api/attendance.js';
import { getLabs } from '../../api/labs.js';
import { getMarks } from '../../api/marks.js';
import PageHeader from '../../components/UI/PageHeader.jsx';
import StatCard from '../../components/UI/StatCard.jsx';
import EmptyState from '../../components/UI/EmptyState.jsx';

function CourseOverviewCard({ course }) {
  const [stats, setStats] = useState({ total: 0, present: 0, pct: null });
  const navigate = useNavigate();

  useEffect(() => {
    getAttendance(course._id).then(res => {
      const records = res.data;
      const total   = records.length;
      const present = records.filter(r => r.status === 'present').length;
      const pct     = total > 0 ? Math.round((present / total) * 100) : null;
      setStats({ total, present, pct });
    }).catch(() => {});
  }, [course._id]);

  const pctColor = stats.pct === null ? 'var(--blue)'
    : stats.pct >= 75 ? 'var(--green)'
    : stats.pct >= 60 ? 'var(--amber)'
    : 'var(--red)';

  return (
    <div
      className="card card-body"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/courses/${course._id}/attendance`)}
    >
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2">
            {course.type === 'lab'
              ? <MdScience size={14} style={{ color: 'var(--blue)' }} />
              : <MdBook size={14} style={{ color: 'var(--navy)' }} />
            }
            <span className={`badge ${course.type === 'lab' ? 'badge-blue' : 'badge-navy'}`}>
              {course.type === 'lab' ? 'Lab' : 'Theory'}
            </span>
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 700, marginTop: 6 }}>
            {course.name}
          </h3>
          <p className="text-xs text-muted mt-1">{course.code} · {course.creditHours} CR</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, color: pctColor, lineHeight: 1 }}>
            {stats.pct !== null ? `${stats.pct}%` : '—'}
          </p>
          <p className="text-xs text-muted mt-1">Attendance</p>
        </div>
      </div>

      {stats.pct !== null && (
        <div className="progress-bar mt-2">
          <div className="progress-fill" style={{
            width: `${stats.pct}%`,
            background: pctColor
          }} />
        </div>
      )}

      <div className="flex gap-3 mt-2" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
        <span>{stats.present}/{stats.total} classes</span>
        <span>·</span>
        <span style={{ color: 'var(--blue)' }}>View →</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [semesters, setSemesters] = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [activity,  setActivity]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const navigate = useNavigate();

  const activeSemester = semesters.find(s => s.isActive) || semesters[0] || null;

  useEffect(() => {
    getSemesters()
      .then(res => setSemesters(res.data))
      .catch(() => toast.error('Failed to load semesters'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeSemester) return;
    getCourses(activeSemester._id)
      .then(async res => {
        const courseList = res.data;
        setCourses(courseList);
        
        // Fetch activity
        const activities = [];
        for (const c of courseList) {
          try {
            const [att, labs, marks] = await Promise.all([
              getAttendance(c._id),
              getLabs(c._id),
              getMarks(c._id)
            ]);
            
            att.data.forEach(r => activities.push({ ...r, courseName: c.name, actType: 'Attendance', actIcon: <MdCalendarToday/> }));
            labs.data.forEach(r => activities.push({ ...r, courseName: c.name, actType: 'Lab', actIcon: <MdScience/> }));
            marks.data.forEach(r => activities.push({ ...r, courseName: c.name, actType: 'Marks', actIcon: <MdBook/> }));
          } catch (e) {}
        }
        
        activities.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setActivity(activities.slice(0, 5));
      })
      .catch(() => {});
  }, [activeSemester?._id]);

  const theoryCourses = courses.filter(c => c.type === 'theory');
  const labCourses    = courses.filter(c => c.type === 'lab');

  if (loading) return (
    <div className="page-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 20 }}>Loading…</div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle={activeSemester
          ? `Active semester: ${activeSemester.name} ${activeSemester.year}`
          : 'No active semester set'}
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/semesters')}>
            <MdCalendarToday size={15} /> Manage Semesters
          </button>
        }
      />

      {!activeSemester ? (
        <EmptyState
          icon="🎓"
          title="No semester found"
          description="Create your first semester to get started."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/semesters')}>
              <MdAdd size={15} /> Add Semester
            </button>
          }
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start', width: '100%' }}>
          <div>
            {/* Stats */}
            <div className="stats-grid anim-fade-up delay-1">
              <StatCard label="Total Courses"  value={courses.length}       accentColor="var(--navy)" />
              <StatCard label="Theory Courses" value={theoryCourses.length} accentColor="var(--blue)" />
              <StatCard label="Lab Courses"    value={labCourses.length}    accentColor="var(--blue-light)" />
            </div>

            {/* Course Cards */}
            {courses.length === 0 ? (
              <EmptyState
                icon="📚"
                title="No courses yet"
                description="Go to the semester page to add your courses."
                action={
                  <button className="btn btn-outline" onClick={() => navigate(`/semesters/${activeSemester._id}`)}>
                    <MdAdd size={15} /> Add Courses
                  </button>
                }
              />
            ) : (
              <>
                {theoryCourses.length > 0 && (
                  <div className="anim-fade-up delay-2">
                    <div className="flex items-center gap-2 mb-4">
                      <MdBook size={16} style={{ color: 'var(--navy)' }} />
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Theory Courses</h2>
                      <span className="badge badge-slate">{theoryCourses.length}</span>
                    </div>
                    <div className="courses-grid mb-6">
                      {theoryCourses.map((c, i) => (
                        <div key={c._id} className={`delay-${i + 1} anim-fade-up`}>
                          <CourseOverviewCard course={c} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {labCourses.length > 0 && (
                  <div className="anim-fade-up delay-3">
                    <div className="flex items-center gap-2 mb-4">
                      <MdScience size={16} style={{ color: 'var(--blue)' }} />
                      <h2 style={{ fontSize: 18, fontWeight: 700 }}>Lab Courses</h2>
                      <span className="badge badge-blue">{labCourses.length}</span>
                    </div>
                    <div className="courses-grid">
                      {labCourses.map((c, i) => (
                        <div key={c._id} className={`delay-${i + 1} anim-fade-up`}>
                          <CourseOverviewCard course={c} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Rail: Activity */}
          <div className="anim-fade-up delay-4">
            <div className="flex items-center gap-2 mb-4">
              <MdHistory size={18} style={{ color: 'var(--text-muted)' }} />
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Activity</h2>
            </div>
            
            <div className="card" style={{ background: '#fff' }}>
              <div className="card-body-sm" style={{ padding: '8px 0' }}>
                {activity.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 13 }}>
                    No recent activity
                  </div>
                ) : (
                  activity.map((act, i) => (
                    <div key={i} className="flex items-start gap-3" style={{
                      padding: '14px 16px',
                      borderBottom: i === activity.length - 1 ? 'none' : '1px solid var(--border)',
                    }}>
                      <div style={{
                        width: 32, height: 32, background: 'var(--blue-mist)', borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyCenter: 'center',
                        color: 'var(--blue)', fontSize: 16, flexShrink: 0
                      }}>
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'center'}}>{act.actIcon}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex justify-between items-start">
                          <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }} className="truncate">
                            {act.actType === 'Attendance' ? (act.status === 'present' ? 'Attended Class' : 'Missed Class')
                             : act.actType === 'Lab' ? `Lab ${act.labNumber} updated`
                             : `${act.title} graded`}
                          </p>
                          <span style={{ fontSize: 10, color: 'var(--text-faint)', whiteSpace: 'nowrap' }}>
                            {moment(act.updatedAt).fromNow(true)}
                          </span>
                        </div>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0' }} className="truncate">
                          {act.courseName}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
                <button 
                  className="btn btn-ghost btn-xs w-full" 
                  style={{ justifyContent: 'center', color: 'var(--blue)' }}
                  onClick={() => navigate('/semesters')}
                >
                  View all courses <MdArrowForward size={12} />
                </button>
              </div>
            </div>

            {/* Quote / Motif */}
            <div style={{ 
              marginTop: 32, padding: '24px', borderRadius: 'var(--radius-lg)', 
              background: 'var(--navy)', color: 'rgba(255,255,255,0.7)',
              position: 'relative', overflow: 'hidden'
            }} className="dot-grid">
              <p style={{ fontStyle: 'italic', fontSize: 14, position: 'relative', zIndex: 1, color: '#fff' }}>
                "An investment in knowledge pays the best interest."
              </p>
              <p style={{ fontSize: 11, marginTop: 8, position: 'relative', zIndex: 1, opacity: 0.6 }}>
                &mdash; Benjamin Franklin
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
