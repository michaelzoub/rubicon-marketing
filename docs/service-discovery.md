# Service Discovery

Rubicon is a discoverable marketplace of metered services for agents.

Agents do not route directly to a provider. They discover services, choose a stable service ID, and open a budgeted streaming session through the gateway.

## Provider vs Service

A provider is the company, runtime, or compute platform that wraps an existing API with the Rubicon Provider SDK.

A service is a specific metered capability exposed by that provider. Each service has a stable ID, pricing, metering unit, capabilities, input metadata, output metadata, and status.

Provider routing details and credentials stay private to the gateway. Discovery APIs only return public service metadata.

## Discovery Flow

1. Provider registers a service with a stable ID.
2. Agent calls `GET /api/services` to list active services.
3. Agent calls `GET /api/services/:serviceId` for details.
4. Agent starts a paid stream with `POST /api/sessions`.

```http
GET /api/services
```

```http
GET /api/services/gpu-image-generation
```

```http
POST /api/sessions
Content-Type: application/json

{
  "serviceId": "gpu-image-generation",
  "input": {
    "prompt": "A river crossing rendered as infrastructure"
  },
  "maxSpend": "0.10"
}
```

The gateway looks up the service, loads its pricing and metering rules, resolves private provider routing, and creates the metered session.

## Seed Service

The local registry includes one active service:

- `gpu-image-generation`
- Provider: `caliga-compute`
- Unit: `gpu_second`
- Price: `$0.001` per unit
- Gateway fee: `0.01%`

Future providers add more services by registering new provider and service records with the Provider SDK.
