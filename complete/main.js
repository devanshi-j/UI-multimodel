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

// Initialization function for the AR experience
const initializeAR = () => {
    // Initialize the AR experience button
    const arButtonContainer = document.createElement("div");
    arButtonContainer.style.position = "absolute";
    arButtonContainer.style.top = "50%";
    arButtonContainer.style.left = "50%";
    arButtonContainer.style.transform = "translate(-50%, -50%)";

    const arButton = ARButton.createButton(renderer, {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay"],
    });

    arButtonContainer.appendChild(arButton);
    document.body.appendChild(arButtonContainer);

    // UI setup
    const menuButton = document.getElementById("menu-button") || document.createElement('button');
    const closeButton = document.getElementById("close-button") || document.createElement('button');
    const sidebarMenu = document.getElementById("sidebar-menu") || document.createElement('div');
    const confirmButtons = document.getElementById("confirm-buttons") || document.createElement('div');
    
    // Hide UI elements initially
    menuButton.style.display = "none";
    closeButton.style.display = "none";
    sidebarMenu.style.display = "none";
    confirmButtons.style.display = "none";

    // Add event listeners to toggle the sidebar
    menuButton.addEventListener('click', () => {
        sidebarMenu.style.display = 'block';
        closeButton.style.display = 'block';
        menuButton.style.display = 'none';
    });

    closeButton.addEventListener('click', () => {
        sidebarMenu.style.display = 'none';
        closeButton.style.display = 'none';
        menuButton.style.display = 'block';
    });

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

    const onTouchStart = (event) => {
        // Handle touch start for AR interactions
        const touch = event.touches[0];
        touches.set(touch.pageX, touch.pageY);
    };

    const onTouchMove = (event) => {
        // Handle touch move for AR interactions
        const touch = event.touches[0];
        touches.set(touch.pageX, touch.pageY);
    };

    const onTouchEnd = () => {
        // Handle touch end for AR interactions
        touches.set(0, 0);
    };

    window.addEventListener("touchstart", onTouchStart, false);
    window.addEventListener("touchmove", onTouchMove, false);
    window.addEventListener("touchend", onTouchEnd, false);

    // Function to load model based on category
    const loadModel = (modelName, category) => {
        loadGLTF(`/models/${category}/${modelName}.glb`).then((gltf) => {
            const model = gltf.scene;
            normalizeModel(model, 0.3); // Adjust height
            loadedModels.set(modelName, model);
        });
    };

    // Load models for all categories
    Object.keys(itemCategories).forEach((category) => {
        itemCategories[category].forEach((item) => {
            loadModel(item.name, category);
        });
    });

    // Handle hit test for AR
    const onHitTest = () => {
        if (hitTestSourceRequested) {
            hitTestSourceRequested = false;

            const results = renderer.xr.getHitTestResults(hitTestSource);

            if (results.length > 0) {
                const hit = results[0];
                reticle.visible = true;

                const position = hit.getPose(controller.matrixWorld).position;
                reticle.position.set(position.x, position.y, position.z);
            } else {
                reticle.visible = false;
            }
        }
    };

    // AR button activation when the user starts AR
    arButton.addEventListener("click", () => {
        // Once AR is started, show the AR environment
        renderer.domElement.style.display = 'block';
        arButton.style.display = 'none'; // Hide the AR button after activation
    });

    // Enable hit testing
    const enableHitTest = (xrReferenceSpace) => {
        navigator.xr.requestHitTestSource({ space: xrReferenceSpace }).then((source) => {
            hitTestSource = source;
        });
    };

    // AR session start
    const onSessionStart = (session) => {
        session.addEventListener("end", onSessionEnd);
        renderer.xr.setSession(session);
        enableHitTest(session.referenceSpace);
    };

    // AR session end
    const onSessionEnd = () => {
        renderer.domElement.style.display = 'none';
    };

    // Update touch position and initiate hit test when AR session is active
    const onTouchUpdate = (event) => {
        const touch = event.touches[0];
        const touchPosition = new THREE.Vector2(touch.pageX, touch.pageY);
        raycaster.update(touchPosition);
    };

    // Animate and render the AR scene
    const animate = () => {
        renderer.setAnimationLoop(() => {
            onHitTest();
            renderer.render(scene, camera);
        });
    };

    animate();
};

// Run the initializeAR function when the document is ready
document.addEventListener("DOMContentLoaded", initializeAR);
