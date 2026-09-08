# Lägga upp sidan

Målet: en adress som funkar på iPhone och Mac, och som lever kvar oavsett vad du
betalar för hos någon annan. GitHub Pages är gratis och kräver inget kort.

## Steg 1 · Du loggar in (en gång)

```bash
gh auth login --web --git-protocol https -h github.com
```

Den skriver ut en kod, öppnar webbläsaren och ber dig klistra in den. Har du inget
GitHub-konto skapar du det i samma flöde.

Säg till när det är klart, så gör jag resten.

## Steg 2 · Jag gör resten

Skapar ett publikt repo, lägger upp filerna, slår på Pages och ger dig adressen —
ungefär `https://<ditt-namn>.github.io/systemet/`.

Repot är publikt eftersom Pages på privata repon kostar. Det gör ingenting: filerna
innehåller bara sidan. Din data ligger aldrig i dem.

## Steg 3 · På telefonen

Öppna adressen i Safari → dela-knappen → **Lägg till på hemskärmen**.
Då får den en egen ikon och öppnas utan adressfält.

**Gör det här steget, inte bara ett bokmärke.** Safari på iPhone rensar lagringen för
sidor du inte besökt på sju dagar. En sida på hemskärmen räknas som en app och har egen
lagring som ligger kvar. Och med synken påslagen spelar det ingen roll ändå — då finns
sanningen i din Drive och telefonen är bara en kopia.

## Steg 4 · Synken

Se SYNK.md. Utan den har telefonen och datorn varsin separat data.
