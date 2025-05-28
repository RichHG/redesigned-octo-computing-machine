<?php
/**
 * Class for managing 3D models in the admin
 */
class Van_Builder_Model_Manager {
    
    public function __construct() {
        add_action('wp_ajax_upload_van_model', array($this, 'upload_van_model'));
        add_action('wp_ajax_delete_van_model', array($this, 'delete_van_model'));
    }
    
    /**
     * Handle model upload
     */
    public function upload_van_model() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'van_builder_admin_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'You do not have permission to upload models'));
        }
        
        // Check if file was uploaded
        if (!isset($_FILES['model_file']) || $_FILES['model_file']['error'] !== UPLOAD_ERR_OK) {
            wp_send_json_error(array('message' => 'No file uploaded or upload error'));
        }
        
        $model_name = sanitize_text_field($_POST['model_name']);
        $model_category = sanitize_text_field($_POST['model_category']);
        
        // Get file extension
        $file_info = pathinfo($_FILES['model_file']['name']);
        $extension = strtolower($file_info['extension']);
        
        // Check file type
        $allowed_types = array('glb', 'gltf');
        if (!in_array($extension, $allowed_types)) {
            wp_send_json_error(array('message' => 'Invalid file type. Only GLB and GLTF files are allowed.'));
        }
        
        // Upload directory
        $upload_dir = wp_upload_dir();
        $models_dir = $upload_dir['basedir'] . '/van-builder-models/' . $model_category;
        
        // Create directory if it doesn't exist
        if (!file_exists($models_dir)) {
        wp_mkdir_p($models_dir);
        }
        
        // Generate unique filename
        $filename = sanitize_file_name($model_name) . '-' . uniqid() . '.' . $extension;
        $file_path = $models_dir . '/' . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($_FILES['model_file']['tmp_name'], $file_path)) {
            wp_send_json_error(array('message' => 'Failed to upload file'));
        }
        
        // Handle thumbnail upload if present
        $thumbnail_url = '';
        if (isset($_FILES['thumbnail']) && $_FILES['thumbnail']['error'] === UPLOAD_ERR_OK) {
            $thumbnail_info = pathinfo($_FILES['thumbnail']['name']);
            $thumb_ext = strtolower($thumbnail_info['extension']);
            
            // Check thumbnail type
            $allowed_thumb_types = array('jpg', 'jpeg', 'png');
            if (in_array($thumb_ext, $allowed_thumb_types)) {
                $thumb_filename = sanitize_file_name($model_name) . '-thumb-' . uniqid() . '.' . $thumb_ext;
                $thumb_path = $models_dir . '/' . $thumb_filename;
                
                if (move_uploaded_file($_FILES['thumbnail']['tmp_name'], $thumb_path)) {
                    $thumbnail_url = $upload_dir['baseurl'] . '/van-builder-models/' . $model_category . '/' . $thumb_filename;
                }
            }
        }
        
        // If no thumbnail was uploaded or upload failed, use default
        if (empty($thumbnail_url)) {
            $thumbnail_url = VAN_BUILDER_ASSETS_URL . 'images/thumbnails/default.jpg';
        }
        
        // Add model to custom models list
        $model_data = array(
            'id' => sanitize_title($model_name) . '-' . uniqid(),
            'name' => $model_name,
            'file' => $upload_dir['baseurl'] . '/van-builder-models/' . $model_category . '/' . $filename,
            'thumbnail' => $thumbnail_url,
            'category' => $model_category,
            'custom' => true,
            'date_added' => current_time('mysql')
        );
        
        Van_Builder_Models::add_custom_model($model_data);
        
        wp_send_json_success(array(
            'message' => 'Model uploaded successfully',
            'model' => $model_data
        ));
    }
    
    /**
     * Delete a custom model
     */
    public function delete_van_model() {
        // Check nonce
        if (!isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'van_builder_admin_nonce')) {
            wp_send_json_error(array('message' => 'Security check failed'));
        }
        
        // Check permissions
        if (!current_user_can('manage_options')) {
            wp_send_json_error(array('message' => 'You do not have permission to delete models'));
        }
        
        $model_id = sanitize_text_field($_POST['model_id']);
        
        // Get custom models
        $custom_models = Van_Builder_Models::get_custom_models();
        
        // Find the model to delete
        $model_index = -1;
        $model_to_delete = null;
        
        foreach ($custom_models as $index => $model) {
            if ($model['id'] === $model_id) {
                $model_index = $index;
                $model_to_delete = $model;
                break;
            }
        }
        
        if ($model_index === -1) {
            wp_send_json_error(array('message' => 'Model not found'));
        }
        
        // Delete the model file
        $model_file_path = str_replace(site_url('/'), ABSPATH, $model_to_delete['file']);
        if (file_exists($model_file_path)) {
            unlink($model_file_path);
        }
        
        // Delete the thumbnail if it's not the default
        if (strpos($model_to_delete['thumbnail'], 'default.jpg') === false) {
            $thumb_file_path = str_replace(site_url('/'), ABSPATH, $model_to_delete['thumbnail']);
            if (file_exists($thumb_file_path)) {
                unlink($thumb_file_path);
            }
        }
        
        // Remove from the array
        array_splice($custom_models, $model_index, 1);
        
        // Update the option
        update_option('van_builder_custom_models', $custom_models);
        
        wp_send_json_success(array(
            'message' => 'Model deleted successfully'
        ));
    }
}