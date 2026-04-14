# Cloudflare Media Offload

A comprehensive Drupal module that provides seamless integration between Drupal's Media module and Cloudflare Images for offloading image media storage and serving.

## Features

- **Seamless Integration**: Works with Drupal's existing Media module
- **Secure Credential Management**: Uses the Key module for encrypted API credential storage
- **Flysystem Adapter**: Implements a custom `cloudflare://` stream wrapper
- **Bulk Upload**: Drag-and-drop interface for uploading multiple images
- **Image Transformations**: Support for Cloudflare's on-the-fly image optimizations
- **Migration Tools**: Drush commands for migrating existing media to Cloudflare
- **Queue System**: Background processing for reliable uploads with retry logic
- **Responsive Images**: Automatic responsive image generation
- **Error Handling**: Comprehensive logging and fallback mechanisms

## Requirements

- Drupal 10 || 11
- PHP 8.1+
- Key module
- Flysystem library
- Guzzle HTTP Client
- Active Cloudflare account with Images enabled

## Installation

1. Install via Composer:
   ```bash
   composer require drupal/cloudflare_media_offload
   ```

2. Enable the module:
   ```bash
   drush en cloudflare_media_offload
   ```

3. Configure your Cloudflare credentials using the Key module.

## Configuration

1. **API Credentials**:
   - Navigate to Configuration > System > Keys
   - Create keys for your Cloudflare API token and Account ID
   - Go to Configuration > Media > Cloudflare Media Offload
   - Select your keys and test the connection

2. **Media Bundles**:
   - Select which media bundles should be offloaded to Cloudflare
   - Configure upload limits and supported formats

3. **Features**:
   - Enable auto-optimization, bulk uploads, and other features as needed

