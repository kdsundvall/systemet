# Synk mellan telefon och dator

Två delar, båda gratis: **sidan** ligger på GitHub Pages, **datan** i din egen Google Drive.
Datan krypteras i webbläsaren innan den skickas. Google lagrar en oläslig sträng.
Lösenordet lämnar aldrig din enhet — tappar du det finns ingen väg tillbaka till datan.

Sidan fungerar helt utan det här. Lämnar du synk-fälten tomma sparas allt bara lokalt.

---

## Del 1 · Lagringen (Google Apps Script)

1. Gå till [script.google.com](https://script.google.com) och skapa ett nytt projekt.
2. Radera allt i `Code.gs` och klistra in:

```javascript
const FIL = 'systemet-synk.json';

function doGet() {
  return ut(las());
}

function doPost(e) {
  const kropp = JSON.parse(e.postData.contents);
  spara(kropp.data);
  return ut({ ok: true });
}

function las() {
  const f = DriveApp.getFilesByName(FIL);
  if (!f.hasNext()) return { data: null };
  return JSON.parse(f.next().getBlob().getDataAsString());
}

function spara(data) {
  const nytt = JSON.stringify({ data: data });
  const f = DriveApp.getFilesByName(FIL);
  if (f.hasNext()) f.next().setContent(nytt);
  else DriveApp.createFile(FIL, nytt, MimeType.PLAIN_TEXT);
}

function ut(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Distribuera → Ny distribution → Webbapp.**
   - Kör som: **Jag**
   - Vem har åtkomst: **Alla**
4. Godkänn behörigheterna. Google varnar för att appen är overifierad — den är din egen;
   klicka *Avancerat → Fortsätt till projektet*.
5. Kopiera webbadressen. Den slutar på `/exec`.

"Alla" betyder att vem som helst med adressen kan nå den. Det är därför datan är krypterad
innan den skickas — adressen ensam räcker inte för att läsa något.

## Del 2 · Sidan (GitHub Pages)

1. Skapa ett konto på [github.com](https://github.com) om du inte har ett.
2. Nytt repo, döp det till `systemet`, sätt det till **Public**.
3. Ladda upp filerna. Sidan heter redan `index.html`.
4. **Settings → Pages → Source: Deploy from a branch → main / (root) → Save.**
5. Efter någon minut ligger sidan på `https://<ditt-namn>.github.io/systemet/`.

Repot är publikt, men det innehåller bara sidan. Ingen av din data finns i filen.

## Del 3 · Koppla ihop

Öppna **uppkopplingslänken** på enheten. Den fyller i adressen åt dig:

```
https://kdsundvall.github.io/systemet/#synk=aHR0cHM6Ly9zY3JpcHQuZ29vZ2xlLmNvbS9tYWNyb3Mvcy9BS2Z5Y2J6akVzZGJ6Q1dsc2puQmlkMXg4ODNVSmxOUGcydU83UmtOTjRqRU5qNkxUaFMwOXNEelRvc1VPT2lfZEprQ0tNVXovZXhlYw==
```

Gå till System → Synk och skriv lösenordet. Ingen knapp behövs — appen börjar synka
av sig själv en dryg sekund efter att lösenordet är ifyllt.

Samma lösenord på alla enheter. Spara länken där du hittar den igen.

Lägg till sidan på hemskärmen på telefonen så beter den sig som en app.

## Hur det uppför sig

Allt sker av sig självt. Det finns inget att ladda upp eller ner.

- Appen synkar när den öppnas, en och en halv sekund efter varje ändring, varje minut
  medan den syns, när nätet kommer tillbaka, och när du lägger undan den.
- Varje fält på varje dag, varje fält i System och träningen har en egen tidsstämpel.
  Vid synk vinner den nyaste versionen av varje fält. Kryssar du en vana på telefonen
  och skriver en anteckning på datorn samma dag blir båda kvar.
- Översynerna slås ihop, så en översyn sparad på telefonen och en på datorn finns båda kvar.
- Ändrar du samma fält på två enheter innan de hunnit synka vinner den senaste ändringen.
- Det som kommer in från en annan enhet visas direkt, utan att sidan laddas om.
- Utan internet sparas allt lokalt och skickas när nätet är tillbaka.
- Inget raderas av synken. En enhet som saknar dagar får dem, den tar aldrig bort några.
- En enhet med fel lösenord skickar aldrig upp något. System-fliken säger till.

Första gången den här versionen körs på en enhet sparas en orörd kopia av all data
under `enkel:fore-autosynk` i webbläsaren, om något skulle behöva återställas.

## Otestat

Jag har testat krypteringen, lagringen i webbläsaren och backup-filerna på den här datorn.
Apps Script-delen kan jag inte testa utan ditt Google-konto — säg till om något klickar
fel så felsöker vi.
