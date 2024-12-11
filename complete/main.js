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

        // Add lighting
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        scene.add(light);

        // Add AR Button
        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body },
        });
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(arButton);

        // Sidebar toggle logic
        const menuButton = document.getElementById("menu-button");
        const closeButton = document.getElementById("close-button");
        const sidebarMenu = document.getElementById("sidebar-menu");

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

        // Load models
        const placedItems = [];
        let selectedItem = null;

        for (const category in itemCategories) {
            for (const itemInfo of itemCategories[category]) {
                const model = await loadGLTF(`../assets/models/${category}/${itemInfo.name}/scene.gltf`);
                normalizeModel(model.scene, itemInfo.height);

                const item = new THREE.Group();
                item.add(model.scene);
                item.visible = false;
                setOpacity(item, 0.5);
                scene.add(item);

                // Add event listener for the thumbnail
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

        // Show and place item logic
        const placeButton = document.querySelector("#place");
        const cancelButton = document.querySelector("#cancel");

        const showModel = (item) => {
            selectedItem = item;
            selectedItem.visible = true;
            setOpacity(selectedItem, 0.5);

            // Show buttons
            placeButton.style.display = "block";
            cancelButton.style.display = "block";
        };

        const placeModel = () => {
            if (selectedItem) {
                const clone = deepClone(selectedItem);
                setOpacity(clone, 1.0);
                scene.add(clone);
                placedItems.push(clone);
                cancelModel();
            }
        };

        const cancelModel = () => {
            placeButton.style.display = "none";
            cancelButton.style.display = "none";

            if (selectedItem) {
                selectedItem.visible = false;
                selectedItem = null;
            }
        };

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

        // Raycasting for selection and interactions
        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        let isDragging = false;
        let lastTouchDistance = null;
        let rotationStart = null;

        controller.addEventListener("selectstart", () => {
            const tempMatrix = new THREE.Matrix4();
            tempMatrix.identity().extractRotation(controller.matrixWorld);

            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const intersects = raycaster.intersectObjects(placedItems, true);

            if (intersects.length > 0) {
                selectedItem = intersects[0].object.parent;
                console.log("Selected item:", selectedItem);
            }
        });

        const handlePointerMove = (event) => {
            if (!selectedItem) return;

            const touch = event.touches[0];
            pointer.x = (touch.clientX / window.innerWidth) * 2 - 1;
            pointer.y = -(touch.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(pointer, camera);

            const intersects = raycaster.intersectObjects(placedItems, true);
            if (intersects.length > 0) {
                const intersect = intersects[0];
                selectedItem.position.copy(intersect.point);
                isDragging = true;
            }
        };

        const handlePinch = (event) => {
            if (event.touches.length === 2 && selectedItem) {
                const dx = event.touches[0].clientX - event.touches[1].clientX;
                const dy = event.touches[0].clientY - event.touches[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (lastTouchDistance) {
                    const scaleFactor = distance / lastTouchDistance;
                    selectedItem.scale.multiplyScalar(scaleFactor);
                }

                lastTouchDistance = distance;
            }
        };

        const handleRotation = (event) => {
            if (event.touches.length === 2 && selectedItem) {
                const dx = event.touches[0].clientX - event.touches[1].clientX;
                const dy = event.touches[0].clientY - event.touches[1].clientY;
                const angle = Math.atan2(dy, dx);

                if (rotationStart !== null) {
                    const deltaAngle = angle - rotationStart;
                    selectedItem.rotation.y += deltaAngle;
                }

                rotationStart = angle;
            }
        };

        document.addEventListener("touchmove", (event) => {
            if (event.touches.length === 1) handlePointerMove(event);
            else if (event.touches.length === 2) {
                handlePinch(event);
                handleRotation(event);
            }
        });

        document.addEventListener("touchend", () => {
         isDragging = false;
            lastTouchDistance = null;
            rotationStart = null;
        });

        // Render loop
        const animate = () => {
            renderer.setAnimationLoop(() => {
                renderer.render(scene, camera);
            });
        };

        animate();

        // Handle window resizing
        window.addEventListener("resize", () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        });
    };

    initialize();
});
