"use client";

import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  IconFileUpload, 
  IconFileSpreadsheet, 
  IconCheck, 
  IconAlertTriangle,
  IconX,
  IconSearch,
  IconCloudUpload
} from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImportData {
  nim: string;
  name: string;
  type: string;
  status: 'valid' | 'duplicate' | 'invalid';
}

export default function BulkImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const mockImportData: ImportData[] = [
    { nim: '21010123', name: 'Ahmad Fauzi', type: 'Surat Magang', status: 'duplicate' },
    { nim: '21010155', name: 'Siti Aminah', type: 'Aktif Kuliah', status: 'valid' },
    { nim: '21010188', name: 'Budi Santoso', type: 'Penelitian', status: 'valid' },
    { nim: 'ABC-123', name: 'Unknown User', type: 'Seminar', status: 'invalid' },
    { nim: '21010210', name: 'Lia Monica', type: 'Aktif Kuliah', status: 'valid' },
  ];

  const handleUpload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsUploaded(true);
      toast.success("File uploaded and parsed successfully");
    }, 2000);
  };

  const handleImport = () => {
    toast.success("Importing 3 new records...");
    setTimeout(() => {
      setIsUploaded(false);
      toast.info("Import process completed");
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Bulk Data Import</h2>
        <p className="text-slate-500">Upload CSV or Excel files to process multiple letter requests at once.</p>
      </div>

      {!isUploaded ? (
        <Card className={cn(
          "border-2 border-dashed transition-all duration-300",
          isDragging ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" : "border-slate-200 dark:border-slate-800"
        )}>
          <CardContent className="flex flex-col items-center justify-center p-16 space-y-6 text-center">
            <div className="h-16 w-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-full flex items-center justify-center">
              <IconCloudUpload size={32} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Drop your file here</h3>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                Support .csv, .xls, .xlsx files. 
                Download the <a href="#" className="text-indigo-600 font-medium underline">import template</a>.
              </p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline">Browse Files</Button>
              <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleUpload} disabled={isLoading}>
                {isLoading ? "Processing..." : "Select & Upload"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Preview Import Data</CardTitle>
                <CardDescription>We found 5 records in your file. Review validation status before importing.</CardDescription>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setIsUploaded(false)}>Cancel</Button>
                <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleImport}>Start Import</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="rounded-lg border p-3 flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <IconCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Valid Records</p>
                    <p className="text-xl font-bold">3</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3 flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <IconAlertTriangle size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Duplicates</p>
                    <p className="text-xl font-bold">1</p>
                  </div>
                </div>
                <div className="rounded-lg border p-3 flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                    <IconX size={16} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Invalid</p>
                    <p className="text-xl font-bold">1</p>
                  </div>
                </div>
              </div>

              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900 border-b">
                    <tr>
                      <th className="h-10 px-4 text-left font-medium text-slate-500">NIM</th>
                      <th className="h-10 px-4 text-left font-medium text-slate-500">Name</th>
                      <th className="h-10 px-4 text-left font-medium text-slate-500">Letter Type</th>
                      <th className="h-10 px-4 text-left font-medium text-slate-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {mockImportData.map((row, i) => (
                      <tr key={i} className={cn(
                        row.status === 'duplicate' && "bg-amber-50/50 dark:bg-amber-900/10",
                        row.status === 'invalid' && "bg-rose-50/50 dark:bg-rose-900/10"
                      )}>
                        <td className="p-4 font-medium">{row.nim}</td>
                        <td className="p-4">{row.name}</td>
                        <td className="p-4">{row.type}</td>
                        <td className="p-4">
                          {row.status === 'valid' && (
                            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-100">Valid</Badge>
                          )}
                          {row.status === 'duplicate' && (
                            <Badge variant="outline" className="text-amber-600 bg-amber-50 border-amber-100">Duplicate</Badge>
                          )}
                          {row.status === 'invalid' && (
                            <Badge variant="outline" className="text-rose-600 bg-rose-50 border-rose-100">Invalid</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Import History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded bg-slate-100 text-slate-600 dark:bg-slate-800">
                    <IconFileSpreadsheet size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Batch_Import_Mar_{15+i}.xlsx</p>
                    <p className="text-xs text-slate-500">Processed on Mar {15+i}, 2024 • 24 records</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500">Success</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
