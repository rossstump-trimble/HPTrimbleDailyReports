export type FileType =
  | "sketchup"
  | "tekla"
  | "connect"
  | "quadri"
  | "pdf"
  | "excel"
  | "image"
  | "ifc";

export type SearchResultType = "file" | "project" | "suggestion";

export interface SearchResultFile {
  id: string;
  type: FileType;
  name: string;
  path: string;
  lastModified: string;
  size: string;
  matchType: "filename" | "content" | "property";
  matchDetails?: {
    propertyName?: string;
    propertyValue?: string;
    contentSnippet?: string;
  };
  thumbnail?: string;
  source?: "SketchUp" | "Tekla" | "Trimble Connect";
  projectIds: string[];
  relatedFileIds?: string[];
}

export interface SearchResultProject {
  id: string;
  name: string;
  description?: string;
  lastAccessed: string;
  matchingFiles: number;
  thumbnail?: string;
  fileIds: string[];
  relatedProjectIds?: string[];
}

export interface SearchSuggestion {
  id: string;
  type: "history" | "recommendation";
  query: string;
  timestamp?: string;
}

export interface SearchResult {
  type: SearchResultType;
  item: SearchResultFile | SearchResultProject | SearchSuggestion;
}

export interface SearchResults {
  query: string;
  totalResults: number;
  files: SearchResultFile[];
  projects: SearchResultProject[];
  suggestions: SearchSuggestion[];
}
