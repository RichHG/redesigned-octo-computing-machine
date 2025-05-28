<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get settings
$options = get_option('van_builder_general_settings', array());
$width = isset($atts['width']) ? $atts['width'] : (isset($options['canvas_width']) ? $options['canvas_width'] : '100%');
$height = isset($atts['height']) ? $atts['height'] : (isset($options['canvas_height']) ? $options['canvas_height'] : '600px');
$default_van = isset($atts['default_van']) ? $atts['default_van'] : (isset($options['default_van_model']) ? $options['default_van_model'] : 'sprinter');
$show_controls = isset($atts['show_controls']) ? filter_var($atts['show_controls'], FILTER_VALIDATE_BOOLEAN) : true;
$allow_save = isset($atts['allow_save']) ? filter_var($atts['allow_save'], FILTER_VALIDATE_BOOLEAN) : true;

// Check if guests are allowed to use the builder
$allow_guests = isset($options['allow_guest_designs']) ? filter_var($options['allow_guest_designs'], FILTER_VALIDATE_BOOLEAN) : false;
$user_can_access = is_user_logged_in() || $allow_guests;

// Get saved designs for the current user
$saved_designs = array();
if (is_user_logged_in() && $allow_save) {
    global $wpdb;
    $table_name = $wpdb->prefix . 'van_builder_saved_designs';
    $user_id = get_current_user_id();
    
    $saved_designs = $wpdb->get_results(
        $wpdb->prepare(
            "SELECT id, design_name, updated_at FROM $table_name WHERE user_id = %d ORDER BY updated_at DESC",
            $user_id
        ),
        ARRAY_A
    );
}
?>

<?php if (!$user_can_access): ?>
    <div class="van-builder-login-required">
        <p>Please <a href="<?php echo esc_url(wp_login_url(get_permalink())); ?>">log in</a> to use the 3D Van Designer.</p>
    </div>
<?php else: ?>

