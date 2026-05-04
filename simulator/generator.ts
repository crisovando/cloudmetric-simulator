import type { Metrics } from "@/types/metrics";

export function createMetricGenerator() {
  let cpu = 30;
  let temp = 50;
  let memory = 40;
  let netIn = 100;
  let netOut = 80;

  const serverStartTime = Date.now();

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const drift = (value: number, delta: number, min: number, max: number) => {
    const change = (Math.random() - 0.5) * delta;
    return clamp(value + change, min, max);
  };

  return function generate(): Metrics {
    cpu = drift(cpu, 10, 0, 100);
    temp = drift(temp, 5, 30, 90);
    memory = drift(memory, 8, 10, 95);
    netIn = drift(netIn, 50, 0, 1000);
    netOut = drift(netOut, 50, 0, 1000);

    return {
      cpu: Number(cpu.toFixed(2)),
      temp: Number(temp.toFixed(2)),
      memory: Number(memory.toFixed(2)),
      network: {
        in_value: Number(netIn.toFixed(2)),
        out_value: Number(netOut.toFixed(2)),
      },
      status: cpu > 80 || temp > 80 ? "warning" : "ok",
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - serverStartTime) / 1000),
    };
  };
}