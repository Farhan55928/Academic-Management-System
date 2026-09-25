import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router';
import { MdArrowBack } from 'react-icons/md';
import { getCourse } from '../../api/courses.js';
import { useAsyncData } from '../../hooks/useAsyncData.js';
import { ErrorKind } from '../../api/errors.js';
import PageHeader from '../../components/UI/PageHeader.jsx';
import ErrorState from '../../components/UI/ErrorState.jsx';
import AttendanceTab from './tabs/AttendanceTab.jsx';
import MarksTab from './tabs/MarksTab.jsx';
import LabsTab from './tabs/LabsTab.jsx';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();

  const [activeTab, setActiveTab] = useState('attendance');

  const { data: course, loading, error, reload } = useAsyncData(
    (signal) => getCourse(courseId, signal).then((r) => r.data),
    [courseId]
  );

  // Sync the active tab with the hash, both on load and when it changes
  // externally (e.g. the "Attendance" shortcut from another page).
  useEffect(() => {
    if (location.hash === '#marks') setActiveTab('marks');
    else if (location.hash === '#labs' && course?.type === 'lab') setActiveTab('labs');
    else if (location.hash === '#attendance') setActiveTab('attendance');
  }, [location.hash, course?.type]);

  const handleTabChange = (t) => {
    setActiveTab(t);
    navigate(`/courses/${courseId}#${t}`, { replace: true });
  };

  if (loading) return (
    <div className="page-wrapper flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <p className="text-muted">Loading course details…</p>
    </div>
  );

  if (error && error.kind !== ErrorKind.NOTFOUND) return (
    <div className="page-wrapper">
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate(-1)}>
        <MdArrowBack size={15} /> Back
      </button>
      <ErrorState description={error.message} onRetry={reload} />
    </div>
  );

  if (!course) return (
    <div className="page-wrapper">
      <button className="btn btn-ghost btn-sm mb-4" onClick={() => navigate(-1)}>
        <MdArrowBack size={15} /> Back
      </button>
      <div className="empty-state">
        <h3>Course not found</h3>
        <p>The course you are looking for does not exist or has been removed.</p>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper">
      <div className="m-hide" style={{ marginBottom: 16 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
          <MdArrowBack size={15} /> Back
        </button>
      </div>

      <PageHeader
        eyebrow={course.code}
        title={course.name}
        subtitle={`${course.type === 'lab' ? '🔬 Lab' : '📖 Theory'} · ${course.creditHours} Credit Hours`}
      />

      {/* Tabs Hub */}
      <div className="tab-bar anim-fade-up delay-1">
        <button className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => handleTabChange('attendance')}>
          📋 Attendance
        </button>
        {course.type === 'theory' && (
          <button className={`tab-btn ${activeTab === 'marks' ? 'active' : ''}`}
            onClick={() => handleTabChange('marks')}>
            📊 Marks
          </button>
        )}
        {course.type === 'lab' && (
          <button className={`tab-btn ${activeTab === 'labs' ? 'active' : ''}`}
            onClick={() => handleTabChange('labs')}>
            🧪 Lab Management
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="anim-fade-up delay-2">
        {activeTab === 'attendance' && <AttendanceTab courseId={courseId} />}
        {activeTab === 'marks' && course.type === 'theory' && <MarksTab courseId={courseId} />}
        {activeTab === 'labs' && course.type === 'lab' && <LabsTab courseId={courseId} />}
      </div>
    </div>
  );
}
