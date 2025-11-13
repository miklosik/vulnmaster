import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileSpreadsheet, ChevronRight } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [isIngesting, setIsIngesting] = useState(false);

  // Mock data for display
  const datasets = [
    { id: '1', name: 'srlinux_scan_q1_2024.csv', date: '2025-07-28', count: 142, status: 'Analyzed', type: 'CSV' },
    { id: '2', name: 'srlinux_25_7_2_scan.xlsx', date: '2025-10-10', count: 89, status: 'Pending', type: 'XLSX' },
    { id: '3', name: 'srlinux_25_10_1_scan_vex.json', date: '2025-11-11', count: 1205, status: 'Pending', type: 'VEX' },
  ];

  const handleImport = async () => {
    setIsIngesting(true);
    try {
      const selected = await open({ 
        multiple: false, 
        title: "Select Scan Report",
        filters: [{ name: 'Reports', extensions: ['csv', 'xlsx', 'json'] }] 
      });
      
      if (selected) {
        // Note: 'selected' is the file path string in Tauri v2
        const res: string = await invoke('ingest_csv', { filepath: selected });
        toast.success("Import Successful", { description: res });
      }
    } catch (err) {
      toast.error("Import Failed", { description: String(err) });
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Header */}
      <header className="px-8 py-6 border-b border-stone-200 bg-white flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Datasets</h1>
          <p className="text-stone-500 mt-2">Manage and analyze your vulnerability scan imports.</p>
        </div>
        <Button onClick={handleImport} disabled={isIngesting} className="bg-stone-900 hover:bg-stone-800 text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> 
          {isIngesting ? 'Importing...' : 'Import Scan'}
        </Button>
      </header>

      {/* Data Grid Container */}
      <div className="p-8 bg-stone-50/50 flex-1">
        <div className="border border-stone-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50/80 hover:bg-stone-50/80 border-b border-stone-200">
                <TableHead className="w-[60px] pl-6">Type</TableHead>
                <TableHead className="font-semibold text-stone-900">File Name</TableHead>
                <TableHead>Import Date</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Analysis Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((file) => (
                <TableRow 
                  key={file.id} 
                  className="cursor-pointer hover:bg-blue-50/50 transition-colors group border-stone-100"
                  onClick={() => navigate(`/dataset/${file.id}`)}
                >
                  <TableCell className="pl-6">
                    <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 border border-stone-200">
                       <FileSpreadsheet className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-stone-900 group-hover:text-blue-700">
                    {file.name}
                  </TableCell>
                  <TableCell className="text-stone-500">
                    <div className="flex items-center gap-2 text-xs uppercase font-medium tracking-wide">
                      {file.date}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-stone-600">
                    {file.count.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      file.status === 'Pending' 
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200" 
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                    }>
                      {file.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500" />
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
