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

// Item categories configuration
const itemCategories = {
    lamp: [
        { name: "lamp1", height: 0.3 },
        { name: "lamp2", height: 0.35 },
        { name: "lamp3", height: 0.28 },
    ],
    sofa: [
        { name: "sofa1", height: 0.1 },
        { name: "sofa2", height: 0.12 },
        { name: "sofa3", height: 0.15 },
    ],
    table: [
        { name: "table1", height: 0.2 },
        { name: "table2", height: 0.25 },
        { name: "table3", height: 0.22 },
    ],
};

document.addEventListener("DOMContentLoaded", () => {
    const initialize = async () => {
        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        document.body.appendChild(renderer.domElement);

        // Lights
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        scene.add(light);
        scene.add(directionalLight);

        // Initialize AR
        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body },
        });
        document.body.appendChild(arButton);

        // Touch interaction variables
        const raycaster = new THREE.Raycaster();
        const touches = new THREE.Vector2();
        let selectedObject = null;
        let isDragging = false;
        let isRotating = false;
        let isPinching = false;
        let initialPinchDistance = 0;
        let initialScale = 1;
        let previousTouchX = 0;
        let previousTouchY = 0;
        let lastPinchScale = 1;

        // Controller setup
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        // Reticle setup
        const reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        reticle.visible = false;
        reticle.matrixAutoUpdate = false;
        scene.add(reticle);

        // Touch event handlers
        const onTouchStart = (event) => {
            event.preventDefault();

            if (event.touches.length === 1) {
                touches.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
                touches.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(touches, camera);
                const intersects = raycaster.intersectObjects(placedItems, true);

                if (intersects.length > 0) {
                    selectedObject = intersects[0].object.parent;
                    isRotating = true;
                    previousTouchX = event.touches[0].pageX;
                }
            } else if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];

                const midX = (touch1.pageX + touch2.pageX) / 2;
                const midY = (touch1.pageY + touch2.pageY) / 2;

                touches.x = (midX / window.innerWidth) * 2 - 1;
                touches.y = -(midY / window.innerHeight) * 2 + 1;

                raycaster.setFromCamera(touches, camera);
                const intersects = raycaster.intersectObjects(placedItems, true);

                if (intersects.length > 0) {
                    selectedObject = intersects[0].object.parent;

                    const dx = touch1.pageX - touch2.pageX;
                    const dy = touch1.pageY - touch2.pageY;
                    initialPinchDistance = Math.sqrt(dx * dx + dy * dy);

                    isPinching = true;
                    isDragging = true;
                    initialScale = selectedObject.scale.x;
                    previousTouchX = midX;
                    previousTouchY = midY;
                    lastPinchScale = 1;
                }
            }
        };

        const onTouchMove = (event) => {
            event.preventDefault();

            if (isRotating && event.touches.length === 1) {
                const deltaX = event.touches[0].pageX - previousTouchX;
                selectedObject.rotation.y += deltaX * 0.01;
                previousTouchX = event.touches[0].pageX;
            } else if (event.touches.length === 2 && selectedObject) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];

                if (isPinching) {
                    const dx = touch1.pageX - touch2.pageX;
                    const dy = touch1.pageY - touch2.pageY;
                    const pinchDistance = Math.sqrt(dx * dx + dy * dy);
                    const newScale = (pinchDistance / initialPinchDistance) * initialScale;
                    const scaleDelta = newScale / lastPinchScale;

                    const minScale = 0.5;
                    const maxScale = 2.0;
                    const currentScale = selectedObject.scale.x * scaleDelta;

                    if (currentScale >= minScale && currentScale <= maxScale) {
                        selectedObject.scale.multiplyScalar(scaleDelta);
                        lastPinchScale = newScale;
                    }
                }

                if (isDragging) {
                    const midX = (touch1.pageX + touch2.pageX) / 2;
                    const midY = (touch1.pageY + touch2.pageY) / 2;

                    const deltaX = (midX - previousTouchX) * 0.005;
                    const deltaZ = (midY - previousTouchY) * 0.005;

                    const cameraDirection = new THREE.Vector3();
                    camera.getWorldDirection(cameraDirection);
                    const cameraRight = new THREE.Vector3(1, 0, 0);
                    cameraRight.applyQuaternion(camera.quaternion);

                    selectedObject.position.add(cameraRight.multiplyScalar(deltaX));
                    selectedObject.position.add(cameraDirection.multiplyScalar(-deltaZ));

                    previousTouchX = midX;
                    previousTouchY = midY;
                }
            }
        };

        const onTouchEnd = (event) => {
            if (event.touches.length === 0) {
                isRotating = false;
                isPinching = false;
                isDragging = false;
                selectedObject = null;
                lastPinchScale = 1;
            }
        };

        // Add touch event listeners
        renderer.domElement.addEventListener("touchstart", onTouchStart, false);
        renderer.domElement.addEventListener("touchmove", onTouchMove, false);
        renderer.domElement.addEventListener("touchend", onTouchEnd, false);

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

        // Menu event handlers
        document.addEventListener("click", (event) => {
            const isClickInsideMenu = sidebarMenu?.contains(event.target);
            const isClickOnMenuButton = menuButton?.contains(event.target);
            const isMenuOpen = sidebarMenu?.classList.contains("open");

            if (!isClickInsideMenu && !isClickOnMenuButton && isMenuOpen) {
                sidebarMenu.classList.remove("open");
                menuButton.style.display = "block";
                closeButton.style.display = "none";
            }
        });

        menuButton.addEventListener("click", () => {
            sidebarMenu.classList.toggle("open");
            menuButton.style.display = "none";
            closeButton.style.display = "block";
        });

        closeButton.addEventListener("click", () => {
            sidebarMenu.classList.remove("open");
            menuButton.style.display = "block";
            closeButton.style.display = "none";
        });

        // Handling Model Placement
        const showModel = (model) => {
            if (previewItem) scene.remove(previewItem);
            previewItem = model.clone();
            setOpacity(previewItem, 0.5);
            scene.add(previewItem);
            confirmButtons.style.display = "block";
        };

        const placeModel = () => {
            if (previewItem) {
                setOpacity(previewItem, 1);
                const clone = deepClone(previewItem);
                clone.position.copy(previewItem.position);
                clone.rotation.copy(previewItem.rotation);
                clone.scale.copy(previewItem.scale);
                scene.add(clone);
                placedItems.push(clone);
                confirmButtons.style.display = "none";
                previewItem = null;
            }
        };

        const cancelPlacement = () => {
            if (previewItem) {
                scene.remove(previewItem);
                previewItem = null;
            }
            confirmButtons.style.display = "none";
        };

        placeButton.addEventListener("click", placeModel);
        cancelButton.addEventListener("click", cancelPlacement);

        // Loading models based on category
        const loadModel = async (category, modelName, height) => {
            if (!loadedModels.has(modelName)) {
                const model = await loadGLTF(`models/${category}/${modelName}.gltf`);
                normalizeModel(model.scene, height);
                loadedModels.set(modelName, model.scene);
            }
            showModel(loadedModels.get(modelName));
        };

        const modelSelectors = document.querySelectorAll(".model-selector");
        modelSelectors.forEach((selector) => {
            const category = selector.dataset.category;
            const modelName = selector.dataset.model;
            const height = parseFloat(selector.dataset.height);

            selector.addEventListener("click", () => {
                loadModel(category, modelName, height);
            });
        });

        // Animation loop
        const animate = () => {
            renderer.setAnimationLoop(() => {
                if (renderer.xr.isPresenting) {
                    const session = renderer.xr.getSession();
                    if (session) {
                        session.requestAnimationFrame(onXRFrame);
                    }
                }

                renderer.render(scene, camera);
            });
        };

        const onXRFrame = (time, frame) => {
            const session = renderer.xr.getSession();
            if (hitTestSource && frame) {
                const viewerSpace = session.requestReferenceSpace("viewer");
                const hitTestResults = frame.getHitTestResults(hitTestSource);

                if (hitTestResults.length > 0) {
                    const hit = hitTestResults[0];
                    const pose = hit.getPose(viewerSpace);

                    reticle.visible = true;
                    reticle.matrix.fromArray(pose.transform.matrix);
                } else {
                    reticle.visible = false;
                }
            }
        };

        // Start animation
        animate();
    };

    initialize();
});
