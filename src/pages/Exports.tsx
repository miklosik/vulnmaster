import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileOutput } from 'lucide-react';

export default function Exports() {
  // Mock data for Exports
  const datasets = [
    { id: '1', name: 'srlinux_export_25_7_1_2025.csv', date: '2025-07-28', count: 142, status: 'Done', type: 'CSV' },
    { id: '2', name: 'srlinux_25_7_2_export.xlsx', date: '2025-10-10', count: 89, status: 'Done', type: 'XLSX' },
    { id: '3', name: 'srlinux_25_10_1_export_vex.json', date: '2025-11-11', count: 1205, status: 'In Progress', type: 'VEX' },
  ];

  return (
    <div className="h-full flex flex-col">
      <header className="px-8 py-6 border-b border-stone-200 bg-white">
        <h1 className="text-3xl font-bold text-stone-900 tracking-tight">Exports</h1>
        <p className="text-stone-500 mt-2">View history of generated vulnerability reports.</p>
      </header>

      <div className="p-8 bg-stone-50/50 flex-1">
        <div className="border border-stone-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-stone-50/80 hover:bg-stone-50/80 border-b border-stone-200">
                <TableHead className="w-[60px] pl-6">Type</TableHead>
                <TableHead className="font-semibold text-stone-900">Export File Name</TableHead>
                <TableHead>Export Date</TableHead>
                <TableHead>Records</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datasets.map((file) => (
                <TableRow key={file.id} className="hover:bg-stone-50 border-stone-100">
                  <TableCell className="pl-6">
                    <div className="h-8 w-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-500 border border-stone-200">
                       <FileOutput className="h-4 w-4" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-stone-900">
                    {file.name}
                  </TableCell>
                  <TableCell className="text-stone-500">{file.date}</TableCell>
                  <TableCell className="font-mono text-xs text-stone-600">{file.count.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      file.status === 'In Progress' 
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200" 
                        : "bg-stone-100 text-stone-700 hover:bg-stone-100 border-stone-200"
                    }>
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