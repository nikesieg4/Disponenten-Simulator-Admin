# Disponenten-Admin

Admin-Seite zum Erstellen von Codes für den [Disponenten-Simulator](https://github.com/nikesieg4/Disponenten-Simulator).
Reine statische Seite (HTML/CSS/JS, keine Abhängigkeiten).

## Einrichtung
1. Im Spiel-Repo `db/supabase_setup.sql` im Supabase-SQL-Editor ausführen (enthält die Code-Funktionen).
2. Einmalig im Supabase-SQL-Editor das Admin-Passwort setzen (mindestens 12 Zeichen):
   ```sql
   select admin_set_password('ein langes, zufälliges Passwort');
   ```
   Die Funktion kann **nur** im SQL-Editor ausgeführt werden, nicht über die Website. Ein erneuter Aufruf ändert
   das Passwort und meldet alle Admin-Sitzungen ab.
3. Seite öffnen (lokal `index.html` oder per GitHub Pages) und mit dem Passwort anmelden.

## Sicherheit
- Im Repo stehen nur die öffentliche Supabase-URL und der Anon-Key (dieselben wie im Spiel). Ohne gültige
  Admin-Sitzung lehnen alle `admin_*`-Funktionen ab.
- Gespeichert wird nur ein bcrypt-Hash des Passworts. Nach 5 Fehlversuchen je IP (20 insgesamt) ist der Login 15 Minuten gesperrt.
- Eine Admin-Sitzung gilt 2 Stunden und liegt nur im `sessionStorage` (weg, sobald der Tab geschlossen wird).
- Strenge Content-Security-Policy: Die Seite lädt nur eigene Dateien und spricht nur mit Supabase.
- Spieler können höchstens 10 ungültige Codes in 10 Minuten probieren.

## Belohnungen
| Typ | Wirkung im Spiel |
|---|---|
| Geld | sofort aufs Guthaben (vom Anti-Cheat als erlaubter Zuwachs verbucht) |
| Personal | Gutschein, Spieler weist es einer Wache zu; optional mit fertiger Ausbildung |
| Gebäude-Gutschein | Feuerwache, Akademie oder Leitstelle: Grundpreis beim Bauen gratis |
| Erweiterungs-Gutschein | eine Erweiterung gratis (Reiter „Erweiterungen“ der passenden Wache/Akademie/Leitstelle) |

Grenzen je Code: Ablaufdatum, maximale Einlösungen, nur neue Konten (jünger als X Tage), aktiv/deaktiviert, nur Premium.

## Einsatzpunkte und Premium
- **Einsatzpunkte gutschreiben:** bis Stripe angebunden ist, von Hand (auch negative Werte).
- **Premium & Discord:** alle Spieler mit EP, Premium oder Discord-User-ID. Wer aktives Premium und eine Discord-ID hat, bekommt die Rolle VIP.
Jeder Code ist pro Konto einmal einlösbar.

## Listen aktualisieren
Ausbildungen und Erweiterungen stehen oben in `admin.js` (`COURSES`, `EXTENSIONS`). Kommen im Spiel neue dazu, dort ergänzen.
