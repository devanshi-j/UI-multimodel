// AR Furniture Module (ar-furniture.js)
import { loadGLTF } from "../libs/loader.js";
import * as THREE from "../libs/three123/three.module.js";
import { ARButton } from "../libs/jsm/ARButton.js";

// Store state globally within the module
const state = {
  loadedModels: new Map(),
  placedItems: [],
  previewItem: null,
  hitTestSource: null,
  hitTestSourceRequested: false,
  isModelSelected: false,
  selectedModels: [],
  renderer: null,
  scene: null,
  camera: null,
  reticle: null,
  controller: null,
  ui: {
    menuButton: null,
    closeButton: null,
    bottomMenu: null,
    confirmButtons: null,
    placeButton: null,
    cancelButton: null,
    deleteButton: null,
    surfaceIndicator: null,
    statusMessage: null
  },
  interaction: {
    selectedObject: null,
    isDragging: false,
    isRotating: false,
    isScaling: false,
    previousTouchX: 0,
    previousTouchY: 0,
    previousPinchDistance: 0,
    raycaster: null,
    touches: null
  }
};

// Helper functions
export function selectModel(model) {
  state.selectedModels = [model]; // Reset and add only the current model
  console.log("Model selected:", model);
  console.log("Updated selectedModels:", state.selectedModels);
}

export function normalizeModel(obj, height) {
  const bbox = new THREE.Box3().setFromObject(obj);
  const size = bbox.getSize(new THREE.Vector3());
  obj.scale.multiplyScalar(height / size.y);
  const bbox2 = new THREE.Box3().setFromObject(obj);
  const center = bbox2.getCenter(new THREE.Vector3());
  obj.position.set(-center.x, -center.y, -center.z);
}

export function setOpacityForSelected(opacity) {
  console.log(`setOpacityForSelected(${opacity}) called. Selected models:`, state.selectedModels);

  if (state.selectedModels.length === 0) {
    console.warn("setOpacityForSelected() - No models in selectedModels array!");
    return;
  }

  state.selectedModels.forEach((model) => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.format = THREE.RGBAFormat;
        child.material.opacity = opacity;
      }
    });
  });
}

export function getTouchDistance(touch1, touch2) {
  const dx = touch1.pageX - touch2.pageX;
  const dy = touch1.pageY - touch2.pageY;
  return Math.sqrt(dx * dx + dy * dy);
}

export async function fileExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    console.log(`File check response for ${url}: ${response.status}`);
    return response.ok;
  } catch (error) {
    console.error(`Error checking file existence: ${url}`, error);
    return false;
  }
}

export async function getExistingFile(glbPath, gltfPath) {
  console.log(`Checking GLB: ${glbPath}`);
  if (await fileExists(glbPath)) {
    console.log(`GLB found: ${glbPath}`);
    return glbPath;
  }

  console.log(`Checking GLTF: ${gltfPath}`);
  if (await fileExists(gltfPath)) {
    console.log(`GLTF found: ${gltfPath}`);
    return gltfPath;
  }

  console.warn(`Neither GLB nor GLTF found.`);
  return null;
}

// Model Management Functions
export function showModel(item) {
  if (state.previewItem) {
    state.scene.remove(state.previewItem);
  }

  selectModel(item);
  console.log("showModel() called. Selected models:", state.selectedModels);

  state.previewItem = item;
  state.scene.add(state.previewItem);

  setOpacityForSelected(0.5);

  state.ui.confirmButtons.style.display = "flex";
  state.isModelSelected = true;
}

export function deleteModel() {
  if (state.interaction.selectedObject) {
    state.scene.remove(state.interaction.selectedObject);
    state.placedItems = state.placedItems.filter(item => item !== state.interaction.selectedObject);
    state.interaction.selectedObject = null;
    state.ui.deleteButton.style.display = "none";
  }
}

export function placeModel() {
  console.log("placeModel() called. Current selectedModels:", state.selectedModels);
  console.log("Preview item:", state.previewItem);
  console.log("Reticle visible:", state.reticle.visible);

  if (!state.previewItem) {
    console.warn("No preview item available");
    return;
  }

  if (!state.reticle.visible) {
    console.warn("Reticle is not visible - waiting for surface");
    state.ui.surfaceIndicator.textContent = "Please point at a surface";
    return;
  }

  // Create a clone of the preview item
  const placedModel = state.previewItem.clone();

  // Get reticle position & rotation
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  state.reticle.matrix.decompose(position, rotation, scale);

  // Set the position and rotation of the placed model
  placedModel.position.copy(position);
  placedModel.quaternion.copy(rotation);

  // Make it fully opaque
  placedModel.traverse((child) => {
    if (child.isMesh) {
      child.material = child.material.clone();
      child.material.transparent = false;
      child.material.opacity = 1.0;
    }
  });

  // Add to scene and placed items array
  state.scene.add(placedModel);
  state.placedItems.push(placedModel);

  // Reset states
  state.scene.remove(state.previewItem);
  state.previewItem = null;
  state.selectedModels = [];
  state.isModelSelected = false;
  state.reticle.visible = false;
  state.ui.confirmButtons.style.display = "none";
  state.ui.deleteButton.style.display = "none";
  state.ui.surfaceIndicator.textContent = "";

  console.log("Model placed successfully");
}

