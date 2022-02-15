import {
  deleteMessage,
  getUser,
  joinChannel,
  unpinMessage,
  pinMessage,
  reactMessage,
  unreactMessage,
} from "./api.js";
import {
  displayReactions,
  generateReactionsObject,
  getPvtChannelTab,
  getReadableDate,
  populateAllImgModal,
  populateUserInfo,
} from "./helpers.js";
import {
  updateChannelInfo,
  changeChannel,
  getCurrentChannel,
  rerenderSidebar,
  removeMsgFromFeed,
  isUserMsg,
  updateMsgToEdit,
  currentChannelMessages,
  rerenderMessage,
  setMessagesLoaded,
  getMessagesLoaded,
  setCurrentChannelMessages,
} from "./state.js";

/**
 * Populates the public channel accordion of the sidebar
 * @param {Object} channel - The chanel object
 */
export const createPubChnlItem = (channel) => {
  const chnlAccordion = document.getElementById("public-channels");
  const newChnlItem = document.getElementById("pub-chnl-item").cloneNode(true);
  const channelName = newChnlItem.children[0].children[1];
  const joinBtn = newChnlItem.children[1];
  if (channel.members.includes(localStorage.getItem("id"))) {
    joinBtn.style.display = "none";
  }
  newChnlItem.dataset.channelIdPub = channel.id;
  newChnlItem.removeAttribute("id");
  newChnlItem.classList.remove("template");
  newChnlItem.addEventListener("click", () => {
    // add change info here
  });
  channelName.innerText = channel.name;
  joinBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    // add join channel functionality here
    joinChannel(channel.id).then((res) => {
      if (!res.error) {
        updateChannelInfo(channel).then(() => rerenderSidebar());
      }
    });
  });
  chnlAccordion.appendChild(newChnlItem);
};

/**
 * Populates the my channel accordion of the sidebar
 * @param {Object} channel - The chanel object
 * @param {boolean} isPublic - Wether or not the channel is public
 */
export const createMyChnlItem = (channel, isPublic) => {
  const chnlAccordion = document.getElementById("my-channels");
  let newChnlItem;
  if (isPublic) {
    newChnlItem = document.getElementById("pub-chnl-item").cloneNode(true);
  } else {
    newChnlItem = document.getElementById("prv-chnl-item").cloneNode(true);
  }
  const channelName = newChnlItem.children[0].children[1];
  newChnlItem.dataset.channelIdPvt = channel.id;
  newChnlItem.removeAttribute("id");
  newChnlItem.classList.remove("template");
  newChnlItem.addEventListener("click", () => {
    // change the channel when clicked
    const currentChannel = getCurrentChannel();
    if (currentChannel) {
      const currentChnlTab = getPvtChannelTab(currentChannel.id);
      currentChnlTab.classList.remove("active");
    }
    newChnlItem.classList.add("active");
    changeChannel(newChnlItem.dataset.channelIdPvt);
    const sidebar = document.getElementById("sidebar");
    sidebar.classList.remove("sidebar-visible");
    const messageTextBox = document.getElementById("msg-text-box");
    messageTextBox.style.display = "";
  });
  channelName.innerText = channel.name;
  // join button only available for cthe public channel section of sidebar
  newChnlItem.children[1].style.display = "none";
  chnlAccordion.appendChild(newChnlItem);
};

/**
 * creates a new message from template and adds it to the feed
 *
 * @param {Object} message - message to be added to the feed
 * @param {*} isNewMsg - if true then msg is prepended not appended
 */
