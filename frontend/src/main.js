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
        // return Promise.reject(new Error(data.error));
      } else {
        return Promise.resolve(data);
      }
    });
};

// feed logic
const loadFeed = async (feed, startAt) => {
  const response = await apiCall(`job/feed/?start=${startAt}`,{},"GET");
  window.currentIndex = startAt;
  if (startAt === 0) {
    document.querySelector(feed).innerHTML = "";
    setupInfScroll(feed);
  }
  response.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const feedContainer = document.querySelector(feed);
  for (const post of response) {
    const postElement = await createPost(post);
    feedContainer.appendChild(postElement);
  }; 
  // setupPagination(feed, startAt);
  window.isLoading = false;
  return response.length;
};

const setupInfScroll = (feed) => {

  window.currentIndex = 0;
  window.isLoading = false;
  window.noMorePosts = false;

  window.scrollListener = () => {
    if (window.isLoading || window.noMorePosts) return;
    
    const scrollPosition = window.scrollY + window.innerHeight;
    const pageHeight = document.documentElement.scrollHeight;

    if (pageHeight - scrollPosition < 30) {
      window.isLoading = true;
      const spinner = document.querySelector(".loading");
      if (spinner) spinner.classList.remove("d-none");
      
      loadFeed(feed, window.currentIndex + 5)
        .then((res) => {
          if (res === 0) {
            window.noMorePosts = true;
            if (spinner) spinner.classList.add("d-none");
          }
        })
        .catch(err => {
          console.error("Error loading:", err);
          window.isLoading = false;
          if (spinner) spinner.classList.add("d-none");
        });
    }
  };
  window.addEventListener("scroll", window.scrollListener);
}
const loadJob = async (userResponse) => {
  const container = document.querySelector(".job-posted-container");
  container.innerHTML = "";
  
  if (!userResponse.jobs || userResponse.jobs.length === 0) {
    const noJobsMessage = document.createElement("div");
    noJobsMessage.className = "alert alert-info text-center";
    noJobsMessage.innerText = "No jobs posted yet";
    container.appendChild(noJobsMessage);
    return;
  }

  const jobs = userResponse.jobs;
  jobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  for (const post of jobs) {
    const postElement = await createPost(post);
    container.appendChild(postElement);
  }; 
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

const createPost = async (post) => {
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
  // delete button and edit button
  const buttonDiv = document.createElement("div");
  const deletePostBtn = document.createElement("button");
  const editPostBtn = document.createElement("button");
  buttonDiv.append(editPostBtn, deletePostBtn);
  buttonDiv.classList.add("ms-auto");
  deletePostBtn.className = "btn btn-light d-none";
  editPostBtn.className = "btn btn-light d-none";
  editPostBtn.innerText = "✏️ Edit Post";
  deletePostBtn.innerText = "🗑️ Delete";
  if (post.creatorId === parseInt(localStorage.getItem("userId"))) {
    editPostBtn.classList.remove("d-none");
    deletePostBtn.classList.remove("d-none");
  }
  deletePostBtn.addEventListener("click", () => {
    apiCall("job", { id: post.id }, "DELETE")
    .then(() => {
      feedPost.remove();
    });
  });

  editPostBtn.addEventListener("click", () => {
    const jobTitleEdit = document.getElementById("job-title");
    jobTitleEdit.value = post.title;
    const jobDescriptionEdit = document.getElementById("job-text");
    jobDescriptionEdit.textContent = post.description;
    const startDatePicker = document.getElementById("dateInput");
    const formattedDate = new Date(post.start).toLocaleDateString('en-CA', { timeZone: 'Australia/Sydney' });
    startDatePicker.value = formattedDate;
    const currentImgDisplay = document.querySelector(".current-image-display");
    currentImgDisplay.src = post.image;
    editPostPopup();
    
    const editPostSave = document.querySelector(".save-job-edit");
    editPostSave.addEventListener("click", ()=> {
      const updatedTitle = document.getElementById("job-title").value;
      const updatedDescription = document.getElementById("job-text").value;
      const updatedStartDate = new Date(document.getElementById("dateInput").value);
      const updatedImage = currentImgDisplay.src;
  
      apiCall("job", {
        id: post.id,
        title: updatedTitle,
        description: updatedDescription,
        start: updatedStartDate,
        image: updatedImage
      }, "PUT").then(() => {
        editPostSave.classList.remove("btn-primary");
        editPostSave.classList.add("btn-success");
        editPostSave.innerText = "Saved!";
        setTimeout(() => {
          editPostSave.classList.remove("btn-success");
          editPostSave.classList.add("btn-primary");
          editPostSave.innerText = "Save Changes";
        }, 800);
      });
    });
  });

  const currentImgInput = document.getElementById("job-image-upload");
  const currentImgDisplay = document.querySelector(".current-image-display");
  currentImgInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      fileToDataUrl(file)
        .then((base64Data) => {
          currentImgDisplay.src = base64Data;
        })
        .catch((error) => {
          console.error("Error converting image:", error);
          errorPopup("Failed to process the image");
        });
    }
  });

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
  topSection.appendChild(buttonDiv);
  feedPost.appendChild(topSection);
  // append element to main content
  const postContent = document.createElement("div");
  const postTitle = document.createElement("h4");
  const jobDetail = document.createElement("p");
  const descriptionImg = document.createElement("img");
  const startTime = new Date(post.start);
  const formattedStartDate = startTime.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  const startTimeContainer = document.createElement("div");
  postContent.append(postTitle, startTimeContainer, jobDetail, descriptionImg);
  feedPost.appendChild(postContent);

  // create post main content
  postContent.className = "post-content";
  postContent.style.width = "100%";
  // create post title
  postTitle.className = "post-title";
  postTitle.innerText = post.title;
  // create job description
  jobDetail.className = "post-job-detail";
  jobDetail.innerText = post.description;
  //create img element
  descriptionImg.classList.add("img-fluid", "img-thumbnail");
  descriptionImg.style.width = "100%";
  descriptionImg.src = post.image;

  startTimeContainer.classList.add("start-time", "bg-info", "bg-opacity-10", "px-3", "py-2","my-2", "rounded-pill", "text-primary", "fw-bold", "d-inline-block");
  startTimeContainer.innerText = `Start Date: ${formattedStartDate}`;
  console.log(startTime);
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
    await Promise.all(post.comments.map(async (comment) => {
      const commentElement = await createComment(comment);
      commentsList.appendChild(commentElement);
    }));
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
  return feedPost;
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
  followBtnContainer.innerHTML = "";
  if (followBtnContainer) {
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
        followedBy.innerText = followedByName.join(", ");
      });
      
      followBtnContainer.appendChild(followBtn);
    } else {
      followBtnContainer.innerHTML = "";
      const updateProfileBtn = document.createElement("button");
      followBtnContainer.appendChild(updateProfileBtn);
      updateProfileBtn.className = "update-profile-btn btn btn-outline-dark";
      updateProfileBtn.innerText = "📝 Edit your profile";
      updateProfileBtn.addEventListener("click", () => {
        updateUserValue();
        showPage("profile-edit");
      })
    }
  }
  // job-posting made by this person
  loadJob(userResponse);
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
  loadFeed(".feed",0);
} else {
  showPage("login");
}

