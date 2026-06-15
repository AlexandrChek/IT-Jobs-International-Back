import {
  readJSON,
  writeJSON,
  getProfileById,
  getAllChatsOfUser,
  getRelevantUsersChatsObj,
  findIfChatExists,
  countUnreadMessages,
} from '../methods.js';

export const createChat = async (req, res) => {
  let chats = await readJSON('chats.json');
  const { seekerId, companyId, userName, userType, jobId, position, date, message } = req.body;
  const chatIndex = chats.chats.findIndex(
    chat => chat.company.id === companyId && chat.seeker.id === seekerId,
  );

  let chat = {
    job: { jobId, position },
    messages: [
      {
        date,
        name: userName,
        text: message,
        cvFileLink: req.file?.cloudinaryUrl || null,
        isRead: false,
      },
    ],
  };

  if (chatIndex >= 0) {
    chats.chats[chatIndex].twoUsersChats.push(chat);
  } else {
    const isCompany = userType === 'company';
    const participantType = isCompany ? 'seeker' : 'company';
    const participantId = isCompany ? seekerId : companyId;
    const participantFilePublicId = isCompany ? 'seekerProfiles.json' : 'companyProfiles.json';
    const participantProfiles = await readJSON(participantFilePublicId);
    const participantProfile = getProfileById(participantProfiles, participantType, participantId);
    const companyName = isCompany ? userName : participantProfile.regData.companyName;
    const seekerName = isCompany
      ? `${participantProfile.regData.firstName} ${participantProfile.regData.lastName}`
      : userName;
    const chatObj = {
      company: { id: companyId, name: companyName },
      seeker: { id: seekerId, name: seekerName },
      twoUsersChats: [chat],
    };

    chats.chats.push(chatObj);
  }

  await writeJSON('chats.json', chats);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const addChatMessage = async (req, res) => {
  let chats = await readJSON('chats.json');
  const { companyId, seekerId, jobId, message } = req.body;
  const chatIndex = chats.chats.findIndex(
    chat => chat.company.id === companyId && chat.seeker.id === seekerId,
  );
  const chatAboutPositionIndex = chats.chats[chatIndex].twoUsersChats.findIndex(
    chat => chat.job.jobId === jobId,
  );
  const newMessage = { ...message, isRead: false };

  chats.chats[chatIndex].twoUsersChats[chatAboutPositionIndex].messages.push(newMessage);

  await writeJSON('chats.json', chats);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const getUserUnreadMsgCount = async (req, res) => {
  const { usertype } = req.params;
  const userId = req.params.userid ?? req.userid;
  let chats = req.chats;

  if (!chats) {
    chats = await readJSON('chats.json');
  }

  const unreadCount = countUnreadMessages(chats, usertype, userId);

  res.status(200).json({ unreadCount });
};
//-----------------------------------------------------------------------------------------
export const markMessagesAsRead = async (req, res, next) => {
  const { usertype, seekerid, companyid, jobid } = req.params;
  const chats = await readJSON('chats.json');
  const chatObjIndex = chats.chats.findIndex(
    chatObj => chatObj.company.id === companyid && chatObj.seeker.id === seekerid,
  );
  const chatIndex = chats.chats[chatObjIndex].twoUsersChats.findIndex(
    chat => chat.job.jobId === jobid,
  );
  const userName = chats.chats[chatObjIndex][usertype].name;

  chats.chats[chatObjIndex].twoUsersChats[chatIndex].messages.forEach(msg => {
    if (msg.name !== userName && !msg.isRead) {
      msg.isRead = true;
    }
  });

  await writeJSON('chats.json', chats);

  const userid = chats.chats[chatObjIndex][usertype].id;
  req.userid = userid;
  req.chats = chats;
  next();
};
//-----------------------------------------------------------------------------------------
export const getUserChats = async (req, res) => {
  const { usertype, userid } = req.params;
  const chatParticipantType = usertype === 'company' ? 'seeker' : 'company';
  const chats = await readJSON('chats.json');
  const matchedChats = getAllChatsOfUser(chats, usertype, userid);
  let chatList = [];

  if (matchedChats.length) {
    chatList = matchedChats.flatMap(chat =>
      chat.twoUsersChats.map(twoUsersChat => {
        const unreadCount = twoUsersChat.messages.filter(msg => !msg.isRead).length;

        return {
          chatParticipantId: chat[chatParticipantType].id,
          chatParticipantName: chat[chatParticipantType].name,
          job: twoUsersChat.job,
          lastMessage: twoUsersChat.messages.at(-1),
          unreadCount,
        };
      }),
    );

    chatList.sort((a, b) => b.lastMessage.date - a.lastMessage.date);
  }

  res.status(200).json(chatList);
};
//-----------------------------------------------------------------------------------------
export const getChat = async (req, res) => {
  const { usertype, companyid, seekerid, jobid } = req.params;
  const chatParticipantType = usertype === 'company' ? 'seeker' : 'company';
  const chats = await readJSON('chats.json');
  const relevantChatsObj = getRelevantUsersChatsObj(chats, companyid, seekerid);
  const chatParticipantName = relevantChatsObj[chatParticipantType].name;
  const chat = relevantChatsObj.twoUsersChats.find(chat => chat.job.jobId === jobid);
  const unreadCount = chat.messages.filter(msg => !msg.isRead).length;

  res.status(200).json({
    ...chat,
    chatParticipantName,
    msgCount: chat.messages.length,
    unreadCount,
  });
};
//-----------------------------------------------------------------------------------------
export const checkIfChatExists = async (req, res) => {
  const { companyid, seekerid, jobid } = req.params;
  const chats = await readJSON('chats.json');
  const relevantChatsObj = getRelevantUsersChatsObj(chats, companyid, seekerid);
  const doesChatAlreadyExists = findIfChatExists(relevantChatsObj, jobid);

  res.status(200).json({ doesChatAlreadyExists });
};