export const createMessageItem = (message, isNewMsg = false) => {
  const currentChannel = getCurrentChannel();
  const messageFeed = document.getElementById("msg-cnt");
  const newMessage = document.getElementById("msg-template").cloneNode(true);
  const messageUser = newMessage.getElementsByTagName("strong")[0];
  const timeStamp = newMessage.querySelector(".text-muted");
  const messageText = newMessage.getElementsByTagName("p")[1];
  const pinBtn = newMessage.querySelector(".pin-msg");
  const pinIcon = newMessage.querySelector(".pinned");
  const editBtn = newMessage.querySelector(".edit-msg");
  const deleteBtn = newMessage.querySelector(".delete-msg");
  const reactBtns = newMessage.querySelectorAll("[data-react]");
  const reactionsBar = newMessage.querySelector(".reactions-bar");
  const reactionBarEmojis = reactionsBar.children;
  const userImg = newMessage.querySelector(".user-img");
  const msgImg = newMessage.querySelector(".msg-img");
  const modalMsgBox = document.getElementById("edit-msg-text");
  const editedStamp = newMessage.querySelector(".edited");
  // populate messageReactions based on the reactions in message
  let messageReactions = generateReactionsObject(message);

  // if the message has been edited display it
  if (message.edited) {
    editedStamp.classList.remove("d-none");
    editedStamp.innerText = `Edited: ${getReadableDate(message.editedAt)}`;
  }
  // display reactions
  displayReactions(reactionBarEmojis, messageReactions, reactionsBar);

  if (!isUserMsg(localStorage.getItem("id"), message)) {
    deleteBtn.style.display = "none";
    editBtn.style.display = "none";
  }
  messageText.removeAttribute("id");
  newMessage.dataset.messageId = message.id;
  newMessage.dataset.senderId = message.sender;
  newMessage.classList.remove("template");
  newMessage.removeAttribute("id");
  messageUser.innerText = message.sender.name;
  userImg.src = message.sender.image;

  timeStamp.innerText = getReadableDate(message.sentAt);
  if (!message.image) {
    messageText.innerText = message.message;
    messageText.classList.remove("d-none");
    msgImg.parentNode.classList.add("d-none");
  } else {
    messageText.classList.add("d-none");
    msgImg.parentNode.classList.remove("d-none");
    msgImg.src = message.image;
  }
  // delete button click event
  deleteBtn.addEventListener("click", () => {
    deleteMessage(currentChannel.id, message.id).then((res) => {
      if (!res.error) {
        removeMsgFromFeed(message);
      }
    });
  });
  // open edit button modal click event
  editBtn.addEventListener("click", () => {
    const imgArea = document.getElementById("edit-msg-img-area");
    const msgArea = document.getElementById("edit-msg-form");
    if (message.image) {
      imgArea.classList.remove("d-none");
      msgArea.classList.add("d-none");
      imgArea.querySelector("img").src = msgImg.src;
    } else {
      imgArea.classList.add("d-none");
      msgArea.classList.remove("d-none");
      modalMsgBox.value = messageText.innerText;
    }
    // update the message to the latest edit
    message = currentChannelMessages.find((msg) => msg.id === message.id);
    console.log(message);
    updateMsgToEdit(message);
  });
  // change the text of the pinned button and the display of the pinned icon
  // based on if the messasge is pinned
  if (message.pinned) {
    pinIcon.classList.remove("d-none");
    pinBtn.innerText = "Unpin";
  } else {
    pinIcon.classList.add("d-none");
    pinBtn.innerText = "Pin";
  }
  // pin button click event
  pinBtn.addEventListener("click", () => {
    // update the message to the latest edit as the message passed into
    // this function hold the version at node creation time
    message = currentChannelMessages.find((msg) => msg.id === message.id);
    if (message.pinned) {
      unpinMessage(currentChannel.id, message.id).then((res) => {
        if (!res.error) {
          message.pinned = false;
          messageReactions = generateReactionsObject(message);
          rerenderMessage(message, messageReactions);
        }
      });
    } else {
      pinMessage(currentChannel.id, message.id).then((res) => {
        if (!res.error) {
          message.pinned = true;
          messageReactions = generateReactionsObject(message);
          rerenderMessage(message, messageReactions);
        }
      });
    }
  });

  // click events for reaction buttons
  reactBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const reactValue = btn.dataset.react;
      message = currentChannelMessages.find((msg) => msg.id === message.id);
      const sameReaction = message.reacts.find((react) => {
        return (
          react.user === localStorage.getItem("id") &&
          react.react === reactValue
        );
      });
      const body = {
        react: reactValue,
      };
      const promiseList = [];
      if (sameReaction) {
        promiseList.push(unreactMessage(currentChannel.id, message.id, body));
      } else {
        promiseList.push(reactMessage(currentChannel.id, message.id, body));
      }
      Promise.race(promiseList).then((res) => {
        if (!res.error) {
          const message = res.message;
          setCurrentChannelMessages(
            currentChannelMessages.map((msg) => {
              if (msg.id === message.id) {
                return message;
              } else {
                return msg;
              }
            })
          );

          messageReactions = generateReactionsObject(message);
          rerenderMessage(message, messageReactions);
        }
      });
    });
  });

  // clicking on the name to open the profile
  newMessage.querySelector(".no-link").addEventListener("click", () => {
    if (localStorage.getItem("id") === message.sender.userId) {
      populateUserInfo(true);
    } else {
      populateUserInfo(false, message.sender.userId);
    }
  });

  // clicking on image message to open show all image modal
  newMessage.querySelector(".no-link-img").addEventListener("click", () => {
    populateAllImgModal(message);
  });

  if (!isNewMsg) {
    messageFeed.append(newMessage);
  } else {
    messageFeed.prepend(newMessage);
  }
  // setMessagesLoaded(getMessagesLoaded() + 1);
};

