# Gulp eDM build base

## Alap információk

Amennyibe csak egy verzó készül egy eDM-ből, annyit kell tenned, hogy repo kihúzása után adsz egy npm install-t:

    npm install

Majd a config.json-ben be kell állítani a gmail-es felhasználói neved és jelszavad.
Aztán futtatod a gulpot a gulp paranccsal:

    gulp

Majd kiválasztani a taskot.
Három task közül választhatsz:
1. Watch elindítása: Értelemszerűen elindul a watch és lefordítja az sass-t, majd a templateket és berakja a compiled mappába.
2. Teszt e-mail kiküldése: Tesztelheted, hogy milyen lett az eDM, a címet, hogy hova küldje a config.json-ben kell megadni (Itt több emailcímet is megadhatsz, ezeket vesszővel kell elválasztani).
3. Csomag összeállítása ügyfélnek: ha nincs, akkor létrehoz egy dist mappát, melybe becsomagolva, verziószámmal ellátva összeállítja az ügyfélnek szánt pakkot (A csomag nevét a config.json-ben tudod megadni).

## Template létrehozása

Template-eket a templates könyvtáron beül tudsz létrehozni.

## Amennyiben több verziójú eDM-et kell buildelni

Ha egy eDM-ből több verziót, vagy több nyelvűt kell buildelni, akkor el kell látnod őket verziószámmal.
Pl.: templates mappán belül ez van: V1_index.html
Valamint fontos, hogy a képeket is e szerint nevezd el, tehát az első verzióhoz való képeket a V1 előtaggal kell ellátni. Ha nincs a képnek előtagja, akkor az azt jelenti, hogy mindegyik verzióban szerepel, ezért az összes eDM-nél ki fogja küldeni a rendszer, amikor teszt e-mail küldesz magadnak.
(Jövőbeli feature, hogy ez ne V1-V9-ig legyen, hanem bármilyen prefixet meg lehessen adni)