<div class="van-builder-container" style="width: <?php echo esc_attr($width); ?>; height: <?php echo esc_attr($height); ?>;" data-default-van="<?php echo esc_attr($default_van); ?>">
    
    <?php if ($show_controls): ?>
    <div class="van-builder-toolbar">
        <div class="van-builder-toolbar-section">
            <button id="van-builder-undo" class="van-builder-button" title="Undo"><span class="dashicons dashicons-undo"></span></button>
            <button id="van-builder-redo" class="van-builder-button" title="Redo"><span class="dashicons dashicons-redo"></span></button>
            <button id="van-builder-reset-view" class="van-builder-button" title="Reset View"><span class="dashicons dashicons-visibility"></span></button>
        </div>
      
      <!-- Add the new drag mode button here -->
    <button id="van-builder-toggle-drag" class="van-builder-toolbar-button" title="Toggle Drag Mode">
        <span class="dashicons dashicons-move"></span>
    </button>
        
        <div class="van-builder-toolbar-section">
            <button id="van-builder-toggle-grid" class="van-builder-button" title="Toggle Grid"><span class="dashicons dashicons-grid-view"></span></button>
            <button id="van-builder-toggle-measurements" class="van-builder-button" title="Toggle Measurements"><span class="dashicons dashicons-editor-code"></span></button>
        </div>
        
        <?php if ($allow_save && is_user_logged_in()): ?>
        <div class="van-builder-toolbar-section">
            <button id="van-builder-save" class="van-builder-button" title="Save Design"><span class="dashicons dashicons-saved"></span> Save</button>
            <button id="van-builder-load" class="van-builder-button" title="Load Design"><span class="dashicons dashicons-download"></span> Load</button>
        </div>
        <?php endif; ?>
        
        <div class="van-builder-toolbar-section">
            <button id="van-builder-screenshot" class="van-builder-button" title="Take Screenshot"><span class="dashicons dashicons-camera"></span></button>
            <button id="van-builder-fullscreen" class="van-builder-button" title="Fullscreen"><span class="dashicons dashicons-fullscreen-alt"></span></button>
        </div>
    </div>
    <?php endif; ?>
    
    <div class="van-builder-workspace">
        <div id="van-3d-canvas"></div>
        
        <?php if ($show_controls): ?>
        <div class="van-builder-sidebar">
            <div class="van-builder-accordion">
                <div class="van-builder-accordion-header active">Van Models</div>
                <div class="van-builder-accordion-content" style="display: block;">
                    <div class="van-builder-model-selector" id="van-models-container">
                        <!-- Van models will be loaded here via JavaScript -->
                    </div>
                </div>
                
                <div class="van-builder-accordion-header">Furniture</div>
                <div class="van-builder-accordion-content">
                    <div class="van-builder-category-filter">
                        <select id="furniture-category-filter">
                            <option value="all">All Categories</option>
                            <option value="kitchen">Kitchen</option>
                            <option value="sleeping">Sleeping</option>
                            <option value="storage">Storage</option>
                            <option value="bathroom">Bathroom</option>
                            <option value="furniture">Furniture</option>
                        </select>
                    </div>
                    <div class="van-builder-model-selector" id="furniture-models-container">
                        <!-- Furniture models will be loaded here via JavaScript -->
                    </div>
                </div>
                
                <div class="van-builder-accordion-header">Materials</div>
                <div class="van-builder-accordion-content">
                    <div class="van-builder-model-selector" id="materials-container">
                        <!-- Materials will be loaded here via JavaScript -->
                    </div>
                </div>
                
                <div class="van-builder-accordion-header">Object Properties</div>
                <div class="van-builder-accordion-content">
                    <div id="object-properties" class="van-builder-properties-panel">
                        <p class="no-selection-message">Select an object to edit its properties</p>
                        
                        <div class="property-group" style="display: none;">
                            <h4>Position</h4>
                            <div class="property-row">
                                <label for="position-x">X:</label>
                                <input type="number" id="position-x" step="0.01" class="property-input">
                            </div>
                            <div class="property-row">
                                <label for="position-y">Y:</label>
                                <input type="number" id="position-y" step="0.01" class="property-input">
                            </div>
                            <div class="property-row">
                                <label for="position-z">Z:</label>
                                <input type="number" id="position-z" step="0.01" class="property-input">
                            </div>
                        </div>
                        
                        <div class="property-group" style="display: none;">
                            <h4>Rotation</h4>
                            <div class="property-row">
                                <label for="rotation-x">X:</label>
                                <input type="range" id="rotation-x" min="0" max="360" value="0" class="property-slider">
                                <span class="property-value">0°</span>
                            </div>
                            <div class="property-row">
                                <label for="rotation-y">Y:</label>
                                <input type="range" id="rotation-y" min="0" max="360" value="0" class="property-slider">
                                <span class="property-value">0°</span>
                            </div>
                            <div class="property-row">
                                <label for="rotation-z">Z:</label>
                                <input type="range" id="rotation-z" min="0" max="360" value="0" class="property-slider">
                                <span class="property-value">0°</span>
                            </div>
                        </div>
                        
                        <div class="property-group" style="display: none;">
                            <h4>Scale</h4>
                            <div class="property-row">
                                <label for="scale-uniform">Uniform:</label>
                                <input type="checkbox" id="scale-uniform" checked class="property-checkbox">
                            </div>
                            <div class="property-row">
                                <label for="scale-x">X:</label>
                                <input type="number" id="scale-x" min="0.1" max="5" step="0.1" value="1" class="property-input">
                            </div>
                            <div class="property-row scale-non-uniform" style="display: none;">
                                <label for="scale-y">Y:</label>
                                <input type="number" id="scale-y" min="0.1" max="5" step="0.1" value="1" class="property-input">
                            </div>
                            <div class="property-row scale-non-uniform" style="display: none;">
                                <label for="scale-z">Z:</label>
                                <input type="number" id="scale-z" min="0.1" max="5" step="0.1" value="1" class="property-input">
                            </div>
                        </div>
                        
                        <div class="property-group" style="display: none;">
                            <h4>Material</h4>
                            <div class="property-row">
                                <label for="object-color">Color:</label>
                                <input type="color" id="object-color" value="#ffffff" class="property-color">
                            </div>
                            <div class="property-row">
                                <label for="object-material">Material:</label>
                                <select id="object-material" class="property-select">
                                    <option value="none">None</option>
                                    <!-- Materials will be added via JavaScript -->
                                </select>
                            </div>
                        </div>
                        
                        <div class="property-actions" style="display: none;">
                            <button id="duplicate-object" class="van-builder-button">Duplicate</button>
                            <button id="remove-object" class="van-builder-button">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>
    
    <?php if ($allow_save && is_user_logged_in()): ?>
    <!-- Save Design Modal -->
    <div id="save-design-modal" class="van-builder-modal">
        <div class="van-builder-modal-content">
            <span class="van-builder-modal-close">&times;</span>
            <h3>Save Design</h3>
            <form id="save-design-form">
                <div class="form-row">
                    <label for="design-name">Design Name:</label>
                    <input type="text" id="design-name" name="design-name" required>
                </div>
                <input type="hidden" id="design-id" name="design-id" value="0">
                <div class="form-actions">
                    <button type="submit" class="van-builder-button">Save</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Load Design Modal -->
    <div id="load-design-modal" class="van-builder-modal">
        <div class="van-builder-modal-content">
            <span class="van-builder-modal-close">&times;</span>
            <h3>Load Design</h3>
            <?php if (empty($saved_designs)): ?>
                <p>You don't have any saved designs yet.</p>
            <?php else: ?>
                <div class="saved-designs-list">
                    <?php foreach ($saved_designs as $design): ?>
                        <div class="saved-design-item" data-design-id="<?php echo esc_attr($design['id']); ?>">
                            <div class="saved-design-info">
                                <h4><?php echo esc_html($design['design_name']); ?></h4>
                                <p>Last modified: <?php echo esc_html(date('F j, Y g:i a', strtotime($design['updated_at']))); ?></p>
                            </div>
                            <div class="saved-design-actions">
                                <button class="load-design-button van-builder-button">Load</button>
                                <button class="delete-design-button van-builder-button">Delete</button>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
    <?php endif; ?>
</div>

<?php endif; // End user_can_access check ?>