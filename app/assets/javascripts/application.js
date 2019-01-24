// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, or any plugin's
// vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require rails-ujs
//= require jquery
//= require materialize
//= require activestorage
//= require turbolinks
//= require_tree .
if (!!window.performance && window.performance.navigation.type === 2) {
    // value 2 means "The page was accessed by navigating into the history"
    console.log('Reloading');
    window.location.reload(); // reload whole page
}
$( document ).ready(function(){
  $(".dropdown-trigger").dropdown();
  $('.sidenav').sidenav();
  $('#fade-out-target').fadeOut(4000);
});
