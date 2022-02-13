import {
  getAllUsers,
  getUser,
  inviteChannel,
  successMessages,
  updateUser,
  getPinnedMessages,
} from "./api.js";
import {
  chnlInfoModal,
  profileEditModal,
  previewImgModal,
} from "./DOMcache.js";
import {
  currentChannelMessages,
  getCurrentChannel,
  getMessagesLoaded,
  getTotalMessages,
} from "./state.js";
import {
  createPubChnlItem,
  createMyChnlItem,
  createMessageItem,
  createPinnedMsgItem,
  createInviteUserItem,
  createAlertError,
  createSpinnerItem,
} from "./templates.js";

// the image used when a user has not set a profile picture
export const DEFAULT_IMG = "./assets/images/defaultUserImage.png";

/**
 * Given a js file object representing a jpg or png image, such as one taken
 * from a html file input element, return a promise which resolves to the file
 * data as a data url.
 * More info:
 *   https://developer.mozilla.org/en-US/docs/Web/API/File
 *   https://developer.mozilla.org/en-US/docs/Web/API/FileReader
 *   https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 *
 * @param {File} file The file to be read.
 * @return {Promise<string>} Promise which resolves to the file as a data url.
 */
export function fileToDataUrl(file) {
  const validFileTypes = ["image/jpeg", "image/png", "image/jpg"];
  const valid = validFileTypes.find((type) => type === file.type);
  // Bad data, let's walk away.
  if (!valid) {
    createAlertError("provided file is not a png, jpg or jpeg image.");
    throw Error("provided file is not a png, jpg or jpeg image.");
  }

  const reader = new FileReader();
  const dataUrlPromise = new Promise((resolve, reject) => {
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
  });
  reader.readAsDataURL(file);
  return dataUrlPromise;
}

/**
 * adds styling and text to indicate the input is empty
 * @param {*} textBox - the span that shows an error
 * @param {*} input - the input to add styles to
 */
export const addInvalidFormStyle = (textBox, input) => {
  if (
    textBox.classList.contains("display-invalid-text") ||
    input.classList.contains("invalid-input")
  ) {
    return;
  } else {
    textBox.classList.add("display-invalid-text");
    input.classList.add("invalid-input");
  }
};

/**
 * removes styling and text that indicate the input is empty
 * @param {*} textBox - the span that shows an error
 * @param {*} input - the input to add styles to
 */
export const removeInvalidFormStyle = (textBox, input) => {
  textBox.classList.remove("display-invalid-text");
  input.classList.remove("invalid-input");
};

/**
 *
 *
 * @param {*} alertBox - The alert to be displayed
 * @param {*} message - the message to be shown inside the alert box
 * @param {boolean} [success=false] - If the alert should be red or green
 * green for success red for not
 */
export const displayAlert = (alertBox, message, success = false) => {
  if (success) {
    alertBox.classList.remove("alert-danger");
    alertBox.classList.add("alert-success");
  } else {
    alertBox.classList.remove("alert-success");
    alertBox.classList.add("alert-danger");
  }
  alertBox.classList.remove("d-none");
  alertBox.classList.add("show");
  alertBox.children[0].innerText = message;
  setTimeout(() => {
    alertBox.classList.add("d-none");
  }, 2000);
};

/**
 * Adds all the channels to the sidebar
 * @param {Array of Objects} channels
 */
export const populateSidebarChannels = (channels) => {
  const userId = localStorage.getItem("id");
  for (const channel of channels) {
    // for public channels
    if (!channel.private) {
      createPubChnlItem(channel);
      // if the user is a member of the public channel add it to the list
      // of joined channels
      if (channel.members.includes(userId)) {
        createMyChnlItem(channel, true);
      }
    } else {
      // if the channel is private and the use is a member
      if (channel.members.includes(userId)) {
        createMyChnlItem(channel, false);
      }
    }
  }
};
/**
 * Populates the message feed with the channels messages
 *
 * @param {Array of Objects} messages - the messages to be displayed
 * @param {number} [start=0] - index of first msg to be displayed
 * @param {number} [end=25] - index of last message to be displayed
 */
