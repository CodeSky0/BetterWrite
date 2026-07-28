'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, CheckCircle2, Clock, Download, Send, XCircle } from 'lucide-react';
import { useState } from 'react';

interface BulkOperation {
  id: string;
  type: 'publish' | 'close' | 'delete' | 'export' | 'remind';
  target: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

interface BulkOperationsProps {
  onClose: () => void;
}

export function BulkOperations({ onClose }: BulkOperationsProps) {
  const [operations, setOperations] = useState<BulkOperation[]>([]);
  const [_selectedAction, setSelectedAction] = useState<string>('');

  const operationTypes = [
    {
      id: 'publish',
      label: 'Publish Tasks',
      icon: Send,
      description: 'Publish selected tasks to students',
    },
    { id: 'close', label: 'Close Tasks', icon: Clock, description: 'Close selected tasks' },
    { id: 'export', label: 'Export Results', icon: Download, description: 'Export essay results' },
    {
      id: 'remind',
      label: 'Send Reminders',
      icon: AlertTriangle,
      description: 'Remind students about pending tasks',
    },
  ];

  const handleStartOperation = (type: string) => {
    setSelectedAction(type);
    // Simulate bulk operation
    const newOp: BulkOperation = {
      id: Date.now().toString(),
      type: type as any,
      target: 'Selected items',
      status: 'processing',
      progress: 0,
    };
    setOperations([newOp]);

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setOperations((prev) => prev.map((op) => (op.id === newOp.id ? { ...op, progress } : op)));

      if (progress >= 100) {
        clearInterval(interval);
        setOperations((prev) =>
          prev.map((op) =>
            op.id === newOp.id ? { ...op, status: 'completed', progress: 100 } : op,
          ),
        );
      }
    }, 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-error" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-accent animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-neutral-7" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success';
      case 'failed':
        return 'text-error';
      case 'processing':
        return 'text-accent';
      default:
        return 'text-neutral-7';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Bulk Operations</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Operation Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {operationTypes.map((op) => {
              const Icon = op.icon;
              return (
                <Button
                  key={op.id}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => handleStartOperation(op.id)}
                  disabled={operations.some((o) => o.status === 'processing')}
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{op.label}</span>
                  </div>
                  <span className="text-copy-14 text-neutral-7 text-left">{op.description}</span>
                </Button>
              );
            })}
          </div>

          {/* Operation Progress */}
          {operations.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-neutral-10">Operation Progress</h3>
              {operations.map((op) => (
                <div key={op.id} className="p-4 bg-neutral-1 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(op.status)}
                      <span className="font-medium text-neutral-10 capitalize">{op.type}</span>
                    </div>
                    <span className={`text-copy-14 ${getStatusColor(op.status)}`}>{op.status}</span>
                  </div>
                  <div className="w-full bg-neutral-3 rounded-full h-2 mb-2">
                    <div
                      className="bg-accent h-2 rounded-full transition-all"
                      style={{ width: `${op.progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-copy-14 text-neutral-7">
                    <span>{op.target}</span>
                    <span>{op.progress}%</span>
                  </div>
                  {op.error && <p className="text-error text-copy-14 mt-2">{op.error}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Selection Info */}
          <div className="p-4 bg-neutral-1 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Checkbox />
              <span className="text-copy-14 text-neutral-10">Select all items</span>
            </div>
            <p className="text-copy-14 text-neutral-7">
              Select items from the list above to perform bulk operations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
