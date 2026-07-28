'use client';
import { useState } from 'react';
import { MoreHorizontal, Trash2, Edit2, Users, UserX, Globe } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tweetService } from '@/features/tweets/api/tweet.service';
import { userService } from '@/features/users/api/user.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import type { Tweet } from '../types/tweet.type';

interface TweetMenuProps {
  tweet: Tweet;
}

export function TweetMenu({ tweet }: TweetMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [editContent, setEditContent] = useState(tweet.content || '');
  
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  
  const isOwner = currentUser?._id === tweet.author?._id;

  const deleteMutation = useMutation({
    mutationFn: () => tweetService.deleteTweet(tweet._id),
    onSuccess: () => {
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      queryClient.invalidateQueries({ queryKey: ['user-tweets', tweet.author?.username] });
    }
  });

  const editMutation = useMutation({
    mutationFn: (newContent: string) => tweetService.updateTweet(tweet._id, { content: newContent }),
    onSuccess: () => {
      setIsEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      queryClient.invalidateQueries({ queryKey: ['tweet', tweet._id] });
    }
  });

  const audienceMutation = useMutation({
    mutationFn: (newAudience: number) => tweetService.updateTweet(tweet._id, { audience: newAudience }),
    onSuccess: () => {
      setIsAudienceModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      queryClient.invalidateQueries({ queryKey: ['tweet', tweet._id] });
    }
  });

  const blockMutation = useMutation({
    mutationFn: () => {
      const authorId = tweet.author?._id;
      if (!authorId) throw new Error('Tweet author is missing.');
      return userService.blockUser(authorId);
    },
    onSuccess: () => {
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tweets'] });
      if (tweet.author?.username) {
        queryClient.invalidateQueries({ queryKey: ['user', tweet.author.username] });
      }
    }
  });

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this tweet?')) {
      deleteMutation.mutate();
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setIsEditModalOpen(true);
  };
  
  const handleAudienceClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    setIsAudienceModalOpen(true);
  };

  const handleBlockClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to block @${tweet.author?.username}?`)) {
      blockMutation.mutate();
    }
  };

  const handleEditSubmit = () => {
    editMutation.mutate(editContent);
  };

  const setAudience = (audience: number) => {
    audienceMutation.mutate(audience);
  };

  return (
    <div className="relative">
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 group transition-colors shrink-0 cursor-pointer"
        onClick={handleMenuClick}
      >
        <MoreHorizontal className="w-5 h-5 text-gray-500 group-hover:text-[#1d9bf0]" />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}></div>
          <div className="absolute top-full right-0 mt-1 bg-black shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded-xl py-2 w-64 z-50 overflow-hidden text-white border border-[#2F3336]" onClick={e => e.stopPropagation()}>
            {isOwner ? (
              <>
                <button onClick={handleDelete} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3 text-red-500">
                  <Trash2 className="w-5 h-5" />
                  <span className="font-bold text-[15px]">Delete</span>
                </button>
                <button onClick={handleEditClick} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3">
                  <Edit2 className="w-5 h-5" />
                  <span className="font-bold text-[15px]">Edit Tweet</span>
                </button>
                <button onClick={handleAudienceClick} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3">
                  <Users className="w-5 h-5" />
                  <span className="font-bold text-[15px]">Change who can reply</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={handleBlockClick} className="w-full text-left px-4 py-3 hover:bg-white/5 transition-colors flex items-center gap-3">
                  <UserX className="w-5 h-5" />
                  <span className="font-bold text-[15px]">Block @{tweet.author?.username}</span>
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { e.stopPropagation(); setIsEditModalOpen(false); }}>
          <div className="bg-black border border-[#2F3336] rounded-2xl p-4 w-full max-w-lg shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Edit Tweet</h2>
            <textarea
              className="w-full bg-transparent text-white text-xl placeholder-gray-500 resize-none outline-none min-h-[100px]"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="What is happening?!"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button 
                className="px-4 py-2 rounded-full font-bold text-white hover:bg-white/10 transition-colors"
                onClick={() => setIsEditModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 rounded-full font-bold bg-[#1d9bf0] text-white hover:bg-[#1a8cd8] transition-colors disabled:opacity-50"
                onClick={handleEditSubmit}
                disabled={editMutation.isPending || !editContent.trim()}
              >
                {editMutation.isPending ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audience Modal */}
      {isAudienceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { e.stopPropagation(); setIsAudienceModalOpen(false); }}>
          <div className="bg-black border border-[#2F3336] rounded-2xl p-4 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-2">Who can reply?</h2>
            <p className="text-gray-500 text-sm mb-4">Choose who can reply to this Tweet.</p>
            
            <button 
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors ${tweet.audience === 0 ? 'bg-white/5' : ''}`}
              onClick={() => setAudience(0)}
            >
              <div className="w-10 h-10 rounded-full bg-[#1d9bf0] flex items-center justify-center text-white">
                <Globe className="w-5 h-5" />
              </div>
              <span className="font-bold text-white">Everyone</span>
            </button>
            
            <button 
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors ${tweet.audience === 1 ? 'bg-white/5' : ''}`}
              onClick={() => setAudience(1)}
            >
              <div className="w-10 h-10 rounded-full bg-[#00ba7c] flex items-center justify-center text-white">
                <Users className="w-5 h-5" />
              </div>
              <span className="font-bold text-white">Twitter Circle</span>
            </button>
            
            <div className="mt-4 flex justify-end">
              <button 
                className="px-4 py-2 rounded-full font-bold text-white hover:bg-white/10 transition-colors"
                onClick={() => setIsAudienceModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
