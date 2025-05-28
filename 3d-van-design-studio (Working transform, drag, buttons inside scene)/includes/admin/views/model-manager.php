<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

$custom_models = Van_Builder_Models::get_custom_models();
$available_models = Van_Builder_Models::get_available_models();
?>
<div class="wrap">
    <h1>3D Van Designer Model Manager</h1>
    
    <div class="van-builder-model-uploader">
        <h2>Upload New Model</h2>
        <form id="van-model-upload-form" enctype="multipart/form-data">
            <table class="form-table">
                <tr>
                    <th scope="row"><label for="model_name">Model Name</label></th>
                    <td><input type="text" id="model_name" name="model_name" class="regular-text" required></td>
                </tr>
                <tr>
                    <th scope="row"><label for="model_category">Category</label></th>
                    <td>
                        <select id="model_category" name="model_category" required>
                            <option value="">Select Category</option>
                            <option value="furniture">Furniture</option>
                            <option value="kitchen">Kitchen</option>
                            <option value="bathroom">Bathroom</option>
                            <option value="storage">Storage</option>
                            <option value="electrical">Electrical</option>
                            <option value="plumbing">Plumbing</option>
                            <option value="other">Other</option>
                        </select>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="model_file">3D Model File</label></th>
                    <td>
                        <input type="file" id="model_file" name="model_file" accept=".glb,.gltf" required>
                        <p class="description">Upload a GLB or GLTF file. Max size: 10MB.</p>
                    </td>
                </tr>
                <tr>
                    <th scope="row"><label for="thumbnail">Thumbnail Image</label></th>
                    <td>
                        <input type="file" id="thumbnail" name="thumbnail" accept=".jpg,.jpeg,.png">
                        <p class="description">Optional thumbnail image. If not provided, a default will be used.</p>
                    </td>
                </tr>
            </table>
            
            <?php wp_nonce_field('van_builder_admin_nonce', 'van_builder_admin_nonce'); ?>
            <input type="hidden" name="action" value="upload_van_model">
            
            <p class="submit">
                <button type="submit" class="button button-primary" id="upload-model-button">Upload Model</button>
                <span class="spinner" id="upload-spinner" style="float: none; margin-top: 0;"></span>
            </p>
        </form>
    </div>
    
    <div class="van-builder-model-manager">
        <h2>Manage Models</h2>
        
        <h3>Default Models</h3>
        <div class="van-builder-model-grid">
            <?php foreach ($available_models['vans'] as $model): ?>
                <div class="van-builder-model-card">
                    <img src="<?php echo esc_url($model['thumbnail']); ?>" alt="<?php echo esc_attr($model['name']); ?>">
                    <h4><?php echo esc_html($model['name']); ?></h4>
                    <p>Type: Van</p>
                    <p class="model-actions">
                        <span class="default-model-badge">Default Model</span>
                    </p>
                </div>
            <?php endforeach; ?>
            
            <?php foreach ($available_models['furniture'] as $model): ?>
                <div class="van-builder-model-card">
                    <img src="<?php echo esc_url($model['thumbnail']); ?>" alt="<?php echo esc_attr($model['name']); ?>">
                    <h4><?php echo esc_html($model['name']); ?></h4>
                    <p>Category: <?php echo esc_html(ucfirst($model['category'])); ?></p>
                    <p class="model-actions">
                        <span class="default-model-badge">Default Model</span>
                    </p>
                </div>
            <?php endforeach; ?>
        </div>
        
        <h3>Custom Models</h3>
        <?php if (empty($custom_models)): ?>
            <p>No custom models have been uploaded yet.</p>
        <?php else: ?>
            <div class="van-builder-model-grid">
                <?php foreach ($custom_models as $model): ?>
                    <div class="van-builder-model-card" data-model-id="<?php echo esc_attr($model['id']); ?>">
                        <img src="<?php echo esc_url($model['thumbnail']); ?>" alt="<?php echo esc_attr($model['name']); ?>">
                        <h4><?php echo esc_html($model['name']); ?></h4>
                        <p>Category: <?php echo esc_html(ucfirst($model['category'])); ?></p>
                        <p>Added: <?php echo esc_html(date('F j, Y', strtotime($model['date_added']))); ?></p>
                        <p class="model-actions">
                            <a href="#" class="delete-model" data-model-id="<?php echo esc_attr($model['id']); ?>">Delete</a>
                        </p>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>
</div>