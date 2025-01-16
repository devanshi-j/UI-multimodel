import { loadGLTF } from "../libs/loader.js";
import * as THREE from "../libs/three123/three.module.js";
import { ARButton } from "../libs/jsm/ARButton.js";

// State management for active submenu
let activeSubmenu = null;

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

// Item categories with improved organization
const itemCategories = {
    lamp: [
        { name: "lamp1", height: 0.3, id: "lamp-lamp1" },
        { name: "lamp2", height: 0.3, id: "lamp-lamp2" },
        { name: "lamp3", height: 0.3, id: "lamp-lamp3" }
    ],
    sofa: [
        { name: "sofa1", height: 0.1, id: "sofa-sofa1" },
        { name: "sofa2", height: 0.1, id: "sofa-sofa2" },
        { name: "sofa3", height: 0.1, id: "sofa-sofa3" }
    ],
    table: [
        { name: "table1", height: 0.2, id: "table-table1" },
        { name: "table2", height: 0.2, id: "table-table2" },
        { name: "table3", height: 0.2, id: "table-table3" }
    ],
};

// Submenu management functions
const openSubmenu = (submenu) => {
    if (activeSubmenu && activeSubmenu !== submenu) {
        activeSubmenu.classList.remove('open');
    }
    submenu.classList.add('open');
    activeSubmenu = submenu;
};

