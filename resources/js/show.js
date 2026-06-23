const show = () => {
    let password = document.getElementById("password");
    let visibility = document.querySelector(".visibility");
    if (password.type === "password") {
      password.type = "text";
      visibility.style.color = "rgb(128, 0, 122)";
    } else {
      password.type = "password";
      visibility.style.color = "#fff";
    }
  };
  // this script is for the show password feature on the login page // I don't know how it works so please don't touch it 🤣😂 //
  