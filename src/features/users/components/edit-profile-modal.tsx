'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Camera, X } from 'lucide-react';
import { mediaService } from '@/features/media/api/media.service';
import { userService } from '@/features/users/api/user.service';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import { useMediaUpload } from '@/features/media/hooks/use-media-upload';

export function EditProfileModal() {
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [name, setName] = useState(user?.name || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [coverUrl, setCoverUrl] = useState(user?.cover_photo || '');
  
  const { files: avatarFiles, previewUrls: avatarPreviews, addFiles: addAvatar, clearFiles: clearAvatar } = useMediaUpload({ multiple: false });
  const { files: coverFiles, previewUrls: coverPreviews, addFiles: addCover, clearFiles: clearCover } = useMediaUpload({ multiple: false });

  // Use the hook previews if they exist, otherwise fallback to existing URLs or user data
  const finalAvatarUrl = avatarPreviews[0] || avatarUrl;
  const finalCoverUrl = coverPreviews[0] || coverUrl;

  useEffect(() => {
    if (open) {
      setName(user?.name || '');
      setUsername(user?.username || '');
      setBio(user?.bio || '');
      setAvatarUrl(user?.avatar || '');
      setCoverUrl(user?.cover_photo || '');
      clearAvatar();
      clearCover();
    }
  }, [open, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addAvatar(e.target.files);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addCover(e.target.files);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let finalAvatarUpdate = finalAvatarUrl;
      let finalCoverUpdate = finalCoverUrl;

      // Upload if new files selected
      if (avatarFiles.length > 0) {
        const res = await mediaService.uploadImage(avatarFiles[0]);
        if (res && res[0]) {
          finalAvatarUpdate = res[0].url;
        }
      }
      if (coverFiles.length > 0) {
        const res = await mediaService.uploadImage(coverFiles[0]);
        if (res && res[0]) {
          finalCoverUpdate = res[0].url;
        }
      }

      // Update profile
      const updateData = {
        name,
        username,
        bio,
        avatar: finalAvatarUpdate,
        cover_photo: finalCoverUpdate
      };

      const updateRes = await userService.updateProfile(updateData);
      
      // Update store
      if (updateRes && updateRes[0]) {
        const accessToken = Cookies.get('access_token') || '';
        const refreshToken = Cookies.get('refresh_token') || '';
        setAuth(updateRes[0], accessToken, refreshToken);
      }

      toast.success("Hồ sơ đã được cập nhật thành công!");
      setOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="rounded-full font-bold border border-gray-600 bg-transparent text-white hover:bg-white/10 h-9 px-4 text-sm">
        Edit profile
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-black border-[#2F3336] text-white p-0 gap-0 w-full h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[85vh] overflow-hidden flex flex-col rounded-none sm:rounded-2xl">
        <DialogHeader className="px-4 py-3 flex-row justify-between items-center border-b border-[#2F3336] sticky top-0 bg-black/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-6">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-full hover:bg-white/10 mt-1">
              <X className="w-5 h-5" />
            </Button>
            <DialogTitle className="text-xl font-bold">Edit profile</DialogTitle>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={loading || !name.trim()} 
            className="rounded-full font-bold bg-white text-black hover:bg-gray-200"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogHeader>

        <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-0">
          {/* Cover Photo */}
          <div className="h-[200px] bg-[#333639] w-full relative flex items-center justify-center">
            {finalCoverUrl && (
              <img src={finalCoverUrl} alt="Cover" className="w-full h-full object-cover" />
            )}
            <div className="absolute flex gap-4">
              <label className="w-11 h-11 bg-black/50 hover:bg-black/40 rounded-full flex items-center justify-center cursor-pointer transition-colors backdrop-blur-sm">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
              </label>
            </div>
          </div>

          {/* Avatar Photo */}
          <div className="px-4 relative">
            <div className="w-[112px] h-[112px] rounded-full border-4 border-black bg-gray-600 -mt-[56px] relative overflow-hidden group">
              {finalAvatarUrl && (
                <img src={finalAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              )}
              <div className="absolute inset-0 bg-black/50 hover:bg-black/40 flex items-center justify-center cursor-pointer transition-colors backdrop-blur-sm opacity-0 group-hover:opacity-100">
                <label className="w-11 h-11 bg-black/40 hover:bg-black/30 rounded-full flex items-center justify-center cursor-pointer transition-colors">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="p-4 space-y-6">
            <div className="relative group">
              <div className="absolute top-2 left-2 text-xs text-gray-500 group-focus-within:text-[#1d9bf0]">Name</div>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pt-6 pb-2 h-14 bg-transparent border-[#2F3336] rounded-sm focus-visible:ring-1 focus-visible:ring-[#1d9bf0] focus-visible:border-[#1d9bf0] text-white"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute top-2 left-2 text-xs text-gray-500 group-focus-within:text-[#1d9bf0]">Username</div>
              <Input 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pt-6 pb-2 h-14 bg-transparent border-[#2F3336] rounded-sm focus-visible:ring-1 focus-visible:ring-[#1d9bf0] focus-visible:border-[#1d9bf0] text-white"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute top-2 left-2 text-xs text-gray-500 group-focus-within:text-[#1d9bf0]">Bio</div>
              <textarea 
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full pt-6 pb-2 px-3 min-h-[100px] bg-transparent border border-[#2F3336] rounded-sm outline-none focus:ring-1 focus:ring-[#1d9bf0] focus:border-[#1d9bf0] text-sm resize-none text-white"
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
