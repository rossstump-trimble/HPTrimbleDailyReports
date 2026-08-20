interface Props {
  module: string;
}

export function NoProjectSelected({ module }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
      <p className="text-muted-foreground text-sm">
        Select a project to view the {module} module.
      </p>
    </div>
  );
}
