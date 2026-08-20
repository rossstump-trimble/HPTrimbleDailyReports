export function LoadingSpinnerAccess() {
  return (
    <div className="flex items-center justify-center h-[200px]">
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}