/**
 *  Creates an alert box with an error text
 *
 * @param {string} error - the error to display
 */
export const createAlertError = (error) => {
  //  alert is displayed below navbar
  const main = document.querySelector("main");
  const alertBox = document
    .getElementById("alert-error-template")
    .cloneNode(true);
  const alertText = alertBox.querySelector("span");

  alertBox.removeAttribute("id");
  alertBox.classList.remove("template");
  alertText.innerText = error;
  main.appendChild(alertBox);
};

/**
 *  creates a pinned message from the html template to be displayed in
 *  the pinned messages modal
 *
 * @param {object} message - the pinned message to be displayed
 */
export const createPinnedMsgItem = (message) => {
  const currentChannel = getCurrentChannel();
  const messageFeed = document.getElementById("pinned-msg-cnt");
  const newMessage = document
    .getElementById("pinned-msg-template")
    .cloneNode(true);
  const messageUser = newMessage.getElementsByTagName("strong")[0];
  const timeStamp = newMessage.querySelector(".text-muted");
  const messageText = newMessage.getElementsByTagName("p")[1];
  const reactionsBar = newMessage.querySelector(".reactions-bar");
  const reactionBarEmojis = reactionsBar.children;
  const userImg = newMessage.querySelector(".user-img");
  const msgImg = newMessage.querySelector(".msg-img");
  const user = message.sender;
  let messageReactions = generateReactionsObject(message);

  // display reactions
  displayReactions(reactionBarEmojis, messageReactions, reactionsBar);
  newMessage.classList.remove("template");
  newMessage.removeAttribute("id");

  messageUser.innerText = user.name;
  userImg.src = user.image;

  timeStamp.innerText = getReadableDate(message.sentAt);
  if (!message.image) {
    messageText.innerText = message.message;
    messageText.classList.remove("d-none");
    msgImg.parentNode.classList.add("d-none");
  } else {
    messageText.classList.add("d-none");
    msgImg.parentNode.classList.remove("d-none");
    msgImg.src = message.image;
  }
  messageFeed.append(newMessage);
};

/**
 *  creates a invite user item based on the user passed in.
 *  Used in the invite users part of channel info modal
 *
 * @param {object} user - the user
 */
export const createInviteUserItem = (user) => {
  const inviteMemberList = document.getElementById("invite-member-list");
  const inviteUserItem = document
    .getElementById("invite-user-template")
    .cloneNode(true);
  const userName = inviteUserItem.querySelector("label");
  const inputValue = inviteUserItem.querySelector("input");
  inviteUserItem.removeAttribute("id");
  inviteUserItem.classList.remove("template");
  userName.innerText = user.name;
  inputValue.value = user.userId;
  inviteMemberList.append(inviteUserItem);
};

/**
 *
 * creates a spinner to be displayed at the top of the mesg feed when
 * new messages are being loaded
 */
export const createSpinnerItem = () => {
  const msgCnt = document.getElementById("msg-cnt");
  const newSpinner = document
    .getElementById("spinner-template")
    .cloneNode(true);
  newSpinner.classList.remove("template");
  newSpinner.removeAttribute("id");
  msgCnt.append(newSpinner);
  return newSpinner;
};
