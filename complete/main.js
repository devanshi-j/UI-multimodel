import { loadGLTF } from "../libs/loader.js";
import * as THREE from "../libs/three123/three.module.js";
import { ARButton } from "../libs/jsm/ARButton.js";

// Utility functions remain the same
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

// Item categories remain the same
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
    const initialize = async () => {
        // Scene and AR setup (remains the same)
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

        // Lighting setup (remains the same)
        const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        scene.add(light);
        scene.add(directionalLight);

        // Modified interaction state
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

        // Raycaster setup
        const raycaster = new THREE.Raycaster();
        const touch = new THREE.Vector2();

        // Controller and reticle setup (remains the same)
        const controller = renderer.xr.getController(0);
        scene.add(controller);

        const reticle = new THREE.Mesh(
            new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
            new THREE.MeshBasicMaterial({ color: 0xffffff })
        );
        reticle.visible = false;
        reticle.matrixAutoUpdate = false;
        scene.add(reticle);

        // Modified touch event handlers
        const onTouchStart = (event) => {
            event.preventDefault();
            
            interactionState.touchCount = event.touches.length;
            
            // Single touch for rotation
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
            }
            // Two finger touch for dragging or scaling
            else if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                
                // Calculate midpoint for object selection
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
                    
                    // Set mode based on touch orientation
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

            // Handle rotation (horizontal only)
            if (interactionState.mode === 'rotating' && event.touches.length === 1) {
                const deltaX = event.touches[0].pageX - interactionState.previousTouchX;
                interactionState.selectedObject.rotation.y += deltaX * 0.02;
                interactionState.previousTouchX = event.touches[0].pageX;
            }
            // Handle scaling and dragging
            else if (event.touches.length === 2) {
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
                }
                else if (interactionState.mode === 'dragging') {
                    const midX = (touch1.pageX + touch2.pageX) / 2;
                    const midY = (touch1.pageY + touch2.pageY) / 2;
                    
                    // Calculate movement in screen space
                    const deltaX = (midX - interactionState.touchStart.x) * 0.01;
                    const deltaZ = (midY - interactionState.touchStart.y) * 0.01;
                    
                    // Apply movement relative to camera orientation
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

        // Rest of the code remains the same
        // (Menu handlers, model loading, AR session setup, etc.)
        
        // Add touch event listeners
        renderer.domElement.addEventListener('touchstart', onTouchStart, false);
        renderer.domElement.addEventListener('touchmove', onTouchMove, false);
        renderer.domElement.addEventListener('touchend', onTouchEnd, false);

        // ... (Rest of the initialization code)
    };

    initialize().catch(console.error);
});
