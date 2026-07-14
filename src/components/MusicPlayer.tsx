import React, { useEffect, useState } from 'react';
import { useMusicSync } from '@/lib/hooks/useMusicSync';
import { TaskStatus } from '@/types';

export default function MusicPlayer({ taskStatus, focusMode }: { taskStatus: TaskStatus; focusMode: FocusMode }) {
  const { play, stop, dispose } = useMusicSync(taskStatus, focusMode);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Automatically start sound when component mounts
    if (taskStatus !== 'pending') {
      play();
      setIsPlaying(true);
    }

    return () => {
      stop();
      dispose();
    };
  }, [taskStatus, focusMode, play, stop, dispose]);

  const handleToggle = () => {
    if (isPlaying) {
      stop();
      dispose();
      setIsPlaying(false);
    } else {
      // Get current task to determine appropriate sound
      const currentTask = /* retrieve current task from context or store */;
      play();
      setIsPlaying(true);
    }
  };

  return (
    <div className="music-control">
      <button onClick={handleToggle} aria-label={isPlaying ? 'Stop music' : 'Play music'}>
        {isPlaying ? (
          <span>⏸️</span>
        ) : (
          <span>▶️</span>
        )}
      </button>
      <div className="status-text">{isPlaying ? 'Music playing' : 'Music paused'}</div>
    </div>
  );
}