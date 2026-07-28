'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ExamTimerProps {
  duration: number; // in minutes
  onTimeUp: () => void;
  onSubmit: () => void;
}

export function ExamTimer({ duration, onTimeUp, onSubmit: _onSubmit }: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(duration * 60);
  const [warningLevel, setWarningLevel] = useState<'normal' | 'warning' | 'critical'>('normal');

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimeUp]);

  useEffect(() => {
    const minutes = Math.floor(timeRemaining / 60);
    if (minutes <= 5) {
      setWarningLevel('critical');
    } else if (minutes <= 10) {
      setWarningLevel('warning');
    } else {
      setWarningLevel('normal');
    }
  }, [timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    switch (warningLevel) {
      case 'critical':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-neutral-10';
    }
  };

  const getBgColor = () => {
    switch (warningLevel) {
      case 'critical':
        return 'bg-error/10 border-error';
      case 'warning':
        return 'bg-warning/10 border-warning';
      default:
        return 'bg-neutral-1 border-neutral-3';
    }
  };

  return (
    <Card className={`border-2 ${getBgColor()}`}>
      <CardContent className="py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className={`w-5 h-5 ${getTimerColor()}`} />
            <span className={`text-title-24 font-medium ${getTimerColor()}`}>
              {formatTime(timeRemaining)}
            </span>
            {warningLevel !== 'normal' && (
              <AlertTriangle className={`w-4 h-4 ${getTimerColor()} animate-pulse`} />
            )}
          </div>
          <div className="flex items-center gap-2">
            {warningLevel === 'critical' && <Badge variant="destructive">Time Critical</Badge>}
            {warningLevel === 'warning' && (
              <Badge className="bg-warning text-white">Time Warning</Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
