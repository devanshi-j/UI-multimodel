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
        document.body.appendChild(arButton);
        document.body.appendChild(renderer.domElement);

        const categories = {
            'lamp': ['lamp1', 'lamp2', 'lamp3'],
            'table': ['table1', 'table2', 'table3'],
            'sofa': ['sofa1', 'sofa2', 'sofa3']
        };

        const itemHeights = {
            'lamp': 0.4,
            'table': 0.1,
            'sofa': 0.1
        };

        const items = {};
        const placedItems = [];
        const models = {};

        const loadModel = async (category, modelName) => {
            try {
                if (!models[category]) models[category] = {};

                if (!models[category][modelName]) {
                    const model = await loadGLTF(`../assets/models/${category}/${modelName}/scene.gltf`);
                    normalizeModel(model.scene, itemHeights[category]);
                    models[category][modelName] = model.scene;
                }
                return models[category][modelName];
            } catch (error) {
                console.error(`Error loading model ${modelName} from category ${category}:`, error);
            }
        };

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
        const placeButton = document.querySelector("#place-button");
        const cancelButton = document.querySelector("#cancel-button");

        const menuItems = document.querySelectorAll(".button-image");
        menuItems.forEach((button) => {
            button.addEventListener("click", async (event) => {
                const category = event.target.dataset.category;
                const modelName = event.target.dataset.model;

                const model = await loadModel(category, modelName);
                selectedItem = deepClone(model);
                setOpacity(selectedItem, 0.5);

                scene.add(selectedItem);
            });
        });

        placeButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (selectedItem) {
                const spawnItem = deepClone(selectedItem);
                setOpacity(spawnItem, 1.0);  // Ensure full opacity upon placement
                scene.add(spawnItem);
                placedItems.push(spawnItem);
                currentInteractedItem = spawnItem;
                cancelSelect();
            }
        });

        document.addEventListener('touchmove', (event) => {
            if (selectedItem && event.touches.length === 1) {
                const touch = event.touches[0];
                if (lastTouchX !== null && lastTouchY !== null) {
                    const movementX = touch.pageX - lastTouchX;
                    const movementY = touch.pageY - lastTouchY;
                    selectedItem.position.x += movementX * 0.001;
                    selectedItem.position.y -= movementY * 0.001;
                }
                lastTouchX = touch.pageX;
                lastTouchY = touch.pageY;
            }
        });

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

        document.querySelector("#place-button").style.display = "block";
        document.querySelector("#cancel-button").style.display = "block";


        const cancelSelect = () => {
            if (selectedItem) {
                scene.remove(selectedItem);
                selectedItem = null;
                lastTouchX = null;
                lastTouchY = null;
                lastAngle = null;
                lastDistance = null;
            }
        };

        const animate = () => {
            renderer.setAnimationLoop(render);
        };

        const render = (timestamp, frame) => {
            renderer.render(scene, camera);
        };

        animate();
    };

    initialize();
});
