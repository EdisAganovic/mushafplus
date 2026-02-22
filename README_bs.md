# Mushaf Plus 📖

Vrhunska, potpuno responzivna aplikacija bazirana na web pretraživaču, dizajnirana da pomogne korisnicima u učenju napamet i usavršavanju učenja Kur'ana (Tedžvid) sa korisničkim interfejsom na bosanskom jeziku.

![Mushaf Plus Screenshot](screenshot.png)

Izgrađena isključivo modernim web tehnologijama, ova aplikacija radi u potpunosti lokalno u pretraživaču, nudeći visoko responzivno, offline sposobno i privatno okruženje za proučavanje.

## ✨ Ključne Karakteristike

- **Centralizirani Prijevod na Bosanski**: Potpuno lokalizovan interfejs koristeći prilagođeni `i18n.js` mehanizam za prevođenje.
- **Označavanje Tedžvida Bojama & Info Oblačići Značenja**: Napredni tekstualni engine koji ističe pravila Tedžvida (Ihfa, Izhar, Kalkala, itd.) sa info oblačićima (tooltips) u stvarnom vremenu koji objašnjavaju svako pravilo pri kliku.
- **Globalni Pretraživač**: Trenutno pretraživanje kroz cijeli Kur'an po tekstualnom sadržaju ili referenci (npr. "2:255"). Radi uz pomoć padajućeg menija s odgođenim (debounced) rezultatima.
- **Sistem za Samostalno Snimanje**: Koristi mikrofon vašeg uređaja kako bi vam omogućio da snimite vlastito učenje (recitaciju). Odmah preslušajte kako biste uporedili svoj Tedžvid sa učenjem Šejha.
- **Interaktivne Postavke Tipografije**: Prilagodite svoje iskustvo učenja pomoću klizača (slajdera) koji u realnom vremenu ažuriraju veličinu arapskog fonta, veličinu fonta prijevoda te visinu linije (prored). Uključuje prikaz uživo (preview) sure Ihlas i prijevoda.
- **Dualni Interfejs (Tamni/Svijetli Način)**: Besprijekorno prebacivanje između Tamnog načina (Dark Mode) i Svijetlog načina (Light Mode), uz višestruke teme naglaska (Smaragdna, Plava, Ćilibar, Roza, Ljubičasta, Tirkizna).
- **Praćenje Napretka & Mreža Ajeta**: Označite ajete kao "Tačno" (naučeno) kako biste vizuelno pratili napredak. Sadrži kompaktnu, responzivnu mrežu ajeta za brzu navigaciju.
- **Oznake (Bookmarks) & Bilješke**: Spremite svoja omiljena mjesta i dodajte privatne bilješke na bilo koji ajet. Vaša sesija se automatski obnavlja (posljednja gledana sura) pri ponovnom pokretanju aplikacije.
- **Prečice na Tastaturi**: Napredne prečice za učenje bez korištenja miša (`Space` za snimanje, `P` za učenje Šejha, `U` za preslušavanje vašeg snimka).
- **Prenosivost Podataka**: Izvezite/Uvezite (Import/Export) vaš napredak, oznake i bilješke u obliku JSON datoteke.

## 🛠 Tehnologije (Tech Stack)

- **Frontend**: HTML5, Vanilla JavaScript (ES6+)
- **Stiliziranje**: Tailwind CSS + Custom CSS (`css/styles.css`) za precizno podešenu responzivnost i varijable tema.
- **Ikone**: [Ionicons](https://ionic.io/ionicons)
- **Podaci**: Statični JavaScript nizovi koji sadrže kur'anski tekst i reference (`quran_data.js`).
- **Lokalizacija**: Specijalizirani `i18n.js` za dinamičko upravljanje tekstom aplikacije.

## 🚀 Pokretanje Aplikacije

Pokretanje aplikacije je jednostavno jer ne zahtijeva backend (server). Kako biste je pokrenuli:

1. Klonirajte (Clone) ili preuzmite (Download) ovaj repozitorij.
2. Osigurajte da imate audio MP3 datoteke u mapi `mp3/` (format: `[BrojSure][BrojAjeta].mp3`).
3. Otvorite datoteku `index.html` u bilo kojem modernom web pretraživaču.

### 🎨 Razvoj & Stiliziranje

Aplikacija koristi statičan produkcijski "build" za **Tailwind CSS**. Ako mijenjate strukturu u `index.html` ili dodajete nove klase, potrebno je ponovno generisati CSS datoteku:

```bash
npx tailwindcss -i ./css/input.css -o ./css/tailwind-output.css --minify
```

### Napomena o Dozvolama za Mikrofon

Pristup mikrofonu zahtijeva siguran kontekst (HTTPS ili localhost). Ako aplikaciju pokrećete lokalno, molimo vas da koristite server kao što je **VS Code Live Server** ili slično da biste omogućili funkcionalnost snimanja vašeg učenja.

## 🗂 Struktura Projekta

```text
├── index.html        # Glavni standardni UI markup
├── css/
│   ├── styles.css            # Centralizirana prilagođena tipografija i logika za teme
│   ├── input.css             # Tailwind input datoteka
│   └── tailwind-output.css   # Glavna produkcijska kompajlirana CSS datoteka
├── js/
│   ├── app.js        # Inicijalizacija i logika globalne pretrage
│   ├── i18n.js       # Bosanski prevodilački engine & definicije znakova (stringova)
│   ├── actions.js    # Logika za oznake, bilješke i praćenje napretka
│   ├── audio.js      # MediaRecorder i audio engine
│   ├── render.js     # Dinamička manipulacija DOM elementima & logika Mreže Ajeta
│   ├── config.js     # Upravljanje stanjem (AppState) i reference na DOM elemente
│   └── utils.js      # Formatiranje Tedžvida i pomoćni (helper) alati
├── quran_data.js     # Set podataka sa tekstom Kur'ana (Arapski i Prijevod)
└── mp3/              # (Osigurava korisnik) Audio fajlovi sa učenjem šejhova
```

## ⌨️ Prečice na Tastaturi

| Tipka             | Akcija                               |
| ----------------- | ------------------------------------ |
| `Desna Strelica`  | Sljedeći ajet                        |
| `Lijeva Strelica` | Prethodni ajet                       |
| `Space`           | Uključi/Isključi Snimanje Mikrofonom |
| `V`               | Označi ajet kao "Tačno"              |
| `P` / `Enter`     | Pusti/Pauziraj Učenje Šejha          |
| `U`               | Pusti/Pauziraj Svoj Snimak           |
