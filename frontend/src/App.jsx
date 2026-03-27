import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import BottomNav from './components/BottomNav.jsx';
import Dashboard from './pages/Dashboard.jsx';
import LogWorkout from './pages/LogWorkout.jsx';
import History from './pages/History.jsx';
import Progress from './pages/Progress.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen bg-[#0a0a0a]">
        <main className="flex-1 overflow-y-auto pb-20 pt-safe">
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/log"      element={<LogWorkout />} />
            <Route path="/log/:id"  element={<LogWorkout />} />
            <Route path="/history"  element={<History />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="*"         element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
