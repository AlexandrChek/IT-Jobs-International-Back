import { readJSON, countUnreadMessages } from '../methods.js';

export const logIn = async (req, res) => {
  const { userType, email, password } = req.body;
  const profilesPublicId = userType === 'company' ? 'companyProfiles.json' : 'seekerProfiles.json';
  const profiles = await readJSON(profilesPublicId);
  const profile = profiles.profiles.find(
    profile => profile.regData.email === email && profile.regData.password === password,
  );
  let response;

  if (profile) {
    const userId = profile[`${userType}Id`];
    const userName =
      userType === 'company'
        ? profile.regData.companyName
        : `${profile.regData.firstName} ${profile.regData.lastName}`;
    const chats = await readJSON('chats.json');
    const unreadCount = countUnreadMessages(chats, userType, userId);

    response = { userType, userId, userName, unreadCount };
  } else {
    response = { authFailureMessage: 'Wrong e-mail or password' };
  }

  res.status(200).json(response);
};
