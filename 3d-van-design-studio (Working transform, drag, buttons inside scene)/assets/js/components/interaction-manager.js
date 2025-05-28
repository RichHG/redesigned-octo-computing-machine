/**
 * Interaction Manager component for the Van Builder
 */
class InteractionManager {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.transformControls = null;
        this.transformMode = 'translate'; // 'translate', 'rotate', 'scale'
        
        // Event callbacks
        this.onObjectTransformed = null;
        
        this.init();
    }
    
    init() {
        // Create transform controls
        this.transformControls = new THREE.TransformControls(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        
        // Add to scene
        this.sceneManager.scene.add(this.transformControls);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for object selection
        this.sceneManager.onObjectSelected = (object) => {
            this.attachTransformControls(object);
        };
        
        // Listen for object deselection
        this.sceneManager.onObjectDeselected = () => {
            this.detachTransformControls();
        };
        
        // Listen for transform control events
        this.transformControls.addEventListener('dragging-changed', (event) => {
            // Disable orbit controls while transforming
            this.sceneManager.controls.enabled = !event.value;
        });
        
        this.transformControls.addEventListener('change', () => {
            // Update object properties in UI
            if (this.onObjectTransformed) {
                this.onObjectTransformed();
            }
        });
        
        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (event) => {
            if (!this.transformControls.object) return;
            
            switch (event.key.toLowerCase()) {
                case 'g':
                    this.setTransformMode('translate');
                    break;
                case 'r':
                    this.setTransformMode('rotate');
                    break;
                case 's':
                    this.setTransformMode('scale');
                    break;
                case 'escape':
                    this.sceneManager.deselectObject();
                    break;
                case 'delete':
                    if (this.transformControls.object && !this.transformControls.object.userData.isVan) {
                        const objectToRemove = this.transformControls.object;
                        this.detachTransformControls();
                        this.sceneManager.removeFromScene(objectToRemove);
                        this.sceneManager.deselectObject();
                        
                        // Notify of change
                        if (this.onObjectTransformed) {
                            this.onObjectTransformed();
                        }
                    }
                    break;
            }
        });
    }
    
    attachTransformControls(object) {
        // Don't allow transforming the grid or measurement helpers
        if (object === this.sceneManager.gridHelper || object === this.sceneManager.measurementHelper) {
            return;
        }
        
        // Attach transform controls to the object
        this.transformControls.attach(object);
        
        // Set transform mode
        this.transformControls.setMode(this.transformMode);
        
        // If it's a van, only allow rotation around Y axis
        if (object.userData.isVan) {
            this.transformControls.showX = false;
            this.transformControls.showZ = false;
        } else {
            this.transformControls.showX = true;
            this.transformControls.showZ = true;
        }
    }
    
    detachTransformControls() {
        if (this.transformControls) {
            this.transformControls.detach();
        }
    }
    
    setTransformMode(mode) {
        this.transformMode = mode;
        
        if (this.transformControls) {
            this.transformControls.setMode(mode);
            
            // Update UI to reflect the current mode
            $('.transform-mode-button').removeClass('active');
            $(`#transform-${mode}`).addClass('active');
        }
    }
}