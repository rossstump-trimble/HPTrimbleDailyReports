declare module "three/examples/jsm/controls/OrbitControls" {
  export class OrbitControls {
    constructor(camera: any, element?: HTMLElement);
    update(): void;
    dispose(): void;
    enableZoom: boolean;
    enablePan: boolean;
    enableDamping: boolean;
    rotateSpeed: number;
    target: any;
  }
}

declare module "three/examples/jsm/loaders/GLTFLoader" {
  export class GLTFLoader {
    load(
      url: string,
      onLoad: (gltf: any) => void,
      onProgress?: (event: any) => void,
      onError?: (event: any) => void
    ): void;
  }
}

declare module "react-frappe-gantt" {
  export interface GanttTaskInput {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies?: string;
  }
  export class Task {
    constructor(input: GanttTaskInput);
  }
  export enum ViewMode {
    QuarterDay = "Quarter Day",
    HalfDay = "Half Day",
    Day = "Day",
    Week = "Week",
    Month = "Month",
    Year = "Year",
  }
  export interface FrappeGanttProps {
    tasks: Task[];
    viewMode?: ViewMode;
    onTasksChange?: (tasks: Task[]) => void;
    onClick?: (task: Task) => void;
    onDateChange?: (task: Task, start: Date, end: Date) => void;
    onProgressChange?: (task: Task, progress: number) => void;
  }
  export const FrappeGantt: React.FC<FrappeGanttProps>;
}
