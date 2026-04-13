/**
 * @file
 * JavaScript for bulk upload functionality.
 */

(function ($, Drupal) {
  'use strict';

  /**
   * Bulk upload behavior.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.cloudflareBulkUpload = {
    attach: function (context, settings) {
      var $dropzone = $(context).find('.bulk-upload-dropzone');
      
      // Manual once implementation
      $dropzone = $dropzone.filter(function() {
        return !$(this).hasClass('bulk-upload-processed');
      });
      $dropzone.addClass('bulk-upload-processed');
      
      if ($dropzone.length === 0) {
        return;
      }

      var $fileInput = $dropzone.find('#bulk-upload-files');
      var $submitButton = $('#bulk-upload-submit');
      var selectedFiles = [];

      // Handle drag and drop
      $dropzone.on('dragover dragenter', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $dropzone.addClass('dragover');
      });

      $dropzone.on('dragleave dragend', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $dropzone.removeClass('dragover');
      });

      $dropzone.on('drop', function (e) {
        e.preventDefault();
        e.stopPropagation();
        $dropzone.removeClass('dragover');
        
        var files = e.originalEvent.dataTransfer.files;
        handleFiles(files);
      });

      // Handle file input change
      $fileInput.on('change', function () {
        handleFiles(this.files);
      });

      // Click to browse
      $dropzone.on('click', function (e) {
        if (e.target === this || $(e.target).hasClass('dropzone-text')) {
          $fileInput.click();
        }
      });

      /**
       * Handle selected files.
       *
       * @param {FileList} files
       *   The selected files.
       */
      function handleFiles(files) {
        selectedFiles = Array.from(files);
        
        if (selectedFiles.length > 0) {
          $submitButton.prop('disabled', false);
          updateFileList();
        } else {
          $submitButton.prop('disabled', true);
        }
      }

      /**
       * Update the file list display.
       */
      function updateFileList() {
        var $fileList = $dropzone.find('.file-list');
        
        if ($fileList.length === 0) {
          $fileList = $('<div class="file-list"></div>');
          $dropzone.append($fileList);
        }
        
        $fileList.empty();
        
        $.each(selectedFiles, function (index, file) {
          var $fileItem = $('<div class="file-item">' +
            '<span class="file-name">' + file.name + '</span>' +
            '<span class="file-size">(' + formatFileSize(file.size) + ')</span>' +
            '<button type="button" class="remove-file" data-index="' + index + '">×</button>' +
            '</div>');
          
          $fileList.append($fileItem);
        });
        
        $dropzone.find('.dropzone-text').text(
          selectedFiles.length + ' file(s) selected. Click to add more or drop here.'
        );
      }

      /**
       * Format file size for display.
       *
       * @param {number} bytes
       *   The file size in bytes.
       *
       * @return {string}
       *   The formatted file size.
       */
      function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
      }

      // Handle file removal
      $dropzone.on('click', '.remove-file', function () {
        var index = parseInt($(this).data('index'));
        selectedFiles.splice(index, 1);
        
        if (selectedFiles.length === 0) {
          $submitButton.prop('disabled', true);
          $dropzone.find('.file-list').remove();
          $dropzone.find('.dropzone-text').text('Drag files here or click to browse');
        } else {
          updateFileList();
        }
      });
    }
  };

})(jQuery, Drupal);