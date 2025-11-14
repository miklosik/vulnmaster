import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import Home from '@/pages/Home';
import Imports from '@/pages/Imports'; // <-- Import new page
import Exports from '@/pages/Exports'; // <-- Import new page
import DatasetView from '@/pages/DatasetView';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Dashboard */}
          <Route index element={<Home />} />
          
          {/* Operational Pages */}
          <Route path="imports" element={<Imports />} />
          <Route path="exports" element={<Exports />} />
          
          {/* Detail Views */}
          <Route path="dataset/:id" element={<DatasetView />} />
          
          {/* Placeholders */}
          <Route path="reports" element={<div className="p-10">Reports Page (Coming Soon)</div>} />
        </Route>
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;