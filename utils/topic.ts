const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || "cloudmetric";

export const DATA_HEALTH_TOPIC = `${TOPIC_PREFIX}/simulator/health`;

export const healthTopic = (serverId: string): string => {
    return `${DATA_HEALTH_TOPIC}/${serverId}`;
}