export const populateMessageFeed = (messages, start = 0, end = 25) => {
  for (const message of messages.slice(start, end)) {
    createMessageItem(message);
  }
};

/**
 * Removes all children from a node
 *
 * @param {HTML Node} node - The node to clear its children
 */
export const clearChildren = (node) => {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
};

/**
 *  Acquires the tab on the sidebar, in the my channels section, that
 * corresponds to the channelId
 *
 * @param {number} channelId
 * @return {DOM element} returns the tab on the side bar corresponding to the
 * channel id
 */
export const getPvtChannelTab = (channelId) => {
  if (channelId) {
    return document.querySelector(`[data-channel-id-pvt='${channelId}']`);
  }
};

/**
 *  Acquires the tab on the sidebar, in the public channels section, that
 * corresponds to the channelId
 *
 * @param {number} channelId
 * @return {DOM element} returns the tab on the side bar corresponding to the
 * channel id
 */
export const getPubChannelTab = (channelId) => {
  if (channelId) {
    return document.querySelector(`[data-channel-id-pub='${channelId}']`);
  }
};

/**
 *  checks if the user is a member of a particular channel
 *
 * @param {Object} channel - the channel to search
 * @param {number} userId - the id of the user
 * @return {boolean}
 */
export const isChannelMember = (channel, userId) => {
  return channel.members.includes(userId);
};

/**
 *  Populates the info of the channel for the channel info modal
 *
 * @param {Object} currentChannel - the channel currently selected
 */
export const populateChannelInfo = (currentChannel) => {
  // if no channel has yet been selected
  if (!currentChannel) return;
  // channel info modal section
  const nameField = document.getElementById("chnl-info-name");
  const descriptionField = document.getElementById("chnl-info-description");
  const privacyField = document.getElementById("chnl-info-privacy");
  const creatorField = document.getElementById("chnl-info-creator");
  const createdField = document.getElementById("chnl-info-created");
  nameField.innerText = currentChannel.name;
  descriptionField.innerText = currentChannel.description
    ? currentChannel.description
    : "empty";
  privacyField.innerText = currentChannel.private ? "private" : "public";
  getUser(currentChannel.creator).then((user) => {
    if (!user.error) {
      creatorField.innerText = user.name;
    }
  });

  createdField.innerText = getReadableDate(currentChannel.createdAt);

  // channel info edit modal section
  const editName = document.getElementById("edit-chnl-name");
  const editDescription = document.getElementById("edit-chnl-description");
  editName.value = currentChannel.name;
  editDescription.value = currentChannel.description;

  // channel members invite section
  const inviteMemberList = document.getElementById("invite-member-list");
  clearChildren(inviteMemberList);
  getAllUsers()
    .then((res) => {
      const promiseList = [];
      if (!res.error) {
        const { users } = res;
        users.map((user) => {
          // only show users not already members
          if (!isChannelMember(currentChannel, user.userId)) {
            promiseList.push(
              getUser(user.userId).then((res) => {
                if (!res.error) {
                  res.id = user.userId;
                  return res;
                }
              })
            );
          }
        });
      }
      return promiseList;
    })
    .then((promiseList) => {
      Promise.all(promiseList).then((users) => {
        users.sort((user1, user2) => user1.name.localeCompare(user2.name));
        for (const user of users) {
          createInviteUserItem(user);
        }
      });
    });
};

/**
 *  converts an ISO string to a readable date/time
 *
 * @param {string} ISOstring - the ISO string to be converted to readable date/time
 * @return {string} the readable date/time string
 */
export const getReadableDate = (ISOstring) => {
  const todayDate = new Date();
  const today = {
    year: todayDate.getFullYear(),
    month: todayDate.getMonth(),
    day: todayDate.getDate(),
  };
  const date = new Date(ISOstring);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  const period = hours < 12 ? "AM" : "PM";
  let dateToDisplay;
  if (year === today.year && month === today.month && day === today.day) {
    dateToDisplay = "Today";
  } else {
    dateToDisplay = `${day}/${month}/${year}`;
  }
  minutes = minutes < 10 ? "0" + minutes : minutes;
  hours = hours < 12 ? hours : hours - 12;
  return `${dateToDisplay} at ${hours}:${minutes} ${period}`;
};

