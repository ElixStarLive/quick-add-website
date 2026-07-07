# QuickPostAds Mobile App

Native Android and iOS app for [QuickPostAds](https://www.quickpostads.co.uk), built with [Capacitor](https://capacitorjs.com/). The app loads your live website inside a native shell — same jobs, login, payments, and contractor features as the site.

## What you get

- **Installable PWA** on the website (Add to Home Screen / Install prompt)
- **Google Play & App Store builds** from this folder
- Black + gold splash screen, full-screen app experience

## Prerequisites

- Node.js 18+
- **Android:** Android Studio + JDK 17
- **iOS (Mac only):** Xcode 15+

## Setup

```bash
cd mobile-app
npm install
npx cap add android
npx cap add ios
npx cap sync
```

## Build Android APK / AAB

```bash
npm run open:android
```

In Android Studio: **Build → Generate Signed Bundle / APK**.

- Use package name: `co.uk.quickpostads.app`
- Upload the AAB to [Google Play Console](https://play.google.com/console)

## Build iOS app

```bash
npm run open:ios
```

In Xcode: set your Team, bundle ID `co.uk.quickpostads.app`, then **Product → Archive** for App Store Connect.

## Local development

The app points at production by default (`capacitor.config.json` → `server.url`).

To test against your local server:

1. Change `server.url` to `http://YOUR_PC_IP:3000`
2. Run `npx cap sync`
3. Rebuild in Android Studio / Xcode

## PWA (no app store)

Users can also install from the website:

- **Android Chrome:** Install banner or menu → Install app
- **iPhone Safari:** Share → Add to Home Screen

## Store listing copy (starter)

**Title:** QuickPostAds — UK Construction Jobs  
**Short description:** Post jobs free. Find local trades. Contractor Pro subscriptions.  
**Category:** Business / Productivity

## Notes

- Stripe payments work inside the WebView (use live keys on production).
- Push notifications can be added later with `@capacitor/push-notifications`.
- Update `server.url` only for dev; production builds should use `https://www.quickpostads.co.uk`.
