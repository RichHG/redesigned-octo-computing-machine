<?php
/**
 * Plugin Name: 3D Van Design Studio
 * Description: Interactive 3D van customization tool for designing van interiors
 * Version: 1.0.0
 * Author: Rich Maw
 * Author URI: https://vanversion.com
 * Text Domain: 3d-van-design-studio
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('VAN_BUILDER_VERSION', '1.0.0');
define('VAN_BUILDER_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('VAN_BUILDER_PLUGIN_URL', plugin_dir_url(__FILE__));
define('VAN_BUILDER_ASSETS_URL', VAN_BUILDER_PLUGIN_URL . 'assets/');
define('VAN_BUILDER_MODELS_URL', VAN_BUILDER_ASSETS_URL . 'models/');

// Include required files
require_once VAN_BUILDER_PLUGIN_DIR . 'includes/class-assets.php';
require_once VAN_BUILDER_PLUGIN_DIR . 'includes/class-van-models.php';
require_once VAN_BUILDER_PLUGIN_DIR . 'includes/class-van-builder.php';

// Admin includes
if (is_admin()) {
    require_once VAN_BUILDER_PLUGIN_DIR . 'includes/admin/class-admin-settings.php';
    require_once VAN_BUILDER_PLUGIN_DIR . 'includes/admin/class-model-manager.php';
}

/**
 * Initialize the plugin
 */
function van_builder_init() {
    // Initialize classes
    new Van_Builder_Assets();
    new Van_Builder_Models();
    new Van_Builder();

    if (is_admin()) {
        new Van_Builder_Admin_Settings();
        new Van_Builder_Model_Manager();
    }

    // Register shortcode
    add_shortcode('van_builder', array('Van_Builder', 'render_shortcode'));
}
add_action('plugins_loaded', 'van_builder_init');

/**
 * Plugin activation hook
 */
function van_builder_activate() {
    global $wpdb;

    $table_name = $wpdb->prefix . 'van_builder_saved_designs';
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        user_id mediumint(9) NOT NULL,
        design_name varchar(100) NOT NULL,
        design_data longtext NOT NULL,
        created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
        PRIMARY KEY  (id)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);

    // Create upload directory for user models if it doesn't exist
    $upload_dir = wp_upload_dir();
    $models_dir = $upload_dir['basedir'] . '/van-builder-models';

    if (!file_exists($models_dir)) {
        wp_mkdir_p($models_dir);
    }
}
register_activation_hook(__FILE__, 'van_builder_activate');