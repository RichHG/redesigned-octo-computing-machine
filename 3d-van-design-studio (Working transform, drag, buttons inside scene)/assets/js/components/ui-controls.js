/**
 * UI Controls component for the Van Builder
 */
class UIControls {
    constructor(vanBuilder) {
        this.vanBuilder = vanBuilder;
        this.init();
    }

    init() {
        // Set up accordion functionality
        this.setupAccordion();

        // Set up modal functionality
        this.setupModals();
    }

    setupAccordion() {
        jQuery('.van-builder-accordion').on('click', '.van-builder-accordion-header', function () {
            jQuery(this).toggleClass('active');
            jQuery(this).next('.van-builder-accordion-content').slideToggle(200);
        });
    }

    setupModals() {
        jQuery('.van-builder-modal-close, .van-builder-modal').on('click', function (e) {
            if (e.target === this) {
                jQuery(this).closest('.van-builder-modal').hide();
            }
        });

        // Prevent clicks inside modal content from closing the modal
        jQuery('.van-builder-modal-content').on('click', function (e) {
            e.stopPropagation();
        });
    }

    updateObjectProperties(object) {
        if (!object) return;

        // Show property groups
        jQuery('.property-group, .property-actions').show();
        jQuery('.no-selection-message').hide();

        // Update position inputs
        jQuery('#position-x').val(object.position.x.toFixed(2));
        jQuery('#position-y').val(object.position.y.toFixed(2));
        jQuery('#position-z').val(object.position.z.toFixed(2));

        // Update rotation inputs
        const rotX = (object.rotation.x * 180 / Math.PI) % 360;
        const rotY = (object.rotation.y * 180 / Math.PI) % 360;
        const rotZ = (object.rotation.z * 180 / Math.PI) % 360;

        jQuery('#rotation-x').val(rotX.toFixed(0));
        jQuery('#rotation-y').val(rotY.toFixed(0));
        jQuery('#rotation-z').val(rotZ.toFixed(0));

        // Update scale inputs
        jQuery('#scale-x').val(object.scale.x.toFixed(2));
        jQuery('#scale-y').val(object.scale.y.toFixed(2));
        jQuery('#scale-z').val(object.scale.z.toFixed(2));
    }

    clearObjectProperties() {
        // Hide property groups
        jQuery('.property-group, .property-actions').hide();
        jQuery('.no-selection-message').show();

        // Clear all input values
        jQuery('#position-x, #position-y, #position-z').val('0.00');
        jQuery('#rotation-x, #rotation-y, #rotation-z').val('0');
        jQuery('#scale-x, #scale-y, #scale-z').val('1.00');
    }

    openSaveModal() {
        jQuery('#save-design-modal').show();
    }

    openLoadModal() {
        jQuery('#load-design-modal').show();
    }
}