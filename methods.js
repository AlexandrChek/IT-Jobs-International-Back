import fs from 'fs/promises';
import { COMPANY_PROFILES, SEEKER_PROFILES } from './index.js';
import { englishLevels } from './constants.js';

// Fn to read JSON-files:
export const readJSON = async filePath => JSON.parse(await fs.readFile(filePath, 'utf-8'));

// Fn to write JSON-files:
export const writeJSON = async (filePath, data) =>
  await fs.writeFile(filePath, JSON.stringify(data));

// Fn to check if the e-mail in the body exists in other profiles:
export const checkIfEmailExist = async (email, userType = '', id = '') => {
  let companyProfiles = await readJSON(COMPANY_PROFILES);
  let seekerProfiles = await readJSON(SEEKER_PROFILES);

  if (userType === 'company') {
    companyProfiles = removeProfileById(companyProfiles, userType, id);
  }
  if (userType === 'seeker') {
    seekerProfiles = removeProfileById(seekerProfiles, userType, id);
  }

  const checkIfEmailsMatch = profile => profile.regData.email === email;
  const isEmailExistsInCompanies = companyProfiles.profiles.some(checkIfEmailsMatch);
  const isEmailExistsInSeekers = seekerProfiles.profiles.some(checkIfEmailsMatch);

  return !(isEmailExistsInCompanies || isEmailExistsInSeekers);
};

// Fn to find the profile by ID:
export const getProfileById = (profiles, userType, id) => {
  return profiles.profiles.find(profile => profile[`${userType}Id`] === id);
};

// Fn to find the index of matching profile by ID:
export const getProfileIndexById = (profiles, userType, id) => {
  return profiles.profiles.findIndex(profile => profile[`${userType}Id`] === id);
};

// Fn to remove profile by ID:
export const removeProfileById = (profiles, userType, id) => {
  const clearedProfilesArr = profiles.profiles.filter(profile => profile[`${userType}Id`] !== id);
  return { ...profiles, profiles: clearedProfilesArr };
};

// Fn to find the index of matching job by ID:
export const getJobIndexById = (profiles, profileIndex, jobId) => {
  return profiles.profiles[profileIndex].publicInfo.jobs.findIndex(job => job.jobId === jobId);
};

// Fn to make the "workplaces" field an array:
export const makeWorkplacesAnArray = body => {
  let normBody = { ...body };

  if (body.workplaces && typeof body.workplaces === 'string') {
    normBody.workplaces = [body.workplaces];
  }

  return normBody;
};

// Fn to compare meaning of two strings:
export const compareMeaning = (requiredValue, valueToBeChecked) => {
  return requiredValue.toLowerCase() === valueToBeChecked.toLowerCase();
};

// Fn to check if a position in a CV or job matches the search criteria:
export const checkPosition = (searchCriteria, jobOrCv) => {
  const userPosition = jobOrCv.position.toLowerCase();

  if (searchCriteria.searchOfAnyWord) {
    const positionWordsArr = searchCriteria.position.split(/ |, /);
    return positionWordsArr.some(word => userPosition.includes(word.toLowerCase()));
  } else {
    return userPosition.includes(searchCriteria.position.toLowerCase());
  }
};

// Fn to check if workplaces in a CV or job matches the search criteria:
export const checkWorkplaces = (searchedWorkplaces, jobOrCv) => {
  return (
    jobOrCv.workplaces !== undefined &&
    searchedWorkplaces.some(place => jobOrCv.workplaces.includes(place))
  );
};

// Fn to count total work experience of seeker in years and months:
export const countTotalWorkExperience = experienceArr => {
  let totalYears = 0,
    totalMonths = 0;

  experienceArr.forEach(item => {
    const fromDate = new Date(item.from);
    const toDate = item.isStillOngoing ? new Date() : new Date(item.to);
    let years = toDate.getFullYear() - fromDate.getFullYear();
    let months = toDate.getMonth() - fromDate.getMonth();

    if (months < 0) {
      years--;
      months += 12;
    }

    totalYears += years;
    totalMonths += months;
  });

  if (totalMonths >= 12) {
    totalYears += Math.floor(totalMonths / 12);
    totalMonths = totalMonths % 12;
  }

  return { totalYears, totalMonths };
};

// Fn to check if total work experience of seeker matches the search criteria:
export const checkWorkExperience = (worksArr, requiredYears = '', requiredMonths = '') => {
  if (worksArr) {
    const { totalYears, totalMonths } = countTotalWorkExperience(worksArr);
    const seekerExperienceInYears = totalYears + totalMonths / 12;
    const requiredYearsNum = +requiredYears || 0;
    const requiredMonthsNum = +requiredMonths || 0;
    const requiredExperienceInYears = requiredYearsNum + requiredMonthsNum / 12;

    return seekerExperienceInYears >= requiredExperienceInYears;
  } else return false;
};

// Fn to check if seeker`s skills match the search criteria:
export const checkSkills = (seekerSkills, requiredSkills) => {
  if (seekerSkills) {
    const seekerSkillsArr = seekerSkills.split(/,|, /).map(skill => skill.toLowerCase());
    const requiredSkillsArr = requiredSkills.split(/,|, /).map(skill => skill.toLowerCase());

    return requiredSkillsArr.every(skill => seekerSkillsArr.includes(skill));
  } else return false;
};

// Fn to check if seeker`s english level matches the search criterion:
export const checkEnglish = (requiredLevel, currentLevel) => {
  if (currentLevel) {
    const currentLevelObj = englishLevels.find(level => level.name === currentLevel);
    const requiredLevelObj = englishLevels.find(level => level.name === requiredLevel);

    return currentLevelObj.rating >= requiredLevelObj.rating;
  } else return false;
};
