$( document ).ready(() => {
  
  // these variables are all available from chart.pug file
  // console.log(polldata);
  // console.log(user);
  // console.log(ipaddress);
  
  // instantiate variables
  let selection = ""; // who they vote for
  if (user == "none") {
    user = undefined;
  }
  
  // Draw chart
  let colors = ["#224560", "#4a143e", "#4b7d64", "#676301", "#a53e0c", "#bbc85c", "#4f7531", "#a07722", "#ae2d2e", "#f322b0", "#a9a99e"];
  let hoverColors = ["#264e6d", "#571849", "#51886c", "#787301", "#b5440d", "#c0cc69", "#578136", "#ae8125", "#bb3032", "#f432b6", "#b1b1a7"];

  let ctx = document.getElementById("myChart").getContext("2d");
  let myChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: answers,
      datasets: [{
        data: votes,
        backgroundColor: colors,
        hoverBackgroundColor: hoverColors
      }]
    },
    options: {
      animation: { animateScale: true },
      cutoutPercentage: 50,
      maintainAspectRatio: false,
      responsive: true,
      tooltips: {
        callbacks: {
          label: (tooltipItem, data) => {
            let label = answers[tooltipItem.index] + ": " + votes[tooltipItem.index];
            return label;
          }
        }
      }
    }
  });
  
  $("#select").change((e) => { // upon a change in the dropdown menu
    
    let obj = document.getElementById("select");
    // capture the input
    selection = obj.options[obj.selectedIndex].text; // don't know WHY this works, but it does: https://stackoverflow.com/questions/1085801/get-selected-value-in-dropdown-list-using-javascript
    
    if (selection == "I'd like a custom answer") {
      selection = "";
      // make input box appear
      $('<input type="text" class="form-control width" id="custom" placeholder="Your answer">'
).insertBefore(".insertbefore"); // ".insertbefore" class is on submit button, and only for this reason
      
      $("#custom").css({ "width": 80 + "%", "margin-bottom": 10 + "px", "margin-top": -5 + "px" });
      
    }
    else {
      // make input box disappear
      $("#custom").remove(); // does NOT throw an error even if switching from one prepopulated option to another (and thus no #custom id exists)
    }
    
  });
  
  $("#answer").submit((e) => {
    
    let ips = polldata.answeredIPs;
    let users = polldata.answeredUsers;
    
    if (ips.includes(ipaddress) || users.includes(user)) {
      alert("You have already voted from this IP address or user account");
    }
    else {
      // Either a prepopulated selection will be the "selection" variable ("Boston Celtics", e.g.)
      // or a custom option will be chosen and be the "chosen" variable
      let chosen = $("#custom").val(); // will be "undefined" if custom option was not selected

      if (selection != "" && chosen != "") { // Either "Select" is chosen, or there's no text in the custom box
        $.ajax({
          url: "/answer",
          type: "post",
          data: chosen || selection,
          success: (res) => {
            console.log(window.location);
            if (res.result == 'redirect') {
              window.location.replace(res.url);
            }
          }
        })
      }
      else {
        alert("Please make a selection");
      }
    }

  });
  
  
  
});