import { createMqttClient } from "./mqtt/client";
import { createSimulatedServer, destroySimulatedServer, type SimulatedServer } from "./simulator/server";
import { healthTopic } from "./utils/topic";
import type { ControlCommand, SimulatorConfig, FleetCommand } from "./types/metrics";

const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || "cloudmetric";
const MQTT_BROKER = process.env.MQTT_BROKER || "mqtt://broker.hivemq.com:1883";
const CONTROL_TOPIC_WILDCARD = `${TOPIC_PREFIX}/simulator/control/+`;
const CONFIG_TOPIC = `${TOPIC_PREFIX}/simulator/config`;
const FLEET_TOPIC = `${TOPIC_PREFIX}/simulator/fleet`;

const client = createMqttClient(MQTT_BROKER);

const servers = new Map<string, SimulatedServer>();

function parseControlTopic(topic: string): string | null {
  const parts = topic.split('/');
  if (parts.length === 4 && parts[0] === TOPIC_PREFIX && parts[1] === 'simulator' && parts[2] === 'control' && parts[3]) {
    return parts[3];
  }
  return null;
}

function addServer(id: string, name: string): void {
  if (servers.has(id)) {
    console.log(`[${id}] Server already exists, skipping`);
    return;
  }
  const server = createSimulatedServer(id, name);
  servers.set(id, server);
  console.log(`[${id}] Server "${name}" added (total: ${servers.size})`);
}

function deleteServer(id: string): void {
  if (!servers.has(id)) {
    console.log(`[${id}] Server not found, skipping delete`);
    return;
  }
  destroySimulatedServer(id);
  servers.delete(id);
  console.log(`[${id}] Server deleted (total: ${servers.size})`);
}

function handleConfigMessage(payload: string): void {
  try {
    const config: SimulatorConfig = JSON.parse(payload);
    console.log(`Received config with ${config.servers.length} servers`);

    const configIds = new Set(config.servers.map(s => s.id));

    for (const id of servers.keys()) {
      if (!configIds.has(id)) {
        deleteServer(id);
      }
    }

    for (const serverConfig of config.servers) {
      addServer(serverConfig.id, serverConfig.name);
    }
  } catch (err) {
    console.error("Failed to parse config snapshot:", err);
  }
}

function handleFleetCommand(command: FleetCommand): void {
  switch (command.command) {
    case "create_server":
      if (command.name) {
        addServer(command.server_id, command.name);
      }
      break;
    case "delete_server":
      deleteServer(command.server_id);
      break;
    default:
      console.error(`Unknown fleet command: ${command.command}`);
  }
}

function handleControlCommand(command: ControlCommand): void {
  const server = servers.get(command.server_id);
  if (!server) {
    console.error(`Server not found: ${command.server_id}`);
    return;
  }

  switch (command.command) {
    case "set_failure_probability":
      if (command.value !== undefined) {
        server.setFailureProbability(command.value);
      }
      break;
    case "set_metric":
      if (command.metric && command.value !== undefined) {
        server.setMetricOverride(command.metric, command.value);
      }
      break;
    case "release_metric":
      if (command.metric) {
        server.releaseMetricOverride(command.metric);
      }
      break;
    default:
      console.error(`Unknown command: ${command.command}`);
  }
}

client.on("connect", () => {
  client.subscribe(
    [CONTROL_TOPIC_WILDCARD, CONFIG_TOPIC, FLEET_TOPIC],
    { qos: 0 },
    (err) => {
      if (err) {
        console.error("Error subscribing to topics:", err);
      } else {
        console.log(`Subscribed to control, config, and fleet topics (prefix: ${TOPIC_PREFIX})`);
      }
    }
  );
});

client.on("message", (topic, message) => {
  const payload = message.toString();

  if (topic === CONFIG_TOPIC) {
    handleConfigMessage(payload);
    return;
  }

  if (topic === FLEET_TOPIC) {
    try {
      const command: FleetCommand = JSON.parse(payload);
      handleFleetCommand(command);
    } catch (err) {
      console.error("Failed to parse fleet command:", err);
    }
    return;
  }

  const serverId = parseControlTopic(topic);
  if (serverId) {
    try {
      const command: ControlCommand = JSON.parse(payload);
      handleControlCommand(command);
    } catch (err) {
      console.error("Failed to parse control command:", err);
    }
  }
});

const INTERVAL = 2000;

setInterval(() => {
  if (client.connected) {
    for (const server of servers.values()) {
      const data = server.getMetrics();
      const payload = JSON.stringify(data);
      client.publish(healthTopic(server.id), payload);
    }
  }
}, INTERVAL);
