import type { CSSProperties } from "react";
import { WorkflowLayout } from "../workflow-layout";
import { RAW_ICONS } from "@/lib/icons";

function SkeletonBar({
  className,
  style,
}: {
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-md bg-(--surface-3) animate-pulse ${className ?? ""}`}
      style={style}
    />
  );
}

export default function ProjectListSkeleton() {
  return (
    <WorkflowLayout windowSvg={RAW_ICONS.RubiksCube} windowTitle="Projects">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="shrink-0 border-b border-(--border) px-4 py-3 flex items-center justify-between">
          <div className="space-y-1.5">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-4 w-32" />
          </div>
          <SkeletonBar className="h-8 w-28" />
        </div>
        <div className="flex-1 p-4 ef-workspace-inner">
          <div className="ef-card overflow-hidden">
            <div className="border-b border-(--border) bg-(--surface-2) px-3 py-2.5 flex gap-6">
              {[88, 56, 48, 48, 32].map((w, i) => (
                <SkeletonBar key={i} style={{ width: `${w}px` }} className="h-3" />
              ))}
            </div>
            <div className="divide-y divide-(--border)">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-3">
                  <SkeletonBar className="h-4 flex-1 max-w-[180px]" />
                  <SkeletonBar className="h-4 w-20 hidden lg:block" />
                  <SkeletonBar className="h-5 w-16 hidden lg:block" />
                  <SkeletonBar className="h-4 w-14" />
                  <SkeletonBar className="h-4 w-8" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WorkflowLayout>
  );
}
