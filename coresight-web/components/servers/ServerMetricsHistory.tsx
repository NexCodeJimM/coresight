"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ServerMetricsHistoryProps {
  metrics: any[];
  formatTimestamp: (timestamp: string) => string;
}

export function ServerMetricsHistory({
  metrics,
  formatTimestamp,
}: ServerMetricsHistoryProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>CPU & Memory History</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip
                labelFormatter={formatTimestamp}
                formatter={(value: number) => [`${value.toFixed(1)}%`]}
              />
              <Line
                type="monotone"
                dataKey="cpu_usage"
                stroke="#8884d8"
                name="CPU"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="memory_usage"
                stroke="#82ca9d"
                name="Memory"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network History</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics}>
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTimestamp}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis tickFormatter={(value) => `${value}MB/s`} />
              <Tooltip
                labelFormatter={formatTimestamp}
                formatter={(value: number) => [`${value.toFixed(2)}MB/s`]}
              />
              <Line
                type="monotone"
                dataKey="network_in"
                stroke="#82ca9d"
                name="Download"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="network_out"
                stroke="#8884d8"
                name="Upload"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
