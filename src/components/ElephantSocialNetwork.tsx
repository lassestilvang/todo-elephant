"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Heart,
  Share2,
  MessageCircle,
  Trophy,
  TrendingUp,
  Users,
  Sparkles,
  Coffee,
  Brain,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';

interface ElephantPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'win' | 'tip' | 'challenge' | 'celebration' | 'wisdom';
  likes: number;
  shares: number;
  comments: number;
  createdAt: Date;
  hashtags?: string[];
  relatedTaskId?: string;
  taskTitle?: string;
}

interface ElephantUser {
  id: string;
  name: string;
  avatar?: string;
  streak: number;
  achievements: string[];
  isFollowing?: boolean;
}

const ELEPHANT_TYPES = [
  { type: 'win', label: 'Win 🎉', icon: Trophy, color: 'text-yellow-500' },
  { type: 'tip', label: 'Tip 💡', icon: Lightbulb, color: 'text-blue-500' },
  { type: 'challenge', label: 'Challenge 🔥', icon: Coffee, color: 'text-orange-500' },
  { type: 'celebration', label: 'Celebration 🐘', icon: Sparkles, color: 'text-purple-500' },
  { type: 'wisdom', label: 'Wisdom 🧠', icon: Brain, color: 'text-green-500' }
] as const;

