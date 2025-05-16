# mormot2-timelog

![Latest Tag][LatestTagBadge]
![Build Status][BuildBadge]
![NPM Downloads][NPMDownloadsBadge]

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
[BuildBadge]: https://img.shields.io/github/actions/workflow/status/flydev-fr/mormot2-timelog/ci.yaml
[LatestTagBadge]: https://img.shields.io/github/v/tag/flydev-fr/mormot2-timelog
[NPMDownloadsBadge]: https://img.shields.io/npm/d18m/mormot2-timelog
