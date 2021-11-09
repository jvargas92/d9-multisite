<?php

namespace Drupal\stripe_webform\EventSubscriber;

use Drupal\stripe_webform\Event\StripeWebformWebhookEvent;
use Drupal\stripe\Event\StripeEvents;
use Drupal\stripe\Event\StripeWebhookEvent;
use Drupal\stripe\Event\StripePaymentEvent;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\webform\WebformSubmissionForm;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\EventDispatcherInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class StripeWebformEventSubscriber implements EventSubscriberInterface {

  /**
   * The configuration object factory.
   *
   * @var \Drupal\Core\Config\ConfigFactoryInterface
   */
  protected $config_factory;

  /**
   * The entity manager service.
   *
   * @var \Drupal\Core\Entity\EntityTypeManagerInterface
   */
  protected $entity_type_manager;

  /**
   * The event dispatcher service.
   *
   * @var \Symfony\Component\EventDispatcher\EventDispatcherInterface;
   */
  protected $event_dispatcher;

  /**
   * The iogger interface
   *
   * @var \Psr\Log\LoggerInterface
   */
  protected $logger;


  /**
   * Constructs a new instance.
   *
   * @param EventDispatcherInterface $dispatcher
   *   An EventDispatcherInterface instance.
   * @param \Drupal\Core\Entity\EntityTypeManagerInterface $entity_type_manager
   *   The entity type manager.
   */
  public function __construct(EventDispatcherInterface $dispatcher, ConfigFactoryInterface $config_factory, EntityTypeManagerInterface $entity_type_manager, LoggerInterface $logger) {
    $this->event_dispatcher = $dispatcher;
    $this->entity_type_manager = $entity_type_manager;
    $this->config_factory = $config_factory;
    $this->logger = $logger;
  }

  public function handleStripeWebhook(StripeWebhookEvent $event) {
    $uuid = $this->config_factory->get('system.site')->get('uuid');
    $stripe_event = $event->getEvent();

    if (!empty($stripe_event['data']['object']['metadata']['webform_submission_id'])) {
      $metadata = $stripe_event['data']['object']['metadata'];
    }
    elseif (!empty($stripe_event['data']['object']['customer'])) {
      $customer = $stripe_event['data']['object']['customer'];
      try {
        $customer = \Stripe\Customer::retrieve($customer);

        if (isset($customer['metadata']['webform_submission_id'])) {
          $metadata = $customer['metadata'];
        }
      } catch (\Stripe\Error\Base $e) {
        $this->logger->error('Stripe API Error: ' . $e->getMessage());
      }
    }

    if (!empty($metadata) && !empty($metadata['uuid']) && $metadata['uuid'] == $uuid) {
      $webform_submission_id = $metadata['webform_submission_id'];

      $webform_submission = $this->entity_type_manager
        ->getStorage('webform_submission')->load($webform_submission_id);
      if ($webform_submission) {
        $webhook_event = new StripeWebformWebhookEvent($stripe_event['type'], $webform_submission, $stripe_event);
        $this->event_dispatcher
          ->dispatch(StripeWebformWebhookEvent::EVENT_NAME, $webhook_event);
      }
    }

  }

  function handleStripePayment(StripePaymentEvent $event) {
    $form = $event->getForm();
    $form_state = $event->getFormState();
    $form_object = $form_state->getFormObject();
    if ($form_object instanceof WebformSubmissionForm) {
      /** @var \Drupal\webform\WebformSubmissionInterface $webform_submission */
      $webform_submission = $form_object->getEntity();
      $form_object->copyFormValuesToEntity($webform_submission, $form, $form_state);

      $webform = $webform_submission->getWebform();
      $element = $webform->getElement($event->getFormElement());
      $element_manager = \Drupal::service('plugin.manager.webform.element');
      $element_plugin = $element_manager->getElementInstance($element, $webform_submission);

      $element_plugin->prepare($element, $webform_submission);
      if (!empty($element['#stripe_amount'])) {
      $event->setTotal($element['#stripe_amount'], $element['#stripe_label']);
      }
      if (!empty($element['#stripe_name'])) {
        $event->setBillingName($element['#stripe_name']);
      }
      if (!empty($element['#stripe_email'])) {
        $event->setBillingEmail($element['#stripe_email']);
      }
      if (!empty($element['#stripe_billing_city'])) {
        $event->setBillingCity($element['#stripe_billing_city']);
      }
      if (!empty($element['#stripe_billing_country'])) {
        $event->setBillingCountry($element['#stripe_billing_country']);
      }
      if (!empty($element['#stripe_billing_address1'])) {
        $event->setBillingAddress1($element['#stripe_billing_address1']);
      }
      if (!empty($element['#stripe_billing_address2'])) {
        $event->setBillingAddress2($element['#stripe_billing_address2']);
      }
      if (!empty($element['#stripe_billing_postal_code'])) {
        $event->setBillingPostalCode($element['#stripe_billing_postal_code']);
      }
      if (!empty($element['#stripe_billing_state'])) {
        $event->setBillingState($element['#stripe_billing_state']);
      }
      if (!empty($element['#stripe_billing_phone'])) {
        $event->setBillingPhone($element['#stripe_billing_phone']);
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public static function getSubscribedEvents() {
    $events[StripeEvents::WEBHOOK][] = array('handleStripeWebhook');
    $events[StripeEvents::PAYMENT][] = array('handleStripePayment');
    return $events;
  }
}
