// Writes the privacy policies of the six USB tool apps from one template:
//   node scripts/usb-policies.mjs
// The apps share one code base, so their policies share one text; each app turns on only the
// parts that describe features it really has (facts read from each app's code, 2026-10-04).
// Edit this file, run it, then `npm run build` — never edit the generated pages by hand.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content', 'policies');
const UPDATED = 'October 6, 2026';

// ps2       PS2 tools: game list and cover art from our artwork server, game title in crash reports,
//           a POPS system file the user picks is kept for later drives
// browser   label of the built-in browser download, or null
// themes    Ventoy theme gallery link
// erasure   erase certificates (signed with a key kept in the phone's key store)
// windows   Windows setup options written to the USB drive
// ventoyCfg Ventoy settings (menu password, menu options, persistence, themes) written to the drive
// service   why the App runs a foreground service (connected device) with notifications, or null
// docProvider  other apps open files on the USB drive through the Android file picker
// openIn    the file manager hands a file to another app (temp copy in the cache on old Android)
// crypt     password-protected (encrypted) drives
const DL = '<em>Download File Directly To USB FROM INTERNET</em>';
const APPS = [
  { file: 'ultimate_usb_privacy.html', name: 'Ultimate USB', pkg: 'com.mixapplications.ultimateusb',
    ps2: true, browser: `In the Ventoy section, ${DL}`, themes: true, erasure: true, windows: true,
    ventoyCfg: true, docProvider: true, openIn: true, crypt: true,
    service: 'to keep the App running while another app reads a file from your USB drive, while the drive is offered to other apps in the Android file picker, and while a drive is being encrypted' },
  { file: 'drofus_privacy.html', name: 'DROFUS (ISO 2 USB)', pkg: 'com.mixapplications.rufus', windows: true },
  { file: 'ventoy_privacy.html', name: 'Ventoy (Unofficial)', pkg: 'com.mixapplications.ventoy_app',
    browser: DL, themes: true, ventoyCfg: true, openIn: true,
    service: 'to keep the App running while another app reads a file from your USB drive' },
  { file: 'usb_tools_privacy.html', name: 'USB Tools', pkg: 'com.mixapplications.usbtools', ps2: true, erasure: true },
  { file: 'iso2usb_privacy.html', name: 'ISO2USB', pkg: 'com.mixapplications.iso2usb', windows: true },
  { file: 'multios_usb_privacy.html', name: 'MultiOS USB', pkg: 'com.mixapplications.multiosusb', browser: DL },
];

const NETWORKS = `<a href="https://appodeal.com/privacy-policy/" rel="nofollow">Appodeal</a> mediation platform, with AppLovin MAX, Unity LevelPlay and Appodeal&rsquo;s own bidding, and the networks reachable through it: <a href="https://policies.google.com/privacy" rel="nofollow">Google AdMob / Google Ad Manager</a>, <a href="https://aps.amazon.com/aps/privacy-policy/" rel="nofollow">Amazon Publisher Services</a>, <a href="https://legal.applovin.com/privacy/" rel="nofollow">AppLovin (incl. MAX mediation)</a>, <a href="https://www.bidmachine.com/privacy-policy" rel="nofollow">BidMachine</a>, <a href="https://www.bidon.org/privacy-policy" rel="nofollow">Bidon</a>, <a href="https://www.bigossp.com/privacy" rel="nofollow">Bigo Ads</a>, <a href="https://legal.loopme.com/privacy-center" rel="nofollow">Chartboost (LoopMe)</a>, <a href="https://www.digitalturbine.com/legal/privacy-policy" rel="nofollow">Digital Turbine Exchange (Fyber)</a>, <a href="https://advertising.inmobi.com/privacy-policy" rel="nofollow">InMobi</a>, <a href="https://unity.com/legal/game-player-and-app-user-privacy-policy" rel="nofollow">ironSource and Unity Ads (incl. LevelPlay mediation)</a>, <a href="https://www.mintegral.com/en/privacy" rel="nofollow">Mintegral</a>, <a href="https://privacy.mobilefuse.com/" rel="nofollow">MobileFuse</a>, <a href="https://www.moloco.com/terms-and-policies/privacy-portal" rel="nofollow">Moloco</a>, <a href="https://ads.vk.com/documents" rel="nofollow">myTarget / VK Ads</a>, <a href="https://www.ogury.com/privacy-policies/" rel="nofollow">Ogury</a>, <a href="https://www.pangleglobal.com/privacy" rel="nofollow">Pangle</a>, <a href="https://pubmatic.com/legal/privacy-policy/" rel="nofollow">PubMatic</a>, <a href="https://www.smaato.com/privacy/" rel="nofollow">Smaato</a>, <a href="https://www.start.io/policy/privacy-policy-site/" rel="nofollow">Start.io</a>, <a href="https://www.taurusx.com/privacy-policy" rel="nofollow">TaurusX</a>, <a href="https://verve.com/product-privacy-policies/" rel="nofollow">Verve</a>, <a href="https://liftoff.ai/privacy-policy/" rel="nofollow">Vungle (Liftoff)</a>, <a href="https://yandex.com/legal/confidential/en/" rel="nofollow">Yandex Ads (including its AppMetrica SDK)</a>, and <a href="https://www.zmaticoo.com/privacy-policy" rel="nofollow">zMaticoo</a>. The Appodeal SDK also reports its own errors to <a href="https://sentry.io/privacy/" rel="nofollow">Sentry</a>`;

