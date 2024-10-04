import { loadGLTF } from "../libs/loader.js";
import * as THREE from '../libs/three123/three.module.js';
import { ARButton } from '../libs/jsm/ARButton.js';

// Normalizing model function
const normalizeModel = (obj, height) => {
    const bbox = new THREE.Box3().setFromObject(obj);
    const size = bbox.getSize(new THREE.Vector3());
    obj.scale.multiplyScalar(height / size.y);

    const bbox2 = new THREE.Box3().setFromObject(obj);
    const center = bbox2.getCenter(new THREE.Vector3());
    obj.position.set(-center.x, -center.y, -center.z);
};

// Set opacity function
const setOpacity = (obj, opacity) => {
    obj.traverse((child) => {
        if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = opacity;
        }
    });
};

// Deep clone function
const deepClone = (obj) => {
    const newObj = obj.clone();
    newObj.traverse((o) => {
        if (o.isMesh) {
            o.material = o.material.clone();
        }
    });
    return newObj;
};

// Main function to initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const initialize = async () => {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);

        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        });
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButton);

        const itemHeights = {
            lamp: 0.3,
            table: 0.2,
            sofa: 0.1,
        };

        const items = [];
        const placedItems = [];
        const models = {};

        // Load model function
        const loadModel = async (itemName, category) => {
            const modelPath = `../assets/models/${category}/${itemName}/scene.gltf`;
            if (!models[itemName]) {
                const model = await loadGLTF(modelPath);
                normalizeModel(model.scene, itemHeights[itemName]);
                models[itemName] = model.scene;
            }
            return models[itemName];
        };

        const categories = [
            { name: "lamp", models: ['lamp1', 'lamp2', 'lamp3'] },
            { name: "sofa", models: ['sofa1', 'sofa2', 'sofa3'] },
            { name: "table", models: ['table1', 'table2', 'table3'] }
        ];

        categories.forEach(category => {
            category.models.forEach(modelName => {
                const item = new THREE.Group();
                item.name = modelName;
                items.push(item);
                scene.add(item);
            });
        });

        let selectedItem = null;
        let lastTouchX = null;
        let lastTouchY = null;
        let lastAngle = null;
        let lastDistance = null;
        let currentInteractedItem = null;

        const raycaster = new THREE.Raycaster();
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        const itemButtons = document.querySelector("#item-buttons");
        const confirmButtons = document.querySelector("#confirm-buttons");
        confirmButtons.style.display = "none"; // Initially hide confirm buttons

        const select = async (selectItem) => {
            const model = await loadModel(selectItem.name, selectItem.category);
            selectItem.add(model);
            items.forEach((item) => {
                item.visible = item === selectItem;
            });
            selectedItem = selectItem;
            confirmButtons.style.display = "block"; // Show confirm buttons after selection
        };

        const cancelSelect = () => {
            confirmButtons.style.display = "none"; // Hide confirm buttons on cancel
            if (selectedItem) {
                selectedItem.visible = false;
            }
            selectedItem = null;
        };

        const placeButton = document.querySelector("#place");
        const cancelButton = document.querySelector("#cancel");

        cancelButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            cancelSelect();
        });

        // Toggle sub-menu when category image is clicked
        $(document).ready(function() {
            $('.menu-btn').on('click', function() {
                // Show item buttons only when the menu button is clicked
                itemButtons.style.display = itemButtons.style.display === "block" ? "none" : "block";
            });

            $('.sub-btn').on('click', function() {
                $(this).next('.sub-menu').slideToggle();
            });
        });

        // Attach click event listeners to model buttons
        const modelButtons = document.querySelectorAll('.sub-item');
        modelButtons.forEach((el) => {
            const category = el.getAttribute('data-folder');
            el.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                await select({ name: el.textContent.trim(), category });
            });
        });

        placeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectedItem) {
                const spawnItem = deepClone(selectedItem);
                setOpacity(spawnItem, 1.0);
                scene.add(spawnItem);
                placedItems.push(spawnItem);
                currentInteractedItem = spawnItem;
                cancelSelect(); // Hide buttons after placing
            }
        });

        // DRAG: Single-Finger Dragging Implementation for preview models only
        document.addEventListener('touchmove', (event) => {
            if (selectedItem && event.touches.length === 1) {
                const touch = event.touches[0];
                if (lastTouchX !== null && lastTouchY !== null) {
                    const movementX = touch.pageX - lastTouchX;
                    const movementY = touch.pageY - lastTouchY;
                    selectedItem.position.x += movementX * 0.001; // Adjust factor for dragging speed
                    selectedItem.position.y -= movementY * 0.001;
                }
                lastTouchX = touch.pageX;
                lastTouchY = touch.pageY;
            }
        });

        // ROTATION: Two-Finger Twist Gesture for preview models only
        document.addEventListener('touchmove', (event) => {
            if (selectedItem && event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];

                const currentAngle = Math.atan2(touch2.pageY - touch1.pageY, touch2.pageX - touch1.pageX);
                if (lastAngle !== null) {
                    const deltaAngle = currentAngle - lastAngle;
                    selectedItem.rotation.y += deltaAngle;
                }
                lastAngle = currentAngle;
            }
        });

        // SCALING: Two-Finger Pinch Gesture for preview models only
        document.addEventListener('touchmove', (event) => {
            if (selectedItem && event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];

                const currentDistance = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
                if (lastDistance !== null) {
                    const scaleFactor = currentDistance / lastDistance;
                    selectedItem.scale.multiplyScalar(scaleFactor);
                }
                lastDistance = currentDistance;
            }
        });

        document.addEventListener('touchend', () => {
            lastTouchX = null;
            lastTouchY = null;
            lastAngle = null;
            lastDistance = null;
        });

        // RAYCASTING to select placed items for interaction after placement
        document.addEventListener('click', (event) => {
            if (!event.isTrusted) return; // Ignore synthetic events

            const mouse = new THREE.Vector2();
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(placedItems, true);
            if (intersects.length > 0) {
                currentInteractedItem = intersects[0].object.parent;

                // Highlight or visually indicate that the item is selected
                setOpacity(currentInteractedItem, 0.5);

                // Now, you can implement interaction behavior like dragging, rotating, or scaling
                // DRAG: Single-Finger Dragging Implementation for placed items
                document.addEventListener('touchmove', (event) => {
                    if (currentInteractedItem && event.touches.length === 1) {
                        const touch = event.touches[0];
                        if (                        lastTouchY !== null) {
                            const movementX = touch.pageX - lastTouchX;
                            const movementY = touch.pageY - lastTouchY;
                            currentInteractedItem.position.x += movementX * 0.001; // Adjust factor for dragging speed
                            currentInteractedItem.position.y -= movementY * 0.001;
                        }
                        lastTouchX = touch.pageX;
                        lastTouchY = touch.pageY;
                    }
                });

                // ROTATION: Two-Finger Twist Gesture for placed items
                document.addEventListener('touchmove', (event) => {
                    if (currentInteractedItem && event.touches.length === 2) {
                        const touch1 = event.touches[0];
                        const touch2 = event.touches[1];

                        const currentAngle = Math.atan2(touch2.pageY - touch1.pageY, touch2.pageX - touch1.pageX);
                        if (lastAngle !== null) {
                            const deltaAngle = currentAngle - lastAngle;
                            currentInteractedItem.rotation.y += deltaAngle;
                        }
                        lastAngle = currentAngle;
                    }
                });

                // SCALING: Two-Finger Pinch Gesture for placed items
                document.addEventListener('touchmove', (event) => {
                    if (currentInteractedItem && event.touches.length === 2) {
                        const touch1 = event.touches[0];
                        const touch2 = event.touches[1];

                        const currentDistance = Math.hypot(touch2.pageX - touch1.pageX, touch2.pageY - touch1.pageY);
                        if (lastDistance !== null) {
                            const scaleFactor = currentDistance / lastDistance;
                            currentInteractedItem.scale.multiplyScalar(scaleFactor);
                        }
                        lastDistance = currentDistance;
                    }
                });

                document.addEventListener('touchend', () => {
                    lastTouchX = null;
                    lastTouchY = null;
                    lastAngle = null;
                    lastDistance = null;
                });
            }
        });

        const animate = () => {
            renderer.setAnimationLoop(() => {
                renderer.render(scene, camera);
            });
        };

        animate();
    };

    initialize();
});

