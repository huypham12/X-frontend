'use client';
import { useState, useRef } from 'react';
import { useAuthStore } from '@/features/auth/stores/auth.store';
import { Image as ImageIcon, Smile, MapPin, Calendar, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { mediaService } from '@/features/media/api/media.service';
import { tweetService } from '@/features/tweets/api/tweet.service';
import { toast } from 'sonner';

export function CreateTweet() {
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setImages((prev) => [...prev, ...files]);
      
      const newUrls = files.map(file => URL.createObjectURL(file));
      setImageUrls((prev) => [...prev, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0) return;
    
    setLoading(true);
    try {
      const uploadedMedias: string[] = [];
      
      // Upload images first
      for (const file of images) {
        const res = await mediaService.uploadImage(file);
        if (res.result && res.result[0]) {
          uploadedMedias.push(res.result[0]._id);
        }
      }

      // Create tweet
      await tweetService.createTweet({
        content,
        audience: 0,
        type: 0,
        medias: uploadedMedias
      });

      toast.success("Đăng bài viết thành công!");
      setContent('');
      setImages([]);
      setImageUrls([]);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đăng bài thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-[#2F3336] p-4 flex gap-4">
      <div className="w-10 h-10 bg-gray-600 rounded-full flex-shrink-0 overflow-hidden">
        {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : null}
      </div>
      <div className="flex-1">
        <form onSubmit={handleSubmit}>
          <textarea 
            placeholder="What is happening?!" 
            className="w-full bg-transparent text-xl outline-none resize-none min-h-[50px] placeholder:text-gray-500 text-white"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            rows={1}
          />

          {/* Image Previews */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative rounded-2xl overflow-hidden border border-[#2F3336]">
                  <img src={url} alt="Preview" className="w-full h-auto object-cover max-h-[300px]" />
                  <button 
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/70 hover:bg-black/60 rounded-full flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-b border-[#2F3336] pb-3 mb-3">
            <Button type="button" variant="ghost" className="h-6 px-3 rounded-full text-sm font-bold text-[#1d9bf0] hover:bg-[#1d9bf0]/10 p-0 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Everyone can reply
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[#1d9bf0]">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="w-5 h-5" />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handleImageChange} 
                />
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 cursor-pointer transition-colors">
                <Smile className="w-5 h-5" />
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 cursor-pointer transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 cursor-pointer transition-colors opacity-50">
                <MapPin className="w-5 h-5" />
              </div>
            </div>
            <Button 
              type="submit" 
              disabled={loading || (!content.trim() && images.length === 0)} 
              className="rounded-full font-bold bg-[#1d9bf0] text-white hover:bg-[#1a8cd8] disabled:opacity-50 px-5"
            >
              {loading ? "Posting..." : "Post"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
