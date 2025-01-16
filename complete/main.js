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
    lamp: [{ name: "lamp1", height: 0.3 }],
    sofa: [{ name: "sofa1", height: 0.1 }],
    table: [{ name: "table1", height: 0.2 }],
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
        });

        const icons = document.querySelectorAll(".icon");
        icons.forEach((icon) => {
            icon.addEventListener("click", (event) => {
                const submenu = icon.querySelector(".submenu");
                submenu.classList.toggle("open");
                event.stopPropagation();
            });
        });

        // Model Management
        const placedItems = [];
        let previewItem = null;
        let selectedItem = null;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const showModel = (item) => {
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

        // Model Selection & Interaction
        const selectModel = (model) => {
            if (selectedItem && selectedItem !== model) {
                setOpacity(selectedItem, 1.0);
            }
            selectedItem = model;
            setOpacity(selectedItem, 0.8);
        };

        const checkIntersection = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(placedItems, true);

            if (intersects.length > 0) {
                let targetObject = intersects[0].object;
                while (targetObject.parent && !placedItems.includes(targetObject)) {
                    targetObject = targetObject.parent;
                }
                if (placedItems.includes(targetObject)) {
                    selectModel(targetObject);
                    return true;
                }
            }
            return false;
        };

        // Touch Interaction Variables
        let touchState = {
            isRotating: false,
            isDragging: false,
            isScaling: false,
            lastTouch: new THREE.Vector2(),
            initialRotation: 0,
            initialScale: new THREE.Vector3(),
            initialModelPosition: new THREE.Vector3(),
            initialDistance: 0,
            rotationSpeed: 0.01,
            movementSpeed: 0.003,
            scaleSpeed: 0.01,
            movementThreshold: 1, // pixels
            rotationThreshold: 1, // degrees
        };

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

        // Improved Touch Event Handlers
        const onTouchStart = (event) => {
            event.preventDefault();
            
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                const didSelect = checkIntersection({
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                });

                if (didSelect && selectedItem) {
                    touchState.isRotating = true;
                    touchState.lastTouch.set(touch.clientX, touch.clientY);
                    touchState.initialRotation = selectedItem.rotation.y;
                }
            } else if (event.touches.length === 2 && selectedItem) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                touchState.isDragging = true;
                touchState.isScaling = true;
                touchState.isRotating = false;
                
                touchState.initialDistance = getDistance(touch1, touch2);
                touchState.initialScale.copy(selectedItem.scale);
                touchState.initialModelPosition.copy(selectedItem.position);
                
                const center = getCenter(touch1, touch2);
                touchState.lastTouch.set(center.x, center.y);
            }
        };

        const onTouchMove = (event) => {
            event.preventDefault();
            
            if (!selectedItem) return;

            if (event.touches.length === 1 && touchState.isRotating) {
                const touch = event.touches[0];
                const dx = touch.clientX - touchState.lastTouch.x;
                
                // Apply smoothing to rotation
                if (Math.abs(dx) > touchState.rotationThreshold) {
                    const rotation = dx * touchState.rotationSpeed;
                    selectedItem.rotation.y += rotation;
                }
                
                touchState.lastTouch.set(touch.clientX, touch.clientY);
            } else if (event.touches.length === 2 && (touchState.isDragging || touchState.isScaling)) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const center = getCenter(touch1, touch2);

                // Smooth movement
                if (touchState.isDragging) {
                    const dx = center.x - touchState.lastTouch.x;
                    const dy = center.y - touchState.lastTouch.y;

                    if (Math.abs(dx) > touchState.movementThreshold || 
                        Math.abs(dy) > touchState.movementThreshold) {
                        const worldDx = dx * touchState.movementSpeed;
                        const worldDy = -dy * touchState.movementSpeed;

                        selectedItem.position.x += worldDx;
                        selectedItem.position.y += worldDy;
                    }
                }

                // Smooth scaling
                if (touchState.isScaling) {
                    const newDistance = getDistance(touch1, touch2);
                    const scaleFactor = newDistance / touchState.initialDistance;
                    
                    selectedItem.scale.copy(
                        touchState.initialScale.clone().multiplyScalar(
                            1 + (scaleFactor - 1) * touchState.scaleSpeed
                        )
                    );
                }

                touchState.lastTouch.set(center.x, center.y);
            }
        };

        const onTouchEnd = (event) => {
            event.preventDefault();
            
            if (event.touches.length === 0) {
                touchState.isRotating = false;
                touchState.isDragging = false;
                touchState.isScaling = false;
            } else if (event.touches.length === 1) {
                touchState.isDragging = false;
                touchState.isScaling = false;
                
                const touch = event.touches[0];
                touchState.lastTouch.set(touch.clientX, touch.clientY);
                touchState.initialRotation = selectedItem?.rotation.y || 0;
            }
        };

        // Load and setup models
        for (const category in itemCategories) {
            for (const itemInfo of itemCategories[category]) {
                const model = await loadGLTF(`../assets/models/${category}/${itemInfo.name}/scene.gltf`);
                normalizeModel(model.scene, itemInfo.height);

                const item = new THREE.Group();
                item.add(model.scene);
                item.visible = false;
                scene.add(item);

                const thumbnail = document.querySelector(`#${category}-${itemInfo.name}`);
                if (thumbnail) {
                    thumbnail.addEventListener("click", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        showModel(item);
                    });
                }
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

        // Render Loop
        const renderLoop = () => {
            renderer.setAnimationLoop(() => {
                renderer.render(scene, camera);
            });
        };

        // Add touch event listeners
        renderer.domElement.addEventListener("touchstart", onTouchStart, { passive: false });
        renderer.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
        renderer.domElement.addEventListener("touchend", onTouchEnd, { passive: false });

        renderLoop();
    };

    initialize();
});
