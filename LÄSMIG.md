# Systemet

Vanor · bonus · inget däremellan.

## Så öppnar du det

**https://kdsundvall.github.io/systemet/** — på telefonen och på datorn.
Den stora versionen: `/systemet.html`.

Använd den adressen, inte filen på datorn. Webbläsaren knyter dina dagar till adressen,
så samma adress varje gång är skillnaden mellan en kedja och ingen kedja.
`starta.command` finns kvar för att köra lokalt när du utvecklar, men den har sin egen
separata lagring — blanda inte.

## Backup
System-fliken, längst ner:

- **CSV** — för att titta på. Öppnas i Google Sheets, Excel, Numbers.
- **JSON** — den som kan läsas tillbaka. Ta en innan du byter dator eller rensar webbläsaren.

`Läs tillbaka en backup` läser in en JSON-fil igen. Dagar med samma datum skrivs över.

Systemet är `index.html` plus träningsdelen (`trana.js`, `trana.css`), utan andra beroenden.
Det fungerar utan Claude, utan internet, och utan att någon annan äger datan.

## Träning
Fliken **Träning** är en Starting Strength-logg: pass A/B, uppvärmning, skivor per sida,
vilotimer som startar när du bockar av ett set, och nya vikter när du avslutar passet.

- Reglerna och logiken ligger överst i `trana.js`, stilen i `trana.css`.
- Datan sparas under `enkel:trana` och följer med i synken och i JSON-backupen.
  Vid synk vinner den version av träningen som ändrades senast.
- **`trana.html`** är samma träningsdel som egen sida, utan vanorna. Det är den länken
  du skickar till någon annan: https://kdsundvall.github.io/systemet/trana.html
  Deras data stannar i deras telefon och har en egen backup längst ner.
- Efter en ändring i `trana.js` eller `trana.css`: höj `?v=1` i `index.html` och
  `trana.html`, så hämtar telefonen den nya filen i stället för en sparad kopia.

## Att rätta i System-fliken
- **Dag 1** står som gissningen 23 augusti. Sätt rätt datum, annars räknar rubriken fel.
- **De elva målen** är tomma. Pappret på väggen gäller — det här är kopian.
