'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const WAVEFORM_HEIGHTS = [
  15, 20, 35, 45, 60, 75, 80, 60, 40, 30, 
  35, 50, 70, 90, 100, 85, 60, 45, 30, 25, 
  20, 25, 35, 55, 75, 80, 65, 50, 35, 25, 
  20, 30, 45, 65, 75, 60, 40, 30, 20, 15
];

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
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
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
    if (audioRef.current && duration) {
      audioRef.current.currentTime = (value / 100) * duration;
      setProgress(value);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="w-full max-w-[450px] bg-[#16181c] border border-[#2F3336] hover:bg-[#1a1d21] transition-colors duration-200 rounded-2xl p-4 flex items-center gap-4 group"
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <button 
        onClick={togglePlay}
        className="w-12 h-12 rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] active:scale-95 flex items-center justify-center text-white transition-all shrink-0 shadow-lg shadow-[#1d9bf0]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16181c]"
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" strokeWidth={0} />
        ) : (
          <Play className="w-5 h-5 fill-current ml-1" strokeWidth={0} />
        )}
      </button>

      <div className="flex-1 flex flex-col gap-1.5 justify-center">
        <div className="relative flex items-center h-10 w-full group/slider">
          {/* Waveform Bars */}
          <div className="absolute inset-0 flex items-center justify-between gap-[2px] pointer-events-none">
            {WAVEFORM_HEIGHTS.map((height, i) => {
              const isActive = (i / WAVEFORM_HEIGHTS.length) * 100 <= progress;
              return (
                <div 
                  key={i} 
                  className={`flex-1 max-w-[4px] rounded-full transition-colors duration-150 ${
                    isActive ? 'bg-[#1d9bf0]' : 'bg-[#333639] group-hover/slider:bg-[#3e4144]'
                  }`}
                  style={{ height: `${height}%` }}
                />
              );
            })}
          </div>
          
          {/* Invisible Range Input for scrubbing */}
          <input
            type="range"
            min="0"
            max="100"
            value={progress || 0}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
        </div>
        
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[12px] font-medium text-gray-400 font-mono tracking-tight">
            {formatTime((progress / 100) * duration)}
          </span>
          <span className="text-[12px] font-medium text-gray-500 font-mono tracking-tight">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <button 
        onClick={toggleMute}
        className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
