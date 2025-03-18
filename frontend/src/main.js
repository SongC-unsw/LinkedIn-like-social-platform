import { BACKEND_PORT } from './config.js';
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from './helpers.js';

console.log('Let\'s go!');

const showPage = (chosenPage) => {
    const pages = document.querySelectorAll(".page");
    for (const page of pages) {
        page.classList.add("hide");
    }
    document.querySelector(`.${chosenPage}.page`).classList.remove("hide");
    
}
const apiCall = (path, body) => {
    // Method hardcoded as POST need improvement
    return fetch('http://localhost:5005/' + path, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(body)
    })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
      } else {
        return Promise.resolve(data);
        // or handle the data here
      }
    });
  };
showPage('registration');
const submitBtn = document.getElementById("submit");
submitBtn.addEventListener("click", () => {
    const email = document.getElementById('email').value;
    const name = document.getElementById('name').value;
    const password = document.getElementById('password').value;
    const passConfirm = document.getElementById('confirmPassword').value;

    const Data = {

        email: email,
        name: name,
        password: password
    };
    apiCall("auth/register",Data);
})