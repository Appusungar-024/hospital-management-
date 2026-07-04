import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientRegistration from './pages/PatientRegistration';
import DoctorVisit from './pages/DoctorVisit';
import Billing from './pages/Billing';
import Pharmacy from './pages/Pharmacy';
import Lab from './pages/Lab';

function ProtectedRoute({ children }) {
  const isAuthenticated = !!localStorage.getItem('token');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {

  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Protected Routes */}
          <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/new" element={<PatientRegistration />} />
            <Route path="visit/:patientId" element={<DoctorVisit />} />
            <Route path="billing" element={<Billing />} />
            <Route path="pharmacy" element={<Pharmacy />} />
            <Route path="lab" element={<Lab />} />
          </Route>
          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <Toaster position="top-right" toastOptions={{ 
          style: { background: 'var(--th-bg-sidebar)', color: 'var(--th-text-primary)', border: '1px solid var(--th-border)' },
          success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
        }} />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;