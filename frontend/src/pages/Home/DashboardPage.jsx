import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  MdAdd,
  MdArrowForward,
  MdAutoGraph,
  MdBook,
  MdCalendarToday,
  MdHistory,
  MdOutlineArrowOutward,
  MdOutlineCheckCircle,
  MdOutlineTimeline,
  MdScience,
  MdTrendingUp,
} from 'react-icons/md';
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

function getAttendanceTone(pct) {
  if (pct === null) return 'neutral';
  if (pct >= 85) return 'excellent';
  if (pct >= 70) return 'good';
  if (pct >= 60) return 'warning';
  return 'risk';
}

function getAttendanceLabel(pct) {
  if (pct === null) return 'No records yet';
  if (pct >= 85) return 'Excellent streak';
  if (pct >= 70) return 'Healthy pace';
  if (pct >= 60) return 'Watch threshold';
  return 'Needs recovery';
}

function getAttendanceColor(pct) {
  if (pct === null) return 'var(--text-faint)';
  if (pct >= 85) return 'var(--green)';
  if (pct >= 70) return 'var(--blue)';
  if (pct >= 60) return 'var(--amber)';
  return 'var(--red)';
}

function getActivityCopy(activity) {
  if (activity.actType === 'Attendance') {
    return activity.status === 'present' ? 'Attended class' : 'Missed class';
  }

  if (activity.actType === 'Lab') {
    return `Lab ${activity.labNumber} updated`;
  }

  return `${activity.title} graded`;
}

function CourseOverviewCard({ course }) {
  const [stats, setStats] = useState({ total: 0, present: 0, pct: null });
  const navigate = useNavigate();

  useEffect(() => {
    getAttendance(course._id)
      .then((res) => {
        const records = res.data;
        const total = records.length;
        const present = records.filter((record) => record.status === 'present').length;
        const pct = total > 0 ? Math.round((present / total) * 100) : null;
        setStats({ total, present, pct });
      })
      .catch(() => {});
  }, [course._id]);

  const tone = getAttendanceTone(stats.pct);
  const attendanceColor = getAttendanceColor(stats.pct);
  const attendanceWidth = stats.pct === null ? 0 : stats.pct;

  return (
    <button
      type="button"
      className={`course-spotlight-card course-spotlight-card-${course.type} course-spotlight-card-${tone}`}
      onClick={() => navigate(`/courses/${course._id}`)}
    >
      <div className="course-spotlight-glow" />

      <div className="course-spotlight-topline">
        <div className="course-spotlight-tags">
          <span className={`course-type-chip course-type-chip-${course.type}`}>
            {course.type === 'lab' ? <MdScience size={13} /> : <MdBook size={13} />}
            {course.type === 'lab' ? 'Lab course' : 'Theory course'}
          </span>
          <span className="course-credit-pill">{course.creditHours} CR</span>
        </div>

        <div className="course-spotlight-kicker">
          <span className="course-kicker-label">Attendance</span>
          <strong style={{ color: attendanceColor }}>
            {stats.pct !== null ? `${stats.pct}%` : '--'}
          </strong>
        </div>
      </div>

      <div className="course-spotlight-main">
        <div className="course-spotlight-copy">
          <p className="course-spotlight-code">{course.code}</p>
          <h3>{course.name}</h3>
          <p className="course-spotlight-status">{getAttendanceLabel(stats.pct)}</p>
        </div>

        <div className="course-spotlight-meter">
          <div className="course-meter-track">
            <div
              className="course-meter-fill"
              style={{ width: `${attendanceWidth}%`, background: attendanceColor }}
            />
          </div>
          <span>{stats.present}/{stats.total} classes present</span>
        </div>
      </div>

      <div className="course-spotlight-footer">
        <div className="course-spotlight-stat">
          <span>Course type</span>
          <strong>{course.type === 'lab' ? 'Practical' : 'Conceptual'}</strong>
        </div>

        <div className="course-spotlight-stat">
          <span>Momentum</span>
          <strong>{stats.total > 0 ? `${stats.total} logged sessions` : 'Start tracking'}</strong>
        </div>

        <span className="course-spotlight-link">
          Open workspace
          <MdOutlineArrowOutward size={14} />
        </span>
      </div>
    </button>
  );
}

