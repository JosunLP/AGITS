/**
 * AGITS Demo Runner
 * Entry point for demonstrating AGITS capabilities
 */

import AGITSDemo from './agits-demo.js';
import { Logger } from './utils/logger.js';

async function runDemo(): Promise<void> {
  const logger = new Logger('DemoRunner');
  let demo: AGITSDemo | null = null;

  try {
    logger.info(`
╔══════════════════════════════════════════════════════════════╗
║    🚀 AGITS - Advanced General Intelligence Technological    ║
║                         System Demo                          ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Create and start demo
    demo = new AGITSDemo();
    await demo.start();

    // Keep demo running for a while
    logger.info('Demo is running... Press Ctrl+C to stop.');

    // Wait for exit signal
    process.on('SIGINT', async () => {
      logger.info('\nReceived interrupt signal. Stopping demo...');
      if (demo) {
        await demo.stop();
      }
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('\nReceived termination signal. Stopping demo...');
      if (demo) {
        await demo.stop();
      }
      process.exit(0);
    });

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    logger.error('Demo failed:', error);
    if (demo) {
      await demo.stop();
    }
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDemo().catch(console.error);
}

export { runDemo };
