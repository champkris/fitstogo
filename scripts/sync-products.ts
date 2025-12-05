import { runAllSyncs } from '../src/services/sync';

async function main() {
  console.log('Starting product sync...');
  console.log('Time:', new Date().toISOString());

  try {
    await runAllSyncs();
    console.log('Sync completed successfully!');
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  }
}

main();
