import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Save } from 'lucide-react';

// Matches the Rust struct
type VulnRecord = {
  id: string;
  dataset_id: string;
  cve_id: string;
  product: string;
  original_severity: string;
  original_score: number;
  expert_severity: string | null;
  expert_vector: string | null;
  expert_score: number | null;
  expert_justification: string | null;
  updated_at: string | null;
};

export default function DatasetView() {
  const { id } = useParams();
  const [rows, setRows] = useState<VulnRecord[]>([]);
  const [selectedVuln, setSelectedVuln] = useState<VulnRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // FORM STATE
  const [formSeverity, setFormSeverity] = useState("");
  const [formScore, setFormScore] = useState("");
  const [formVector, setFormVector] = useState("");
  const [formJustification, setFormJustification] = useState("");

  // 1. Load Data on Mount
  useEffect(() => {
    async function loadData() {
      try {
        const data = await invoke<VulnRecord[]>('get_dataset_records', { datasetId: id });
        setRows(data);
      } catch (err) {
        toast.error("Failed to load dataset", { description: String(err) });
      }
    }
    if (id) loadData();
  }, [id]);

  // 2. Populate Form when row clicked
  useEffect(() => {
    if (selectedVuln) {
      setFormSeverity(selectedVuln.expert_severity || "");
      setFormScore(selectedVuln.expert_score?.toString() || "");
      setFormVector(selectedVuln.expert_vector || "");
      setFormJustification(selectedVuln.expert_justification || "");
    }
  }, [selectedVuln]);

  // 3. Handle Save (FR3.1, 3.3, 3.4)
  const handleSave = async () => {
    if (!selectedVuln) return;
    setIsLoading(true);

    try {
      const updatePayload = {
        id: selectedVuln.id,
        severity: formSeverity,
        vector: formVector || null,
        score: formScore ? parseFloat(formScore) : null,
        justification: formJustification
      };

      await invoke('update_expert_assessment', { update: updatePayload });
      
      toast.success("Assessment Saved");
      
      // Update local UI immediately
      setRows(prev => prev.map(row => 
        row.id === selectedVuln.id 
          ? { ...row, expert_severity: formSeverity, expert_score: parseFloat(formScore), expert_justification: formJustification, expert_vector: formVector }
          : row
      ));
      setSelectedVuln(null); // Close drawer
    } catch (err) {
      toast.error("Save Failed", { description: String(err) });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (sev: string | null) => {
    switch (sev?.toUpperCase()) {
      case 'CRITICAL': return "bg-red-100 text-red-700 border-red-200";
      case 'HIGH': return "bg-orange-100 text-orange-700 border-orange-200";
      case 'MEDIUM': return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case 'LOW': return "bg-green-100 text-green-700 border-green-200";
      default: return "bg-stone-100 text-stone-600";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-6 py-3 border-b flex items-center gap-4">
        <h2 className="font-semibold text-lg text-stone-800">Targets / CVEs</h2>
        <div className="ml-auto text-xs text-stone-400">Dataset: {id}</div>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader className="bg-stone-50 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[150px]">CVE ID</TableHead>
              <TableHead className="w-[200px]">Compone</TableHead>
              <TableHead>Scanner Sev</TableHead>
              <TableHead>Expert Sev</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Justification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow 
                key={row.id} 
                className="group cursor-pointer hover:bg-blue-50/50 border-b border-stone-100"
                onClick={() => setSelectedVuln(row)}
              >
                <TableCell className="font-medium text-stone-700">{row.cve_id}</TableCell>
                <TableCell>{row.product}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getSeverityColor(row.original_severity)}>
                    {row.original_severity}
                  </Badge>
                </TableCell>
                <TableCell>
                  {row.expert_severity ? (
                    <Badge variant="outline" className={getSeverityColor(row.expert_severity)}>
                      {row.expert_severity}
                    </Badge>
                  ) : (
                    <span className="text-xs text-stone-300 italic">Set Severity</span>
                  )}
                </TableCell>
                <TableCell>{row.expert_score || '-'}</TableCell>
                <TableCell className="text-stone-500 truncate max-w-[300px]">
                  {row.expert_justification || <span className="text-stone-300">-</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* EDIT DRAWER */}
      <Sheet open={!!selectedVuln} onOpenChange={(open) => !open && setSelectedVuln(null)}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="text-orange-600" />
              Expert Analysis
            </SheetTitle>
            <SheetDescription>
              Override vulnerability metrics for <span className="font-mono font-bold text-stone-800">{selectedVuln?.cve_id}</span>.
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-6 py-4">
            <div className="space-y-1.5">
              <Label>Expert Severity</Label>
              <Select value={formSeverity} onValueChange={setFormSeverity}>
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
                <Input 
                  type="number" step="0.1" max="10" 
                  value={formScore} 
                  onChange={(e) => setFormScore(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                 <Label>CVSS Vector</Label>
                 <Input 
                   placeholder="CVSS:3.1/AV:N/..." 
                   value={formVector} 
                   onChange={(e) => setFormVector(e.target.value)} 
                 />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Expert Justification <span className="text-red-500">* (Min 10 chars)</span></Label>
              <Textarea 
                className="min-h-[100px]" 
                placeholder="Why does this assessment differ from the scanner?"
                value={formJustification}
                onChange={(e) => setFormJustification(e.target.value)}
              />
            </div>
          </div>

          <SheetFooter className="mt-6">
            <Button variant="outline" onClick={() => setSelectedVuln(null)}>Cancel</Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading} 
              className="bg-[#8B4513] hover:bg-[#703810]"
            >
              {isLoading ? <span className="animate-spin mr-2">⏳</span> : <Save className="mr-2 h-4 w-4" />}
              Save Assessment
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}