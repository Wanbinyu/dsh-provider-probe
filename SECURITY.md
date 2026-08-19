# Security

Please report security issues privately through GitHub Security Advisories.

The plugin does not read credential storage or return model output to the
browser. Provider credentials remain inside the normal DSH adapter path. The
Host returns only route identity, timings, token usage, and redacted terminal
failure data. Redaction is defense in depth, not a guarantee; review diagnostic
text before publishing it.

