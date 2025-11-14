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
import { AlertCircle, Save, Loader2 } from 'lucide-react';

// Matches the Rust struct
type VulnRecord = {
  id: string;
  dataset_id: string;
  cve_id: string;
  product: string;
  component: string;
  original_severity: string;
  original_vector: string;
  original_score: number;
  disposition_summary: string;
  rationale: string;
  expert_severity: string | null;
  expert_vector: string | null;
  expert_score: number | null;
  expert_justification: string | null;
  updated_at: string | null;
};

// Matches the Rust update struct
type ExpertUpdate = {
    id: string;
    severity: string;
    vector: string | null;
    score: number | null;
    justification: string;
}

export default function DatasetView() {
  const { id } = useParams(); // Get dataset ID from URL
  const [rows, setRows] = useState<VulnRecord[]>([]);
  const [selectedVuln, setSelectedVuln] = useState<VulnRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form state for the slide-over sheet
  const [formSeverity, setFormSeverity] = useState("");
  const [formScore, setFormScore] = useState("");
  const [formVector, setFormVector] = useState("");
  const [formJustification, setFormJustification] = useState("");

  // 1. Load Data on Mount
  useEffect(() => {
    async function loadData() {
      if (!id) return;
      setIsLoading(true);
      try {
        // Call the Rust command from main.rs
        const data = await invoke<VulnRecord[]>('get_dataset_records', { datasetId: id });
        setRows(data);
      } catch (err) {
        toast.error("Failed to load dataset", { description: String(err) });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]); // Re-run if ID changes

  // 2. Populate Form when a row is clicked
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
    
    // FR3.4 Validation
    if (formJustification.trim().length < 10) {
      toast.error("Justification is mandatory", {
        description: "Please provide at least 10 characters."
      });
      return;
    }
    
    setIsSaving(true);
    const scoreAsFloat = formScore ? parseFloat(formScore) : null;

    try {
      const updatePayload: ExpertUpdate = {
        id: selectedVuln.id,
        severity: formSeverity,
        vector: formVector || null,
        score: scoreAsFloat,
        justification: formJustification
      };

      // Call the Rust command from main.rs
      await invoke('update_expert_assessment', { update: updatePayload });
      
      toast.success("Assessment Saved", { description: selectedVuln.cve_id });
      
      // Update local UI immediately (no need for a full refresh)
      setRows(prev => prev.map(row => 
        row.id === selectedVuln.id 
          ? { ...row, 
              expert_severity: formSeverity || null, 
              expert_score: scoreAsFloat, 
              expert_justification: formJustification, 
              expert_vector: formVector || null 
            }
          : row
      ));
      setSelectedVuln(null); // Close drawer
    } catch (err) {
      toast.error("Save Failed", { description: String(err) });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper for badge colors
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
      <div className="px-6 py-3 border-b border-stone-200 flex items-center gap-4">
        <h2 className="font-semibold text-lg text-stone-800">Vulnerability Records</h2>
        <div className="ml-auto text-xs text-stone-400">Dataset ID: {id}</div>
      </div>

      <div className="flex-1 overflow-auto">
        <Table>
          {/* UPDATED TABLE HEADER */}
          <TableHeader className="bg-stone-50 sticky top-0 z-10">
            <TableRow>
              <TableHead>CVE ID</TableHead>
              <TableHead>Component</TableHead>
              <TableHead>Scanner Sev</TableHead>
              <TableHead>Scanner Vector</TableHead>
              <TableHead>Scanner Score</TableHead>
              <TableHead>Expert Sev</TableHead>
              <TableHead>Expert Vector</TableHead>
              <TableHead>Expert Score</TableHead>
              <TableHead>Disposition</TableHead>
              <TableHead>Rationale</TableHead>
              <TableHead>Expert Justification</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow><TableCell colSpan={11} className="h-32 text-center text-stone-500">
                    <Loader2 className="h-6 w-6 animate-spin inline-block" />
                </TableCell></TableRow>
            ) : rows.map((row) => (
              <TableRow 
                key={row.id} 
                className="group cursor-pointer hover:bg-blue-50/50 border-b border-stone-100"
                onClick={() => setSelectedVuln(row)}
              >
                {/* UPDATED TABLE ROW */}
                <TableCell className="font-medium text-stone-700 font-mono text-xs">{row.cve_id}</TableCell>
                <TableCell className="font-mono text-xs">{row.component}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getSeverityColor(row.original_severity)}>
                    {row.original_severity}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-[11px] max-w-[150px] truncate" title={row.original_vector}>{row.original_vector}</TableCell>
                <TableCell className="font-mono text-xs">{row.original_score.toFixed(1)}</TableCell>
                
                {/* Expert Fields */}
                <TableCell>
                  {row.expert_severity ? (
                    <Badge variant="outline" className={getSeverityColor(row.expert_severity)}>
                      {row.expert_severity}
                    </Badge>
                  ) : (
                    <span className="text-xs text-stone-300 italic">...</span>
                  )}
                </TableCell>
                <TableCell className="font-mono text-[11px] max-w-[150px] truncate" title={row.expert_vector || ""}>{row.expert_vector || <span className="text-xs text-stone-300 italic">...</span>}</TableCell>
                <TableCell className="font-mono text-xs">{row.expert_score ? row.expert_score.toFixed(1) : '-'}</TableCell>

                {/* Disposition */}
                <TableCell className="font-mono text-xs max-w-[150px] truncate" title={row.disposition_summary}>{row.disposition_summary || '-'}</TableCell>
                <TableCell className="font-mono text-xs max-w-[150px] truncate" title={row.rationale}>{row.rationale || '-'}</TableCell>
                <TableCell className="font-mono text-xs max-w-[150px] truncate" title={row.expert_justification || ""}>{row.expert_justification || <span className="text-xs text-stone-300 italic">...</span>}</TableCell>
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
              Override metrics for <span className="font-mono font-bold text-stone-800">{selectedVuln?.cve_id}</span>
            </SheetDescription>
          </SheetHeader>

          {/* UPDATED DRAWER CONTENT */}
          <div className="grid gap-6 py-4">
            
            <div className="p-4 bg-stone-50 rounded-lg border grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-stone-500 uppercase">Original Severity</Label>
                <div className="mt-1 font-medium">{selectedVuln?.original_severity}</div>
              </div>
              <div>
                <Label className="text-xs font-semibold text-stone-500 uppercase">Original Score</Label>
                <div className="mt-1 font-medium">{selectedVuln?.original_score.toFixed(1)}</div>
              </div>
               <div className="col-span-2">
                <Label className="text-xs font-semibold text-stone-500 uppercase">Original Vector</Label>
                <div className="mt-1 font-mono text-xs">{selectedVuln?.original_vector}</div>
              </div>
               <div className="col-span-2">
                <Label className="text-xs font-semibold text-stone-500 uppercase">Disposition / Rationale</Label>
                <div className="mt-1 text-sm text-stone-600">{selectedVuln?.disposition_summary}: {selectedVuln?.rationale}</div>
              </div>
            </div>

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
                <Input type="number" step="0.1" max="10" value={formScore} onChange={(e) => setFormScore(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                 <Label>Expert Vector</Label>
                 {/* --- THIS IS THE FIX --- */}
                 <Input placeholder="CVSS:3.1/AV:N/..." value={formVector} onChange={(e) => setFormVector(e.target.value)} />
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
            <Button onClick={handleSave} disabled={isSaving} className="bg-stone-900 hover:bg-stone-800">
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Assessment
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
