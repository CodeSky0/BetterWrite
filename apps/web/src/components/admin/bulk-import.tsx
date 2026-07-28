'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Loader2,
  Upload,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

interface ImportRecord {
  id: string;
  type: 'students' | 'teachers' | 'classes';
  fileName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  recordsProcessed: number;
  totalRecords: number;
  errors: number;
  timestamp: string;
}

interface BulkImportProps {
  onClose: () => void;
}

export function BulkImport({ onClose }: BulkImportProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'students' | 'teachers' | 'classes'>('students');
  const [isImporting, setIsImporting] = useState(false);
  const [importRecords, setImportRecords] = useState<ImportRecord[]>([]);

  const importTypes = [
    { id: 'students', label: 'Students', description: 'Import student accounts and enrollments' },
    { id: 'teachers', label: 'Teachers', description: 'Import teacher accounts and assignments' },
    { id: 'classes', label: 'Classes', description: 'Import class information and schedules' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImport = () => {
    if (!selectedFile) return;

    setIsImporting(true);
    const newRecord: ImportRecord = {
      id: Date.now().toString(),
      type: importType,
      fileName: selectedFile.name,
      status: 'processing',
      recordsProcessed: 0,
      totalRecords: 100, // Mock
      errors: 0,
      timestamp: new Date().toISOString(),
    };

    setImportRecords([newRecord]);

    // Simulate import progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setImportRecords((prev) =>
        prev.map((rec) => (rec.id === newRecord.id ? { ...rec, recordsProcessed: progress } : rec)),
      );

      if (progress >= 100) {
        clearInterval(interval);
        setImportRecords((prev) =>
          prev.map((rec) =>
            rec.id === newRecord.id ? { ...rec, status: 'completed', recordsProcessed: 100 } : rec,
          ),
        );
        setIsImporting(false);
      }
    }, 300);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-error" />;
      case 'processing':
        return <Loader2 className="w-4 h-4 text-accent animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-7" />;
    }
  };

  const downloadTemplate = () => {
    // In a real implementation, this would download a template file
    alert('Template download would be implemented here');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Bulk Import
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Import Type Selection */}
          <div>
            <span className="text-copy-14 font-medium text-neutral-10 mb-2 block">Import Type</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {importTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={importType === type.id ? 'default' : 'outline'}
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => setImportType(type.id as any)}
                  disabled={isImporting}
                >
                  <span className="font-medium">{type.label}</span>
                  <span className="text-copy-14 text-neutral-7 text-left">{type.description}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label
              htmlFor="file-upload"
              className="text-copy-14 font-medium text-neutral-10 mb-2 block"
            >
              Upload File
            </label>
            <div className="border-2 border-dashed border-neutral-3 rounded-lg p-8 text-center hover:border-accent transition-colors">
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileSelect}
                disabled={isImporting}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-neutral-7 mx-auto mb-2" />
                <p className="text-neutral-10 font-medium">
                  {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-copy-14 text-neutral-7 mt-1">CSV or Excel files only</p>
              </label>
            </div>
          </div>

          {/* Template Download */}
          <div className="flex items-center justify-between p-4 bg-neutral-1 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-neutral-7" />
              <div>
                <p className="text-neutral-10 font-medium">Download Template</p>
                <p className="text-copy-14 text-neutral-7">
                  Use the template to ensure correct format
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {/* Import Records */}
          {importRecords.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-neutral-10">Import History</h3>
              {importRecords.map((record) => (
                <div key={record.id} className="p-4 bg-neutral-1 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      <span className="font-medium text-neutral-10 capitalize">{record.type}</span>
                      <Badge variant="outline">{record.fileName}</Badge>
                    </div>
                    <span
                      className={`text-copy-14 ${
                        record.status === 'completed'
                          ? 'text-success'
                          : record.status === 'failed'
                            ? 'text-error'
                            : 'text-neutral-7'
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-3 rounded-full h-2 mb-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${(record.recordsProcessed / record.totalRecords) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-copy-14 text-neutral-7">
                    <span>
                      {record.recordsProcessed} / {record.totalRecords} records
                    </span>
                    {record.errors > 0 && (
                      <span className="text-error">{record.errors} errors</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Import Button */}
          <Button
            onClick={handleImport}
            disabled={!selectedFile || isImporting}
            className="w-full"
            size="lg"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Start Import
              </>
            )}
          </Button>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5" />
            <p className="text-copy-14 text-neutral-8">
              Import will add new records. Existing records with matching IDs will be updated.
              Please review your data before importing.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
