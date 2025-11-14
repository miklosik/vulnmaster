import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, FileSpreadsheet, ChevronRight, Loader2, FileJson, FileText } from 'lucide-react';

interface Dataset {
  id: string;
  file_name: string;
  created_at: string;
  record_count: number;
}

// Helper for file-type icons
const getFileIcon = (fileName: string) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'csv':
      return <FileSpreadsheet className="h-4 w-4 text-green-700" />;
    case 'xlsx':
      return <FileSpreadsheet className="h-4 w-4 text-green-700" />;
    case 'json':
    case 'vex':
      return <FileJson className="h-4 w-4 text-blue-700" />;
    default:
      return <FileText className="h-4 w-4 text-stone-500" />;
  }
};

export default function Imports() {
  const navigate = useNavigate();
  const [isIngesting, setIsIngesting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  const fetchDatasets = async () => {
    setIsLoading(true);
    try {
      const result = await invoke<Dataset[]>('get_datasets');
      setDatasets(result); // Backend sorts by DESC (newest first)
    } catch (error) {
      toast.error("Failed to load datasets", { description: String(error) });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleImport = async () => {
    setIsIngesting(true);
    try {
      const selected = await open({ 
        multiple: false, 
        title: "Select Scan Report",
        filters: [{ name: 'Reports', extensions: ['csv', 'xlsx', 'json'] }] 
      });
      
      if (selected) {
        const res: string = await invoke('ingest_csv', { filepath: selected });
        toast.success("Import Successful", { description: res });
        fetchDatasets(); // Refresh list
      }
    } catch (err) {
      toast.error("Import Failed", { description: String(err) });
    } finally {
      setIsIngesting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    });
  };

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-6 border-b border-stone-200 bg-white flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Imports</h1>
          <p className="text-stone-500 mt-2">Manage and ingest new vulnerability scan reports.</p>
        </div>
        <Button onClick={handleImport} disabled={isIngesting} className="bg-stone-900 hover:bg-stone-800 text-white shadow-sm">
          {isIngesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          {isIngesting ? 'Importing...' : 'Import Scan'}
        </Button>
      </header>

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
                <TableHead>Edit</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-stone-500">
                    <Loader2 className="h-6 w-6 animate-spin inline-block" />
                </TableCell></TableRow>
              ) : datasets.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-32 text-center text-stone-500">
                    No datasets imported yet.
                </TableCell></TableRow>
              ) : (
                datasets.map((file) => (
                  <TableRow 
                    key={file.id} 
                    className="cursor-pointer hover:bg-blue-50/50 transition-colors group border-stone-100"
                    onClick={() => navigate(`/dataset/${file.id}`)}
                  >
                    <TableCell className="pl-6">
                      <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 border border-stone-200">
                         {getFileIcon(file.file_name)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-stone-900 group-hover:text-blue-700">
                      {file.file_name}
                    </TableCell>
                    <TableCell className="text-stone-500">{formatDate(file.created_at)}</TableCell>
                    <TableCell className="font-mono text-xs text-stone-600">{file.record_count.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                        Analyzed
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">
                        Pending
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-stone-300 group-hover:text-stone-500" />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
