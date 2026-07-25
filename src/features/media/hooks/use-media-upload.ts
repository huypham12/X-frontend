import { useState, useCallback, useEffect } from 'react';

export interface UseMediaUploadOptions {
  multiple?: boolean;
}

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const { multiple = false } = options;
  
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  // Clean up object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []); // Only run cleanup on unmount for all active URLs might be tricky, let's simplify

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    
    if (fileArray.length === 0) return;

    if (!multiple) {
      // If single file mode, replace the existing one
      // Revoke old
      setPreviewUrls(prev => {
        prev.forEach(url => URL.revokeObjectURL(url));
        return [];
      });
      
      const url = URL.createObjectURL(fileArray[0]);
      setFiles([fileArray[0]]);
      setPreviewUrls([url]);
    } else {
      // If multiple, append
      setFiles(prev => [...prev, ...fileArray]);
      const newUrls = fileArray.map(f => URL.createObjectURL(f));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  }, [multiple]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      newUrls.splice(index, 1);
      return newUrls;
    });
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
    setPreviewUrls(prev => {
      prev.forEach(url => URL.revokeObjectURL(url));
      return [];
    });
  }, []);

  return {
    files,
    previewUrls,
    addFiles,
    removeFile,
    clearFiles,
  };
}
