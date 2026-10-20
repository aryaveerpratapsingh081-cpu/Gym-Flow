import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Components & Layout
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Core Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import TrainerDashboard from './pages/TrainerDashboard';
import MemberDashboard from './pages/MemberDashboard';
import MembersPage from './pages/MembersPage';
import TrainersPage from './pages/TrainersPage';
import PlansPage from './pages/PlansPage';
import MembershipsPage from './pages/MembershipsPage';
import AttendancePage from './pages/AttendancePage';
import PaymentsPage from './pages/PaymentsPage';
import WorkoutsPage from './pages/WorkoutsPage';
import ProgressPage from './pages/ProgressPage';
import ReportsPage from './pages/ReportsPage';

// Extended DBMS Modules
import ClassesPage from './pages/ClassesPage';
import EquipmentPage from './pages/EquipmentPage';
import LockersPage from './pages/LockersPage';
import DietPlansPage from './pages/DietPlansPage';
import LeadsPage from './pages/LeadsPage';
import CouponsPage from './pages/CouponsPage';
import DuesPage from './pages/DuesPage';
import FeedbackPage from './pages/FeedbackPage';
import AuditLogsPage from './pages/AuditLogsPage';
import DiagnosticsPage from './pages/DiagnosticsPage';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Initializing GymFlow MongoDB Core...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'Trainer') return <Navigate to="/trainer/dashboard" replace />;
    return <Navigate to="/member/dashboard" replace />;
  }

  return children;
};

// Main Layout Component for Protected App
const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0d12] flex text-slate-100">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen overflow-x-hidden">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Three Separate Role Dashboards (Section 4, 5, 6, 7) */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout><AdminDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={<Navigate to="/admin/dashboard" replace />}
          />

          <Route
            path="/trainer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Trainer']}>
                <AppLayout><TrainerDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainer-dashboard"
            element={<Navigate to="/trainer/dashboard" replace />}
          />

          <Route
            path="/member/dashboard"
            element={
              <ProtectedRoute allowedRoles={['Member']}>
                <AppLayout><MemberDashboard /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/member-dashboard"
            element={<Navigate to="/member/dashboard" replace />}
          />

          {/* People */}
          <Route
            path="/members"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer']}>
                <AppLayout><MembersPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/trainers"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer', 'Member']}>
                <AppLayout><TrainersPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/leads"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer']}>
                <AppLayout><LeadsPage /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Membership */}
          <Route
            path="/plans"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer', 'Member']}>
                <AppLayout><PlansPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/memberships"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer', 'Member']}>
                <AppLayout><MembershipsPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dues"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout><DuesPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/coupons"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout><CouponsPage /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Gym Operations */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer', 'Member']}>
                <AppLayout><AttendancePage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer']}>
                <AppLayout><PaymentsPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/classes"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer', 'Member']}>
                <AppLayout><ClassesPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/equipment"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout><EquipmentPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lockers"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Member']}>
                <AppLayout><LockersPage /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fitness */}
          <Route
            path="/workouts"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer', 'Member']}>
                <AppLayout><WorkoutsPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/diet-plans"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer', 'Member']}>
                <AppLayout><DietPlansPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer', 'Member']}>
                <AppLayout><ProgressPage /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Engagement */}
          <Route
            path="/feedback"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Trainer', 'Member']}>
                <AppLayout><FeedbackPage /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* System */}
          <Route
            path="/reports"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout><ReportsPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout><AuditLogsPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/diagnostics"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <AppLayout><DiagnosticsPage /></AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
