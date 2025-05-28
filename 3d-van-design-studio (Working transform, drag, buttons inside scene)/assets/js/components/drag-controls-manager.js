class DragControlsManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.draggableObjects = [];
        this.isEnabled = true;
        this.dragStartPosition = new THREE.Vector3();
        this.dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.currentDragObject = null;
        this.offset = new THREE.Vector3();
        
        // Initialize our custom drag controls
        this.init();
    }
    
    init() {
        console.log("DragControlsManager: Initializing drag controls");
        
        // Set up mouse event listeners for our custom implementation
        const canvas = this.sceneManager.renderer.domElement;
        
        // We need to add the event listeners in a way that ensures our handlers run before OrbitControls
        canvas.addEventListener('pointerdown', this.onPointerDown.bind(this), { capture: true });
        window.addEventListener('pointermove', this.onPointerMove.bind(this), { capture: true });
        window.addEventListener('pointerup', this.onPointerUp.bind(this), { capture: true });
        
        console.log("DragControlsManager: Event listeners set up");
    }
    
    onPointerDown(event) {
        // Only process left pointer button
        if (event.button !== 0 || !this.isEnabled) return;
        
        // Calculate mouse position in normalized device coordinates
        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        
        // Find intersections with draggable objects
        let intersectedDraggable = this.findIntersectedDraggable();
        
        if (intersectedDraggable) {
            // If the intersected object is a draggable object, start dragging
            console.log("DragControlsManager: Starting drag on object", intersectedDraggable.uuid);
            
            // Disable orbit controls during drag
            this.sceneManager.controls.enabled = false;
            
            // Set up drag plane - use the ground plane
            this.dragPlane.setFromNormalAndCoplanarPoint(
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(0, 0, 0)
            );
            
            // Find intersection with drag plane
            const intersection = new THREE.Vector3();
            this.raycaster.ray.intersectPlane(this.dragPlane, intersection);
            
            // Calculate offset from intersection to object position
            this.offset.copy(intersectedDraggable.position).sub(intersection);
            
            // Store the object and its initial position
            this.currentDragObject = intersectedDraggable;
            this.dragStartPosition.copy(intersectedDraggable.position);
            this.isDragging = true;
            
            // Prevent event from propagating to orbit controls
            event.stopPropagation();
            event.preventDefault();
        }
    }
    
    onPointerMove(event) {
        if (!this.isDragging || !this.currentDragObject || !this.isEnabled) return;
        
        // Calculate mouse position in normalized device coordinates
        const rect = this.sceneManager.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Update the picking ray with the camera and mouse position
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        
        // Find intersection with the drag plane
        const intersection = new THREE.Vector3();
        if (this.raycaster.ray.intersectPlane(this.dragPlane, intersection)) {
            // Add offset to intersection point
            intersection.add(this.offset);
            
            // Move the object, but keep its Y coordinate
            const currentHeight = this.currentDragObject.userData.currentHeight !== undefined ? 
                this.currentDragObject.userData.currentHeight : this.dragStartPosition.y;
                
            this.currentDragObject.position.x = intersection.x;
            this.currentDragObject.position.y = currentHeight;
            this.currentDragObject.position.z = intersection.z;
            
            console.log("DragControlsManager: Dragging object to", 
                this.currentDragObject.position.x.toFixed(2),
                this.currentDragObject.position.y.toFixed(2),
                this.currentDragObject.position.z.toFixed(2)
            );
        }
        
        // Prevent event from propagating to orbit controls
        event.stopPropagation();
        event.preventDefault();
    }
    
    onPointerUp(event) {
        if (!this.isDragging || !this.currentDragObject || !this.isEnabled) return;
        
        console.log("DragControlsManager: Ending drag on object", this.currentDragObject.uuid);
        
        // Calculate distance moved
        const distance = this.currentDragObject.position.distanceTo(this.dragStartPosition);
        console.log("DragControlsManager: Object moved distance:", distance);
        
        // Re-enable orbit controls
        this.sceneManager.controls.enabled = true;
        
        // If we have a van builder instance and the object has moved, add to history for undo/redo
        if (this.sceneManager.vanBuilder && distance > 0.001) {
            this.sceneManager.vanBuilder.addToHistory();
        }
        
        // Reset dragging state
        this.isDragging = false;
        this.currentDragObject = null;
        
        // Prevent the event from propagating further
        event.stopPropagation();
    }
    
    findIntersectedDraggable() {
        // Find all intersections
        const intersects = this.raycaster.intersectObjects(this.sceneManager.scene.children, true);
        console.log("DragControlsManager: Found", intersects.length, "intersections");
        
        if (intersects.length > 0) {
            // For each intersection, find if it belongs to a draggable object
            for (let i = 0; i < intersects.length; i++) {
                let object = intersects[i].object;
                console.log("DragControlsManager: Checking intersection with", object.uuid);
                
                let draggableParent = null;
                
                // Traverse up the parent chain to find the draggable parent
                while (object) {
                    if (this.draggableObjects.includes(object)) {
                        draggableParent = object;
                        console.log("DragControlsManager: Found draggable parent", object.uuid);
                        break;
                    }
                    
                    if (object.parent) {
                        console.log("DragControlsManager: Moving up to parent", object.parent.uuid);
                    }
                    
                    object = object.parent;
                }
                
                if (draggableParent) {
                    return draggableParent;
                }
            }
        }
        
        return null;
    }
    
    addDraggableObject(object) {
        console.log("DragControlsManager: Adding draggable object", object.uuid);
        
        if (!this.draggableObjects.includes(object)) {
            // Store the current height for maintaining during drag
            object.userData.currentHeight = object.position.y;
            
            // Add to array of draggable objects
            this.draggableObjects.push(object);
            
            console.log("DragControlsManager: Object added to draggables. Total:", this.draggableObjects.length);
        }
    }
    
    removeDraggableObject(object) {
        console.log("DragControlsManager: Removing draggable object", object?.uuid);
        
        const index = this.draggableObjects.indexOf(object);
        if (index !== -1) {
            this.draggableObjects.splice(index, 1);
            console.log("DragControlsManager: Object removed from draggables. Total:", this.draggableObjects.length);
        }
        
        // If we're currently dragging this object, stop dragging
        if (this.currentDragObject === object) {
            this.isDragging = false;
            this.currentDragObject = null;
            this.sceneManager.controls.enabled = true;
        }
    }
    
    enable() {
        console.log("DragControlsManager: Enabling drag controls");
        this.isEnabled = true;
    }
    
    disable() {
        console.log("DragControlsManager: Disabling drag controls");
        this.isEnabled = false;
        
        // If currently dragging, stop it
        if (this.isDragging) {
            this.isDragging = false;
            this.currentDragObject = null;
            this.sceneManager.controls.enabled = true;
        }
    }
    
    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    }
}