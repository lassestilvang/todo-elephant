"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Star, Download, Heart, Share2, Clock, Tag } from 'lucide-react';
import Image from 'next/image';

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  estimatedMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  downloads: number;
  rating: number;
  author: string;
  authorAvatar?: string;
  image?: string;
  isPopular?: boolean;
  createdAt: Date;
}

const SAMPLE_TEMPLATES: TaskTemplate[] = [
  {
    id: '1',
    title: 'Content Creation Workflow',
    description: 'A comprehensive template for creating blog posts or marketing content from research to publication.',
    category: 'Content',
    tags: ['writing', 'marketing', 'creative'],
    estimatedMinutes: 120,
    difficulty: 'intermediate',
    downloads: 1247,
    rating: 4.9,
    author: 'Lasse Stilvang',
    isPopular: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: 'Product Launch Checklist',
    description: 'Complete checklist for launching a new product with all pre-launch, launch day, and post-launch tasks.',
    category: 'Business',
    tags: ['launch', 'marketing', 'product'],
    estimatedMinutes: 180,
    difficulty: 'advanced',
    downloads: 892,
    rating: 4.8,
    author: 'Alex Chen',
    isPopular: true,
    createdAt: new Date('2024-02-20'),
  },
  {
    id: '3',
    title: 'Weekly Review System',
    description: 'A systematic approach to reviewing your week, planning ahead, and adjusting priorities.',
    category: 'Productivity',
    tags: ['review', 'planning', 'weekly'],
    estimatedMinutes: 45,
    difficulty: 'beginner',
    downloads: 2156,
    rating: 4.95,
    author: 'Sam Wilson',
    isPopular: true,
    createdAt: new Date('2023-12-01'),
  },
  {
    id: '4',
    title: 'Research Project Framework',
    description: 'Structured approach to research projects with literature review, data collection, and analysis phases.',
    category: 'Research',
    tags: ['research', 'analysis', 'academic'],
    estimatedMinutes: 240,
    difficulty: 'advanced',
    downloads: 534,
    rating: 4.7,
    author: 'Dr. Maria Garcia',
    createdAt: new Date('2024-03-10'),
  },
];

export function TaskTemplatesMarketplace() {
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    setTemplates(SAMPLE_TEMPLATES);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || template.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const categories = ['all', ...new Set(templates.map(t => t.category))];
  const difficulties: Array<'all' | 'beginner' | 'intermediate' | 'advanced'> = ['all', 'beginner', 'intermediate', 'advanced'];

  const handleDownload = (templateId: string) => {
    // In real app, this would trigger template import
    console.log(`Downloading template ${templateId}`);
  };

  const handleFavorite = (templateId: string) => {
    // In real app, this would add to favorites
    console.log(`Favoriting template ${templateId}`);
  };

  const handleShare = (template: TaskTemplate) => {
    // In real app, this would open share dialog
    console.log(`Sharing template ${template.title}`);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-card text-sm"
          >
            <option value="all">All Categories</option>
            {categories.slice(1).map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-lg bg-card text-sm"
          >
            <option value="all">All Levels</option>
            {difficulties.slice(1).map(difficulty => (
              <option key={difficulty} value={difficulty}>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Badge variant={template.isPopular ? 'default' : 'outline'}>
                  {template.category}
                </Badge>
                <div className="flex gap-1">
                  <button onClick={() => handleFavorite(template.id)} className="p-1 rounded-full hover:bg-border">
                    <Heart className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <CardTitle className="mt-2">{template.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {template.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {template.estimatedMinutes}m
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    {template.rating}
                  </span>
                  <span>{template.downloads} downloads</span>
                </div>
                <span className="px-2 py-0.5 rounded text-xs bg-muted/50">
                  {template.difficulty}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleDownload(template.id)} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Use Template
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleShare(template)}>
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No templates found matching your criteria.</p>
          <Button variant="link" onClick={() => {
            setSearchTerm('');
            setSelectedCategory('all');
            setSelectedDifficulty('all');
          }}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}