// src/pages/Home.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Calendar } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [isIngesting, setIsIngesting] = useState(false);

  // Mock data for display - in real app, fetch this from SQLite
  const datasets = [
    { id: '1', name: 'scan_q1_2024.csv', date: '2024-05-15', count: 142, status: 'Analyzed' },
    { id: '2', name: 'backend_api_scan.xlsx', date: '2024-06-02', count: 89, status: 'Pending' },
  ];

  const handleImport = async () => {
    setIsIngesting(true);
    try {
      const selected = await open({ multiple: false, filters: [{ name: 'Reports', extensions: ['csv', 'xlsx'] }] });
      if (selected) {
        const res: string = await invoke('ingest_csv', { filepath: selected });
        toast.success("Import Successful", { description: res });
        // Here you would refresh the dataset list
      }
    } catch (err) {
      toast.error("Import Failed", { description: String(err) });
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header Section */}
      <header className="px-8 py-5 border-b flex justify-between items-center bg-white">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Imported Datasets</h1>
          <p className="text-muted-foreground text-sm mt-1">Select a file to view CVEs and perform analysis.</p>
        </div>
        <Button onClick={handleImport} disabled={isIngesting} className="bg-[#8B4513] hover:bg-[#703810]">
          <Plus className="mr-2 h-4 w-4" /> 
          {isIngesting ? 'Importing...' : 'Import New Scan'}
        </Button>
      </header>

      {/* List Section */}
      <div className="flex-1 overflow-auto p-8 bg-stone-50/30">
        <div className="border rounded-md bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>File Name</TableHead>
                <TableHead>Import Date</TableHead>
                <TableHead>Record Count</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((file) => (
                <TableRow 
                  key={file.id} 
                  className="cursor-pointer hover:bg-stone-50"
                  onClick={() => navigate(`/dataset/${file.id}`)} // Navigate to detail view
                >
                  <TableCell><FileText className="h-4 w-4 text-stone-400" /></TableCell>
                  <TableCell className="font-medium text-stone-700">{file.name}</TableCell>
                  <TableCell className="text-stone-500">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" /> {file.date}
                    </div>
                  </TableCell>
                  <TableCell>{file.count}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={file.status === 'Pending' ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>
                      {file.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
