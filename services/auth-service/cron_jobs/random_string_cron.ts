import cron from 'node-cron';
import { randomBytes } from 'crypto';
import { randomKeysRepository } from '../repositories/index';
import { RandomKeyInput } from '../types';

const timeZone = 'Asia/Kolkata';
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const alphabetLength = alphabet.length;

// Generate a 6-character random string using crypto
// function generateRandomString(length: number = 9): string {
//     const bytes = randomBytes(length);
//     let result = '';
//     for (let i = 0; i < length; i++) {
//         const index = bytes[i] % alphabetLength;
//         result += alphabet.charAt(index);
//     }
//     return result;
// }

// export async function generateRandomStrings() {

//     let insertedCount = await randomKeysRepository.getFalseStatusCount();
//     const target = 500_000;
//     const batchSize = 10000;

//     while (insertedCount < target) {
//         const keys = new Set<string>();
//         while (keys.size < batchSize) {
//             keys.add(generateRandomString());
//         }
//         const inserted = await randomKeysRepository.bulkInsertWithIgnore(
//             Array.from(keys).map(key => new RandomKeyInput({ randomKey: key }))
//         );
//         insertedCount = await randomKeysRepository.getFalseStatusCount();
//         console.log(`Inserted: ${inserted}, Total so far: ${insertedCount}`);
//     }
// }


// const randomStringTask = cron.schedule(
//     '* * * * *',
//     () => {
//         generateRandomStrings().catch((err) => {
//             console.error('Error in generateRandomStrings:', err);
//         });
//     },
//     { timezone: timeZone }
// );

// export default randomStringTask;
