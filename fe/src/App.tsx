import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/dashboard" 
          element={
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
              <div className="text-3xl font-bold text-slate-800 shadow-lg p-10 bg-white rounded-xl">
                Enterprise Dashboard (Building Next...)
              </div>
            </div>
          } 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;