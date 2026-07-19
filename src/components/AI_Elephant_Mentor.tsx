"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, MessageCircle, X, Send, Sparkles, Brain, Heart, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AI_Elephant_MentorProps {
  tasks: any[];
  focusSessions?: any[];
  className?: string;
}

interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: MentorSuggestion[];
}

interface MentorSuggestion {
  type: 'task' | 'insight' | 'tip' | 'celebration';
  content: string;
  action?: string;
}

const ELEPHANT_PERSONALITY = {
  name: 'Ellie',
  personality: 'wise, patient, encouraging',
  tone: 'warm and supportive with gentle humor',
  emoji: '🐘'
};

export function AI_Elephant_Mentor({ tasks, focusSessions = [], className }: AI_Elephant_MentorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      addMentorMessage(
        `Hi there! I'm Ellie, your AI Elephant Mentor 🐘\n\nI'm here to help you manage your tasks with wisdom and care. Just like an elephant never forgets, I'll help you build habits that last.\n\nWhat would you like to focus on today?`,
        'insight'
      );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMentorMessage = (content: string, type: 'task' | 'insight' | 'tip' | 'celebration', suggestions?: MentorSuggestion[]) => {
    const newMessage: MentorMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
      suggestions
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const processUserMessage = async (userInput: string) => {
    const userMessage: MentorMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response = generateMentorResponse(userInput, tasks, focusSessions);
    addMentorMessage(response.content, response.type, response.suggestions);
    setIsTyping(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      processUserMessage(inputValue.trim());
    }
  };

  const suggestions = [
    { label: 'What should I focus on?', emoji: '🎯', action: 'focus' },
    { label: 'Show my progress', emoji: '📊', action: 'progress' },
    { label: 'Celebrate wins', emoji: '🎉', action: 'celebrate' },
    { label: 'Need a break?', emoji: '☕', action: 'break' }
  ];

  const handleSuggestionClick = (action: string) => {
    switch (action) {
      case 'focus':
        processUserMessage('What should I focus on today?');
        break;
      case 'progress':
        processUserMessage('Show me my progress');
        break;
      case 'celebrate':
        processUserMessage('Celebrate my wins');
        break;
      case 'break':
        processUserMessage('I need a break');
        break;
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500",
          "text-white shadow-lg hover:scale-105 transition-all flex items-center justify-center",
          "animate-pulse hover:animate-none"
        )}
        aria-label="Open AI Elephant Mentor"
      >
        <Bot className="w-8 h-8" />
      </button>

      {/* Chat Container */}
      <div className={cn(
        "fixed bottom-20 right-6 z-40 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl",
        "flex flex-col h-96 sm:h-[500px] transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-2xl">{ELEPHANT_PERSONALITY.emoji}</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Ellie, your AI Mentor</h3>
              <p className="text-xs text-muted-foreground">Online & Ready to Help</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-full hover:bg-border transition-colors"
            aria-label="Close mentor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                message.role === 'user'
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-muted text-foreground"
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>

              {/* Suggestions */}
              {message.suggestions && (
                <div className="mt-3 space-y-2">
                  {message.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-background/50"
                    >
                      <span className="text-lg">{getSuggestionEmoji(suggestion.type)}</span>
                      <span className="text-xs">{suggestion.content}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex items-center gap-2 p-3">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
              <span className="text-xs text-muted-foreground">Ellie is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {!isOpen && (
          <div className="p-3 border-t border-border">
            <div className="flex gap-2 overflow-x-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.action}
                  onClick={() => handleSuggestionClick(suggestion.action)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-muted-foreground text-xs hover:bg-border transition-colors whitespace-nowrap"
                >
                  <span className="text-sm">{suggestion.emoji}</span>
                  <span>{suggestion.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        {isOpen && (
          <form onSubmit={handleSubmit} className="p-3 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Ellie anything..."
                className="flex-1 px-3 py-2 rounded-full bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                maxLength={200}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center hover:opacity-90 transition-all disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}

function getSuggestionEmoji(type: string): string {
  switch (type) {
    case 'task': return '📋';
    case 'insight': return '💡';
    case 'tip': return '🔧';
    case 'celebration': return '🎉';
    default: return '✨';
  }
}

function generateMentorResponse(
  userInput: string,
  tasks: any[],
  focusSessions: any[]
): { content: string; type: 'task' | 'insight' | 'tip' | 'celebration'; suggestions?: MentorSuggestion[] } {
  const lowerInput = userInput.toLowerCase();

  // Focus questions
  if (lowerInput.includes('focus') || lowerInput.includes('what') && lowerInput.includes('today')) {
    const incompleteTasks = tasks.filter(t => t.status !== 'completed');
    const highPriority = incompleteTasks.filter(t => t.priority === 'high');

    let content = `Let me help you focus, friend! 🐘\n\n`;

    if (highPriority.length > 0) {
      content += `I see ${highPriority.length} high-priority tasks. Let's tackle the most important one first:\n\n`;
      const topTask = highPriority[0];
      content += `🎯 **${topTask.title}**\n`;
      if (topTask.dueDate) {
        content += `   Due: ${new Date(topTask.dueDate).toLocaleDateString()}\n`;
      }
    } else if (incompleteTasks.length > 0) {
      content += `You have ${incompleteTasks.length} incomplete tasks. Here's what I suggest:\n\n`;
      incompleteTasks.slice(0, 3).forEach((task, i) => {
        content += `${i + 1}. ${task.title}\n`;
      });
    } else {
      content += `🎉 You're all caught up! What would you like to work on next?`;
    }

    return {
      content,
      type: 'task',
      suggestions: [
        { type: 'task', content: 'Create new task', action: 'create' },
        { type: 'tip', content: 'Review completed tasks', action: 'review' }
      ]
    };
  }

  // Progress questions
  if (lowerInput.includes('progress') || lowerInput.includes('how am i')) {
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

    return {
      content: `📊 Your Progress Report:\n\n✅ Completed: ${completedTasks.length} tasks\n📋 Total: ${totalTasks} tasks\n📈 Completion Rate: ${completionRate}%\n\n`,
      type: 'insight',
      suggestions: [
        { type: 'insight', content: 'View detailed stats' },
        { type: 'celebration', content: 'Celebrate current streak' }
      ]
    };
  }

  // Celebration
  if (lowerInput.includes('celebrate') || lowerInput.includes('win')) {
    const completedToday = tasks.filter(t =>
      t.status === 'completed' &&
      t.completedAt &&
      new Date(t.completedAt).toDateString() === new Date().toDateString()
    );

    return {
      content: `🎉 What a wonderful day for accomplishments! 🎉\n\n`,
      type: 'celebration',
      suggestions: [
        { type: 'celebration', content: 'Share win with Herd' },
        { type: 'tip', content: 'Review what went well' }
      ]
    };
  }

  // Break time
  if (lowerInput.includes('break') || lowerInput.includes('tired')) {
    const completedSessions = focusSessions?.filter(s => s.completed) || [];
    const averageFocus = completedSessions.length > 0
      ? completedSessions.reduce((sum: number, s: any) => sum + (s.duration || 25), 0) / completedSessions.length
      : 25;

    return {
      content: `☕ Time for a well-deserved break, friend!\n\n`,
      type: 'tip',
      suggestions: [
        { type: 'tip', content: 'Try 5-minute meditation' },
        { type: 'tip', content: 'Take a short walk' }
      ]
    };
  }

  // Default helpful response
  return {
    content: `🐘 I'm here to help! Try asking me about:\n\n• Your daily focus\n• Task progress\n• Celebrations\n• Breaks\n• Tips\n\nJust type what's on your mind!`,
    type: 'tip'
  };
}