<?php

declare(strict_types=1);

namespace Drupal\Tests\cloudflare_media_offload\Functional;

use Drupal\Tests\BrowserTestBase;

/**
 * Tests the Cloudflare Media Offload settings form.
 *
 * @group cloudflare_media_offload
 */
class SettingsFormTest extends BrowserTestBase {

  /**
   * {@inheritdoc}
   */
  protected $defaultTheme = 'stark';

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'user',
    'key',
    'media',
    'file',
    'image',
    'cloudflare_media_offload',
  ];

  /**
   * A user with permission to administer the module.
   *
   * @var \Drupal\user\UserInterface
   */
  protected $adminUser;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->adminUser = $this->drupalCreateUser([
      'administer cloudflare media offload',
      'administer keys',
    ]);
  }

  /**
   * Tests the settings form access.
   */
  public function testSettingsFormAccess(): void {
    // Anonymous user should not have access
    $this->drupalGet('/admin/config/media/cloudflare-media-offload');
    $this->assertSession()->statusCodeEquals(403);

    // Admin user should have access
    $this->drupalLogin($this->adminUser);
    $this->drupalGet('/admin/config/media/cloudflare-media-offload');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('API Credentials');
  }

  /**
   * Tests the settings form validation.
   */
  public function testSettingsFormValidation(): void {
    $this->drupalLogin($this->adminUser);
    $this->drupalGet('/admin/config/media/cloudflare-media-offload');

    // Try to submit with empty values
    $edit = [
      'api_key' => '',
      'account_id' => '',
    ];
    $this->submitForm($edit, 'Save configuration');

    // Should have validation errors for required fields
    $this->assertSession()->pageTextContains('API Token Key field is required');
    $this->assertSession()->pageTextContains('Account ID Key field is required');
  }

  /**
   * Tests the status dashboard access.
   */
  public function testStatusDashboardAccess(): void {
    $user_with_permission = $this->drupalCreateUser([
      'view cloudflare media logs',
    ]);

    $this->drupalLogin($user_with_permission);
    $this->drupalGet('/admin/reports/cloudflare-media-offload');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('Connection Status');
    $this->assertSession()->pageTextContains('Statistics');
  }

  /**
   * Tests the variants form access.
   */
  public function testVariantsFormAccess(): void {
    $this->drupalLogin($this->adminUser);
    $this->drupalGet('/admin/config/media/cloudflare-media-offload/variants');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('Image Variants');
  }

  /**
   * Tests the migration form access.
   */
  public function testMigrationFormAccess(): void {
    $user_with_permission = $this->drupalCreateUser([
      'migrate to cloudflare media',
    ]);

    $this->drupalLogin($user_with_permission);
    $this->drupalGet('/admin/config/media/cloudflare-media-offload/migrate');
    $this->assertSession()->statusCodeEquals(200);
    $this->assertSession()->pageTextContains('Migration Statistics');
  }

}