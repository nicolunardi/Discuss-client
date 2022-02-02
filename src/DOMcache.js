/***************************************************************
                        Login section
***************************************************************/

// gives access to the login and registration modal in JS
export const loginModal = new bootstrap.Modal(
  document.getElementById("login-modal")
);

export const registrationModal = new bootstrap.Modal(
  document.getElementById("registration-modal")
);

/***************************************************************
                        Feed section
***************************************************************/

export const newChnlModal = new bootstrap.Modal(
  document.getElementById("new-chnl-modal")
);

export const editChannelInfoModal = new bootstrap.Modal(
  document.getElementById("ChannelInfoEditModal")
);

export const editMsgInfoModal = new bootstrap.Modal(
  document.getElementById("edit-msg-modal")
);

export const chnlInfoModal = new bootstrap.Modal(
  document.getElementById("ChannelInfoModal")
);

export const profileEditModal = new bootstrap.Modal(
  document.getElementById("profile-edit-modal")
);

export const previewImgModal = new bootstrap.Modal(
  document.getElementById("preview-img-modal")
);
