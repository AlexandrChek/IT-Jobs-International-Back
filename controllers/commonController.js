import { readJSON } from '../methods.js';

export const logIn = async (req, res) => {
  const { userType, email, password } = req.body;
  const profilesPublicId = userType === 'company' ? 'companyProfiles.json' : 'seekerProfiles.json';
  const profiles = await readJSON(profilesPublicId);
  const profile = profiles.profiles.find(
    profile => profile.regData.email === email && profile.regData.password === password,
  );

  if (profile) {
    const userId = profile[`${userType}Id`];
    const userName =
      userType === 'company'
        ? profile.regData.companyName
        : `${profile.regData.firstName} ${profile.regData.lastName}`;

    res.json({ userType, userId, userName });
  } else {
    res.json({ authFailureMessage: 'Wrong e-mail or password' });
  }
};
