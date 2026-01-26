const { exec } = require('child_process');

module.exports = async () => {
  console.log('\n🔥 Starting Firebase Emulator...\n');

  // Set emulator host for tests
  process.env.FIREBASE_DATABASE_EMULATOR_HOST = 'localhost:9000';

  return new Promise((resolve, reject) => {
    // Start the emulator
    const emulator = exec(
      'firebase emulators:start --only database --project test-project',
    );

    let started = false;

    emulator.stdout.on('data', (data) => {
      console.log(data.toString());

      // Wait for the emulator to be ready
      if (data.toString().includes('All emulators ready') && !started) {
        started = true;
        console.log('✅ Firebase Emulator ready\n');
        // Store the process so we can kill it later
        global.__EMULATOR__ = emulator;
        setTimeout(resolve, 1000);
      }
    });

    emulator.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    emulator.on('error', (error) => {
      console.error('Failed to start emulator:', error);
      reject(error);
    });

    // Timeout after 30 seconds
    setTimeout(() => {
      if (!started) {
        console.error('❌ Emulator failed to start within 30 seconds');
        emulator.kill();
        reject(new Error('Emulator startup timeout'));
      }
    }, 30000);
  });
};
