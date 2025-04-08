const CACHE_NAME = 'ar-model-cache-v1';
const FILES_TO_CACHE = [
  '../complete/index.html',
  '../complete/main.js',
 '../complete/index.html',
'../complete/main.js',
'../libs/jsm/ARButton.js',
'../libs/jsm/GLTFLoader.js',
'../libs/three123/three.module.js',
'../libs/loader.js',
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_BaseColor.jpg',
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Cavity.jpg',
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Gloss.jpg',
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Normal.jpg',
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Roughness.jpg',
'../assets/models/chair/chair1/Furniture_Fabric_sjfvbctc_1K_Specular.jpg',
'../assets/models/chair/chair1/Plywood_vdjecce_1K_AO.jpg',
'../assets/models/chair/chair1/Plywood_vdjecce_1K_BaseColor.jpg',
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Bump.jpg',
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Cavity.jpg',
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Displacement.jpg',
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Gloss.jpg',
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Normal.jpg',
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Roughness.jpg',
'../assets/models/chair/chair1/Plywood_vdjecce_1K_Specular.jpg',
'../assets/models/chair/chair1/scene.bin',
'../assets/models/chair/chair1/scene.gltf',
'../assets/models/chair/chair1/thumbnail.jpg',
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_BaseColor.jpg',
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Cavity.jpg',
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Gloss.jpg',
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Normal.jpg',
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Roughness.jpg',
'../assets/models/chair/chair2/Furniture_Fabric_sjfvbctc_1K_Specular.jpg',
'../assets/models/chair/chair2/scene.bin',
'../assets/models/chair/chair2/scene.gltf',
'../assets/models/chair/chair2/thumbnail.jpg',
'../assets/models/chair/chair2/wood__diffuse.jpg',
'../assets/models/chair/chair2/wood__glossiness.png',
'../assets/models/chair/chair2/wood__normal.jpg',
'../assets/models/chair/chair3/Furniture_Fabric_sjfvjpc_1K_BaseColor.jpg',
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_BaseColor.jpg',
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Cavity.jpg',
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Gloss.jpg',
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Normal.jpg',
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Roughness.jpg',
'../assets/models/chair/chair3/Furniture_Fabric_sjfvgcnc_1K_Specular.jpg',
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_AO.jpg',
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_BaseColor.jpg',
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Bump.jpg',
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Cavity.jpg',
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Displacement.jpg',
'../assets/models/chair/chair3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Diffuse.jpg',
'../assets/models/chair/chair3/WoodenFloor_wdjqfv_1K_BaseColor.jpg',
'../assets/models/chair/chair3/scene.bin',
'../assets/models/chair/chair3/scene.gltf',
'../assets/models/chair/chair3/thumbnail.jpg',
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_AO.jpg',
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_BaseColor.jpg',
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Bump.jpg',
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Cavity.jpg',
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Displacement.jpg',
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Gloss.jpg',
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Normal.jpg',
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Roughness.jpg',
'../assets/models/chair/chair4/Fabric_Clothes_Cotton_Plain_Weave_White_xfceed0qc_1K_Specular.jpg',
'../assets/models/chair/chair4/Furniture_Fabric_sjfvbctc_1K_BaseColor.jpg',
'../assets/models/chair/chair4/scene.bin',
'../assets/models/chair/chair4/scene.gltf',
'../assets/models/chair/chair4/thumbnail.jpg',
'../assets/models/chair/chair5/Furniture_Fabric_sjfvjpc_1K_BaseColor.jpg',
'../assets/models/chair/chair5/Furniture_Fabric_sjfvbctc_1K_BaseColor.jpg',
'../assets/models/chair/chair5/Plywood_vdjecce_1K_BaseColor.jpg',
'../assets/models/chair/chair5/Plywood_vdjecce_1K_Bump.jpg',
'../assets/models/chair/chair5/Wooden_Floor_wdjqfv_1K_BaseColor.jpg',
'../assets/models/chair/chair5/scene.bin',
'../assets/models/chair/chair5/scene.gltf',
'../assets/models/chair/chair5/thumbnail.jpg',
'../assets/models/rug/rug1/Denim_xiurbem1_1K_AO.jpg',
'../assets/models/rug/rug1/Denim_xiurbem1_1K_BaseColor.jpg',
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Bump.jpg',
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Cavity.jpg',
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Displacement.jpg',
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Gloss.jpg',
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Normal.jpg',
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Roughness.jpg',
'../assets/models/rug/rug1/Denim_xiurbem1_1K_Specular.jpg',
'../assets/models/rug/rug1/scene.bin',
'../assets/models/rug/rug1/scene.gltf',
'../assets/models/rug/rug1/thumbnail.jpg',
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_AO.jpg',
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_BaseColor.jpg',
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Bump.jpg',
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Cavity.jpg',
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Displacement.jpg',
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Gloss.jpg',
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Normal.jpg',
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Roughness.jpg',
'../assets/models/rug/rug2/Patterned_Fabric_uculeewfw_1K_Specular.jpg',
'../assets/models/rug/rug2/scene.bin',
'../assets/models/rug/rug2/scene.gltf',
'../assets/models/rug/rug2/straw_texture_14_normal.jpg',
'../assets/models/rug/rug2/straw_texture_14_roughness.png',
'../assets/models/rug/rug2/thumbnail.jpg',
'../assets/models/rug/rug3/bouclé-ao-bouclé-roughness.png',
'../assets/models/rug/rug3/bouclé-diffuse.jpg',
'../assets/models/rug/rug3/bouclé-normal.jpg',
'../assets/models/rug/rug3/scene.bin',
'../assets/models/rug/rug3/scene.gltf',
'../assets/models/rug/rug3/thumbnail.jpg',
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_AO.jpg',
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_BaseColor.jpg',
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Bump.jpg',
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Cavity.jpg',
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Displacement.jpg',
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Gloss.jpg',
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Normal.jpg',
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Roughness.jpg',
'../assets/models/rug/rug4/Patterned_fabric_uculeewfw_1K_Specular.jpg',
'../assets/models/rug/rug4/scene.bin',
'../assets/models/rug/rug4/scene.gltf',
'../assets/models/rug/rug4/thumbnail.jpg',
'../assets/models/rug/rug5/carpet_fabric_white_Base_Color.jpg',
'../assets/models/rug/rug5/carpet_fabric_white_Normal.jpg',
'../assets/models/rug/rug5/carpet_fabric_white_Roughness.png',
'../assets/models/rug/rug5/scene.bin',
'../assets/models/rug/rug5/scene.gltf',
'../assets/models/rug/rug5/thumbnail.jpg',
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_AO.jpg',
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_BaseColor.jpg',
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Bump.jpg',
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Cavity.jpg',
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Displacement.jpg',
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Gloss.jpg',
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Normal.jpg',
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Roughness.jpg',
'../assets/models/sofa/sofa1/Old_Plywood_vd5jhgfs_1K_Specular.jpg',
'../assets/models/sofa/sofa1/Tumon2body_1K_IR.jpg',
'../assets/models/sofa/sofa1/Tumon2body_1K_OR.jpg',
'../assets/models/sofa/sofa1/Tumon2body_1K_T.jpg',
'../assets/models/sofa/sofa1/scene.bin',
'../assets/models/sofa/sofa1/scene.gltf',
'../assets/models/sofa/sofa1/thumbnail.jpg',
'../assets/models/sofa/sofa1/wood_glossiness.png',
'../assets/models/sofa/sofa1/wood_normal.jpg',
'../assets/models/sofa/sofa2/Tumon2body_1K_IR.jpg',
'../assets/models/sofa/sofa2/Tumon2body_1K_T.jpg',
'../assets/models/sofa/sofa2/scene.bin',
'../assets/models/sofa/sofa2/scene.gltf',
'../assets/models/sofa/sofa2/thumbnail.jpg',
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_AO.jpg',
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_BaseColor.jpg',
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Bump.jpg',
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Cavity.jpg',
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Displacement.jpg',
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Gloss.jpg',
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Normal.jpg',
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Roughness.jpg',
'../assets/models/sofa/sofa3/Fabric_Generic_Leather_Top_Grain_Medium_Brown_y8kcexy_1K_Specular.jpg',
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_AO.jpg',
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_BaseColor.jpg',
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Bump.jpg',
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Cavity.jpg',
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Displacement.jpg',
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Gloss.jpg',
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Normal.jpg',
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Roughness.jpg',
'../assets/models/sofa/sofa3/Seychelles_Beige_Marble_Tiles_wgjdfbtv_1K_Specular.jpg',
'../assets/models/sofa/sofa3/scene.bin',
'../assets/models/sofa/sofa3/scene.gltf',
'../assets/models/sofa/sofa3/thumbnail.jpg',
'../assets/models/sofa/sofa4/Furniture_Fabric_sfjdewek_1K_BaseColor.jpg',
'../assets/models/sofa/sofa4/Furniture_Fabric_sfjdewek_1K_Cavity.jpg',
'../assets/models/sofa/sofa4/Furniture_Fabric_sfjdewek_1K_Gloss.jpg',
'../assets/models/sofa/sofa4/Furniture_Fabric_sfjdewek_1K_Normal.jpg',
'../assets/models/sofa/sofa4/Furniture_Fabric_sfjdewek_1K_Roughness.jpg',
'../assets/models/sofa/sofa4/Furniture_Fabric_sfjdewek_1K_Specular.jpg',
'../assets/models/sofa/sofa4/Plywood_vfnioarhq_1K_AO.jpg',
'../assets/models/sofa/sofa4/Plywood_vfnioarhq_1K_BaseColor.jpg',
'../assets/models/sofa/sofa4/Plywood_vfnioarhq_1K_Bump.jpg',
'../assets/models/sofa/sofa4/Plywood_vfnioarhq_1K_Cavity.jpg',
'../assets/models/sofa/sofa4/Plywood_vfnioarhq_1K_Displacement.jpg',
'../assets/models/sofa/sofa4/Plywood_vfnioarhq_1K_Gloss.jpg',
'../assets/models/sofa/sofa4/Plywood_vfnioarhq_1K_Normal.jpg',
'../assets/models/sofa/sofa4/Plywood_vfnioarhq_1K_Roughness.jpg',
'../assets/models/sofa/sofa4/Plywood_vfnioarhq_1K_Specular.jpg',
'../assets/models/sofa/sofa4/scene.bin',
'../assets/models/sofa/sofa4/scene.gltf',
'../assets/models/sofa/sofa4/thumbnail.jpg',
'../assets/models/sofa/sofa5/Furniture_Fabric_sfjdewek_1K_BaseColor.jpg',
'../assets/models/sofa/sofa5/Furniture_Fabric_sfjdewek_1K_Cavity.jpg',
'../assets/models/sofa/sofa5/Furniture_Fabric_sfjdewek_1K_Gloss.jpg',
'../assets/models/sofa/sofa5/Furniture_Fabric_sfjdewek_1K_Normal.jpg',
'../assets/models/sofa/sofa5/Furniture_Fabric_sfjdewek_1K_Roughness.jpg',
'../assets/models/sofa/sofa5/Furniture_Fabric_sfjdewek_1K_Specular.jpg',
'../assets/models/sofa/sofa5/Plywood_vfnioarhq_1K_AO.jpg',
'../assets/models/sofa/sofa5/Plywood_vfnioarhq_1K_BaseColor.jpg',
'../assets/models/sofa/sofa5/Plywood_vfnioarhq_1K_Bump.jpg',
'../assets/models/sofa/sofa5/Plywood_vfnioarhq_1K_Cavity.jpg',
'../assets/models/sofa/sofa5/Plywood_vfnioarhq_1K_Displacement.jpg',
'../assets/models/sofa/sofa5/Plywood_vfnioarhq_1K_Gloss.jpg',
'../assets/models/sofa/sofa5/Plywood_vfnioarhq_1K_Normal.jpg',
'../assets/models/sofa/sofa5/Plywood_vfnioarhq_1K_Roughness.jpg',
'../assets/models/sofa/sofa5/Plywood_vfnioarhq_1K_Specular.jpg',
'../assets/models/sofa/sofa5/scene.bin',
'../assets/models/sofa/sofa5/scene.gltf',
'../assets/models/sofa/sofa5/thumbnail.jpg',
'../assets/models/table/table1/Dutch_Rosewood_Parquet_tb4dsjy1_1K_AO.jpg',
'../assets/models/table/table1/Dutch_Rosewood_Parquet_tb4dsjy1_1K_BaseColor.jpg',
'../assets/models/table/table1/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Bump.jpg',
'../assets/models/table/table1/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Cavity.jpg',
'../assets/models/table/table1/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Gloss.jpg',
'../assets/models/table/table1/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Normal.jpg',
'../assets/models/table/table1/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Roughness.jpg',
'../assets/models/table/table1/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Specular.jpg',
'../assets/models/table/table1/scene.bin',
'../assets/models/table/table1/scene.gltf',
'../assets/models/table/table1/thumbnail.jpg',
'../assets/models/table/table1/wood_normal.jpg',
'../assets/models/table/table2/Brick_Bond_Walnut_Parquet_atomic6jj_1K_AO.jpg',
'../assets/models/table/table2/Brick_Bond_Walnut_Parquet_atomic6jj_1K_BaseColor.jpg',
'../assets/models/table/table2/Brick_Bond_Walnut_Parquet_atomic6jj_1K_Bump.jpg',
'../assets/models/table/table2/Brick_Bond_Walnut_Parquet_atomic6jj_1K_Cavity.jpg',
'../assets/models/table/table2/Brick_Bond_Walnut_Parquet_atomic6jj_1K_Gloss.jpg',
'../assets/models/table/table2/Brick_Bond_Walnut_Parquet_atomic6jj_1K_Normal.jpg',
'../assets/models/table/table2/Brick_Bond_Walnut_Parquet_atomic6jj_1K_Roughness.jpg',
'../assets/models/table/table2/Brick_Bond_Walnut_Parquet_atomic6jj_1K_Specular.jpg',
'../assets/models/table/table2/scene.bin',
'../assets/models/table/table2/scene.gltf',
'../assets/models/table/table2/thumbnail.jpg',
'../assets/models/table/table2/wood_normal.jpg',
'../assets/models/table/table3/Dutch_Rosewood_Parquet_tb4dsjy1_1K_AO.jpg',
'../assets/models/table/table3/Dutch_Rosewood_Parquet_tb4dsjy1_1K_BaseColor.jpg',
'../assets/models/table/table3/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Bump.jpg',
'../assets/models/table/table3/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Cavity.jpg',
'../assets/models/table/table3/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Gloss.jpg',
'../assets/models/table/table3/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Normal.jpg',
'../assets/models/table/table3/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Roughness.jpg',
'../assets/models/table/table3/Dutch_Rosewood_Parquet_tb4dsjy1_1K_Specular.jpg',
'../assets/models/table/table3/scene.bin',
'../assets/models/table/table3/scene.gltf',
'../assets/models/table/table3/thumbnail.jpg',
'../assets/models/table/table3/wood_glossiness.jpg',
'../assets/models/table/table3/wood_normal.jpg',
'../assets/models/table/table4/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_AO.jpg',
'../assets/models/table/table4/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_BaseColor.jpg',
'../assets/models/table/table4/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Bump.jpg',
'../assets/models/table/table4/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Cavity.jpg',
'../assets/models/table/table4/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Gloss.jpg',
'../assets/models/table/table4/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Normal.jpg',
'../assets/models/table/table4/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Roughness.jpg',
'../assets/models/table/table4/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Specular.jpg',
'../assets/models/table/table4/scene.bin',
'../assets/models/table/table4/scene.gltf',
'../assets/models/table/table4/thumbnail.jpg',
'../assets/models/table/table5/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_AO.jpg',
'../assets/models/table/table5/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_BaseColor.jpg',
'../assets/models/table/table5/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Bump.jpg',
'../assets/models/table/table5/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Cavity.jpg',
'../assets/models/table/table5/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Gloss.jpg',
'../assets/models/table/table5/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Normal.jpg',
'../assets/models/table/table5/Dutch_Rosewood_Parquet_tlbl6fgy1_1K_Roughness.jpg',
'../assets/models/table/table5/Ziarat_White_Marble_tgzkdehv_1K_BaseColor.jpg',
'../assets/models/table/table5/Ziarat_White_Marble_tgzkdehv_1K_Cavity.jpg',
'../assets/models/table/table5/Ziarat_White_Marble_tgzkdehv_1K_Gloss.jpg',
'../assets/models/table/table5/Ziarat_White_Marble_tgzkdehv_1K_Normal.jpg',
'../assets/models/table/table5/Ziarat_White_Marble_tgzkdehv_1K_Roughness.jpg',
'../assets/models/table/table5/Ziarat_White_Marble_tgzkdehv_1K_Specular.jpg',
'../assets/models/table/table5/scene.bin',
'../assets/models/table/table5/scene.gltf',
'../assets/models/table/table5/thumbnail.jpg',
'../assets/models/table/table5/wood__diffuse.jpg',
'../assets/models/table/table5/wood__glossiness.png',
'../assets/models/table/table5/wood__normal.jpg',
'../assets/models/vase/vase1/Ziarat_White_Marble_tgzkdehv_1K_BaseColor.jpg',
'../assets/models/vase/vase1/Ziarat_White_Marble_tgzkdehv_1K_Cavity.jpg',
'../assets/models/vase/vase1/Ziarat_White_Marble_tgzkdehv_1K_Gloss.jpg',
'../assets/models/vase/vase1/Ziarat_White_Marble_tgzkdehv_1K_Normal.jpg',
'../assets/models/vase/vase1/Ziarat_White_Marble_tgzkdehv_1K_Roughness.jpg',
'../assets/models/vase/vase1/Ziarat_White_Marble_tgzkdehv_1K_Specular.jpg',
'../assets/models/vase/vase1/scene.bin',
'../assets/models/vase/vase1/scene.gltf',
'../assets/models/vase/vase1/thumbnail.jpg',
'../assets/models/vase/vase2/Flower_MatSG_baseColor.png',
'../assets/models/vase/vase2/Flower_MatSG_metallicRoughness.png',
'../assets/models/vase/vase2/Flower_MatSG_normal.png',
'../assets/models/vase/vase2/Leaf_MatSG_baseColor.png',
'../assets/models/vase/vase2/Leaf_MatSG_metallicRoughness.png',
'../assets/models/vase/vase2/Leaf_MatSG_normal.png',
'../assets/models/vase/vase2/Mt_Grass_baseColor.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_AO.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_BaseColor.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Bump.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Cavity.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Diffuse.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Displacement.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Gloss.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Normal.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Roughness.jpg',
'../assets/models/vase/vase2/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Specular.jpg',
'../assets/models/vase/vase2/Stem_MatSG_baseColor.png',
'../assets/models/vase/vase2/Stem_MatSG_metallicRoughness.png',
'../assets/models/vase/vase2/Stem_MatSG_normal.png',
'../assets/models/vase/vase2/plastic_metallic-plastic_glossiness.png',
'../assets/models/vase/vase2/plastic_normal_openjl.jpg',
'../assets/models/vase/vase2/plastic_specular.jpg',
'../assets/models/vase/vase2/scene.bin',
'../assets/models/vase/vase2/scene.gltf',
'../assets/models/vase/vase2/thumbnail.jpg',
'../assets/models/vase/vase3/Mt_Grass_baseColor.jpg',
'../assets/models/vase/vase3/Mt_Leaf_baseColor.jpg',
'../assets/models/vase/vase3/Mt_Petal_baseColor.jpg',
'../assets/models/vase/vase3/Mt_Stem_baseColor.jpg',
'../assets/models/vase/vase3/Mt_Stigma_baseColor.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_AO.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_BaseColor.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Bump.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Cavity.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Diffuse.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Displacement.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Gloss.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Normal.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Roughness.jpg',
'../assets/models/vase/vase3/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Specular.jpg',
'../assets/models/vase/vase3/plastic_metallic-plastic_glossiness.png',
'../assets/models/vase/vase3/plastic_normal_openjl.jpg',
'../assets/models/vase/vase3/plastic_specular.jpg',
'../assets/models/vase/vase3/scene.bin',
'../assets/models/vase/vase3/scene.gltf',
'../assets/models/vase/vase3/thumbnail.jpg',
'../assets/models/vase/vase4/RoseClimber_INST_baseColor.png',
'../assets/models/vase/vase4/RoseClimber_INST_normal.png',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_AO.jpg',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_BaseColor.jpg',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Bump.jpg',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Cavity.jpg',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Diffuse.jpg',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Displacement.jpg',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Gloss.jpg',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Normal.jpg',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Roughness.jpg',
'../assets/models/vase/vase4/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Specular.jpg',
'../assets/models/vase/vase4/scene.bin',
'../assets/models/vase/vase4/scene.gltf',
'../assets/models/vase/vase4/thumbnail.jpg',
'../assets/models/vase/vase5/Mf_Grass_baseColor.jpg',
'../assets/models/vase/vase5/Mf_Leaf_baseColor.jpg',
'../assets/models/vase/vase5/Mf_Petal_baseColor.jpg',
'../assets/models/vase/vase5/Mf_Stem_baseColor.jpg',
'../assets/models/vase/vase5/Mf_Stigma_baseColor.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_AO.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_BaseColor.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Bump.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Cavity.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Diffuse.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Displacement.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Gloss.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Normal.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Roughness.jpg',
'../assets/models/vase/vase5/Seychelles_Beige_Marble_Tiles_wgildfbv_1K_Specular.jpg',
'../assets/models/vase/vase5/scene.bin',
'../assets/models/vase/vase5/scene.gltf',
'../assets/models/vase/vase5/thumbnail.jpg'

];

