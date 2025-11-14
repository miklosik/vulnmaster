import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Upload, FileOutput, AlertTriangle } from 'lucide-react';

export default function Home() {
  // Mock Data for Dashboard Tables
  const recentImports = [
    { id: '1', name: 'srlinux_scan_q1_2024.csv', date: '2025-07-28', status: 'Analyzed' },
    { id: '2', name: 'srlinux_25_7_2_scan.xlsx', date: '2025-10-10', status: 'Pending' },
    { id: '3', name: 'srlinux_25_10_1_scan_vex.json', date: '2025-11-11', status: 'Pending' },
  ];

  const recentExports = [
    { id: '1', name: 'export_q1_final.csv', date: '2025-07-29', status: 'Done' },
    { id: '2', name: 'compliance_report_v2.xlsx', date: '2025-10-12', status: 'Done' },
  ];

  const recentReports = [
    { id: '1', name: 'Quarterly Security Review', date: '2025-08-01', risk: 'High' },
    { id: '2', name: 'Release Gateway Check', date: '2025-11-12', risk: 'Medium' },
  ];

  return (
    <div className="h-full flex flex-col overflow-auto bg-stone-50/50">
      <div className="p-8 space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Dashboard</h1>
          <p className="text-stone-500 mt-1">Overview of your vulnerability management posture.</p>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-sm border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">Total Imports</CardTitle>
              <Upload className="h-4 w-4 text-stone-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">24</div>
              <p className="text-xs text-stone-500 mt-1">+2 from last week</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-stone-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-stone-500">Total Exports</CardTitle>
              <FileOutput className="h-4 w-4 text-stone-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-stone-900">12</div>
              <p className="text-xs text-stone-500 mt-1">All exports successful</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-stone-200 bg-orange-50/50 border-orange-100">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-800">High Risk CVEs (Last Import)</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900">7</div>
              <p className="text-xs text-orange-700 mt-1">Requires immediate attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Tables Row */}
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          
          {/* Recent Imports Table */}
          <div className="col-span-1 border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 bg-white font-semibold text-stone-800">
              Last 10 Imports
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentImports.map((item) => (
                  <TableRow key={item.id} className="hover:bg-stone-50">
                    <TableCell className="font-medium text-sm truncate max-w-[150px]" title={item.name}>{item.name}</TableCell>
                    <TableCell className="text-right">
                       <Badge variant="secondary" className="text-xs h-5 px-2 font-normal">
                         {item.status}
                       </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Recent Exports Table */}
          <div className="col-span-1 border rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 bg-white font-semibold text-stone-800">
              Last 10 Exports
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentExports.map((item) => (
                  <TableRow key={item.id} className="hover:bg-stone-50">
                    <TableCell className="font-medium text-sm truncate max-w-[150px]" title={item.name}>{item.name}</TableCell>
                    <TableCell className="text-right">
                       <Badge variant="outline" className="text-xs h-5 px-2 font-normal bg-stone-50">
                         {item.status}
                       </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* CVE Reports Table */}
          <div className="col-span-1 border rounded-xl bg-white shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-stone-100 bg-white font-semibold text-stone-800">
              Last 10 CVE Reports
            </div>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Report Name</TableHead>
                  <TableHead className="text-right">Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentReports.map((item) => (
                  <TableRow key={item.id} className="hover:bg-stone-50">
                    <TableCell className="font-medium text-sm">{item.name}</TableCell>
                    <TableCell className="text-right">
                       <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.risk === 'High' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                         {item.risk}
                       </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

        </div>
      </div>
    </div>
  );
}
