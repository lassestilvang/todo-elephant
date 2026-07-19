"use client";

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, Keyboard, Menu, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const TOUR_STEPS = [
  {
    title: "Welcome to Todo Elephant! 🐘",
    content: "I'm Ellie, your AI assistant. Let me show you around this amazing productivity platform.",
    target: 'body',
  },
  {
    title: "Quick Create",
    content: "Press 'n' or click the floating button to quickly create tasks. Try saying 'Remind me to buy groceries tomorrow!'",
    target: 'quick-create',
  },
  {
    title: "Multiple Views",
    content: "Switch between Dashboard, Kanban, List, Calendar, and more using the view buttons or keyboard shortcuts 1-5.",
    target: 'views',
  },
  {
    title: "AI Assistant",
    content: "Ask Ellie anything! She can help with task creation, prioritization, scheduling, and wellbeing tips.",
    target: 'ai-assistant',
  },
  {
    title: "Social Network",
    content: "Share wins, tips, and challenges with the Herd community. Connect with other productivity enthusiasts!",
    target: 'social',
  },
  {
    title: "Offline Ready",
    content: "This app works offline! All changes sync when you're back online. Try disconnecting and creating a task.",
    target: 'offline',
  },
  {
    title: "You're Ready!",
    content: "Click anywhere or press 'Enter' to start being productive. Ellie is here to help whenever you need!",
    target: 'done',
  },
];

export function WelcomeTour({ isOpen, onClose }: WelcomeTourProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Auto-advance to next step
    if (currentStep < TOUR_STEPS.length - 1) {
      const timer = setTimeout(() => {
        if (currentStep < TOUR_STEPS.length - 1) {
          setCurrentStep(prev => prev + 1);
        }
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const finish = () => {
    localStorage.setItem('todo-elephant-tour-completed', 'true');
    onClose();
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-border animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-border transition-all"
          aria-label="Close tour"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="mb-6">
          <h3 className="text-xl font-bold mb-2">{step.title}</h3>
          <p className="text-muted-foreground leading-relaxed">{step.content}</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            {TOUR_STEPS.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentStep ? 'bg-accent w-6' : 'bg-muted/50'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-muted">
            {currentStep + 1} of {TOUR_STEPS.length}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>
          )}
          {currentStep < TOUR_STEPS.length - 1 ? (
            <Button onClick={nextStep}>
              Next
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={finish} className="flex-1">
              Get Started
              <Check className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Hook to manage tour state
export function useWelcomeTour() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('todo-elephant-tour-completed');
    if (!completed) {
      setIsOpen(true);
    }
  }, []);

  return { isOpen, setIsOpen };
}