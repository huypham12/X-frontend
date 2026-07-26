'use client';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchService } from '@/features/search/api/search.service';
import { useAuthStore } from '@/features/auth/stores/auth.store';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const queryClient = useQueryClient();

  const { data: historyData } = useQuery({
    queryKey: ['search-history'],
    queryFn: () => searchService.getSearchHistory(),
    enabled: isAuthenticated && isFocused,
  });

  const clearHistoryMutation = useMutation({
    mutationFn: () => searchService.deleteSearchHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search-history'] });
    }
  });

  const history = historyData || [];

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsFocused(false);
    // Push the search query to the URL
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        formRef.current && 
        !formRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative group z-50">
      <form ref={formRef} onSubmit={onSubmit} className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className={`h-5 w-5 transition-colors ${isFocused ? 'text-[#1d9bf0]' : 'text-gray-500 group-focus-within:text-[#1d9bf0]'}`} />
        </div>
        <Input 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search" 
          className="pl-12 bg-[#202327] text-white border-transparent rounded-full h-12 focus-visible:ring-1 focus-visible:ring-[#1d9bf0] focus-visible:bg-black focus-visible:border-[#1d9bf0]" 
        />
        {query && (
          <button 
            type="button"
            onClick={() => {
              setQuery('');
              setIsFocused(true);
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <div className="bg-[#1d9bf0] rounded-full p-0.5 text-white">
              <X className="h-4 w-4" />
            </div>
          </button>
        )}
      </form>

      {/* History Dropdown */}
      {isFocused && (
        <div 
          ref={dropdownRef}
          className="absolute top-14 left-0 right-0 bg-black shadow-lg rounded-xl border border-[#2F3336] max-h-[400px] overflow-y-auto py-2"
        >
          {query.trim().length > 0 ? (
            <div 
              className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 transition-colors"
              onClick={() => handleSearch(query)}
            >
              <Search className="h-5 w-5 text-gray-500" />
              <span className="font-medium">Search for &quot;{query}&quot;</span>
            </div>
          ) : history.length > 0 ? (
            <>
              <div className="flex justify-between items-center px-4 py-2">
                <span className="font-bold text-lg">Recent</span>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    clearHistoryMutation.mutate();
                  }}
                  className="text-[#1d9bf0] hover:bg-[#1d9bf0]/10 px-2 py-1 rounded-full text-sm font-medium transition-colors"
                >
                  Clear all
                </button>
              </div>
              {history.map((item: string, idx: number) => (
                <div 
                  key={idx} 
                  onClick={() => handleSearch(item)}
                  className="px-4 py-3 hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors group/item"
                >
                  <div className="flex items-center gap-4">
                    <Search className="h-5 w-5 text-gray-500" />
                    <span className="font-medium">{item}</span>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="p-4 text-center text-gray-500">
              Try searching for people, topics, or keywords
            </div>
          )}
        </div>
      )}
    </div>
  );
}