// Separate HTML/JS files from asset files
const CORE_FILES = FILES_TO_CACHE.filter(file => 
  file.endsWith('.html') || 
  file.endsWith('.js') ||
  file.includes('libs/')
);

const ASSET_FILES = FILES_TO_CACHE.filter(file => 
  !CORE_FILES.includes(file)
);

self.addEventListener('install', event => {
  console.log('[Service Worker] Install');
  
  // Only try to cache core files during installation
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('[Service Worker] Pre-caching core files');
      try {
        await cache.addAll(CORE_FILES);
        console.log('[Service Worker] Core files cached successfully');
      } catch (err) {
        console.error('[Service Worker] Failed to cache core files', err);
      }
      
      // Don't attempt to pre-cache assets that might cause CORS issues
      console.log('[Service Worker] Asset files will be cached on demand');
    })
  );
  
  // Activate right away
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate');
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  
  // Take control immediately
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Check if this is a request we should handle
  if (!event.request.url.startsWith('http')) {
    // Skip non-HTTP/HTTPS requests (like chrome-extension://)
    console.log('[Service Worker] Ignoring non-HTTP request:', event.request.url);
    return;
  }
  
  // First try to get from cache
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        console.log('[Service Worker] Serving from cache:', event.request.url);
        return cachedResponse;
      }
      
      // If not in cache, get from network
      return fetch(event.request).then(response => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200) {
          console.log('[Service Worker] Non-cacheable response:', event.request.url);
          return response;
        }
        
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache the fetched response
        caches.open(CACHE_NAME).then(cache => {
          // Only cache HTTP/HTTPS requests
          if (event.request.url.startsWith('http')) {
            console.log('[Service Worker] Caching on demand:', event.request.url);
            cache.put(event.request, responseToCache);
          } else {
            console.log('[Service Worker] Skipping caching for non-HTTP URL:', event.request.url);
          }
        }).catch(err => {
          console.error('[Service Worker] Error caching on demand:', event.request.url, err);
        });
        
        return response;
      }).catch(error => {
        console.error('[Service Worker] Fetch failed:', event.request.url, error);
        
        // If it's an image, you could return a fallback
        if (event.request.url.match(/\.(jpg|jpeg|png|gif)$/i)) {
          console.log('[Service Worker] Returning placeholder for:', event.request.url);
          // You could return a placeholder image here if needed
        }
      });
    })
  );
});
