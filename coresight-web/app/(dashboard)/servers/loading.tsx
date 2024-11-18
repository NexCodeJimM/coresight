import { Skeleton } from "@/components/ui/skeleton";

export default function ServersLoading() {
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <Skeleton className="h-8 w-[150px]" />
        <Skeleton className="h-10 w-[120px]" />
      </div>

      <div className="rounded-md border">
        <div className="p-4">
          <div className="space-y-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
                <div className="flex items-center gap-4">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