export default function DashboardPage() {
  const [semesters, setSemesters] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const activeSemester = semesters.find((semester) => semester.isActive) || semesters[0] || null;

  useEffect(() => {
    getSemesters()
      .then((res) => setSemesters(res.data))
      .catch(() => toast.error('Failed to load semesters'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeSemester) return;

    getCourses(activeSemester._id)
      .then(async (res) => {
        const courseList = res.data;
        setCourses(courseList);

        const activities = [];

        for (const course of courseList) {
          try {
            const [attendance, labs, marks] = await Promise.all([
              getAttendance(course._id),
              getLabs(course._id),
              getMarks(course._id),
            ]);

            attendance.data.forEach((record) =>
              activities.push({
                ...record,
                courseName: course.name,
                actType: 'Attendance',
                actIcon: <MdCalendarToday />,
              })
            );
            labs.data.forEach((record) =>
              activities.push({
                ...record,
                courseName: course.name,
                actType: 'Lab',
                actIcon: <MdScience />,
              })
            );
            marks.data.forEach((record) =>
              activities.push({
                ...record,
                courseName: course.name,
                actType: 'Marks',
                actIcon: <MdAutoGraph />,
              })
            );
          } catch {
            // Keep the dashboard resilient even if one course payload fails.
          }
        }

        activities.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setActivity(activities.slice(0, 5));
      })
      .catch(() => {});
  }, [activeSemester?._id]);

  const theoryCourses = courses.filter((course) => course.type === 'theory');
  const labCourses = courses.filter((course) => course.type === 'lab');
  const trackedCourses = courses.filter((course) => course.type === 'theory' || course.type === 'lab');
  const activeBadge = activeSemester ? `${activeSemester.name} ${activeSemester.year}` : 'No active semester';

  if (loading) {
    return (
      <div
        className="page-wrapper"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
      >
        <div style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 20 }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper dashboard-page">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        subtitle={activeSemester ? `Active semester: ${activeBadge}` : 'No active semester set'}
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/semesters')}>
            <MdCalendarToday size={15} />
            Manage Semesters
          </button>
        }
      />

      {!activeSemester ? (
        <EmptyState
          icon="Academic"
          title="No semester found"
          description="Create your first semester to start shaping the dashboard."
          action={
            <button className="btn btn-primary" onClick={() => navigate('/semesters')}>
              <MdAdd size={15} />
              Add Semester
            </button>
          }
        />
      ) : (
        <div className="dashboard-shell">
          <section className="dashboard-main">
            <div className="dashboard-overview-band anim-fade-up">
              <div className="dashboard-overview-copy">
                <span className="dashboard-overview-label">Current focus</span>
                <h2>{activeBadge}</h2>
                <p>
                  Track theory and lab performance in one place, then jump straight into any course
                  that needs attention.
                </p>
              </div>

              <div className="dashboard-overview-chips">
                <div className="overview-chip">
                  <MdOutlineCheckCircle size={16} />
                  <span>{trackedCourses.length} tracked courses</span>
                </div>
                <div className="overview-chip">
                  <MdOutlineTimeline size={16} />
                  <span>{activity.length} fresh updates</span>
                </div>
                <div className="overview-chip">
                  <MdTrendingUp size={16} />
                  <span>{theoryCourses.length} theory and {labCourses.length} lab</span>
                </div>
              </div>
            </div>

            <div className="stats-grid anim-fade-up delay-1">
              <StatCard
                label="Total Courses"
                value={courses.length}
                sub="Everything currently in rotation"
                accentColor="var(--navy)"
              />
              <StatCard
                label="Theory Courses"
                value={theoryCourses.length}
                sub="Lecture-heavy subjects and core modules"
                accentColor="var(--blue)"
              />
              <StatCard
                label="Lab Courses"
                value={labCourses.length}
                sub="Practical sessions, reports, and projects"
                accentColor="var(--blue-light)"
              />
            </div>

            {courses.length === 0 ? (
              <EmptyState
                icon="Courses"
                title="No courses yet"
                description="Go to the semester page to add your first course and bring the dashboard to life."
                action={
                  <button className="btn btn-outline" onClick={() => navigate(`/semesters/${activeSemester._id}`)}>
                    <MdAdd size={15} />
                    Add Courses
                  </button>
                }
              />
            ) : (
              <>
                {theoryCourses.length > 0 && (
                  <section className="dashboard-course-section anim-fade-up delay-2">
                    <div className="dashboard-section-head">
                      <div>
                        <div className="dashboard-section-kicker">
                          <MdBook size={15} />
                          Theory Cluster
                        </div>
                        <h2>Theory Courses</h2>
                      </div>
                      <span className="dashboard-section-count">{theoryCourses.length}</span>
                    </div>

                    <div className="courses-grid">
                      {theoryCourses.map((course, index) => (
                        <div key={course._id} className={`delay-${(index % 5) + 1} anim-fade-up`}>
                          <CourseOverviewCard course={course} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {labCourses.length > 0 && (
                  <section className="dashboard-course-section anim-fade-up delay-3">
                    <div className="dashboard-section-head">
                      <div>
                        <div className="dashboard-section-kicker dashboard-section-kicker-lab">
                          <MdScience size={15} />
                          Lab Cluster
                        </div>
                        <h2>Lab Courses</h2>
                      </div>
                      <span className="dashboard-section-count">{labCourses.length}</span>
                    </div>

                    <div className="courses-grid">
                      {labCourses.map((course, index) => (
                        <div key={course._id} className={`delay-${(index % 5) + 1} anim-fade-up`}>
                          <CourseOverviewCard course={course} />
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </section>

          <aside className="dashboard-rail anim-fade-up delay-4">
            <div className="dashboard-rail-section">
              <div className="dashboard-rail-head">
                <div className="dashboard-section-kicker dashboard-section-kicker-muted">
                  <MdHistory size={15} />
                  Live feed
                </div>
                <h2>Recent Activity</h2>
              </div>

              <div className="activity-panel">
                {activity.length === 0 ? (
                  <div className="activity-empty">No recent activity yet. New attendance, lab, and marks updates will appear here.</div>
                ) : (
                  activity.map((item, index) => (
                    <div key={index} className="activity-row">
                      <div className="activity-icon">{item.actIcon}</div>
                      <div className="activity-copy">
                        <div className="activity-row-top">
                          <p>{getActivityCopy(item)}</p>
                          <span>{moment(item.updatedAt).fromNow(true)}</span>
                        </div>
                        <small>{item.courseName}</small>
                      </div>
                    </div>
                  ))
                )}

                <button
                  className="activity-footer-link"
                  type="button"
                  onClick={() => navigate('/semesters')}
                >
                  View all courses
                  <MdArrowForward size={14} />
                </button>
              </div>
            </div>

            <div className="dashboard-quote-card">
              <p>
                "An investment in knowledge pays the best interest."
              </p>
              <span>Benjamin Franklin</span>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
