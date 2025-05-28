<?php
/**
 * Admin settings page for the van builder
 */
class Van_Builder_Admin_Settings {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Add admin menu pages
     */
    public function add_admin_menu() {
        add_menu_page(
            '3D Van Designer',
            '3D Van Designer',
            'manage_options',
            'van-builder-settings',
            array($this, 'render_settings_page'),
            'dashicons-car',
            30
        );
        
        add_submenu_page(
            'van-builder-settings',
            'Settings',
            'Settings',
            'manage_options',
            'van-builder-settings',
            array($this, 'render_settings_page')
        );
        
        add_submenu_page(
            'van-builder-settings',
            'Manage Models',
            'Manage Models',
            'manage_options',
            'van-builder-models',
            array($this, 'render_models_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('van_builder_settings', 'van_builder_general_settings');
        
        add_settings_section(
            'van_builder_general_section',
            'General Settings',
            array($this, 'general_section_callback'),
            'van_builder_settings'
        );
        
        add_settings_field(
            'default_van_model',
            'Default Van Model',
            array($this, 'default_van_model_callback'),
            'van_builder_settings',
            'van_builder_general_section'
        );
        
        add_settings_field(
            'canvas_size',
            'Default Canvas Size',
            array($this, 'canvas_size_callback'),
            'van_builder_settings',
            'van_builder_general_section'
        );
        
        add_settings_field(
            'allow_guest_designs',
            'Allow Guest Designs',
            array($this, 'allow_guest_designs_callback'),
            'van_builder_settings',
            'van_builder_general_section'
        );
    }
    
    /**
     * General section description
     */
    public function general_section_callback() {
        echo '<p>Configure the general settings for the 3D Van Designer.</p>';
    }
    
    /**
     * Default van model field
     */
    public function default_van_model_callback() {
        $options = get_option('van_builder_general_settings');
        $default_van = isset($options['default_van_model']) ? $options['default_van_model'] : 'sprinter';
        
        $models = Van_Builder_Models::get_available_models();
        $van_models = $models['vans'];
        
        echo '<select name="van_builder_general_settings[default_van_model]">';
        foreach ($van_models as $model) {
            echo '<option value="' . esc_attr($model['id']) . '" ' . selected($default_van, $model['id'], false) . '>' . esc_html($model['name']) . '</option>';
        }
        echo '</select>';
    }
    
    /**
     * Canvas size field
     */
    public function canvas_size_callback() {
        $options = get_option('van_builder_general_settings');
        $width = isset($options['canvas_width']) ? $options['canvas_width'] : '100%';
        $height = isset($options['canvas_height']) ? $options['canvas_height'] : '600px';
        
        echo '<label>Width: <input type="text" name="van_builder_general_settings[canvas_width]" value="' . esc_attr($width) . '" /></label>';
        echo '<label style="margin-left: 15px;">Height: <input type="text" name="van_builder_general_settings[canvas_height]" value="' . esc_attr($height) . '" /></label>';
        echo '<p class="description">You can use px, %, or vh/vw units.</p>';
    }
    
    /**
     * Allow guest designs field
     */
    public function allow_guest_designs_callback() {
        $options = get_option('van_builder_general_settings');
        $allow_guests = isset($options['allow_guest_designs']) ? $options['allow_guest_designs'] : '0';
        
        echo '<label><input type="checkbox" name="van_builder_general_settings[allow_guest_designs]" value="1" ' . checked('1', $allow_guests, false) . ' /> Allow non-logged in users to create designs (they cannot save)</label>';
    }
    
    /**
     * Render the settings page
     */
    public function render_settings_page() {
        include VAN_BUILDER_PLUGIN_DIR . 'includes/admin/views/settings-page.php';
    }
    
    /**
     * Render the models management page
     */
    public function render_models_page() {
        include VAN_BUILDER_PLUGIN_DIR . 'includes/admin/views/model-manager.php';
    }
}