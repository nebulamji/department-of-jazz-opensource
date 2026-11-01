# harmonic-lineage
Note → frequency → optical octave → wavelength → CIE 1931 → display colour, with the declared display policy returned in every result. Plus ITA2/RTTY encode and decode and the JS8-style tone rule (`./radio`).

```js
import {noteHz, frequencyColor} from '@department-of-jazz/harmonic-lineage';
frequencyColor(noteHz(69)); // A4: 440 Hz, 619.68 nm, hex #e1002d
```
A study of a correspondence, not a claim about perception. Colours outside sRGB are mapped by a stated rule, never hidden.
