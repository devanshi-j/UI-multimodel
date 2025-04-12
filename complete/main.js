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

// Function to show loading bar
const showLoadingBar = () => {
  const loadingContainer = document.getElementById('loading-container');
  const loadingBarFill = document.querySelector('.loading-bar-fill');
  
  loadingContainer.style.display = 'block';
  loadingBarFill.style.width = '0%';
  
  // Start with animation to show some progress
  setTimeout(() => {
    loadingBarFill.style.width = '30%';
  }, 100);
};

// Function to update loading bar progress
const updateLoadingProgress = (percent) => {
  const loadingBarFill = document.querySelector('.loading-bar-fill');
  loadingBarFill.style.width = `${percent}%`;
};

// Function to hide loading bar
const hideLoadingBar = () => {
  const loadingContainer = document.getElementById('loading-container');
  const loadingBarFill = document.querySelector('.loading-bar-fill');
  
  // Complete the loading animation
  loadingBarFill.style.width = '100%';
  
  // Hide after a short delay to show the completed bar
  setTimeout(() => {
    loadingContainer.style.display = 'none';
  }, 300);
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

// Fix for submenu functionality
const icons = document.querySelectorAll(".icon");
icons.forEach((icon) => {
  icon.addEventListener("click", (event) => {
    event.stopPropagation();
    const clickedSubmenu = icon.querySelector(".submenu");
    
    // Add console logs to debug
    console.log("Icon clicked", icon);
    console.log("Clicked submenu element:", clickedSubmenu);
    
    // Make sure the submenu exists before attempting to toggle
    if (clickedSubmenu) {
      // Close other submenus
      document.querySelectorAll('.submenu').forEach(submenu => {
        if (submenu !== clickedSubmenu) {
          submenu.classList.remove('open');
        }
      });
      
      // Toggle the clicked submenu
      clickedSubmenu.classList.toggle("open");
      console.log("Submenu toggled, open status:", clickedSubmenu.classList.contains('open'));
    }
  });
});

// Fix for loading bar visibility - make sure it's hidden by default
document.addEventListener("DOMContentLoaded", () => {
  // This will run after all other DOMContentLoaded handlers
  setTimeout(() => {
    const loadingContainer = document.getElementById('loading-container');
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
      console.log("Loading container hidden on page load");
    } else {
      console.error("Loading container element not found");
    }
  }, 0);
});

// Ensure your original loadGLTFWithProgress function isn't showing 
// the loading bar during initial load - add this check
const showLoadingBar = () => {
  const loadingContainer = document.getElementById('loading-container');
  const loadingBarFill = document.querySelector('.loading-bar-fill');
  
  if (!loadingContainer || !loadingBarFill) {
    console.error("Loading elements not found in the DOM");
    return;
  }
  
  console.log("Showing loading bar");
  loadingContainer.style.display = 'block';
  loadingBarFill.style.width = '0%';
  
  // Start with animation to show some progress
  setTimeout(() => {
    loadingBarFill.style.width = '30%';
  }, 100);
};

// Make sure loading bar is hidden properly when complete
const hideLoadingBar = () => {
  const loadingContainer = document.getElementById('loading-container');
  const loadingBarFill = document.querySelector('.loading-bar-fill');
  
  if (!loadingContainer || !loadingBarFill) {
    console.error("Loading elements not found in the DOM");
    return;
  }
  
  // Complete the loading animation
  loadingBarFill.style.width = '100%';
  console.log("Loading complete, hiding bar soon");
  
  // Hide after a short delay to show the completed bar
  setTimeout(() => {
    loadingContainer.style.display = 'none';
    console.log("Loading bar hidden");
  }, 300);
};
// Modified model loading loop to control loading bar visibility
for (const category of ['table', 'chair', 'sofa', 'vase', 'rug']) {
  for (let i = 1; i <= 5; i++) {
    const itemName = `${category}${i}`;
    try {
      // Use the loadGLTF without showing the loading bar for initial loads
      const model = await loadGLTF(`../assets/models/${category}/${itemName}/scene.gltf`);
      
      normalizeModel(model.scene, 0.5);
      const item = new THREE.Group();
      item.add(model.scene);
      loadedModels.set(`${category}-${itemName}`, item);
      
      const thumbnail = document.querySelector(`#${category}-${itemName}`);
      if (thumbnail) {
        thumbnail.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          // Show loading bar only when thumbnail is clicked
          showLoadingBar();
          
          const model = loadedModels.get(`${category}-${itemName}`);
          if (model) {
            // Simulate loading process
            setTimeout(() => {
              updateLoadingProgress(50);
              
              setTimeout(() => {
                try {
                  updateLoadingProgress(90);
                  const modelClone = model.clone(true);
                  showModel(modelClone);
                  hideLoadingBar();
                } catch (error) {
                  console.error(`Error cloning model: ${category}/${itemName}`, error);
                  hideLoadingBar();
                }
              }, 100);
            }, 100);
          } else {
            console.error(`Model not found: ${category}-${itemName}`);
            hideLoadingBar();
          }
        });
      }
    } catch (error) {
      console.error(`Error loading model ${category}/${itemName}:`, error);
    }
  }
}

// Make sure the loading bar is hidden initially when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const loadingContainer = document.getElementById('loading-container');
  if (loadingContainer) {
    loadingContainer.style.display = 'none';
  }
});
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
