'use client';

import { MaterialPanel } from '@/components/student/material-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { EducationStageValue, TopicTypeValue } from '@betterwrite/shared';
import { AlertCircle, CheckCircle, Maximize2, Mic, MicOff, Minimize2, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface WritingEditorProps {
  value: string;
  onChange: (value: string) => void;
  wordCount: number;
  wordLimitMin: number;
  wordLimitMax: number;
  isDistractionFree?: boolean;
  onToggleDistractionFree?: () => void;
  stage?: EducationStageValue;
  topicType?: TopicTypeValue;
}

interface GrammarError {
  type: string;
  original: string;
  corrected: string;
  explanation: string;
  position: { start: number; end: number };
}

export function WritingEditor({
  value,
  onChange,
  wordCount,
  wordLimitMin,
  wordLimitMax,
  isDistractionFree = false,
  onToggleDistractionFree,
  stage,
  topicType,
}: WritingEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [grammarErrors, setGrammarErrors] = useState<GrammarError[]>([]);
  const [showGrammar, setShowGrammar] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [wordAlert, setWordAlert] = useState<'low' | 'high' | 'ok' | null>(null);

  // Real-time grammar checking (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value.length > 50) {
        // Simulate local grammar checking
        // In production, this would use the local-filter utilities
        const errors: GrammarError[] = [];

        // Check for common spelling errors
        const commonErrors = [
          { wrong: 'teh', correct: 'the' },
          { wrong: 'adn', correct: 'and' },
          { wrong: 'thier', correct: 'their' },
          { wrong: 'recieve', correct: 'receive' },
        ];

        const lowerValue = value.toLowerCase();
        for (const { wrong, correct } of commonErrors) {
          const index = lowerValue.indexOf(wrong);
          if (index !== -1) {
            errors.push({
              type: 'spelling',
              original: value.substring(index, index + wrong.length),
              corrected: correct,
              explanation: `Correct spelling: "${correct}"`,
              position: { start: index, end: index + wrong.length },
            });
          }
        }

        setGrammarErrors(errors);
      } else {
        setGrammarErrors([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [value]);

  // Word count alerts
  useEffect(() => {
    if (wordCount < wordLimitMin) {
      setWordAlert('low');
    } else if (wordCount > wordLimitMax) {
      setWordAlert('high');
    } else {
      setWordAlert('ok');
    }
  }, [wordCount, wordLimitMin, wordLimitMax]);

  // Voice-to-text using Web Speech API
  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support voice input');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();

    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let _interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += `${transcript} `;
        } else {
          _interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        onChange(value + finalTranscript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [value, onChange]);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const applyCorrection = (error: GrammarError) => {
    const before = value.substring(0, error.position.start);
    const after = value.substring(error.position.end);
    onChange(before + error.corrected + after);

    // Remove this error from the list
    setGrammarErrors(grammarErrors.filter((e) => e !== error));
  };

  const insertMaterial = useCallback(
    (content: string) => {
      const textarea = textareaRef.current;
      const start = textarea?.selectionStart ?? value.length;
      const end = textarea?.selectionEnd ?? value.length;
      const before = value.substring(0, start);
      const after = value.substring(end);
      const separator =
        before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n') ? ' ' : '';
      const trailing =
        after.length > 0 && !after.startsWith(' ') && !after.startsWith('\n') ? ' ' : '';
      const inserted = before + separator + content + trailing + after;
      onChange(inserted);
      requestAnimationFrame(() => {
        if (!textarea) return;
        const newCursor = start + separator.length + content.length + trailing.length;
        textarea.focus();
        textarea.setSelectionRange(newCursor, newCursor);
      });
    },
    [value, onChange],
  );

  if (isDistractionFree) {
    return (
      <div className="fixed inset-0 bg-paper z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              {wordCount} / {wordLimitMin}-{wordLimitMax} words
            </Badge>
            {wordAlert === 'low' && <Badge variant="destructive">Too short</Badge>}
            {wordAlert === 'high' && <Badge variant="destructive">Too long</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={isListening ? stopListening : startListening}
              title={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleDistractionFree}
              title="Exit distraction-free mode"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing your essay..."
          className="flex-1 w-full p-8 text-copy-18 leading-relaxed text-neutral-10 placeholder:text-neutral-7 focus:outline-none resize-none bg-paper"
          spellCheck={false}
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
      <div className="xl:col-span-2 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {wordAlert === 'ok' && (
                  <Badge variant="default" className="bg-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Word count OK
                  </Badge>
                )}
                {wordAlert === 'low' && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Too short ({wordCount}/{wordLimitMin})
                  </Badge>
                )}
                {wordAlert === 'high' && (
                  <Badge variant="destructive">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Too long ({wordCount}/{wordLimitMax})
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGrammar(!showGrammar)}
                  title={showGrammar ? 'Hide grammar check' : 'Show grammar check'}
                >
                  {showGrammar ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  title={isListening ? 'Stop voice input' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleDistractionFree}
                  title="Distraction-free mode"
                >
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="在此输入你的英语作文..."
              className="w-full min-h-[360px] resize-y rounded-md ring-1 ring-border bg-paper p-4 text-copy-16 leading-relaxed text-neutral-10 placeholder:text-neutral-7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-fast ease-yohaku"
              spellCheck={false}
            />
          </CardContent>
        </Card>

        {showGrammar && grammarErrors.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 text-warning" />
                <span className="font-medium text-neutral-10">
                  Grammar & Spelling Suggestions ({grammarErrors.length})
                </span>
              </div>
              <div className="space-y-2">
                {grammarErrors.map((error, index) => (
                  <div
                    key={`${error.original}-${error.position.start}-${index}`}
                    className="flex items-start gap-3 p-3 rounded-md bg-neutral-1 border border-neutral-3"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-error font-medium">{error.original}</span>
                        <span className="text-neutral-7">→</span>
                        <span className="text-success font-medium">{error.corrected}</span>
                      </div>
                      <p className="text-copy-14 text-neutral-8">{error.explanation}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => applyCorrection(error)}>
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="xl:col-span-1">
        <MaterialPanel stage={stage} topicType={topicType} onInsert={insertMaterial} />
      </div>
    </div>
  );
}
