"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface ServerMetricsHistoryProps {
  metrics: any[];
  formatTimestamp: (timestamp: string) => string;
}

export function ServerMetricsHistory({
  metrics,
  formatTimestamp,
}: ServerMetricsHistoryProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short',
      day: 'numeric'
    });
  };

  const dates = metrics.map(m => formatDate(m.date));

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const date = new Date(metrics[context[0].dataIndex].date);
            return date.toLocaleDateString('en-US', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          },
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}%`,
        }
      }
    },
    scales: {
      x: {
        type: 'category',
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11
          },
          padding: 5
        }
      },
      y: {
        type: 'linear',
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  const getChartOptions = (title: string, maxY?: number): ChartOptions<'line'> => ({
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      title: { display: true, text: title }
    },
    scales: {
      ...chartOptions.scales,
      y: {
        ...(chartOptions.scales?.y ?? {}),
        max: maxY,
      }
    }
  });

  const cpuData: ChartData<'line'> = {
    labels: dates,
    datasets: [
      {
        label: 'CPU Usage',
        data: metrics.map(m => m.avg_cpu),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const memoryData: ChartData<'line'> = {
    labels: dates,
    datasets: [
      {
        label: 'Memory Usage',
        data: metrics.map(m => m.avg_memory),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const diskData: ChartData<'line'> = {
    labels: dates,
    datasets: [
      {
        label: 'Disk Usage',
        data: metrics.map(m => m.avg_disk),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const networkData: ChartData<'line'> = {
    labels: dates,
    datasets: [
      {
        label: 'Network In',
        data: metrics.map(m => m.avg_network_in),
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Network Out',
        data: metrics.map(m => m.avg_network_out),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>CPU Usage History</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Line 
            options={getChartOptions('Daily Average CPU Usage (%)', 100)} 
            data={cpuData} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Memory Usage History</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Line 
            options={getChartOptions('Daily Average Memory Usage (%)', 100)} 
            data={memoryData} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Disk Usage History</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Line 
            options={getChartOptions('Daily Average Disk Usage (%)', 100)} 
            data={diskData} 
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Traffic History</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <Line 
            options={getChartOptions('Daily Average Network Traffic (MB/s)')} 
            data={networkData} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
