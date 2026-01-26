module.exports = async () => {
  console.log('\n🔥 Stopping Firebase Emulator...\n');

  if (global.__EMULATOR__) {
    global.__EMULATOR__.kill();
    console.log('✅ Firebase Emulator stopped\n');
  }
};
