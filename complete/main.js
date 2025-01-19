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

document.addEventListener("DOMContentLoaded", () => {
    // Create and append menu elements
    const createMenu = () => {
        const menu = document.createElement('div');
        menu.id = 'menu';
        menu.style.position = 'fixed';
        menu.style.top = '20px';
        menu.style.left = '20px';
        menu.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
        menu.style.padding = '10px';
        menu.style.borderRadius = '10px';
        menu.style.zIndex = '1000';

        const menuButton = document.createElement('button');
        menuButton.textContent = 'Menu';
        menuButton.style.marginBottom = '10px';
        menu.appendChild(menuButton);

        const categoryList = document.createElement('div');
        categoryList.id = 'categoryList';
        categoryList.style.display = 'none';
        
        Object.keys(itemCategories).forEach(category => {
            const categoryButton = document.createElement('button');
            categoryButton.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryButton.style.display = 'block';
            categoryButton.style.margin = '5px 0';
            categoryButton.dataset.category = category;
            categoryList.appendChild(categoryButton);
        });

        menu.appendChild(categoryList);
        document.body.appendChild(menu);

        return { menu, menuButton, categoryList };
    };

    const initialize = async () => {
        // Scene and AR setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;

        const arButton = ARButton.createButton(renderer, {
            requiredFeatures: ["hit-test"],
            optionalFeatures: ["dom-overlay"],
            domOverlay: { root: document.body }
        });
        document.body.appendChild(arButton);
        document.body.appendChild(renderer.domElement);

        // Lighting setup
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        scene.add(light);
        scene.add(directionalLight);

        // Interaction state
        const interactionState = {
            selectedObject: null,
            mode: null,
            initialTouchDistance: 0,
            initialScale: new THREE.Vector3(),
            previousTouchX: 0,
            initialPosition: new THREE.Vector3(),
            touchStart: new THREE.Vector2(),
            touchCount: 0
        };

        // Create menu and handle interactions
        const { menu, menuButton, categoryList } = createMenu();
        let currentModel = null;
        const placedItems = [];
        const loadedModels = {};

        // Menu toggle
        menuButton.addEventListener('click', () => {
            categoryList.style.display = categoryList.style.display === 'none' ? 'block' : 'none';
        });

        // Category selection
        categoryList.addEventListener('click', async (event) => {
            if (event.target.dataset.category) {
                const category = event.target.dataset.category;
                
                // Load models if not already loaded
                if (!loadedModels[category]) {
                    loadedModels[category] = await Promise.all(
                        itemCategories[category].map(async (item) => {
                            const model = await loadGLTF(`../assets/models/${category}/${itemInfo.name}/scene.gltf`);
                            normalizeModel(model.scene, item.height);
                            return { model: model.scene, height: item.height };
                        })
                    );
                }

                // Create and show preview of first model in category
                if (currentModel) {
                    scene.remove(currentModel);
                }
                currentModel = deepClone(loadedModels[category][0].model);
                setOpacity(currentModel, 0.5);
                scene.add(currentModel);
                
                categoryList.style.display = 'none';
            }
        });

        // Raycaster setup
        const raycaster = new THREE.Raycaster();
        const touch = new THREE.Vector2();

        // Controller and reticle setup
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        const reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        reticle.visible = false;
        reticle.matrixAutoUpdate = false;
        scene.add(reticle);

        // Touch handlers
        const onTouchStart = (event) => {
            event.preventDefault();
            
            interactionState.touchCount = event.touches.length;
            
            if (event.touches.length === 1) {
                touch.x = (event.touches[0].pageX / window.innerWidth) * 2 - 1;
                touch.y = -(event.touches[0].pageY / window.innerHeight) * 2 + 1;
                
                raycaster.setFromCamera(touch, camera);
                const intersects = raycaster.intersectObjects(placedItems, true);
                
                if (intersects.length > 0) {
                    interactionState.selectedObject = intersects[0].object.parent;
                    interactionState.mode = 'rotating';
                    interactionState.previousTouchX = event.touches[0].pageX;
                }
            } else if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                const midX = (touch1.pageX + touch2.pageX) / 2;
                const midY = (touch1.pageY + touch2.pageY) / 2;
                
                touch.x = (midX / window.innerWidth) * 2 - 1;
                touch.y = -(midY / window.innerHeight) * 2 + 1;
                
                raycaster.setFromCamera(touch, camera);
                const intersects = raycaster.intersectObjects(placedItems, true);
                
                if (intersects.length > 0) {
                    interactionState.selectedObject = intersects[0].object.parent;
                    interactionState.initialTouchDistance = Math.hypot(
                        touch2.pageX - touch1.pageX,
                        touch2.pageY - touch1.pageY
                    );
                    interactionState.initialScale.copy(interactionState.selectedObject.scale);
                    interactionState.initialPosition.copy(interactionState.selectedObject.position);
                    interactionState.touchStart.set(midX, midY);
                    
                    const touchAngle = Math.abs(Math.atan2(
                        touch2.pageY - touch1.pageY,
                        touch2.pageX - touch1.pageX
                    ));
                    
                    interactionState.mode = touchAngle > Math.PI / 4 && 
                                          touchAngle < (3 * Math.PI) / 4 ? 'scaling' : 'dragging';
                }
            }
        };

        const onTouchMove = (event) => {
            event.preventDefault();
            
            if (!interactionState.selectedObject) return;

            if (interactionState.mode === 'rotating' && event.touches.length === 1) {
                const deltaX = event.touches[0].pageX - interactionState.previousTouchX;
                interactionState.selectedObject.rotation.y += deltaX * 0.02;
                interactionState.previousTouchX = event.touches[0].pageX;
            } else if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                if (interactionState.mode === 'scaling') {
                    const currentDistance = Math.hypot(
                        touch2.pageX - touch1.pageX,
                        touch2.pageY - touch1.pageY
                    );
                    const scale = currentDistance / interactionState.initialTouchDistance;
                    interactionState.selectedObject.scale.copy(interactionState.initialScale);
                    interactionState.selectedObject.scale.multiplyScalar(scale);
                } else if (interactionState.mode === 'dragging') {
                    const midX = (touch1.pageX + touch2.pageX) / 2;
                    const midY = (touch1.pageY + touch2.pageY) / 2;
                    
                    const deltaX = (midX - interactionState.touchStart.x) * 0.01;
                    const deltaZ = (midY - interactionState.touchStart.y) * 0.01;
                    
                    const cameraDirection = new THREE.Vector3();
                    camera.getWorldDirection(cameraDirection);
                    const right = new THREE.Vector3().crossVectors(cameraDirection, camera.up).normalize();
                    
                    interactionState.selectedObject.position.copy(interactionState.initialPosition);
                    interactionState.selectedObject.position.add(right.multiplyScalar(deltaX));
                    interactionState.selectedObject.position.add(new THREE.Vector3(0, 0, deltaZ));
                }
            }
        };

        const onTouchEnd = (event) => {
            if (event.touches.length === 0) {
                if (interactionState.mode === 'dragging') {
                    interactionState.initialPosition.copy(interactionState.selectedObject.position);
                }
                interactionState.mode = null;
                interactionState.selectedObject = null;
            }
            interactionState.touchCount = event.touches.length;
        };

        // Add touch event listeners
        renderer.domElement.addEventListener('touchstart', onTouchStart, false);
        renderer.domElement.addEventListener('touchmove', onTouchMove, false);
        renderer.domElement.addEventListener('touchend', onTouchEnd, false);

        // XR Session and hit-test setup
        let hitTestSource = null;
        let hitTestSourceRequested = false;

        renderer.xr.addEventListener("sessionstart", async () => {
            const session = renderer.xr.getSession();
            
            const viewerReferenceSpace = await session.requestReferenceSpace("viewer");
            hitTestSource = await session.requestHitTestSource({ space: viewerReferenceSpace });

            session.addEventListener("select", () => {
                if (currentModel && reticle.visible) {
                    const placedModel = deepClone(currentModel);
                    setOpacity(placedModel, 1);
                    placedModel.position.setFromMatrixPosition(reticle.matrix);
                    scene.add(placedModel);
                    placedItems.push(placedModel);
                }
            });
        });

        renderer.xr.addEventListener("sessionend", () => {
            hitTestSourceRequested = false;
            hitTestSource = null;
        });

        // Animation loop
        const render = (timestamp, frame) => {
            if (frame) {
                if (!hitTestSourceRequested) {
                    hitTestSourceRequested = true;
                }
                
                if (hitTestSource) {
                    const hitTestResults = frame.getHitTestResults(hitTestSource);
                    
                    if (hitTestResults.length > 0) {
                        const hit = hitTestResults[0];
                        reticle.visible = true;
                        reticle.matrix.fromArray(hit.getPose(renderer.xr.getReferenceSpace()).transform.matrix);
                        
                        if (currentModel) {
                            currentModel.position.setFromMatrixPosition(reticle.matrix);
                        }
                    } else {
                        reticle.visible = false;
                    }
                }
            }
            
            renderer.render(scene, camera);
        };

        renderer.setAnimationLoop(render);
    };

    initialize().catch(console.error);
});
