import { createMetricGenerator } from "./generator";

export function createSimulatedServer(id: string) {
  const generate = createMetricGenerator();

  return {
    id,
    getMetrics: generate,
  };
}