import { config } from '../server/src/appConfig/config';
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('FIRESTORE_EMULATOR_HOST:', process.env.FIRESTORE_EMULATOR_HOST);
console.log('Validated Config GOOGLE_CLOUD_PROJECT:', config.GOOGLE_CLOUD_PROJECT);
