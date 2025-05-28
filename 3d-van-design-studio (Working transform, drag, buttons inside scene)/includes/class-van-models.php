<?php
/**
 * Class for managing van models
 */
class Van_Builder_Models {
    
    /**
     * Get all available van models
     */
    public static function get_available_models() {
        $models = array(
            'vans' => array(
                array(
                    'id' => 'sprinter',
                    'name' => 'Mercedes Sprinter',
                    'file' => VAN_BUILDER_MODELS_URL . 'vans/sprinter.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/vans/sprinter.png',
                    'dimensions' => array(
                        'length' => 6.0, // meters
                        'width' => 2.0,
                        'height' => 2.6
                    )
                ),
                array(
                    'id' => 'transit',
                    'name' => 'Ford Transit',
                    'file' => VAN_BUILDER_MODELS_URL . 'vans/transit.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/transit.jpg',
                    'dimensions' => array(
                        'length' => 5.9, // meters
                        'width' => 2.1,
                        'height' => 2.5
                    )
                ),
                array(
                    'id' => 'promaster',
                    'name' => 'Ram ProMaster',
                    'file' => VAN_BUILDER_MODELS_URL . 'vans/promaster.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/promaster.jpg',
                    'dimensions' => array(
                        'length' => 6.0, // meters
                        'width' => 2.05,
                        'height' => 2.6
                    )
                )
            ),
            'furniture' => array(
//kitchen//
                array(
                    'id' => 'oven',
                    'name' => 'Oven',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/kitchen/oven1.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/furniture/kitchen/oven1.png',
                    'category' => 'kitchen'
                ),   
                array(
                    'id' => 'induction-stove',
                    'name' => 'Induction Stove',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/kitchen/induction_stove_no.1.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/furniture/kitchen/induction_stove_no.1.png',
                    'category' => 'kitchen'
                ),
              array(
                    'id' => 'bar-style-fridge',
                    'name' => 'Bar Style Fridge',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/kitchen/beverages_refrigerator.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/furniture/kitchen/bar-style-fridge.png',
                    'category' => 'kitchen'
                ),
                array(
                    'id' => 'simple-kitchen-faucet',
                    'name' => 'Simple Faucet',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/kitchen/faucet-standard.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/furniture/kitchen/faucet-standard.png',
                    'category' => 'kitchen'
                ),
                array(
                    'id' => 'cushion',
                    'name' => 'Cushion',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/communal/cushion.obj',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/stove.jpg',
                    'category' => 'seating'
                ),
                array(
                    'id' => 'fridge',
                    'name' => 'Refrigerator',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/fridge.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/fridge.jpg',
                    'category' => 'kitchen'
                ),
                array(
                    'id' => 'toilet',
                    'name' => 'Portable Toilet',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/toilet.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/toilet.jpg',
                    'category' => 'bathroom'
                ),
                array(
                    'id' => 'shower',
                    'name' => 'Shower Unit',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/shower.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/shower.jpg',
                    'category' => 'bathroom'
                ),
                array(
                    'id' => 'table',
                    'name' => 'Folding Table',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/table.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/table.jpg',
                    'category' => 'furniture'
                ),
                array(
                    'id' => 'bench',
                    'name' => 'Seating Bench',
                    'file' => VAN_BUILDER_MODELS_URL . 'furniture/bench.glb',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/bench.jpg',
                    'category' => 'furniture'
                )
            ),
            'materials' => array(
                array(
                    'id' => 'walnut',
                    'name' => 'Walnut',
                    'texture' => VAN_BUILDER_ASSETS_URL . 'textures/walnut-wood.jpg',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/wood.jpg'
                ),
                array(
                    'id' => 'metal',
                    'name' => 'Metal',
                    'texture' => VAN_BUILDER_ASSETS_URL . 'textures/metal.jpg',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/metal.jpg'
                ),
                array(
                    'id' => 'fabric',
                    'name' => 'Fabric',
                    'texture' => VAN_BUILDER_ASSETS_URL . 'textures/fabric.jpg',
                    'thumbnail' => VAN_BUILDER_ASSETS_URL . 'images/thumbnails/fabric.jpg'
                )
            )
        );
        
        // Allow plugins/themes to modify the models
        return apply_filters('van_builder_available_models', $models);
    }
    
    /**
     * Get custom user-uploaded models
     */
    public static function get_custom_models() {
        $custom_models = get_option('van_builder_custom_models', array());
        return apply_filters('van_builder_custom_models', $custom_models);
    }
    
    /**
     * Add a custom model
     */
    public static function add_custom_model($model_data) {
        $custom_models = self::get_custom_models();
        $custom_models[] = $model_data;
        update_option('van_builder_custom_models', $custom_models);
        return true;
    }
}