/**
 *  removes a message from the displayed channel feed
 *
 * @param {object} message - the message to be removed from the feed
 */
export const removeMsgItem = (message) => {
  const msgItem = document.querySelector(`[data-message-id='${message.id}']`);
  msgItem.remove();
};

/**
 *  returns the html element of the displayed message
 *
 * @param {Object} message - the message to be acquired
 * @return {DOM element}
 */
export const getMsgItem = (message) => {
  return document.querySelector(`[data-message-id='${message.id}']`);
};

/**
 *  genereates an object with the reactions a message has
 *
 * @param {object} message - the message to generate reactions from
 * @return {object} - an object containing the reactions to a message
 */
export const generateReactionsObject = (message) => {
  const messageReactions = {};
  for (const react of message.reacts) {
    if (messageReactions[react.react]) {
      messageReactions[react.react].count++;
      messageReactions[react.react].users.push(react.user);
    } else {
      messageReactions[react.react] = { count: 1, users: [react.user] };
    }
  }
  return messageReactions;
};

/**
 *  displays the reactions of a message on the screen
 *
 * @param {DOM element} reactionBarEmojis
 * @param {object} messageReactions - the object containing the reaction for a message
 * @param {DOM element} reactionsBar
 */
export const displayReactions = (
  reactionBarEmojis,
  messageReactions,
  reactionsBar
) => {
  for (const emoji of reactionBarEmojis) {
    const emojiValue = emoji.dataset.reacted;
    if (messageReactions[emojiValue]) {
      emoji.classList.remove("d-none");
      reactionsBar.classList.remove("d-none");
      emoji.children[0].innerText = messageReactions[emojiValue].count;
    } else {
      emoji.classList.add("d-none");
    }
  }
};

/**
 * populates the pinned message modal with all the pinned messages of the current channel
 */
export const populatePinnedMessages = () => {
  const currentChannel = getCurrentChannel();
  const pinnedMsgFeed = document.getElementById("pinned-msg-cnt");
  getPinnedMessages(currentChannel.id).then(({ messages }) => {
    clearChildren(pinnedMsgFeed);
    if (!messages.length) {
      pinnedMsgFeed.innerText = "No Pinned Messages";
    }
    for (const message of messages) {
      createPinnedMsgItem(message);
    }
  });
};

/**
 *  Populates the user info modal
 *
 * @param {boolean} isCurrentUser - is the user whoms profile is being displayed the currently logged
 * in user
 * @param {number} [userId=null]
 */
export const populateUserInfo = (isCurrentUser, userId = null) => {
  const nameField = document.getElementById("user-profile-name");
  const bioField = document.getElementById("user-profile-bio");
  const emailField = document.getElementById("user-profile-email");
  const editBtn = document.getElementById("open-edit-profile");
  const imageField = document.getElementById("user-profile-image");
  const alertBox = document.getElementById("profile-info-alert");
  imageField.src = DEFAULT_IMG;

  let userName;
  let userBio;
  let userEmail;
  let userImage;
  if (!isCurrentUser) {
    getUser(userId, alertBox)
      .then((user) => {
        if (!user.error) {
          userName = user.name;
          userBio = user.bio;
          userEmail = user.email;
          userImage = user.image;
        }
      })
      .then(() => {
        nameField.innerText = userName;
        bioField.innerText = userBio ? userBio : "empty";
        emailField.innerText = userEmail;
        editBtn.classList.add("d-none");
        if (userImage) {
          imageField.src = userImage;
        }
      });
  } else {
    editBtn.classList.remove("d-none");
    userBio = localStorage.getItem("bio");
    userImage = localStorage.getItem("image");
    nameField.innerText = localStorage.getItem("name");
    bioField.innerText = userBio != "null" ? userBio : "empty";
    emailField.innerText = localStorage.getItem("email");
    if (userImage !== "") {
      imageField.src = userImage;
    }
    populateEditProfile();
  }
};
/**
 *  populates the edit profile modal
 */
