const DATA_HEALTH_TOPIC = "cloudmetric/simulator/health";

export const healthTopic = (serverId: string): string => {
    return `${DATA_HEALTH_TOPIC}/${serverId}`;
}
