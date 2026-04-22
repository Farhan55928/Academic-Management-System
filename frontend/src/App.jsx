import './index.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth.js';
import Layout from './components/Layout/Layout.jsx';
import LoginPage from './pages/Login/LoginPage.jsx';
import DashboardPage from './pages/Home/DashboardPage.jsx';
import SemestersPage from './pages/Semesters/SemestersPage.jsx';
import SemesterDetailPage from './pages/Semesters/SemesterDetailPage.jsx';
import CourseDetailPage from './pages/Courses/CourseDetailPage.jsx';
import MonthsPage from './pages/Expenses/MonthsPage.jsx';
import ExpensesPage from './pages/Expenses/ExpensesPage.jsx';
import StudyDaysPage from './pages/Study/StudyDaysPage.jsx';
import StudyDayDetailPage from './pages/Study/StudyDayDetailPage.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { isAuthenticated, user, logout, login } = useAuth();

  if (!isAuthenticated) {
    return (
      <>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={login} />} />
          <Route path="*"     element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{
          style: { fontFamily: 'var(--font-body)', fontSize: 14 },
          success: { iconTheme: { primary: 'var(--blue)', secondary: '#fff' } }
        }} />
      </>
    );
  }

  return (
    <>
      <Layout user={user} onLogout={logout}>
        <Routes>
          <Route path="/"                          element={<DashboardPage />} />
          <Route path="/semesters"                 element={<SemestersPage />} />
          <Route path="/semesters/:semesterId"     element={<SemesterDetailPage />} />
          <Route path="/courses/:courseId"          element={<CourseDetailPage />} />
          <Route path="/expenses"                  element={<MonthsPage />} />
          <Route path="/expenses/:monthId"         element={<ExpensesPage />} />
          <Route path="/study"                     element={<StudyDaysPage />} />
          <Route path="/study/:dayId"              element={<StudyDayDetailPage />} />
          <Route path="*"                          element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <Toaster position="top-right" toastOptions={{
        style: { fontFamily: 'var(--font-body)', fontSize: 14 },
        success: { iconTheme: { primary: 'var(--blue)', secondary: '#fff' } }
      }} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
