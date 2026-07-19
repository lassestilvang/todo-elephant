"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ElephantLogo } from '@/src/components/ElephantLogo';
import { User, Brain, Heart, Zap, Leaf, Wind, Camera, MessageSquare } from 'lucide-react';

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

const archetypes = [
  {
    id: 'mentor',
    name: 'Ellie the Mentor',
    emoji: '🧓',
    description: 'Wise and patient, like an elephant who shares knowledge with the herd',
    workStyle: 'structured',
    color: 'from-amber-400 to-orange-500',
    traits: ['teaching', 'patient', 'experienced', 'supportive']
  },
  {
    id: 'boss',
    name: 'Brandon the Boss',
    emoji: '💼',
    description: 'Decisive and driven, leading the herd to success',
    workStyle: 'structured',
    color: 'from-red-400 to-pink-500',
    traits: ['decisive', 'goal-oriented', 'competitive', 'efficient']
  },
  {
    id: 'creative',
    name: 'Luna the Explorer',
    emoji: '🌟',
    description: 'Innovative and curious, exploring new possibilities',
    workStyle: 'innovative',
    color: 'from-purple-400 to-indigo-500',
    traits: ['creative', 'curious', 'adaptable', 'visionary']
  },
  {
    id: 'owl',
    name: 'Sam the Night Owl',
    emoji: '🦉',
    description: 'Deep-thinking and insightful, wise in the night',
    workStyle: 'deep',
    color: 'from-green-400 to-teal-500',
    traits: ['thoughtful', 'analytical', 'wise', 'patient']
  }
];

const elephantTypes = [
  { id: 'african', name: 'African Forest Elephant', size: 'large', personality: 'social' },
  { id: 'asian', name: 'Asian Forest Elephant', size: 'medium', personality: 'gentle' },
  { id: 'mastodon', name: 'Mastodon', size: 'massive', personality: 'powerful' },
  { id: 'woolly', name: 'Woolly Mammoth', size: 'ancient', personality: 'ancient' }
];

export default function ElephantPersonalityTest() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedArchetype, setSelectedArchetype] = useState<string>('');
  const [selectedElephantType, setSelectedElephantType] = useState<string>('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [favoriteFood, setFavoriteFood] = useState('');
  const [personality, setPersonality] = useState<ElephantPersonality | null>(null);

  const calculatePersonality = () => {
    const archetype = archetypes.find(a => a.id === selectedArchetype);
    const elephant = elephantTypes.find(e => e.id === selectedElephantType);

    if (!archetype || !elephant) return;

    const newPersonality: ElephantPersonality = {
      id: Math.random().toString(36).substr(2, 9),
      name: name || `Elephant ${Math.floor(Math.random() * 100)}`,
      archetype: archetype.id as any,
      colorTheme: archetype.color,
      workStyle: archetype.workStyle as any,
      voicePattern: `${archetype.name} voice pattern: ${['deep resonant', 'clear sharp', 'melodic', 'wise'].find((_, i) => i === Math.floor(Math.random() * 4)}`,
      learningCurve: Math.random() > 0.5 ? 'steep' : 'gradual',
      elephantType: elephant.id as any,
      personalityTraits: archetype.traits
    };

    setPersonality(newPersonality);
    localStorage.setItem('elephantPersonality', JSON.stringify(newPersonality));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedArchetype) return;
      setStep(2);
    } else if (step === 2) {
      if (!selectedElephantType) return;
      setStep(3);
    } else {
      if (!name || !birthDate || !favoriteFood) return;
      calculatePersonality();
      setStep(4);
    }
  };

  const handleStartWithPersonality = () => {
    const saved = localStorage.getItem('elephantPersonality');
    if (saved) {
      router.push('/');
    } else {
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <ElephantLogo size={64} mood="happy" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Elephant Personality Test</h1>
          <p className="text-gray-400">Discover which elephant herd member you are!</p>
        </div>

        {step < 4 ? (
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Choose Your Herd Role</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {archetypes.map((archetype) => (
                    <button
                      key={archetype.id}
                      onClick={() => setSelectedArchetype(archetype.id)}
                      className={`p-6 rounded-xl border-2 transition-all ${selectedArchetype === archetype.id
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                        }`}
                    >
                      <div className="text-3xl mb-3">{archetype.emoji}</div>
                      <h3 className="text-lg font-semibold text-white mb-2">{archetype.name}</h3>
                      <p className="text-gray-400 text-sm">{archetype.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Choose Your Elephant Species</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {elephantTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setSelectedElephantType(type.id)}
                      className={`p-6 rounded-xl border-2 transition-all ${selectedElephantType === type.id
                          ? 'border-green-500 bg-green-500/10'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                        }`}
                    >
                      <h3 className="text-lg font-semibold text-white mb-2">{type.name}</h3>
                      <div className="text-sm text-gray-400">
                        <div>Size: {type.size}</div>
                        <div>Personality: {type.personality}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">Tell Us About Your Elephant</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Your Elephant's Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
                      placeholder="Enter your elephant's name..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Birth Date</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Favorite Food</label>
                    <input
                      type="text"
                      value={favoriteFood}
                      onChange={(e) => setFavoriteFood(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
                      placeholder="What does your elephant love to eat?"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                >
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={(step === 1 && !selectedArchetype) ||
                          (step === 2 && !selectedElephantType) ||
                          (step === 3 && (!name || !birthDate || !favoriteFood))}
                className="ml-auto px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
            <div className="text-center">
              <div className="text-6xl mb-4">{archetypes.find(a => a.id === personality?.archetype)?.emoji}</div>
              <h2 className="text-3xl font-bold text-white mb-2">{personality?.name} the {archetypes.find(a => a.id === personality?.archetype)?.name}</h2>
              <p className="text-xl text-purple-400 mb-6">{elephantTypes.find(e => e.id === personality?.elephantType)?.name}</p>

              <div className="bg-slate-700 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-4">Your Elephant Characteristics:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Work Style:</span>
                    <span className="text-white ml-2">{personality?.workStyle}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Voice Pattern:</span>
                    <span className="text-white ml-2">{personality?.voicePattern}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Learning:</span>
                    <span className="text-white ml-2">{personality?.learningCurve}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Traits:</span>
                    <span className="text-white ml-2">{personality?.personalityTraits.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500/20 to-green-500/20 rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">Your Elephant Wisdom Quote:</h3>
                <p className="text-gray-300 italic">
                  "{getWisdomQuote(personality?.archetype as string)}"
                </p>
              </div>

              <button
                onClick={() => router.push('/')}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-green-600 text-white font-semibold hover:scale-105 transition-transform"
              >
                Start Your Elephant Journey!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getWisdomQuote(archetype: string): string {
  const quotes = {
    mentor: "In the herd, wisdom comes not from age alone, but from sharing your knowledge with those who need it.",
    boss: "Every successful elephant marks its territory first. Lead with confidence and leave your legacy.",
    creative: "The greatest plains are those we explore with curiosity. New ideas are born from wondering.",
    owl: "In the stillness of the night, wisdom comes to those who listen to the whispers of the wind."
  };
  return quotes[archetype as keyof typeof quotes] || quotes.mentor;
}