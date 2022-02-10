import api, {
  getUser,
  getChannelMessages,
  fetchApi,
  NUMBER_OF_MESSAGES,
} from "./api.js";
import {
  clearChildren,
  DEFAULT_IMG,
  displayReactions,
  getMsgItem,
  getPubChannelTab,
  getPvtChannelTab,
  getReadableDate,
  isChannelMember,
  populateMessageFeed,
  populateSidebarChannels,
  removeMsgItem,
} from "./helpers.js";
import { createMessageItem } from "./templates.js";

// the different states of the application. By default it is the login currentState,
// until the user logs in
const STATES = {
  login: {
    section: document.getElementById("log-in-section"),
  },
  feed: {
    section: document.getElementById("channel-section"),
  },
};

// the current state of the app, ie. the section to be
// displayed
let currentState = "feed";

//  all the channels
export let allChannels = [];
let currentChannel = null;
export let currentChannelMessages = [];
let totalMessages = 0;
let messagesLoaded = 0;
// hold the msg that is being edited for validation purposes
let msgToEdit = null;
let pinnedMsgs = [];

// Used as a flag to indicate when the recursion has finished. Had trouble
// figuring out how to wait for the last call of the recursive fetch call
let finishedFetchingMessages = false;

/**
 * checks that there is an authentication token in local storage,
 * used as helper function for stateManager
 */
const checkAuthentication = () => {
  return localStorage.getItem("token") !== null;
};

/**
 * Handles the changes of state of the app
 */
const stateManager = () => {
  STATES[currentState].section.style.display = "";
  // sets the display to none for all states that are not the one to be
  // displayed
  for (const state in STATES) {
    if (state !== currentState) {
      STATES[state].section.style.display = "none";
    }
  }
  if (currentState === "feed") {
    if (!checkAuthentication()) {
      changeState("login");
      return;
    }
    changeChannel(null);
    getUser(localStorage.getItem("id"))
      .then(({ email, name, bio, image }) => {
        localStorage.setItem("email", email);
        localStorage.setItem("name", name);
        localStorage.setItem("bio", bio);
        localStorage.setItem("image", image);
      })
      .then(() => {
        const sidebarUserName = document.getElementById("side-bar-user-name");
        sidebarUserName.innerText = localStorage.getItem("name");
        const navUserImg = document.getElementById("nav-user-img");
        if (localStorage.getItem("image") !== "") {
          navUserImg.src = localStorage.getItem("image");
        } else {
          navUserImg.src = DEFAULT_IMG;
        }
        return fetchApi(
          "GET",
          api.allChannels,
          localStorage.getItem("token"),
          null,
          null
        );
      })
      .then(({ channels }) => {
        allChannels = channels;
        rerenderSidebar();
      });
  }
};

/**
 * initializes the state
 *
 */
export const initState = () => {
  if (!checkAuthentication()) {
    changeState("login");
  } else {
    stateManager();
  }
};

/**
 * changes the state of the application
 * @param {string} newState - the new state to change to
 */
export const changeState = (newState) => {
  currentState = newState;
  stateManager();
};

const getFinishedFetchingMessages = () => {
  return finishedFetchingMessages;
};

// Took inspiration from stackoverflow for this function to deal with recursive
// fetch calls
// https://stackoverflow.com/questions/22125865/wait-until-flag-true
// Author: EranGrin
export const waitForFetch = () => {
  // creates a new promise to check if the deepest recursive call on the
  // getAllMsgsAtOnce function has concluded
  return new Promise((resolve, reject) => {
    const timePeriod = setInterval(() => {
      if (!getFinishedFetchingMessages()) return;
      clearInterval(timePeriod);
      resolve();
    }, 100);
    //  if its takking too long display error
    setTimeout(() => {
      clearInterval(timePeriod);
      reject("Error getting all messages");
    }, 10000);
  });
};

/**
 *  handles changing the channel
 *
 * @param {*} newChannelId - the channel id to change to
 */
