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
        // console.log("err");
        errorPopup(data.error);
        // return Promise.reject(new Error(data.error));
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
      // make sure to only show jobs start date later than today
      // Sort posts by creation date, newest first
      response.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const startDate = new Date(post.start);
      const currentDate = new Date();
      if (startDate >= currentDate) {
        creatPost(post);
      }
    }
  });
};
const updateLikeBtn = (likeBtn, haveLiked) => {
  if (haveLiked) {
    likeBtn.classList.remove("btn-primary");
    likeBtn.classList.add("btn-success");
  } else {
    likeBtn.classList.remove("btn-success");
    likeBtn.classList.add("btn-primary");
  }
}
const handleLikes = (likeBtn, likeBy, post, currentUserName, haveLiked) => {
  let currentCount = post.likes.length;
  let currentLikedBy = post.likes.map(like => like.userName);
  likeBtn.addEventListener("click", () => {
    haveLiked = !haveLiked;
    // new state begins
    updateLikeBtn(likeBtn, haveLiked);
    if (haveLiked) {
      if (!currentLikedBy.includes(currentUserName)) {
      currentLikedBy.unshift(currentUserName);
      }
    } else {
      currentLikedBy = currentLikedBy.filter(name => name !== currentUserName);
    }
    likeBy.innerText = currentLikedBy.length > 0 ? `Liked by: ${currentLikedBy.join(', ')}` : 'No likes yet';
    // console.log(haveLiked, currentCount);
    currentCount = haveLiked? currentCount+1 : currentCount-1;
    likeBtn.innerText = `👍 ${currentCount > 0 ? currentCount : ''}`;
    apiCall("job/like", {
      id: post.id,
      turnon: haveLiked
    }, "PUT");
});
};

const createComment = async (comment) => {
  // Display existing comments
  const commentItem = document.createElement("div");
  commentItem.classList.add(
    "comment-item",
    "d-flex",
    "mb-2",
    "pb-2",
    "border-bottom"
  );
  // Comment user avatar (placeholder)
  const userResponse = await apiCall(`user?userId=${comment.userId}`,{},"GET");
  const userAvatar = userResponse.image;
  const commentAvatar = document.createElement("div");
  commentAvatar.classList.add("comment-avatar", "me-2");
  const avatarContainer = document.createElement("div");
  avatarContainer.className =
    "rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center";
  avatarContainer.style.width = "32px";
  avatarContainer.style.height = "32px";
  avatarContainer.style.fontSize = "14px";
  if (userAvatar) {
    const userCommentImg = document.createElement("img");
    userCommentImg.className = "user-comment-image rounded-circle";
    userCommentImg.alt = "user-profile-img";
    userCommentImg.style.width = "32px";
    userCommentImg.style.width = "32px";
    userCommentImg.src = userAvatar;
    avatarContainer.appendChild(userCommentImg);
  } else {
    avatarContainer.textContent = comment.userName
      ? comment.userName.charAt(0)
      : "U";
  }
  commentAvatar.appendChild(avatarContainer);

  // Comment content
  const commentContent = document.createElement("div");
  commentContent.classList.add("comment-content", "flex-grow-1");
  // Comment user name
  const commentUser = document.createElement("div");
  commentUser.classList.add("comment-user", "fw-bold", "small");
  commentUser.innerText = comment.userName;
  commentUser.style.cursor = "pointer";
  commentUser.addEventListener("click", () => {
    constructProfilePage(userResponse);
    showPage("profile");
  })

  const commentText = document.createElement("div");
  commentText.classList.add("comment-text", "small","text-break","text-wrap");
  commentText.innerText = comment.comment;
  // assemble comment section
  commentContent.appendChild(commentUser);
  commentContent.appendChild(commentText);
  commentItem.appendChild(commentAvatar);
  commentItem.appendChild(commentContent);
  
  return commentItem;
};
// handle comments
const handlePostComment = (commentSubmit, commentInput, currentUserName, commentsList, comBtn, post) => {
  commentSubmit.addEventListener("click", async () => {
    if (commentInput.value){
      // add comment
      const body = {userId: localStorage.getItem("userId"),userName: currentUserName,comment: commentInput.value}
      const commentElement = await createComment(body);
      commentsList.appendChild(commentElement);
      comBtn.innerText = `💬 ${parseInt(comBtn.innerText.replace(/[^0-9]/g, '') || 0) + 1}`;
      // api call
      apiCall("job/comment", {
        id: post.id,
        comment: commentInput.value,
      }, "POST");
      commentInput.value = '';
    }
  })

};

