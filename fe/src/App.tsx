import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import BookDetails from './pages/BookDetails';
import LibrarianLogin from './pages/LibrarianLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import FineSettlement from './pages/FineSettlement';
import SystemDiagnostics from './pages/SystemDiagnostics';
import ManageBooks from './pages/ManageBooks';
import ManageAuthors from './pages/ManageAuthors';
import ManageMembers from './pages/ManageMembers';
import LoansDashboard from './pages/LoansDashboard';
import AdminLayout from './components/AdminLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<LibrarianLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/book/:id" element={<BookDetails />} />

        {/* Protected Member Pages */}
        <Route element={<ProtectedRoute role="member" />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Protected Admin Pages */}
        <Route element={<ProtectedRoute role="librarian" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/loans" element={<LoansDashboard />} />
            <Route path="/admin/fines" element={<FineSettlement />} />
            <Route path="/admin/diagnostics" element={<SystemDiagnostics />} />
            <Route path="/admin/books" element={<ManageBooks />} />
            <Route path="/admin/authors" element={<ManageAuthors />} />
            <Route path="/admin/members" element={<ManageMembers />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;