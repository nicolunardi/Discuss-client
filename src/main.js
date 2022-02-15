import api, {
  createChannel,
  fetchApi,
  getChannelMessages,
  leaveChannel,
  login,
  logout,
  register,
  sendMessage,
  successMessages,
  updateChannel,
  updateMessage,
} from "./api.js";
import {
  addInvalidFormStyle,
  displayAlert,
  fileToDataUrl,
  generateReactionsObject,
  inviteToChannel,
  loadMoreMessages,
  populateChannelInfo,
  populatePinnedMessages,
  populateUserInfo,
  previewImage,
  removeInvalidFormStyle,
  saveProfileInfo,
  togglePasswordVisibility,
} from "./helpers.js";
import {
  addChannel,
  addMsgToFeed,
  allChannels,
  changeChannel,
  changeState,
  currentChannelMessages,
  editChannelInfo,
  getCurrentChannel,
  initState,
  getMsgToEdit,
  rerenderChannel,
  rerenderSidebar,
  rerenderMessage,
  setCurrentChannelMessages,
} from "./state.js";
import {
  loginModal,
  registrationModal,
  newChnlModal,
  editChannelInfoModal,
  editMsgInfoModal,
  previewImgModal,
} from "./DOMcache.js";

initState();

/***************************************************************
                        Login section
***************************************************************/

// open the login modal
document
  .getElementById("open-login-modal-btn")
  .addEventListener("click", () => {
    loginModal.toggle();
  });

// open the registration modal
document
  .getElementById("open-register-modal-btn")
  .addEventListener("click", () => {
    registrationModal.toggle();
  });

// login handler
document
  .getElementById("login-modal-login-btn")
  .addEventListener("click", (e) => {
    e.preventDefault();
    const loginForm = document.getElementById("login-form");
    const formInputs = loginForm.querySelectorAll(".form-control");
    for (const input of formInputs) {
      const invalidText = input.parentNode.querySelector(".invalid-feedback");
      if (input.value === "") {
        // add styling and text to indicate teh input is empty
        addInvalidFormStyle(invalidText, input);
      } else {
        // remove the styling once the input is not empty
        removeInvalidFormStyle(invalidText, input);
      }
    }
    const [email, password] = loginForm;
    if (email.value && password.value) {
      // if both inputs are not empty proceed with login attempt
      const data = {
        email: email.value,
        password: password.value,
      };
      login(data);
    }
  });

// register handler
document.getElementById("reg-modal-reg-btn").addEventListener("click", (e) => {
  e.preventDefault();
  const regForm = document.getElementById("registration-form");
  const formInputs = regForm.querySelectorAll(".form-control");
  for (const input of formInputs) {
    const invalidText = input.parentNode.querySelector(".invalid-feedback");
    if (input.value === "") {
      // add styling and text to indicate teh input is empty
      addInvalidFormStyle(invalidText, input);
    } else {
      // remove the styling once the input is not empty
      removeInvalidFormStyle(invalidText, input);
    }
  }
  // reset the password mismatch text
  const passwordMismatchText = regForm.querySelectorAll(".password-mismatch");
  for (const element of passwordMismatchText) {
    element.classList.remove("display-invalid-text");
  }
  // check that all inputs arent empty
  const [email, name, password, password2] = regForm;
  if (Array.prototype.every.call(formInputs, (input) => input.value)) {
    // check that passwords match
    if (password.value !== password2.value) {
      for (const element of passwordMismatchText) {
        element.classList.add("display-invalid-text");
      }
    } else {
      // if both inputs are not empty proceed with registration attempt
      const data = {
        email: email.value,
        password: password.value,
        name: name.value.toLowerCase(),
      };
      register(data);
    }
  }
});

// alert close buttons
document.querySelectorAll(".alert .btn-close").forEach((btn) =>
  btn.addEventListener("click", (e) => {
    e.target.parentNode.classList.add("d-none");
  })
);

/***************************************************************
                        feed section
***************************************************************/

// opens/closes the sidebar when the window width is smaller, in larger window sizes
// sidebar is always visible
document.getElementById("sidebar-open-btn").addEventListener("click", () => {
  const sidebar = document.getElementById("sidebar");
  sidebar.classList.toggle("sidebar-visible");
});

