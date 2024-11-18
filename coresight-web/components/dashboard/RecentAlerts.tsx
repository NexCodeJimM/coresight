import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RecentAlertsProps extends React.HTMLAttributes<HTMLDivElement> {}

export function RecentAlerts({ className, ...props }: RecentAlertsProps) {
  return (
    <Card className={cn("col-span-3", className)} {...props}>
      <CardHeader>
        <CardTitle>Recent Alerts</CardTitle>
        <CardDescription>
          Latest system alerts and notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {alerts.map((alert, index) => (
            <div key={index} className="flex items-center">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant={getVariantFromSeverity(alert.severity)}>
                    {alert.severity}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {alert.timestamp}
                  </p>
                </div>
                <p className="text-sm font-medium leading-none">
                  {alert.message}
                </p>
                <p className="text-sm text-muted-foreground">{alert.server}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getVariantFromSeverity(
  severity: string
): "destructive" | "warning" | "default" {
  switch (severity.toLowerCase()) {
    case "critical":
      return "destructive";
    case "warning":
      return "warning";
    default:
      return "default";
  }
}

const alerts = [
  {
    severity: "Critical",
    message: "High CPU Usage Detected",
    server: "Production Server",
    timestamp: "2 minutes ago",
  },
  {
    severity: "Warning",
    message: "Memory Usage Above 80%",
    server: "Staging Server",
    timestamp: "15 minutes ago",
  },
  {
    severity: "Info",
    message: "Server Backup Completed",
    server: "Development Server",
    timestamp: "1 hour ago",
  },
];