const closeAllSubmenus = () => {
    document.querySelectorAll('.submenu').forEach(submenu => {
        submenu.classList.remove('open');
    });
    activeSubmenu = null;
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

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body },
        });
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButton);

        // UI Elements
        const menuButton = document.getElementById("menu-button");
        const closeButton = document.getElementById("close-button");
        const sidebarMenu = document.getElementById("sidebar-menu");
        const confirmButtons = document.getElementById("confirm-buttons");
        const placeButton = document.querySelector("#place");
        const cancelButton = document.querySelector("#cancel");

        // Model Management
        const placedItems = [];
        let previewItem = null;
        let selectedItem = null;
        const modelCache = new Map();

        // UI Event Listeners
        menuButton.addEventListener("click", () => {
            sidebarMenu.classList.add("open");
            menuButton.style.display = "none";
            closeButton.style.display = "block";
        });

        closeButton.addEventListener("click", () => {
            sidebarMenu.classList.remove("open");
            closeButton.style.display = "none";
            menuButton.style.display = "block";
            closeAllSubmenus();
        });

        // Improved icon click handling with delegation
        document.querySelectorAll(".icon").forEach((icon) => {
            icon.addEventListener("click", (event) => {
                if (event.target === icon || event.target.classList.contains('icon-image')) {
                    const submenu = icon.querySelector(".submenu");
                    if (submenu) {
                        openSubmenu(submenu);
                        event.stopPropagation();
                    }
                }
            });
        });

        // Click outside detection
        document.addEventListener('click', (event) => {
            if (!event.target.closest('.icon') && !event.target.closest('.submenu')) {
                closeAllSubmenus();
            }
        });

        // Model functions
        const showModel = (item) => {
            if (previewItem) {
                previewItem.visible = false;
            }
            previewItem = item;
            previewItem.visible = true;
            setOpacity(previewItem, 0.5);
            confirmButtons.style.display = "flex";
        };

        const placeModel = () => {
            if (previewItem) {
                const clone = deepClone(previewItem);
                setOpacity(clone, 1.0);
                clone.position.copy(previewItem.position);
                clone.rotation.copy(previewItem.rotation);
                clone.scale.copy(previewItem.scale);
                scene.add(clone);
                placedItems.push(clone);
                cancelModel();
            }
        };

        const cancelModel = () => {
            confirmButtons.style.display = "none";
            if (previewItem) {
                previewItem.visible = false;
                previewItem = null;
            }
        };

        // Improved model loading and thumbnail setup
        const setupModelAndThumbnail = async (category, itemInfo) => {
            try {
                const model = await loadGLTF(`../assets/models/${category}/${itemInfo.name}/scene.gltf`);
                normalizeModel(model.scene, itemInfo.height);

                const item = new THREE.Group();
                item.add(model.scene);
                item.visible = false;
                scene.add(item);
                modelCache.set(itemInfo.id, item);

                // Find and setup thumbnail
                const thumbnail = document.getElementById(itemInfo.id);
                if (thumbnail) {
                    thumbnail.addEventListener("click", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const modelItem = modelCache.get(itemInfo.id);
                        if (modelItem) {
                            showModel(modelItem);
                            
                            // Keep submenu open
                            const parentSubmenu = thumbnail.closest('.submenu');
                            if (parentSubmenu) {
                                openSubmenu(parentSubmenu);
                            }
                        }
                    });
                }
            } catch (error) {
                console.error(`Error loading model ${itemInfo.name}:`, error);
            }
        };

        // Load all models and setup thumbnails
        for (const category in itemCategories) {
            for (const itemInfo of itemCategories[category]) {
                await setupModelAndThumbnail(category, itemInfo);
            }
        }

        // Button Event Listeners
        placeButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            placeModel();
        });

        cancelButton.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            cancelModel();
        });

        // Touch interaction setup
        const touchState = {
            isRotating: false,
            isDragging: false,
            isScaling: false,
            lastTouch: new THREE.Vector2(),
            initialRotation: 0,
            initialScale: new THREE.Vector3(),
            initialDistance: 0,
            lastPinchDistance: 0,
            rotationSpeed: 0.01,
            movementSpeed: 0.003,
            scaleSpeed: 0.5,
            minScale: 0.5,
            maxScale: 2.0,
            movementThreshold: 1,
            rotationThreshold: 1,
        };

        // Touch utility functions
        const getDistance = (touch1, touch2) => {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const getCenter = (touch1, touch2) => {
            return {
                x: (touch1.clientX + touch2.clientX) / 2,
                y: (touch1.clientY + touch2.clientY) / 2
            };
        };

        // Model selection and raycasting
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const selectModel = (event) => {
            mouse.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.touches[0].clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                selectedItem = intersects[0].object;
                selectedItem.userData.touchStartPosition = selectedItem.position.clone();
                selectedItem.userData.touchStartRotation = selectedItem.rotation.y;
                selectedItem.userData.touchStartScale = selectedItem.scale.clone();
            }
        };

        const handleTouchStart = (event) => {
            event.preventDefault();

            if (event.touches.length === 1) {
                touchState.isRotating = true;
                selectModel(event);
                if (selectedItem) {
                    touchState.lastTouch.set(event.touches[0].clientX, event.touches[0].clientY);
                }
            } else if (event.touches.length === 2) {
                touchState.isScaling = true;
                const touchDistance = getDistance(event.touches[0], event.touches[1]);
                touchState.initialDistance = touchDistance;
                touchState.lastPinchDistance = touchDistance;
                if (selectedItem) {
                    touchState.initialScale.copy(selectedItem.scale);
                }
            }
        };

        const handleTouchMove = (event) => {
            event.preventDefault();

            if (event.touches.length === 1 && touchState.isRotating && selectedItem) {
                const touch = new THREE.Vector2(event.touches[0].clientX, event.touches[0].clientY);
                const deltaX = touch.x - touchState.lastTouch.x;
                const deltaY = touch.y - touchState.lastTouch.y;

                if (Math.abs(deltaX) > touchState.movementThreshold) {
                    selectedItem.position.x += deltaX * touchState.movementSpeed;
                    touchState.lastTouch.x = touch.x;
                }
                if (Math.abs(deltaY) > touchState.movementThreshold) {
                    selectedItem.position.z += deltaY * touchState.movementSpeed;
                    touchState.lastTouch.y = touch.y;
                }
            } else if (event.touches.length === 2 && touchState.isScaling && selectedItem) {
                const currentDistance = getDistance(event.touches[0], event.touches[1]);
                const scaleDelta = currentDistance / touchState.initialDistance;
                const newScale = touchState.initialScale.clone().multiplyScalar(scaleDelta);
                selectedItem.scale.copy(newScale.clampScalar(touchState.minScale, touchState.maxScale));
                touchState.lastPinchDistance = currentDistance;
            }
        };

        const handleTouchEnd = (event) => {
            event.preventDefault();

            if (event.touches.length === 0) {
                touchState.isRotating = false;
                touchState.isDragging = false;
                touchState.isScaling = false;
                selectedItem = null;
            }
        };

        // Add event listeners for touch events
        window.addEventListener("touchstart", handleTouchStart, false);
        window.addEventListener("touchmove", handleTouchMove, false);
        window.addEventListener("touchend", handleTouchEnd, false);

        // Render loop
        const render = () => {
            renderer.setAnimationLoop(() => {
                renderer.render(scene, camera);
            });
        };

        render();
    };

    initialize();
});
