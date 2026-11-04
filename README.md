# MOVE4ALL — interaktívne mobilné demo

Slovenský, phone-first prototyp tréningového denníka určený ľuďom so zdravotným postihnutím. Výber možností a tempa má používateľ pod kontrolou. Cviky a predvyplnený profil sú výhradne fiktívne ukážky; nejde o odborne schválené tréningové odporúčania.

## Požiadavky

- Node.js 20+
- pnpm 9+

## Spustenie

```sh
pnpm install
pnpm dev
```

Vite vypíše lokálnu adresu. Pre otvorenie na telefóne pripojenom k rovnakej Wi‑Fi použi sieťovú adresu počítača a port z terminálu. Použi prehliadač s podporou moderného JavaScriptu.

## Build a testy

```sh
pnpm test
pnpm build
pnpm preview
```

## Štruktúra

- `src/domain/` — modely, tvrdé pravidlá, radenie a generátor návrhu
- `src/data/` — fiktívne demo cviky a profil
- `src/services/persistence.ts` — lokálne demo úložisko
- `src/app/App.tsx` — mobilné obrazovky a používateľský tok
- `src/styles.css` — dizajnové tokeny, mobilný layout a desktopový iPhone rám
- `public/fonts/ArchivoBlack-Regular.ttf` — self-hosted Archivo Black
- `public/fonts/OFL.txt` — licencia dodaného fontu
- `src/domain/eligibility.test.ts` — testy kritických bezpečnostných pravidiel
- `docs/demo-walkthrough.md` — scenár pre živú ukážku

## Limity a ďalšie kroky

1. Nechať všetok obsah posúdiť kvalifikovaným fyzioterapeutom alebo trénerom adaptívneho športu.
2. Overiť čitateľnosť a ovládanie s používateľmi s rôznymi pohybovými možnosťami a asistívnymi technológiami.
3. Pred produkciou doplniť bezpečnú autentifikáciu, backend, súhlas, export a vymazanie dát, minimalizáciu údajov a GDPR posúdenie.
4. Lokalizovať UI cez samostatné jazykové slovníky a doplniť titulkované médiá po dodaní schváleného obsahu.

Podrobnejší demo scenár a otvorené obmedzenia sú v `docs/demo-walkthrough.md`.
