import type { ServerHealth, MetricName } from '../types/metrics';

const serversState = new Map<string, ServerHealth>();

const failureProbabilities = new Map<string, number>();

const metricOverrides = new Map<string, Map<MetricName, number>>();

export function initServer(serverId: string): void {
  serversState.delete(serverId);
  failureProbabilities.set(serverId, 0.02);
  metricOverrides.delete(serverId);
  console.log(`[${serverId}] Server initialized in generator`);
}

export function removeServer(serverId: string): void {
  serversState.delete(serverId);
  failureProbabilities.delete(serverId);
  metricOverrides.delete(serverId);
  console.log(`[${serverId}] Server removed from generator`);
}

function nextValue(current: number, min: number, max: number, maxDelta: number): number {
  const delta = (Math.random() - 0.5) * 2 * maxDelta;
  let next = current + delta;
  
  if (next < min) return min;
  if (next > max) return max;
  
  return Number(next.toFixed(2));
}

export function setFailureProbability(serverId: string, probability: number): void {
  const clamped = Math.max(0, Math.min(1, probability));
  failureProbabilities.set(serverId, clamped);
  console.log(`[${serverId}] Failure probability set to ${(clamped * 100).toFixed(1)}%`);
}

export function getFailureProbability(serverId: string): number {
  return failureProbabilities.get(serverId) ?? 0.02;
}

export function setMetricOverride(serverId: string, metric: MetricName, value: number): void {
  if (!metricOverrides.has(serverId)) {
    metricOverrides.set(serverId, new Map());
  }
  metricOverrides.get(serverId)!.set(metric, value);
  console.log(`[${serverId}] Metric override: ${metric} = ${value}`);
}

export function releaseMetricOverride(serverId: string, metric: MetricName): void {
  metricOverrides.get(serverId)?.delete(metric);
  console.log(`[${serverId}] Metric override released: ${metric}`);
}

export function getMetricOverrides(serverId: string): Map<MetricName, number> | undefined {
  return metricOverrides.get(serverId);
}

function applyOverride(value: number, serverId: string, metric: MetricName): number {
  const overrides = metricOverrides.get(serverId);
  if (overrides?.has(metric)) {
    return overrides.get(metric)!;
  }
  return value;
}

export function generateMetrics(serverId: string): ServerHealth {
  const now = Math.floor(Date.now() / 1000);
  const previousState = serversState.get(serverId);
  const failureProbability = failureProbabilities.get(serverId) ?? 0.02;

  let newState: ServerHealth;

  if (!previousState) {
    newState = {
      serverId,
      timestamp: now,
      cpu: Number((10 + Math.random() * 10).toFixed(2)),
      temp: Number((40 + Math.random() * 5).toFixed(2)),
      memory: Number((2 + Math.random() * 2).toFixed(2)),
      network: {
        in_value: Number((Math.random() * 5).toFixed(2)),
        out_value: Number((Math.random() * 5).toFixed(2))
      },
      uptime: 0,
      status: "healthy"
    };
  } else {
    let cpu = nextValue(previousState.cpu, 0, 100, 5);
    let temp = nextValue(previousState.temp, 30, 95, 2);
    let memory = nextValue(previousState.memory, 0.5, 32, 0.5);
    let in_value = nextValue(previousState.network.in_value, 0, 1000, 20);
    let out_value = nextValue(previousState.network.out_value, 0, 1000, 20);

    if (Math.random() < failureProbability) {
      const failureType = Math.floor(Math.random() * 3);
      
      switch (failureType) {
        case 0: 
          cpu = 95 + Math.random() * 5;
          temp = 85 + Math.random() * 10;
          break;
        case 1: 
          memory = 30 + Math.random() * 2;
          break;
        case 2: 
          in_value = 0;
          out_value = 0;
          break;
      }
    }

    cpu = applyOverride(cpu, serverId, "cpu");
    temp = applyOverride(temp, serverId, "temp");
    memory = applyOverride(memory, serverId, "memory");
    in_value = applyOverride(in_value, serverId, "network_in");
    out_value = applyOverride(out_value, serverId, "network_out");

    const status = (cpu > 80 || temp > 75 || memory > 25) ? "warning" : "healthy";

    newState = {
      serverId,
      timestamp: now,
      cpu: Number(cpu.toFixed(2)),
      temp: Number(temp.toFixed(2)),
      memory: Number(memory.toFixed(2)),
      network: {
        in_value: Number(in_value.toFixed(2)),
        out_value: Number(out_value.toFixed(2))
      },
      uptime: previousState.uptime + 2,
      status
    };
  }

  serversState.set(serverId, newState);
  return newState;
}
