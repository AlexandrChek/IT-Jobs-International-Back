import { CHATS, COMPANY_PROFILES, SEEKER_PROFILES } from '../index.js';
import { readJSON, writeJSON, getProfileById } from '../methods.js';

export const createChat = async (req, res) => {
  let chats = await readJSON(CHATS);
  const { seekerId, companyId, userName, userType, jobId, position, date, message } = req.body;
  const chatIndex = chats.chats.findIndex(
    chat => chat.company.id === companyId && chat.seeker.id === seekerId,
  );

  let chat = {
    job: { jobId, position },
    messages: [{ date, name: userName, text: message }],
  };

  if (req.file) {
    chat.messages[0].cvFileLink = `/cv/${req.file.filename}`;
  }

  if (chatIndex >= 0) {
    chats.chats[chatIndex].twoUsersChats.push(chat);
  } else {
    const isCompany = userType === 'company';
    const participantType = isCompany ? 'seeker' : 'company';
    const participantId = isCompany ? seekerId : companyId;
    const participantProfiles = await readJSON(isCompany ? SEEKER_PROFILES : COMPANY_PROFILES);
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

  await writeJSON(CHATS, chats);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const addChatMessage = async (req, res) => {
  let chats = await readJSON(CHATS);
  const { companyId, seekerId, jobId, message } = req.body;
  const chatIndex = chats.chats.findIndex(
    chat => chat.company.id === companyId && chat.seeker.id === seekerId
  );
  const chatAboutPositionIndex = chats.chats[chatIndex].twoUsersChats.findIndex(
    chat => chat.job.jobId === jobId,
  );

  chats.chats[chatIndex].twoUsersChats[chatAboutPositionIndex].messages.push(message);

  await writeJSON(CHATS, chats);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const getUserChats = async (req, res) => {
  const { usertype, userid } = req.params;
  const chatParticipantType = usertype === 'company' ? 'seeker' : 'company';
  const chats = await readJSON(CHATS);
  const matchedChats = chats.chats.filter(chat => chat[usertype].id === userid);
  let chatList = [];

  if (matchedChats.length) {
    chatList = matchedChats.flatMap(chat =>
      chat.twoUsersChats.map(twoUsersChat => {
        return {
          chatParticipantId: chat[chatParticipantType].id,
          chatParticipantName: chat[chatParticipantType].name,
          job: twoUsersChat.job,
          lastMessage: twoUsersChat.messages.at(-1),
        };
      }),
    );
  }

  res.status(200).json(chatList);
};
//-----------------------------------------------------------------------------------------
export const getChat = async (req, res) => {
  const { companyId, seekerId, jobId } = req.params;
  const chats = await readJSON(CHATS);
  const chatObj = chats.chats.find(
    chat => chat.company.id === companyId && chat.seeker.id === seekerId
  );
  const chat = chatObj.twoUsersChats.find(chat => chat.job.jobId === jobId);

  res.send(200).json(chat);
};
