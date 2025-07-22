/**
 * Standalone AGITS Demo Runner
 * Entry point for standalone demonstration without external dependencies
 */

import StandaloneAGITSDemo from './standalone-demo.js';
import { Logger } from './utils/logger.js';

async function runStandaloneDemo(): Promise<void> {
  const logger = new Logger('StandaloneDemoRunner');
  let demo: StandaloneAGITSDemo | null = null;

  try {
    logger.info(`
╔══════════════════════════════════════════════════════════════╗
║    🚀 AGITS - Advanced General Intelligence Technological    ║
║                    System STANDALONE Demo                    ║
║                                                              ║
║  Läuft ohne externe Datenbank-Abhängigkeiten               ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Create and start demo
    demo = new StandaloneAGITSDemo();
    await demo.start();

    logger.info('\n🎉 Demo erfolgreich abgeschlossen!');
    logger.info('\n📖 Weitere Informationen: siehe DEMO.md');
    logger.info(
      '🛠️  Für erweiterte Features: npm run demo (benötigt Datenbanken)'
    );
  } catch (error) {
    logger.error('Standalone Demo failed:', error);
    if (demo) {
      await demo.stop();
    }
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runStandaloneDemo().catch(console.error);
}

export { runStandaloneDemo };
