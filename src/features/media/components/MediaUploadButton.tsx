import { useRef, ReactNode } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface MediaUploadButtonProps {
  onSelectFiles: (files: FileList) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  children?: ReactNode;
}

export const MediaUploadButton = ({
  onSelectFiles,
  maxFiles = 4,
  disabled = false,
  className = "w-9 h-9 rounded-full flex items-center justify-center hover:bg-[#1d9bf0]/10 transition-colors text-[#1d9bf0] disabled:opacity-50 disabled:cursor-not-allowed",
  children,
}: MediaUploadButtonProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      onSelectFiles(event.target.files);
      event.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple={maxFiles > 1}
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,audio/mpeg,audio/wav"
        disabled={disabled}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={className}
        aria-label="Add photos, video, or audio"
      >
        {children || <ImageIcon className="w-5 h-5" />}
      </button>
    </>
  );
};
