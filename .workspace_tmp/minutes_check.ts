import { DateTime } from "https://esm.sh/luxon@3.4.0";

const now = DateTime.fromISO('2026-01-04T22:15:00', { zone: 'Asia/Kolkata' }).toUTC();
const cls = DateTime.fromISO('2026-01-05T06:00:00', { zone: 'Asia/Kolkata' }).toUTC();
console.log('now (UTC):', now.toISO());
console.log('class (UTC):', cls.toISO());
console.log('minutes until:', Math.round(cls.diff(now, 'minutes').minutes));