export const populateEditProfile = () => {
  const nameField = document.getElementById("edit-profile-name");
  const bioField = document.getElementById("edit-profile-bio");
  const emailField = document.getElementById("edit-profile-email");
  const passwordField = document.getElementById("edit-profile-password");
  const imageField = document.getElementById("edit-profile-img");
  imageField.src = DEFAULT_IMG;

  const userImage = localStorage.getItem("image");
  nameField.value = localStorage.getItem("name");
  bioField.value =
    localStorage.getItem("bio") === "null"
      ? "empty"
      : localStorage.getItem("bio");
  emailField.value = localStorage.getItem("email");
  passwordField.value = localStorage.getItem("password");
  if (userImage !== "") {
    imageField.src = userImage;
  }
};
/**
 *  saves the profile info once edited
 *
 */
export const saveProfileInfo = () => {
  const nameField = document.getElementById("edit-profile-name");
  const bioField = document.getElementById("edit-profile-bio");
  const emailField = document.getElementById("edit-profile-email");
  const passwordField = document.getElementById("edit-profile-password");
  const imageField = document.getElementById("edit-profile-img");
  const newImage =
    imageField.src === DEFAULT_IMG
      ? localStorage.getItem("image")
      : imageField.src;

  const invalidNameText =
    nameField.parentNode.querySelector(".invalid-feedback");
  const invalidEmailText =
    emailField.parentNode.querySelector(".invalid-feedback");
  const invalidPasswordText =
    passwordField.parentNode.querySelector(".invalid-feedback");

  if (
    !nameField.value.trim() ||
    !emailField.value.trim() ||
    !passwordField.value.trim()
  ) {
    if (!nameField.value.trim()) {
      addInvalidFormStyle(invalidNameText, nameField);
    } else {
      removeInvalidFormStyle(invalidNameText, nameField);
    }
    if (!emailField.value.trim()) {
      addInvalidFormStyle(invalidEmailText, emailField);
    } else {
      removeInvalidFormStyle(invalidEmailText, emailField);
    }
    if (!passwordField.value.trim()) {
      addInvalidFormStyle(invalidPasswordText, passwordField);
    } else {
      removeInvalidFormStyle(invalidPasswordText, passwordField);
    }
    return;
  } else {
    removeInvalidFormStyle(invalidNameText, nameField);
    removeInvalidFormStyle(invalidEmailText, emailField);
    removeInvalidFormStyle(invalidPasswordText, passwordField);
  }
  const body = {
    // TODO: make sure email is not passed, should not be able to edit
    email: emailField.value,
    password: passwordField.value,
    name: nameField.value,
    bio: bioField.value,
    // must update when using images
    image: newImage,
  };
  const alertBox = document.getElementById("edit-profile-alert");
  updateUser(body, alertBox).then((res) => {
    if (!res.error) {
      localStorage.setItem("name", nameField.value);
      localStorage.setItem("email", emailField.value);
      localStorage.setItem("bio", bioField.value);
      localStorage.setItem("password", passwordField.value);
      localStorage.setItem("image", newImage);
      displayAlert(alertBox, successMessages.userInfo, true);
      const sidebarUserName = document.getElementById("side-bar-user-name");
      sidebarUserName.innerText = localStorage.getItem("name");
      if (newImage !== "null") {
        document.getElementById("nav-user-img").src = newImage;
      }
      const currentChannel = getCurrentChannel();
      if (currentChannel) {
        const messageFeed = document.getElementById("msg-cnt");
        for (const message of messageFeed.children) {
          const messageUserName = message
            .querySelector(".no-link")
            .querySelector("strong");
          const messageUserImage = message.querySelector(".user-img");
          if (message.dataset.senderId === localStorage.getItem("id")) {
            messageUserName.innerText = body.name;
            if (newImage !== "null") {
              messageUserImage.src = newImage;
            }
            // change image as well
          }
        }
      }
      setTimeout(() => {
        profileEditModal.hide();
      }, 1000);
    }
  });
};

