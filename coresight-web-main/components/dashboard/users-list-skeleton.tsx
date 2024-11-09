import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UsersListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-[100px]" />
        <Skeleton className="h-4 w-[200px]" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-[150px] mb-2" />
                  <Skeleton className="h-3 w-[200px]" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-6 w-[60px]" />
                <Skeleton className="h-8 w-[90px]" />
                <Skeleton className="h-8 w-[70px]" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
