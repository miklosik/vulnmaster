// src/App.tsx
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import DatasetView from '@/pages/DatasetView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dataset/:id" element={<DatasetView />} />
          {/* Placeholder routes */}
          <Route path="imports" element={<div className="p-10">Imports Page</div>} />
          <Route path="exports" element={<div className="p-10">Exports Page</div>} />
          <Route path="reports" element={<div className="p-10">Reports Page</div>} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;