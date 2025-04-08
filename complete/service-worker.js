const CACHE_NAME = 'ar-model-cache-v1';
const FILES_TO_CACHE = [
  '../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_BaseColor.jpg'
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Cavity.jpg'
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Gloss.jpg'
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Normal.jpg'
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Roughness.jpg'
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Specular.jpg'
'../assets/models/chair/chair1/Plywood_vdjecce_1K_AO.jpg'
'../assets/models/chair/chair1/Plywood_vdjecce_1K_BaseColor.jpg'
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Bump.jpg'
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Cavity.jpg'
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Displacement.jpg'
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Gloss.jpg'
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Normal.jpg'
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Roughness.jpg'
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Specular.jpg'
'../assets/models/chair/chair1/scene.bin'
'../assets/models/chair/chair1/scene.gltf'
'../assets/models/chair/chair1/thumbnail.jpg'
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_BaseColor.jpg'
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Cavity.jpg'
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Gloss.jpg'
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Normal.jpg'
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Roughness.jpg'
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Specular.jpg'
'../assets/models/chair/chair2/scene.bin'
'../assets/models/chair/chair2/scene.gltf'
'../assets/models/chair/chair2/thumbnail.jpg'
'../assets/models/chair/chair2/wood__diffuse.jpg'
'../assets/models/chair/chair2/wood__glossiness.png'
'../assets/models/chair/chair2/wood__normal.jpg'
'../assets/models/chair/chair3/Furniture_Fabric_sjfvjpc_1K_BaseColor.jpg'
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_BaseColor.jpg'
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Cavity.jpg'
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Gloss.jpg'
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Normal.jpg'
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Roughness.jpg'
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Specular.jpg'
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_AO.jpg'
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_BaseColor.jpg'
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Bump.jpg'
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Cavity.jpg'
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Displacement.jpg'
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Diffuse.jpg'
'../assets/models/chair/chair3/WoodenFloor_wdjqfv_1K_BaseColor.jpg'
'../assets/models/chair/chair3/scene.bin'
'../assets/models/chair/chair3/scene.gltf'
'../assets/models/chair/chair3/thumbnail.jpg'
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_AO.jpg'
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_BaseColor.jpg'
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Bump.jpg'
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Cavity.jpg'
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Displacement.jpg'
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Gloss.jpg'
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Normal.jpg'
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Roughness.jpg'
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Specular.jpg'
'../assets/models/chair/chair4/Furniture_Fabric_sjfvbctc_1K_BaseColor.jpg'
'../assets/models/chair/chair4/scene.bin'
'../assets/models/chair/chair4/scene.gltf'
'../assets/models/chair/chair4/thumbnail.jpg'
'../assets/models/chair/chair5/Furniture_Fabric_sjfvjpc_1K_BaseColor.jpg'
'../assets/models/chair/chair5/Furniture_Fabric_sjfvbctc_1K_BaseColor.jpg'
'../assets/models/chair/chair5/Plywood_vdjecce_1K_BaseColor.jpg'
'../assets/models/chair/chair5/Plywood_vdjecce_1K_Bump.jpg'
'../assets/models/chair/chair5/Wooden_Floor_wdjqfv_1K_BaseColor.jpg'
'../assets/models/chair/chair5/scene.bin'
'../assets/models/chair/chair5/scene.gltf'
'../assets/models/chair/chair5/thumbnail.jpg'
'../assets/models/rug/rug1/Denim_xiurbem1_1K_AO.jpg'
'../assets/models/rug/rug1/Denim_xiurbem1_1K_BaseColor.jpg'
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Bump.jpg'
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Cavity.jpg'
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Displacement.jpg'
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Gloss.jpg'
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Normal.jpg'
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Roughness.jpg'
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Specular.jpg'
'../assets/models/rug/rug1/scene.bin'
'../assets/models/rug/rug1/scene.glb'
'../assets/models/rug/rug1/scene.gltf'
'../assets/models/rug/rug1/thumbnail.jpg'
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_AO.jpg'
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_BaseColor.jpg'
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Bump.jpg'
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Cavity.jpg'
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Displacement.jpg'
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Gloss.jpg'
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Normal.jpg'
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Roughness.jpg'
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Specular.jpg'
'../assets/models/rug/rug2/scene.bin'
'../assets/models/rug/rug2/scene.gltf'
'../assets/models/rug/rug2/straw_texture_14_normal.jpg'
'../assets/models/rug/rug2/straw_texture_14_roughness.png'
'../assets/models/rug/rug2/thumbnail.jpg'
'../assets/models/rug/rug3/bouclé-ao-bouclé-roughness.png'
'../assets/models/rug/rug3/bouclé-diffuse.jpg'
'../assets/models/rug/rug3/bouclé-normal.jpg'
'../assets/models/rug/rug3/scene.bin'
'../assets/models/rug/rug3/scene.gltf'
'../assets/models/rug/rug3/thumbnail.jpg'
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_AO.jpg'
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_BaseColor.jpg'
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Bump.jpg'
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Cavity.jpg'
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Displacement.jpg'
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Gloss.jpg'
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Normal.jpg'
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Roughness.jpg'
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Specular.jpg'
'../assets/models/rug/rug4/scene.bin'
'../assets/models/rug/rug4/scene.gltf'
'../assets/models/rug/rug4/thumbnail.jpg'
'../assets/models/rug/rug5/carpet_fabric_white_Base_Color.jpg'
'../assets/models/rug/rug5/carpet_fabric_white_Normal.jpg'
'../assets/models/rug/rug5/carpet_fabric_white_Roughness.png'
'../assets/models/rug/rug5/scene.bin'
'../assets/models/rug/rug5/scene.gltf'
'../assets/models/rug/rug5/thumbnail.jpg'
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_AO.jpg'
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_BaseColor.jpg'
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Bump.jpg'
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Cavity.jpg'
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Displacement.jpg'
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Gloss.jpg'
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Normal.jpg'
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Roughness.jpg'
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Specular.jpg'
'../assets/models/sofa/sofa1/Tumon2body_1K_IR.jpg'
'../assets/models/sofa/sofa1/Tumon2body_1K_OR.jpg'
'../assets/models/sofa/sofa1/Tumon2body_1K_T.jpg'
'../assets/models/sofa/sofa1/scene.bin'
'../assets/models/sofa/sofa1/scene.gltf'
'../assets/models/sofa/sofa1/thumbnail.jpg'
'../assets/models/sofa/sofa1/wood_glossiness.png'
'../assets/models/sofa/sofa1/wood_normal.jpg'
'../assets/models/sofa/sofa2/Tumon2body_1K_IR.jpg'
'../assets/models/sofa/sofa2/Tumon2body_1K_IR.jpg'  // appears twice
'../assets/models/sofa/sofa2/Tumon2body_1K_T.jpg'
'../assets/models/sofa/sofa2/scene.bin'
'../assets/models/sofa/sofa2/scene.gltf'
'../assets/models/sofa/sofa2/thumbnail.jpg'
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_AO.jpg'
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_BaseColor.jpg'
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Bump.jpg'
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Cavity.jpg'
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Displacement.jpg'
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Gloss.jpg'
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Normal.jpg'
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Roughness.jpg'
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Specular.jpg'
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_AO.jpg'
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_BaseColor.jpg'
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Bump.jpg'
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Cavity.jpg'
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Displacement.jpg'
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Gloss.jpg'
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Normal.jpg'
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Roughness.jpg'
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Specular.jpg'
'../assets/models/sofa/sofa3/scene.bin'
'../assets/models/sofa/sofa3/scene.gltf'
'../assets/models/sofa/sofa3/thumbnail.jpg'

];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching assets');
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});
