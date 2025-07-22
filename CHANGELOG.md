## [Nächste Version]

- Konsolidierung: Die Datei `enhanced-autonomous-knowledge-collector.ts` wurde entfernt. Alle erweiterten Features (detaillierte Qualitätsmetriken, adaptive Quellen, erweiterte Statistiken) sind jetzt in der Hauptklasse `AutonomousKnowledgeCollector` und den Typdefinitionen integriert.
- Typen und Interfaces wurden vereinheitlicht und in die jeweiligen _.type.ts und _.interface.ts Dateien ausgelagert.
- Dopplungen und Legacy-Logik entfernt.
- Die Triggerbarkeit und Autonomie der Wissenssammlung ist jetzt vollständig über Scheduler, Events und API gewährleistet.
- Dokumentation und Readme werden im nächsten Schritt aktualisiert.
