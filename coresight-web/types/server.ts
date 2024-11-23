export interface ServerDetails {
  id: string;
  name: string;
  ip_address: string;
  hostname: string;
  description: string;
  status: string;
}

export interface Metrics {
  cpu: {
    usage: number;
  };
  memory: {
    usage: number;
    used: number;
    total: number;
  };
  disk: {
    usage: number;
    used: number;
    total: number;
  };
  network: {
    bytes_sent: number;
    bytes_recv: number;
  };
}

export interface Process {
  pid: number;
  name: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
}
