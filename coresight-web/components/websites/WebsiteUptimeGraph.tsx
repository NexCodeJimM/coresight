"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
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

interface UptimeHistory {
  status: "up" | "down";
  response_time: number | null;
  timestamp: string;
}

interface WebsiteUptimeGraphProps {
  data: UptimeHistory[];
}

export function WebsiteUptimeGraph({ data }: WebsiteUptimeGraphProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    });
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        callbacks: {
          title: (context) => {
            const dataPoint = data[context[0].dataIndex];
            return formatDate(dataPoint.timestamp);
          },
          label: (context) => {
            const dataPoint = data[context.dataIndex];
            if (context.dataset.label === 'Status') {
              return `Status: ${dataPoint.status === 'up' ? 'Online' : 'Offline'}`;
            }
            return `Response Time: ${dataPoint.response_time?.toFixed(0) || 'N/A'} ms`;
          },
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
          maxRotation: 45,
          minRotation: 45,
          callback: (value, index) => formatDate(data[index].timestamp),
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        title: {
          display: true,
          text: 'Response Time (ms)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        max: 1,
        ticks: {
          callback: (value) => value === 1 ? 'Online' : 'Offline',
        },
        grid: {
          display: false,
        },
      }
    },
  };

  const chartData: ChartData<'line'> = {
    labels: data.map(d => d.timestamp),
    datasets: [
      {
        label: 'Response Time',
        data: data.map(d => d.response_time || 0),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        yAxisID: 'y',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Status',
        data: data.map(d => d.status === 'up' ? 1 : 0),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        yAxisID: 'y1',
        stepped: true,
        tension: 0,
      }
    ],
  };

  return (
    <div className="h-[400px]">
      <Line 
        options={chartOptions} 
        data={chartData}
      />
    </div>
  );
} 