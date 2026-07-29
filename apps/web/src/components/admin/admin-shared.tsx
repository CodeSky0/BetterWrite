'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Shared admin page status display: error, loading, and empty states
 */
export function AdminStatusBlock({
  error,
  loading,
  empty,
  emptyText = '暂无数据',
}: {
  error?: string | null;
  loading?: boolean;
  empty?: boolean;
  emptyText?: string;
}) {
  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-copy-14 text-error">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <p className="text-copy-14 text-neutral-8">加载中...</p>;
  }

  if (empty) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-copy-14 text-neutral-8">{emptyText}</p>
        </CardContent>
      </Card>
    );
  }

  return null;
}

/**
 * Shared admin modal overlay wrapper
 */
export function AdminModal({
  open,
  title,
  onClose: _onClose,
  children,
  className = '',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <Card className={`w-full max-w-lg max-h-[90vh] overflow-y-auto ${className}`}>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-title-20 font-medium text-neutral-10">{title}</h2>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Shared admin table wrapper with overflow handling
 */
export function AdminTableWrapper({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-copy-14">{children}</table>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Shared admin table header cell styles
 */
export function Th({
  children,
  align = 'left',
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
}) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return <th className={`${alignClass} px-4 py-3 font-medium`}>{children}</th>;
}

/**
 * Shared admin table action buttons (edit + delete)
 */
export function AdminActions({
  onEdit,
  onDelete,
  editLabel = '编辑',
  deleteLabel = '删除',
}: {
  onEdit: () => void;
  onDelete: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label={editLabel}>
        <Pencil className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label={deleteLabel}>
        <Trash2 className="w-4 h-4 text-error" />
      </Button>
    </div>
  );
}
