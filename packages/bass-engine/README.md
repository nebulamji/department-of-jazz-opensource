# bass-engine
Chord-tone voice leading, chromatic approach and fingerboard position ranges for walking bass lines. Pure TypeScript, no data files, no API keys. Output is randomised by design.

Named-tune lookups are not bundled. Pass your own `StandardsSource`:
```ts
import {resolveNamedStandard} from './src/index.ts';
resolveNamedStandard('Blues for Alice in F', null, {lookup: t => myCharts[t] ?? null});
```
The hosted BassGPT service, its prompts and its chord corpus are separate and not part of this package.
