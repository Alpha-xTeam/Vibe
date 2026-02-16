/**
 * SkeletonPost - Loading placeholder for PostCard
 * Matches the layout of PostCard.tsx to prevent UI flickering.
 */
export function SkeletonPost() {
  return (
    <div className="bg-surface border border-line rounded-2xl overflow-hidden animate-pulse">
      <div className="px-4 sm:px-5 pt-4 pb-3">
        {/* Author Row */}
        <div className="flex items-start gap-3">
          {/* Avatar Skeleton */}
          <div className="w-10 h-10 rounded-full bg-line shrink-0" />
          
          <div className="flex-1 min-w-0">
            {/* Name + Meta Skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-4 w-24 bg-line rounded-md" />
              <div className="h-3 w-16 bg-line/50 rounded-md" />
            </div>
            {/* AI Badge Skeleton */}
            <div className="h-3 w-32 bg-line/30 rounded-md mt-1.5" />
          </div>
        </div>

        {/* Post Body Skeleton */}
        <div className="mt-3 ml-[52px]">
          {/* Text Content Skeleton */}
          <div className="space-y-2">
            <div className="h-3.5 w-full bg-line/40 rounded-md" />
            <div className="h-3.5 w-[90%] bg-line/40 rounded-md" />
            <div className="h-3.5 w-[40%] bg-line/40 rounded-md" />
          </div>

          {/* Action Row Skeleton */}
          <div className="flex items-center justify-between mt-5 -ml-2">
            <div className="flex items-center gap-4">
              <div className="h-8 w-12 bg-line/30 rounded-full" />
              <div className="h-8 w-12 bg-line/30 rounded-full" />
              <div className="h-8 w-12 bg-line/30 rounded-full" />
              <div className="h-8 w-12 bg-line/30 rounded-full" />
            </div>
            <div className="h-8 w-8 bg-line/30 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}