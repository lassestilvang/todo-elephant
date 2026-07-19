"use client";

import React, { useState, useEffect } from 'react';

interface ElephantPersonality {
  id: string;
  name: string;
  archetype: 'mentor' | 'boss' | 'creative' | 'owl';
  colorTheme: string;
  workStyle: 'structured' | 'flexible' | 'innovative' | 'deep';
  voicePattern: string;
  learningCurve: 'steep' | 'gradual';
  elephantType: 'african' | 'asian' | 'mastodon' | 'woolly mammoth';
  personalityTraits: string[];
}

interface ElephantPersonalityDisplayProps {
  personality: ElephantPersonality;
  className?: string;
}

export default function ElephantPersonalityDisplay({ personality, className = "" }: ElephantPersonalityDisplayProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  if (!mounted) return null;

  const getArchetypeEmoji = (archetype: string) => {
    const emojis = {
      mentor: '🧓',
      boss: '💼',
      creative: '🌟',
      owl: '🦉'
    };
    return emojis[archetype as keyof typeof emojis] || '🐘';
  };

  const getElephantTypeIcon = (type: string) => {
    const icons = {
      african: '🐘',
      asian: '🐏',
      mastodon: '🦣',
      woolly: '🦣'
    };
    return icons[type as keyof typeof icons] || '🐘';
  };

  const getArchetypeName = (archetype: string) => {
    const names = {
      mentor: 'Mentor',
      boss: 'Boss',
      creative: 'Explorer',
      owl: 'Wisdom Keeper'
    };
    return names[archetype as keyof typeof names] || 'Elephant';
  };

  const getWorkStyleDescription = (style: string) => {
    const descriptions = {
      structured: 'Organized planner with clear priorities',
      flexible: 'Adaptable explorer of new paths',
      innovative: 'Creative pioneer always seeking new solutions',
      deep: 'Deep thinker mastering complex challenges'
    };
    return descriptions[style as keyof typeof descriptions] || descriptions.structured;
  };

  return (
    <div className={`bg-slate-800 rounded-xl p-6 border border-slate-700 transition-all duration-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
    style={{
      background: `linear-gradient(135deg, ${personality.colorTheme.includes('from') ? personality.colorTheme.split(' ')[1].replace('from-', '') : '#3b82f6'}, ${personality.colorTheme.includes('to') ? personality.colorTheme.split(' ')[2].replace('to-', '') : '#8b5cf6'})`,
      opacity: 0.9
    }}
    >
      <div className="flex items-center gap-4 mb-4">
        <div className="text-3xl">{getArchetypeEmoji(personality.archetype)}</div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{personality.name}</h3>
          <p className="text-sm text-white/80">
            {getElephantTypeIcon(personality.elephantType)} {personality.elephantType} {getArchetypeName(personality.archetype)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/70">Work Style</div>
          <div className="text-white font-medium text-xs">{getWorkStyleDescription(personality.workStyle)}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/70">Learning Curve</div>
          <div className="text-white font-medium text-xs capitalize">{personality.learningCurve}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/70">Voice Pattern</div>
          <div className="text-white font-medium text-xs">{personality.voicePattern}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-white/70">Personality Traits</div>
          <div className="text-white font-medium text-xs">{personality.personalityTraits.join(', ')}</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="text-xs text-white/60 italic">
          {getWisdomQuote(personality.archetype, personality.elephantType)}
        </div>
      </div>
    </div>
  );
}

function getWisdomQuote(archetype: string, type: string): string {
  const quotes = {
    mentor: {
      african: "In the herd, wisdom comes from sharing what you know and learning from others.",
      asian: "True strength comes from helping others find their way through the forest.",
      mastodon: "Even ancient elephants learn something new each season.",
      woolly: "Memories from ancient times guide us through today's challenges."
    },
    boss: {
      african: "A good leader protects the herd and guides it to safety.",
      asian: "Strength comes from within, but leadership means carrying others.",
      mastodon: "Great power means responsibility to those you lead.",
      woolly: "Leadership means knowing when to break old trails and make new ones."
    },
    creative: {
      african: "Curiosity leads us to discover paths never before seen.",
      asian: "Beauty in new perspectives helps us grow stronger.",
      mastodon: "Exploration brings wisdom to the entire herd.",
      woolly: "Ancient curiosity never fades, even with time."
    },
    owl: {
      african: "The silent watcher of the night knows what the day cannot show.",
      asian: "Deep wisdom comes from patience and observation.",
      mastodon: "Ancient knowledge guides the way forward.",
      woolly: "What we see is limited, but what we understand is boundless."
    }
  };
  return quotes[archetype as keyof typeof quotes]?.[type as keyof typeof quotes.mentor] || quotes.mentor.african;
}