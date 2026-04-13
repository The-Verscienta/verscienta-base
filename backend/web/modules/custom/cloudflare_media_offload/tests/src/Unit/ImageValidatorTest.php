<?php

declare(strict_types=1);

namespace Drupal\Tests\cloudflare_media_offload\Unit;

use Drupal\cloudflare_media_offload\Service\ImageValidator;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Config\ImmutableConfig;
use Drupal\file\FileInterface;
use Drupal\Tests\UnitTestCase;

/**
 * Tests for the ImageValidator service.
 *
 * @group cloudflare_media_offload
 * @coversDefaultClass \Drupal\cloudflare_media_offload\Service\ImageValidator
 */
class ImageValidatorTest extends UnitTestCase {

  /**
   * The image validator service.
   *
   * @var \Drupal\cloudflare_media_offload\Service\ImageValidator
   */
  protected ImageValidator $validator;

  /**
   * The config factory mock.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface|\PHPUnit\Framework\MockObject\MockObject
   */
  protected $configFactory;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $config = $this->createMock(ImmutableConfig::class);
    $config->method('get')
      ->willReturnMap([
        ['upload_limits.max_file_size', 10],
        ['upload_limits.supported_formats', ['jpeg', 'jpg', 'png', 'gif', 'webp']],
      ]);

    $this->configFactory = $this->createMock(ConfigFactoryInterface::class);
    $this->configFactory->method('get')
      ->with('cloudflare_media_offload.settings')
      ->willReturn($config);

    $this->validator = new ImageValidator($this->configFactory);
  }

  /**
   * Tests isSupportedFormat method.
   *
   * @covers ::isSupportedFormat
   * @dataProvider supportedFormatProvider
   */
  public function testIsSupportedFormat(string $mimeType, string $extension, bool $expected): void {
    $result = $this->validator->isSupportedFormat($mimeType, $extension);
    $this->assertEquals($expected, $result);
  }

  /**
   * Data provider for testIsSupportedFormat.
   *
   * @return array
   *   Test cases.
   */
  public function supportedFormatProvider(): array {
    return [
      'Valid JPEG' => ['image/jpeg', 'jpg', TRUE],
      'Valid PNG' => ['image/png', 'png', TRUE],
      'Valid GIF' => ['image/gif', 'gif', TRUE],
      'Valid WebP' => ['image/webp', 'webp', TRUE],
      'Invalid MIME type' => ['image/bmp', 'bmp', FALSE],
      'Mismatched extension' => ['image/jpeg', 'png', FALSE],
      'Invalid extension' => ['image/jpeg', 'txt', FALSE],
    ];
  }

  /**
   * Tests getMaxFileSize method.
   *
   * @covers ::getMaxFileSize
   */
  public function testGetMaxFileSize(): void {
    $max_size = $this->validator->getMaxFileSize();
    // 10 MB = 10 * 1024 * 1024 bytes
    $this->assertEquals(10485760, $max_size);
  }

  /**
   * Tests getSupportedFormats method.
   *
   * @covers ::getSupportedFormats
   */
  public function testGetSupportedFormats(): void {
    $formats = $this->validator->getSupportedFormats();

    $this->assertIsArray($formats);
    $this->assertArrayHasKey('jpeg', $formats);
    $this->assertArrayHasKey('png', $formats);
    $this->assertEquals('image/jpeg', $formats['jpeg']['mime']);
    $this->assertEquals('image/png', $formats['png']['mime']);
  }

  /**
   * Tests getErrorMessages method.
   *
   * @covers ::getErrorMessages
   */
  public function testGetErrorMessages(): void {
    $errors = [
      ImageValidator::ERROR_FILE_NOT_READABLE,
      ImageValidator::ERROR_FORMAT_NOT_SUPPORTED,
    ];

    $messages = $this->validator->getErrorMessages($errors);

    $this->assertIsArray($messages);
    $this->assertCount(2, $messages);
    $this->assertIsObject($messages[0]); // TranslatableMarkup object
  }

}