export const changeChannel = (newChannelId) => {
  setMessagesLoaded(0);
  if (newChannelId === null) {
    currentChannel = null;
    rerenderChannels();
    return;
  }
  document.getElementById("info-btn").style.display = "";
  document.getElementById("leave-chnl-btn").style.display = "";
  document.getElementById("pinned-msg-btn").classList.remove("d-none");
  currentChannel = allChannels.find((channel) => {
    return channel.id === newChannelId;
  });
  getMessages(currentChannel.id).then((res) => {
    // take the user back to the start of the msg feed
    document.getElementById("msg-cnt").scrollTop = 0;
    setMessagesLoaded(NUMBER_OF_MESSAGES);
    rerenderChannels();
  });
};

export const getMessages = (channelId) => {
  return getChannelMessages(channelId, messagesLoaded).then(({ messages }) => {
    currentChannelMessages = messages;
  });
};

export const getAllMsgsAtOnce = (channelId) => {
  return ChannelId;
};

/**
 * displays the page before a channel has been selected
 *
 */
const displayLandingChannel = () => {
  const channelName = document.getElementById("msg-area-channel-name");
  const messageFeed = document.getElementById("msg-cnt");
  const infoBtn = document.getElementById("info-btn");
  const leaveBtn = document.getElementById("leave-chnl-btn");
  const messageTextBox = document.getElementById("msg-text-box");
  const pinnedMsgBtn = document.getElementById("pinned-msg-btn");
  pinnedMsgBtn.classList.add("d-none");
  channelName.innerText = "Choose a channel";
  infoBtn.style.display = "none";
  leaveBtn.style.display = "none";
  messageTextBox.style.display = "none";
  clearChildren(messageFeed);
};

/**
 * rerender the feed section to the relevant channel. populates feed with
 * the channels messages or displays the landing channel when no channels
 * are selected
 */
const rerenderChannels = () => {
  // the channel name on the bar on top of the messages.
  const channelName = document.getElementById("msg-area-channel-name");
  const messageFeed = document.getElementById("msg-cnt");
  if (currentChannel === null) {
    displayLandingChannel();
    return;
  }
  channelName.innerText = currentChannel.name;
  // remove all messages from the page before changing channels
  clearChildren(messageFeed);
  // display all the messages for the new channel on the page
  populateMessageFeed(currentChannelMessages);
};

/**
 *  rerenders the sidebar with all the channels
 *
 */
export const rerenderSidebar = () => {
  const pubChnlAccordion = document.getElementById("public-channels");
  const myChnlAccordion = document.getElementById("my-channels");
  clearChildren(pubChnlAccordion);
  clearChildren(myChnlAccordion);
  populateSidebarChannels(allChannels);
};

export const getState = () => currentState;

export const getCurrentChannel = () => currentChannel;

export const updateMsgToEdit = (newMsg) => {
  msgToEdit = newMsg;
};

export const getMsgToEdit = () => {
  return msgToEdit;
};

export const getTotalMessages = () => totalMessages;

export const setTotalMessages = (number) => (totalMessages = number);

export const getMessagesLoaded = () => messagesLoaded;

export const setMessagesLoaded = (number) => (messagesLoaded = number);

/**
 * Used when a user creates a new channel. Creates the new channel in the
 * backend, updates the allChannels list, and rerenders the sidebar
 *
 * @param {*} newChannelId
 * @return {*}
 */
export const addChannel = (newChannelId) => {
  return fetchApi(
    "GET",
    `${api.channelInfo}${newChannelId}`,
    localStorage.getItem("token"),
    null,
    null
  ).then((channel) => {
    allChannels.push(channel);
    rerenderSidebar();
    return channel;
  });
};

/**
 * Updates a channel from all channels with the full info. Only used once
 * the user has joined a channel as the full info of a channel can't be
 * acquired until the user has joined the channel
 *
 * @param {*} channel - the channel that needs to be updated with the
 * full info from the api
 * @return {Promise} promise
 */
export const updateChannelInfo = (channel) => {
  return fetchApi(
    "GET",
    `${api.channelInfo}${channel.id}`,
    localStorage.getItem("token"),
    null,
    null
  ).then((res) => {
    if (!res.error) {
      allChannels = allChannels.map((ch) => {
        if (ch.id === channel.id) {
          res.id = ch.id;
          return res;
        } else {
          return ch;
        }
      });
    }
  });
};