const errorPopup = (msg) => {
  const popup = document.getElementById("popup");
  popup.querySelector(".modal-body p").textContent = msg;
  const modalInstance = new bootstrap.Modal(popup);
  modalInstance.show();
};

const editPostPopup = () => {
  const popup = document.getElementById("edit-post-popup");
  const modalInstance = new bootstrap.Modal(popup);
  modalInstance.show();
}
const createPostPopup = () => {
  const popup = document.getElementById("new-post-popup");
  const modalInstance = new bootstrap.Modal(popup);
  modalInstance.show();
}

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
      loadFeed(".feed",0);
      updateUserDisplay();
    });
  }
});

// login logic
const loginBtn = document.getElementById("login");
loginBtn.addEventListener("click", (event) => {
  event.preventDefault();
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
    loadFeed(".feed",0);
    updateUserDisplay();
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
const getCurrentUserDetail = async () => {
  const userResponse = await apiCall(`user?userId=${localStorage.getItem("userId")}`,{},"GET");
  return userResponse;
}

const updateUserDisplay = async () => {
  const loggedInAs = document.getElementsByClassName("current-user-name");
  for (const element of loggedInAs) {
    element.classList.add("me-2");
    element.style.cursor = "pointer";
    const userResponse = await getCurrentUserDetail();
    element.innerText = `Logged In As: ${userResponse.name}`;
    element.addEventListener("click", async ()=> {
      const userResponse = await apiCall(`user?userId=${localStorage.getItem("userId")}`,{},"GET");
      constructProfilePage(userResponse)
      showPage("profile");
    })
  }
}

// edit profile logic
const editEmail = document.getElementById("edit-email");
const editName = document.getElementById("edit-name");
const editPassword = document.getElementById("edit-password");
const updateUserValue = async () => {
  const editAvatar = document.querySelector(".avatar-profile-edit");
  const userDetail = await getCurrentUserDetail();
  editAvatar.src = userDetail.image;
  editEmail.value = userDetail.email;
  editName.value = userDetail.name;
  editPassword.value = '';
}
if (localStorage.getItem("token")) {
  updateUserDisplay();
}
const fileInput = document.getElementById("profile-image-upload");
const fileSelectedText = document.getElementById('file-selected');
let imageBase64 = undefined;

fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (file) {
    fileSelectedText.textContent = `Selected: ${file.name}`;
    // Convert the file to base64
    fileToDataUrl(file)
      .then((base64Data) => {
        imageBase64 = base64Data;
        document.querySelector(".avatar-profile-edit").src = imageBase64;
        console.log("Image converted to base64");
      })
      .catch((error) => {
        console.error("Error converting image:", error);
        errorPopup("Failed to process the image");
      });
  } else {
    fileSelectedText.textContent = 'No file selected';
    imageBase64 = undefined;
  }
});
const saveChanges = document.getElementById("save-profile");
saveChanges.addEventListener("click", async (event)=>{
  event.preventDefault();
  saveChanges.innerText = "Saving..."
  saveChanges.disable = true;
  const userCurrentDetail = await getCurrentUserDetail();
  const body = {
    email: userCurrentDetail.email !== editEmail.value ? editEmail.value : undefined,
    password: editPassword.value ? editPassword.value : undefined,
    name: userCurrentDetail.name !== editName.value ? editName.value : undefined,
    image: userCurrentDetail.image !== imageBase64 ? imageBase64 : undefined
  }
  await apiCall("user",body,"PUT");
  saveChanges.classList.remove("btn-primary");
  saveChanges.innerText = "Saved!";
  saveChanges.classList.add("btn-success");
  // Reset button state
  setTimeout(() => {
    saveChanges.innerText = "Save Changes";
    saveChanges.classList.remove("btn-success");
    saveChanges.classList.add("btn-primary");
    saveChanges.disabled = false;
  }, 800);
})
// TODO Publish job posting
const createNewJobBtn = document.querySelector(".create-job-post");
createNewJobBtn.addEventListener("click", () => {
  createPostPopup();
  setupNewJobPosting();
});
// new job posting logic
document.querySelector(".post-job").addEventListener("click", function() {
  const postJobTitleField = document.getElementById("post-job-title");
  const postJobTextarea = document.getElementById("post-job-text");
  const postDateElement = document.getElementById("post-dateInput");
  const jobImageView = document.querySelector(".post-current-image-display");
  
  const title = postJobTitleField.value;
  const description = postJobTextarea.value;
  const startDate = new Date(postDateElement.value);
  const image = jobImageView.classList.contains("d-none") ? null : jobImageView.src;
  
  // Validate inputs
  if (!title || !description || !startDate || isNaN(startDate)) {
    errorPopup("Please fill in all required fields");
    return;
  }
  
  // Create new job posting
  apiCall("job", {
    title: title,
    image: image ? image : "",
    start: startDate,
    description: description,
  }, "POST").then(() => {
    this.classList.remove("btn-primary");
    this.classList.add("btn-success");
    this.innerText = "Posted!";
    
    // Reset form and close modal
    setTimeout(() => {
      this.classList.remove("btn-success");
      this.classList.add("btn-primary");
      this.innerText = "Post";
      
      postJobTitleField.value = '';
      postJobTextarea.value = '';
      postDateElement.value = '';
      jobImageView.src = "";
      jobImageView.classList.add("d-none");
      
      const popup = document.getElementById("new-post-popup");
      const modalInstance = bootstrap.Modal.getInstance(popup);
      modalInstance.hide();
    }, 800);
  });
});
const setupNewJobPosting = () => {
  const jobImageUploadInput = document.getElementById("post-job-image-upload");
  const jobImageView = document.querySelector(".post-current-image-display");
  const postJobButton = document.querySelector(".post-job");
  console.log(postJobButton);
  
  // Handle image upload preview
  jobImageUploadInput.addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (file) {
      fileToDataUrl(file)
        .then((base64Data) => {
          jobImageView.src = base64Data;
          jobImageView.classList.remove("d-none");
        })
        .catch((error) => {
          console.error("Error converting image:", error);
          errorPopup("Failed to process the image");
        });
    }
  });
};

