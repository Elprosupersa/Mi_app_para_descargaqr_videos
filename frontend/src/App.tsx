import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { HistoryPage } from './pages/History';
import { getSessionId } from './utils/session';

axios.defaults.headers.common['x-session-id'] = getSessionId();

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
