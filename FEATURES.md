# Deelbaar Featurelog

## Overzicht

Dit document houdt bij welke productfeatures live staan of in ontwikkeling zijn. Gebruik het als naslag voor productbesluiten, afhankelijkheden en follow-up werk.

## Foto-aanvragen bij listings

- **Status**: MVP geïmplementeerd (7 nov 2025)
- **Beschrijving**: Ingelogde gebruikers kunnen bij een listing een foto indienen. De foto wordt als pending opgeslagen en is pas zichtbaar na goedkeuring door de eigenaar.
- **Belangrijkste flows**:
  - Gebruiker kiest een foto vanaf de listingdetailpagina (`app/(modals)/listing/[id].tsx`).
  - Upload verloopt realtime via Payload; offline upload wordt nog niet ondersteund.
  - Eigenaar beoordeelt aanvragen via `app/(tabs)/profile/manage-listings.tsx`. Acties: goedkeuren (foto zichtbaar) of afwijzen (optioneel met reden).
- **Openstaande punten**:
  - Offline workflow voor foto-upload (queue + reconciliatie).
  - Notificatie richting indiener bij goed-/afkeuring.

## Listingbeheer door gebruikers

- **Status**: MVP live
- **Beschrijving**: Gebruikers zien en beheren eigen listings via `Profile → Beheer mijn listings`.
- **Functionaliteit**:
  - Nieuwe listing aanmaken (naam, beschrijving, categorie, optioneel adres & coördinaten).
  - Overzicht van pending foto-aanvragen per listing + moderatie.
  - Meerdere listingtypes ondersteund via `category` veld (minibieb, watertappunt, boerderijkraam, overig).
- **Openstaande punten**:
  - Locatiepicker integreren (hergebruik van `picker.tsx`).
  - Tagging en aanvullende metadata (openingtijden, voorzieningen) uitwerken.
  - Publiceerstatus (concept/live) toevoegen?

## Persoonlijke gegevens & Account beheer

- **Status**: MVP live (7 nov 2025)
- **Beschikbaar in app**: `Account → Persoonlijke gegevens`
- **Beschrijving**: Uitgebreid profielbeheer voor gebruikers met volledige CRUD functionaliteit.
- **Functionaliteit**:
  - **Persoonlijke informatie**: Voornaam, achternaam, e-mail, telefoonnummer, geboortedatum
  - **Adres beheer**: Volledig adres (straat, huisnummer, postcode, stad) in gegroepeerde velden
  - **Profielfoto**: Upload via camera of galerij met crop functionaliteit (vierkant formaat)
  - **Over jezelf**: Bio tekstgebied en website link met URL validatie
  - **Database integratie**: Alle data wordt opgeslagen in Payload CMS User collection
  - **Form states**: Edit/Save/Cancel workflow met loading states en error handling
- **Backend aanpassingen**:
  - User collection uitgebreid met: `phoneNumber`, `birthDate`, `address` (group), `bio`, `website`
  - Media upload voor profielfoto's met alt-tekst vereiste
  - File upload naar `/api/media` endpoint
- **UI/UX features**:
  - Keyboard avoiding voor betere mobiele ervaring
  - Responsive form layout met proper spacing
  - Avatar preview met fallback naar initialen
  - Permissions handling voor camera/galerij toegang
- **Technische implementatie**:
  - React hooks voor state management
  - PayloadClient integratie voor API calls
  - ImagePicker voor native foto selectie
  - Form validatie en error boundaries

## Pushmeldingen

- **Status**: MVP geïmplementeerd (8 nov 2025)
- **Beschikbaar in app**: `Account → Instellingen → Pushmeldingen`
- **Functionaliteit**:
  - **Token registratie**: Expo push tokens worden automatisch opgeslagen bij login
  - **Notificatie voorkeuren**: Gebruikers kunnen per categorie notificaties aan/uit zetten
  - **Automatische notificaties**: Worden verstuurd bij events (foto-aanvragen, reviews, favorieten, status updates)
  - **Real-time delivery**: Via Expo Push Service naar iOS/Android apparaten
- **Backend implementatie**:
  - **NotificationService**: Centrale service voor het versturen van notificaties
  - **Database schema**: `pushToken` en `notificationSettings` toegevoegd aan User collection
  - **Collection hooks**: Automatische notificaties bij create/update events
  - **Expo API integratie**: Directe HTTP calls naar Expo Push Service
  - **Error handling**: Notificaties falen niet als push versturen mislukt