// submits the form to create a new channel
document.getElementById("modal-new-chnl-btn").addEventListener("click", () => {
  // TODO check if name already exists
  const form = document.getElementById("new-chnl-form");
  const name = form.name;
  const description = form.description;
  const priv = form.priv;
  const invalidText = name.parentNode.querySelector(".invalid-feedback");
  if (name.value === "") {
    addInvalidFormStyle(invalidText, name);
    return;
  } else {
    removeInvalidFormStyle(invalidText, name);
  }
  const body = {
    name: name.value,
    private: priv.checked,
    description: description ? description.value : "",
  };

  const errorBox = document.getElementById("new-chnl-alert");
  createChannel(body, errorBox).then((res) => {
    if (res.channelId) {
      // add the channel to the list of all channels stored locally,
      // hide the modal and reset the form
      addChannel(res.channelId);
      newChnlModal.hide();
      document.getElementById("new-chnl-form").reset();
    }
  });
});

// logs the user out
document.getElementById("logout-btn").addEventListener("click", () => {
  logout().then((res) => {
    if (!res.error) {
      localStorage.clear();
      changeState("login");
      const sidebar = document.getElementById("sidebar");
      sidebar.classList.remove("sidebar-visible");
    }
  });
});

// edit the channel info
document.getElementById("save-chnl-info").addEventListener("click", (e) => {
  e.preventDefault();
  const currentChannel = getCurrentChannel();
  const name = document.getElementById("edit-chnl-name");
  const description = document.getElementById("edit-chnl-description");
  // previous values kept to ensure that the user has actually changed the
  // the values before submitting
  const prevName = currentChannel.name;
  const prevDescription = currentChannel.description;
  const invalidNameText = name.parentNode.querySelector(".invalid-feedback");
  const invalidDescriptionText =
    description.parentNode.querySelector(".invalid-feedback");
  // validation to ensure the channel info is edited
  if (
    (name.value === prevName && description.value === prevDescription) ||
    name.value === ""
  ) {
    if (name.value === "" || name.value === prevName) {
      if (name.value === "") {
        invalidNameText.innerText = "Can't be empty.";
      } else {
        invalidNameText.innerText = "Must make changes.";
      }
      addInvalidFormStyle(invalidNameText, name);
      return;
    } else {
      removeInvalidFormStyle(invalidNameText, name);
    }
    // validation for description field
    if (description.value === prevDescription) {
      addInvalidFormStyle(invalidDescriptionText, description);
      return;
    } else {
      removeInvalidFormStyle(invalidDescriptionText, description);
    }
  }

  const body = {
    name: name.value,
    description: description.value,
  };

  const errorBox = document.getElementById("edit-chnl-info-alert");

  updateChannel(currentChannel.id, body, errorBox).then((res) => {
    if (!res.error) {
      editChannelInfo(currentChannel.id, body);
      rerenderChannel(currentChannel);
      editChannelInfoModal.hide();
    }
  });
});

// leave the channel
document.getElementById("leave-chnl-btn").addEventListener("click", () => {
  const currentChannel = getCurrentChannel();
  leaveChannel(currentChannel.id).then((res) => {
    if (!res.error) {
      changeChannel(null);
      // remove the member from the allChannels list
      allChannels.map((channel) => {
        if (channel.id === currentChannel.id) {
          channel.members = channel.members.filter((member) => {
            return member !== localStorage.getItem("id");
          });
        }
      });
      // update the sidebar to remove the channel from My Channels list
      rerenderSidebar();
    }
  });
});

// send message
document.getElementById("send-msg-btn").addEventListener("click", () => {
  const currentChannel = getCurrentChannel();
  const messageBox = document.getElementById("msg-text");
  const body = {
    message: messageBox.value.trim(),
    image: "",
  };
  sendMessage(body, currentChannel.id).then((res) => {
    if (!res.error) {
      addMsgToFeed(res.message);
      messageBox.value = "";
      document.getElementById("msg-cnt").scrollTop = 0;
    }
  });
});

// toggle the send button's disabled property. If there is no message typed,
// then disable it
document.getElementById("msg-text").addEventListener("keyup", (e) => {
  const sendBtn = document.getElementById("send-msg-btn");
  e.target.value.trim() === ""
    ? (sendBtn.disabled = true)
    : (sendBtn.disabled = false);
});

