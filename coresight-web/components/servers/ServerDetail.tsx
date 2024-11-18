"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ServerDetailProps {
  serverId: string;
}

export function ServerDetail({ serverId }: ServerDetailProps) {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch(`/api/servers/${serverId}/metrics`);
      const data = await response.json();
      setMetrics(data);
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000);

    return () => clearInterval(interval);
  }, [serverId]);

  const chartData = {
    labels: metrics.timestamps,
    datasets: [
      {
        label: "CPU Usage",
        data: metrics.cpu,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard title="CPU" value={`${metrics.currentCpu}%`} />
        <MetricCard title="Memory" value={`${metrics.currentMemory}%`} />
        <MetricCard title="Disk" value={`${metrics.currentDisk}%`} />
        <MetricCard title="Network" value={`${metrics.currentNetwork} MB/s`} />
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <Line data={chartData} />
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-semibold mt-2">{value}</p>
    </div>
  );
}
