import { nanoid } from 'nanoid';
import {
  readJSON,
  writeJSON,
  checkIfEmailExist,
  getProfileById,
  getProfileIndexById,
  removeProfileById,
} from '../methods.js';
import { emailDoesAlreadyExistResponse } from '../constants.js';

export const signUpCompany = async (req, res) => {
  const doesEmailExist = await checkIfEmailExist(req.body.email);

  if (!doesEmailExist) {
    let profiles = await readJSON('companyProfiles.json');

    profiles.profiles.push({ companyId: nanoid(7), regData: req.body });
    await writeJSON('companyProfiles.json', profiles);

    res.sendStatus(200);
  } else {
    res.status(200).json(emailDoesAlreadyExistResponse);
  }
};
//-----------------------------------------------------------------------------------------
export const editCompanyRegData = async (req, res) => {
  const { companyid } = req.params;
  const doesEmailExist = await checkIfEmailExist(req.body.email, 'company', companyid);

  if (!doesEmailExist) {
    let profiles = await readJSON('companyProfiles.json');
    const profileIndex = getProfileIndexById(profiles, 'company', companyid);

    profiles.profiles[profileIndex].regData = { ...req.body };
    await writeJSON('companyProfiles.json', profiles);

    res.sendStatus(200);
  } else {
    res.status(200).json(emailDoesAlreadyExistResponse);
  }
};
//-----------------------------------------------------------------------------------------
export const saveCompanyProfile = async (req, res) => {
  const { companyid } = req.params;
  let profiles = await readJSON('companyProfiles.json');
  const profileIndex = getProfileIndexById(profiles, 'company', companyid);
  const jobs = profiles.profiles[profileIndex]?.publicInfo?.jobs || [];

  profiles.profiles[profileIndex].publicInfo = { ...req.body, jobs };
  await writeJSON('companyProfiles.json', profiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const getCompanyRegData = async (req, res) => {
  const { companyid } = req.params;
  const profiles = await readJSON('companyProfiles.json');
  const profile = getProfileById(profiles, 'company', companyid);

  res.status(200).json(profile.regData);
};
//-----------------------------------------------------------------------------------------
export const getCompanyProfile = async (req, res) => {
  const { companyid } = req.params;
  const profiles = await readJSON('companyProfiles.json');
  const profile = getProfileById(profiles, 'company', companyid);
  const companyName = profile.regData.companyName;
  const location = `${profile.regData.country}, ${profile.regData.city}`;
  let response = { companyName, location };

  if (profile.publicInfo) {
    response = { ...response, ...profile.publicInfo };
  }

  res.status(200).json(response);
};
//-----------------------------------------------------------------------------------------
export const removeCompanyProfile = async (req, res) => {
  const { companyid } = req.params;
  const profiles = await readJSON('companyProfiles.json');
  const clearedProfiles = removeProfileById(profiles, 'company', companyid);

  await writeJSON('companyProfiles.json', clearedProfiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const getCompanyJobList = async (req, res) => {
  const { companyid } = req.params;
  const profiles = await readJSON('companyProfiles.json');
  const profile = getProfileById(profiles, 'company', companyid);
  const currentJobs = profile.publicInfo.jobs?.filter(job => !job.isDisabled) || [];

  if (currentJobs.length) {
    let jobs = [];

    currentJobs.forEach(job => {
      jobs.push({ id: job.jobId, value: job.position });
    });

    res.status(200).json(jobs);
  } else {
    res.sendStatus(204);
  }
};
