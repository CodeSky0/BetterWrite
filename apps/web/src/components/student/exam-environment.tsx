'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, Lock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ExamEnvironmentProps {
  isActive: boolean;
  onExit: () => void;
}

export function ExamEnvironment({ isActive, onExit: _onExit }: ExamEnvironmentProps) {
  const [blurDetected, setBlurDetected] = useState(false);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const handleBlur = () => {
      setBlurDetected(true);
      setTabSwitchCount((prev) => prev + 1);
      setTimeout(() => setBlurDetected(false), 3000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive]);

  useEffect(() => {
    if (isActive) {
      try {
        document.documentElement.requestFullscreen();
      } catch (_e) {
        console.log('Fullscreen not supported');
      }
    }
  }, [isActive]);

  if (!isActive) return null;

  return (
    <>
      {/* Warning Overlay */}
      {blurDetected && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
              <h3 className="text-title-20 font-medium text-neutral-10 mb-2">
                Focus Lost Detected
              </h3>
              <p className="text-neutral-8 mb-4">
                Please stay focused on the exam. Tab switching or window focus loss has been
                detected. This may affect your exam integrity score.
              </p>
              <div className="flex items-center justify-center gap-2 text-copy-14 text-neutral-7 mb-4">
                <Lock className="w-4 h-4" />
                <span>Incidents: {tabSwitchCount}</span>
              </div>
              <Button onClick={() => setBlurDetected(false)} className="w-full">
                Return to Exam
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Exam Environment Indicator */}
      <div className="fixed top-4 right-4 z-40">
        <Card className="bg-accent text-white dark:text-neutral-1 border-accent">
          <CardContent className="py-2 px-4 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="text-copy-14 font-medium">Exam Mode Active</span>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
