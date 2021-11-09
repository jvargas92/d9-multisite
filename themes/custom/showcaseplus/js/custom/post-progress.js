jQuery(document).ready(function($) {

  if ($(".post-progress").length>0){
    var s = $(window).scrollTop() || 0,
    c = $(window).height() || 0,
    d = $(".node__main-content-section").outerHeight() || 0,
    g = $(".node__main-content-section").offset().top || 0;
    var scrollPercent = (s / (d+g-c)) * 100;
    scrollPercent = Math.round(scrollPercent);
    if (c >= (d+g)) { scrollPercent = 100; } else if (scrollPercent < 0) { scrollPercent = 0; } else if (scrollPercent > 100) { scrollPercent = 100; }
    $(".post-progress__bar").css("width", scrollPercent + "%");
    $(".post-progress__value").html(scrollPercent + "%");
  }

  $(window).scroll(function () {
    if ($(".post-progress").length>0){
      var s = $(window).scrollTop() || 0,
      c = $(window).height() || 0,
      d = $(".node__main-content-section").outerHeight(true) || 0,
      g = $(".node__main-content-section").offset().top || 0;
      var scrollPercent = (s / (d+g-c)) * 100;
      scrollPercent = Math.round(scrollPercent);
      if (c >= (d+g)) { scrollPercent = 100; }  else if (scrollPercent < 0) { scrollPercent = 0; } else if (scrollPercent > 100) { scrollPercent = 100; }
      $(".post-progress__bar").css("width", scrollPercent + "%");
      $(".post-progress__value").html(scrollPercent + "%");
    }
  });

});