export function cancelModel() {
  if (state.previewItem) {
    state.scene.remove(state.previewItem);
    state.previewItem = null;
  }
  state.isModelSelected = false;
  state.reticle.visible = false;
  state.ui.confirmButtons.style.display = "none";
}

// Event Handlers
export function setupTouchEvents(renderer) {
  const onTouchStart = (event) => {
    event.preventDefault();

    if (event.touches.length === 1) {
      state.interaction.touches.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
      state.interaction.touches.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;

      state.interaction.raycaster.setFromCamera(state.interaction.touches, state.camera);
      const intersects = state.interaction.raycaster.intersectObjects(state.placedItems, true);

      if (intersects.length > 0) {
        let parent = intersects[0].object;
        while (parent.parent && parent.parent !== state.scene) {
          parent = parent.parent;
        }

        state.interaction.selectedObject = parent;
        state.interaction.isRotating = true;
        state.interaction.previousTouchX = event.touches[0].pageX;
        state.interaction.isScaling = false;
        state.interaction.isDragging = false;

        state.ui.deleteButton.style.left = `${event.touches[0].pageX - 40}px`;
        state.ui.deleteButton.style.top = `${event.touches[0].pageY - 60}px`;
        state.ui.deleteButton.style.display = "block";
      } else {
        state.interaction.selectedObject = null;
        state.ui.deleteButton.style.display = "none";
      }
    } else if (event.touches.length === 2 && state.interaction.selectedObject) {
      state.interaction.isRotating = false;

      // Calculate initial position for dragging
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];
      state.interaction.previousTouchX = (touch1.pageX + touch2.pageX) / 2;
      state.interaction.previousTouchY = (touch1.pageY + touch2.pageY) / 2;

      // Calculate initial distance for scaling
      state.interaction.previousPinchDistance = getTouchDistance(touch1, touch2);

      // Set the gesture mode
      const touchDistance = getTouchDistance(touch1, touch2);
      if (touchDistance < 100) {
        state.interaction.isDragging = true;
        state.interaction.isScaling = false;
      } else {
        state.interaction.isScaling = true;
        state.interaction.isDragging = false;
      }
    }
  };

  const onTouchMove = (event) => {
    event.preventDefault();

    if (state.interaction.isRotating && event.touches.length === 1 && state.interaction.selectedObject) {
      const deltaX = event.touches[0].pageX - state.interaction.previousTouchX;
      state.interaction.selectedObject.rotateY(deltaX * 0.005);
      state.interaction.previousTouchX = event.touches[0].pageX;
    }
    else if (event.touches.length === 2 && state.interaction.selectedObject) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      if (state.interaction.isDragging) {
        const currentCenterX = (touch1.pageX + touch2.pageX) / 2;
        const currentCenterY = (touch1.pageY + touch2.pageY) / 2;

        const deltaX = (currentCenterX - state.interaction.previousTouchX) * 0.01;
        const deltaZ = (currentCenterY - state.interaction.previousTouchY) * 0.01;

        state.interaction.selectedObject.position.x += deltaX;
        state.interaction.selectedObject.position.z += deltaZ;

        state.interaction.previousTouchX = currentCenterX;
        state.interaction.previousTouchY = currentCenterY;
      }
      else if (state.interaction.isScaling) {
        const currentPinchDistance = getTouchDistance(touch1, touch2);
        const scaleFactor = currentPinchDistance / state.interaction.previousPinchDistance;

        if (scaleFactor !== 1) {
          const newScale = state.interaction.selectedObject.scale.x * scaleFactor;
          if (newScale >= 0.5 && newScale <= 2) {
            state.interaction.selectedObject.scale.setScalar(newScale);
          }
        }

        state.interaction.previousPinchDistance = currentPinchDistance;
      }
    }
  };

  const onTouchEnd = (event) => {
    if (event.touches.length === 0) {
      state.interaction.isRotating = false;
      state.interaction.isDragging = false;
      state.interaction.isScaling = false;

      if (!state.interaction.selectedObject) {
        state.ui.deleteButton.style.display = "none";
      }
    }
    // If one finger remains, switch back to rotation
    else if (event.touches.length === 1 && state.interaction.selectedObject) {
      state.interaction.isRotating = true;
      state.interaction.isDragging = false;
      state.interaction.isScaling = false;
      state.interaction.previousTouchX = event.touches[0].pageX;
    }
  };

  renderer.domElement.addEventListener('touchstart', onTouchStart, false);
  renderer.domElement.addEventListener('touchmove', onTouchMove, false);
  renderer.domElement.addEventListener('touchend', onTouchEnd, false);
}