const creatPost = async (post) => {
  // async function to deal with apicall
  // post here is a response object
  console.log(post);
  const feedPost = document.createElement("div");
  feedPost.className = "feed-post bg-white mb-3 shadow-sm p-4";
  feedPost.id = `post-${post.id}`;
  feedPost.classList.add("d-flex", "flex-column");

  const topSection = document.createElement("div");
  topSection.className = "post-top-section";
  topSection.style.display = "flex";
  topSection.style.alignItems = "center";
  // post-header, time and creator name
  const postHeader = document.createElement("div");
  postHeader.className = "post-header";
  
  const response = await apiCall(`user?userId=${post.creatorId}`, {}, "GET");
  const currentUserObj = await apiCall(`user?userId=${localStorage.getItem("userId")}`, {}, "GET");
  const currentUserName = currentUserObj.name;
  const creatorName = response.name;

  // profile pic
  const profilePic = document.createElement("div");
  profilePic.className = "profile-picture rounded-circle bg-secondary text-white d-flex justify-content-center align-items-center";
  profilePic.style.width = "50px";
  profilePic.style.height = "50px";
  profilePic.style.fontSize = "1.3rem";
  if (response.image) {
    const profileImg = document.createElement("img");
    profileImg.className = "profile-image";
    profileImg.src = response.image;
    profileImg.style.width = "50px";
    profileImg.style.height = "50px";
    profilePic.classList.remove("bg-secondary");
    profileImg.classList.add("rounded-circle");
    profilePic.appendChild(profileImg);    
  } else {
    profilePic.textContent = creatorName ? creatorName.charAt(0) : "U";
  }
  
  const pfpContainer = document.createElement("div");
  pfpContainer.style.width = "50px";
  pfpContainer.style.flexShrink = "0";
  pfpContainer.appendChild(profilePic);
  topSection.appendChild(pfpContainer);

  // create name element
  const nameElement = document.createElement("div");
  nameElement.className = "author-name fw-bold";
  nameElement.innerText = creatorName;
  nameElement.style.cursor = "pointer";
  nameElement.style.fontSize = "1.3rem";
  nameElement.addEventListener("click", ()=>{
    constructProfilePage(response);
    showPage("profile");
  })

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

    timeElement.innerText = `Posted on ${day}/${month}/${year}`; // DD/MM/YYYY
  } else {
    const diffInMs = now - timeCreated;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const reaminderMinutes = diffInMinutes % 60;
    timeElement.innerText = `Posted ${diffInHours} ${
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

  const startTime = new Date(post.start);
  const formattedStartDate = startTime.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  const startTimeContainer = document.createElement("div");
  startTimeContainer.classList.add("start-time", "bg-info", "bg-opacity-10", "px-3", "py-2","my-2", "rounded-pill", "text-primary", "fw-bold", "d-inline-block");
  startTimeContainer.innerText = `Start Date: ${formattedStartDate}`;
  console.log(startTime);
  // append element to main content
  postContent.append(postTitle, startTimeContainer, jobDetail, descriptionImg);
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

  // liked by section
  const likeBy = document.createElement("div");
  likeBy.className = "like-by";
  likeBy.classList.add("text-muted", "small", "mt-3", "mb-2", "d-block");
  // New likes
  let haveLiked = false;
  let likeByContent = [];
  likeByContent = post.likes.map(like => like.userName);
  for (const e of post.likes) {
    if (String(e.userId) === localStorage.getItem("userId")) {
      haveLiked = true;
      break;
    }
  }
  likeBy.innerText = likeByContent.length > 0 ? `Liked by: ${likeByContent.join(', ')}` : 'No likes yet';
  updateLikeBtn(likeBtn, haveLiked);
  handleLikes(likeBtn, likeBy, post, currentUserName, haveLiked);

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
  const commentsList = document.createElement("div");
  commentsList.classList.add("comments-list");

  if (post.comments.length === 0) {
    // 如果没有评论，显示提示信息
    const noComments = document.createElement("p");
    noComments.classList.add("text-muted", "small", "fst-italic");
    noComments.innerText = "No comments yet";
    comSection.appendChild(noComments);
  }
  
  if (post.comments.length > 0) {
    (async () => {    
      for (const comment of post.comments) {
        const commentElement = await createComment(comment);
        commentsList.appendChild(commentElement);
      }
    })();
  }
  
  comSection.appendChild(commentsList);
  // Add new comment
  const commentForm = document.createElement("div");
  commentForm.classList.add("comment-form", "mt-3", "d-flex");

  const commentInput = document.createElement("input");
  commentInput.type = "text";
  commentInput.required = true;
  commentInput.classList.add("form-control", "form-control-sm", "me-2");
  commentInput.placeholder = "Add a comment...";

  const commentSubmit = document.createElement("button");
  commentSubmit.classList.add("btn", "btn-sm", "btn-primary");
  commentSubmit.innerText = "Post";

  // dynamically add comments functionality
  handlePostComment(commentSubmit, commentInput, currentUserName, commentsList, comBtn, post);
  commentForm.appendChild(commentInput);
  commentForm.appendChild(commentSubmit);
  comSection.appendChild(commentForm);

  // Toggle comments when clicking the comment button
  comBtn.addEventListener("click", () => {
    comSection.classList.toggle("hide");
  });

  commAndLikes.append(likeBtn, comBtn);
  feedPost.appendChild(commAndLikes);
  feedPost.appendChild(likeBy);
  feedPost.appendChild(comSection);
  document.querySelector(".feed").appendChild(feedPost);
};

// profile page logic
const constructProfilePage = async (userResponse) => {
  const profilePagePic = document.querySelector(".profile-page-pic");
  const profileName = document.querySelector(".profile-page-username");
  const emailDetail = document.querySelector(".profile-email-value");
  const watchCount = document.querySelector(".profile-watch-count");
  const followedBy = document.querySelector(".followed-by-name");
  const userWhoWatchMeIds = userResponse.usersWhoWatchMeUserIds;
  let followedByName = [];
  for (const id of userWhoWatchMeIds) {
    const user = await apiCall(`user?userId=${id}`,{},"GET");
    if (user && user.name) {
      followedByName.push(user.name);
    }
  }

  followedBy.innerText = followedByName.join(", ");
  emailDetail.innerText = userResponse.email;
  watchCount.innerText = userWhoWatchMeIds.length;
  profilePagePic.replaceChildren();
  profileName.innerText = userResponse.name;
  const avatarContainer = document.createElement("div");
  profilePagePic.appendChild(avatarContainer);
  avatarContainer.className = "profile-avatar-container rounded-circle bg-secondary fs-3 text-white d-flex justify-content-center align-items-center";
  avatarContainer.style.width = "70px";
  avatarContainer.style.height = "70px";
  if (userResponse.image) {
    const profileImg = document.createElement("img");
    profileImg.className = "profile-image";
    profileImg.src = userResponse.image;
    profileImg.style.width = "70px";
    profileImg.style.height = "70px";
    avatarContainer.classList.remove("bg-secondary");
    profileImg.classList.add("rounded-circle");
    avatarContainer.appendChild(profileImg);    
  } else {
    avatarContainer.textContent = userResponse.name ? userResponse.name.charAt(0) : "U";
  }
  
  // follow button logic
  const followBtnContainer = document.querySelector(".profile-follow-btn-container");
  if (followBtnContainer) {
    followBtnContainer.innerHTML = "";
    
    const currentUserId = parseInt(localStorage.getItem("userId"));
    const currentUserObj = await apiCall(`user?userId=${currentUserId}`);
    const currentUserName = currentUserObj.name;
    if (userResponse.id !== currentUserId) {
      const followBtn = document.createElement("button");
      followBtn.className = "btn btn-primary";
      
      // check if is following
      let isFollowing = userResponse.usersWhoWatchMeUserIds.includes(currentUserId);
      updateFollowBtn(followBtn, isFollowing);
      
      // followBtn functionality
      followBtn.addEventListener("click", async () => {
        isFollowing = !isFollowing;
        updateFollowBtn(followBtn, isFollowing);
        
        await apiCall("user/watch", {
          email: userResponse.email,
          turnon: isFollowing
        }, "PUT");
        
        // update watch count
        const updatedUser = await apiCall(`user?userId=${userResponse.id}`, {}, "GET");
        watchCount.innerText = updatedUser.usersWhoWatchMeUserIds.length;
        if (isFollowing) {
          if (!followedByName.includes(currentUserName)) {
            followedByName.unshift(currentUserName);
          }
        } else {
          followedByName = followedByName.filter(name => name !== currentUserName)
        }
        followedBy.innerText = followedByName;
      });
      
      followBtnContainer.appendChild(followBtn);
    }
  }
  
  console.log(userResponse);
}

const updateFollowBtn = (btn, isFollowing) => {
  if (isFollowing) {
    btn.innerText = "👀 Watching Now";
    btn.classList.remove("btn-primary");
    btn.classList.add("btn-success");
  } else {
    btn.innerText = "👀 Watch";
    btn.classList.remove("btn-success");
    btn.classList.add("btn-primary");
  }
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
const logoutBtn = document.getElementsByClassName("logout-btn");
for (const element of logoutBtn) {
  element.addEventListener("click", () => {
    localStorage.clear();
    showPage("login");

  });
};
const homePageBtn = document.getElementsByClassName("home-page-button");
for (const element of homePageBtn) {
  element.addEventListener("click", () => {
    showPage("home");
  });
}
