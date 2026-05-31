export interface ServerHealth {
  cpu: number;
  temp: number;
  memory: number;
  network: {
    in_value: number;
    out_value: number;
  };
  status: string;
  timestamp: number;
  uptime: number;
  serverId: string;
}

export type MetricName = "cpu" | "temp" | "memory" | "network_in" | "network_out";

export type CommandType = "set_failure_probability" | "set_metric" | "release_metric";

export interface ControlCommand {
  server_id: string;
  command: CommandType;
  metric?: MetricName;
  value?: number;
}

export interface ServerConfig {
  id: string;
  name: string;
}

export interface SimulatorConfig {
  servers: ServerConfig[];
}

export type FleetCommandType = "create_server" | "delete_server";

export interface FleetCommand {
  command: FleetCommandType;
  server_id: string;
  name?: string;
}