/**
 *  Handles inviting users to the channel
 *
 */
export const inviteToChannel = () => {
  const currentChannel = getCurrentChannel();
  const inviteMembersList = document.getElementById("invite-member-list");
  const users = inviteMembersList.querySelectorAll("input");
  const selectedUsers = Array.from(users).filter((user) => user.checked);
  const alertBox = document.getElementById("invite-chnl-alert");
  const promiseList = [];
  for (const user of selectedUsers) {
    const body = {
      userId: parseInt(user.value),
    };
    promiseList.push(inviteChannel(currentChannel.id, body, alertBox));
  }
  Promise.all(promiseList).then((res) => {
    for (const user of selectedUsers) {
      currentChannel.members.push(parseInt(user.value));
    }
    displayAlert(alertBox, successMessages.invite, true);
    setTimeout(() => {
      chnlInfoModal.hide();
    }, 1000);
  });
};

/**
 *  Toggles between displaying or hiding the password
 *
 */
export const togglePasswordVisibility = () => {
  const passwordInput = document.getElementById("edit-profile-password");
  passwordInput.type = passwordInput.type === "text" ? "password" : "text";
};

/**
 *  displays the image to be previewed on screen
 *
 * @param {string} image - the image url to be displayed
 */
export const previewImage = (image) => {
  const previewImg = document
    .getElementById("preview-img-modal")
    .querySelector("img");
  previewImg.src = image;
  previewImgModal.show();
};

/**
 *  Loads more messages once the user has scrolled to the top of the msg feed,
 * if there are more messages to load. Used for infinite scroll
 *
 */
export const loadMoreMessages = () => {
  if (getMessagesLoaded() < getTotalMessages()) {
    const spinner = createSpinnerItem();
    const messagesLoaded = getMessagesLoaded();
    populateMessageFeed(
      currentChannelMessages,
      messagesLoaded,
      messagesLoaded + 25
    );
    // messages load to quickly so have to leave the spinner on for a bit for
    // it to be apparent that new messages are loading on infinite scroll
    setTimeout(() => {
      spinner.parentNode.removeChild(spinner);
    }, 300);
  }
};

/**
 *  populates the all images modal, allowing for cycling through all the images
 *  of the channel
 * @param {Object} message - the message that was clicked on to open the
 * all images modal
 */
export const populateAllImgModal = (message) => {
  const modalImage = document.getElementById("large-image");
  const imageMsgs = currentChannelMessages.filter((msg) => msg.image);
  let currentIndex = imageMsgs.findIndex((msg) => msg.id === message.id);
  const senderName = document.getElementById("img-sender-name");
  const sentAt = document.getElementById("img-sent-at");
  modalImage.src = message.image;
  sentAt.innerText = getReadableDate(imageMsgs[currentIndex].sentAt);
  getUser(message.sender).then((res) => {
    if (!res.error) {
      senderName.innerText = res.name;
    }
  });
  // pressing left btn to get previous image
  document.getElementById("prev-img-btn").addEventListener("click", () => {
    if (currentIndex === 0) {
      currentIndex = imageMsgs.length - 1;
    } else {
      currentIndex--;
    }
    modalImage.src = imageMsgs[currentIndex].image;
    sentAt.innerText = getReadableDate(imageMsgs[currentIndex].sentAt);
    getUser(imageMsgs[currentIndex].sender).then((res) => {
      if (!res.error) {
        senderName.innerText = res.name;
      }
    });
  });
  // pressing right btn to get next image
  document.getElementById("next-img-btn").addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % imageMsgs.length;
    modalImage.src = imageMsgs[currentIndex].image;
    sentAt.innerText = getReadableDate(imageMsgs[currentIndex].sentAt);
    getUser(imageMsgs[currentIndex].sender).then((res) => {
      if (!res.error) {
        senderName.innerText = res.name;
      }
    });
  });
};
