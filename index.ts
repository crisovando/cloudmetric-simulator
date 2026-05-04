import { createMqttClient } from "./mqtt/client";
import { createSimulatedServer } from "./simulator/server";

const MQTT_BROKER = "mqtt://broker.hivemq.com:1883";
const DATA_TOPIC = "cloudmetric/simulator/health_data";
const CMD_TOPIC = "cloudmetric/simulator/commands";

const client = createMqttClient(MQTT_BROKER);

client.on("connect", () => {
  client.subscribe(CMD_TOPIC, { qos: 0 }, (err) => {
    if (err) {
      console.error("Error suscribiéndose al topic de comandos:", err);
    } else {
      console.log(`Suscrito a ${CMD_TOPIC}`);
    }
  });
});

client.on("message", (topic, message) => {
  if (topic === CMD_TOPIC) {
    console.log("Comando entrante:", message.toString());
  }
});

const servers = Array.from({ length: 5 }, (_, i) =>
  createSimulatedServer(`srv-${i}`),
);

const INTERVAL = 2000;

setInterval(() => {
  for (const server of servers) {
    const data = server.getMetrics();

    client.publish(
      DATA_TOPIC,
      JSON.stringify({ health: data, serverId: server.id }),
    );
    console.log(server.id, data);
  }
}, INTERVAL);
