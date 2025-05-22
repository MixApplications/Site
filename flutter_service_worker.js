'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {"app-ads.txt": "b50d98c82f398c3892ec31e48f386f09",
"assets/AssetManifest.bin": "b074dd6a08eb29eca8d44c9e5e6c8260",
"assets/AssetManifest.bin.json": "a24bc88f317aa64a3d6b740131d8709b",
"assets/AssetManifest.json": "37968b83663a4f592e567cf5cf78c01f",
"assets/assets/fonts/OpenSans-Regular.ttf": "7df68ccfcb8ffe00669871052a4929c9",
"assets/assets/icons/behance.svg": "1487dff57f5c15131037cb6965a4d0bf",
"assets/assets/icons/bloc.png": "977fbfba561065f9a68c4b47f9774531",
"assets/assets/icons/check.svg": "bce7a581bb999caac446c9138a57a401",
"assets/assets/icons/dart.png": "1ab71d33e7ba834836197b4fa8726da0",
"assets/assets/icons/download.svg": "8c24d4679cb0c5297277321bf7b65d28",
"assets/assets/icons/dribble.svg": "cf842513f50591eb280695ad14bfa409",
"assets/assets/icons/facebook.svg": "0f2864779a4fb4565284e23688e963ab",
"assets/assets/icons/firebase.png": "36170822afe4c716cfbdb96dac8cd10e",
"assets/assets/icons/flutter.png": "1105c9a994c1a6638daed558d5b631fd",
"assets/assets/icons/github.svg": "20a83365f380c8f8d8ed3553c08ad630",
"assets/assets/icons/java.png": "69312787efe1f0f388e1856d7d6b6d3d",
"assets/assets/icons/kotlin.png": "33d049b4ca3c28fbb1903f3a159b1bd9",
"assets/assets/icons/linkedin.svg": "420eb91ed716318e6347d86b8ac8d890",
"assets/assets/icons/playstore.svg": "7cb53e87b5b83d40bbe3b6588cc76a2c",
"assets/assets/icons/twitter.svg": "ad8e3b44d3e4f410cfce43370fe7dc7c",
"assets/assets/images/car.png": "ae3e0dda1da997a4e0ccd5cf1a25d2cd",
"assets/assets/images/ChaoMe%2520Theme%2520Editor%2520COVER.png": "aef8c442ff634d7471af9053c3f7f507",
"assets/assets/images/image.png": "5d19f6e6e491079de696f97cbef2d5ee",
"assets/assets/images/ISO2USB%2520COVER.png": "093705e7d13db043d1a7abf1126a3723",
"assets/assets/images/mixapplications.png": "b9dbe59dcfa58c055abb30b6bf65a341",
"assets/assets/images/MULTIOS%2520COVER.png": "687894266df3afb28dce493b3d432548",
"assets/assets/images/profile.jpg": "a5edd511d7188ef345ef27e90d171194",
"assets/assets/images/Rufus%2520COVER.png": "e08d728acb190aa438ff5b291eef9027",
"assets/assets/images/Theme%2520Editor%2520For%2520EMUI%2520COVER.png": "63b7ffdbfcf6831369a36a17095b8fa3",
"assets/assets/images/Ultimate%2520USB%2520Cover.png": "1015b3ecce95987121ee2bb43e4b3f89",
"assets/assets/images/USB%2520FILE%2520MANAGER%2520COVER.png": "500adc1e8194bf5887df287d59ece966",
"assets/assets/images/USB%2520Tools%2520COVER.png": "d8d71b230781a116f12ed2c5887cb553",
"assets/assets/images/Ventoy%2520COVER.png": "af9b509309da4184b50d2430b10ac2ad",
"assets/FontManifest.json": "2ca6d4e327a8ba6e3a5b8fdfae22a606",
"assets/fonts/MaterialIcons-Regular.otf": "7e8d2f3f03b55fdff7a207bf867a7261",
"assets/NOTICES": "7766379d68c8f294fbf240ced0e3a507",
"assets/packages/font_awesome_flutter/lib/fonts/fa-brands-400.ttf": "4769f3245a24c1fa9965f113ea85ec2a",
"assets/packages/font_awesome_flutter/lib/fonts/fa-regular-400.ttf": "3ca5dc7621921b901d513cc1ce23788c",
"assets/packages/font_awesome_flutter/lib/fonts/fa-solid-900.ttf": "32a15f7713f52ace70814eec9f775ec2",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"canvaskit/canvaskit.js": "26eef3024dbc64886b7f48e1b6fb05cf",
"canvaskit/canvaskit.js.symbols": "efc2cd87d1ff6c586b7d4c7083063a40",
"canvaskit/canvaskit.wasm": "e7602c687313cfac5f495c5eac2fb324",
"canvaskit/chromium/canvaskit.js": "b7ba6d908089f706772b2007c37e6da4",
"canvaskit/chromium/canvaskit.js.symbols": "e115ddcfad5f5b98a90e389433606502",
"canvaskit/chromium/canvaskit.wasm": "ea5ab288728f7200f398f60089048b48",
"canvaskit/skwasm.js": "ac0f73826b925320a1e9b0d3fd7da61c",
"canvaskit/skwasm.js.symbols": "96263e00e3c9bd9cd878ead867c04f3c",
"canvaskit/skwasm.wasm": "828c26a0b1cc8eb1adacbdd0c5e8bcfa",
"canvaskit/skwasm.worker.js": "89990e8c92bcb123999aa81f7e203b1c",
"favicon-16x16.png": "c397993110d2d7dcf71a2f045e13a832",
"favicon-32x32.png": "4f23b1e3ab7596776b9ab3bb4e796167",
"favicon.ico": "a784f0536988377799e64496570a1e58",
"favicon.png": "7db8962dc32f8dfeaebfcfb6edbe36a0",
"flutter.js": "4b2350e14c6650ba82871f60906437ea",
"flutter_bootstrap.js": "e1b6a4cc2a5e0e45f4e8e924428eaef5",
"icon.png": "a082b8611a434c22886a9560dc43da76",
"icons/android-chrome-192x192.png": "fa11b1543520b0d67bf452fb8841eb13",
"icons/apple-touch-icon.png": "ce0dc8f6ba299346976be29ca2d74e72",
"icons/favicon-16x16.png": "c397993110d2d7dcf71a2f045e13a832",
"icons/favicon-32x32.png": "4f23b1e3ab7596776b9ab3bb4e796167",
"icons/favicon.ico": "a784f0536988377799e64496570a1e58",
"icons/Icon-192.png": "ac9a721a12bbc803b44f645561ecb1e1",
"icons/Icon-512.png": "96e752610906ba2a93c65f8abe1645f1",
"icons/Icon-maskable-192.png": "c457ef57daa1d16f64b27b786ec2ea3c",
"icons/Icon-maskable-512.png": "301a7604d45b3e739efc881eb04896ea",
"icons/site.webmanifest": "527a564d78d6dde53f9a6e77e70552da",
"index.html": "34b3c68bb911c61d5c1690450af26a50",
"/": "34b3c68bb911c61d5c1690450af26a50",
"main.dart.js": "f1e8489470a7987d83ad9fbe1ebbefa0",
"manifest.json": "4517f980d6748738cee9ce4f753345ab",
"privacy_policy.html": "16e151684d84db0fab1aadbe0c841873",
"version.json": "fad92f33a102b0a00317ffb32c0cd54a"};
// The application shell files that are downloaded before a service worker can
// start.
const CORE = ["main.dart.js",
"index.html",
"flutter_bootstrap.js",
"assets/AssetManifest.bin.json",
"assets/FontManifest.json"];

// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value, {'cache': 'reload'})));
    })
  );
});
// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        // Claim client to enable caching on first launch
        self.clients.claim();
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      // Claim client to enable caching on first launch
      self.clients.claim();
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});
// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache only if the resource was successfully fetched.
        return response || fetch(event.request).then((response) => {
          if (response && Boolean(response.ok)) {
            cache.put(event.request, response.clone());
          }
          return response;
        });
      })
    })
  );
});
self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});
// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}
// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}
