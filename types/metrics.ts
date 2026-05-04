export interface Metrics {
  cpu: number;
  temp: number;
  memory: number;
  network: {
    in_value: number;
    out_value: number;
  };
  status: string;
  timestamp: string;
  uptime: number;
};
