# MOVE4ALL — podklady pre prezentáciu a video v ChatGPT

Tento súbor môžeš priložiť do nového chatu alebo projektu v ChatGPT. Obsahuje hotové zadanie a zoznam podkladov, aby prezentácia vychádzala zo skutočnej aplikácie.

## Čo priložiť

1. Tento súbor: `docs/CHATGPT-podklady-prezentacia-a-video.md`.
2. Existujúcu prezentáciu: `MOVE4ALL-Prezentacia.pptx` — nech ju ChatGPT vylepší, nie aby začínal bez kontextu.
3. Logo: `public/branding/move4all-logo.png` ako samostatný obrázok.
4. Scenáre: `docs/demo-walkthrough.md` a `docs/prezentacia-scenar.md`.
5. Ak má ChatGPT prístup k aplikácii GitHub, pripoj repozitár `aethixwebdevelopment-blip/projektik` a požiadaj ho, aby si prečítal README, zdrojové obrazovky a relevantné komponenty. Ak pripojenie nemáš, prilož aspoň README a screenshoty aplikácie. GitHub pripojenie v ChatGPT slúži na čítanie a analýzu repozitára; zmeny do repozitára zapisuje Codex.
6. Pre presné video nahraj vlastnú nahrávku obrazovky z bežiacej aplikácie alebo screenshoty všetkých krokov. Repo samo o sebe neobsahuje záznam reálneho používania.

## Ako nahrať

V ChatGPT vytvor nový projekt alebo nový chat, prilož vyššie uvedené súbory a vlož prompt zo spodnej časti tohto dokumentu. Súbory PPTX, textové dokumenty a obrázky možno nahrávať priamo do chatu; dostupnosť a limity závisia od účtu. Ak sa nezobrazí možnosť pripojiť GitHub, použi lokálne súbory a screenshoty.

Pre živú ukážku spusti aplikáciu príkazmi `pnpm install` a `pnpm dev`, otvor lokálnu adresu z terminálu a nahrávaj obrazovku počas prejdenia scenára. Na záznam môžeš použiť Xbox Game Bar (`Win + Alt + R`) alebo nástroj na nahrávanie obrazovky, ktorý máš k dispozícii. Pred nahrávaním obnov demo dáta, zapni vyšší kontrast podľa potreby a zavri osobné karty či upozornenia.

## Hotový prompt pre ChatGPT