export function setupUIEvents() {
  document.addEventListener("click", (event) => {
    const isClickInsideMenu = state.ui.bottomMenu?.contains(event.target);
    const isClickOnMenuButton = state.ui.menuButton?.contains(event.target);
    const isMenuOpen = state.ui.bottomMenu?.classList.contains("open");
    if (!isClickInsideMenu && !isClickOnMenuButton && isMenuOpen) {
      state.ui.bottomMenu.classList.remove("open");
      state.ui.closeButton.style.display = "none";
      state.ui.menuButton.style.display = "block";
      state.reticle.visible = false;
    }
  });

  state.ui.menuButton.addEventListener("click", (event) => {
    event.stopPropagation();
    state.ui.bottomMenu.classList.add("open");
    state.ui.menuButton.style.display = "none";
    state.ui.closeButton.style.display = "block";
  });

  state.ui.closeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    state.ui.bottomMenu.classList.remove("open");
    state.ui.closeButton.style.display = "none";
    state.ui.menuButton.style.display = "block";
    if (!state.isModelSelected) {
      state.reticle.visible = false;
    }
  });

  const icons = document.querySelectorAll(".icon");
  icons.forEach((icon) => {
    icon.addEventListener("click", (event) => {
      event.stopPropagation();
      const clickedSubmenu = icon.querySelector(".submenu");
      document.querySelectorAll('.submenu').forEach(submenu => {
        if (submenu !== clickedSubmenu) {
          submenu.classList.remove('open');
        }
      });
      clickedSubmenu.classList.toggle("open");
    });
  });

  state.ui.placeButton.addEventListener("click", placeModel);
  state.ui.cancelButton.addEventListener("click", cancelModel);
  state.ui.deleteButton.addEventListener("click", deleteModel);
}

// Setup Category Icons and Models
export async function setupModels(itemCategories) {
  for (const category of Object.keys(itemCategories)) {
    for (let i = 1; i <= itemCategories[category].length; i++) {
      (async () => {
        const itemName = `${category}${i}`;
        const baseModelPath = `../assets/models/${category}/${itemName}`;
        const glbPath = `${baseModelPath}/${itemName}.glb`;
        const gltfPath = `${baseModelPath}/scene.gltf`;

        try {
          // Check if either GLB or GLTF file exists
          let modelPath = await getExistingFile(glbPath, gltfPath);
          if (!modelPath) {
            console.warn(`No model found for ${category}/${itemName}`);
            return;
          }

          console.log(`Loading model: ${modelPath}`);
          const model = await loadGLTF(modelPath);
          const height = itemCategories[category][i-1]?.height || 0.5;
          normalizeModel(model.scene, height);

          const item = new THREE.Group();
          item.add(model.scene);
          state.loadedModels.set(`${category}-${itemName}`, item);

          // Add click event to thumbnail
          const thumbnail = document.querySelector(`#${category}-${itemName}`);
          if (thumbnail) {
            thumbnail.addEventListener("click", (e) => {
              e.preventDefault();
              e.stopPropagation();
              const model = state.loadedModels.get(`${category}-${itemName}`);

              if (model) {
                try {
                  const modelClone = model.clone(true);
                  showModel(modelClone);
                } catch (cloneError) {
                  console.error(`Error cloning model on click: ${category}/${itemName}`, cloneError);
                }
              } else {
                console.error(`Model not found when clicked: ${category}/${itemName}`);
              }
            });
          }
        } catch (error) {
          console.error(`Error loading model ${category}/${itemName}:`, error);
        }
      })();
    }
  }
}

