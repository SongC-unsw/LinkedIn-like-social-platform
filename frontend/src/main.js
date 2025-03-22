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
      Authorization: token ? `Bearer ${token}` : undefined,
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
const handleLikes = (likeBtn, post, haveLiked) => {
  likeBtn.addEventListener("click", () => {
    apiCall("job/like", {
      id: post.id,
      turnon: haveLiked? false : true,
    }, "PUT")
});
};
const creatPost = async (post) => {
  // async function to deal with apicall
  // post here is a response object
  console.log(post);
  const feedPost = document.createElement("div");
  feedPost.className = "feed-post";
  feedPost.id = `post-${post.id}`;
  feedPost.classList.add("d-flex", "flex-column");

  const topSection = document.createElement("div");
  topSection.className = "post-top-section";
  topSection.style.display = "flex";
  topSection.style.alignItems = "center";
  // post-header, time and creator name
  const postHeader = document.createElement("div");
  postHeader.className = "post-header";

  // profile pic
  const pfp = document.createElement("img");

  if (post.avatar) {
    pfp.src = post.avatar;
    pfp.alt = "profile picture";
    pfp.className = "profile-picture";
    pfp.classList.add("rounded-circle", "img-fluid");
    pfp.width = "50";
    pfp.height = "50";
  } else {
    pfp.className = "profile-picture rounded-circle";
    pfp.style.width = "50";
    pfp.style.height = "50";
    // Create a default profile picture using SVG
    pfp.src =
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="50" height="50">
        <rect width="100" height="100" fill="#6c757d" />
        <circle cx="50" cy="40" r="20" fill="#dee2e6" />
        <circle cx="50" cy="100" r="40" fill="#dee2e6" />
      </svg>
    `);
    pfp.alt = "default profile picture";
  }
  const pfpContainer = document.createElement("div");
  pfpContainer.style.width = "60px";
  pfpContainer.style.flexShrink = "0";
  pfpContainer.appendChild(pfp);
  topSection.appendChild(pfpContainer);

  const response = await apiCall(`user?userId=${post.creatorId}`, {}, "GET");
  console.log(response);

  const userName = response.name;

  // create name element
  const nameElement = document.createElement("div");
  nameElement.className = "author-name";
  nameElement.innerText = userName;
  nameElement.classList.add("fw-bold");
  nameElement.style.fontSize = "1.3rem";

  // Create time element
  const timeElement = document.createElement("div");
  timeElement.className = "post-time";
  timeElement.classList.add("text-secondary");
  timeElement.style.fontSize = "0.8rem";
  const now = new Date();
  const timeCreated = new Date(post.createdAt);
  if (now - timeCreated > 86400000) {
    // if greater than a day
    const year = timeCreated.getFullYear();
    const day = String(timeCreated.getDate()).padStart(2, "0");
    const month = String(timeCreated.getMonth() + 1).padStart(2, "0");

    timeElement.innerText = `${day}/${month}/${year}`; // DD/MM/YYYY
  } else {
    const diffInMs = now - timeCreated;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const reaminderMinutes = diffInMinutes % 60;
    timeElement.innerText = `${diffInHours} ${
      diffInHours > 1 ? "hours" : "hour"
    } and ${reaminderMinutes} ${
      reaminderMinutes > 1 ? "minutes" : "minute"
    } ago`;
    // time display format
  }

  // top section styling
  postHeader.style.display = "flex";
  postHeader.style.flexDirection = "column";
  topSection.style.display = "flex";
  postHeader.classList.add("ms-3"); // adds margin-left
  topSection.classList.add("mb-3");

  // Append elements to header
  postHeader.appendChild(nameElement);
  postHeader.appendChild(timeElement);
  topSection.appendChild(postHeader);
  feedPost.appendChild(topSection);

  // create post main content
  const postContent = document.createElement("div");
  postContent.className = "post-content";
  postContent.style.width = "100%";
  // create post title
  const postTitle = document.createElement("h4");
  postTitle.className = "post-title";
  postTitle.innerText = post.title;
  // create job description
  const jobDetail = document.createElement("p");
  jobDetail.className = "post-job-detail";
  jobDetail.innerText = post.description;
  //create img element
  const descriptionImg = document.createElement("img");
  descriptionImg.classList.add("img-fluid", "img-thumbnail");
  descriptionImg.style.width = "100%";
  descriptionImg.src = post.image;

  // append element to main content
  postContent.append(postTitle, jobDetail, descriptionImg);
  feedPost.appendChild(postContent);
  //comment section and likes
  const commAndLikes = document.createElement("div");
  commAndLikes.classList.add(
    "container",
    "d-flex",
    "justify-content-between",
    "align-items-center",
    "mt-3",
    "px-2"
  );
  // like button
  const likeBtn = document.createElement("button");
  const likeNum = post.likes.length;
  likeBtn.innerText = `👍 ${likeNum > 0 ? likeNum : ""}`;
  likeBtn.type = "button";
  likeBtn.classList.add("btn", "btn-primary");
  // New likes
  let haveLiked = false;
  for (const e of post.likes) {
    if (String(e.userId) === localStorage.getItem("userId")) {
      haveLiked = true;
      break;
    }
  }
  handleLikes(likeBtn, post, haveLiked);

  // comment button
  const comBtn = document.createElement("button");
  const comNum = post.comments.length;
  comBtn.innerText = `💬 ${comNum > 0 ? comNum : ""}`;
  comBtn.classList.add("btn", "btn-primary");
  // comment section

  const comSection = document.createElement("div");
  comSection.classList.add(
    "comment-section",
    "container",
    "bg-light",
    "p-3",
    "mt-2",
    "rounded",
    "hide"
  );

  // Display existing comments
  if (post.comments.length > 0) {
    const commentsList = document.createElement("div");
    commentsList.classList.add("comments-list");

    for (const comment of post.comments) {
      const commentItem = document.createElement("div");
      commentItem.classList.add(
        "comment-item",
        "d-flex",
        "mb-2",
        "pb-2",
        "border-bottom"
      );
      // Comment user avatar (placeholder)
      const commentAvatar = document.createElement("div");
      commentAvatar.classList.add("comment-avatar", "me-2");
      const avatarContainer = document.createElement("div");
      avatarContainer.className =
        "rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center";
      avatarContainer.style.width = "32px";
      avatarContainer.style.height = "32px";
      avatarContainer.style.fontSize = "14px";
      avatarContainer.textContent = comment.userName
        ? comment.userName.charAt(0)
        : "U";
      commentAvatar.appendChild(avatarContainer);

      // Comment content
      const commentContent = document.createElement("div");
      commentContent.classList.add("comment-content", "flex-grow-1");
      // Comment user name
      const commentUser = document.createElement("div");
      commentUser.classList.add("comment-user", "fw-bold", "small");
      commentUser.innerText = comment.userName;

      const commentText = document.createElement("div");
      commentText.classList.add("comment-text", "small");
      commentText.innerText = comment.comment;
      // assemble comment section
      commentContent.appendChild(commentUser);
      commentContent.appendChild(commentText);
      commentItem.appendChild(commentAvatar);
      commentItem.appendChild(commentContent);
      commentsList.appendChild(commentItem);
    }

    comSection.appendChild(commentsList);
  } else {
    const noComments = document.createElement("p");
    noComments.classList.add("text-muted", "small", "fst-italic");
    noComments.innerText = "No comments yet";
    comSection.appendChild(noComments);
  }
  // Add new comment
  const commentForm = document.createElement("div");
  commentForm.classList.add("comment-form", "mt-3", "d-flex");

  const commentInput = document.createElement("input");
  commentInput.type = "text";
  commentInput.classList.add("form-control", "form-control-sm", "me-2");
  commentInput.placeholder = "Add a comment...";

  const commentSubmit = document.createElement("button");
  commentSubmit.classList.add("btn", "btn-sm", "btn-primary");
  commentSubmit.innerText = "Post";

  commentForm.appendChild(commentInput);
  commentForm.appendChild(commentSubmit);
  comSection.appendChild(commentForm);

  // Toggle comments when clicking the comment button
  comBtn.addEventListener("click", () => {
    comSection.classList.toggle("hide");
  });

  commAndLikes.append(likeBtn, comBtn);
  feedPost.appendChild(commAndLikes);
  feedPost.appendChild(comSection);
  document.querySelector(".feed").appendChild(feedPost);
};

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
      localStorage.setItem("userId", data.userId);
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
    localStorage.setItem("userId", response.userId);
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
  localStorage.clear();
  showPage("login");
});
