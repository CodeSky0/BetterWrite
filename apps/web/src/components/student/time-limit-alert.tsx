'use client';

import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface TimeLimitAlertProps {
  durationMs: number;
  timeLimitMinutes?: number;
  onWarning?: () => void;
}

export function TimeLimitAlert({ durationMs, timeLimitMinutes, onWarning }: TimeLimitAlertProps) {
  const [warningLevel, setWarningLevel] = useState<'none' | 'warning' | 'critical'>('none');
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!timeLimitMinutes) {
      setWarningLevel('none');
      setTimeRemaining(null);
      return;
    }

    const elapsedMinutes = durationMs / 60000;
    const remainingMinutes = timeLimitMinutes - elapsedMinutes;

    setTimeRemaining(Math.max(0, remainingMinutes));

    if (remainingMinutes <= 2) {
      setWarningLevel('critical');
      if (onWarning) onWarning();
    } else if (remainingMinutes <= 5) {
      setWarningLevel('warning');
    } else {
      setWarningLevel('none');
    }
  }, [durationMs, timeLimitMinutes, onWarning]);

  if (warningLevel === 'none' || timeRemaining === null) {
    return null;
  }

  const isCritical = warningLevel === 'critical';

  return (
    <Card className={isCritical ? 'border-error bg-error/5' : 'border-warning bg-warning/5'}>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          {isCritical ? (
            <AlertTriangle className="w-5 h-5 text-error animate-pulse" />
          ) : (
            <Clock className="w-5 h-5 text-warning" />
          )}
          <div>
            <p className={`font-medium ${isCritical ? 'text-error' : 'text-warning'}`}>
              {isCritical ? 'Time Critical!' : 'Time Warning'}
            </p>
            <p className="text-copy-14 text-neutral-8">
              {isCritical
                ? `Only ${Math.ceil(timeRemaining)} minute${timeRemaining !== 1 ? 's' : ''} remaining!`
                : `${Math.ceil(timeRemaining)} minute${timeRemaining !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
