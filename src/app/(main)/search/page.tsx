import { SearchResults } from '@/features/search/components/search-results';
import { SearchBar } from '@/features/search/components/search-bar';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface SearchPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;
  const query = (resolvedParams.q as string) || '';
  const filter = (resolvedParams.f as string) || 'top';

  return (
    <div className="flex flex-col min-h-screen pb-20 lg:pb-0">
      {/* Mobile Header with Search Bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#2F3336] sticky top-0 bg-black/80 backdrop-blur-md z-20 lg:hidden">
        <Link href="/home" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <div className="flex-1">
          <SearchBar />
        </div>
      </div>

      {/* Desktop Header (just title if needed, or hide on desktop since RightSidebar has SearchBar) */}
      <div className="hidden lg:flex items-center gap-6 px-4 h-[53px] border-b border-[#2F3336] sticky top-0 bg-black/80 backdrop-blur-md z-20">
        <Link href="/home" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors shrink-0 -ml-2">
          <ArrowLeft className="w-5 h-5 text-white" />
        </Link>
        <h1 className="text-xl font-bold truncate">Search</h1>
      </div>

      {query ? (
        <SearchResults query={query} filter={filter} />
      ) : (
        <div className="p-8 text-center flex flex-col items-center max-w-[400px] mx-auto mt-8">
          <h2 className="text-3xl font-bold mb-2">Search X</h2>
          <p className="text-gray-500 mb-6">Find people, hashtags, and tweets.</p>
        </div>
      )}
    </div>
  );
}
