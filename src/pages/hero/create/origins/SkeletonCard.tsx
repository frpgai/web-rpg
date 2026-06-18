interface SkeletonCardProps {
  height?: number;
}

export function SkeletonCard({ height = 100 }: SkeletonCardProps) {
  return (
    <div
      className="origins-skeleton-card"
      style={{ height: `${height}px` }}
    />
  );
}
