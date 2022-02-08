import { changeState } from "./state.js";
import { displayAlert } from "./helpers.js";
import { loginModal, registrationModal } from "./DOMcache.js";
import { createAlertError } from "./templates.js";

const BASE_URL = "http://localhost:3000";

const api = {
  register: `${BASE_URL}/auth/register`,
  login: `${BASE_URL}/auth/login`,
  logout: `${BASE_URL}/auth/logout`,
  users: `${BASE_URL}/users`,
  user: `${BASE_URL}/users/`,
  updateUser: `${BASE_URL}/users`,
  allChannels: `${BASE_URL}/channels`,
  createChannel: `${BASE_URL}/channels`,
  channelInfo: `${BASE_URL}/channels/`,
  editChannel: `${BASE_URL}/channels/`,
  joinChannel: `${BASE_URL}/channels/`,
  leaveChannel: `${BASE_URL}/channels/`,
  inviteChannel: `${BASE_URL}/channels/`,
  allMessages: `${BASE_URL}/messages/`,
  sendMessage: `${BASE_URL}/messages/`,
  deleteMessage: `${BASE_URL}/messages/`,
  updateMessage: `${BASE_URL}/messages/`,
  pinMessage: `${BASE_URL}/messages/pin/`,
  unpinMessage: `${BASE_URL}/messages/unpin/`,
  reactMessage: `${BASE_URL}/messages/react/`,
  unreactMessage: `${BASE_URL}/messages/unreact/`,
};

export const successMessages = {
  invite: "Members successfully invited",
  userInfo: "User info successfully updated",
  editMessaage: "Successfully edited the message",
};

export const fetchApi = (method, path, token, body, errorBox) => {
  const options = {
    method: method,
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (token !== null) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  return fetch(path, options)
    .then((res) => {
      if (res.status === 400 || res.status === 403) {
        res.json().then((res) => {
          if (errorBox !== null) {
            displayAlert(errorBox, res.error);
          } else {
            createAlertError(res.error);
          }
          return res;
        });
      } else {
        return res.json();
      }
    })
    .catch(() => {
      if (errorBox != null) {
        displayAlert(errorBox, "Woops, something went wrong!");
      } else {
        createAlertError("Woops, something went wrong!");
      }
    });
};

export const getAllUsers = () => {
  return fetchApi("GET", api.users, localStorage.getItem("token"), null, null);
};

export const getUser = (id, alertBox = null) => {
  return fetchApi(
    "GET",
    `${api.user}${id}`,
    localStorage.getItem("token"),
    null,
    alertBox
  );
};

export const updateUser = (body, alertBox) => {
  return fetchApi(
    "PUT",
    api.updateUser,
    localStorage.getItem("token"),
    body,
    alertBox
  );
};

export const register = (regData) => {
  fetch(api.register, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(regData),
  })
    .then((res) => {
      if (!res.ok) {
        res.json().then((res) => {
          // when the response is not ok, create a popup alert to
          // notify the client of the error
          const regAlert = document.getElementById("reg-alert");
          displayAlert(regAlert, res.error);
          throw Error(res.error);
        });
      } else {
        res
          .json()
          .then((res) => {
            // store the token and user id from the response into
            // local storage in order for it to persist
            localStorage.setItem("token", res.token);
            localStorage.setItem("id", res.userId);
          })
          .then(() => {
            registrationModal.hide();
            changeState("feed");
          });
      }
    })
    .catch((error) => {
      createAlertError("Woops, something went wrong!");
    });
};

export const login = (loginData) => {
  return fetch(api.login, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  })
    .then((res) => {
      if (res.ok) {
        return res.json();
      } else if (res.status >= 400 && res.status < 500) {
        res.json().then((res) => {
          const loginAlert = document.getElementById("login-alert");
          displayAlert(loginAlert, res.error);
        });
      } else {
        throw new Error(res);
      }
    })
    .then((res) => {
      // store the token and user id from the response into
      // local storage in order for it to persist
      localStorage.setItem("token", res.token);
      localStorage.setItem("id", res.userId);
      localStorage.setItem("email", res.email);
      localStorage.setItem("bio", res.bio);
      localStorage.setItem("image", res.image);
      loginModal.hide();
      changeState("feed");
    })
    .catch((res) => {
      res.json().then((res) => {
        const loginAlert = document.getElementById("login-alert");
        displayAlert(loginAlert, res.error);
      });
    });
};

export const logout = () => {
  return fetchApi(
    "POST",
    api.logout,
    localStorage.getItem("token"),
    null,
    null
  );
};

export const getAllChannels = () => {
  return fetch(api.allChannels, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
    },
  })
    .then((res) => {
      if (res.status === 400 || res.status === 403) {
        res.json().then((res) => {
          throw Error(res.error);
        });
      } else if (res.ok) {
        return res.json();
      } else {
        throw new Error("Woops, something went wrong!");
      }
    })
    .catch((error) => {
      console.log(error);
    });
};

export const getChannelMessages = (channelId, start = 0) => {
  return fetchApi(
    "GET",
    `${api.allMessages}${channelId}?start=${start}`,
    localStorage.getItem("token"),
    null,
    null
  );
};

export const joinChannel = (channelId) => {
  return fetchApi(
    "POST",
    `${api.joinChannel}${channelId}/join`,
    localStorage.getItem("token"),
    null,
    null
  );
};

export const leaveChannel = (channelId) => {
  return fetchApi(
    "POST",
    `${api.joinChannel}${channelId}/leave`,
    localStorage.getItem("token"),
    null,
    null
  );
};

export const inviteChannel = (channelId, body, errorBox) => {
  return fetchApi(
    "POST",
    `${api.inviteChannel}${channelId}/invite`,
    localStorage.getItem("token"),
    body,
    errorBox
  );
};

export const sendMessage = (body, channelId) => {
  return fetchApi(
    "POST",
    `${api.sendMessage}${channelId}`,
    localStorage.getItem("token"),
    body,
    null
  );
};

export const deleteMessage = (channelId, messageId) => {
  return fetchApi(
    "DELETE",
    `${api.deleteMessage}${channelId}/${messageId}`,
    localStorage.getItem("token"),
    null,
    null
  );
};

export const updateMessage = (channelId, messageId, body, errorBox) => {
  return fetchApi(
    "PUT",
    `${api.deleteMessage}${channelId}/${messageId}`,
    localStorage.getItem("token"),
    body,
    errorBox
  );
};

export const pinMessage = (channelId, messageId) => {
  return fetchApi(
    "POST",
    `${api.pinMessage}${channelId}/${messageId}`,
    localStorage.getItem("token"),
    null,
    null
  );
};

export const unpinMessage = (channelId, messageId) => {
  return fetchApi(
    "POST",
    `${api.unpinMessage}${channelId}/${messageId}`,
    localStorage.getItem("token"),
    null,
    null
  );
};

export const reactMessage = (channelId, messageId, body) => {
  return fetchApi(
    "POST",
    `${api.reactMessage}${channelId}/${messageId}`,
    localStorage.getItem("token"),
    body,
    null
  );
};
export const unreactMessage = (channelId, messageId, body) => {
  return fetchApi(
    "POST",
    `${api.unreactMessage}${channelId}/${messageId}`,
    localStorage.getItem("token"),
    body,
    null
  );
};

export default api;
