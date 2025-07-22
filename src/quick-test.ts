/**
 * Quick AGITS Test - Einfacher Test der Kernfunktionalitäten
 */

import { QualityAssessmentEngine } from './core/quality-assessment-engine.js';

console.log('🚀 AGITS Quick Test startet...\n');

try {
  // Test QualityAssessmentEngine
  const qualityEngine = new QualityAssessmentEngine();

  const testData = {
    content: 'Dies ist ein Testinhalt für die Qualitätsbewertung.',
    source: 'test_source',
    timestamp: new Date(),
    metadata: { type: 'test' },
  };

  console.log('📋 Teste Datenqualitätsbewertung...');

  const quality = await qualityEngine.assessDataQuality(testData);
  const isValid = await qualityEngine.validateData(testData);

  console.log('✅ Qualitätsbewertung Ergebnisse:');
  console.log(`   • Gesamt-Score: ${Math.round(quality.overallScore * 100)}%`);
  console.log(`   • Relevanz: ${Math.round(quality.relevance * 100)}%`);
  console.log(
    `   • Glaubwürdigkeit: ${Math.round(quality.credibility * 100)}%`
  );
  console.log(`   • Genauigkeit: ${Math.round(quality.accuracy * 100)}%`);
  console.log(
    `   • Vollständigkeit: ${Math.round(quality.completeness * 100)}%`
  );
  console.log(`   • Ist Valid: ${isValid ? '✅' : '❌'}`);

  const stats = qualityEngine.getQualityStats();
  console.log('\n📊 Quality Engine Statistics:');
  console.log(`   • Bewertungen: ${stats.totalAssessments}`);
  console.log(
    `   • Durchschnittliche Qualität: ${Math.round(stats.averageQuality * 100)}%`
  );
  console.log(
    `   • Validierungs-Erfolgsrate: ${Math.round(stats.validationSuccessRate * 100)}%`
  );

  console.log('\n🎉 AGITS Quick Test erfolgreich abgeschlossen!');
  console.log('\n📖 Für vollständige Demo: npm run demo:standalone');
} catch (error) {
  console.error('❌ Test fehlgeschlagen:', error);
  process.exit(1);
}
