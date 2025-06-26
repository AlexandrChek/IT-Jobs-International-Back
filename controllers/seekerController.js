import { nanoid } from 'nanoid';
import {
  readJSON,
  writeJSON,
  checkIfEmailExist,
  getProfileById,
  getProfileIndexById,
  countTotalWorkExperience,
  removeProfileById,
  makeWorkplacesAnArray,
  compareMeaning,
  checkPosition,
  checkWorkplaces,
  checkWorkExperience,
  checkSkills,
  checkEnglish,
} from '../methods.js';
import { emailDoesAlreadyExistResponse } from '../constants.js';

export const signUpSeeker = async (req, res) => {
  const doesEmailExist = await checkIfEmailExist(req.body.email);

  if (!doesEmailExist) {
    let profiles = await readJSON('seekerProfiles.json');

    profiles.profiles.push({ seekerId: nanoid(7), regData: req.body });
    await writeJSON('seekerProfiles.json', profiles);

    res.sendStatus(200);
  } else {
    res.status(200).json(emailDoesAlreadyExistResponse);
  }
};
//-----------------------------------------------------------------------------------------
export const editSeekerRegData = async (req, res) => {
  const { seekerid } = req.params;
  const doesEmailExist = await checkIfEmailExist(req.body.email, 'seeker', seekerid);

  if (!doesEmailExist) {
    let profiles = await readJSON('seekerProfiles.json');
    const profileIndex = getProfileIndexById(profiles, 'seeker', seekerid);

    profiles.profiles[profileIndex].regData = { ...req.body };
    await writeJSON('seekerProfiles.json', profiles);

    res.sendStatus(200);
  } else {
    res.status(200).json(emailDoesAlreadyExistResponse);
  }
};
//-----------------------------------------------------------------------------------------
export const saveSeekerProfile = async (req, res) => {
  const { seekerid } = req.params;
  let profiles = await readJSON('seekerProfiles.json');
  const profileIndex = getProfileIndexById(profiles, 'seeker', seekerid);

  // Fn to convert properties of work experience or education in a seeker public info object
  // to an array of objects
  const normalizeExperienceBlock = (publicInfoObj, experienceType) => {
    const necessaryProperties = Object.fromEntries(
      Object.entries(publicInfoObj).filter(([key]) => key.startsWith(`${experienceType}_`)),
    );

    let necessaryKeys = Object.keys(necessaryProperties);
    let numberOfItems = necessaryKeys.filter(key =>
      key.startsWith(`${experienceType}_from`),
    ).length;

    let arrayOfObjects = [];
    for (let i = 0; i < numberOfItems; i++) {
      let itemObj = Object.fromEntries(
        Object.entries(necessaryProperties)
          .filter(([key]) => key.endsWith(`${i}`))
          .map(([key, value]) => {
            let cutKey = key.slice(experienceType.length + 1, key.length - 1 - String(i).length);
            return [cutKey, value];
          }),
      );

      arrayOfObjects.push(itemObj);
    }

    let normPublicInfo = { ...publicInfoObj };

    necessaryKeys.forEach(key => {
      delete normPublicInfo[key];
    });

    normPublicInfo[experienceType] = arrayOfObjects;

    return normPublicInfo;
  };

  let normalizedPublicInfo = { ...req.body };

  if (req.body.work_from_0) {
    normalizedPublicInfo = normalizeExperienceBlock(normalizedPublicInfo, 'work');
  }
  if (req.body.education_from_0) {
    normalizedPublicInfo = normalizeExperienceBlock(normalizedPublicInfo, 'education');
  }

  profiles.profiles[profileIndex].publicInfo = makeWorkplacesAnArray(normalizedPublicInfo);
  await writeJSON('seekerProfiles.json', profiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const getSeekerRegData = async (req, res) => {
  const { seekerid } = req.params;
  const profiles = await readJSON('seekerProfiles.json');
  const profile = getProfileById(profiles, 'seeker', seekerid);

  res.status(200).json(profile.regData);
};
//-----------------------------------------------------------------------------------------
export const getSeekerProfile = async (req, res) => {
  const { seekerid } = req.params;
  const profiles = await readJSON('seekerProfiles.json');
  const profile = getProfileById(profiles, 'seeker', seekerid);
  const userName = `${profile.regData.firstName} ${profile.regData.lastName}`;
  const location = `${profile.regData.country}, ${profile.regData.city}`;
  const dateOfBirth = profile.regData.dateOfBirth;
  let response = { userName, location, dateOfBirth };

  if (profile.isDisabled) {
    response.isDisabled = true;
  }

  if (profile.publicInfo) {
    response = { ...response, ...profile.publicInfo };

    if (response.work) {
      const totalExperience = countTotalWorkExperience(response.work);
      response.totalWorkExperience = totalExperience;
    }
  }

  res.status(200).json(response);
};
//-----------------------------------------------------------------------------------------
export const toggleSeekerStatus = async (req, res) => {
  const { seekerid } = req.params;
  let profiles = await readJSON('seekerProfiles.json');
  const profileIndex = getProfileIndexById(profiles, 'seeker', seekerid);

  if (profiles.profiles[profileIndex].isDisabled) {
    delete profiles.profiles[profileIndex].isDisabled;
  } else {
    profiles.profiles[profileIndex].isDisabled = true;
  }

  await writeJSON('seekerProfiles.json', profiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const removeSeekerProfile = async (req, res) => {
  const { seekerid } = req.params;
  const profiles = await readJSON('seekerProfiles.json');
  const clearedProfiles = removeProfileById(profiles, 'seeker', seekerid);

  await writeJSON('seekerProfiles.json', clearedProfiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const searchCv = async (req, res) => {
  const searchCriteria = makeWorkplacesAnArray(req.body);
  const profiles = await readJSON('seekerProfiles.json');
  let results = [];

  for (const profile of profiles.profiles) {
    if (profile.isDisabled || !profile.publicInfo) continue;

    const { experienceFromYears, experienceFromMonths } = searchCriteria;

    const isMatching = [
      !searchCriteria.country || compareMeaning(searchCriteria.country, profile.regData.country),
      !searchCriteria.city || compareMeaning(searchCriteria.city, profile.regData.city),
      !searchCriteria.position || checkPosition(searchCriteria, profile.publicInfo),
      !searchCriteria.salary ||
        (profile.publicInfo.salary && +profile.publicInfo.salary <= +searchCriteria.salary),
      !searchCriteria.workplaces || checkWorkplaces(searchCriteria.workplaces, profile.publicInfo),
      !searchCriteria.isRelocationPossible || profile.publicInfo.isRelocationPossible,
      (!experienceFromYears && !experienceFromMonths) ||
        checkWorkExperience(profile.publicInfo.work, experienceFromYears, experienceFromMonths),
      !searchCriteria.skills || checkSkills(searchCriteria.skills, profile.publicInfo.skills),
      !searchCriteria.englishLevel ||
        checkEnglish(searchCriteria.englishLevel, profile.publicInfo.englishLevel),
    ].every(Boolean);

    if (isMatching) {
      const { country, city } = profile.regData;
      const { position, salary } = profile.publicInfo;
      const matchingObject = { seekerId: profile.seekerId, country, city, position, salary };

      results.push(matchingObject);
    }
  }

  if (results.length) {
    res.status(200).json(results);
  } else {
    res.status(200).send('No matching CVs found.');
  }
};
