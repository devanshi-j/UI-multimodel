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
        let initialTouchPositions = [];
        let initialDistance = 0;
        let initialScale = new THREE.Vector3();
        let lastTouchPosition = new THREE.Vector2();
        let initialRotation = 0;
        let initialModelPosition = new THREE.Vector3();
        let isScaling = false;
        let isDragging = false;
        let touchStartTime = 0;
        const ROTATION_SPEED = 0.02;
        const MOVEMENT_SPEED = 0.005;

        const getDistance = (touch1, touch2) => {
            const dx = touch1.clientX - touch2.clientX;
            const dy = touch1.clientY - touch2.clientY;
            return Math.sqrt(dx * dx + dy * dy);
        };

        const getRotationAngle = (touch, center) => {
            return Math.atan2(
                touch.clientY - center.y,
                touch.clientX - center.x
            );
        };

        // Touch Event Handlers
        const onTouchStart = (event) => {
            touchStartTime = Date.now();
            
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                const didSelect = checkIntersection({
                    clientX: touch.clientX,
                    clientY: touch.clientY
                });

                if (didSelect && selectedItem) {
                    isDragging = true;
                    lastTouchPosition.set(touch.clientX, touch.clientY);
                    initialRotation = selectedItem.rotation.y;
                    initialModelPosition.copy(selectedItem.position);
                }
            } else if (event.touches.length === 2 && selectedItem) {
                isScaling = true;
                isDragging = false;
                
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                initialDistance = getDistance(touch1, touch2);
                initialScale.copy(selectedItem.scale);
                initialModelPosition.copy(selectedItem.position);
                
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;
                initialRotation = getRotationAngle(touch1, { x: centerX, y: centerY });
            }
            
            initialTouchPositions = Array.from(event.touches);
        };

        const onTouchMove = (event) => {
            if (!selectedItem) return;

            if (event.touches.length === 1 && isDragging) {
                const touch = event.touches[0];
                const deltaTime = Date.now() - touchStartTime;
                
                const dx = touch.clientX - lastTouchPosition.x;
                const dy = touch.clientY - lastTouchPosition.y;
                
                const worldDx = dx * MOVEMENT_SPEED;
                const worldDy = -dy * MOVEMENT_SPEED;
                
                selectedItem.position.x = initialModelPosition.x + worldDx;
                selectedItem.position.y = initialModelPosition.y + worldDy;
                
                if (deltaTime > 200 && Math.abs(dx) > Math.abs(dy)) {
                    selectedItem.rotation.y = initialRotation + (dx * ROTATION_SPEED);
                }
                
                lastTouchPosition.set(touch.clientX, touch.clientY);
            } else if (event.touches.length === 2 && isScaling) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                const newDistance = getDistance(touch1, touch2);
                const scale = newDistance / initialDistance;
                selectedItem.scale.copy(initialScale.clone().multiplyScalar(scale));
                
                const centerX = (touch1.clientX + touch2.clientX) / 2;
                const centerY = (touch1.clientY + touch2.clientY) / 2;
                const currentRotation = getRotationAngle(touch1, { x: centerX, y: centerY });
                const rotationDelta = currentRotation - initialRotation;
                selectedItem.rotation.y = initialRotation + rotationDelta;
            }
        };

        const onTouchEnd = (event) => {
            if (event.touches.length === 0) {
                isDragging = false;
                isScaling = false;
            }
            initialTouchPositions = Array.from(event.touches);
            touchStartTime = 0;
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

        // Button event listeners
        placeButton.addEventListener("click", placeModel);
        cancelButton.addEventListener("click", cancelModel);

        // Event listeners
        window.addEventListener("touchstart", onTouchStart);
        window.addEventListener("touchmove", onTouchMove);
        window.addEventListener("touchend", onTouchEnd);
        window.addEventListener("click", checkIntersection);

        // Render loop
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        // Window resize handler
        window.addEventListener("resize", () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });
    };

    initialize();
});
