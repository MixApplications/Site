'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';

const RESOURCES = {".git/config": "a72a9dff1382d602dd49538c64499ce8",
".git/description": "a0a7c3fff21f2aea3cfa1d0316dd816c",
".git/HEAD": "4cf2d64e44205fe628ddd534e1151b58",
".git/hooks/applypatch-msg.sample": "ce562e08d8098926a3862fc6e7905199",
".git/hooks/commit-msg.sample": "579a3c1e12a1e74a98169175fb913012",
".git/hooks/fsmonitor-watchman.sample": "a0b2633a2c8e97501610bd3f73da66fc",
".git/hooks/post-update.sample": "2b7ea5cee3c49ff53d41e00785eb974c",
".git/hooks/pre-applypatch.sample": "054f9ffb8bfe04a599751cc757226dda",
".git/hooks/pre-commit.sample": "5029bfab85b1c39281aa9697379ea444",
".git/hooks/pre-merge-commit.sample": "39cb268e2a85d436b9eb6f47614c3cbc",
".git/hooks/pre-push.sample": "2c642152299a94e05ea26eae11993b13",
".git/hooks/pre-rebase.sample": "56e45f2bcbc8226d2b4200f7c46371bf",
".git/hooks/pre-receive.sample": "2ad18ec82c20af7b5926ed9cea6aeedd",
".git/hooks/prepare-commit-msg.sample": "2b5c047bdb474555e1787db32b2d2fc5",
".git/hooks/push-to-checkout.sample": "c7ab00c7784efeadad3ae9b228d4b4db",
".git/hooks/sendemail-validate.sample": "4d67df3a8d5c98cb8565c07e42be0b04",
".git/hooks/update.sample": "647ae13c682f7827c22f5fc08a03674e",
".git/index": "d3f48c623ac394e4296d60d816fe5555",
".git/info/exclude": "036208b4a1ab4a235d75c181e685e5a3",
".git/objects/00/d2c272e6d94ac1de96622a8267bdd1022d5461": "3391f73e993df7d8ea3e1aab6001c5d4",
".git/objects/02/d2ca2425e6af14ab6d58734497a4dde3acc680": "2755c5491670e5854468fce9d8791aa7",
".git/objects/04/689e2aeaf7326f352079cfc869b8fa00274cc0": "20930e6c5006da6b8151b6ef2ed8cc22",
".git/objects/05/96e91491644c40123a93f10e402237cc61c9cc": "77e300d4692b37ae1a4220cdcd6f3de7",
".git/objects/05/ec4cd699d81707b08a0696f2a7d8bb6c542e11": "950121d58dcc553896ba7535f02e5b40",
".git/objects/08/8dac3659bd8ad8d51531ed16563bf639af6b4c": "7b0b9433c077b61c73e72ebabdff3a98",
".git/objects/0f/ece1059541e41519609059a81a1ecd93b04f3d": "3e185c42fd45e215bc2f84be0201caa2",
".git/objects/16/5da67191b73406e15fc3e6cf7cda3c195dc735": "86cfac30d97fb45bba2f4417782645d6",
".git/objects/1c/d0e78730a04b56193b114acdc157b2b54e0e8e": "cb99ca03e880dfa09492b98e0f23dd47",
".git/objects/20/1afe538261bd7f9a38bed0524669398070d046": "82a4d6c731c1d8cdc48bce3ab3c11172",
".git/objects/26/842f6211ddd38fb69bc3ce120a2657a368d5da": "342b4d80031d6fede961dfea663639ee",
".git/objects/29/e9e605d38445507c405b444419ed76c7e63bfd": "bdedf02282fdaa0e56c6a4728fded573",
".git/objects/2c/a328c881f37465f2e2821eb258822206152577": "37aae3cef9dee7094b1e4f14fcc21fe0",
".git/objects/2e/ceaf3072bcb1a255f771dbc7e2bb41be9001f5": "86034dbfbce90b4ae6d0ef7865bf4387",
".git/objects/2f/a1832e6a74f4b0220b14fa10155b86881b85e7": "a87ae16466a8aef519074ae3bbbd902c",
".git/objects/30/69c8c6d10539ef6b224f7aab028df912b195cc": "e19181f79abf781fa716868f68e4db9d",
".git/objects/32/aa3cae58a7432051fc105cc91fca4d95d1d011": "4f8558ca16d04c4f28116d3292ae263d",
".git/objects/38/82981b37b465d4991b347e3e8be76ddabfa33a": "357a51fc3bc44c0e8e56ff23c49ed6cb",
".git/objects/39/40a326775397c1edf0166901fdb2cd1b3c13cc": "0a4960313f7518d2fab618c2e658bfbf",
".git/objects/3a/7525f2996a1138fe67d2a0904bf5d214bfd22c": "ab6f2f6356cba61e57d5c10c2e18739d",
".git/objects/3c/a576e276e4247f27871cfd3981fbe9866d7b40": "a0713962309f7ba493930ce7904a41ff",
".git/objects/3d/58227e8720b9ee22f4cd2cc55fa246b952f19d": "03fb7acb0f587b89a8200baeb498f6b8",
".git/objects/45/d8e32791e41100a242e628993f9f8231754c8d": "3a606bc6c066402b9a5fa122a120556f",
".git/objects/4e/96085ab1f48994028ddc28c201761b6d63f70d": "94cd9ff792fc817ca6799973972458cb",
".git/objects/5d/15fadf1864d70c7184fca7d3efde79cdf68af5": "79a44d8578cc18e3add64aa6a97f0da0",
".git/objects/5d/5b189d1de6b446d15498fb13e1c293b5a97d76": "e88721d0e1b96d5c10f31b2d1f65a30e",
".git/objects/67/0182d1f7dcbc8c7eef95edac92cd8ad1b410f0": "5805d6d54db60ea863aeb82d93eee8f7",
".git/objects/6a/63b25c7a5d7cbc7f3a4e15b50456eff8a61207": "94dfc72f7c718cad89630ced7849d815",
".git/objects/6b/e909fbf40b23748412f0ea89bf0fae827ed976": "5f118419157d9534688915220cc803f7",
".git/objects/6d/7c7a7fa98b9f28ad3a4324dcd1c33639c8a2be": "85a5947f69bbb23bc959e2778999644d",
".git/objects/77/9f327be225aedd8f5e284166c4957d5eb2c221": "1f05e9f4e9224dcb523f01050ab818b8",
".git/objects/82/b349301039f348952b9cba7133da5f8b368ae3": "c4a163166f94ba4d0439667b9046811d",
".git/objects/83/ce2f92afb772df4690c73bea52ea953428c2e2": "83c1b871be6dda81f80c5f5bc36f4aa4",
".git/objects/84/0516208d35dcb4298847ab835e2ef84ada92fa": "36a4a870d8d9c1c623d8e1be329049da",
".git/objects/88/75b4040365ba6428fe9e5b621a2cd8aae6c142": "9bd7aa5127c70a5ea1725de01e58f83f",
".git/objects/88/cfd48dff1169879ba46840804b412fe02fefd6": "e42aaae6a4cbfbc9f6326f1fa9e3380c",
".git/objects/90/bcfcf0a77ab618a826db0fd8b0942963b653af": "fc109675cdf1233dd6599a4c3c0a7a69",
".git/objects/98/57c9b3b0448c92818efc5fda0f206b21914168": "ecbde07c564dabbec0f249821051b8af",
".git/objects/99/e2ec0acc96f8677b8748baea13f36c211036a3": "31175e975d53256c998623d725efc10e",
".git/objects/a0/f4627235bdc9f72b025772d5cfa7ea05cf8bd0": "cbe76122cce9fb16b8dce68416f51245",
".git/objects/a2/c2c501d92cade4609fbff2a20d058036a0f07d": "5799cad65f96fe00122233a5625d5041",
".git/objects/a2/e9c7607adcb09dc64198f1029ad92bab57d3e9": "5ce568bd222cc505d027b89422835746",
".git/objects/a9/434a3e2848214362cac96cb66fb996c31f6a25": "7cf479692b178c9d91520d2962da966d",
".git/objects/ae/47158f707312678a9ae682f205cbc1512bf562": "51db1d0ba504a4d4e0c07599794e10b8",
".git/objects/b3/86731300279207874dadca3300409c10fb70bd": "5d2da778bf77d7b7f6209c99d65e30da",
".git/objects/b4/7f71fb1ab89fa1d24c56d90e8c515b7a9177ed": "b40ff7370624416c4178ddb8cd1462f7",
".git/objects/b7/49bfef07473333cf1dd31e9eed89862a5d52aa": "36b4020dca303986cad10924774fb5dc",
".git/objects/b7/bc74585793cf5f19db5d1fa8120f7db128475a": "6c6de37570269b33af996f642ce31e75",
".git/objects/ba/2c0494e81c7327ae3af6486089fee078e9d492": "568148cae2bf00a0f8229a7f1c87f555",
".git/objects/be/8aacdbbf40aa56612d7fc65f3e32163d77b514": "f7e8e7ea93bce549d5b33baf3bef5859",
".git/objects/c3/ef8e580e10013b9cbcf0c038c054fbc2c637a5": "54438bd39cd5dd5ff5d218e7f09beae5",
".git/objects/c9/934bad7af6aaf88efb904d804c0851204ae15d": "3d64c919c05e40cd3bd5ffa4a95bd487",
".git/objects/d4/3532a2348cc9c26053ddb5802f0e5d4b8abc05": "3dad9b209346b1723bb2cc68e7e42a44",
".git/objects/d6/9c56691fbdb0b7efa65097c7cc1edac12a6d3e": "868ce37a3a78b0606713733248a2f579",
".git/objects/da/583869080b68387a0edd9d11a12808b339f965": "b4b6cf9477e9a0d60cf25c69eee1b1be",
".git/objects/db/22fbb91645600fde1305e3aa9a9714afb12fef": "7ffb0641e264115b7f410582b26a837d",
".git/objects/e6/bb1485c70a4145ff6b372bb1f87ac8aa85489e": "f2a6888229b274debd223d5895ac7658",
".git/objects/e8/fa04e9c1d6e7541d00ecacd251ba64ce79a38c": "58a819376a2f0bf835ce0595ae69174e",
".git/objects/eb/9b4d76e525556d5d89141648c724331630325d": "37c0954235cbe27c4d93e74fe9a578ef",
".git/objects/ed/572a8b5759b9dc405caaff018e479c797b3902": "8a89bc28e8851740ea469c8ea45bfdab",
".git/objects/ee/31b4390edfc7a3e37bd0a029c70320e774008a": "ebe3088e61586f156feac27490e95bdf",
".git/objects/f0/9724ee15803c60280996e9c8be4daffa18c4ea": "7a7615ceeaf21ca3c7fe3026105a54af",
".git/objects/f0/ef0e022ca42d0d94d7ca8dd4ce66c2ba526a93": "179d62cf56faf774e291bc81afdee26b",
".git/objects/f5/010cda95492006dae3638dfb01a8d0822a1e6a": "04eb9fcdf209b67f396e5ab84cb956e2",
".git/objects/f5/d36bd50fa3a792b5a660269c957d2358941224": "9a92398c7ca7b431c76428eeb9a81c20",
".git/objects/f7/8a8567c3dba92bf3e816f8c8f3eff25c2ad345": "34cfb91f175615d99e603c84e21bb64c",
".git/objects/fa/2e83d860a2dea251171e081e00575a2527ee96": "0f3757c467833b7b2d789db9a29b058b",
".git/objects/fa/6f747c08575445e6988d9dde0507d7fcb0f3de": "74f8f71761e2bd17afefb09e0f94aed2",
".git/objects/fb/56fe3981b404c91df4b0749bdd8a6dfae21c36": "8d71dc2673ea5cabbde1ae2ae011fef2",
".git/objects/fb/be405bf530d1fe02a1717b946c63d77ac1344a": "90143dcfd2cf88952e6f87dc3e329d69",
".git/objects/fe/b17d4f534621c1d27cbc3612ba8aa9bb44906e": "78dede8a0db0e7a56513aa41b13fea1d",
"app-ads.txt": "7e840dcc526a0c521d37ea80b504f580",
"assets/AssetManifest.bin": "b074dd6a08eb29eca8d44c9e5e6c8260",
"assets/AssetManifest.bin.json": "a24bc88f317aa64a3d6b740131d8709b",
"assets/AssetManifest.json": "37968b83663a4f592e567cf5cf78c01f",
"assets/assets/fonts/OpenSans-Regular.ttf": "7df68ccfcb8ffe00669871052a4929c9",
"assets/assets/icons/behance.svg": "35ad2d47e647d0b168e7707b2984c6b5",
"assets/assets/icons/bloc.png": "977fbfba561065f9a68c4b47f9774531",
"assets/assets/icons/check.svg": "4220c82511cc1dfb40b8bba7d25c5f55",
"assets/assets/icons/dart.png": "1ab71d33e7ba834836197b4fa8726da0",
"assets/assets/icons/download.svg": "628700a3031424d215a441fab2da1731",
"assets/assets/icons/dribble.svg": "d392567c5678d42472d2c7b766268101",
"assets/assets/icons/facebook.svg": "0f2864779a4fb4565284e23688e963ab",
"assets/assets/icons/firebase.png": "36170822afe4c716cfbdb96dac8cd10e",
"assets/assets/icons/flutter.png": "1105c9a994c1a6638daed558d5b631fd",
"assets/assets/icons/github.svg": "533a2ec570618796064611102593ac26",
"assets/assets/icons/java.png": "69312787efe1f0f388e1856d7d6b6d3d",
"assets/assets/icons/kotlin.png": "33d049b4ca3c28fbb1903f3a159b1bd9",
"assets/assets/icons/linkedin.svg": "3ecd4cf0b3c464424eb91f92cb2e220c",
"assets/assets/icons/playstore.svg": "7cb53e87b5b83d40bbe3b6588cc76a2c",
"assets/assets/icons/twitter.svg": "0961a4227d5bec8cc7711ca96622d099",
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
"assets/NOTICES": "b73d064caf66bfbb02ea469b08482a34",
"assets/packages/font_awesome_flutter/lib/fonts/fa-brands-400.ttf": "eeefad5512dfbffba365ff0cde4d6e6f",
"assets/packages/font_awesome_flutter/lib/fonts/fa-regular-400.ttf": "f3307f62ddff94d2cd8b103daf8d1b0f",
"assets/packages/font_awesome_flutter/lib/fonts/fa-solid-900.ttf": "9d4cfa1d1aa29faeb5a5c2455991911d",
"assets/shaders/ink_sparkle.frag": "ecc85a2e95f5e9f53123dcaf8cb9b6ce",
"canvaskit/canvaskit.js": "5fda3f1af7d6433d53b24083e2219fa0",
"canvaskit/canvaskit.js.symbols": "48c83a2ce573d9692e8d970e288d75f7",
"canvaskit/canvaskit.wasm": "1f237a213d7370cf95f443d896176460",
"canvaskit/chromium/canvaskit.js": "87325e67bf77a9b483250e1fb1b54677",
"canvaskit/chromium/canvaskit.js.symbols": "a012ed99ccba193cf96bb2643003f6fc",
"canvaskit/chromium/canvaskit.wasm": "b1ac05b29c127d86df4bcfbf50dd902a",
"canvaskit/skwasm.js": "9fa2ffe90a40d062dd2343c7b84caf01",
"canvaskit/skwasm.js.symbols": "262f4827a1317abb59d71d6c587a93e2",
"canvaskit/skwasm.wasm": "9f0c0c02b82a910d12ce0543ec130e60",
"canvaskit/skwasm.worker.js": "bfb704a6c714a75da9ef320991e88b03",
"favicon-16x16.png": "c397993110d2d7dcf71a2f045e13a832",
"favicon-32x32.png": "4f23b1e3ab7596776b9ab3bb4e796167",
"favicon.ico": "a784f0536988377799e64496570a1e58",
"favicon.png": "7db8962dc32f8dfeaebfcfb6edbe36a0",
"flutter.js": "f31737fb005cd3a3c6bd9355efd33061",
"flutter_bootstrap.js": "ce95c59a4489437e55d68bb0b71d9e47",
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
"icons/site.webmanifest": "3bbccedface908936ca94df52e793b85",
"index.html": "d567cb03711f71672f7d516912cdcb5b",
"/": "d567cb03711f71672f7d516912cdcb5b",
"main.dart.js": "fa699792284be4f14a08d44d8e378333",
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
