import { Skeleton } from "@/components/ui/skeleton";

export default function ServerDetailLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-4 w-[180px]" />
          </div>
          <Skeleton className="h-10 w-[120px]" />
        </div>
      </div>

      <div className="grid gap-6">
        {/* Metrics Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 border rounded-lg">
              <Skeleton className="h-4 w-[100px] mb-2" />
              <Skeleton className="h-8 w-[80px]" />
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <div className="border rounded-lg p-4">
            <Skeleton className="h-4 w-[140px] mb-4" />
            <Skeleton className="h-[200px] w-full" />
          </div>
          <div className="border rounded-lg p-4">
            <Skeleton className="h-4 w-[140px] mb-4" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
