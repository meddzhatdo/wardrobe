import { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

export const DEFAULT_CITY = 'New York';
export const DEFAULT_LAT  = 40.7128;
export const DEFAULT_LON  = -74.006;

export function wmoCondition(code) {
  if (code <= 1)  return { label: 'Clear',         Icon: Sun,            bg: 'linear-gradient(160deg,#1565C0,#1E88E5 55%,#42A5F5)' };
  if (code === 2) return { label: 'Partly Cloudy', Icon: CloudSun,       bg: 'linear-gradient(160deg,#1976D2,#546E7A)' };
  if (code === 3) return { label: 'Overcast',      Icon: Cloud,          bg: 'linear-gradient(160deg,#37474F,#546E7A)' };
  if (code <= 48) return { label: 'Foggy',         Icon: CloudFog,       bg: 'linear-gradient(160deg,#455A64,#78909C)' };
  if (code <= 57) return { label: 'Drizzle',       Icon: CloudDrizzle,   bg: 'linear-gradient(160deg,#1A237E,#1565C0)' };
  if (code <= 67) return { label: 'Rain',          Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' };
  if (code <= 77) return { label: 'Snow',          Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' };
  if (code <= 82) return { label: 'Showers',       Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' };
  if (code <= 86) return { label: 'Snow Showers',  Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' };
  return           { label: 'Thunderstorm',        Icon: CloudLightning, bg: 'linear-gradient(160deg,#1A1A2E,#0F3460)' };
}

// Label → icon/bg used by the static preview weather card (mirrors wmoCondition without WMO codes).
export const CONDITION_LABEL_META = {
  'Clear':        { Icon: Sun,            bg: 'linear-gradient(160deg,#1565C0,#1E88E5 55%,#42A5F5)' },
  'Partly Cloudy':{ Icon: CloudSun,       bg: 'linear-gradient(160deg,#1976D2,#546E7A)' },
  'Overcast':     { Icon: Cloud,          bg: 'linear-gradient(160deg,#37474F,#546E7A)' },
  'Foggy':        { Icon: CloudFog,       bg: 'linear-gradient(160deg,#455A64,#78909C)' },
  'Drizzle':      { Icon: CloudDrizzle,   bg: 'linear-gradient(160deg,#1A237E,#1565C0)' },
  'Rain':         { Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' },
  'Snow':         { Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' },
  'Showers':      { Icon: CloudRain,      bg: 'linear-gradient(160deg,#0D47A1,#1976D2)' },
  'Snow Showers': { Icon: CloudSnow,      bg: 'linear-gradient(160deg,#263238,#37474F 55%,#546E7A)' },
  'Thunderstorm': { Icon: CloudLightning, bg: 'linear-gradient(160deg,#1A1A2E,#0F3460)' },
};

export function fmtHour(ms) {
  const h = new Date(ms).getHours();
  if (h === 0)  return '12am';
  if (h < 12)  return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}
