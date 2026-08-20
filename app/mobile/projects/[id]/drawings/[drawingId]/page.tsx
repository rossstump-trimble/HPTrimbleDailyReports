import dynamic from "next/dynamic";

const DrawingViewerScreen = dynamic(
  () => import("@/components/mobile/DrawingViewerScreen"),
  { ssr: false }
);

interface Props {
  params: { id: string; drawingId: string };
}

export default function DrawingViewerPage({ params }: Props) {
  return (
    <DrawingViewerScreen
      projectId={params.id}
      drawingId={params.drawingId}
    />
  );
}
