<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Get settings from same source as van-builder-template.php
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

<div class="van-builder-frontpage" style="width: <?php echo esc_attr($width); ?>; height: <?php echo esc_attr($height); ?>;">
    <div class="van-builder-frontpage-header">
        <h2>3D Van Design Studio</h2>
        <p>Create your dream van interior with our interactive 3D design tool</p>
    </div>
    
    <div class="van-builder-frontpage-content">
        <div class="van-builder-frontpage-section new-design">
            <h3>Start a New Design</h3>
            <div class="van-builder-model-selector">
                <?php 
                $available_models = Van_Builder_Models::get_available_models();
                foreach ($available_models['vans'] as $model): 
                ?>
                    <div class="van-builder-model-item van-builder-frontpage-model" data-model-id="<?php echo esc_attr($model['id']); ?>">
                        <img src="<?php echo esc_url($model['thumbnail']); ?>" alt="<?php echo esc_attr($model['name']); ?>">
                        <div class="van-builder-model-info">
                            <span class="van-builder-model-name"><?php echo esc_html($model['name']); ?></span>
                            <button class="van-builder-button van-builder-start-button" data-model-id="<?php echo esc_attr($model['id']); ?>">Start Design</button>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
        
        <?php if (is_user_logged_in() && $allow_save && !empty($saved_designs)): ?>
        <div class="van-builder-frontpage-section saved-designs">
            <h3>Your Saved Designs</h3>
            <div class="van-builder-saved-designs-list">
                <?php foreach ($saved_designs as $design): ?>
                    <div class="van-builder-saved-design-item" data-design-id="<?php echo esc_attr($design['id']); ?>">
                        <div class="van-builder-saved-design-info">
                            <h4><?php echo esc_html($design['design_name']); ?></h4>
                            <p class="van-builder-saved-design-date">Last modified: <?php echo esc_html(date('F j, Y g:i a', strtotime($design['updated_at']))); ?></p>
                        </div>
                        <div class="van-builder-saved-design-actions">
                            <button class="van-builder-button van-builder-continue-button" data-design-id="<?php echo esc_attr($design['id']); ?>">Continue Design</button>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php endif; // End user_can_access check ?>
