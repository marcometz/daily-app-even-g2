# RSS-Reader Feature

## 1. Ziel und Scope
Das Feature erweitert die TestApp um einen RSS-Reader fuer EvenHub.

Enthalten:
- Dashboard mit Button-Liste (zunaechst ein Eintrag: `RSS-Feeds`)
- RSS-Liste mit Eintraegen aus konfigurierten Feeds
- RSS-Detailansicht mit kompletter Beschreibung und Autoscroll

Nicht enthalten:
- Oeffnen externer Artikel-Links im Browser
- Interaktive Aktionen pro RSS-Eintrag (kein Actions-Overlay)
- Persistente lokale Speicherung ueber den Laufzeit-Cache hinaus

## 2. User-Flow
1. App startet im Dashboard.
2. `Click` auf `RSS-Feeds` oeffnet die RSS-Liste.
3. In der RSS-Liste wird per `Click` ein Eintrag in der Detailansicht geoeffnet.
4. `DoubleClick` in der Detailansicht geht zur RSS-Liste zurueck.

Input-Mapping:
- `Click`
  - Dashboard: Oeffnet ausgewaehlten Dashboard-Button (`RSS-Feeds`)
  - RSS-Liste: Oeffnet ausgewaehlten RSS-Eintrag
  - RSS-Detail: Toggle fuer Autoscroll (Start/Stop)
- `DoubleClick`
  - RSS-Liste: Zurueck zum Dashboard
  - RSS-Detail: Zurueck zur RSS-Liste
- `Up`
  - Dashboard/RSS-Liste: Auswahl nach oben
  - RSS-Detail: Vorheriger RSS-Eintrag, bei erstem Eintrag zurueck zur Liste
- `Down`
  - Dashboard/RSS-Liste: Auswahl nach unten
  - RSS-Detail: Naechster RSS-Eintrag, bei letztem Eintrag zurueck zur Liste

## 3. Entscheidungsliste (ADR-Stil)
- Mehrere Feeds werden gemischt und global nach `pubDate` absteigend sortiert.
- RSS-Daten werden beim Oeffnen der RSS-Liste neu geladen.
- Die RSS-Liste zeigt pro Eintrag `Titel - Description-Snippet` als Einzeile.
- `Click` in der Detailansicht ist ausschliesslich fuer Autoscroll Start/Stop reserviert.
- `Up`/`Down` im Detail wechselt den RSS-Eintrag; an den Grenzen geht es zurueck zur RSS-Liste.
- Der bisherige Demo-Flow (Elemente/Aktionen) wird durch den RSS-Flow ersetzt.
- Autoscroll startet nicht automatisch, sondern nur per explizitem `Click`-Toggle.

## 4. Datenmodell
Feed-Config-Schema:
- `id: string`
- `title: string`
- `url: string`
- `maxEntries: number`

Initiale Feed-Konfiguration:
- `Tagesschau`
- URL: `https://www.tagesschau.de/infoservices/alle-meldungen-100~rss2.xml`
- `maxEntries: 50`

Internes RSS-Item-Schema:
- `id: string`
- `title: string`
- `description: string` (vollstaendig, bereinigt)
- `snippet: string` (eine Zeile fuer Listenansicht)
- `pages: string[]` (detailseitige Segmentierung)
- `pubDateText?: string`
- `pubDateMs: number | null`
- `link?: string`
- `source: string`

## 5. Parsing und Normalisierung
XML-Felder pro RSS-Item:
- `title`
- `description` (Fallback: `content:encoded`)
- `pubDate`
- `link`
- `guid`

Normalisierung:
- HTML wird aus `description` entfernt.
- Whitespace wird auf einfache Leerzeichen reduziert.
- Listen-Snippet wird auf feste Laenge gekuerzt.
- Volltext wird in Seiten fuer die Detailansicht segmentiert.

Umgang mit fehlendem/ungueltigem Datum:
- `pubDate` wird zu `pubDateMs` geparst.
- Bei ungueltigem Datum: `pubDateMs = null`.
- Sortierung: Eintraege ohne gueltiges Datum stehen hinter datierten Eintraegen.

## 6. UI- und SDK-Rahmenbedingungen
EvenHub-relevante Regeln:
- Maximal 4 Container pro Seite
- Genau ein Container mit `isEventCapture=1`

Containerstrategie fuer dieses Feature:
- Dashboard: ein `ListContainer`
- RSS-Liste: ein `ListContainer`
- RSS-Detail: ein `TextContainer`

Renderingstrategie:
- Initial: `createStartUpPageContainer`
- Danach: `rebuildPageContainer`
- Text-Updates nur bei Text-Only-Layout ueber `textContainerUpgrade`

## 7. Fehler- und Fallback-Verhalten
Feed-Ladefehler:
- Wenn bereits Cache vorhanden ist: letzte erfolgreiche RSS-Liste bleibt sichtbar.
- Wenn kein Cache vorhanden ist: Status-/Fehlerzeile in der RSS-Liste.

Parsing-Fehler:
- Einzelne fehlerhafte Feed-Responses werden ignoriert, wenn andere Feeds erfolgreich sind.
- Wenn keine Feed-Daten verarbeitet werden koennen, wird ein Fehlerstatus angezeigt.

Verhalten mit/ohne Cache:
- Mit Cache: stale data sichtbar, Hinweis im Listentitel.
- Ohne Cache: keine Eintraege, stattdessen Statuszeile.

## 8. Testmatrix
Happy-Path:
1. Dashboard zeigt `RSS-Feeds`.
2. `Click` oeffnet RSS-Liste.
3. RSS-Liste wird beim Eintritt aktualisiert.
4. Eintrag zeigt `Titel - Snippet`.
5. `Click` oeffnet Detail.
6. `Click` im Detail toggelt Autoscroll.
7. `DoubleClick` geht zur RSS-Liste zurueck.

Navigation/Edge-Cases:
1. `Up` im ersten Detaileintrag geht zur RSS-Liste.
2. `Down` im letzten Detaileintrag geht zur RSS-Liste.
3. `Up/Down` in Listenansicht bleibt innerhalb der gueltigen Grenzen.

Fehlerfaelle:
1. Netzfehler ohne Cache: Fehlerstatus in Liste.
2. Netzfehler mit Cache: letzter Stand bleibt sichtbar.
3. XML-Parsingfehler: Fehlerstatus, sofern kein verwertbarer Feed vorliegt.

Build-Check:
- `npm --prefix testapp run build` muss erfolgreich sein.
