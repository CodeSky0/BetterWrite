'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { BookOpen, Clock, FileText, Search, Star } from 'lucide-react';
import { useState } from 'react';

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  topicType: string;
  requirements: string;
  keyPoints: string[];
  wordLimitMin: number;
  wordLimitMax: number;
  timeLimitMinutes: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isOfficial: boolean;
  usageCount: number;
  lastUsed: string;
}

interface TaskTemplateSelectorProps {
  onSelect: (template: TaskTemplate) => void;
  onClose: () => void;
}

const MOCK_TEMPLATES: TaskTemplate[] = [
  {
    id: '1',
    title: 'My Favorite Season',
    description: 'Write about your favorite season and explain why you like it.',
    topicType: 'narration',
    requirements:
      'Write a narrative essay about your favorite season. Include specific details about the weather, activities, and reasons why it is your favorite.',
    keyPoints: ['Describe the weather', 'Mention activities', 'Explain reasons'],
    wordLimitMin: 80,
    wordLimitMax: 125,
    timeLimitMinutes: 15,
    category: 'Daily Life',
    difficulty: 'easy',
    isOfficial: false,
    usageCount: 45,
    lastUsed: '2024-01-15',
  },
  {
    id: '2',
    title: 'A Memorable Trip',
    description: 'Describe a trip you will never forget.',
    topicType: 'narration',
    requirements:
      'Write about a memorable trip you took. Describe where you went, what you did, and why this trip was special to you.',
    keyPoints: ['Destination', 'Activities', 'Special moments'],
    wordLimitMin: 80,
    wordLimitMax: 125,
    timeLimitMinutes: 15,
    category: 'Travel',
    difficulty: 'medium',
    isOfficial: false,
    usageCount: 32,
    lastUsed: '2024-01-10',
  },
  {
    id: '3',
    title: 'Environmental Protection',
    description: 'Discuss the importance of protecting the environment.',
    topicType: 'argumentation',
    requirements:
      'Write an argumentative essay about environmental protection. Present your views and provide supporting evidence.',
    keyPoints: ['Current problems', 'Solutions', 'Personal actions'],
    wordLimitMin: 100,
    wordLimitMax: 150,
    timeLimitMinutes: 20,
    category: 'Social Issues',
    difficulty: 'hard',
    isOfficial: true,
    usageCount: 89,
    lastUsed: '2024-01-18',
  },
  {
    id: '4',
    title: 'My Best Friend',
    description: 'Write about your best friend and why they are special to you.',
    topicType: 'narration',
    requirements:
      'Describe your best friend. Include details about their personality, things you do together, and why they are important to you.',
    keyPoints: ['Personality', 'Shared activities', 'Friendship value'],
    wordLimitMin: 80,
    wordLimitMax: 125,
    timeLimitMinutes: 15,
    category: 'Relationships',
    difficulty: 'easy',
    isOfficial: false,
    usageCount: 67,
    lastUsed: '2024-01-12',
  },
];

export function TaskTemplateSelector({ onSelect, onClose }: TaskTemplateSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  const categories = ['all', 'Daily Life', 'Travel', 'Social Issues', 'Relationships', 'School'];
  const difficulties = ['all', 'easy', 'medium', 'hard'];

  const filteredTemplates = MOCK_TEMPLATES.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-success text-white';
      case 'medium':
        return 'bg-warning text-white';
      case 'hard':
        return 'bg-error text-white';
      default:
        return 'bg-neutral-5';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Task Templates
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-7" />
                <Input
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-neutral-3 rounded-md bg-neutral-1 text-neutral-10"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-neutral-3 rounded-md bg-neutral-1 text-neutral-10"
              >
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff === 'all' ? 'All Difficulties' : diff}
                  </option>
                ))}
              </select>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:border-accent transition-colors"
                  onClick={() => onSelect(template)}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-neutral-10">{template.title}</h3>
                            {template.isOfficial && <Badge variant="default">Official</Badge>}
                          </div>
                          <p className="text-copy-14 text-neutral-8">{template.description}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getDifficultyColor(template.difficulty)}>
                          {template.difficulty}
                        </Badge>
                        <Badge variant="outline">{template.category}</Badge>
                        <Badge variant="outline">{template.topicType}</Badge>
                      </div>

                      <div className="flex items-center gap-4 text-copy-14 text-neutral-7">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {template.timeLimitMinutes} min
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {template.wordLimitMin}-{template.wordLimitMax} words
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5" />
                          {template.usageCount} uses
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-neutral-5 mx-auto mb-3" />
                <p className="text-neutral-8">No templates found matching your criteria.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