export function ElephantSocialNetwork() {
  const [posts, setPosts] = useState<ElephantPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<'win' | 'tip' | 'challenge' | 'celebration' | 'wisdom'>('win');
  const [relatedTask, setRelatedTask] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [feed, setFeed] = useState<'all' | 'following' | 'trending'>('all');

  // Mock data for demonstration
  const mockPosts: ElephantPost[] = [
    {
      id: '1',
      userId: 'user1',
      userName: 'Lasse',
      userAvatar: 'https://avatars.githubusercontent.com/u/1',
      content: 'Just completed my 7-day streak! 🎯 Feeling productive and focused. The new Pomodoro Forest feature is amazing for maintaining focus.',
      type: 'win',
      likes: 42,
      shares: 5,
      comments: 3,
      createdAt: new Date(Date.now() - 3600000),
      hashtags: ['streak', 'productivity', 'focus'],
      taskTitle: 'Complete AI module implementation'
    },
    {
      id: '2',
      userId: 'user2',
      userName: 'Alex',
      content: 'Pro tip: Break large tasks into micro-tasks of 15-30 minutes each. It makes them less overwhelming and you get more dopamine hits from completion!',
      type: 'tip',
      likes: 87,
      shares: 12,
      comments: 8,
      createdAt: new Date(Date.now() - 7200000),
      hashtags: ['productivity', 'tip', 'microtasks']
    },
    {
      id: '3',
      userId: 'user3',
      userName: 'Sam',
      content: 'Taking on the 7-day focus challenge! Starting tomorrow with my most important task. Who wants to join me?',
      type: 'challenge',
      likes: 23,
      shares: 3,
      comments: 15,
      createdAt: new Date(Date.now() - 10800000),
      hashtags: ['challenge', 'focus', 'community']
    }
  ];

  useEffect(() => {
    // Load posts (in real app, this would fetch from API)
    setPosts(mockPosts);
  }, []);

  const handlePost = async () => {
    if (!newPost.trim()) return;

    setIsPosting(true);

    const newPostItem: ElephantPost = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'You',
      content: newPost,
      type: postType,
      likes: 0,
      shares: 0,
      comments: 0,
      createdAt: new Date(),
      hashtags: newPost.match(/#\w+/g) || [],
      taskTitle: relatedTask || undefined
    };

    setPosts([newPostItem, ...posts]);
    setNewPost('');
    setRelatedTask('');
    setIsPosting(false);

    toast.success('Post shared with the Herd! 🐘');
  };

  const handleLike = useCallback((postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  }, [posts]);

  const handleShare = useCallback((postId: string) => {
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, shares: post.shares + 1 } : post
    ));
    toast.success('Shared with the Herd!');
  }, [posts]);

  const getTypeIcon = (type: typeof postType) => {
    const typeConfig = ELEPHANT_TYPES.find(t => t.type === type);
    const Icon = typeConfig?.icon || Trophy;
    return <Icon className={`w-4 h-4 ${typeConfig?.color || ''}`} />;
  };

  const getTrendingHashtags = () => {
    const hashtagCounts: Record<string, number> = {};
    posts.forEach(post => {
      post.hashtags?.forEach(tag => {
        hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
      });
    });
    return Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  };

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-500" />
            Share with the Herd
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share a win, tip, or challenge with the community..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            rows={3}
            className="resize-none"
          />

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {ELEPHANT_TYPES.map(({ type, label, icon: Icon, color }) => (
                <button
                  key={type}
                  onClick={() => setPostType(type)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-all ${
                    postType === type
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span>{label.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            <div className="text-xs text-gray-500">
              {newPost.length}/500 characters
            </div>
          </div>

          <Input
            type="text"
            placeholder="Link to a task (optional)..."
            value={relatedTask}
            onChange={(e) => setRelatedTask(e.target.value)}
            className="text-sm"
          />

          <Button
            onClick={handlePost}
            disabled={isPosting || !newPost.trim()}
            className="w-full"
          >
            {isPosting ? 'Sharing...' : 'Post to Herd'}
          </Button>
        </CardContent>
      </Card>

      {/* Feed Filter */}
      <div className="flex gap-2">
        <Button
          variant={feed === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFeed('all')}
        >
          All Posts
        </Button>
        <Button
          variant={feed === 'following' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFeed('following')}
        >
          Following
        </Button>
        <Button
          variant={feed === 'trending' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFeed('trending')}
        >
          Trending
        </Button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map(post => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarImage src={post.userAvatar} />
                  <AvatarFallback>{post.userName[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{post.userName}</span>
                    <Badge variant="outline" className="text-xs">
                      {ELEPHANT_TYPES.find(t => t.type === post.type)?.label.split(' ')[0]}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {post.createdAt.toLocaleTimeString()}
                    </span>
                  </div>
                  {post.taskTitle && (
                    <p className="text-xs text-gray-500 mt-1">
                      Related to: {post.taskTitle}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <p className="mb-3">{post.content}</p>

              {/* Hashtags */}
              {post.hashtags && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {post.hashtags.map(tag => (
                    <span key={tag} className="text-xs text-blue-600 hover:underline cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="flex gap-4">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Heart className="w-4 h-4" />
                    <span className="text-sm">{post.likes}</span>
                  </button>

                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center gap-1 text-gray-600 hover:text-green-500 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm">{post.shares}</span>
                  </button>

                  <button className="flex items-center gap-1 text-gray-600 hover:text-blue-500 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span className="text-sm">{post.comments}</span>
                  </button>
                </div>

                <div className="text-xs text-gray-500">
                  {post.createdAt.toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trending Hashtags */}
      {getTrendingHashtags().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Trending Hashtags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {getTrendingHashtags().map(tag => (
                <Badge key={tag} variant="secondary" className="cursor-pointer hover:bg-primary/10">
                  #{tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for the Elephant Social Network
export function useElephantSocial() {
  const [posts, setPosts] = useState<ElephantPost[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async (feed: 'all' | 'following' | 'trending') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/social/posts?feed=${feed}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (post: {
    content: string;
    type: ElephantPost['type'];
    relatedTaskId?: string;
    taskTitle?: string;
  }) => {
    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post)
      });

      if (response.ok) {
        const newPost = await response.json();
        setPosts([newPost, ...posts]);
        toast.success('Post shared with the Herd! 🐘');
        return newPost;
      }
    } catch (error) {
      toast.error('Failed to create post');
    }
  }, [posts]);

  const likePost = useCallback(async (postId: string) => {
    try {
      await fetch(`/api/social/posts/${postId}/like`, { method: 'POST' });
      setPosts(posts.map(p =>
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ));
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  }, [posts]);

  const followUser = useCallback(async (userId: string) => {
    try {
      await fetch(`/api/social/users/${userId}/follow`, { method: 'POST' });
      if (following.includes(userId)) {
        setFollowing(following.filter(id => id !== userId));
      } else {
        setFollowing([...following, userId]);
      }
    } catch (error) {
      console.error('Failed to follow user:', error);
    }
  }, [following]);

  return {
    posts,
    following,
    loading,
    fetchPosts,
    createPost,
    likePost,
    followUser
  };
}