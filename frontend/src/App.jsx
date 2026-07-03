import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientRegistration from './pages/PatientRegistration';
import DoctorVisit from './pages/DoctorVisit';
import Billing from './pages/Billing';
import Pharmacy from './pages/Pharmacy';
import Lab from './pages/Lab';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route path="/" element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="patients" element={<Patients />} />
          <Route path="patients/new" element={<PatientRegistration />} />
          <Route path="visit/:patientId" element={<DoctorVisit />} />
          <Route path="billing" element={<Billing />} />
          <Route path="pharmacy" element={<Pharmacy />} />
          <Route path="lab" element={<Lab />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;