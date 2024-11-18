import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ServerStatusListProps extends React.HTMLAttributes<HTMLDivElement> {}

export function ServerStatusList({
  className,
  ...props
}: ServerStatusListProps) {
  return (
    <Card className={cn("col-span-4", className)} {...props}>
      <CardHeader>
        <CardTitle>Server Status</CardTitle>
        <CardDescription>Overview of all monitored servers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {servers.map((server) => (
            <div key={server.name} className="flex items-center">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-none">
                    {server.name}
                  </p>
                  <Badge
                    variant={
                      server.status === "online" ? "default" : "destructive"
                    }
                  >
                    {server.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Progress value={server.cpu} className="w-[60%]" />
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 text-sm">CPU {server.cpu}%</div>
                    <div className="w-16 text-sm">RAM {server.memory}%</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const servers = [
  {
    name: "Production Server",
    status: "online",
    cpu: 45,
    memory: 62,
  },
  {
    name: "Staging Server",
    status: "online",
    cpu: 32,
    memory: 48,
  },
  {
    name: "Development Server",
    status: "offline",
    cpu: 0,
    memory: 0,
  },
];
