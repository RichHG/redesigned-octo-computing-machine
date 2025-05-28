/**
 * Admin scripts for the Van Builder
 */
(function($) {
    'use strict';
    
    $(document).ready(function() {
        // Model upload form handling
        const uploadForm = $('#van-model-upload-form');
        
        if (uploadForm.length) {
            uploadForm.on('submit', function(e) {
                e.preventDefault();
                
                // Show spinner
                $('#upload-spinner').css('display', 'inline-block');
                $('#upload-model-button').prop('disabled', true);
                
                // Create FormData object
                const formData = new FormData(this);
                
                // Send AJAX request
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: formData,
                    processData: false,
                    contentType: false,
                    success: function(response) {
                        // Hide spinner
                        $('#upload-spinner').hide();
                        $('#upload-model-button').prop('disabled', false);
                        
                        if (response.success) {
                            // Show success message
                            alert('Model uploaded successfully!');
                            
                            // Reset form
                            uploadForm[0].reset();
                            
                            // Add the new model to the grid
                            const model = response.data.model;
                            const modelCard = `
                                <div class="van-builder-model-card" data-model-id="${model.id}">
                                    <img src="${model.thumbnail}" alt="${model.name}">
                                    <h4>${model.name}</h4>
                                    <p>Category: ${capitalizeFirstLetter(model.category)}</p>
                                    <p>Added: ${new Date().toLocaleDateString()}</p>
                                    <p class="model-actions">
                                        <a href="#" class="delete-model" data-model-id="${model.id}">Delete</a>
                                    </p>
                                </div>
                            `;
                            
                            // If this is the first custom model, remove the "no models" message
                            if ($('.van-builder-model-grid').length === 0) {
                                $('.van-builder-model-manager h3:last').after('<div class="van-builder-model-grid"></div>');
                            }
                            
                            $('.van-builder-model-grid:last').prepend(modelCard);
                        } else {
                            // Show error message
                            alert('Error: ' + response.data.message);
                        }
                    },
                    error: function() {
                        // Hide spinner
                        $('#upload-spinner').hide();
                        $('#upload-model-button').prop('disabled', false);
                        
                        // Show error message
                        alert('An error occurred while uploading the model. Please try again.');
                    }
                });
            });
        }
        
        // Delete model handling
        $('.van-builder-model-manager').on('click', '.delete-model', function(e) {
            e.preventDefault();
            
            const modelId = $(this).data('model-id');
            const modelCard = $(this).closest('.van-builder-model-card');
            
            if (confirm('Are you sure you want to delete this model? This action cannot be undone.')) {
                // Send AJAX request
                $.ajax({
                    url: ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'delete_van_model',
                        nonce: $('#van_builder_admin_nonce').val(),
                        model_id: modelId
                    },
                    success: function(response) {
                        if (response.success) {
                            // Remove the model card
                            modelCard.fadeOut(300, function() {
                                $(this).remove();
                                
                                // If no more custom models, show message
                                if ($('.van-builder-model-grid:last .van-builder-model-card').length === 0) {
                                    $('.van-builder-model-grid:last').html('<p>No custom models have been uploaded yet.</p>');
                                }
                            });
                        } else {
                            // Show error message
                            alert('Error: ' + response.data.message);
                        }
                    },
                    error: function() {
                        // Show error message
                        alert('An error occurred while deleting the model. Please try again.');
                    }
                });
            }
        });
        
        // Helper function to capitalize first letter
        function capitalizeFirstLetter(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
    });
    
})(jQuery);