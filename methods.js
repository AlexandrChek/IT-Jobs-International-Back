import cloudinary from './cloudinaryConfig.js';
import { englishLevels } from './constants.js';

// Fn to read JSON-files:
export const readJSON = async publicId => {
  const fileData = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
  const jsonData = await fetch(fileData.secure_url);

  if (!jsonData.ok) {
    let error = new Error('HTTP connection problem');
    error.http_code = jsonData.status;
    throw error;
  }

  return await jsonData.json();
};

// Fn to write JSON-files:
export const writeJSON = (publicId, data) => {
  const buffer = Buffer.from(JSON.stringify(data));

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          public_id: publicId,
          resource_type: 'raw',
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      )
      .end(buffer);
  });
};

// Fn to check if the e-mail in the body exists in other profiles:
export const checkIfEmailExist = async (email, userType = '', id = '') => {
  let companyProfiles = await readJSON('companyProfiles.json');
  let seekerProfiles = await readJSON('seekerProfiles.json');

  if (userType === 'company') {
    companyProfiles = removeProfileById(companyProfiles, userType, id);
  }
  if (userType === 'seeker') {
    seekerProfiles = removeProfileById(seekerProfiles, userType, id);
  }

  const checkIfEmailsMatch = profile => profile.regData.email === email;
  const isEmailExistsInCompanies = companyProfiles.profiles.some(checkIfEmailsMatch);
  const isEmailExistsInSeekers = seekerProfiles.profiles.some(checkIfEmailsMatch);

  return isEmailExistsInCompanies || isEmailExistsInSeekers;
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
export const checkSkills = (requiredSkills, seekerSkills) => {
  if (seekerSkills) {
    const seekerSkillsArr = seekerSkills.split(/,|, /).map(skill => skill.trim().toLowerCase());
    const requiredSkillsArr = requiredSkills.split(/,|, /).map(skill => skill.trim().toLowerCase());

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
