<?php
// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}
?>
<div class="wrap">
    <h1>3D Van Designer Settings</h1>
    
    <form method="post" action="options.php">
        <?php
        settings_fields('van_builder_settings');
        do_settings_sections('van_builder_settings');
        submit_button();
        ?>
    </form>
    
    <div class="van-builder-info-box">
        <h2>How to Use the Van Designer</h2>
        <p>To add the 3D Van Designer to any page or post, use the following shortcode:</p>
        <code>[van_builder]</code>
        
        <p>You can customize the shortcode with these attributes:</p>
        <ul>
            <li><code>width</code> - Width of the canvas (default: 100%)</li>
            <li><code>height</code> - Height of the canvas (default: 600px)</li>
            <li><code>default_van</code> - Default van model to load (default: sprinter)</li>
            <li><code>show_controls</code> - Show control panel (true/false, default: true)</li>
            <li><code>allow_save</code> - Allow users to save designs (true/false, default: true)</li>
        </ul>
        
        <p>Example with custom attributes:</p>
        <code>[van_builder width="800px" height="500px" default_van="transit" show_controls="true"]</code>
    </div>
    
    <div class="van-builder-info-box">
        <h2>Support</h2>
        <p>For support or feature requests, please contact Rich Maw at <a href="https://vanversion.com/contact">vanversion.com/contact</a>.</p>
    </div>
</div>