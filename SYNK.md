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
3. Ladda upp `enkel.html`. Döp om den till `index.html` i uppladdningen.
4. **Settings → Pages → Source: Deploy from a branch → main / (root) → Save.**
5. Efter någon minut ligger sidan på `https://<ditt-namn>.github.io/systemet/`.

Repot är publikt, men det innehåller bara sidan. Ingen av din data finns i filen.

## Del 3 · Koppla ihop

På **varje** enhet: öppna sidan, gå till System → Synk, klistra in adressen från del 1,
välj ett lösenord, tryck *Spara och skicka upp*. Samma lösenord överallt.

Lägg till sidan på hemskärmen på telefonen så beter den sig som en app.

## Hur det uppför sig

- Ändringar skickas upp automatiskt några sekunder efter att du slutat skriva.
- När du öppnar sidan hämtas den senaste versionen ner om den är nyare än din lokala.
- Redigerar du på båda enheterna samtidigt vinner den som sparade sist. Undvik det.
- Utan internet fungerar allt lokalt och skickas upp nästa gång.

## Otestat

Jag har testat krypteringen, lagringen i webbläsaren och backup-filerna på den här datorn.
Apps Script-delen kan jag inte testa utan ditt Google-konto — säg till om något klickar
fel så felsöker vi.
