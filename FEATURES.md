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

Laatste update: 10 november 2025.

