import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ServerStatusProps {
  status: "active" | "inactive" | "maintenance";
}

export function ServerStatus({ status }: ServerStatusProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize",
        status === "active" && "border-green-500 text-green-500",
        status === "inactive" && "border-red-500 text-red-500",
        status === "maintenance" && "border-yellow-500 text-yellow-500"
      )}
    >
      {status}
    </Badge>
  );
}
