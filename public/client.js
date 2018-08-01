// Code by shahjehan
// https://codepen.io/shahjehan/pen/NGWaKq?editors=1010

// Live search function for index.pug and mypolls.pug
$(function() {

  $("#input").keyup(function() {
    let filter = $(this).val(); // retrieve text of input field

    $(".data").each(function() { // Loop through the polls in the table

      if ($(this).text().search(new RegExp(filter, "i")) < 0) { // no match results in -1
        $(this).fadeOut();
      }
      else {
        $(this).show();
      }
      
    });
  });

});