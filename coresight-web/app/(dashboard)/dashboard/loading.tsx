import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      {/* Stats Grid Loading */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-8 w-[60px] mt-2" />
            <Skeleton className="h-3 w-[120px] mt-2" />
          </div>
        ))}
      </div>

      {/* Server Status and Alerts Loading */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
        {/* Server Status Loading */}
        <div className="col-span-4 rounded-lg border p-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-[140px]" />
            <Skeleton className="h-4 w-[180px]" />
            <div className="space-y-8 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[60px]" />
                  </div>
                  <Skeleton className="h-2 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alerts Loading */}
        <div className="col-span-3 rounded-lg border p-4">
          <div className="space-y-3">
            <Skeleton className="h-5 w-[100px]" />
            <Skeleton className="h-4 w-[160px]" />
            <div className="space-y-6 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[100px]" />
                  </div>
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[140px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