```text
Vytvor z priložených podkladov špičkovú, plne upraviteľnú prezentáciu v slovenčine o projekte MOVE4ALL a kompletný scenár videa, ktoré ukáže reálnu aplikáciu od úvodnej obrazovky až po záver tréningu.

Najprv si dôkladne prečítaj priložený README, demo walkthrough, existujúcu prezentáciu, logo a (ak je dostupné) pripojený GitHub repozitár. Zisti, čo je v prototypovej aplikácii naozaj implementované. Prezentáciu aj video založ na týchto dôkazoch. Nevymýšľaj obrazovky, výsledky, používateľské príbehy, štatistiky, odborné schválenia ani zdravotné účinky.

CIEĽ
Presvedčivo a zrozumiteľne vysvetliť, akú bariéru MOVE4ALL pomáha riešiť pre ľudí so zdravotným postihnutím, čo už klikateľné demo dokáže, ako vyzerá celý tok používania a čo treba ešte odborne a používateľsky overiť. Hovor o prínose ako o zámere a potenciáli prototypu, nie ako o dokázanom klinickom výsledku.

VIZUÁLNY SMER
- Dodrž identitu MOVE4ALL: čierna/antracitová, biela a výrazná tyrkysová podľa dodaného loga; logo použi čisté a nedeformované.
- Vychádzaj z priloženej ukážky pitch decku: veľké, sebavedomé titulky, karty/slidy s jasnou hierarchiou, čisté rozloženie a vizuálne výrazné prechody. Zachovaj vysoký kontrast, veľké písmo, čitateľné popisy a dosť voľného priestoru.
- Priprav približne 10–12 obsahových slidov a záverečný slide. Každý slide má jedno hlavné posolstvo, krátky text a vhodný vizuál alebo skutočnú snímku aplikácie. Vyhni sa odsekom drobného textu.
- Pridaj stručné poznámky pre rečníka v slovenčine, ktoré spolu tvoria súvislý prejav približne na 5–7 minút.

ODPORÚČANÁ OSNOVA
1. Úvod a hlavné posolstvo MOVE4ALL.
2. Bariéry pri plánovaní pohybu a prečo univerzálny plán nemusí vyhovovať každému.
3. Princípy produktu: voľba používateľa, individuálne možnosti, tempo a zrozumiteľnosť.
4. Čo prototyp reálne obsahuje a čo zatiaľ neobsahuje.
5. Živá ukážka: denník a nastavenie profilu.
6. Denná kontrola a úprava podmienok tréningu.
7. Návrh tréningu a vysvetlenie výberu cvikov.
8. Detail cviku, výmena alebo preskočenie.
9. Aktívny tréning, dokončenie a spätná väzba.
10. História a funkcie prístupnosti.
11. Možný prínos pre ľudí so zdravotným postihnutím, formulovaný bez nepodložených sľubov.
12. Ďalšie kroky, limity a výzva na spoluprácu/testovanie.

VIDEO
Vytvor kompletný plán 2–3-minútového produktového videa s časovými značkami, presným záberom/kliknutím, textom na obrazovke, slovenským voiceoverom, titulkami a prechodmi. Video má ukázať skutočné rozhranie v poradí: štart → denník → profil a nastavenia → denná kontrola → návrh → detail cviku → výmena/preskočenie → tréning → dokončenie a spätná väzba → história. Pri každom kroku uveď, čo má nahrať operátor a čo má rozprávač povedať. Navrhni aj úvodnú a záverečnú kartu s logom.

Ak priložené podklady neobsahujú skutočné video alebo nástroj v tomto chate nevie vyrenderovať video, nevydávaj storyboard za hotový MP4. Namiesto toho odovzdaj storyboard, voiceover, titulky vo formáte SRT a presný zoznam záberov na nahratie/strih. Nepoužívaj ilustračnú obrazovku ako dôkaz, že daná funkcia je v aplikácii.

PRESNOSŤ A BEZPEČNOSŤ
- Aplikácia je prototyp fitness denníka pre ľudí so zdravotným postihnutím, nie zdravotnícka služba.
- Cviky aj predvyplnený profil sú fiktívne ukážky a neboli odborne posúdené. Povedz to jasne na vhodnom slide aj v komentári k videu.
- Nepripisuj aplikácii medicínske odporúčania, diagnostiku, garantovaný prínos, reálne zdravotné metriky alebo výsledky používateľov.
- Zohľadni, že prístupnosť treba overiť spolu s ľuďmi s rôznymi zdravotnými postihnutiami a asistívnymi technológiami.
- Ak niečo nevieš doložiť z podkladov, označ to ako návrh alebo otvorenú otázku.

VÝSTUPY
1. Hotový upraviteľný PowerPoint (.pptx), pripravený na prezentovanie.
2. PDF export na rýchle zdieľanie, ak je dostupný.
3. Poznámky rečníka alebo samostatný scenár.
4. Video storyboard s voiceoverom a časovaním; titulky SRT, ak vieš ich vytvoriť.
5. Krátky zoznam potrebných reálnych screenshotov alebo záberov, ak niečo chýba.

Pred odovzdaním skontroluj pravopisnú slovenčinu, kontrast, čitateľnosť, konzistentné logo/farby, že každý slide prispieva k príbehu, a že všetky tvrdenia zodpovedajú skutočnému stavu prototypu. Na konci stručne uveď, ktoré podklady alebo zábery ešte chýbajú.
```

## Poznámka k videu

OpenAI ukončilo webovú a mobilnú aplikáciu Sora 26. apríla 2026 a jej API 24. septembra 2026. Preto je najspoľahlivejšie nahrať skutočné demo aplikácie a použiť ChatGPT na scenár, voiceover, titulky a plán strihu. Ak máš v ChatGPT dostupný iný nástroj na video, môžeš mu odovzdať pripravený storyboard a skutočné zábery.