// edit the message info through the modal
document.getElementById("edit-msg-btn").addEventListener("click", () => {
  const messageBox = document.getElementById("edit-msg-text");
  const currentMsg = getMsgToEdit();
  const currentChannel = getCurrentChannel();
  const invalidDescriptionText =
    messageBox.parentNode.querySelector(".invalid-feedback");
  if (!currentMsg.image) {
    if (
      messageBox.value === currentMsg.message ||
      messageBox.value.trim() === ""
    ) {
      if (messageBox.value === currentMsg.message) {
        invalidDescriptionText.innerText = "Must make changes";
      } else {
        invalidDescriptionText.innerText = "Can't be empty";
      }
      addInvalidFormStyle(invalidDescriptionText, messageBox);
      return;
    } else {
      removeInvalidFormStyle(invalidDescriptionText, messageBox);
    }
  }

  const body = {
    message: messageBox.value,
    image: "",
  };
  if (currentMsg.image) {
    const newImg = document.getElementById("edit-msg-img").src;
    body.message = "";
    body.image = newImg;
  }

  const errorBox = document.getElementById("edit-msg-alert");

  updateMessage(currentChannel.id, currentMsg.id, body, errorBox).then(
    (res) => {
      if (!res.error) {
        const updatedMsg = res.message;
        // update the current channel messages to reflect the updated message
        setCurrentChannelMessages(
          currentChannelMessages.map((msg) => {
            if (msg.id === updatedMsg.id) {
              return updatedMsg;
            } else {
              return msg;
            }
          })
        );

        const messageReactions = generateReactionsObject(updatedMsg);
        rerenderMessage(updatedMsg, messageReactions);
        const alertBox = document.getElementById("edit-msg-alert");
        displayAlert(alertBox, successMessages.editMessage, true);
        setTimeout(() => {
          editMsgInfoModal.hide();
        }, 1000);
      }
    }
  );
});

// button to open the pinned message modal
document.getElementById("pinned-msg-btn").addEventListener("click", () => {
  populatePinnedMessages();
});

// button to open the channel info modal
document.getElementById("info-btn").addEventListener("click", () => {
  populateChannelInfo(getCurrentChannel());
});

// button to invite people to the channel
document.getElementById("invite-btn").addEventListener("click", () => {
  const alertBox = document.getElementById("invite-chnl-alert");
  const checkedUserList = document
    .getElementById("invite-member-list")
    .querySelectorAll("input");
  // check at least one user is selected
  if (Array.from(checkedUserList).some((input) => input.checked)) {
    inviteToChannel();
  } else {
    displayAlert(alertBox, "Must select users");
  }
});

// clicking user profile button on nav bar
document.getElementById("user-img-btn").addEventListener("click", () => {
  populateUserInfo(true);
});

// submit the changes to user profile details
document.getElementById("save-profile").addEventListener("click", () => {
  saveProfileInfo();
});

// hide/show password button
document.getElementById("hide-password-btn").addEventListener("click", () => {
  togglePasswordVisibility();
});

// choose image message file button
document.getElementById("img-msg").addEventListener("change", (e) => {
  const file = e.target.files[0];
  fileToDataUrl(file).then((img) => {
    previewImage(img);
  });
  e.target.value = null;
});

// confirm send image button
document.getElementById("send-img-btn").addEventListener("click", () => {
  const currentChannel = getCurrentChannel();
  const img = document.getElementById("preview-img").src;
  const body = {
    message: "",
    image: img,
  };
  sendMessage(body, currentChannel.id).then((res) => {
    if (!res.empty) {
      getChannelMessages(currentChannel.id).then((res) => {
        if (!res.error) {
          const newMessage = res.messages[0];
          addMsgToFeed(newMessage);
          previewImgModal.hide();
        }
      });
    }
  });
});

// change profile image in edit user info
document
  .getElementById("edit-profile-img-input")
  .addEventListener("change", (e) => {
    const file = e.target.files[0];
    fileToDataUrl(file).then((img) => {
      const userImage = document.getElementById("edit-profile-img");
      userImage.src = img;
    });
    e.target.value = null;
  });

// change message image in edit message
document
  .getElementById("edit-msg-img-input")
  .addEventListener("change", (e) => {
    const file = e.target.files[0];
    fileToDataUrl(file).then((img) => {
      const msgPreview = document.getElementById("edit-msg-img");
      msgPreview.src = img;
    });
    e.target.value = null;
  });

// used for infinite scroll
document.getElementById("msg-cnt").addEventListener("scroll", (e) => {
  const msgCnt = e.target;
  const distFromTop =
    Math.abs(msgCnt.scrollHeight) - Math.abs(Math.round(msgCnt.scrollTop));

  if (
    distFromTop >= msgCnt.clientHeight - 5 &&
    distFromTop < msgCnt.clientHeight + 5
  ) {
    loadMoreMessages();
  }
});
