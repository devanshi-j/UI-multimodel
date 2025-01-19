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

// Item categories
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
    const initialize = async () => {
        // Scene and AR setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body }
        });
        document.body.appendChild(arButton);
        document.body.appendChild(renderer.domElement);

        // Lighting setup
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        scene.add(light);
        scene.add(directionalLight);

        // Interaction state management
        const interactionState = {
            selectedObject: null,
            mode: null,
            initialTouchDistance: 0,
            initialScale: new THREE.Vector3(),
            previousTouchX: 0,
            startPosition: new THREE.Vector3(),
            dragPlane: new THREE.Plane(),
            touchCount: 0,
            lastTapTime: 0
        };

        // Raycaster setup
        const raycaster = new THREE.Raycaster();
        const touches = new THREE.Vector2();

        // Controller and reticle setup
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        const reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        reticle.visible = false;
        reticle.matrixAutoUpdate = false;
        scene.add(reticle);

        // UI Elements
        const menuButton = document.getElementById("menu-button");
        const closeButton = document.getElementById("close-button");
        const sidebarMenu = document.getElementById("sidebar-menu");
        const confirmButtons = document.getElementById("confirm-buttons");
        const placeButton = document.querySelector("#place");
        const cancelButton = document.querySelector("#cancel");

        // Model Management
        const loadedModels = new Map();
        const placedItems = [];
        let previewItem = null;
        let hitTestSource = null;
        let hitTestSourceRequested = false;

        // Touch event utilities
        const getTouchDistance = (touch1, touch2) => {
            const dx = touch1.pageX - touch2.pageX;
            const dy = touch1.pageY - touch2.pageY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const getTouchMidpoint = (touch1, touch2) => {
            return {
                x: (touch1.pageX + touch2.pageX) / 2,
                y: (touch1.pageY + touch2.pageY) / 2
            };
        };

        const updateDragPlane = (camera, object) => {
            const normal = new THREE.Vector3(0, 0, 1);
            normal.applyQuaternion(camera.quaternion);
            interactionState.dragPlane.setFromNormalAndCoplanarPoint(
                normal,
                object.position
            );
        };

        // Enhanced touch event handlers
        const onTouchStart = (event) => {
            event.preventDefault();
            
            interactionState.touchCount = event.touches.length;

            if (event.touches.length === 1) {
                // Single touch - Rotation
                touches.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
                touches.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;
                
                raycaster.setFromCamera(touches, camera);
                const intersects = raycaster.intersectObjects(placedItems, true);
                
                if (intersects.length > 0) {
                    interactionState.selectedObject = intersects[0].object.parent;
                    interactionState.mode = 'rotating';
                    interactionState.previousTouchX = event.touches[0].pageX;
                }
            } 
            else if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                touches.x = (getTouchMidpoint(touch1, touch2).x / window.innerWidth) * 2 - 1;
                touches.y = -(getTouchMidpoint(touch1, touch2).y / window.innerHeight) * 2 + 1;
                
                raycaster.setFromCamera(touches, camera);
                const intersects = raycaster.intersectObjects(placedItems, true);
                
                if (intersects.length > 0) {
                    interactionState.selectedObject = intersects[0].object.parent;
                    interactionState.initialTouchDistance = getTouchDistance(touch1, touch2);
                    interactionState.initialScale.copy(interactionState.selectedObject.scale);
                    
                    // Determine if scaling or dragging based on touch orientation
                    const touchAngle = Math.abs(Math.atan2(
                        touch2.pageY - touch1.pageY,
                        touch2.pageX - touch1.pageX
                    ));
                    
                    if (touchAngle > Math.PI / 4 && touchAngle < (3 * Math.PI) / 4) {
                        interactionState.mode = 'scaling';
                    } else {
                        interactionState.mode = 'dragging';
                        interactionState.startPosition.copy(interactionState.selectedObject.position);
                        updateDragPlane(camera, interactionState.selectedObject);
                    }
                }
            }
        };

        const onTouchMove = (event) => {
            event.preventDefault();
            
            if (!interactionState.selectedObject) return;

            if (interactionState.mode === 'rotating' && event.touches.length === 1) {
                const deltaX = event.touches[0].pageX - interactionState.previousTouchX;
                interactionState.selectedObject.rotation.y += deltaX * 0.02;
                interactionState.previousTouchX = event.touches[0].pageX;
            } 
            else if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                if (interactionState.mode === 'scaling') {
                    const currentDistance = getTouchDistance(touch1, touch2);
                    const scale = currentDistance / interactionState.initialTouchDistance;
                    interactionState.selectedObject.scale.copy(interactionState.initialScale);
                    interactionState.selectedObject.scale.multiplyScalar(scale);
                } 
                else if (interactionState.mode === 'dragging') {
                    const midpoint = getTouchMidpoint(touch1, touch2);
                    touches.x = (midpoint.x / window.innerWidth) * 2 - 1;
                    touches.y = -(midpoint.y / window.innerHeight) * 2 + 1;
                    
                    raycaster.setFromCamera(touches, camera);
                    const intersection = new THREE.Vector3();
                    if (raycaster.ray.intersectPlane(interactionState.dragPlane, intersection)) {
                        interactionState.selectedObject.position.copy(intersection);
                    }
                }
            }
        };

        const onTouchEnd = (event) => {
            if (event.touches.length === 0) {
                interactionState.mode = null;
                interactionState.selectedObject = null;
            }
            interactionState.touchCount = event.touches.length;
        };

        // Add touch event listeners
        renderer.domElement.addEventListener('touchstart', onTouchStart, false);
        renderer.domElement.addEventListener('touchmove', onTouchMove, false);
        renderer.domElement.addEventListener('touchend', onTouchEnd, false);

        // Menu event handlers
        menuButton.addEventListener("click", (event) => {
            event.stopPropagation();
            sidebarMenu.classList.add("open");
            menuButton.style.display = "none";
            closeButton.style.display = "block";
        });

        closeButton.addEventListener("click", (event) => {
            event.stopPropagation();
            sidebarMenu.classList.remove("open");
            closeButton.style.display = "none";
            menuButton.style.display = "block";
        });

        // Category handlers
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

        // Model handling functions
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
                
                // Reset preview without closing sidebar
                scene.remove(previewItem);
                previewItem = null;
                confirmButtons.style.display = "none";
            }
        };

        const cancelModel = () => {
            if (previewItem) {
                scene.remove(previewItem);
                previewItem = null;
            }
            confirmButtons.style.display = "none";
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

        // Button Event Listeners
        placeButton.addEventListener("click", placeModel);
        cancelButton.addEventListener("click", cancelModel);

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
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    };

    initialize().catch(console.error);
});
