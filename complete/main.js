import { loadGLTF } from "../libs/loader.js";
import * as THREE from "../libs/three123/three.module.js";
import { ARButton } from "../libs/jsm/ARButton.js";

// Utility functions
const normalizeModel = (obj, height) => {
    const bbox = new THREE.Box3().setFromObject(obj);
    const size = bbox.getSize(new THREE.Vector3());
    obj.scale.multiplyScalar(height / size.y);

    const bbox2 = new THREE.Box3().setFromObject(obj);
    const center = bbox2.getCenter(new THREE.Vector3());
    obj.position.set(-center.x, -center.y, -center.z);
};

const setOpacity = (obj, opacity) => {
    obj.traverse((child) => {
        if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = opacity;
        }
    });
};

const deepClone = (obj) => {
    const newObj = obj.clone();
    newObj.traverse((o) => {
        if (o.isMesh) {
            o.material = o.material.clone();
        }
    });
    return newObj;
};

const itemCategories = {
    lamp: [
        { name: "lamp1", height: 0.3 },
        { name: "lamp2", height: 0.35 },
        { name: "lamp3", height: 0.28 }
    ],
    sofa: [
        { name: "sofa1", height: 0.1 },
        { name: "sofa2", height: 0.12 },
        { name: "sofa3", height: 0.15 }
    ],
    table: [
        { name: "table1", height: 0.2 },
        { name: "table2", height: 0.25 },
        { name: "table3", height: 0.22 }
    ]
};

