<?php
/**
 * Main class for the van builder functionality
 */
class Van_Builder {
    
    public function __construct() {
        // Register AJAX handlers
        add_action('wp_ajax_save_van_design', array($this, 'save_van_design'));
        add_action('wp_ajax_load_van_design', array($this, 'load_van_design'));
        add_action('wp_ajax_delete_van_design', array($this, 'delete_van_design'));
        
        // Non-authenticated users can view designs but not save
        add_action('wp_ajax_nopriv_load_van_design', array($this, 'load_van_design'));
    }
    
    /**
     * Render the shortcode output
     */
    public static function render_shortcode($atts) {
        $atts = shortcode_atts(array(
            'width' => '100%',
            'height' => '600px',
            'default_van' => 'sprinter',
            'show_controls' => 'true',
            'allow_save' => 'true',
        ), $atts);
        
        ob_start();
        include VAN_BUILDER_PLUGIN_DIR . 'templates/van-builder-template.php';
        return ob_get_clean();
    }
    
    /**
     * Save a van design
     */
    public function save_van_design() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'van_builder_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }
        
        // Check if user is logged in
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => 'You must be logged in to save designs'));
        }
        
        $user_id = get_current_user_id();
        $design_name = sanitize_text_field($_POST['design_name']);
        $design_data = $_POST['design_data']; // This is JSON data
        $design_id = isset($_POST['design_id']) ? intval($_POST['design_id']) : 0;
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'van_builder_saved_designs';
        
        if ($design_id > 0) {
            // Update existing design
            $result = $wpdb->update(
                $table_name,
                array(
                    'design_name' => $design_name,
                    'design_data' => $design_data,
                    'updated_at' => current_time('mysql')
                ),
                array('id' => $design_id, 'user_id' => $user_id),
                array('%s', '%s', '%s'),
                array('%d', '%d')
            );
            
            if ($result === false) {
                wp_send_json_error(array('message' => 'Failed to update design'));
            }
        } else {
            // Insert new design
            $result = $wpdb->insert(
                $table_name,
                array(
                    'user_id' => $user_id,
                    'design_name' => $design_name,
                    'design_data' => $design_data,
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql')
                ),
                array('%d', '%s', '%s', '%s', '%s')
            );
            
            if ($result === false) {
                wp_send_json_error(array('message' => 'Failed to save design'));
            }
            
            $design_id = $wpdb->insert_id;
        }
        
        wp_send_json_success(array(
            'message' => 'Design saved successfully',
            'design_id' => $design_id
        ));
    }
    
    /**
     * Load a van design
     */
    public function load_van_design() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'van_builder_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }
        
        $design_id = isset($_POST['design_id']) ? intval($_POST['design_id']) : 0;
        
        if ($design_id <= 0) {
            wp_send_json_error(array('message' => 'Invalid design ID'));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'van_builder_saved_designs';
        
        $design = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE id = %d",
                $design_id
            )
        );
        
        if (!$design) {
            wp_send_json_error(array('message' => 'Design not found'));
        }
        
        // Check if current user owns this design or if it's public
        if (is_user_logged_in() && $design->user_id != get_current_user_id()) {
            // Check if design is shared publicly
            $is_public = get_post_meta($design_id, 'van_builder_design_public', true);
            if (!$is_public) {
                wp_send_json_error(array('message' => 'You do not have permission to view this design'));
            }
        }
        
        wp_send_json_success(array(
            'design' => $design
        ));
    }
    
    /**
     * Delete a van design
     */
    public function delete_van_design() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'van_builder_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }
        
        // Check if user is logged in
        if (!is_user_logged_in()) {
            wp_send_json_error(array('message' => 'You must be logged in to delete designs'));
        }
        
        $user_id = get_current_user_id();
        $design_id = isset($_POST['design_id']) ? intval($_POST['design_id']) : 0;
        
        if ($design_id <= 0) {
            wp_send_json_error(array('message' => 'Invalid design ID'));
        }
        
        global $wpdb;
        $table_name = $wpdb->prefix . 'van_builder_saved_designs';
        
        $result = $wpdb->delete(
            $table_name,
            array('id' => $design_id, 'user_id' => $user_id),
            array('%d', '%d')
        );
        
        if ($result === false) {
            wp_send_json_error(array('message' => 'Failed to delete design'));
        }
        
        wp_send_json_success(array(
            'message' => 'Design deleted successfully'
        ));
    }
}