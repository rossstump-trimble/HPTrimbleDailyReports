import { createRoot } from "react-dom/client";
import { DetachedViewport } from "../components/3d-viewer/DetachedViewport";

// Get the viewport data passed from the parent window
const { contentType, dataId } = window.viewportData;

// Create root and render the detached viewport
const root = createRoot(document.getElementById("viewport-root"));
root.render(<DetachedViewport contentType={contentType} dataId={dataId} />);