const page = a => {
  const N = a.name;
  const on = (flag, html) => (flag ? html : '');
  const sections = [
    'Overview', 'Where your data is', 'Permissions', 'Tokens, Pro and purchases', 'How ads and consent work',
    'Your choices and controls', 'Data retention and deletion', 'European privacy rights (GDPR)',
    'United States privacy rights (CCPA)', 'Brazil privacy rights (LGPD)', 'Other global privacy rights',
    'Children and audience', 'Data types collected and shared', 'Security', 'Changes to this policy',
    'Data controller and contact',
  ];
  return `<!--meta {"title": "Privacy Policy — ${N.replace(/&rsquo;/g, '’')}", "description": "How ${N} handles data: your files, disk images and drives are processed on your device and never uploaded; what the advertising, analytics, crash-reporting, update and purchase-check services in the app collect; how to opt out; and your rights under GDPR, CCPA and LGPD."} -->
<!-- Generated by scripts/usb-policies.mjs — edit that file, not this one. -->
  <section class="pagehead reveal in">
    <h1>Privacy Policy — ${N}</h1>
    <p>This policy applies to the <strong>${N}</strong> app (<code>${a.pkg}</code>) published by MixApplications. It is specific to ${N}; other MixApplications apps have their own policies, listed in the <a href="privacy_policy.html">general privacy policy</a>. Where the two differ, this page applies to ${N}.</p>
    <span class="stamp">Last updated: ${UPDATED}</span>
  </section>

  <div class="highlight reveal">
    <b>The short version</b>
    <p>${N} works on USB drives directly on your phone. <strong>The contents of your files, disk images and drives are processed on your device and never uploaded.</strong> The App has no account. What is collected comes from the services built into it: ads (with consent where the law requires it), Firebase Analytics (adults only, once the consent step is complete or where none is required), crash reports, an update notice and a purchase check when you buy tokens or Pro.${on(a.ps2, ' The PS2 tools also download game lists and cover art from our artwork server.')} Pro has no ads and no tokens.</p>
  </div>

  <nav class="toc reveal d1" aria-label="Contents">
    <b>Contents</b>
    <ol>
${sections.map((s, i) => `      <li><a href="#s${i + 1}">${s}</a></li>`).join('\n')}
    </ol>
  </nav>

  <article class="panel reveal d2">
<p>This Privacy Policy explains how the mobile app <strong>${N}</strong> (the &ldquo;App&rdquo;), published by <strong>MixApplications</strong> ("we," "us," or "our"), handles information. By downloading or using the App, you agree to the practices described here.</p>

    <h2 id="s1">1. Overview</h2>
    <p>The App reads and writes USB drives (and, on rooted phones, the SD card slot) directly on your device. The <strong>contents</strong> of the files, disk images and drives you work on are processed on your device. We do not upload, collect or receive them. The App has no user accounts.</p>
    <p>The App connects to the internet for the following, each described below:</p>
    <ul>
        <li><strong>Ads</strong> through the Appodeal mediation platform and the ad networks reachable through it, after consent where the law requires it (Sections 5 and 13). Not in Pro.</li>
        <li><strong>Firebase Analytics</strong>, switched on only for users Google Play does not report as under 18, and only once the consent step is complete (or where your region requires none) (Section 13).</li>
        <li><strong>Crash reports</strong> sent to Firebase Crashlytics when the App crashes or hits an error (Section 13).</li>
        <li><strong>Update notice.</strong> When the App starts, it asks <strong>Google Firebase Remote Config</strong> whether a newer version is available or required. Firebase receives a Firebase installation identifier and basic app and device details.</li>
        <li><strong>Time check.</strong> The App asks public internet time servers (such as Google&rsquo;s, Apple&rsquo;s, Microsoft&rsquo;s, NIST&rsquo;s and the NTP Pool&rsquo;s) for the current date. The request contains no information about you; like any connection, it shows your IP address to that time server.</li>
        <li><strong>Purchase check</strong> when you buy tokens or Pro (Section 4).</li>
        <li><strong>Ad connection check</strong> (free version only). To tell you when an ad blocker or Private DNS stops ads from loading, the App tries to connect to a few advertising servers. Nothing is sent beyond the connection attempt. The free version needs an internet connection: running operations pause while you are offline or while ads are blocked.</li>
${on(a.ps2, `        <li><strong>Game artwork.</strong> The PS2 tools download the game list and cover art (for PS2 and PS1 games) from our artwork server (<code>oplm.mixapplications.com</code>). A cover-art request carries only the identifier of a game found on your drive (such as its disc serial) and your IP address; file contents are never sent.</li>\n`)}${on(a.browser, `        <li><strong>Downloads you start.</strong> ${a.browser} opens a built-in browser that starts at Google; text you type that is not a web address is sent to Google Search. The websites you visit receive your requests as in any browser, and the file you choose is downloaded from that website straight onto your USB drive. Those requests go to the websites you choose, not to us.</li>\n`)}${on(a.themes, `        <li><strong>Ventoy themes.</strong> The theme gallery opens the theme website (gnome-look.org) in your browser.</li>\n`)}    </ul>

    <h2 id="s2">2. Where Your Data Is</h2>
    <ul>
        <li><strong>Your files, disk images and drives</strong> stay where they are. Files the App creates are saved on your USB drive or where you choose with the Android file picker.</li>
${on(a.windows, `        <li><strong>Windows setup choices</strong> (such as a local account name, and regional settings copied from your phone; the App does not ask for a password, and Windows asks you to set one at first sign-in) are prepared in the App&rsquo;s private cache, written to the USB drive you are preparing, and then deleted from the cache. They are never sent anywhere.</li>\n`)}${on(a.ventoyCfg, `        <li><strong>The Ventoy settings you choose</strong> (a boot-menu password, which is stored on the drive as typed or as an MD5 hash; menu options such as the Windows 11 bypass switches and keyboard layout; persistence files and themes) are written only to the Ventoy drive. They are never sent anywhere.</li>\n`)}${on(a.erasure, `        <li><strong>Erase certificates</strong> contain the date, time and time zone of the wipe, a random report number, the drive&rsquo;s serial number, vendor, product name and USB identifiers, your phone&rsquo;s make, model and Android version, the App version, and the operator details you type in (such as name, title, organisation, location, contact, asset number and media source). The operator details are saved in the App&rsquo;s private storage so you do not have to type them again. Each certificate is signed with a key created and kept in your phone&rsquo;s secure key store, and shows that key&rsquo;s fingerprint so it can be checked; certificates from the same phone can therefore be recognised as such. The key never leaves your phone. Certificates are created on your device and leave it only if you save or share them yourself.</li>\n`)}${on(a.crypt, `        <li><strong>Passwords for encrypted drives</strong> are used on your device only to lock or unlock the drive. They are never stored or sent anywhere.</li>\n`)}${on(a.docProvider, `        <li><strong>Other apps</strong> can open files on your USB drive through the Android file picker, only when you choose those files there.</li>\n`)}${on(a.openIn, `        <li><strong>Files you open in another app</strong> from the App&rsquo;s file manager are passed to the app you choose, which can read that file on your USB drive and save changes to it. On older Android versions, or if that is not possible, a temporary copy is placed in the App&rsquo;s cache instead.</li>\n`)}${on(a.ps2, `        <li><strong>PS1 system file.</strong> If you choose a POPS file for PS1 games, the App keeps a copy in its private storage so it can add it to later drives without asking again. It is never sent anywhere.</li>\n`)}        <li><strong>Your token balance, Pro status, purchase records and settings</strong> are kept in the App&rsquo;s private storage on your device, which other apps cannot read. Your token balance is never sent anywhere.</li>
        <li><strong>Temporary files</strong> (working files used while preparing a drive${on(a.openIn, ', and copies of files you open in another app')}${on(a.erasure, ', and the copies made when you save or share an erase certificate')}) are kept in the App&rsquo;s cache and deleted when the operation finishes; any left behind by an interrupted operation are removed the next time the App starts or when Android clears the cache.${on(a.ps2, ' The downloaded PS2 game list stays in the cache, so it does not have to be downloaded again, until Android clears the cache or you clear the App&rsquo;s data.')}${on(a.browser, ' The built-in browser keeps its own website data (such as cookies) in the App&rsquo;s private storage, and, while a download is unfinished, a small progress file named after the file being downloaded (its size and how much has arrived, so it can resume) is kept in the cache until the download completes or you clear the App&rsquo;s data.')}</li>
    </ul>

    <h2 id="s3">3. Permissions</h2>
    <p>The App asks for or declares only what its features need:</p>
    <ul>
        <li><strong>USB access</strong>: to read and write a USB drive directly, after you allow it in Android&rsquo;s prompt.</li>
        <li><strong>Wake lock</strong>: to keep the phone awake during a long operation.</li>
${on(a.service, `        <li><strong>Foreground service (connected device), the network-change permission Android requires for it, and notifications</strong>: ${a.service}.</li>\n`)}        <li><strong>Internet and network state</strong>: for ads, Firebase, Google Play billing, the connection check and the time check.</li>
        <li><strong>Advertising ID</strong>: used by the ad partners as described in Section 5.</li>
        <li><strong>Root access</strong> (rooted phones only): used only for the SD card slot. Your root manager may ask when the App starts; you can refuse. This is a prompt from your root manager, not an Android permission.</li>
    </ul>
    <p>The Google libraries and ad SDKs in the App add their own standard entries, as their documentation describes: Google Play Billing adds the in-app purchase permission; the ad SDKs add Android&rsquo;s advertising-services permissions (ad ID, attribution and topics), Wi-Fi state, vibration, a licence-check permission and, for some networks, a fraud-prevention attestation permission; Firebase adds access to the Google Play Install Referrer service and a Firebase Cloud Messaging receive permission (the App sends no push messages); Android&rsquo;s background-work library adds a foreground-service permission. The App requests <strong>no storage permission and no access to all files</strong>, and no location, contacts, camera, microphone, the list of installed apps, permission to install apps or to start at boot; those that libraries would add are removed from the App.</p>

    <h2 id="s4">4. Tokens, Pro and Purchases</h2>
    <p>Some operations cost <strong>tokens</strong>. You can get a free token by choosing to watch a rewarded video ad (<em>Get 1 free token</em>), or buy a token pack (<em>Get 5 Tokens</em>). <strong>Pro Version</strong> is a one-time purchase: lifetime, no tokens needed and no ads. Your token balance is kept only on your device: uninstalling the App or clearing its data deletes it, while Pro stays tied to your Google account and comes back automatically.</p>
    <p>Purchases are processed by <strong>Google Play</strong> under the <a href="https://policies.google.com/privacy" rel="nofollow">Google privacy policy</a>. To confirm a purchase, and to complete it with Google Play where needed, the App sends the product identifier, the App&rsquo;s package name, the Google-issued <strong>purchase token</strong> and, when completing a purchase, whether it is a consumable (tokens) or not (Pro), over an encrypted connection (HTTPS) to our purchase check, a small program we run on Google Cloud (Firebase Cloud Functions). It asks Google Play whether the purchase is valid. Nothing else is sent: no name, email, file or drive data, and not your token balance. As Google documents for Firebase, the call also carries your connection&rsquo;s IP address and a Firebase installation identifier. We do not store the purchase token or the answer in a database. When an earlier version of the App uses the older form of our purchase check, the server also writes Google Play&rsquo;s answer about that purchase (such as its order number, purchase time, state and country) to its logs, which we use to verify purchases and to check for refunds. Google Cloud keeps these logs, like its usual technical request logs, for 30 days. Each time the App starts, it asks Google Play which purchases you own, so there is no separate restore step; a purchase restored this way (for example after reinstalling) is checked in the same way.</p>
    <p>We never receive your payment card or banking details. Google provides us with transaction records (such as order number, product, price, date and country) in the Google Play Console, which we use only for accounting, tax and refunds.</p>

    <h2 id="s5">5. How Ads and Consent Work</h2>
    <p>Ads (banners, native ads, full-screen ads and the optional reward videos) are provided through the <strong>Appodeal</strong> mediation platform and the advertising networks reachable through it (listed in Section 13). Before the App sets up ads or requests any ad, it asks for consent through Appodeal&rsquo;s consent manager, with Google&rsquo;s User Messaging Platform (UMP) as a fallback, where the law requires it (for example in the EEA and the UK), and records your choice. If you do not consent, ads are shown without personalisation. Pro users see no ads: the App does not set up ads, request any ad or show the consent form for them. Some ad libraries start a small component when the App opens, for every user, as their own documentation describes.</p>
    <p>${N} shows ads. Google AdMob and the other advertising partners named in this policy may serve ads, collect information directly from your device, and use your device&rsquo;s advertising ID (and, inside the web content of an ad, cookies or similar technologies) to show ads, limit how often you see them, measure their performance, prevent fraud and, where you have consented or the law allows, personalize them. To learn how Google uses this information, see <a href="https://policies.google.com/technologies/partner-sites" rel="nofollow">How Google uses information from sites or apps that use our services</a>. You can choose whether Google shows you personalized ads in <a href="https://myadcenter.google.com/" rel="nofollow">My Ad Center</a>, and you can reset or delete your advertising ID at any time in your Android settings (<em>Settings &rarr; Privacy &rarr; Ads</em>, or <em>Settings &rarr; Google &rarr; Ads</em> on some devices).</p>

    <h2 id="s6">6. Your Choices and Controls</h2>
    <ul>
        <li><strong>Privacy Settings.</strong> Where a privacy choice is required for you, the <em>Help</em> (?) icon on the main screen opens a menu with <em>Privacy Settings</em>. It reopens the consent form so you can change or withdraw your consent. If your choice was made in Google&rsquo;s fallback form, clear the App&rsquo;s data to be asked again, or contact us (Section 16).</li>
        <li><strong>Privacy Policy</strong> in the same menu opens this page in your browser (earlier versions open our general privacy policy, which links here).</li>
        <li><strong>Device controls.</strong> You can reset or delete your advertising ID in your Android settings, and choose ad personalisation in <a href="https://myadcenter.google.com/" rel="nofollow">My Ad Center</a>, at any time.</li>
        <li><strong>Pro</strong> removes ads entirely.</li>
    </ul>

    <h2 id="s7">7. Data Retention and Deletion</h2>
    <p>We do not maintain a database of users.</p>
    <ul>
        <li><strong>On-device data</strong> (token balance, Pro status, purchase records, settings${on(a.erasure, ', saved operator details')}${on(a.ps2, ', a saved POPS file')}, cached files and the data the consent and ad SDKs keep) is deleted when you uninstall the App or clear its data. Files written to your USB drive stay there. On Android 11 and older the App&rsquo;s data is not included in Android backups; on Android 12 and later, if Android backup is switched on, Android may include it in your device backup (which Google holds for you and you manage in your Google account settings) or in a transfer to a new device.</li>
        <li><strong>Crashlytics</strong> data is retained for 90 days and <strong>Firebase Analytics</strong> data for 2 months, then deleted automatically.</li>
        <li><strong>Purchase checks</strong> are answered and not stored by us (Section 4).</li>
${on(a.ps2, `        <li><strong>Requests to our artwork server</strong> are answered and not linked to you; only standard server request logs are kept.</li>\n`)}        <li><strong>Advertising data</strong> is retained by each advertising partner under its own policy (Section 13).</li>
        <li><strong>Purchase records</strong> are held by Google Play under Google&rsquo;s policy; the transaction records we see in the Play Console are kept as long as tax and accounting law requires.</li>
    </ul>
    <p><strong>Deletion requests:</strong> we do not offer a data deletion service. We keep no user database and no account, so we hold no data from the App that we can find and delete for one person. Data collected through Firebase is deleted automatically (Crashlytics after 90 days, Analytics after 2 months). To limit advertising data, reset or delete your advertising ID in your Android settings, change your ad consent in the App (where it is shown for your region: the <em>Help</em> (?) icon &rarr; <em>Privacy Settings</em>), or contact the advertising partner directly (Section 13). Uninstalling the App or clearing its data removes what it keeps in its own storage on your device (see above).</p>

    <h2 id="s8">8. European Privacy Rights (GDPR)</h2>
    <p>If you are located in the EU/EEA or the UK, your personal data is processed in accordance with the General Data Protection Regulation (GDPR) and UK GDPR. The legal bases are <strong>consent</strong> (personalised advertising), <strong>legitimate interests</strong> (fixing crashes, usage analytics for adults, update notices, preventing fraud and invalid traffic, and non-personalised ads; you can object at any time, Section 16), <strong>performance of a contract</strong> (providing the tokens and Pro you buy) and compliance with <strong>legal obligations</strong> (tax and accounting). Google acts as our processor for Firebase. You have the following rights:</p>
    <ul>
        <li>The right to request access to the personal data that we process.</li>
        <li>The right to correct inaccurate personal data.</li>
        <li>The right to request deletion of your personal data.</li>
        <li>The right to restrict or object to processing, and to data portability.</li>
        <li>The right to withdraw your consent at any time (Section 6).</li>
        <li>The right to lodge a complaint with a supervisory authority.</li>
    </ul>

    <h3>International data transfers</h3>
    <p>MixApplications is based in Egypt. The service providers named in this policy, such as Google and our advertising partners, may process data in other countries, including the United States and member states of the European Union. When data from the EEA, the UK or Switzerland is transferred to a country without an adequacy decision, these providers rely on recognised safeguards such as the European Commission&rsquo;s Standard Contractual Clauses.</p>

    <h2 id="s9">9. United States Privacy Rights (CCPA)</h2>
    <p>This section covers the California Consumer Privacy Act (CCPA/CPRA) and the privacy laws of Virginia (VCDPA), Colorado (CPA), Connecticut (CTDPA) and Utah (UCPA).</p>
    <ul>
        <li><strong>Right to Know About Data Sales:</strong> You have the right to know whether your personal data is sold or shared.</li>
        <li><strong>Right to Know:</strong> You have the right to request disclosure of what personal data we collect and share.</li>
        <li><strong>Right to Delete:</strong> You have the right to request the deletion of your personal data.</li>
        <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights.</li>
        <li><strong>Right to Opt-Out of Sale or Sharing:</strong> You have the right to opt out of the &ldquo;sale&rdquo; or &ldquo;sharing&rdquo; of your personal data for targeted advertising.</li>
    </ul>

    <h3>How to Opt-Out of the Sale or Sharing of Your Data</h3>
    <ul>
        <li><strong>In the App:</strong> where it is shown for your region, open the <em>Help</em> (?) icon and choose <em>Privacy Settings</em> (Section 6).</li>
        <li><strong>Email Request:</strong> send an opt-out request to our Data Protection Officer at <a href="mailto:islam.saad2005@gmail.com">islam.saad2005@gmail.com</a>.</li>
        <li><strong>Device Settings:</strong> reset or delete your device&rsquo;s advertising ID in your Android settings (<em>Settings &gt; Google &gt; Ads</em>).</li>
    </ul>

    <h2 id="s10">10. Brazil Privacy Rights (LGPD)</h2>
    <p>Under the Lei Geral de Prote&ccedil;&atilde;o de Dados (LGPD), users in Brazil have the right to request access, correction, anonymization, blocking, or deletion of personal data. You can exercise these rights using the contact details in Section 16, and opt out of personalised advertising using the methods in Section 6.</p>

    <h2 id="s11">11. Other Global Privacy Rights</h2>
    <p>We aim to honor data subject rights for users in other jurisdictions with comprehensive privacy laws, including Canada (PIPEDA), South Korea (PIPA), Japan (APPI), China (PIPL), South Africa (POPIA), India (DPDPA), and Australia (Privacy Act 1988), to the extent required by applicable law. Where those laws apply to you, you may request access, correction, or deletion using the contact details in Section 16. This section describes rights we extend on request and is not a representation of independently certified or audited compliance with each named framework.</p>

    <h2 id="s12">12. Children and Audience</h2>
    <p>${N}&rsquo;s declared target audience on Google Play is users <strong>aged 18 and older</strong>. The App is <strong>not directed to children</strong>, and we do not knowingly collect personal information from children. Because an app store cannot prevent a younger user from installing an app, the App uses Google Play&rsquo;s <strong>Age Signals API</strong>. Google Play &mdash; not the App &mdash; decides whether to share an age range, and may show its own prompt asking permission to do so.</p>
    <ul>
        <li>If Google Play reports a user <strong>under 18</strong>, or a supervised account with a pending or declined approval, ad requests are tagged as child-directed and under the age of consent, and ads are <strong>never personalised</strong>.</li>
        <li>Purchases are turned off for users reported <strong>under 13</strong> and for supervised accounts with a pending or declined approval; for users <strong>aged 13&ndash;17</strong>, a purchase first needs a parental check.</li>
        <li>Firebase Analytics stays off for anyone reported as under 18.</li>
        <li>If Google Play reports an adult, or shares nothing, the App uses its normal settings, where personalisation still depends on your consent (Section 6).</li>
    </ul>
    <p>We receive only a broad age range, never a birth date or identity document. It is kept in memory for the current session only, is not stored, and is asked for again the next time the App starts. If you believe a child has sent us personal information, contact us (Section 16) and we will delete it.</p>

    <h2 id="s13">13. Data Types Collected and Shared</h2>
    <p>To operate, monetize and improve the App, we collect and share specific categories of data through third-party SDKs. In line with our Google Play Data safety declaration, the App collects and/or shares the following data types:</p>
    <ul>
        <li><strong>Diagnostics</strong>: crash logs and other app performance data: stack traces, device model and Android version, how the App was installed, and technical details of the operation that failed (such as the partition layout, file system, write settings and the drive&rsquo;s error codes). A crash report can also contain the address or name of a file you picked and error text that includes a file path${on(a.ps2, ', and the title of a PS2 game being processed')}. File contents are never included. Crash reporting is used for every user, to keep the App working.</li>
        <li><strong>App interactions</strong>: through Firebase Analytics (adults only, once the consent step is complete or where none is required) and through the advertising SDKs.</li>
        <li><strong>Approximate location</strong>: inferred by advertising SDKs from network information; the App does not request or use Android location permissions or APIs.</li>
        <li><strong>Device or other IDs</strong>: the advertising ID, the Firebase installation ID, and your IP address, which every network request carries.</li>
        <li><strong>Purchase history</strong>: purchase tokens of the tokens and Pro you buy, processed as described in Section 4.</li>
    </ul>

    <div class="table-container">
        <table>
            <thead>
                <tr>
                    <th>SDK Provider Category</th>
                    <th>Purpose of Collection</th>
                    <th>Retention Period</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Analytics &amp; Crash Reporting (<a href="https://firebase.google.com/support/privacy" rel="nofollow">Firebase</a> Analytics and Crashlytics)</strong></td>
                    <td>Bug fixing (Crashlytics, every user); Analytics only for adults, once the consent step is complete or where none is required</td>
                    <td>Crashlytics data is retained for 90 days; Firebase Analytics data for 2 months. Deleted automatically thereafter.</td>
                </tr>
                <tr>
                    <td><strong>Update notices (Firebase Remote Config)</strong></td>
                    <td>Telling you when a newer version is available or required</td>
                    <td>Held by Google Firebase under the <a href="https://firebase.google.com/support/privacy" rel="nofollow">Firebase privacy terms</a>; not stored by us.</td>
                </tr>
                <tr>
                    <td><strong>Purchase verification (our server-side functions, via Google Play Billing)</strong></td>
                    <td>Confirming and completing token and Pro purchases</td>
                    <td>Not stored in a database; Google Play&rsquo;s answer to the older form of the check is kept in server logs for 30 days (Section 4).</td>
                </tr>
${on(a.ps2, `                <tr>
                    <td><strong>Game artwork (our artwork server)</strong>: PS2 tools</td>
                    <td>Downloading the game list and cover art for the games on your drive; receives game identifiers and your IP address as part of the request</td>
                    <td>Not linked to you and not stored beyond standard server request logs.</td>
                </tr>
`)}                <tr>
                    <td><strong>Ad Networks &amp; Mediation</strong> (${NETWORKS})</td>
                    <td>Advertising, Marketing, Ad personalization (where consented / permitted)</td>
                    <td>Subject to each respective partner&rsquo;s policy.</td>
                </tr>
                <tr>
                    <td><strong>Play Age Signals (Google Play)</strong></td>
                    <td>Determining an age-appropriate advertising and purchase experience (Section 12)</td>
                    <td>Not stored by us; kept in memory for the current session and asked for again on the next start.</td>
                </tr>
            </tbody>
        </table>
    </div>
    <p class="fnote">The set of active ad networks may change as the mediation configuration is updated; this page is revised accordingly.</p>

    <h2 id="s14">14. Security</h2>
    <p>Data sent by the App to Firebase, Google Play, our purchase check${on(a.ps2, ', our artwork server')} and the ad partners travels over encrypted (HTTPS) connections. Your token balance, Pro status and settings are kept in the App&rsquo;s private storage, which other apps cannot read. Our purchase check keeps no database of users or purchases, so there is no store of personal data on our side that could be breached. No method of transmission or storage is perfectly secure, but we limit what leaves your device to what is described in this policy.</p>

    <h2 id="s15">15. Changes to This Privacy Policy</h2>
    <p>We may update this policy periodically. We will notify you by updating the &ldquo;Last updated&rdquo; date at the top.</p>

    <h2 id="s16">16. Data Controller and Contact Information</h2>
    <p>Our company, <strong>MixApplications</strong>, acts as the Data Controller responsible for the personal data processed under this policy.</p>
    <ul>
        <li><strong>Name of Data Controller:</strong> MixApplications</li>
        <li><strong>Data Protection Officer (DPO):</strong> Islam Saad Darwish Mohammed</li>
        <li><strong>Contact Email:</strong> <a href="mailto:islam.saad2005@gmail.com">islam.saad2005@gmail.com</a></li>
        <li><strong>Support:</strong> <a href="contact.html">https://www.mixapplications.com/contact.html</a></li>
    </ul>
    <p>We answer privacy requests (access, correction, deletion, objection or opt-out) free of charge and within 30 days, or within the shorter period your local law sets. We may ask you to confirm that a request comes from you before we act on it. Because we hold no data from the App tied to you as a person, we answer a deletion request by explaining this and pointing you to the steps in Section 7.</p>
    <address>
        <strong>Company Address:</strong><br>
        MixApplications<br>
        Floor No. 6, Building No. 3, Zahraa Street<br>
        Desouk, Kafr El-Sheikh 33611<br>
        Egypt
    </address>
  </article>
`;
};

for (const a of APPS) {
  fs.writeFileSync(path.join(OUT, a.file), page(a));
  console.log('wrote src/content/policies/' + a.file);
}
