import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'

function App() {
  const [isLoading, setIsLoading] = useState(false)

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
      // FIX: In Tauri v2, 'selected' IS the path string (or null). It is not an object.
      if (selected) {
        const result: string = await invoke('ingest_csv', {
          filepath: selected, // FIX: Pass 'selected' directly, not 'selected.path'
        });
        
        // 3. Show success toast
        // FIX: Sonner takes (Title, Options). We removed 'title' and 'variant' keys from the options.
        toast.success('Ingestion Complete', {
          description: result,
        });
      }
    } catch (error) {
      // 4. Show error toast
      toast.error('Ingestion Failed', {
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