/**
 * @file
 * JavaScript for responsive images functionality.
 */

(function ($, Drupal) {
  'use strict';

  /**
   * Responsive images behavior for Cloudflare.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.cloudflareResponsiveImages = {
    attach: function (context, settings) {
      $(context).find('img[data-cloudflare-id]').each(function () {
        // Manual once implementation
        if ($(this).hasClass('cloudflare-responsive-processed')) {
          return;
        }
        $(this).addClass('cloudflare-responsive-processed');
        var $img = $(this);
        var cloudflareId = $img.data('cloudflare-id');
        var accountId = $img.data('account-id');
        
        if (!cloudflareId || !accountId) {
          return;
        }

        // Update src based on container width
        function updateImageSrc() {
          var containerWidth = $img.parent().width();
          var devicePixelRatio = window.devicePixelRatio || 1;
          var targetWidth = Math.ceil(containerWidth * devicePixelRatio);
          
          // Round to common sizes for better caching
          var sizes = [320, 640, 768, 1024, 1280, 1920];
          var optimalWidth = sizes.find(function(size) {
            return size >= targetWidth;
          }) || sizes[sizes.length - 1];
          
          var newSrc = 'https://imagedelivery.net/' + accountId + '/' + cloudflareId + '/width=' + optimalWidth;
          
          if ($img.attr('src') !== newSrc) {
            $img.attr('src', newSrc);
          }
        }

        // Update on load and resize
        updateImageSrc();
        $(window).on('resize.cloudflare-responsive', $.debounce(250, updateImageSrc));
      });
    },
    
    detach: function (context, settings, trigger) {
      if (trigger === 'unload') {
        $(window).off('resize.cloudflare-responsive');
      }
    }
  };

  /**
   * Simple debounce function.
   *
   * @param {number} wait
   *   Milliseconds to wait.
   * @param {Function} func
   *   Function to debounce.
   *
   * @return {Function}
   *   The debounced function.
   */
  $.debounce = function(wait, func) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        func.apply(context, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

})(jQuery, Drupal);