document.addEventListener("DOMContentLoaded", () => {
    // Create UI elements
    const startARButton = document.createElement('button');
    startARButton.id = 'start-ar-button';
    startARButton.textContent = 'Start AR Experience';
    startARButton.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        padding: 15px 30px;
        font-size: 18px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        z-index: 1000;
    `;
    document.body.appendChild(startARButton);

    // Get UI elements
    const menuButton = document.getElementById("menu-button") || document.createElement('button');
    const closeButton = document.getElementById("close-button") || document.createElement('button');
    const sidebarMenu = document.getElementById("sidebar-menu") || document.createElement('div');
    const confirmButtons = document.getElementById("confirm-buttons") || document.createElement('div');
    
    // Hide UI elements initially
    menuButton.style.display = "none";
    closeButton.style.display = "none";
    sidebarMenu.style.display = "none";
    confirmButtons.style.display = "none";

    const initialize = async () => {
        // Scene and AR setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        document.body.appendChild(renderer.domElement);
        renderer.domElement.style.display = 'none';

        // Lights
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        scene.add(light);
        scene.add(directionalLight);

        // Interaction state
        let selectedObject = null;
        let interactionState = 'none';
        let initialTouchDistance = 0;
        let initialScale = new THREE.Vector3();
        let previousTouchX = 0;
        let previousTouchY = 0;
        let initialTouchMidpoint = new THREE.Vector2();
        let initialObjectPosition = new THREE.Vector3();

        // Raycaster for object selection
        const raycaster = new THREE.Raycaster();
        const touches = new THREE.Vector2();

        // Controller setup for AR
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        // Create reticle
        const reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        reticle.visible = false;
        reticle.matrixAutoUpdate = false;
        scene.add(reticle);

        // Model Management
        const loadedModels = new Map();
        const placedItems = [];
        let previewItem = null;
        let hitTestSource = null;
        let hitTestSourceRequested = false;

        // Touch helper functions
        const getTouchMidpoint = (touch1, touch2) => {
            return new THREE.Vector2(
                (touch1.pageX + touch2.pageX) / 2,
                (touch1.pageY + touch2.pageY) / 2
            );
        };

        const getTouchDistance = (touch1, touch2) => {
            const dx = touch1.pageX - touch2.pageX;
            const dy = touch1.pageY - touch2.pageY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        // Touch event handlers
        const onTouchStart = (event) => {
            event.preventDefault();
            
            if (event.touches.length === 1) {
                touches.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
                touches.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;
                
                raycaster.setFromCamera(touches, camera);
                const intersects = raycaster.intersectObjects(placedItems, true);
                
                if (intersects.length > 0) {
                    selectedObject = intersects[0].object;
                    while (selectedObject.parent && !(selectedObject.parent instanceof THREE.Scene)) {
                        selectedObject = selectedObject.parent;
                    }
                    interactionState = 'rotating';
                    previousTouchX = event.touches[0].pageX;
                }
            } else if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const midpoint = getTouchMidpoint(touch1, touch2);
                
                touches.x = (midpoint.x / window.innerWidth) * 2 - 1;
                touches.y = -(midpoint.y / window.innerHeight) * 2 + 1;
                
                raycaster.setFromCamera(touches, camera);
                const intersects = raycaster.intersectObjects(placedItems, true);
                
                if (intersects.length > 0) {
                    selectedObject = intersects[0].object;
                    while (selectedObject.parent && !(selectedObject.parent instanceof THREE.Scene)) {
                        selectedObject = selectedObject.parent;
                    }
                    
                    initialTouchDistance = getTouchDistance(touch1, touch2);
                    initialTouchMidpoint.copy(midpoint);
                    initialScale.copy(selectedObject.scale);
                    initialObjectPosition.copy(selectedObject.position);
                    interactionState = 'none';
                }
            }
        };

        const onTouchMove = (event) => {
            event.preventDefault();
            
            if (!selectedObject) return;
            
            if (interactionState === 'rotating' && event.touches.length === 1) {
                const deltaX = event.touches[0].pageX - previousTouchX;
                selectedObject.rotation.y += deltaX * 0.01;
                previousTouchX = event.touches[0].pageX;
            }
            else if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const currentMidpoint = getTouchMidpoint(touch1, touch2);
                const currentTouchDistance = getTouchDistance(touch1, touch2);

                if (interactionState === 'none') {
                    const distanceChange = Math.abs(currentTouchDistance - initialTouchDistance);
                    const midpointChange = initialTouchMidpoint.distanceTo(
                        new THREE.Vector2(currentMidpoint.x, currentMidpoint.y)
                    );
                    
                    interactionState = distanceChange > midpointChange ? 'scaling' : 'dragging';
                }

                if (interactionState === 'scaling') {
                    const scaleFactor = currentTouchDistance / initialTouchDistance;
                    const newScale = initialScale.x * scaleFactor;
                    const minScale = 0.5;
                    const maxScale = 2.0;
                    
                    if (newScale >= minScale && newScale <= maxScale) {
                        selectedObject.scale.setScalar(newScale);
                    }
                }
                else if (interactionState === 'dragging') {
                    const deltaX = (currentMidpoint.x - initialTouchMidpoint.x) * 0.01;
                    const deltaY = (currentMidpoint.y - initialTouchMidpoint.y) * 0.01;

                    selectedObject.position.x = initialObjectPosition.x + deltaX;
                    selectedObject.position.z = initialObjectPosition.z + deltaY;
                }
            }
        };

        const onTouchEnd = (event) => {
            if (event.touches.length === 0) {
                selectedObject = null;
                interactionState = 'none';
            }
            else if (event.touches.length === 1) {
                interactionState = 'rotating';
                previousTouchX = event.touches[0].pageX;
            }
        };

        // Add touch event listeners
        renderer.domElement.addEventListener('touchstart', onTouchStart, false);
        renderer.domElement.addEventListener('touchmove', onTouchMove, false);
        renderer.domElement.addEventListener('touchend', onTouchEnd, false);

        // Model placement functions
        const showModel = (item) => {
            if (previewItem) {
                scene.remove(previewItem);
            }
            previewItem = item;
            scene.add(previewItem);
            setOpacity(previewItem, 0.5);
            confirmButtons.style.display = "flex";
        };

        const placeModel = () => {
            if (previewItem && reticle.visible) {
                const clone = deepClone(previewItem);
                setOpacity(clone, 1.0);
                
                const position = new THREE.Vector3();
                const rotation = new THREE.Quaternion();
                const scale = new THREE.Vector3();
                reticle.matrix.decompose(position, rotation, scale);
                
                clone.position.copy(position);
                clone.quaternion.copy(rotation);
                
                scene.add(clone);
                placedItems.push(clone);
                cancelModel();
            }
        };

        const cancelModel = () => {
            confirmButtons.style.display = "none";
            if (previewItem) {
                scene.remove(previewItem);
                previewItem = null;
            }
        };

        // Load models
        for (const category in itemCategories) {
            for (const itemInfo of itemCategories[category]) {
                try {
                    const model = await loadGLTF(`../assets/models/${category}/${itemInfo.name}/scene.gltf`);
                    normalizeModel(model.scene, itemInfo.height);

                    const item = new THREE.Group();
                    item.add(model.scene);
                    
                    loadedModels.set(`${category}-${itemInfo.name}`, item);

                    const thumbnail = document.querySelector(`#${category}-${itemInfo.name}`);
                    if (thumbnail) {
                        thumbnail.addEventListener("click", (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const model = loadedModels.get(`${category}-${itemInfo.name}`);
                            if (model) {
                                const modelClone = deepClone(model);
                                showModel(modelClone);
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error loading model ${category}/${itemInfo.name}:`, error);
                }
            }
        }

        // Start AR button click handler
        startARButton.addEventListener('click', () => {
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

            renderer.domElement.style.display = 'block';
            if (menuButton) menuButton.style.display = "block";
            if (sidebarMenu) sidebarMenu.style.display = "block";

            startARButton.remove();
        });

        // Menu event handlers
        document.addEventListener("click", (event) => {
            const isClickInsideMenu = sidebarMenu?.contains(event.target);
            const isClickOnMenuButton = menuButton?.contains(event.target);
            const isMenuOpen = sidebarMenu?.classList.contains("open");
            
            if (!isClickInsideMenu && !isClickOnMenuButton && isMenuOpen) {
                sidebarMenu.classList.remove("open");
                closeButton.style.display = "none";
                menuButton.style.display = "block";
            }
        });

        if (menuButton) {
            menuButton.addEventListener("click", (event) => {
                event.stopPropagation();
                sidebarMenu.classList.add("open");
                menuButton.style.display = "none";
                closeButton.style.display = "block";
            });
        }

        if (closeButton) {
            closeButton.addEventListener("click", (event) => {
                event.stopPropagation();
                sidebarMenu.classList.remove("open");
                closeButton.style.display = "none";
                menuButton.style.display = "block";
            });
        }

        // Button Event Listeners
        const placeButton = document.querySelector("#place");
        const cancelButton = document.querySelector("#cancel");
        if (placeButton) placeButton.addEventListener("click", placeModel);
        if (cancelButton) cancelButton.addEventListener("click", cancelModel);

                           
        // AR Session and Render Loop
        renderer.setAnimationLoop((timestamp, frame) => {
            if (frame) {
                const referenceSpace = renderer.xr.getReferenceSpace();
                const session = renderer.xr.getSession();

                if (!hitTestSourceRequested) {
                    session.requestReferenceSpace('viewer').then((referenceSpace) => {
                        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                            hitTestSource = source;
                        });
                    });
                    hitTestSourceRequested = true;
                }

                if (hitTestSource) {
                    const hitTestResults = frame.getHitTestResults(hitTestSource);
                    if (hitTestResults.length > 0) {
                        const hit = hitTestResults[0];
                        reticle.visible = true;
                        reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);

                        if (previewItem) {
                            const position = new THREE.Vector3();
                            const rotation = new THREE.Quaternion();
                            const scale = new THREE.Vector3();
                            reticle.matrix.decompose(position, rotation, scale);
                            
                            previewItem.position.copy(position);
                            previewItem.quaternion.copy(rotation);
                        }
                    } else {
                        reticle.visible = false;
                    }
                }
            }

            renderer.render(scene, camera);
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, indow.innerHeight);
        });
    };

    initialize().catch(console.error);
});