### Automatische Notificaties
  - **Foto-aanvragen**: `"Nieuwe foto aanvraag"` naar listing eigenaar
  - **Reviews**: `"Nieuwe review"` met ster rating naar listing eigenaar
  - **Favorieten**: `"Nieuwe favoriet"` naar listing eigenaar
  - **Status updates**: `"Foto goedgekeurd/afgewezen"` naar foto indiener

### Technische Specificaties
  - **Expo Notifications**: Native iOS/Android push support
  - **Token management**: Automatische registratie bij login
  - **User preferences**: Per categorie notificaties aan/uit zetten
  - **Rate limiting**: Gebouwd in Expo API (600 req/minute)
  - **Offline resilience**: Notificaties worden niet gequeued (real-time only)

### Productie Setup voor Push Notificaties

#### Voor Development ✅
- **Expo Go**: Werkt automatisch met Expo's push service
- **Geen extra configuratie**: Tokens worden automatisch gegenereerd
- **Cross-platform**: iOS/Android werken beide

#### Voor Production App Store 📱

##### iOS (vereist)
```bash
# 1. EAS Build configureren
eas build:configure

# 2. iOS credentials instellen
eas credentials

# 3. Push Notifications inschakelen in Apple Developer Console
# - Ga naar: https://developer.apple.com
# - App ID → Capabilities → Push Notifications → Enable
# - Development/Production certificaten aanmaken
```

##### Android (vereist)
```bash
# Firebase project aanmaken (als nog niet gedaan)
# - Ga naar: https://console.firebase.google.com
# - Project aanmaken
# - google-services.json downloaden naar android/app/
```

##### EAS.json Configuratie
```json
{
  "build": {
    "production": {
      "ios": {
        "bundleIdentifier": "com.deelbaar.app"
      },
      "android": {
        "package": "com.deelbaar.app",
        "gradleCommand": ":app:bundleRelease"
      }
    }
  }
}
```

#### App.json Configuratie ✅
```json
{
  "ios": {
    "entitlements": {
      "aps-environment": "production"  // Voor productie build
    }
  },
  "plugins": [
    "expo-notifications"
  ]
}
```

## Uitgebreide listing informatie

- **Status**: MVP geïmplementeerd (12 nov 2025)
- **Beschrijving**: Listings bevatten nu uitgebreide metadata voor betere vindbaarheid en gebruikerservaring, inclusief openingstijden, voorzieningen, huisregels en publicatiestatus.
- **Nieuwe velden**:
  - **Publicatiestatus**: Draft/live toggle voor gefaseerde publicatie
  - **Openingstijden**: Flexibele tekstinvoer voor beschikbaarheid (bijv. "Ma-Vr 9-17, Za 10-16")
  - **Voorzieningen**: Selecteerbare badges voor locatiekenmerken (24/7 toegang, parkeren, toegankelijkheid, etc.)
  - **Huisregels**: Specifieke regels en richtlijnen per locatie
  - **Contactinformatie**: Hoe mensen de locatiebeheerder kunnen bereiken
- **Technische implementatie**:
  - Backend schema uitgebreid met `publishStatus` (draft/live) en `facilities` group veld
  - Access control: Alleen live listings zichtbaar voor publiek, drafts alleen voor eigenaar/admin
  - TypeScript types automatisch gegenereerd via Payload sync
  - Facilities als array van select-opties voor gestructureerde data
- **UI flows**:
  - **Aanmaken**: Nieuwe "Voorzieningen" stap in 6-staps wizard met intuïtieve selectie
  - **Publicatiestatus**: Directe toggle tussen concept en publiek tijdens aanmaken
  - **Weergave**: Listing detail toont alle metadata in georganiseerde secties
  - **Beheer**: Management dashboard toont publicatiestatus badges (groen voor live, oranje voor draft)
- **Gebruikersvoordelen**:
  - **Ontdekbaarheid**: Betere filtering mogelijk op voorzieningen (toegankelijkheid, openingstijden)
  - **Verwachtingsmanagement**: Duidelijke communicatie over beschikbaarheid en regels
  - **Community building**: Meer context helpt mensen de juiste locaties te vinden
  - **Kwaliteit**: Draft modus geeft eigenaren tijd om listings te perfectioneren

## Slimme filtering voor kasten

