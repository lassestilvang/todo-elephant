"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'sonner';
import { ElephantLogo } from '@/src/components/ElephantLogo';
import { User, Camera, Upload, Save, Edit, Unlock, Lock, Award, TrendingUp, Heart, Sparkles } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Ellie the Mentor',
    email: 'ellie@elephant-herd.com',
    avatar: '/avatars/mentor-elephant.png',
    bio: 'Dedicated to helping the herd thrive through organization and wisdom.',
    birthDate: '1995-06-15',
    favoriteFood: 'Bananas and leafy greens',
    elephantPersonality: {
      archetype: 'mentor',
      type: 'african',
      color: 'from-amber-400 to-orange-500'
    },
    achievements: 150,
    streak: 45,
    level: 12,
    nextLevel: 15,
    experience: 3200,
    nextExperience: 5000,
    preferences: {
      theme: 'dark',
      notifications: true,
      sound: true,
      elephantEmoji: '🧓',
      defaultView: 'dashboard'
    }
  });

  const [editData, setEditData] = useState(profileData);

  useEffect(() => {
    const savedPersonality = localStorage.getItem('elephantPersonality');
    if (savedPersonality) {
      const personality = JSON.parse(savedPersonality);
      setProfileData(prev => ({
        ...prev,
        name: personality.name || prev.name,
        elephantPersonality: {
          archetype: personality.archetype,
          type: personality.elephantType,
          color: personality.colorTheme || prev.elephantPersonality.color
        }
      }));
      setEditData(prev => ({
        ...prev,
        name: personality.name || prev.name,
        elephantPersonality: {
          archetype: personality.archetype,
          type: personality.elephantType,
          color: personality.colorTheme || prev.elephantPersonality.color
        }
      }));
    }
  }, []);

  const handleSave = async () => {
    setIsEditing(false);
    toast.success('Elephant profile updated successfully! 🧓');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload
      setTimeout(() => {
        setProfileData(prev => ({
          ...prev,
          avatar: `/avatars/${file.name}`
        }));
        setEditData(prev => ({
          ...prev,
          avatar: `/avatars/${file.name}`
        }));
        setIsUploading(false);
        toast.success('Avatar uploaded to the herd!');
      }, 1000);
    }
  };

  const handleExperienceGain = (points: number) => {
    setProfileData(prev => {
      const newExp = prev.experience + points;
      const levelProgress = (newExp / prev.nextExperience) * 100;

      let newLevel = prev.level;
      let nextLevel = prev.nextLevel;

      while (newExp >= nextLevel && newLevel < 50) {
        newLevel += 1;
        nextLevel = Math.floor(nextLevel * 1.5);
      }

      return {
        ...prev,
        experience: newExp,
        level: newLevel,
        nextLevel: nextLevel,
        achievements: prev.achievements + Math.floor(points / 100)
      };
    });
  };

  const getLevelProgress = () => {
    return (profileData.experience / profileData.nextLevel) * 100;
  };

  const getPersonalityEmoji = (archetype: string) => {
    const emojis = {
      mentor: '🧓',
      boss: '💼',
      creative: '🌟',
      owl: '🦉'
    };
    return emojis[archetype as keyof typeof emojis] || '🐘';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
      <Toaster position="top-center" />

      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <ElephantLogo size={64} mood="happy" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Your Elephant Profile</h1>
          <p className="text-gray-400">Manage your herd identity and track your growth</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 sticky top-8">
              {/* Avatar Section */}
              <div className="text-center mb-6">
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 p-1">
                    <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center">
                      <User size={32} className="text-gray-400" />
                    </div>
                  </div>
                  {isUploading && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="mt-4 px-4 py-2 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Camera size={16} />
                  Upload Avatar
                </button>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>

              <h2 className="text-xl font-bold text-white text-center mb-2">{profileData.name}</h2>
              <p className="text-gray-400 text-center mb-4">{profileData.email}</p>

              {/* Elephant Type Badge */}
              <div className="bg-gradient-to-r from-purple-500/20 to-green-500/20 rounded-xl p-4 mb-4">
                <div className="text-sm text-gray-400 mb-2">Elephant Profile</div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getPersonalityEmoji(profileData.elephantPersonality.archetype)}</span>
                  <div>
                    <div className="text-white font-medium capitalize">{profileData.elephantPersonality.archetype}</div>
                    <div className="text-xs text-gray-400 capitalize">{profileData.elephantPersonality.type}</div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-700 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Level</div>
                  <div className="text-xl font-bold text-white">{profileData.level}</div>
                </div>
                <div className="bg-slate-700 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Streak</div>
                  <div className="text-xl font-bold text-green-400">{profileData.streak}</div>
                </div>
                <div className="bg-slate-700 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Achievements</div>
                  <div className="text-xl font-bold text-yellow-400">{profileData.achievements}</div>
                </div>
                <div className="bg-slate-700 rounded-xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Experience</div>
                  <div className="text-sm font-bold text-white">{profileData.experience}/{profileData.nextExperience}</div>
                </div>
              </div>

              {/* Level Progress */}
              <div className="mb-6">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span>Level {profileData.level} Progress</span>
                  <span>{Math.round(getLevelProgress())}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getLevelProgress()}%` }}
                  />
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full px-4 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit Profile
                </button>
                <button
                  onClick={() => router.push('/templates')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <Award size={16} />
                  Template Marketplace
                </button>
                <button
                  onClick={() => router.push('/focus-sessions')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <TrendingUp size={16} />
                  Focus Session History
                </button>
                <button
                  onClick={() => router.push('/social')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <Heart size={16} />
                  Elephant Social Network
                </button>
                <button
                  onClick={() => router.push('/voice-commands')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  Elephant Voice Commands
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Edit Form */}
            {isEditing && (
              <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Save size={20} />
                  Edit Elephant Profile
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Elephant Name</label>
                      <input
                        type="text"
                        value={editData.name}
                        onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Favorite Food</label>
                      <input
                        type="text"
                        value={editData.favoriteFood}
                        onChange={(e) => setEditData(prev => ({ ...prev, favoriteFood: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                      <select
                        value={editData.preferences.theme}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, theme: e.target.value }
                        }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="dark">Dark</option>
                        <option value="light">Light</option>
                        <option value="system">System</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Elephant Emoji</label>
                      <select
                        value={editData.preferences.elephantEmoji}
                        onChange={(e) => setEditData(prev => ({
                          ...prev,
                          preferences: { ...prev.preferences, elephantEmoji: e.target.value }
                        }))}
                        className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="🧓">🧓 Mentor</option>
                        <option value="💼">💼 Boss</option>
                        <option value="🌟">🌟 Explorer</option>
                        <option value="🦉">🦉 Wisdom</option>
                        <option value="🐘">🐘 Basic</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      className="px-6 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Save size={16} />
                      Save Changes
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Elephant Journey */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Elephant Journey</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Sparkles size={20} className="text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Experience Points</div>
                      <div className="text-xs text-gray-400">Gained from completing tasks</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-bold">{profileData.experience}</div>
                    <div className="text-xs text-gray-400">to Level {profileData.level + 1}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp size={20} className="text-green-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Current Streak</div>
                      <div className="text-xs text-gray-400">Days of consistent task completion</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">{profileData.streak} days</div>
                    <div className="text-xs text-gray-400">Keep it up! 🌿</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Award size={20} className="text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Total Achievements</div>
                      <div className="text-xs text-gray-400">Milestones and badges earned</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-bold">{profileData.achievements}</div>
                    <div className="text-xs text-gray-400">Keep learning! 📚</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold text-white mb-4">Recent Elephant Activities</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <User size={16} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm">Completed "Morning meditation" task</div>
                    <div className="text-xs text-gray-400">2 hours ago</div>
                  </div>
                  <div className="text-xs text-green-400">+50 XP</div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Award size={16} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm">Earned "Early Bird" achievement</div>
                    <div className="text-xs text-gray-400">Yesterday</div>
                  </div>
                  <div className="text-xs text-purple-400">Level 10</div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-slate-700 rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp size={16} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm">7-day streak maintained</div>
                    <div className="text-xs text-gray-400">3 days ago</div>
                  </div>
                  <div className="text-xs text-green-400">🐘</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}