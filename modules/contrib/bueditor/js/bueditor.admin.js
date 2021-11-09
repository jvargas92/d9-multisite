(function ($, Drupal, BUE) {
'use strict';

/**
 * @file
 * Manages admin UI and forms.
 */

/**
 * Add regular expression to states API.
 */
if (Drupal.states) {
  Drupal.states.Dependent.comparisons.Object = function(reference, value) {
    // RegExp definition
    if (reference.regex) {
      return (new RegExp(reference.regex, reference.flags||'')).test(value);
    }
    // Array
    else if (typeof reference.indexOf === 'function') {
      return reference.indexOf(value) != -1;
    }
  };
}

/**
 * Admin container.
 */
var Main = Drupal.bueditorAdmin = {};

/**
 * Drupal behavior .
 */
Drupal.behaviors.bueditorAdmin = {attach: function(context, settings) {
  var i, textarea, inputEl, $input, bueset;
  if (bueset = settings.bueditor) {
    // Attach toolbar widget to toolbar input fields.
    if (window.Sortable && bueset.twSettings) {
      $input = $('.bueditor-toolbar-input', context).not('.has-bueditor-tw');
      if ($input.length) {
        $input.addClass('has-bueditor-tw');
        for (i = 0; inputEl = $input[i]; i++) {
          Main.attachTw(inputEl, bueset.twSettings);
        }
      }
    }
    // Install demo
    if (bueset.demoSettings) {
      if (textarea = $('.bueditor-demo', context).not('.demo-processed').addClass('demo-processed')[0]) {
        Main.createDemo(textarea, bueset.demoSettings);
      }
    }
  }
}};

/**
 * Integrates toolbar widget into a toolbar input.
 */
Main.attachTw = function(inputEl, settings) {
  var Sortable = window.Sortable;
  if (!Sortable) {
    return;
  }
  var i, id, el, itemElements = Main.createTwElements(settings.items, settings),
  activeItems = inputEl.value.split(/,\s*/),
  $widget = $(Main.twTemplate(settings)),
  $available = $widget.find('.bueditor-available-toolbar'),
  $active = $widget.find('.bueditor-active-toolbar');
  // Available items
  for (id in itemElements) {
    $available.append(itemElements[id]);
  }
  // Active items
  for (i = 0; i < activeItems.length; i++) {
    id = activeItems[i];
    if (el = itemElements[id]) {
      $active.append(el.className.indexOf('multi-item') != -1 ? el.cloneNode(true) : el);
    }
  }
  $active.data('input', inputEl);
  // Apply sortable
  Sortable.create($available[0], Main.availableSortableOptions($widget));
  var sortable = Sortable.create($active[0], Main.activeSortableOptions($widget));
  // Sync the first time.
  Main.syncInput(sortable);
  // Hide the input and add the widget.
  $(inputEl).parent().hide().before($widget);
  return $widget;
};

/**
 * Creates elements for a list of items.
 */
Main.createTwElements = function(items) {
  var template, id, item, el, elements = {};
  items = Main.processTwItems(items);
  for (id in items) {
    item = items[id];
    // Create the item element and set required attributes
    template = !item.code && typeof item.template === 'string' && item.template;
    el = BUE.createEl(template || BUE.html(BUE.buttonHtmlObj(item)));
    el.setAttribute('data-bueditor-tw-item', id);
    el.className += ' bueditor-tw-item';
    if (item.multiple || template && item.multiple === undefined) {
      el.className += ' multi-item';
    }
    // Set button titles as "label: tooltip"
    if (!el.title || !template) {
      el.title = item.label ? item.label + (item.tooltip ? ': ' + item.tooltip : '') : (item.tooltip || '');
    }
    elements[id] = el;
  }
  return elements;
};

/**
 * Returns complete definitions of widget items.
 */
Main.processTwItems = function(items) {
  var id, item, ret = {};
  for (id in items) {
    item = items[id];
    // Provided as a label
    if (typeof item === 'string') {
      item = {label: item};
    }
    // Item must be an object
    if (!item || typeof item !== 'object') {
      continue;
    }
    // Copy missing properties from definitions in library files.
    ret[id] = BUE.extend({id: id}, BUE.getButtonDefinition(id), item);
  }
  return ret;
};

/**
 * Returns the template of toolbar widget.
 */
Main.twTemplate = function() {
  return '<div class="bueditor-tw">\
  <div class="form-item bueditor-tw-available-items">\
    <label> '+ Drupal.t('Available items') + '</label>\
    <div class="bue bue-toolbar bueditor-available-toolbar"></div>\
  </div>\
  <div class="form-item bueditor-tw-active-items">\
    <label> '+ Drupal.t('Active toolbar') + '</label>\
    <div class="bue bue-toolbar bueditor-active-toolbar"></div>\
  </div>\
</div>';
};

/**
 * Returns Sortable options for available toolbar.
 */
Main.availableSortableOptions = function() {
  return $.extend(Main.commonSortableOptions(), {
    group: {
      name: 'available',
      pull: function(to, from, el) {
        if ($(el).hasClass('multi-item')) {
          return 'clone';
        }
      },
      put: 'active'
    },
    onAdd: function(event) {
      var $el = $(event.item);
      if ($el.hasClass('multi-item')) {
        $el.remove();
      }
    }
  });
};

/**
 * Returns Sortable options for active toolbar.
 */
Main.activeSortableOptions = function() {
  return $.extend(Main.commonSortableOptions(), {
    group: {
      name: 'active',
      pull: 'available',
      put: 'available'
    },
    store: {
      set: Main.syncInput
    }
  });
};

/**
 * Returns common Sortable options.
 */
Main.commonSortableOptions = function() {
  return {
    draggable: '.bueditor-tw-item',
    dataIdAttr: 'data-bueditor-tw-item',
    // buttons are not html5 draggable in firefox
    // https://bugzilla.mozilla.org/show_bug.cgi?id=568313
    forceFallback: /firefox/i.test(navigator.userAgent)
  };
};

/**
 * Updates the input field of an active toolbar.
 */
Main.syncInput = function(sortable) {
  var inputEl = $(sortable.el).data('input');
  if (inputEl) {
    $(inputEl).val(sortable.toArray().join(', ')).change();
  }
};

/**
 * Create the demo editor inside the wrapper.
 */
Main.createDemo = function(textarea, settings) {
  var E, date = new Date();
  if (E = BUE.attach(textarea, settings)) {
    // Set load time info
    E.addContent('Editor load time: ' + (new Date() - date) + 'ms', '\n');
    // Update editor format on format select. It can be used by preview button.
    $(textarea).closest('.text-format-wrapper').addClass('bueditor-demo-wrapper').find('.filter-list').change(function() {
      E.settings.inputFormat = this.value;
    }).change();
  }
  return E;
};

})(jQuery, Drupal, BUE);
