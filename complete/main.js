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
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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

        const models = {};  // Store preloaded models

        const loadModel = async (category, modelName) => {
            try {
                const modelPath = `../assets/models/${category}/${modelName}/scene.gltf`;
                const model = await loadGLTF(modelPath);
                normalizeModel(model.scene, itemHeights[category]);
                return model.scene;
            } catch (error) {
                console.error(`Error loading model ${modelName} from category ${category}:`, error);
            }
        };

        const preloadModels = async () => {
            for (const [category, modelNames] of Object.entries(categories)) {
                models[category] = {};
                for (const modelName of modelNames) {
                    const model = await loadModel(category, modelName);
                    if (model) models[category][modelName] = model;
                }
            }
            console.log("All models preloaded.");
        };

        await preloadModels();

        let selectedItem = null;
        let lastTouchX = null;
        let lastTouchY = null;
        let lastAngle = null;
        let lastDistance = null;

        const menuItems = document.querySelectorAll(".button-image");
        menuItems.forEach((button) => {
            button.addEventListener("click", (event) => {
                const category = event.target.dataset.category;
                const modelName = event.target.dataset.model;

                const model = models[category][modelName];
                if (model) {
                    selectedItem = deepClone(model);  // Clone from preloaded models
                    setOpacity(selectedItem, 0.5);  // Set transparency for preview
                    scene.add(selectedItem);  // Add selected item to scene
                }
            });
        });

        const placeButton = document.querySelector("#place-button");
        placeButton.addEventListener('click', () => {
            if (selectedItem) {
                const placedItem = deepClone(selectedItem);  // Clone before placing
                setOpacity(placedItem, 1.0);  // Set full opacity for placed object
                scene.add(placedItem);
                selectedItem = null;  // Reset selected item after placement
            }
        });

        const cancelButton = document.querySelector("#cancel-button");
        cancelButton.addEventListener('click', () => {
            if (selectedItem) {
                scene.remove(selectedItem);  // Remove the selected item
                selectedItem = null;
                lastTouchX = null;
                lastTouchY = null;
                lastAngle = null;
                lastDistance = null;
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

        const animate = () => {
            renderer.setAnimationLoop(() => {
                renderer.render(scene, camera);
            });
        };

        animate();
    };

    initialize();
});
