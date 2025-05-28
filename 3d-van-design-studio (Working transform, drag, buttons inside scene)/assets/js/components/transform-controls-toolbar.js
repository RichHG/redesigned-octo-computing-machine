/**
 * Transform Controls Toolbar for the Van Builder
 * Provides a modern floating interface for transforming selected objects
 */
class TransformControlsToolbar {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.container = null;
        this.activeObject = null;
        this.transformMode = 'translate'; // translate, rotate, scale
        this.toolbarVisible = false;
        this.isTransforming = false;
        this.lastTransformedObject = null; // Track the last object we were transforming
        this.suppressVisibilityChanges = false; // Flag to prevent visibility flickering
        this.reselectionInProgress = false; // Flag to track reselection
        
        this.init();
    }
    
    init() {
        console.log("TransformControlsToolbar: Initializing toolbar");
        
        // Create the main container for our toolbar
        this.container = document.createElement('div');
        this.container.className = 'van-builder-transform-toolbar';
        this.container.style.display = 'none';
        
        // Create the HTML for the controls - now using vertical layout
        this.container.innerHTML = `
            <div class="van-builder-transform-buttons">
                <button class="van-builder-btn translate active" data-tooltip="Move">
                    <svg viewBox="0 0 24 24" width="26" height="26">
                        <path d="M13,6v5h5V7.75L22.25,12L18,16.25V13H13v5h3.25L12,22.25L7.75,18H11V13H6v3.25L1.75,12L6,7.75V11h5V6H7.75L12,1.75L16.25,6H13z"/>
                    </svg>
                    <span class="tooltip">Move</span>
                </button>
                <button class="van-builder-btn rotate" data-tooltip="Rotate">
                    <svg viewBox="0 0 24 24" width="26" height="26">
                        <path d="M12,5V2.21c0-0.45-0.54-0.67-0.85-0.35L8.35,4.65c-0.2,0.2-0.2,0.51,0,0.71l2.79,2.79C11.46,8.46,12,8.24,12,7.79V5c3.87,0,7,3.13,7,7c0,0.84-0.16,1.65-0.43,2.4l1.52,1.52c0.58-1.19,0.91-2.51,0.91-3.92C21,8.25,17,4.25,12,5z M12,19c-3.87,0-7-3.13-7-7c0-0.84,0.16-1.65,0.43-2.4L3.91,8.08C3.33,9.27,3,10.59,3,12c0,4.97,4.03,9,9,9v2.79c0,0.45,0.54,0.67,0.85,0.35l2.79-2.79c0.2-0.2,0.2-0.51,0-0.71l-2.79-2.79C12.54,15.54,12,15.76,12,16.21V19z"/>
                    </svg>
                    <span class="tooltip">Rotate</span>
                </button>
                <button class="van-builder-btn scale" data-tooltip="Scale">
                    <svg viewBox="0 0 24 24" width="26" height="26">
                        <path d="M19,13h-6v6h-2v-6H5v-2h6V5h2v6h6V13z M19,3H5C3.89,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5 C21,3.9,20.1,3,19,3z M19,19H5V5h14V19z"/>
                    </svg>
                    <span class="tooltip">Scale</span>
                </button>
                <button class="van-builder-btn duplicate" data-tooltip="Duplicate">
                    <svg viewBox="0 0 24 24" width="26" height="26">
                        <path d="M16,1H4C2.9,1,2,1.9,2,3v14h2V3h12V1z M19,5H8C6.9,5,6,5.9,6,7v14c0,1.1,0.9,2,2,2h11c1.1,0,2-0.9,2-2V7C21,5.9,20.1,5,19,5z M19,21H8V7h11V21z"/>
                    </svg>
                    <span class="tooltip">Duplicate</span>
                </button>
                <button class="van-builder-btn delete" data-tooltip="Delete">
                    <svg viewBox="0 0 24 24" width="26" height="26">
                        <path d="M6,19c0,1.1,0.9,2,2,2h8c1.1,0,2-0.9,2-2V7H6V19z M19,4h-3.5l-1-1h-5l-1,1H5v2h14V4z"/>
                    </svg>
                    <span class="tooltip">Delete</span>
                </button>
            </div>
        `;
        
        // Add CSS styles - now with vertical layout and tooltips
        const style = document.createElement('style');
        style.textContent = `
            .van-builder-transform-toolbar {
                position: absolute;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 10px;
                z-index: 1000;
                transition: opacity 0.3s ease; /* Changed from "all" to only transition opacity */
                filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
                background-color: rgba(255, 255, 255, 0.8);
                padding: 10px;
                border-radius: 10px;
                backdrop-filter: blur(5px);
                pointer-events: auto;
            }
            
            .van-builder-transform-buttons {
                display: flex;
                flex-direction: column;
                gap: 10px;
                align-items: center;
            }
            
            .van-builder-btn {
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: none;
                background-color: #ffffff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(0,0,0,0.12);
                position: relative;
            }
            
            .van-builder-btn:hover {
                background-color: #f5f5f5;
                transform: translateY(-2px);
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .van-builder-btn.active {
                background-color: #2194ce;
            }
            
            .van-builder-btn.active svg path {
                fill: white;
            }
            
            .van-builder-btn svg path {
                fill: #333;
                transition: fill 0.2s ease;
            }
            
            .van-builder-btn.delete svg path {
                fill: #e53935;
            }
            
            .van-builder-btn.delete:hover {
                background-color: #ffebee;
            }
            
            /* Tooltip styles */
            .van-builder-btn .tooltip {
                position: absolute;
                right: calc(100% + 10px);
                top: 50%;
                transform: translateY(-50%);
                background-color: rgba(0,0,0,0.75);
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 14px;
                white-space: nowrap;
                opacity: 0;
                visibility: hidden;
                transition: opacity 0.2s ease, visibility 0.2s ease;
                pointer-events: none;
            }
            
            .van-builder-btn .tooltip::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 100%;
                margin-top: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: transparent transparent transparent rgba(0,0,0,0.75);
            }
            
            .van-builder-btn:hover .tooltip {
                opacity: 1;
                visibility: visible;
            }
            
            /* Simplified animation for showing toolbar */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .van-builder-transform-toolbar.show {
                display: flex;
                animation: fadeIn 0.3s forwards;
            }
            
            /* Never actually hide the toolbar completely once shown, just make it invisible */
            .van-builder-transform-toolbar.invisible {
                opacity: 0;
                pointer-events: none;
            }
            
            /* Responsive adjustments */
            @media (max-width: 768px) {
                .van-builder-transform-toolbar {
                    padding: 8px;
                }
                .van-builder-btn {
                    width: 42px;
                    height: 42px;
                }
            }
        `;
        
        document.head.appendChild(style);
        
        // Find the renderer container and append our toolbar to it
        this.attachToSceneContainer();
        
        // Add event listeners
        this.addEventListeners();
        
        // Connect to transform controls
        this.connectToTransformControls();
        
        // Patch the scene manager's selection logic to prevent auto-deselection
        this.patchSceneManagerSelectionLogic();
        
        // Set up click handler for background clicks
        this.setupBackgroundClickHandler();
        
        console.log("TransformControlsToolbar: Toolbar initialized successfully");
    }
    
    // Setup background click handler to properly handle deselection
    setupBackgroundClickHandler() {
        if (!this.sceneManager || !this.sceneManager.renderer) {
            console.warn("Cannot set up background click handler, renderer not available");
            return;
        }
        
        const canvas = this.sceneManager.renderer.domElement;
        
        // Add a click listener to handle background clicks
        canvas.addEventListener('pointerdown', (event) => {
            // Skip if we're in the middle of a transform or reselection
            if (this.isTransforming || this.reselectionInProgress || this.suppressVisibilityChanges) {
                return;
            }
            
            // Check if this is a click on an empty area
            this.checkForBackgroundClick(event);
        });
    }
    
    // Check if a click is on the background (no objects)
    checkForBackgroundClick(event) {
        if (!this.sceneManager || !this.sceneManager.camera) {
            return;
        }
        
        const canvas = this.sceneManager.renderer.domElement;
        
        // Get normalized coordinates for raycasting
        const rect = canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        // Set up raycaster
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera({ x, y }, this.sceneManager.camera);
        
        // Filter out transform controls from the scene for raycasting
        const objectsToTest = this.sceneManager.scene.children.filter(obj => {
            // Exclude transform controls or any other non-selectable objects
            return !obj.isTransformControls && 
                   !obj.isHelper && 
                   !obj.isLight &&
                   !obj.name?.includes('control');
        });
        
        // Check for intersections
        const intersects = raycaster.intersectObjects(objectsToTest, true);
        
        // If no intersections, this is a background click
        if (intersects.length === 0) {
            console.log("TransformControlsToolbar: Background click detected, hiding toolbar and detaching controls");
            
            // Hide toolbar
            this.hideToolbar();
            
            // Properly detach transform controls
            this.detachTransformControls();
            
            // Clear selection in scene manager
            if (this.sceneManager.deselectAll) {
                this.sceneManager.deselectAll();
            }
        } else if (this.activeObject) {
            // Check if we clicked on a different object
            let clickedObject = intersects[0].object;
            let clickedActiveObject = false;
            
            // Traverse up to find if it's part of our active object
            while (clickedObject && !clickedActiveObject) {
                if (clickedObject === this.activeObject) {
                    clickedActiveObject = true;
                } else {
                    clickedObject = clickedObject.parent;
                }
            }
            
            // If we clicked on a different object, handle that
            if (!clickedActiveObject) {
                console.log("TransformControlsToolbar: Click on different object, hiding toolbar");
                
                // Hide toolbar and detach controls from current object
                this.hideToolbar();
                this.detachTransformControls();
            }
        }
    }
    
    // Detach transform controls properly
    detachTransformControls() {
        if (!this.sceneManager || !this.sceneManager.transformControlsManager) {
            return;
        }
        
        const transformControls = this.sceneManager.transformControlsManager.transformControls;
        if (!transformControls) return;
        
        // Make sure the controls are detached and removed from scene
        if (transformControls.object) {
            transformControls.detach();
        }
        
        // Force visibility off
        transformControls.visible = false;
        
        // Check if there's a helper and remove it too
        if (this.sceneManager.transformControlsManager.controlHelper) {
            this.sceneManager.transformControlsManager.controlHelper.visible = false;
        }
        
        console.log("TransformControlsToolbar: Transform controls detached");
        
        // Clear our active object reference
        this.activeObject = null;
        
        // Reset any lingering states to be safe
        this.isTransforming = false;
        this.suppressVisibilityChanges = false;
        this.reselectionInProgress = false;
    }
    
    // Attempt to patch the scene manager to prevent auto-deselection
    patchSceneManagerSelectionLogic() {
        if (!this.sceneManager) {
            console.warn("Cannot patch scene manager, not available");
            return;
        }
        
        // Patch selectObject method
        if (typeof this.sceneManager.selectObject === 'function') {
            const originalSelectObject = this.sceneManager.selectObject;
            
            this.sceneManager.selectObject = (object) => {
                if (object) {
                    const isNewSelection = this.activeObject !== object;
                    
                    // Prevent flickering when selecting the same object again
                    if (isNewSelection) {
                        // If it's a new object, we need to ensure it appears correctly
                        // Mark that a reselection is in progress
                        this.reselectionInProgress = true;
                        
                        // Store the object reference without hiding/showing the toolbar
                        this.activeObject = object;
                        this.lastTransformedObject = object;
                    } else {
                        // Same object - just keep the toolbar visible without any changes
                        this.suppressVisibilityChanges = true;
                    }
                    
                    // Call the original method
                    originalSelectObject.call(this.sceneManager, object);
                    
                    // Now we can safely show the toolbar if needed
                    if (isNewSelection) {
                        // For new selections, show the toolbar with a slight delay
                        // to ensure any hide operations have completed
                        setTimeout(() => {
                            this.reselectionInProgress = false;
                            this.showToolbarWithoutFlicker(object);
                        }, 50);
                    } else {
                        // For the same object, just make sure it's visible
                        this.showToolbarWithoutFlicker(object);
                        
                        // Reset suppression after a short delay
                        setTimeout(() => {
                            this.suppressVisibilityChanges = false;
                        }, 100);
                    }
                } else {
                    // Null selection - hide toolbar and detach controls
                    this.hideToolbar();
                    this.detachTransformControls();
                    originalSelectObject.call(this.sceneManager, object);
                }
            };
        }
        
        // Patch deselectAll method
        if (typeof this.sceneManager.deselectAll === 'function') {
            const originalDeselectAll = this.sceneManager.deselectAll;
            
            this.sceneManager.deselectAll = () => {
                // If we're in the middle of a reselection, transform, or suppressing changes, don't deselect
                if (this.reselectionInProgress || this.isTransforming || this.suppressVisibilityChanges) {
                    console.log("TransformControlsToolbar: Preventing deselection during transform/reselection");
                    return;
                }
                
                // Properly detach transform controls
                this.detachTransformControls();
                
                // Proceed with normal deselection
                originalDeselectAll.call(this.sceneManager);
                
                // Hide our toolbar
                this.hide();
            };
        }
        
        // Also patch deselectObjects if it exists
        if (typeof this.sceneManager.deselectObjects === 'function') {
            const originalDeselectObjects = this.sceneManager.deselectObjects;
            
            this.sceneManager.deselectObjects = () => {
                // If we're in the middle of a reselection, transform, or suppressing changes, don't deselect
                if (this.reselectionInProgress || this.isTransforming || this.suppressVisibilityChanges) {
                    console.log("TransformControlsToolbar: Preventing deselection during transform/reselection");
                    return;
                }
                
                // Properly detach transform controls
                this.detachTransformControls();
                
                // Proceed with normal deselection
                originalDeselectObjects.call(this.sceneManager);
                
                // Hide our toolbar
                this.hide();
            };
        }
        
        // Patch removeFromScene to properly clean up
        if (typeof this.sceneManager.removeFromScene === 'function') {
            const originalRemoveFromScene = this.sceneManager.removeFromScene;
            
            this.sceneManager.removeFromScene = (object) => {
                // Check if we're removing our active object
                if (object === this.activeObject) {
                    this.hide();
                    this.detachTransformControls();
                }
                
                // Call the original method
                originalRemoveFromScene.call(this.sceneManager, object);
            };
        }
        
        console.log("TransformControlsToolbar: Patched scene manager selection logic");
    }
    
    // Connect to transform controls to monitor transform operations
    connectToTransformControls() {
        const connectToControls = () => {
            if (!this.sceneManager || !this.sceneManager.transformControlsManager) {
                return false;
            }
            
            const transformControls = this.sceneManager.transformControlsManager.transformControls;
            if (!transformControls) {
                return false;
            }
            
            // Mark the transform controls to exclude from raycasting
            transformControls.isTransformControls = true;
            
            // Hook into dragging-changed event
            transformControls.addEventListener('mouseDown', (event) => {
                console.log("Transform controls: mouse down");
                // When mouse down on transform controls, enable suppression
                this.suppressVisibilityChanges = true;
                this.isTransforming = true;
                
                // Store the current object for reference
                if (transformControls.object) {
                    this.lastTransformedObject = transformControls.object;
                }
            });
            
            transformControls.addEventListener('mouseUp', (event) => {
                console.log("Transform controls: mouse up");
                
                // Flag that the transform operation is complete
                this.isTransforming = false;
                
                // Keep suppressing visibility changes for a short period
                // to prevent flickering from other events
                setTimeout(() => {
                    this.suppressVisibilityChanges = false;
                    
                    // Make sure the toolbar is still visible
                    if (this.lastTransformedObject) {
                        this.showToolbarWithoutFlicker(this.lastTransformedObject);
                    }
                }, 300);
            });
            
            transformControls.addEventListener('dragging-changed', (event) => {
                console.log("Transform controls dragging changed:", event.value);
                this.isTransforming = event.value;
                
                // Store the object when we start dragging
                if (event.value && transformControls.object) {
                    this.suppressVisibilityChanges = true;
                    this.lastTransformedObject = transformControls.object;
                } 
                // Handle end of dragging
                else if (!event.value) {
                    // Keep suppressing visibility changes for a bit to avoid flickering
                    setTimeout(() => {
                        this.suppressVisibilityChanges = false;
                        
                        // Make sure our toolbar stays visible
                        if (this.lastTransformedObject) {
                            this.showToolbarWithoutFlicker(this.lastTransformedObject);
                        }
                    }, 300);
                }
            });
            
            // Patch the detach method to ensure proper cleanup
            const originalDetach = transformControls.detach;
            transformControls.detach = () => {
                // Call the original method
                originalDetach.call(transformControls);
                
                // Ensure the transform controls are hidden
                transformControls.visible = false;
                
                // Additional cleanup if needed
                console.log("TransformControlsToolbar: Transform controls detached");
            };
            
            console.log("Connected to transform controls events");
            return true;
        };
        
        // Try to connect immediately
        if (!connectToControls()) {
            // If we can't connect yet, try again later
            const intervalId = setInterval(() => {
                if (connectToControls()) {
                    clearInterval(intervalId);
                }
            }, 500);
            
            // Don't try forever
            setTimeout(() => clearInterval(intervalId), 10000);
        }
    }
    
    // Attach the toolbar to the scene container
    attachToSceneContainer() {
        // Try to find the renderer container
        let rendererContainer = null;
        
        // Look for the scene container - usually the element containing the canvas
        if (this.sceneManager && this.sceneManager.renderer) {
            rendererContainer = this.sceneManager.renderer.domElement.parentElement;
        }
        
        // If we couldn't find it, use a more generic approach
        if (!rendererContainer) {
            rendererContainer = document.querySelector('.scene-container') || 
                               document.querySelector('.three-container') || 
                               document.querySelector('.canvas-container');
        }
        
        // If still not found, use the document body as fallback but with a warning
        if (!rendererContainer) {
            console.warn("TransformControlsToolbar: Could not find scene container, using body instead");
            rendererContainer = document.body;
        } else {
            // Make sure the container has position relative for proper positioning
            const containerPosition = window.getComputedStyle(rendererContainer).position;
            if (containerPosition === 'static') {
                rendererContainer.style.position = 'relative';
            }
        }
        
        // Add the toolbar to the container
        rendererContainer.appendChild(this.container);
        
        console.log("TransformControlsToolbar: Attached to container", rendererContainer);
    }
    
    addEventListeners() {
        // Get all the transform buttons
        const translateBtn = this.container.querySelector('.van-builder-btn.translate');
        const rotateBtn = this.container.querySelector('.van-builder-btn.rotate');
        const scaleBtn = this.container.querySelector('.van-builder-btn.scale');
        const deleteBtn = this.container.querySelector('.van-builder-btn.delete');
        const duplicateBtn = this.container.querySelector('.van-builder-btn.duplicate');
        
        // Add click listeners for transform modes
        translateBtn.addEventListener('click', (event) => {
            this.setTransformMode('translate');
            event.stopPropagation();
        });
        
        rotateBtn.addEventListener('click', (event) => {
            this.setTransformMode('rotate');
            event.stopPropagation();
        });
        
        scaleBtn.addEventListener('click', (event) => {
            this.setTransformMode('scale');
            event.stopPropagation();
        });
        
        // Add click listeners for actions
        deleteBtn.addEventListener('click', (event) => {
            this.deleteSelectedObject();
            event.stopPropagation();
        });
        
        duplicateBtn.addEventListener('click', (event) => {
            this.duplicateSelectedObject();
            event.stopPropagation();
        });
        
        // Prevent all events on the toolbar from bubbling to prevent unwanted interactions
        this.container.addEventListener('pointerdown', (event) => event.stopPropagation());
        this.container.addEventListener('pointerup', (event) => event.stopPropagation());
        this.container.addEventListener('click', (event) => event.stopPropagation());
    }
    
    // New method to show toolbar without flickering
    showToolbarWithoutFlicker(object) {
        if (!object || this.suppressVisibilityChanges) return;
        
        this.activeObject = object;
        this.toolbarVisible = true;
        
        // Instead of changing display to 'none' and back, use opacity
        // This prevents layout recalculation that causes flickering
        this.container.classList.remove('invisible');
        this.container.style.display = 'flex';
        this.container.classList.add('show');
        
        this.setTransformMode(this.transformMode); // Reset to current transform mode
        
        console.log("TransformControlsToolbar: Showing toolbar for object", object.uuid);
    }
    
    showToolbar(object) {
        this.showToolbarWithoutFlicker(object);
    }
    
    hideToolbar() {
        // Don't hide if we're suppressing visibility changes or in transform/reselection
        if (this.suppressVisibilityChanges || this.isTransforming || this.reselectionInProgress) return;
        
        // Instead of immediately removing, fade out with opacity first
        this.container.classList.add('invisible');
        this.container.classList.remove('show');
        this.toolbarVisible = false;
        
        // Actually hide the element after the transition
        setTimeout(() => {
            // Double-check we're still meant to be hidden
            if (!this.toolbarVisible && !this.suppressVisibilityChanges && 
                !this.isTransforming && !this.reselectionInProgress) {
                this.container.style.display = 'none';
            }
        }, 300); // Match this to the CSS transition duration
        
        console.log("TransformControlsToolbar: Hiding toolbar");
    }
    
    // Compatibility with previous method names
    show(object) {
        this.showToolbar(object);
    }
    
    hide() {
        this.hideToolbar();
    }
    
    setTransformMode(mode) {
        // Update the mode
        this.transformMode = mode;
        
        // Update button active states
        const buttons = this.container.querySelectorAll('.van-builder-transform-buttons .van-builder-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        
        const activeBtn = this.container.querySelector(`.van-builder-btn.${mode}`);
        if (activeBtn) activeBtn.classList.add('active');
        
        // If we have an active object and transform controls manager, set the mode
        if (this.activeObject && this.sceneManager.transformControlsManager) {
            console.log("TransformControlsToolbar: Setting transform mode to", mode);
            this.sceneManager.transformControlsManager.setMode(mode);
        }
    }
    
    deleteSelectedObject() {
        if (!this.activeObject) return;
        
        console.log("TransformControlsToolbar: Deleting selected object", this.activeObject.uuid);
        
        // Ask for confirmation
        if (confirm("Are you sure you want to delete this item?")) {
            // Detach transform controls first
            this.detachTransformControls();
            
            // Remove from scene
            this.sceneManager.removeFromScene(this.activeObject);
            
            // Hide toolbar
            this.hideToolbar();
            
            // Add to history for undo/redo
            if (this.sceneManager.vanBuilder) {
                this.sceneManager.vanBuilder.addToHistory();
            }
        }
    }
    
    duplicateSelectedObject() {
        if (!this.activeObject) return;
        
        console.log("TransformControlsToolbar: Duplicating selected object", this.activeObject.uuid);
        
        // Clone the object
        const clone = this.activeObject.clone();
        
        // Generate new UUID for the clone
        clone.uuid = THREE.MathUtils.generateUUID();
        
        // Copy user data
        clone.userData = JSON.parse(JSON.stringify(this.activeObject.userData));
        
        // Offset the position slightly to make it visible
        clone.position.x += 0.5;
        clone.position.z += 0.5;
        
        // Add to scene
        this.sceneManager.addToScene(clone);
        
        // Select the new clone
        this.sceneManager.selectObject(clone);
        
        // Add to history for undo/redo
        if (this.sceneManager.vanBuilder) {
            this.sceneManager.vanBuilder.addToHistory();
        }
    }
    
    // Clean up the component when it's no longer needed
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}