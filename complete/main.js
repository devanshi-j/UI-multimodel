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

        // Submenu toggle logic
        const icons = document.querySelectorAll(".icon");
        icons.forEach((icon) => {
            icon.addEventListener("click", (event) => {
                const submenu = icon.querySelector(".submenu");
                submenu.classList.toggle("open");
                event.stopPropagation();
            });
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
            if (selectedItem) {
                selectedItem.visible = false;
                selectedItem = null;
            }

            // Hide buttons
            placeButton.style.display = "none";
            cancelButton.style.display = "none";
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

        // Raycasting for interactions
        const raycaster = new THREE.Raycaster();
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        controller.addEventListener("selectstart", () => {
            const tempMatrix = new THREE.Matrix4();
            tempMatrix.identity().extractRotation(controller.matrixWorld);

            raycaster.ray.origin.setFromMatrixPosition(controller.matrixWorld);
            raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

            const intersects = raycaster.intersectObjects(placedItems, true);

            if (intersects.length > 0) {
                const selectedObject = intersects[0].object.parent;
                console.log("Interacted with:", selectedObject);
            }
        });

        // Render loop
        renderer.setAnimationLoop(() => {
            renderer.render(scene, camera);
        });

        // Handle resizing
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
