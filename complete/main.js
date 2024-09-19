import { loadGLTF } from "../libs/loader.js";
import * as THREE from '../libs/three123/three.module.js';
import { ARButton } from '../libs/jsm/ARButton.js';

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

        const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: document.body } });
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButton);

        // Define categories and models
        const categories = {
            'Chair': ['Chair1', 'Chair2'], // Replace with actual model names
            'light': ['Light1', 'Light2'],
            'plant': ['Plant1', 'Plant2'],
            'rug': ['Rug1', 'Rug2']
        };

        const itemHeights = {
            'Chair': 0.3,
            'light': 0.3,
            'plant': 0.3,
            'rug': 0.3
        };

        const items = {}; // Object to hold category groups
        const placedItems = [];
        const models = {};

        const loadModel = async (category, modelName) => {
            if (!models[category]) {
                models[category] = {};
            }

            if (!models[category][modelName]) {
                const model = await loadGLTF(`../assets/models/${category}/${modelName}/scene.gltf`);
                normalizeModel(model.scene, itemHeights[category]);
                models[category][modelName] = model.scene;
            }
            return models[category][modelName];
        };

        // Create category groups in scene
        for (const [category, modelNames] of Object.entries(categories)) {
            const group = new THREE.Group();
            group.name = category;
            items[category] = group;
            scene.add(group);
        }

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
        const subMenu = document.querySelector("#sub-menu");
        const confirmButtons = document.querySelector("#confirm-buttons");
        itemButtons.style.display = "block";
        confirmButtons.style.display = "none";

        const showSubMenu = (category) => {
            subMenu.innerHTML = ''; // Clear existing items
            const modelNames = categories[category];
            modelNames.forEach((modelName) => {
                const img = document.createElement('img');
                img.className = 'sub-item';
                img.src = `../assets/models/${category}/${modelName}/thumbnail.png`; // Update path as needed
                img.alt = modelName;
                img.addEventListener('click', async () => {
                    await select(category, modelName);
                });
                subMenu.appendChild(img);
            });
            subMenu.style.display = 'block';
        };

        const select = async (category, modelName) => {
            const group = items[category];
            if (!group.children.length || !group.children.find(child => child.name === modelName)) {
                const model = await loadModel(category, modelName);
                const modelInstance = model.clone();
                group.add(modelInstance);
            }
            for (const cat in items) {
                items[cat].visible = cat === category;
            }
            selectedItem = items[category].children.find(child => child.name === modelName);
            itemButtons.style.display = "none";
            confirmButtons.style.display = "block";
            subMenu.style.display = "none";
        };

        const cancelSelect = () => {
            itemButtons.style.display = "block";
            confirmButtons.style.display = "none";
            subMenu.style.display = "none";
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

        Object.keys(categories).forEach((category, i) => {
            const el = document.querySelector(`#item${i}`);
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                showSubMenu(category);
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
                cancelSelect();
            }
        });

        // DRAG: Single-Finger Dragging Implementation
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

        // ROTATION: Two-Finger Twist Gesture
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

        // SCALING: Two-Finger Pinch Gesture
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

        const animate = () => {
            renderer.setAnimationLoop(animate);
            renderer.render(scene, camera);
        };

        animate();
    };

    initialize();
});
