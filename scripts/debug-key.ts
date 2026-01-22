
import { config } from '../server/src/appConfig/config.js';

console.log('--- DEBUG REPORT ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('VITE_GOOGLE_BROWSER_KEY via process.env:', process.env.VITE_GOOGLE_BROWSER_KEY ? 'Present' : 'MISSING');
console.log('VITE_GOOGLE_BROWSER_KEY via config:', config.VITE_GOOGLE_BROWSER_KEY ? 'Present' : 'MISSING');
if (config.VITE_GOOGLE_BROWSER_KEY) {
  console.log('Key Length:', config.VITE_GOOGLE_BROWSER_KEY.length);
  console.log('Key Start:', config.VITE_GOOGLE_BROWSER_KEY.substring(0, 4));
}
console.log('--------------------');
