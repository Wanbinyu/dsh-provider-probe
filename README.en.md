# dsh-provider-probe

English | [简体中文](README.md)

> Unofficial community plugin. It is not affiliated with or endorsed by DeepSeek.

Manual, low-cost model-provider connectivity checks for DeepSeek Harness Web. It sends one tiny real model request through the adapter already registered in DSH, then reports first-token latency, total latency, finish reason, token usage, or a redacted failure.

![dsh-provider-probe provider probe page](https://raw.githubusercontent.com/Wanbinyu/dsh-provider-probe/main/docs/images/dsh-provider-probe.png)

## Features

- Lists active provider routes and adapter model catalogs;
- Shows the active model route's declared text, image, or unknown input capabilities;
- Accepts a manually entered model ID when it is absent from the catalog;
- Sends requests only after an explicit click, with no background polling;
- Caps output at 8 tokens and enforces a 20-second timeout by default;
- Reports first-token latency, total latency, finish reason, and actual token usage;
- Preserves error codes, HTTP status, and request IDs while redacting common secrets and home paths;
- Classifies explicit credential, permission, model/endpoint, rate/quota, timeout, network, stream-compatibility, and provider 5xx failures with a suggested next step;
- Copies a paste-ready redacted diagnostic for an Issue or Discussion;
- Allows only one probe at a time and supports cancellation;
- Creates no session, writes no session log, and discards model output.

## Install

Requires Node.js `>=22.19` and DeepSeek Harness `0.1.0-rc.6` or later.

```bash
dsh plugin --profile web add https://github.com/Wanbinyu/dsh-provider-probe/releases/download/v0.3.0/dsh-provider-probe-0.3.0.tgz
```

Restart after installation or update:

```bash
dsh web
```

Open **Settings -> Provider probe**, choose a provider and model, then run the probe manually.

Uninstall:

```bash
dsh plugin --profile web remove dsh-provider-probe
```

## Configuration

```yaml
- insert:
    - id: provider-probe
      name: dsh-provider-probe
      config:
        timeoutMs: 20000
        maxTokens: 8
        maxMessageLength: 1200
```

| Option | Default | Description |
| --- | ---: | --- |
| `timeoutMs` | `20000` | Hard timeout per probe, from 1000 to 120000 ms |
| `maxTokens` | `8` | Maximum output tokens per probe, from 1 to 32 |
| `maxMessageLength` | `1200` | Maximum redacted failure length, from 256 to 8000 characters |

## Failure guidance

The plugin classifies the provider's HTTP status first, then explicit error codes and recognizable error wording. Guidance narrows the investigation only; it never changes provider configuration or retries automatically.

| Result | Suggested check |
| --- | --- |
| 401 / credentials | The API key exists, is current, and matches the endpoint |
| 403 / permission | Model access plus account and project permissions |
| 404 / model or endpoint | Base URL and model ID |
| 402, 429 / rate or quota | Reset window, quota, and billing status |
| Timeout / network | Provider health, DNS, proxy, firewall, and TLS |
| Stream compatibility | The endpoint's streaming/SSE format matches the DSH adapter |
| 5xx | Retry later and keep the request ID for provider support |

## Cost and privacy

The probe follows DSH's normal adapter and stored-provider configuration path, so a small model charge may apply. The plugin never reads or returns API keys. Model output is discarded; only timings, usage, and the terminal status remain.

Input capabilities come from the active DSH model route declaration. The plugin does not send an extra image, create an attachment, make another network request, or add a charge to verify that declaration. Copied diagnostics contain only the route, capabilities, timings, usage, and already-redacted failure shown on the page; review them before publishing.

Redaction is defense in depth and cannot guarantee coverage of every provider-specific secret format. Review diagnostics before publishing them.

## Development

```bash
npm install
npm run verify
```

`verify` runs Host/Web type checks, unit tests, the client build, and package-content validation. The browser bundle uses lightweight boundary codecs instead of embedding a second full copy of Zod for two Remote methods.

## Feedback

Please use [GitHub Issues](https://github.com/Wanbinyu/dsh-provider-probe/issues).

## License

[MIT](LICENSE)
