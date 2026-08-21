import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import StudentDetail from './pages/StudentDetail';
import Teachers from './pages/Teachers';
import Batches from './pages/Batches';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Homework from './pages/Homework';
import Exams from './pages/Exams';
import Results from './pages/Results';
import Notices from './pages/Notices';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Loading from './components/Loading';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <Toast />
            <Routes>
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="students" element={<Students />} />
                <Route path="students/:id" element={<StudentDetail />} />
                <Route path="teachers" element={
                  <ProtectedRoute roles={['admin']}>
                    <Teachers />
                  </ProtectedRoute>
                } />
                <Route path="batches" element={<Batches />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="fees" element={
                  <ProtectedRoute roles={['admin', 'student']}>
                    <Fees />
                  </ProtectedRoute>
                } />
                <Route path="homework" element={<Homework />} />
                <Route path="exams" element={<Exams />} />
                <Route path="results" element={<Results />} />
                <Route path="notices" element={<Notices />} />
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
