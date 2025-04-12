// Import required modules
import { loadGLTF } from "../libs/loader.js";
import * as THREE from "../libs/three123/three.module.js";
import { ARButton } from "../libs/jsm/ARButton.js";

// Initialize Service Worker
function initServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('../complete/service-worker.js')
        .then(registration => {
          console.log('[SW] Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('[SW] Service Worker registration failed:', error);
        });
    });
  } else {
    console.warn('[SW] Service Workers are not supported in this browser.');
  }
}

initServiceWorker();

// Define assets with correct dimensions
const assets = {
  table: [
    { name: "table1", height: 0.5, width: 0.6 },
    { name: "table2", height: 0.5, width: 0.6 },
    { name: "table3", height: 0.5, width: 0.6 },
    { name: "table4", height: 0.5, width: 0.6 },
    { name: "table5", height: 0.5, width: 0.6 }
  ],
  chair: [
    { name: "chair1", height: 0.5, width: 0.5 },
    { name: "chair2", height: 0.5, width: 0.5 },
    { name: "chair3", height: 0.5, width: 0.5 },
    { name: "chair4", height: 0.5, width: 0.5 },
    { name: "chair5", height: 0.5, width: 0.5 }
  ],
  sofa: [
    { name: "sofa1", height: 1.5, width: 1.0 },
    { name: "sofa2", height: 1.5, width: 1.0 },
    { name: "sofa3", height: 1.5, width: 1.0 },
    { name: "sofa4", height: 1.5, width: 1.0 },
    { name: "sofa5", height: 1.5, width: 1.0 }
  ],
  vase: [
    { name: "vase1", height: 0.5, width: 0.3 },
    { name: "vase2", height: 0.5, width: 0.25 },
    { name: "vase3", height: 0.5, width: 0.2 },
    { name: "vase4", height: 0.5, width: 0.35 },
    { name: "vase5", height: 0.5, width: 0.3 }
  ],
  rug: [
    { name: "rug1", height: 0.2, width: 0.3 },
    { name: "rug2", height: 0.2, width: 0.3 },
    { name: "rug3", height: 0.2, width: 0.6 },
    { name: "rug4", height: 0.2, width: 0.6 },
    { name: "rug5", height: 0.2, width: 0.6 }
  ]
};

// Global variables
const loadedModels = new Map();
let placedItems = [];
let previewItem = null;
let hitTestSource = null;
let hitTestSourceRequested = false;
let isModelSelected = false;
let selectedModels = [];

// Model manipulation functions
const selectModel = (model) => {
  selectedModels = [model]; // Reset and add only the current model
  console.log("Model selected:", model);
  console.log("Updated selectedModels:", selectedModels);
};

// Apply scaling based on item info
const applyModelScaling = (obj, itemInfo) => {
  const bbox = new THREE.Box3().setFromObject(obj);
  const size = bbox.getSize(new THREE.Vector3());
  
  // Apply height scaling first
  const heightScale = itemInfo.height / size.y;
  obj.scale.multiplyScalar(heightScale);
  
  // Recalculate bounding box after height scaling
  const newBbox = new THREE.Box3().setFromObject(obj);
  const newSize = newBbox.getSize(new THREE.Vector3());
  
  // Apply width scaling to x-axis
  const widthScale = itemInfo.width / newSize.x;
  obj.scale.x *= widthScale;
  
  // Center the object
  const finalBbox = new THREE.Box3().setFromObject(obj);
  const center = finalBbox.getCenter(new THREE.Vector3());
  obj.position.set(-center.x, -center.y, -center.z);
};

const normalizeModel = (obj, height) => {
  const bbox = new THREE.Box3().setFromObject(obj);
  const size = bbox.getSize(new THREE.Vector3());
  obj.scale.multiplyScalar(height / size.y);
  const bbox2 = new THREE.Box3().setFromObject(obj);
  const center = bbox2.getCenter(new THREE.Vector3());
  obj.position.set(-center.x, -center.y, -center.z);
};

const setOpacityForSelected = (opacity) => {
  console.log(`setOpacityForSelected(${opacity}) called. Selected models:`, selectedModels);

  if (selectedModels.length === 0) {
    console.warn("setOpacityForSelected() - No models in selectedModels array!");
    return;
  }

  selectedModels.forEach((model) => {
    model.traverse((child) => {
      if (child.isMesh) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.format = THREE.RGBAFormat;
        child.material.opacity = opacity;
      }
    });
  });
};

