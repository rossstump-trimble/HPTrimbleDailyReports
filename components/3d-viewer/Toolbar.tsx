/**
 * Re-export of ThreeDViewerTopToolbar to maintain backward compatibility
 * for existing imports while transitioning to the new component name.
 */

import { ThreeDViewerTopToolbar } from "./3DViewerTopToolbar";

export const Toolbar = ThreeDViewerTopToolbar;
export type {
  WorkspaceType,
  ViewportLayoutType,
  ThreeDViewerTopToolbarProps as ToolbarProps,
} from "./3DViewerTopToolbar";
