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
  variant?: 'default' | 'compact';
  disabled?: boolean;
}

export function AudioPlayer({ url, variant = 'default', disabled = false }: AudioPlayerProps) {
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

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current && !disabled) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        try {
          await audioRef.current.play();
        } catch {
          setIsPlaying(false);
        }
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioRef.current && !disabled) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const value = Number(e.target.value);
    if (audioRef.current && duration && !disabled) {
      audioRef.current.currentTime = (value / 100) * duration;
      setProgress(value);
    }
  };

  const isCompact = variant === 'compact';
  const waveformHeights = isCompact ? WAVEFORM_HEIGHTS.filter((_, index) => index % 2 === 0) : WAVEFORM_HEIGHTS;

  const formatTime = (time: number) => {
    if (isNaN(time) || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className={`group flex w-full items-center bg-[#16181c] transition-colors duration-200 hover:bg-[#1a1d21] ${
        isCompact
          ? 'h-full max-w-none gap-2 border-0 p-2 sm:gap-3 sm:p-3'
          : 'max-w-[450px] gap-4 rounded-2xl border border-[#2F3336] p-4'
      } ${disabled ? 'opacity-70' : ''}`}
      onClick={(e) => e.stopPropagation()}
    >
      <audio ref={audioRef} src={url} preload="metadata" />
      
      <button 
        type="button"
        onClick={togglePlay}
        disabled={disabled}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        className={`${isCompact ? 'h-9 w-9' : 'h-12 w-12'} flex shrink-0 items-center justify-center rounded-full bg-[#1d9bf0] text-white shadow-lg shadow-[#1d9bf0]/20 transition-all hover:bg-[#1a8cd8] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d9bf0] focus-visible:ring-offset-2 focus-visible:ring-offset-[#16181c] disabled:cursor-not-allowed`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5 fill-current" strokeWidth={0} />
        ) : (
          <Play className="w-5 h-5 fill-current ml-1" strokeWidth={0} />
        )}
      </button>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        <div className={`group/slider relative flex w-full items-center ${isCompact ? 'h-8' : 'h-10'}`}>
          {/* Waveform Bars */}
          <div className="absolute inset-0 flex items-center justify-between gap-[2px] pointer-events-none">
            {waveformHeights.map((height, i) => {
              const isActive = (i / waveformHeights.length) * 100 <= progress;
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
            onClick={(event) => event.stopPropagation()}
            disabled={disabled}
            aria-label="Seek audio"
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
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
        type="button"
        onClick={toggleMute}
        disabled={disabled}
        aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
        className={`${isCompact ? 'h-8 w-8' : 'h-10 w-10'} flex shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-white/5 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 disabled:cursor-not-allowed`}
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
}