// Main initialization function
export function initializeAR(itemCategories) {
  return new Promise(async (resolve, reject) => {
    try {
      // Setup THREE.js scene
      state.scene = new THREE.Scene();
      state.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
      state.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      state.renderer.setPixelRatio(window.devicePixelRatio);
      state.renderer.setSize(window.innerWidth, window.innerHeight);
      state.renderer.xr.enabled = true;
      document.body.appendChild(state.renderer.domElement);
      
      // Add lights
      const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      state.scene.add(light);
      state.scene.add(directionalLight);
      
      // Create AR button
      const arButton = ARButton.createButton(state.renderer, {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.body },
        sessionInit: {
          optionalFeatures: ['dom-overlay'],
          domOverlay: { root: document.body }
        }
      });
      document.body.appendChild(arButton);
      
      // Setup XR events
      state.renderer.xr.addEventListener("sessionstart", () => {
        console.log("AR session started");
      });
      
      state.renderer.xr.addEventListener("sessionend", () => {
        console.log("AR session ended");
      });
      
      // Setup interaction objects
      state.interaction.raycaster = new THREE.Raycaster();
      state.interaction.touches = new THREE.Vector2();
      
      // Setup controller
      state.controller = state.renderer.xr.getController(0);
      state.scene.add(state.controller);
      
      // Create reticle
      state.reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
      );
      state.reticle.visible = false;
      state.reticle.matrixAutoUpdate = false;
      state.scene.add(state.reticle);
      
      // Get UI elements
      state.ui.menuButton = document.getElementById("menu-button");
      state.ui.closeButton = document.getElementById("close-button");
      state.ui.bottomMenu = document.getElementById("bottomMenu");
      state.ui.confirmButtons = document.getElementById("confirm-buttons");
      state.ui.placeButton = document.getElementById("place");
      state.ui.cancelButton = document.getElementById("cancel");
      state.ui.deleteButton = document.getElementById("delete-button");
      state.ui.surfaceIndicator = document.getElementById("surface-indicator");
      state.ui.statusMessage = document.getElementById("status-message");
      
      // Setup event listeners
      setupTouchEvents(state.renderer);
      setupUIEvents();
      
      // Load models
      await setupModels(itemCategories);
      
      // Setup animation loop
      state.renderer.setAnimationLoop((timestamp, frame) => {
        if (frame) {
          const referenceSpace = state.renderer.xr.getReferenceSpace();
          const session = state.renderer.xr.getSession();

          if (!state.hitTestSourceRequested) {
            session.requestReferenceSpace('viewer').then((referenceSpace) => {
              session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                state.hitTestSource = source;
                console.log("Hit test source acquired");
              });
            });
            state.hitTestSourceRequested = true;
          }

          if (state.hitTestSource) {
            const hitTestResults = frame.getHitTestResults(state.hitTestSource);

            if (hitTestResults.length > 0) {
              const hit = hitTestResults[0];
              if (state.isModelSelected) {
                const hitPose = hit.getPose(referenceSpace);
                state.reticle.visible = true;
                state.reticle.matrix.fromArray(hitPose.transform.matrix);

                if (state.previewItem) {
                  const position = new THREE.Vector3();
                  const rotation = new THREE.Quaternion();
                  const scale = new THREE.Vector3();
                  state.reticle.matrix.decompose(position, rotation, scale);

                  state.previewItem.position.copy(position);
                  state.previewItem.quaternion.copy(rotation);
                  state.ui.surfaceIndicator.textContent = "Tap 'Place' to position the model";
                }
              }
            } else {
              state.reticle.visible = false;
              if (state.isModelSelected) {
                state.ui.surfaceIndicator.textContent = "Point at a surface to place the model";
              }
            }
          }
        }
        state.renderer.render(state.scene, state.camera);
      });
      
      // Setup window resize handler
      window.addEventListener('resize', () => {
        state.camera.aspect = window.innerWidth / window.innerHeight;
        state.camera.updateProjectionMatrix();
        state.renderer.setSize(window.innerWidth, window.innerHeight);
      });
      
      resolve(state);
    } catch (error) {
      reject(error);
    }
  });
}

// Export the furniture categories data structure
export const itemCategories = {
  table: [
    { name: "table2", height: 0.5 },
    { name: "table2", height: 0.5 },
    { name: "table3", height: 0.5 },
    { name: "table4", height: 0.5 },
    { name: "table5", height: 0.5 }
  ],
  chair: [
    { name: "chair4", height: 0.5 },
    { name: "chair2", height: 0.5 },
    { name: "chair3", height: 0.5 },
    { name: "chair2", height: 0.5 },
    { name: "chair2", height: 0.5 }
  ],
  sofa: [
    { name: "sofa3", height: 1.5 },
    { name: "sofa2", height: 1.5 },
    { name: "sofa3", height: 1.5 },
    { name: "sofa2", height: 1.5 },
    { name: "sofa2", height: 1.5 }
  ],
  vase: [
    { name: "vase1", height: 0.5 },
    { name: "vase2", height: 0.5 },
    { name: "vase3", height: 0.5 },
    { name: "vase4", height: 0.5 },
    { name: "vase5", height: 0.5 }
  ],
  rug: [
    { name: "rug1", height: 1.0 },
    { name: "rug2", height: 1.0 },
    { name: "rug3", height: 1.0 },
    { name: "rug4", height: 1.0 },
    { name: "rug5", height: 1.0 }
  ],
};
