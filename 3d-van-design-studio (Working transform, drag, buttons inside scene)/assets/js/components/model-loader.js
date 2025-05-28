/**
 * Model Loader component for the Van Builder
 */
class ModelLoader {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.gltfLoader = new THREE.GLTFLoader();
        this.textureLoader = new THREE.TextureLoader();
        
        // Set up Draco decoder if available
        if (typeof THREE.DRACOLoader !== 'undefined') {
            const dracoLoader = new THREE.DRACOLoader();
            dracoLoader.setDecoderPath(vanBuilderData.pluginUrl + 'assets/js/lib/draco/');
            this.gltfLoader.setDRACOLoader(dracoLoader);
        }
    }
    
    loadModel(url, callback) {
        // Show loading indicator
        this.showLoadingIndicator();
        
        this.gltfLoader.load(
            url,
            (gltf) => {
                // Process the loaded model
                const model = gltf.scene;
                
                // Enable shadows
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                
                // Hide loading indicator
                this.hideLoadingIndicator();
                
                // Call the callback with the processed model
                if (callback) {
                    callback(model);
                }
            },
            (xhr) => {
                // Progress callback
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                this.updateLoadingProgress(percentComplete);
            },
            (error) => {
                // Error callback
                console.error('Error loading model:', error);
                this.hideLoadingIndicator();
                this.showErrorMessage('Failed to load model. Please try again.');
            }
        );
    }
    
    loadTexture(url, callback) {
        this.textureLoader.load(
            url,
            (texture) => {
                // Configure texture
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                texture.repeat.set(1, 1);
                
                // Call the callback with the loaded texture
                if (callback) {
                    callback(texture);
                }
            },
            undefined,
            (error) => {
                console.error('Error loading texture:', error);
                this.showErrorMessage('Failed to load texture. Please try again.');
            }
        );
    }
    
    showLoadingIndicator() {
        // Check if loading indicator already exists
        let loadingIndicator = document.getElementById('van-builder-loading');
        
        if (!loadingIndicator) {
            // Create loading indicator
            loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'van-builder-loading';
            loadingIndicator.className = 'van-builder-loading';
            loadingIndicator.innerHTML = `
                <div class="van-builder-loading-spinner"></div>
                <div class="van-builder-loading-text">Loading model... <span class="van-builder-loading-progress">0%</span></div>
            `;
            
            // Add to document
            document.body.appendChild(loadingIndicator);
        }
        
        // Show loading indicator
        loadingIndicator.style.display = 'flex';
    }
    
    hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('van-builder-loading');
        
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }
    
    updateLoadingProgress(percent) {
        const progressElement = document.querySelector('.van-builder-loading-progress');
        
        if (progressElement) {
            progressElement.textContent = Math.round(percent) + '%';
        }
    }
    
    showErrorMessage(message) {
        // Create error message element
        const errorMessage = document.createElement('div');
        errorMessage.className = 'van-builder-error-message';
        errorMessage.textContent = message;
        
        // Add to document
        document.body.appendChild(errorMessage);
        
        // Remove after a delay
        setTimeout(() => {
            errorMessage.remove();
        }, 5000);
    }
}