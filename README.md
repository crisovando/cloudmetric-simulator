# cloudmetric-simulator

Simulador de servidores que genera métricas de salud (CPU, temperatura, memoria, red) y las publica en un broker MQTT para consumo dentro del ecosistema **cloudmetric**.

## Requisitos

- [Bun](https://bun.sh) >= 1.0

## Instalación

```bash
bun install
```

## Uso

```bash
bun run index.ts
```

El script levanta **5 servidores simulados** y comienza a publicar métricas cada **2 segundos** en el topic `cloudmetric/simulator/health_data`. También se suscribe al topic `cloudmetric/simulator/commands` para recibir comandos.

## Arquitectura

```
index.ts  (orquestador)
  ├── mqtt/client.ts       → conexión MQTT (broker)
  ├── simulator/server.ts  → fábrica de servidores virtuales
  │     └── simulator/generator.ts  → motor de generación de métricas
  └── types/metrics.ts     → definiciones de tipos
```

### Flujo de datos

```
generator.ts (estado interno con deriva aleatoria)
  → server.getMetrics()
    → index.ts (serializa JSON con serverId + métricas)
      → mqtt/client.ts (publica en broker MQTT)
        → mqtt://broker.hivemq.com:1883
```

Cada `MetricGenerator` mantiene un estado interno para CPU, temperatura, memoria y redes. En cada tick aplica una deriva aleatoria, clamp ea los valores dentro de rangos realistas y calcula:

- `status`: `"warning"` si CPU > 80 o temperatura > 80, sino `"ok"`
- `timestamp`: ISO actual
- `uptime`: segundos desde la creación del generador

## Estructura del proyecto

| Archivo | Responsabilidad |
|---|---|
| `index.ts` | Punto de entrada. Crea el cliente MQTT, 5 servidores simulados, y un intervalo que publica métricas cada 2s. |
| `mqtt/client.ts` | Wrapper sobre la librería [`mqtt`](https://npmjs.com/package/mqtt). Exporta `createMqttClient(brokerUrl)`. |
| `simulator/server.ts` | Fábrica `createSimulatedServer(id)` que retorna un objeto con `id` y `getMetrics()`. |
| `simulator/generator.ts` | `createMetricGenerator()` retorna una clausura que genera métricas con deriva aleatoria y rangos realistas. |
| `types/metrics.ts` | Interfaz `Metrics`: `cpu`, `temp`, `memory`, `network.in_value`, `network.out_value`, `status`, `timestamp`, `uptime`. |

## Topics MQTT

| Topic | Dirección | Descripción |
|---|---|---|
| `cloudmetric/simulator/health_data` | Publicación | Payload JSON con métricas cada 2s |
| `cloudmetric/simulator/commands` | Suscripción | Comandos entrantes (se loguean en consola) |

## Configuración

Actualmente todo está hardcodeado en `index.ts`:

| Variable | Valor | Descripción |
|---|---|---|
| `MQTT_BROKER` | `mqtt://broker.hivemq.com:1883` | Broker MQTT público (HiveMQ) |
| `DATA_TOPIC` | `cloudmetric/simulator/health_data` | Topic de publicación |
| `CMD_TOPIC` | `cloudmetric/simulator/commands` | Topic de suscripción |
| `INTERVAL` | `2000` | Intervalo de publicación (ms) |
| `SERVER_COUNT` | `5` | Cantidad de servidores simulados |

## Dependencias

### Producción

| Paquete | Versión | Uso |
|---|---|---|
| [`mqtt`](https://npmjs.com/package/mqtt) | ^5.15.1 | Cliente MQTT |

### Desarrollo

| Paquete | Uso |
|---|---|
| `@types/bun` | Tipos de Bun para TypeScript |
| `typescript` ^5 | Type-checking |

## Notas técnicas

- El proyecto usa **Bun** como runtime, no Node.js. Bun ejecuta TypeScript directamente sin compilación previa.
- `tsconfig.json` tiene `noEmit: true` y module resolution modo bundler.
- Se usa el alias `@/*` mapeado a `./src/*` (aunque actualmente los imports desde `src/` no existen — Bun resuelve los paths correctamente).
- El broker HiveMQ es público y no requiere autenticación. No usar en producción con datos sensibles.