// Main initialization when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const initialize = async () => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Lighting
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    scene.add(light);
    scene.add(directionalLight);
    
    // AR setup
    const arButton = ARButton.createButton(renderer, {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: document.body },
      sessionInit: {
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body }
      }
    });
    document.body.appendChild(arButton);
    
    renderer.xr.addEventListener("sessionstart", () => {
      console.log("AR session started");
    });
    
    renderer.xr.addEventListener("sessionend", () => {
      console.log("AR session ended");
    });
    
    // Interaction setup
    const raycaster = new THREE.Raycaster();
    const touches = new THREE.Vector2();
    let selectedObject = null;
    let isDragging = false;
    let isRotating = false;
    let isScaling = false;
    let previousTouchX = 0;
    let previousTouchY = 0;
    let previousPinchDistance = 0;
    
    const controller = renderer.xr.getController(0);
    scene.add(controller);
    
    // Reticle for AR placement
    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    reticle.visible = false;
    reticle.matrixAutoUpdate = false;
    scene.add(reticle);

    // Touch event handlers
    const onTouchStart = (event) => {
      event.preventDefault();

      if (event.touches.length === 1) {
        touches.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
        touches.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(touches, camera);
        const intersects = raycaster.intersectObjects(placedItems, true);

        if (intersects.length > 0) {
          let parent = intersects[0].object;
          while (parent.parent && parent.parent !== scene) {
            parent = parent.parent;
          }

          selectedObject = parent;
          isRotating = true;
          previousTouchX = event.touches[0].pageX;
          isScaling = false;
          isDragging = false;

          deleteButton.style.left = `${event.touches[0].pageX - 40}px`;
          deleteButton.style.top = `${event.touches[0].pageY - 60}px`;
          deleteButton.style.display = "block";
        } else {
          selectedObject = null;
          deleteButton.style.display = "none";
        }
      } else if (event.touches.length === 2 && selectedObject) {
        isRotating = false;

        // Calculate initial position for dragging
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];
        previousTouchX = (touch1.pageX + touch2.pageX) / 2;
        previousTouchY = (touch1.pageY + touch2.pageY) / 2;

        // Calculate initial distance for scaling
        previousPinchDistance = getTouchDistance(touch1, touch2);

        // Set the gesture mode
        const touchDistance = getTouchDistance(touch1, touch2);
        if (touchDistance < 100) {
          isDragging = true;
          isScaling = false;
        } else {
          isScaling = true;
          isDragging = false;
        }
      }
    };

    const onTouchMove = (event) => {
      event.preventDefault();

      if (isRotating && event.touches.length === 1 && selectedObject) {
        const deltaX = event.touches[0].pageX - previousTouchX;
        selectedObject.rotateY(deltaX * 0.005);
        previousTouchX = event.touches[0].pageX;
      }
      else if (event.touches.length === 2 && selectedObject) {
        const touch1 = event.touches[0];
        const touch2 = event.touches[1];

        if (isDragging) {
          const currentCenterX = (touch1.pageX + touch2.pageX) / 2;
          const currentCenterY = (touch1.pageY + touch2.pageY) / 2;

          const deltaX = (currentCenterX - previousTouchX) * 0.01;
          const deltaZ = (currentCenterY - previousTouchY) * 0.01;

          selectedObject.position.x += deltaX;
          selectedObject.position.z += deltaZ;

          previousTouchX = currentCenterX;
          previousTouchY = currentCenterY;
        }
        else if (isScaling) {
          const currentPinchDistance = getTouchDistance(touch1, touch2);
          
          // Only proceed if we have a valid previous distance
          if (previousPinchDistance > 0) {
            // Calculate scale factor as the ratio between current and previous distance
            const scaleFactor = currentPinchDistance / previousPinchDistance;
            
            // Apply scaling with a dampening factor to make it less sensitive
            const dampedScaleFactor = 1.0 + (scaleFactor - 1.0) * 0.5;
            
            // Apply the scale adjustment to the current scale
            const newScale = selectedObject.scale.x * dampedScaleFactor;
            
            // Apply scaling with limits to prevent too small or too large objects
            if (newScale >= 0.2 && newScale <= 3.0) {
              selectedObject.scale.set(newScale, newScale, newScale);
            }
          }
          
          // Update the previous distance for the next move event
          previousPinchDistance = currentPinchDistance;
        }
      }
    };

    const onTouchEnd = (event) => {
      if (event.touches.length === 0) {
        isRotating = false;
        isDragging = false;
        isScaling = false;

        if (!selectedObject) {
          deleteButton.style.display = "none";
        }
      }
      // If one finger remains, switch back to rotation
      else if (event.touches.length === 1 && selectedObject) {
        isRotating = true;
        isDragging = false;
        isScaling = false;
        previousTouchX = event.touches[0].pageX;
      }
    };

    const getTouchDistance = (touch1, touch2) => {
      const dx = touch1.pageX - touch2.pageX;
      const dy = touch1.pageY - touch2.pageY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    renderer.domElement.addEventListener('touchstart', onTouchStart, false);
    renderer.domElement.addEventListener('touchmove', onTouchMove, false);
    renderer.domElement.addEventListener('touchend', onTouchEnd, false);

    // UI Elements
    const menuButton = document.getElementById("menu-button");
    const closeButton = document.getElementById("close-button");
    const bottomMenu = document.getElementById("bottomMenu");
    const confirmButtons = document.getElementById("confirm-buttons");
    const placeButton = document.getElementById("place");
    const cancelButton = document.getElementById("cancel");
    const deleteButton = document.getElementById("delete-button");
    const surfaceIndicator = document.getElementById("surface-indicator");
    const statusMessage = document.getElementById("status-message");
    const loadingContainer = document.getElementById("loadingContainer");
    const loadingBar = document.getElementById("loadingBar");

    // Menu interaction
    document.addEventListener("click", (event) => {
      const isClickInsideMenu = bottomMenu?.contains(event.target);
      const isClickOnMenuButton = menuButton?.contains(event.target);
      const isMenuOpen = bottomMenu?.classList.contains("open");
      if (!isClickInsideMenu && !isClickOnMenuButton && isMenuOpen) {
        bottomMenu.classList.remove("open");
        closeButton.style.display = "none";
        menuButton.style.display = "block";
        reticle.visible = false;
      }
    });

    menuButton.addEventListener("click", (event) => {
      event.stopPropagation();
      bottomMenu.classList.add("open");
      menuButton.style.display = "none";
      closeButton.style.display = "block";
    });

    closeButton.addEventListener("click", (event) => {
      event.stopPropagation();
      bottomMenu.classList.remove("open");
      closeButton.style.display = "none";
      menuButton.style.display = "block";
      if (!isModelSelected) {
        reticle.visible = false;
      }
    });

    // Icon submenus
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

    // Model management functions
    const showModel = (item) => {
      if (previewItem) {
        scene.remove(previewItem);
      }

      selectModel(item);
      console.log("showModel() called. Selected models:", selectedModels);

      previewItem = item;
      scene.add(previewItem);

      setOpacityForSelected(0.5);

      confirmButtons.style.display = "flex";
      isModelSelected = true;
    };

    const deleteModel = () => {
      if (selectedObject) {
        scene.remove(selectedObject);
        placedItems = placedItems.filter(item => item !== selectedObject);
        selectedObject = null;
        deleteButton.style.display = "none";
      }
    };

    const placeModel = () => {
      console.log("placeModel() called. Current selectedModels:", selectedModels);
      console.log("Preview item:", previewItem);
      console.log("Reticle visible:", reticle.visible);

      if (!previewItem) {
        console.warn("No preview item available");
        return;
      }

      if (!reticle.visible) {
        console.warn("Reticle is not visible - waiting for surface");
        surfaceIndicator.textContent = "Please point at a surface";
        return;
      }

      // Create a clone of the preview item
      const placedModel = previewItem.clone();

      // Get reticle position & rotation
      const position = new THREE.Vector3();
      const rotation = new THREE.Quaternion();
      const scale = new THREE.Vector3();
      reticle.matrix.decompose(position, rotation, scale);

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
      scene.add(placedModel);
      placedItems.push(placedModel);

      // Reset states
      scene.remove(previewItem);
      previewItem = null;
      selectedModels = [];
      isModelSelected = false;
      reticle.visible = false;
      confirmButtons.style.display = "none";
      deleteButton.style.display = "none";
      surfaceIndicator.textContent = "";

      console.log("Model placed successfully");
    };

    const cancelModel = () => {
      if (previewItem) {
        scene.remove(previewItem);
        previewItem = null;
      }
      isModelSelected = false;
      reticle.visible = false;
      confirmButtons.style.display = "none";
    };

    // Button events
    placeButton.addEventListener("click", placeModel);
    cancelButton.addEventListener("click", cancelModel);
    deleteButton.addEventListener("click", deleteModel);


    const loadGLTFWithProgress = (url, onProgress) => {
  return new Promise((resolve, reject) => {
    const loader = new THREE.GLTFLoader();
    loader.load(
      url,
      (gltf) => resolve(gltf),
      (xhr) => {
        if (onProgress && xhr.lengthComputable) {
          const percent = (xhr.loaded / xhr.total) * 100;
          onProgress(percent);
        }
      },
      (error) => reject(error)
    );
  });
};
    
    // Load models for each category
for (const category of ['table', 'chair', 'sofa', 'vase', 'rug']) {
  for (let i = 1; i <= 5; i++) {
    const itemName = `${category}${i}`;
    try {
      // Show loading bar initially
      loadingContainer.style.display = "block";
      loadingBar.style.width = "0%";

      const model = await loadGLTFWithProgress(
        `../assets/models/${category}/${itemName}/scene.gltf`,
        (progress) => {
          loadingBar.style.width = `${progress}%`;
        }
      );

      // Hide loading bar after load
      loadingContainer.style.display = "none";

      // Find the corresponding item info in assets
      const categoryAssets = assets[category];
      const itemInfo = categoryAssets.find(item => item.name === itemName);
      
      if (itemInfo) {
        applyModelScaling(model.scene, itemInfo);
      } else {
        console.warn(`No item info found for ${itemName}, using defaults`);
        applyModelScaling(model.scene, { height: 0.5, width: 0.5 });
      }

      const item = new THREE.Group();
      item.add(model.scene);
      loadedModels.set(`${category}-${itemName}`, item);

      const thumbnail = document.querySelector(`#${category}-${itemName}`);
      if (thumbnail) {
        thumbnail.addEventListener("click", async (e) => {
          e.preventDefault();
          e.stopPropagation();

          const model = loadedModels.get(`${category}-${itemName}`);
          if (model) {
            const modelClone = model.clone(true);

            // Show loading bar during rendering delay (if any)
            loadingContainer.style.display = "block";
            loadingBar.style.width = "100%";

            // Wait 1 frame to simulate async delay (optional, can be removed)
            await new Promise(resolve => setTimeout(resolve, 50));

            showModel(modelClone);

            // Hide loading bar once added to scene
            loadingContainer.style.display = "none";
          }
        });
      }
    } catch (error) {
      console.error(`Error loading model ${category}/${itemName}:`, error);
      loadingContainer.style.display = "none"; // Fail-safe
    }
  }
}

    // Animation loop
    renderer.setAnimationLoop((timestamp, frame) => {
      if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if (!hitTestSourceRequested) {
          session.requestReferenceSpace('viewer').then((referenceSpace) => {
            session.requestHitTestSource({ space: referenceSpace }).then((source) => {
              hitTestSource = source;
              console.log("Hit test source acquired");
            });
          });
          hitTestSourceRequested = true;
        }

        if (hitTestSource) {
          const hitTestResults = frame.getHitTestResults(hitTestSource);

          if (hitTestResults.length > 0) {
            const hit = hitTestResults[0];
            if (isModelSelected) {
              const hitPose = hit.getPose(referenceSpace);
              reticle.visible = true;
              reticle.matrix.fromArray(hitPose.transform.matrix);

              if (previewItem) {
                const position = new THREE.Vector3();
                const rotation = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                reticle.matrix.decompose(position, rotation, scale);

                previewItem.position.copy(position);
                previewItem.quaternion.copy(rotation);
                surfaceIndicator.textContent = "Tap 'Place' to position the model";
              }
            }
          } else {
            reticle.visible = false;
            if (isModelSelected) {
              surfaceIndicator.textContent = "Point at a surface to place the model";
            }
          }
        }
      }
      renderer.render(scene, camera);
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  };

  initialize().catch(console.error);
});
