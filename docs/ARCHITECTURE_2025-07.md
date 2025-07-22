# AGITS Architektur (Stand: Juli 2025)

## Zentrale Komponenten

- **KnowledgeCollector**: Einzige zentrale Klasse für Wissenssammlung, ML-Optimierung, Source-Management und Qualitätsbewertung. Alle vorherigen Varianten wurden entfernt.
- **MemoryManagement**: Verwaltung und Persistenz von Wissen.
- **DataPersistenceLayer**: Schnittstelle zu Datenbanken und Speichern.
- **ML Quality Assessment Engine**: Bewertet die Qualität von Wissen.
- **Pattern Recognition Engine**: Erkennung von Mustern und Duplikaten.
- **Reinforcement Learning Agent**: Adaptive Optimierung der Sammlung und Quellen.

## Typen & Schnittstellen

- Alle Typen und Interfaces sind in `src/types/` ausgelagert und werden zentral verwendet.

## Zyklische Prozesse

- Sammlung, Optimierung und Wartung laufen als asynchrone Zyklen im `KnowledgeCollector`.

## Erweiterbarkeit

- Neue Quellen, Filter, ML-Engines und Strategien können über die zentrale Klasse und die Typen einfach integriert werden.

## Historie

- Legacy-Dateien wurden entfernt, siehe `docs/REMOVED_LEGACY_FILES.md`.
