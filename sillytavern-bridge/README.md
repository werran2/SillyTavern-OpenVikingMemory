# SillyTavern Bridge Files

These files are the server-side bridge Giro implemented in `F:\SillyTavern`.

They are stored here so the standalone plugin project can review and evolve the bridge without forking the whole SillyTavern repository.

## Files

```text
sillytavern-bridge/src/endpoints/openviking.js
sillytavern-bridge/src/openviking/client.js
sillytavern-bridge/src/openviking/cleanup.js
sillytavern-bridge/src/openviking/routing.js
```

## Applying to SillyTavern

Copy the files into a SillyTavern checkout:

```text
src/endpoints/openviking.js
src/openviking/client.js
src/openviking/cleanup.js
src/openviking/routing.js
```

Then register the endpoint in `src/server-startup.js`:

```js
import { router as openVikingRouter } from './endpoints/openviking.js';
```

Mount it after the existing vector endpoint:

```js
app.use('/api/vector', vectorsRouter);
app.use('/api/openviking', openVikingRouter);
```

Add default config to `default/config.yaml`:

```yaml
openviking:
  baseUrl: 'http://127.0.0.1:1933'
  apiKey: ''
```

