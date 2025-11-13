import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'

function App() {
  const [isLoading, setIsLoading] = useState(false)
  //const { toast } = useToast() // Please note we are using sonner instead

  const handleFileIngest = async () => {
    setIsLoading(true)
    try {
      // 1. Open the native file dialog (US1.1)
      const selected = await open({
        multiple: false,
        title: "Import Vulnerability Scan",
        filters: [{ name: 'CSV File', extensions: ['csv'] }]
      });

      // 2. If user selected a file, call the Rust backend
      if (selected && typeof selected.path === 'string') {
        const result: string = await invoke('ingest_csv', {
          filepath: selected.path,
        });
        
        // 3. Show success toast
        toast({
          title: 'Ingestion Complete',
          description: result,
        });
      }
    } catch (error) {
      // 4. Show error toast
      toast({
        variant: 'destructive',
        title: 'Ingestion Failed',
        description: String(error),
      });
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 flex justify-center">
      <div className="w-full max-w-md">
        <Button
          onClick={handleFileIngest}
          disabled={isLoading}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {isLoading ? 'Ingesting...' : 'Import CSV Report'}
        </Button>
      </div>
      <Toaster />
    </div>
  );
}

export default App