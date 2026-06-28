# WK 2026 — Kaarten Voorspelling

## 1. Lokaal draaien
```
npm install
npm run dev
```
Open daarna http://localhost:5173

## 2. Naar GitHub pushen
```
git init
git add .
git commit -m "Eerste versie"
git remote add origin <jouw-github-repo-url>
git push -u origin main
```

## 3. Deployen naar Vercel
- Ga naar vercel.com, log in met je GitHub-account
- Klik "Add New Project" → kies deze repo
- Vercel detecteert Vite automatisch en bouwt/deployt de site
- Noteer je live URL (bijv. `https://wk2026-app.vercel.app`)

## 4. PWA-URL instellen voor de Android-build
De workflow in `.github/workflows/build-android.yml` heeft je live URL nodig:
1. Ga in je GitHub-repo naar **Settings → Secrets and variables → Actions → Variables**
2. Voeg een variabele toe: naam `PWA_URL`, waarde = jouw Vercel-URL (zonder slash op het einde)

## 5. Android .aab automatisch genereren
Bij elke push naar `main` (of handmatig via "Run workflow" op het Actions-tabblad)
bouwt GitHub Actions automatisch een Android App Bundle (`.aab`) met Bubblewrap,
gebaseerd op je live PWA.

Download het resultaat:
- Ga naar het **Actions**-tabblad → kies de laatste run → onderaan bij "Artifacts"
  staat `app-bundle` met het `.aab`-bestand

## 6. Publiceren in de Play Store
1. Maak een Google Play Developer-account (eenmalige kosten ~€25)
2. Ga naar de Play Console → "App maken"
3. Upload het gedownloade `.aab`-bestand
4. Vul de store-listing in: titel, beschrijving, screenshots, privacybeleid-URL,
   categorie, content rating
5. Dien in voor review (duurt meestal enkele dagen)

## Iconen vervangen
De bestanden `public/icon-192.png` en `public/icon-512.png` zijn placeholders.
Vervang ze door je eigen logo (zelfde bestandsnamen en afmetingen aanhouden).

## Wat is automatisch en wat niet?
| Stap | Automatisch? |
|---|---|
| Code bouwen & checken | ✅ via GitHub Actions |
| Deploy naar Vercel | ✅ automatisch bij elke push (na koppeling) |
| .aab genereren | ✅ via GitHub Actions + Bubblewrap |
| Accounts aanmaken (GitHub/Vercel/Google Play) | ❌ handmatig, eenmalig |
| Store-listing & review | ❌ handmatig, vereist door Google |
