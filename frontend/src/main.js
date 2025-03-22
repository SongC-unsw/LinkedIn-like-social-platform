import { BACKEND_PORT } from "./config.js";
// A helper you may want to use when uploading new images to the server.
import { fileToDataUrl } from "./helpers.js";

const showPage = (chosenPage) => {
  const pages = document.querySelectorAll(".page");
  for (const page of pages) {
    page.classList.add("hide");
  }
  document.querySelector(`.${chosenPage}.page`).classList.remove("hide");
};

const apiCall = (path, body, mtd) => {
  // Method hardcoded as POST need improvement
  const token = localStorage.getItem("token");
  return fetch("http://localhost:5005/" + path, {
    method: mtd,
    headers: {
      "Content-type": "application/json",
      "Authorization": token ? `Bearer ${token}` : undefined,
    },
    body: mtd === "GET" ? undefined : JSON.stringify(body),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        errorPopup(data.error);
      } else {
        return Promise.resolve(data);
        // or handle the data here
      }
    });
};

// feed logic
const loadFeed = () => {
  // after login or signup, token set
  apiCall("job/feed/?start=0", {}, "GET").then((response) => {
    console.log(response);
    document.querySelector(".feed").innerHTML = "";
    // post
    for (const post of response) {
      creatPost(post);
    }
  });
};

const creatPost = async (post) => {
  // async function to deal with apicall
  // post here is a response object
  const feedPost = document.createElement("div");
  feedPost.className = "feed-post";
  feedPost.id = `post-${post.id}`;

  const topSection = document.createElement("div");
  topSection.className = "post-top-section";
  topSection.style.display = "flex";
  topSection.style.alignItems = "center";
  // post-header, time and creator name
  const postHeader = document.createElement("div");
  postHeader.className = "post-header";

  // profile pic
  const pfp = document.createElement("img");

  if (post.image) {
    pfp.src = post.image;
    pfp.alt = "profile picture";
    pfp.className = "profile-picture";
    pfp.classList.add("rounded-circle","img-fluid");
    pfp.width = "50";
    pfp.height = "50";

  } else {
    pfp.className = "profile-picture rounded-circle";
    pfp.style.width = "50";
    pfp.style.height = "50";
    pfp.style.backgroundColor = "#6c757d"; // Default gray color
    pfp.style.display = "flex";
    pfp.style.alignItems = "center";
    pfp.style.justifyContent = "center";
  }
  const pfpContainer = document.createElement("div");
  pfpContainer.style.width = "60px";
  pfpContainer.style.flexShrink = "0";
  pfpContainer.appendChild(pfp);
  topSection.appendChild(pfpContainer);

  const response = await apiCall(`user?userId=${post.creatorId}`,{},"GET");
  const userName = response.name;

  // create name element
  const nameElement = document.createElement("div");
  nameElement.className = "author-name";
  nameElement.innerText = userName;
  nameElement.classList.add("fw-bold");
  nameElement.style.fontSize = "1.3rem"
      
  // Create time element
  const timeElement = document.createElement("div");
  timeElement.className = "post-time";
  timeElement.classList.add("text-secondary");
  timeElement.style.fontSize = "0.8rem"
  const now = new Date()
  const timeCreated = new Date(post.createdAt);
  if ((now - timeCreated) > 86400000 ) { // if greater than a day
    const year = timeCreated.getFullYear();
    const day = String(timeCreated.getDate()).padStart(2, '0');
    const month = String(timeCreated.getMonth() + 1).padStart(2, '0');

    timeElement.innerText = `${day}/${month}/${year}`; // DD/MM/YYYY
  } else {
    const diffInMs = now - timeCreated;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const reaminderMinutes = diffInMinutes % 60;
    timeElement.innerText = `${diffInHours} ${diffInHours > 1 ? 'hours':'hour'} and ${reaminderMinutes} ${reaminderMinutes>1? 'minutes':'minute'} ago`
    // time display format
  }


  // top section styling
  postHeader.style.display = "flex";
  postHeader.style.flexDirection = "column";
  topSection.style.display = "flex";
  postHeader.classList.add('ms-3'); // adds margin-left
  topSection.classList.add('mb-3');

  // Append elements to header
  postHeader.appendChild(nameElement);
  postHeader.appendChild(timeElement);
  topSection.appendChild(postHeader);
  feedPost.appendChild(topSection);

  // create post main content
  const postContent = document.createElement("div");
  postContent.className = "post-content";
  // create post title
  const postTitle = document.createElement("h4");
  postTitle.className = "post-title";
  postTitle.innerText = post.title;
  // create job description
  const jobDetail = document.createElement("p");
  jobDetail.className = "post-job-detail";
  jobDetail.innerText = post.description;
  // append element to main content
  postContent.append(postTitle,jobDetail);
  feedPost.appendChild(postContent);
  
  document.querySelector(".feed").appendChild(feedPost);
}

if (localStorage.getItem("token")) {
  showPage("home");
  loadFeed();
} else {
  showPage("login");
}

const errorPopup = (msg) => {
  const popup = document.getElementById("popup");
  popup.querySelector(".modal-body p").textContent = msg;
  const modalInstance = new bootstrap.Modal(popup);
  modalInstance.show();
};

// register logic
const submitBtn = document.getElementById("submit");
submitBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value;
  const name = document.getElementById("name").value;
  const password = document.getElementById("password").value;
  const passConfirm = document.getElementById("confirmPassword").value;
  const Data = {
    email: email,
    name: name,
    password: password,
  };
  if (passConfirm !== password) {
    errorPopup("Password doesn't match");
  } else {
    apiCall("auth/register", Data, "POST").then((data) => {
      localStorage.setItem("token", data.token);
      showPage("home");
      loadFeed();
    });
  }
});

// login logic
const loginBtn = document.getElementById("login");
loginBtn.addEventListener("click", () => {
  const email = document.getElementById("email-login").value;
  const password = document.getElementById("password-login").value;
  const Data = {
    email: email,
    password: password,
  };
  apiCall("auth/login", Data, "POST").then((response) => {
    localStorage.setItem("token", response.token);
    showPage("home");
    loadFeed();
  });
});

// links
document.getElementById("login-link").addEventListener("click", () => {
  showPage("login");
});

document.getElementById("signup-link").addEventListener("click", () => {
  showPage("registration");
});
const logoutBtn = document.getElementById("logout-btn");
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  showPage("login");
});
