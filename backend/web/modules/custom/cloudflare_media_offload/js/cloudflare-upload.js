/**
 * @file
 * JavaScript for Cloudflare upload functionality.
 */

(function ($, Drupal) {
  'use strict';

  /**
   * Cloudflare upload behavior.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.cloudflareUpload = {
    attach: function (context, settings) {
      $(context).find('.cloudflare-upload-field').each(function () {
        var $field = $(this);
        
        // Manual once implementation
        if ($field.hasClass('cloudflare-upload-processed')) {
          return;
        }
        $field.addClass('cloudflare-upload-processed');
        var $input = $field.find('input[type="file"]');
        
        $input.on('change', function () {
          var files = this.files;
          if (files.length > 0) {
            // Add visual feedback for upload
            $field.addClass('uploading');
            
            // You can add progress indicators here
            setTimeout(function () {
              $field.removeClass('uploading').addClass('upload-complete');
            }, 2000);
          }
        });
      });
    }
  };

})(jQuery, Drupal);