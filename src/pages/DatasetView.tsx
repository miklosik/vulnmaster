// src/pages/DatasetView.tsx
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Search, AlertCircle } from 'lucide-react';

// Type definition for the Vulnerability
type VulnRecord = {
  id: string;
  cveId: string;
  product: string;
  originalSeverity: string;
  expertSeverity: string | null;
  expertScore: number | null;
  expertJustification: string | null;
};

export default function DatasetView() {
  const { id } = useParams();
  const [selectedVuln, setSelectedVuln] = useState<VulnRecord | null>(null);
  
  // Mock Data - In real app, fetch via invoke('get_vulns', { datasetId: id })
  const [rows] = useState<VulnRecord[]>([
    { id: '1', cveId: 'CVE-2024-1092', product: 'OpenSSL', originalSeverity: 'CRITICAL', expertSeverity: null, expertScore: null, expertJustification: null },
    { id: '2', cveId: 'CVE-2023-4450', product: 'Nginx', originalSeverity: 'HIGH', expertSeverity: 'MEDIUM', expertScore: 5.4, expertJustification: "Behind firewall" },
    { id: '3', cveId: 'CVE-2024-0001', product: 'Log4j', originalSeverity: 'MEDIUM', expertSeverity: null, expertScore: null, expertJustification: null },
  ]);

  // Helper for Badge Colors
  const getSeverityColor = (sev: string | null) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
      case 'HIGH': return "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200";
      case 'MEDIUM': return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200";
      case 'LOW': return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
      default: return "bg-stone-100 text-stone-600";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Toolbar / Filter Bar */}
      <div className="px-6 py-3 border-b flex items-center gap-4">
        <h2 className="font-semibold text-lg text-stone-800">Targets / CVEs</h2>
        <div className="h-6 w-px bg-stone-200"></div>
        
        <Button variant="outline" size="sm" className="h-8 border-dashed text-stone-500">
          <Filter className="mr-2 h-3.5 w-3.5" /> Severity
        </Button>
        <Button variant="outline" size="sm" className="h-8 border-dashed text-stone-500">
          <Search className="mr-2 h-3.5 w-3.5" /> Find Product
        </Button>
        
        <div className="ml-auto text-xs text-stone-400">
          Dataset ID: {id}
        </div>
      </div>

      {/* Airtable-like Grid */}
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-stone-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[150px] text-xs uppercase font-semibold text-stone-500">CVE ID</TableHead>
              <TableHead className="w-[200px] text-xs uppercase font-semibold text-stone-500">Product</TableHead>
              <TableHead className="w-[120px] text-xs uppercase font-semibold text-stone-500">Scanner Sev</TableHead>
              <TableHead className="w-[120px] text-xs uppercase font-semibold text-stone-500">Expert Sev</TableHead>
              <TableHead className="w-[100px] text-xs uppercase font-semibold text-stone-500">Score</TableHead>
              <TableHead className="text-xs uppercase font-semibold text-stone-500">Justification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow 
                key={row.id} 
                className="group cursor-pointer hover:bg-blue-50/50 border-b border-stone-100"
                onClick={() => setSelectedVuln(row)}
              >
                <TableCell className="font-medium text-stone-700 flex items-center gap-2">
                  {row.cveId}
                </TableCell>
                <TableCell>{row.product}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getSeverityColor(row.originalSeverity)}>
                    {row.originalSeverity}
                  </Badge>
                </TableCell>
                {/* Expert Severity Column */}
                <TableCell>
                  {row.expertSeverity ? (
                    <Badge variant="outline" className={getSeverityColor(row.expertSeverity)}>
                      {row.expertSeverity}
                    </Badge>
                  ) : (
                    <span className="text-xs text-stone-300 italic group-hover:text-stone-400">Set Severity</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{row.expertScore || '-'}</TableCell>
                <TableCell className="text-stone-500 truncate max-w-[300px]">
                  {row.expertJustification || <span className="text-stone-300">-</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* EDIT DRAWER (Expert Analysis) */}
      <Sheet open={!!selectedVuln} onOpenChange={(open) => !open && setSelectedVuln(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="text-orange-600" />
              Expert Analysis
            </SheetTitle>
            <SheetDescription>
              Override vulnerability metrics for <span className="font-mono font-bold text-stone-800">{selectedVuln?.cveId}</span>.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-6 py-4">
            
            {/* Read Only Context */}
            <div className="p-4 bg-stone-50 rounded-lg border grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-stone-500 uppercase">Original Severity</span>
                <div className="mt-1 font-medium">{selectedVuln?.originalSeverity}</div>
              </div>
              <div>
                <span className="text-xs font-semibold text-stone-500 uppercase">Product</span>
                <div className="mt-1 font-medium">{selectedVuln?.product}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Expert Severity</Label>
              <Select defaultValue={selectedVuln?.expertSeverity || ""}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="INFO">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Expert Score (0-10)</Label>
                <Input type="number" step="0.1" max="10" defaultValue={selectedVuln?.expertScore || ""} />
              </div>
              <div className="space-y-1.5">
                 <Label>CVSS Vector</Label>
                 <Input placeholder="CVSS:3.1/AV:N/..." defaultValue="" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Expert Justification <span className="text-red-500">*</span></Label>
              <Textarea 
                className="min-h-[100px]" 
                placeholder="Why does this assessment differ from the scanner? Required for audit."
                defaultValue={selectedVuln?.expertJustification || ""} 
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSelectedVuln(null)}>Cancel</Button>
            <Button className="bg-[#8B4513] hover:bg-[#703810]">Save Assessment</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}