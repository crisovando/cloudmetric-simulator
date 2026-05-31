import {
  generateMetrics,
  setFailureProbability,
  getFailureProbability,
  setMetricOverride,
  releaseMetricOverride,
  getMetricOverrides,
  initServer,
  removeServer,
} from './generator';
import type { ServerHealth, MetricName } from '../types/metrics';

export interface SimulatedServer {
  id: string;
  name: string;
  getMetrics: () => ServerHealth;
  setFailureProbability: (probability: number) => void;
  getFailureProbability: () => number;
  setMetricOverride: (metric: MetricName, value: number) => void;
  releaseMetricOverride: (metric: MetricName) => void;
  getMetricOverrides: () => Map<MetricName, number> | undefined;
}

export function createSimulatedServer(id: string, name: string): SimulatedServer {
  initServer(id);
  return {
    id,
    name,
    getMetrics: () => generateMetrics(id),
    setFailureProbability: (probability: number) => setFailureProbability(id, probability),
    getFailureProbability: () => getFailureProbability(id),
    setMetricOverride: (metric: MetricName, value: number) => setMetricOverride(id, metric, value),
    releaseMetricOverride: (metric: MetricName) => releaseMetricOverride(id, metric),
    getMetricOverrides: () => getMetricOverrides(id),
  };
}

export function destroySimulatedServer(id: string): void {
  removeServer(id);
}