4. **Webhook Configuration (Optional)**:
   - Set up webhook secret for enhanced monitoring and reliability
   - See [Webhook Setup](#webhook-setup) section below for detailed instructions

## Usage

### Single Uploads
- Use the standard media upload forms
- Files will automatically upload to Cloudflare for enabled bundles

### Bulk Uploads
- Navigate to `/media/cloudflare-bulk-upload`
- Drag and drop multiple images or use the file browser
- Select the target media bundle and upload

### Migration
Use Drush commands to migrate existing media:

```bash
# Test connection
drush cloudflare:test-connection

# Migrate all enabled bundles
drush cloudflare:migrate

# Migrate specific bundle
drush cloudflare:migrate --bundle=image

# Dry run to see what would be migrated
drush cloudflare:migrate --dry-run

# View statistics
drush cloudflare:stats

# Process queue
drush cloudflare:process-queue
```

## Permissions

- **Administer Cloudflare Media Offload**: Configure settings and credentials
- **Upload media to Cloudflare**: Upload single images
- **Bulk upload media to Cloudflare**: Access bulk upload form
- **View Cloudflare media logs**: View operation logs
- **Migrate media to Cloudflare**: Run migration tools

## Architecture

### Flysystem Integration
The module implements a custom Flysystem adapter that creates a `cloudflare://` stream wrapper. This allows Drupal to treat Cloudflare as a remote file system.

### Queue System
Failed uploads are queued for retry processing to ensure 100% reliability. The queue can be processed via cron or manually using Drush commands.

### Error Handling
- Comprehensive logging of all operations
- Fallback to local storage on API failures
- Retry mechanism with exponential backoff
- Status reporting and monitoring

## Security

- API credentials stored securely using the Key module
- HTTPS-only API communications
- Input validation and sanitization
- CSRF protection on all forms
- Audit logging of all operations

## Webhook Setup

Webhooks provide real-time notifications from Cloudflare about image processing events, enhancing reliability and providing better monitoring capabilities.

### What Webhooks Provide

- **Upload Confirmation**: Receive notifications when images are successfully processed by Cloudflare
- **Error Notifications**: Get immediate alerts if image processing fails
- **Processing Status**: Monitor the status of image transformations and optimizations
- **Enhanced Reliability**: Automatic retry and error handling based on webhook feedback
- **Audit Trail**: Complete log of all image operations with timestamps

### Setting Up Webhooks

#### 1. Configure Webhook Secret

1. **Generate a Secret**: Create a strong, random string to verify webhook authenticity
   ```bash
   # Generate a secure random string
   openssl rand -hex 32
   ```

2. **Add to Module Configuration**:
   - Go to Configuration > Media > Cloudflare Media Offload
   - Enter your webhook secret in the "Webhook Secret" field
   - Save the configuration

#### 2. Set Up Cloudflare Webhook

1. **Log into Cloudflare Dashboard**
2. **Navigate to Images**: Go to your domain > Images
3. **Configure Webhook**:
   - Go to Settings > Notifications
   - Add a new webhook endpoint: `https://yoursite.com/cloudflare-media-offload/webhook`
   - Enter the same secret you configured in the module
   - Select events to monitor:
     - `images.uploaded` - Image successfully uploaded
     - `images.failed` - Image processing failed
     - `images.ready` - Image transformations completed

#### 3. Webhook Endpoint

The module automatically provides a webhook endpoint at:
```
https://yoursite.com/cloudflare-media-offload/webhook
```

This endpoint:
- ✅ **Validates signatures** using your webhook secret
- ✅ **Processes events** and updates local records
- ✅ **Logs all activity** for monitoring
- ✅ **Triggers retries** for failed operations
- ✅ **Updates media status** in real-time

### Webhook Events Handled

| Event | Description | Module Action |
|-------|-------------|---------------|
| `images.uploaded` | Image successfully uploaded | Mark media as confirmed, log success |
| `images.failed` | Image processing failed | Queue for retry, log error details |
| `images.ready` | Transformations completed | Update variant URLs, clear cache |
| `images.deleted` | Image removed from Cloudflare | Update local records, cleanup |

### Benefits of Using Webhooks

#### Enhanced Reliability
- **Automatic Retry**: Failed uploads are automatically retried based on webhook feedback
- **Status Synchronization**: Local database stays in sync with Cloudflare
- **Error Detection**: Immediate notification of processing issues

#### Better Monitoring
- **Real-time Updates**: Know immediately when operations complete
- **Detailed Logging**: Complete audit trail of all image operations
- **Performance Insights**: Track upload and processing times

#### Improved User Experience
- **Faster Feedback**: Users see status updates in real-time
- **Reduced Errors**: Proactive handling of failed operations
- **Better Diagnostics**: Detailed error messages for troubleshooting

### Security Considerations

- **Secret Validation**: All webhook requests are validated using HMAC signatures
- **HTTPS Required**: Webhook endpoint only accepts secure HTTPS connections
- **IP Filtering**: Optionally restrict webhooks to Cloudflare IP ranges
- **Rate Limiting**: Built-in protection against webhook spam

### Monitoring Webhooks

Check webhook activity in several ways:

1. **Logs**: View detailed webhook logs at Reports > Recent log messages
2. **Drush**: Monitor webhook status with `drush cloudflare:stats`
3. **Status Page**: Check webhook health at Configuration > System > Status report

### Testing Webhooks

Test your webhook configuration:

```bash
# Test webhook endpoint manually
curl -X POST https://yoursite.com/cloudflare-media-offload/webhook \
  -H "Content-Type: application/json" \
  -H "X-Cloudflare-Signature: your-test-signature" \
  -d '{"test": true}'
```

## Troubleshooting

### Connection Issues
1. Verify your API token and Account ID are correct
2. Check that your Cloudflare account has Images enabled
3. Ensure your server can make HTTPS requests to api.cloudflare.com

### Upload Failures
1. Check the logs at Reports > Recent log messages
2. Verify file size and format requirements
3. Check queue status with `drush cloudflare:stats`

### Migration Issues
1. Run migrations in smaller batches using `--batch-size`
2. Use `--dry-run` to preview what will be migrated
3. Check available disk space for temporary file processing

### Webhook Issues
1. **Webhook Not Receiving Events**: 
   - Verify your webhook URL is accessible from the internet
   - Check Cloudflare webhook configuration includes your endpoint
   - Ensure webhook secret matches between Cloudflare and module

2. **Signature Validation Failing**:
   - Confirm webhook secret is identical in both locations
   - Check for whitespace or encoding issues in the secret
   - Verify webhook endpoint is receiving POST requests

3. **Events Not Processing**:
   - Check webhook logs for detailed error messages
   - Verify media entities exist for the referenced image IDs
   - Ensure proper permissions for webhook processing

## API Reference

### Services
- `cloudflare_media_offload.api_client`: Cloudflare API client
- `cloudflare_media_offload.flysystem_adapter`: Flysystem adapter
- `cloudflare_media_offload.media_subscriber`: Media entity event subscriber

### Hooks
- `hook_entity_presave()`: Intercepts media saves for upload
- `hook_file_url_alter()`: Rewrites Cloudflare URLs for serving
- `hook_requirements()`: System status checks

## Contributing

Please follow Drupal coding standards and include tests for new functionality.

## License

GPL-2.0-or-later

## Support

For issues and feature requests, please use the project issue queue on Drupal.org.