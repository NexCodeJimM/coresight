import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ServersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[140px]" />
      </CardHeader>
      <CardContent>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 mb-4 last:mb-0">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[160px]" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
