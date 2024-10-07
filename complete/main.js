import { loadGLTF } from "../libs/loader.js";
import * as THREE from '../libs/three123/three.module.js';
import { ARButton } from '../libs/jsm/ARButton.js';

// Function to normalize model height
const normalizeModel = (obj, height) => {
    const bbox = new THREE.Box3().setFromObject(obj);
    const size = bbox.getSize(new THREE.Vector3());
    obj.scale.multiplyScalar(height / size.y);

    const bbox2 = new THREE.Box3().setFromObject(obj);
    const center = bbox2.getCenter(new THREE.Vector3());
    obj.position.set(-center.x, -center.y, -center.z);
};

// Function to set opacity
const setOpacity = (obj, opacity) => {
    obj.traverse((child) => {
        if (child.isMesh) {
            child.material.transparent = true;
            child.material.opacity = opacity;
        }
    });
};

// Function to deep clone objects
const deepClone = (obj) => {
    const newObj = obj.clone();
    newObj.traverse((o) => {
        if (o.isMesh) {
            o.material = o.material.clone();
        }
    });
    return newObj;
};

// Item categories with their models
const itemCategories = {
    'lamp': [
        { name: 'lamp1', height: 0.3 },
        { name: 'lamp2', height: 0.3 },
        { name: 'lamp3', height: 0.3 }
    ],
    'sofa': [
        { name: 'sofa1', height: 0.1 },
        { name: 'sofa2', height: 0.1 },
        { name: 'sofa3', height: 0.1 }
    ],
    'table': [
        { name: 'table1', height: 0.2 },
        { name: 'table2', height: 0.2 },
        { name: 'table3', height: 0.2 }
    ]
};

document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById('sidebar-menu');
    const menuButton = document.getElementById('menu-button');
    const closeButton = document.getElementById('close-button');
    const confirmButtons = document.getElementById('confirm-buttons');
    let currentInteractedItem = null;
    let scene, camera, renderer;
    const placedItems = [];
    const raycaster = new THREE.Raycaster();
    let touchDown = false;
    let isPinching = false;
    let initialFingerPositions = [];
    
    // Initialize the AR session
    const initialize = async () => {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.xr.enabled = true;
        document.body.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        const light = new THREE.HemisphereLight(0xffffff, 0.5);
        scene.add(light);

        // AR Button
        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body }
        });
        document.body.appendChild(arButton);

        // Setup the rendering loop
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        // Menu button to toggle sidebar
        menuButton.addEventListener('click', () => {
            sidebar.classList.toggle('open'); // Toggle sidebar
            closeButton.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
        });

        // Close button to hide sidebar
        closeButton.addEventListener('click', () => {
            sidebar.classList.remove('open'); // Hide sidebar
            closeButton.style.display = 'none';
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            renderer.setSize(width, height);
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
        });
    };

    // Function to select a model
    const select = async (category, itemInfo) => {
        if (currentInteractedItem) {
            setOpacity(currentInteractedItem, 1.0); // Reset opacity for the previous item
        }

        // Load the model only when selected
        try {
            const model = await loadGLTF(`../assets/models/${category}/${itemInfo.name}/scene.gltf`);
            normalizeModel(model.scene, itemInfo.height);
            currentInteractedItem = new THREE.Group();
            currentInteractedItem.add(model.scene);
            setOpacity(currentInteractedItem, 0.5); // Highlight selected item
            confirmButtons.style.display = 'block'; // Show confirm buttons

            // Add to scene but keep it hidden until confirmed
            currentInteractedItem.visible = false;
            scene.add(currentInteractedItem);
        } catch (error) {
            console.error(`Failed to load model: ${itemInfo.name} from category: ${category}`, error);
        }
    };

    // Event listeners for category images
    for (const category in itemCategories) {
        for (const itemInfo of itemCategories[category]) {
            const existingImage = document.querySelector(`#${category}-${itemInfo.name}`);
            if (existingImage) {
                existingImage.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    select(category, itemInfo); // Call select with category and item info
                });
            }
        }
    }

    // Handle model placement
    document.getElementById('place-button').addEventListener('click', () => {
        if (currentInteractedItem) {
            const spawnItem = deepClone(currentInteractedItem);
            setOpacity(spawnItem, 1.0);
            spawnItem.visible = true; // Make it visible when placed
            scene.add(spawnItem);
            placedItems.push(spawnItem);
            console.log("Model placed:", spawnItem);
            currentInteractedItem = null; // Reset selection
            confirmButtons.style.display = 'none'; // Hide confirm buttons
        }
    });

    document.getElementById('cancel-button').addEventListener('click', () => {
        if (currentInteractedItem) {
            currentInteractedItem = null; // Reset selection
            console.log("Placement canceled");
            confirmButtons.style.display = 'none'; // Hide confirm buttons
        }
    });

    // Touch event listeners for interaction
    const controller = renderer.xr.getController(0); // Assuming using controller 0 for touch events
    controller.addEventListener('selectstart', () => {
        touchDown = true;
        const tempMatrix = new THREE.Matrix4();
        tempMatrix.identity().extractRotation(controller.matrixWorld);
        raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
        raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
        const intersects = raycaster.intersectObjects(placedItems);

        if (intersects.length > 0) {
            currentInteractedItem = intersects[0].object; // Select the touched object
            confirmButtons.style.display = 'block'; // Show confirm buttons
        }
    });

    controller.addEventListener('selectend', () => {
        touchDown = false; // Reset touch state
        currentInteractedItem = null; // Deselect the item
        confirmButtons.style.display = 'none'; // Hide confirm buttons
    });

    // Pinching for scaling
    let isPinching = false;
    let initialFingerPositions = [];
    
    // Add listener for controller events
    renderer.xr.addEventListener("sessionstart", async () => {
        const session = renderer.xr.getSession();
        const viewerReferenceSpace = await session.requestReferenceSpace("viewer");
        const hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });

        // Handle the rendering loop for AR
        renderer.setAnimationLoop((timestamp, frame) => {
            if (frame) {
                const referenceSpace = renderer.xr.getReferenceSpace();
                const hitTestResults = frame.getHitTestResults(hitTestSource);

                if (currentInteractedItem && hitTestResults.length > 0) {
                    const hit = hitTestResults[0];
                    const position = new THREE.Vector3().setFromMatrixPosition(hit.getPose(referenceSpace).transform.matrix);
                    currentInteractedItem.position.copy(position);
                }

                // Pinching to scale
                if (isPinching && currentInteractedItem) {
                    const sessionSources = renderer.xr.getSession().inputSources;

                    if (sessionSources.length === 2) {
                        const newFingerPositions = [
                            new THREE.Vector3(sessionSources[0].gamepad.axes[0], sessionSources[0].gamepad.axes[1], 0),
                            new THREE.Vector3(sessionSources[1].gamepad.axes[0], sessionSources[1].gamepad.axes[1], 0)
                        ];

                        const distance = newFingerPositions[0].distanceTo(newFingerPositions[1]);
                        const initialDistance = initialFingerPositions[0].distanceTo(initialFingerPositions[1]);
                        const scale = distance / initialDistance;

                        currentInteractedItem.scale.set(scale, scale, scale); // Scale the object
                    }
                }
            }

            renderer.render(scene, camera);
        });
    });

    // Start the AR session
    initialize();
});