- **Status**: MVP geïmplementeerd (12 nov 2025)
- **Beschrijving**: Geavanceerde filtering systeem ontworpen specifiek voor altijd toegankelijke buurtkasten op straat, met focus op locatie en voorzieningen.
- **Filter categorieën**:
  - **Type kast**: Boekenkast, Voedselkast, Hygiënekast, Gemeenschapskast
  - **Voorzieningen**: Rolstoeltoegankelijk, Verlicht, Beschut, Beveiligingscamera
  - **Locatie features**: Bij OV-halte, Parkeren beschikbaar, Binnenlocatie
- **Technische implementatie**:
  - Multi-select filtering met AND/OR logica per categorie
  - Smart location heuristics (adres keyword matching voor OV, parkeren via voorzieningen)
  - Uitgebreide search scope: naam, beschrijving, adres, openingstijden, huisregels
  - Real-time filtering zonder backend calls (client-side processing)
- **UI/UX features**:
  - **Filter chips**: Visuele selectie met iconen en kleuren
  - **Active filter indicator**: Badge op filter knop bij actieve filters
  - **Wis alle filters**: Snelle reset in filter paneel en lege resultaten
  - **Contextuele labels**: "Type kast" i.p.v. "Type locatie" voor betere begrijpelijkheid
- **Cabinet-specifieke optimalisaties**:
  - **Altijd toegankelijk**: Geen 24/7 filter nodig (dat is standaard)
  - **Straat-locatie focus**: Filters voor nabijheid OV, parkeren, veiligheid
  - **Onderhoud awareness**: Potentiële uitbreiding voor onderhoud status
  - **Community context**: Filters die helpen bij lokale behoeften identificatie

## Offline foto-upload

- **Status**: MVP geïmplementeerd (11 nov 2025)
- **Beschrijving**: Gebruikers kunnen foto’s indienen bij listings zelfs zonder internetverbinding. Foto’s worden lokaal opgeslagen en automatisch geüpload zodra er weer verbinding is.
- **Belangrijkste flows**:
  - Offline detectie: App controleert internetverbinding via `NetInfo` voor elke upload
  - Lokale queue: Foto’s worden opgeslagen in `expo-file-system` en geregistreerd bij `FileQueueManager`
  - Placeholder records: Lokale SQLite database krijgt placeholder entries met `status: "queued"`
  - Automatische sync: Bij herstel van verbinding worden gequeue fotos automatisch geüpload via `SyncManager`
  - Moderatie notificaties: Gebruikers krijgen meldingen zodra hun foto’s zijn goedgekeurd/afgewezen
- **Technische implementatie**:
  - `useRequestListingPhoto` hook detecteert online/offline status
  - `FileQueueManager` handelt lokale file opslag en upload queue
  - `SyncManager.resolvePendingPhotos()` mapped geüploade media IDs terug naar listing records
  - `useModerationNotifications` hook monitort status veranderingen elke 30 seconden
- **UI feedback**:
  - Listing detail toont "Foto in wachtrij" status met disabled upload button
  - Manage listings toont aparte secties voor queued vs pending fotos
  - Verschillende success berichten voor online ("Bedankt!") vs offline ("Foto opgeslagen!")
  - QueuedPhotoItem component toont lokale afbeeldingen met upload status indicatoren
- **Offline resilience**:
  - Foto’s blijven beschikbaar na app herstart
  - Upload hervat automatisch bij netwerk herstel
  - Sync conflicten worden automatisch opgelost
  - Retry logica met exponentiële backoff voor falende uploads

## Reviewproces (volgende iteraties)

- Automatische e-mail/push naar eigenaar bij nieuwe foto.
- Historiek tonen van goedgekeurde/afgewezen foto’s.
- Moderatiereden verplicht maken bij afwijzen + feedback naar indiener.
- Filters in listingdetail (bijv. recente foto’s vs. community highlights).
- E-mailprovider integreren voor transactie- en notificatieberichten (bijv. Resend of SendGrid), met templating en opt-out beheer.

## Product backlog snippets

- **Mobile offline**: queue voor foto’s + listing CRUD synchroniseren.
- **Community badges**: erken gebruikers die vaak goede foto’s delen.
- **Analytics**: inzicht in aantal pending requests per listing/eigenaar.

---

## Verbeterde onboarding flow

