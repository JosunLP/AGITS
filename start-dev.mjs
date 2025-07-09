/**
 * Development starter - bypasses .js import issues
 */
import { AGITSPlatform } from './src/index';

async function start() {
  const platform = new AGITSPlatform();
  await platform.start();
}

start().catch(console.error);
