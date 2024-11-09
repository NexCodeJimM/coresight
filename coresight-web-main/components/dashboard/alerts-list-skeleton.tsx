import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AlertsListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[100px]" />
      </CardHeader>
      <CardContent>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="mb-4 last:mb-0">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-[140px]" />
              <Skeleton className="h-4 w-[60px]" />
            </div>
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
