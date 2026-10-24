# Disponenten-Simulator-Admin

Statische Admin-Seite (HTML/CSS/JS ohne Abhängigkeiten) zum Verwalten der Codes des
[Disponenten-Simulators](https://github.com/nikesieg4/Disponenten-Simulator). Spricht nur mit den
`admin_*`-Funktionen in Supabase (definiert in `db/supabase_setup.sql` im Spiel-Repo).

## Arbeitsweise
- **Niemals direkt auf `main` committen oder pushen.** Jede Änderung auf einem eigenen Branch, immer als Pull Request
  gegen `main`. Gemergt wird erst nach Freigabe durch den Repo-Inhaber.
- Keine geheimen Schlüssel ins Repository. In `config.js` stehen nur die öffentliche Supabase-URL und der Anon-Key.
  Das Admin-Passwort wird ausschließlich im Supabase-SQL-Editor gesetzt (`select admin_set_password('…');`).
- Content-Security-Policy in `index.html` beibehalten: kein Inline-Script, keine fremden Quellen.
- Kommen im Spiel neue Ausbildungen oder Erweiterungen dazu, die Listen oben in `admin.js` ergänzen.
