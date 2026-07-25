'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  url: string;
}

export function AudioPlayer({ url }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const updateDuration = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = (value / 100) * duration;
      setProgress(value);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="w-full bg-[#16181c] border border-[#2F3336] rounded-2xl p-4 flex items-center gap-4"
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <button 
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-[#1d9bf0] flex items-center justify-center text-white hover:bg-[#1a8cd8] transition-colors shrink-0"
      >
        {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
      </button>

      <div className="flex-1 flex flex-col gap-2">
        {/* Fake Waveform UI for premium look */}
        <div className="h-8 flex items-center gap-[2px] w-full opacity-70">
          {Array.from({ length: 40 }).map((_, i) => {
            const isActive = (i / 40) * 100 <= progress;
            const height = 20 + Math.sin(i) * 15 + Math.cos(i * 2) * 10; // Random looking height
            return (
              <div 
                key={i} 
                className={`flex-1 rounded-full transition-colors duration-200 ${isActive ? 'bg-[#1d9bf0]' : 'bg-[#333639]'}`}
                style={{ height: `${Math.max(20, Math.min(100, height))}%` }}
              />
            );
          })}
        </div>
        
        <div className="flex items-center justify-between gap-4">
          <span className="text-xs text-gray-500 w-10">{formatTime((progress / 100) * duration)}</span>
          
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleSeek}
            className="flex-1 h-1 bg-[#333639] rounded-lg appearance-none cursor-pointer accent-[#1d9bf0]"
          />
          
          <span className="text-xs text-gray-500 w-10 text-right">{formatTime(duration)}</span>
        </div>
      </div>

      <button 
        onClick={toggleMute}
        className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-gray-500 transition-colors shrink-0"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
