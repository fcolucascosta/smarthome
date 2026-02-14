import { TuyaContext } from '@tuya/tuya-connector-nodejs';

// Map of region codes to API base URLs
const REGION_URLS: Record<string, string> = {
    us: 'https://openapi.tuyaus.com',
    eu: 'https://openapi.tuyaeu.com',
    cn: 'https://openapi.tuyacn.com',
    in: 'https://openapi.tuyain.com',
};

const region = (process.env.TUYA_REGION || 'us').toLowerCase();
const baseUrl = REGION_URLS[region] || REGION_URLS['us'];

export const tuyaContext = new TuyaContext({
    baseUrl,
    accessKey: process.env.TUYA_CLIENT_ID || '',
    secretKey: process.env.TUYA_SECRET || '',
});