- **Status**: MVP geïmplementeerd (13 nov 2025)
- **Beschrijving**: Complete herontwerp van de onboarding flow specifiek voor buurtkasten, met interactieve elementen en duidelijke call-to-actions.
- **Nieuwe onboarding stappen**:
  - **Welkom**: Uitleg buurtkast concept met visuele voorbeelden van kast types (boeken, voedsel, hygiëne, gemeenschap)
  - **Verkennen**: Kaart ontdekken met duidelijke navigatie hints
  - **Filteren**: Interactieve demo van het nieuwe filtering systeem met voorbeeld chips
  - **Bijdragen**: Uitleg van gemeenschapsdeelname (nemen/brengen, foto's toevoegen, kasten registreren)
  - **Account**: Directe call-to-action voor account aanmaken met geruststellende messaging
  - **Klaar**: Motiverende afsluiting met duidelijke next steps
- **Interactieve elementen**:
  - **Kast type visualisatie**: Grid van kast iconen met kleuren in welcome stap
  - **Filter demo**: Live voorbeeld van filter chips in filtering stap
  - **Account button**: Directe navigatie naar account aanmaken tijdens onboarding
  - **Progress indicator**: Visuele voortgang met 6 duidelijke stappen
- **UX verbeteringen**:
  - **Contextuele content**: Aangepast voor altijd toegankelijke straat kasten
  - **Visual hierarchy**: Betere iconen, kleuren en spacing
  - **Skip optie**: Gebruikers kunnen altijd overslaan maar worden aangemoedigd door te gaan
  - **Smart timing**: Start automatisch bij eerste login maar met vertraging voor goede UX
- **Conversie optimalisatie**:
  - **Account aanmoediging**: Duidelijke benefits van account aanmaken
  - **Community focus**: Benadrukken van bijdragen aan lokale gemeenschap
  - **Progressive disclosure**: Bouw kennis stap voor stap op
  - **Clear CTAs**: Elke stap heeft duidelijke next action

## 🎨 Uitgebreide UX/UI Verbeteringen

- **Status**: MVP geïmplementeerd (13 nov 2025)
- **Beschrijving**: Complete redesign van de visual design system, interacties en user experience.
- **Nieuwe Design System Componenten**:
  - **Moderne Kleurenpalet**: Uitgebreid color system met gradients, semantic colors, en accessibility ondersteuning
  - **Typography Scale**: Complete Material Design typography systeem (Display, Headline, Title, Body, Label)
  - **Component Library**: Herbruikbare componenten (GradientButton, Toast, LoadingSkeleton)
  - **Spacing & Layout**: Consistente spacing systeem gebaseerd op 4px grid

- **Tab Bar Verbeteringen**:
  - **Nieuwe Icons**: Betere iconen voor kast concept (business i.p.v. search voor hoofdtab)
  - **Interactive States**: Gekleurde achtergronden bij actieve tabs met subtiele animaties
  - **Betere Typografie**: Gewicht en spacing optimalisaties
  - **Platform Optimalisatie**: iOS safe area en Android elevation

- **Verbeterde Lege States**:
  - **Animatie Achtergrond**: Zwevende vormen met gradient kleuren voor visuele interesse
  - **Contextuele Iconen**: Verschillende iconen gebaseerd op filter state (filter vs business)
  - **Actie Buttons**: Gradient buttons met iconen voor betere call-to-action
  - **Nuttige Tips**: Informatieve tips sectie voor nieuwe gebruikers
  - **Progressive Disclosure**: Verschillende content gebaseerd op context

- **Card Design Verbeteringen**:
  - **Moderne Schaduwen**: Platform-specifieke schaduwen (iOS blur, Android elevation)
  - **Interactive States**: Pulse effect voor geselecteerde cards met scale animatie
  - **Favoriet Button**: Gradient rode button voor favorieten met betere feedback
  - **Betere Spacing**: Geoptimaliseerde padding en margins

- **Nieuwe Componenten**:
  - **GradientButton**: Herbruikbare component met verschillende varianten en animaties
  - **Toast Notifications**: Geanimeerde toast meldingen met verschillende types
  - **LoadingSkeleton**: Contextuele skeleton loaders voor betere loading experience
  - **Enhanced Empty States**: Uitgebreide lege state componenten met animaties

- **Micro-interacties**:
  - **Touch Feedback**: activeOpacity animaties op alle touchable elementen
  - **Loading Animaties**: Pulse effect voor skeleton loading states
  - **State Transitions**: Vloeiende animaties tussen verschillende states
  - **Visual Feedback**: Betere feedback voor user actions

- **Accessibility Verbeteringen**:
  - **Color Contrast**: Verbeterde contrast ratios voor betere leesbaarheid
  - **Touch Targets**: Minimale 44px touch targets voor betere usability
  - **Semantic Colors**: Dedicated colors voor success, error, warning, info states
  - **Platform Adaptation**: Native look & feel per platform

Laatste update: 13 november 2025.

