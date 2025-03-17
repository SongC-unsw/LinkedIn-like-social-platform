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
showPage('registration');
const submitBtn = document.getElementById("submit");
submitBtn.addEventListener("click", () => {
    fetch()
})