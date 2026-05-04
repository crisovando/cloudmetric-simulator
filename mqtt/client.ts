import mqtt from "mqtt";

export function createMqttClient(brokerUrl: string) {
  const client = mqtt.connect(brokerUrl);

  client.on("connect", () => {
    console.log("MQTT connected");
  });

  client.on("error", (err) => {
    console.error("MQTT error:", err);
  });

  return client;
}