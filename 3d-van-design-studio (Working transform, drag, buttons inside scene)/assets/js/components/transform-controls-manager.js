/**
 * Transform Controls Manager for the Van Builder
 */
class TransformControlsManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.transformControls = null;
        this.activeObject = null;
        this.controlHelper = null;
        this.currentMode = 'translate';
        this.rotationSensitivity = 1.0;
        this.lastRotation = new THREE.Euler();
        this.objectCenter = new THREE.Vector3();
        this.initialScale = new THREE.Vector3();
        this.initialPosition = new THREE.Vector3();
        this.lastScaleX = 1;
        this.lastScaleY = 1;
        this.lastScaleZ = 1;
        this.lastHelperPosition = new THREE.Vector3();
        this.translationOffset = new THREE.Vector3();
        
        // Rotation snapping settings
        this.snapRotation = true;
        this.snapAngle = 5; // Snap to 5-degree increments
        this.accumulatedRotationX = 0;
        this.accumulatedRotationY = 0;
        this.accumulatedRotationZ = 0;
        
        // Initialize the transform controls
        this.init();
    }
    
    init() {
        console.log("TransformControlsManager: Initializing transform controls");
        
        try {
            // Create the transform controls
            this.transformControls = new THREE.TransformControls(
                this.sceneManager.camera, 
                this.sceneManager.renderer.domElement
            );
            
            // Set default mode to translate
            this.transformControls.setMode('translate');
            this.currentMode = 'translate';
            
            // Set size property for better visibility
            this.transformControls.size = 0.75;
            
            // Add directly to scene
            this.sceneManager.scene.add(this.transformControls);
            
            // Add event listener for transform control dragging
            this.transformControls.addEventListener('dragging-changed', (event) => {
                this.isDragging = event.value;
                
                // Disable orbit controls while using transform controls
                this.sceneManager.controls.enabled = !event.value;
                
                // Disable drag controls while transforming
                if (event.value) {
                    if (this.sceneManager.dragControlsManager) {
                        this.sceneManager.dragControlsManager.disable();
                    }
                    
                    // Store initial values when starting dragging
                    if (this.activeObject && this.controlHelper) {
                        // Store initial position and scale
                        this.initialPosition.copy(this.activeObject.position);
                        this.initialScale.copy(this.activeObject.scale);
                        
                        // For translation, store initial control helper position
                        if (this.currentMode === 'translate') {
                            this.lastHelperPosition.copy(this.controlHelper.position);
                            this.translationOffset.copy(this.activeObject.position).sub(this.controlHelper.position);
                        }
                        
                        // For scaling, store initial scale of the control helper
                        if (this.currentMode === 'scale') {
                            this.lastScaleX = this.controlHelper.scale.x;
                            this.lastScaleY = this.controlHelper.scale.y;
                            this.lastScaleZ = this.controlHelper.scale.z;
                        }
                        
                        // For rotation, reset accumulated values
                        if (this.currentMode === 'rotate') {
                            this.lastRotation.copy(this.controlHelper.rotation);
                            this.accumulatedRotationX = 0;
                            this.accumulatedRotationY = 0;
                            this.accumulatedRotationZ = 0;
                        }
                    }
                } else {
                    if (this.sceneManager.dragControlsManager) {
                        this.sceneManager.dragControlsManager.enable();
                    }
                    
                    // Update height for drag controls
                    if (this.activeObject) {
                        this.activeObject.userData.currentHeight = this.activeObject.position.y;
                        console.log("Updated currentHeight:", this.activeObject.userData.currentHeight);
                    }
                    
                    // Add to history for undo/redo when done transforming
                    if (this.sceneManager.vanBuilder) {
                        this.sceneManager.vanBuilder.addToHistory();
                    }
                    
                    // If we were scaling and are done, update our last scale values
                    if (this.currentMode === 'scale' && this.controlHelper) {
                        this.lastScaleX = 1;
                        this.lastScaleY = 1;
                        this.lastScaleZ = 1;
                        this.controlHelper.scale.set(1, 1, 1);
                    }
                }
            });
            
            // Add object change handler
            this.transformControls.addEventListener('objectChange', () => {
                if (!this.activeObject || !this.controlHelper) return;
                
                if (this.currentMode === 'translate') {
                    // For translation, calculate the delta movement of the control helper
                    const deltaPosition = new THREE.Vector3().subVectors(
                        this.controlHelper.position, 
                        this.lastHelperPosition
                    );
                    
                    // Apply this delta to the object's position
                    this.activeObject.position.add(deltaPosition);
                    
                    // Update last helper position for next frame
                    this.lastHelperPosition.copy(this.controlHelper.position);
                    
                } else if (this.currentMode === 'rotate') {
                    // For rotation, we need to rotate around the center with snapping
                    
                    // Calculate rotation delta from last frame
                    const deltaX = this.controlHelper.rotation.x - this.lastRotation.x;
                    const deltaY = this.controlHelper.rotation.y - this.lastRotation.y;
                    const deltaZ = this.controlHelper.rotation.z - this.lastRotation.z;
                    
                    // Don't process very small changes
                    if (Math.abs(deltaX) < 0.0001 && Math.abs(deltaY) < 0.0001 && Math.abs(deltaZ) < 0.0001) {
                        return;
                    }
                    
                    // Apply rotation around the object center based on the snapping setting
                    if (this.snapRotation) {
                        // Accumulate rotation and apply only when it reaches the snap threshold
                        this.accumulatedRotationX += deltaX * this.rotationSensitivity;
                        this.accumulatedRotationY += deltaY * this.rotationSensitivity;
                        this.accumulatedRotationZ += deltaZ * this.rotationSensitivity;
                        
                        // Convert snap angle to radians
                        const snapRadians = THREE.MathUtils.degToRad(this.snapAngle);
                        
                        // Check for X-axis snapping
                        const snapsX = Math.floor(Math.abs(this.accumulatedRotationX) / snapRadians);
                        if (snapsX > 0) {
                            // Get the snapped rotation (preserving direction)
                            const xRotation = Math.sign(this.accumulatedRotationX) * snapsX * snapRadians;
                            this.rotateAroundWorldAxis(this.activeObject, this.objectCenter, new THREE.Vector3(1, 0, 0), xRotation);
                            // Reduce the accumulated rotation by the applied amount
                            this.accumulatedRotationX -= xRotation;
                        }
                        
                        // Check for Y-axis snapping
                        const snapsY = Math.floor(Math.abs(this.accumulatedRotationY) / snapRadians);
                        if (snapsY > 0) {
                            const yRotation = Math.sign(this.accumulatedRotationY) * snapsY * snapRadians;
                            this.rotateAroundWorldAxis(this.activeObject, this.objectCenter, new THREE.Vector3(0, 1, 0), yRotation);
                            this.accumulatedRotationY -= yRotation;
                        }
                        
                        // Check for Z-axis snapping
                        const snapsZ = Math.floor(Math.abs(this.accumulatedRotationZ) / snapRadians);
                        if (snapsZ > 0) {
                            const zRotation = Math.sign(this.accumulatedRotationZ) * snapsZ * snapRadians;
                            this.rotateAroundWorldAxis(this.activeObject, this.objectCenter, new THREE.Vector3(0, 0, 1), zRotation);
                            this.accumulatedRotationZ -= zRotation;
                        }
                    } else {
                        // No snapping - apply rotation directly
                        if (Math.abs(deltaX) > 0.001) {
                            this.rotateAroundWorldAxis(this.activeObject, this.objectCenter, new THREE.Vector3(1, 0, 0), deltaX * this.rotationSensitivity);
                        }
                        if (Math.abs(deltaY) > 0.001) {
                            this.rotateAroundWorldAxis(this.activeObject, this.objectCenter, new THREE.Vector3(0, 1, 0), deltaY * this.rotationSensitivity);
                        }
                        if (Math.abs(deltaZ) > 0.001) {
                            this.rotateAroundWorldAxis(this.activeObject, this.objectCenter, new THREE.Vector3(0, 0, 1), deltaZ * this.rotationSensitivity);
                        }
                    }
                    
                    // Store rotation for next frame
                    this.lastRotation.copy(this.controlHelper.rotation);
                    
                } else if (this.currentMode === 'scale') {
                    // For scaling, we need to calculate the change in scale relative to the previous scale
                    
                    // Calculate scale factors
                    const scaleFactorX = this.controlHelper.scale.x / this.lastScaleX;
                    const scaleFactorY = this.controlHelper.scale.y / this.lastScaleY;
                    const scaleFactorZ = this.controlHelper.scale.z / this.lastScaleZ;
                    
                    // Apply the scale factors to the current object scale
                    this.activeObject.scale.x *= scaleFactorX;
                    this.activeObject.scale.y *= scaleFactorY;
                    this.activeObject.scale.z *= scaleFactorZ;
                    
                    // Update last scale values
                    this.lastScaleX = this.controlHelper.scale.x;
                    this.lastScaleY = this.controlHelper.scale.y;
                    this.lastScaleZ = this.controlHelper.scale.z;
                    
                    // Calculate the object's center in world space
                    const currentCenter = this.getObjectCenter(this.activeObject);
                    
                    // Calculate the difference between current center and original center
                    const centerDiff = new THREE.Vector3().subVectors(this.objectCenter, currentCenter);
                    
                    // Apply this difference to keep the object centered
                    this.activeObject.position.add(centerDiff);
                }
            });
            
            // Hide by default
            this.transformControls.visible = false;
            
            console.log("TransformControlsManager: Transform controls initialized successfully");
        } catch (error) {
            console.error("Error creating transform controls:", error);
        }
    }
    
    // Helper function to rotate an object around a world axis
    rotateAroundWorldAxis(object, point, axis, angle) {
        // Create rotation matrix
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationAxis(axis.normalize(), angle);
        
        // Convert point to world space
        const position = object.position.clone();
        
        // Translate to origin, rotate, then translate back
        position.sub(point);
        position.applyMatrix4(rotationMatrix);
        position.add(point);
        
        // Update object position
        object.position.copy(position);
        
        // Apply rotation to object
        object.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(axis, angle));
        object.updateMatrix();
    }
    
    // Toggle rotation snapping
    toggleRotationSnap() {
        this.snapRotation = !this.snapRotation;
        console.log("Rotation snapping:", this.snapRotation ? "ON" : "OFF");
        
        // Reset accumulated rotation when toggling
        this.accumulatedRotationX = 0;
        this.accumulatedRotationY = 0;
        this.accumulatedRotationZ = 0;
        
        return this.snapRotation;
    }
    
    // Set rotation snap angle (in degrees)
    setSnapAngle(degrees) {
        if (degrees > 0) {
            this.snapAngle = degrees;
            console.log("Rotation snap angle set to", degrees, "degrees");
        }
    }
    
    // Calculate the center of an object
    getObjectCenter(object) {
        if (!object) return new THREE.Vector3();
        
        const boundingBox = new THREE.Box3().setFromObject(object);
        const center = boundingBox.getCenter(new THREE.Vector3());
        return center;
    }
    
    // Attach transform controls to an object
    attach(object) {
        if (!object) {
            console.error("TransformControlsManager: Cannot attach to null object");
            return;
        }
        
        console.log("TransformControlsManager: Attaching to object", object.uuid);
        
        try {
            // Store the object
            this.activeObject = object;
            
            // Check if transform controls are correctly in the scene
            if (!this.sceneManager.scene.children.includes(this.transformControls)) {
                console.log("TransformControls not in scene, re-adding it");
                this.sceneManager.scene.add(this.transformControls);
            }
            
            // Make sure currentHeight is set if not already
            if (object.userData.currentHeight === undefined) {
                object.userData.currentHeight = object.position.y;
                console.log("Setting initial currentHeight:", object.userData.currentHeight);
            }
            
            // Store the object's center for rotation operations
            this.objectCenter = this.getObjectCenter(object);
            
            // Store initial scale and position
            this.initialScale.copy(object.scale);
            this.initialPosition.copy(object.position);
            
            // Create a new empty object for the transform controls
            if (this.controlHelper) {
                // Clean up existing helper
                this.sceneManager.scene.remove(this.controlHelper);
            }
            
            this.controlHelper = new THREE.Object3D();
            
            // Position it at the center for proper visual alignment
            this.controlHelper.position.copy(this.objectCenter);
            
            // Store initial helper position for translation
            this.lastHelperPosition.copy(this.controlHelper.position);
            this.translationOffset.copy(object.position).sub(this.objectCenter);
            
            // Reset scale tracking
            this.lastScaleX = 1;
            this.lastScaleY = 1;
            this.lastScaleZ = 1;
            
            // Add to scene
            this.sceneManager.scene.add(this.controlHelper);
            
            // Reset accumulated rotation
            this.accumulatedRotationX = 0;
            this.accumulatedRotationY = 0;
            this.accumulatedRotationZ = 0;
            
            // Reset last rotation
            this.lastRotation.set(0, 0, 0);
            
            // Make the controls visible and attach to the helper
            this.transformControls.visible = true;
            this.transformControls.attach(this.controlHelper);
            
            // Set to current mode
            this.transformControls.setMode(this.currentMode);
            
            console.log("TransformControls attached to control helper at center:", this.objectCenter);
            
            // Force a redraw
            this.sceneManager.renderer.render(this.sceneManager.scene, this.sceneManager.camera);
        } catch (error) {
            console.error("Error attaching transform controls:", error);
        }
    }
    
    // Detach transform controls from the current object
    detach() {
        console.log("TransformControlsManager: Detaching transform controls");
        
        try {
            // Make sure the controls exist
            if (!this.transformControls) {
                console.error("Transform controls object doesn't exist");
                return;
            }
            
            // Update height data before detaching
            if (this.activeObject) {
                this.activeObject.userData.currentHeight = this.activeObject.position.y;
                console.log("Final currentHeight update on detach:", this.activeObject.userData.currentHeight);
            }
            
            // Detach from any objects
            this.transformControls.detach();
            
            // Remove the helper from scene if it exists
            if (this.controlHelper) {
                this.sceneManager.scene.remove(this.controlHelper);
                this.controlHelper = null;
            }
            
            // Hide the controls
            this.transformControls.visible = false;
            
            // Clear active object reference
            this.activeObject = null;
        } catch (error) {
            console.error("Error detaching transform controls:", error);
        }
    }
    
    // Set transform mode (translate, rotate, scale)
    setMode(mode) {
        if (!this.transformControls) return;
        
        if (mode === 'translate' || mode === 'rotate' || mode === 'scale') {
            console.log("TransformControlsManager: Setting mode to", mode);
            
            // Store the current mode
            const oldMode = this.currentMode;
            this.currentMode = mode;
            
            // Update the transform controls mode
            this.transformControls.setMode(mode);
            
            // Setup mode-specific settings
            if (this.controlHelper && this.activeObject) {
                // When switching modes, update the control helper's position
                // to match the current object center
                const currentCenter = this.getObjectCenter(this.activeObject);
                this.objectCenter.copy(currentCenter);
                this.controlHelper.position.copy(currentCenter);
                this.lastHelperPosition.copy(currentCenter);
                
                if (mode === 'rotate') {
                    // Reset rotation tracking when entering rotation mode
                    this.controlHelper.rotation.set(0, 0, 0);
                    this.lastRotation.set(0, 0, 0);
                    this.accumulatedRotationX = 0;
                    this.accumulatedRotationY = 0;
                    this.accumulatedRotationZ = 0;
                } else if (mode === 'scale') {
                    // Reset scale of control helper when entering scale mode
                    // This doesn't affect the object's current scale
                    this.controlHelper.scale.set(1, 1, 1);
                    this.lastScaleX = 1;
                    this.lastScaleY = 1;
                    this.lastScaleZ = 1;
                } else if (mode === 'translate') {
                    // Calculate the translation offset
                    this.translationOffset.copy(this.activeObject.position).sub(currentCenter);
                }
            }
        }
    }
    
    // Set rotation sensitivity
    setRotationSensitivity(sensitivity) {
        if (sensitivity > 0 && sensitivity <= 1) {
            this.rotationSensitivity = sensitivity;
            console.log("Set rotation sensitivity to", sensitivity);
        }
    }
    
    // Enable the transform controls
    enable() {
        if (this.transformControls) {
            this.transformControls.enabled = true;
            
            // If there's an active object, make the controls visible
            if (this.activeObject) {
                this.transformControls.visible = true;
            }
        }
    }
    
    // Disable the transform controls
    disable() {
        if (this.transformControls) {
            this.transformControls.enabled = false;
            this.transformControls.visible = false;
        }
    }
    
    // Toggle the transform controls
    toggle() {
        if (this.transformControls) {
            if (this.transformControls.enabled) {
                this.disable();
            } else {
                this.enable();
            }
        }
    }
}