/**
 * updates the all channels list with the new edited channel info
 *
 * @param {Number} channelId - The id of the channel to update
 * @param {Object} { name, description } - The name and description to update
 *  to update the channel info with
 */
export const editChannelInfo = (channelId, { name, description }) => {
  allChannels.forEach((channel) => {
    if (channel.id === channelId) {
      (channel.name = name), (channel.description = description);
    }
  });
};

/**
 * Rerenders the sidebar and feed channel name once the channel info
 * has been edited
 *
 * @param {Object} channel
 */
export const rerenderChannel = (channel) => {
  const pubChannelTab = getPubChannelTab(channel.id);
  const pvtChannelTab = getPvtChannelTab(channel.id);
  const channelNameFeed = document.getElementById("msg-area-channel-name");
  channelNameFeed.innerText = channel.name;
  if (pubChannelTab) {
    const channelName = pubChannelTab.children[0].children[1];
    channelName.innerText = channel.name;
  }
  if (pvtChannelTab) {
    const channelName = pvtChannelTab.children[0].children[1];
    channelName.innerText = channel.name;
  }
};
/**
 * creates a message item and adds it to the feed.
 * also updates the currentChannelMessages
 *
 * @param {Object} message - message to add
 */
export const addMsgToFeed = (message) => {
  currentChannelMessages.unshift(message);
  createMessageItem(message, true);
};
/**
 * removes the message from the feed as well as from currentChannelMessages
 *
 * @param {Object} message - the message to be removed from the feed
 */
export const removeMsgFromFeed = (message) => {
  currentChannelMessages = currentChannelMessages.filter(
    (msg) => msg.id !== message.id
  );
  removeMsgItem(message);
  setTotalMessages(getTotalMessages() - 1);
  setMessagesLoaded(getMessagesLoaded() - 1);
};

/**
 *  checks if the user is the sender of a message
 *
 * @param {number} userId - the user id to check against
 * @param {object} message - the message to check
 * @return {boolean} is the user the sender of the message
 */
export const isUserMsg = (userId, message) => {
  return message.sender === userId;
};

/**
 *  rerenders the message on the screen
 *
 * @param {object} message - message to rerender
 * @param {object} messageReactions - the message reactions object
 */
export const rerenderMessage = (message, messageReactions) => {
  // update the messages for the channel
  currentChannelMessages = currentChannelMessages.map((msg) => {
    if (msg.id === message.id) {
      return message;
    } else {
      return msg;
    }
  });
  // grab the message node
  const msgItem = getMsgItem(message);
  // update the values on the screen
  const timeStamp = msgItem.querySelector(".text-muted");
  const pinBtn = msgItem.querySelector(".pin-msg");
  const messageText = msgItem.getElementsByTagName("p")[1];
  const pinIcon = msgItem.querySelector(".pinned");
  const reactionsBar = msgItem.querySelector(".reactions-bar");
  const reactionBarEmojis = reactionsBar.children;
  const msgImg = msgItem.querySelector(".msg-img");
  const editedStamp = msgItem.querySelector(".edited");
  displayReactions(reactionBarEmojis, messageReactions, reactionsBar);

  if (message.edited) {
    editedStamp.classList.remove("d-none");
    editedStamp.innerText = `Edited: ${getReadableDate(message.editedAt)}`;
  }

  if (message.pinned) {
    pinIcon.classList.remove("d-none");
    pinBtn.innerText = "Unpin";
  } else {
    pinIcon.classList.add("d-none");
    pinBtn.innerText = "Pin";
  }
  timeStamp.innerText = getReadableDate(message.sentAt);

  if (!message.image) {
    msgImg.parentElement.classList.add("d-none");
    messageText.classList.remove("d-none");
    messageText.innerText = message.message;
  } else {
    messageText.classList.add("d-none");
    msgImg.parentNode.classList.remove("d-none");
    msgImg.src = message.image;
  }
};

export const getPinnedMessages = () => {
  return pinnedMsgs;
};

export const updatePinnedMessages = () => {
  pinnedMsgs = currentChannelMessages.filter((message) => message.pinned);
};
