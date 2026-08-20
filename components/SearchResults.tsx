import type { SearchResults } from "@/types/search";
import { SearchNetworkGraph } from "./SearchNetworkGraph";

interface SearchResultsProps {
  results: SearchResults;
}

export function SearchResults({ results }: SearchResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Other search result components */}

      <div className="w-full h-[600px] border rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-4">Relationship Graph</h2>
        <SearchNetworkGraph data={results} />
      </div>
    </div>
  );
}
