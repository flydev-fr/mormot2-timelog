# mormot2-timelog

JavaScript module for converting mORMot2 TTimeLog values to/from JS Date objects and ISO strings.

## Installation

```bash
npm install mormot2-timelog
```

## Usage

```js
import { dateTimeToTimeLog, timeLogToDateTime, timeLogToISOString } from 'mormot2-timelog';

const now = new Date();
const timeLog = dateTimeToTimeLog(now);
console.log('TTimeLog:', timeLog);

const date = timeLogToDateTime(timeLog);
console.log('Date:', date.toISOString());

const isoString = timeLogToISOString(timeLog);
console.log('ISO String:', isoString);
```