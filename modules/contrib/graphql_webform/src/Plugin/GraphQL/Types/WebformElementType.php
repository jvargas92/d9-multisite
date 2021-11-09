<?php

namespace Drupal\graphql_webform\Plugin\GraphQL\Types;

use Drupal\graphql\GraphQL\Execution\ResolveContext;
use Drupal\graphql\Plugin\GraphQL\Types\TypePluginBase;
use Drupal\webform\Plugin\WebformElementBase;
use GraphQL\Type\Definition\ResolveInfo;

/**
 * A GraphQL type for non-supported form items.
 *
 * This type is needed to avoid errors when the webform contains elements that
 * are not implemented yet.
 *
 * @GraphQLType(
 *   id = "webform_element_type",
 *   name = "WebformElementType",
 *   interfaces = {"WebformElement"},
 *   weight = -999
 * )
 */
class WebformElementType extends TypePluginBase {

  /**
   * {@inheritdoc}
   */
  public function applies($object, ResolveContext $context, ResolveInfo $info) {
    return $object['plugin'] instanceof WebformElementBase;
  }

}
