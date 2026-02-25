import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Catalog from './pages/Catalog';
import AddBook from './pages/AddBook';
import BookDetails from './pages/BookDetails';
import LibrarianLogin from './pages/LibrarianLogin';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/librarian-login" element={<LibrarianLogin />} />
        <Route path="/register" element={<Register />} />
        <Route path="/catalog" element={<Catalog />} />
        <Route path="/book/:id" element={<BookDetails />} />

        {/* Protected Member Pages */}
        <Route element={<ProtectedRoute role="member" />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Protected Admin Pages */}
        <Route element={<ProtectedRoute role="librarian" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/add-book" element={<AddBook />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;