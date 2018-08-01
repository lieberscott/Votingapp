$( document ).ready(() => {

  $("#newpoll").submit((e) => {
    $.ajax({
      url: "/newpoll",
      type: "post",
      data: $("#newpoll").serialize(),
      success: (res) => {
        if (res.result == "redirect") {
          window.location.replace(res.url);
        }
      }
    });
  });
  
});