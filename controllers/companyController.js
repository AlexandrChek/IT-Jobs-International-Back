import { nanoid } from 'nanoid';
import { COMPANY_PROFILES } from '../index.js';
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
  const emailDoesntExist = await checkIfEmailExist(req.body.email);

  if (emailDoesntExist) {
    let profiles = await readJSON(COMPANY_PROFILES);

    profiles.profiles.push({ companyId: nanoid(7), regData: req.body });
    await writeJSON(COMPANY_PROFILES, profiles);

    res.sendStatus(200);
  } else {
    res.status(200).json(emailDoesAlreadyExistResponse);
  }
};
//-----------------------------------------------------------------------------------------
export const editCompanyRegData = async (req, res) => {
  const { companyid } = req.params;
  const emailDoesntExist = await checkIfEmailExist(req.body.email, 'company', companyid);

  if (emailDoesntExist) {
    let profiles = await readJSON(COMPANY_PROFILES);
    const profileIndex = getProfileIndexById(profiles, 'company', companyid);

    profiles.profiles[profileIndex].regData = { ...req.body };
    await writeJSON(COMPANY_PROFILES, profiles);

    res.sendStatus(200);
  } else {
    res.status(200).json(emailDoesAlreadyExistResponse);
  }
};
//-----------------------------------------------------------------------------------------
export const saveCompanyProfile = async (req, res) => {
  const { companyid } = req.params;
  let profiles = await readJSON(COMPANY_PROFILES);
  const profileIndex = getProfileIndexById(profiles, 'company', companyid);

  profiles.profiles[profileIndex].publicInfo = { ...req.body };
  await writeJSON(COMPANY_PROFILES, profiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const getCompanyRegData = async (req, res) => {
  const { companyid } = req.params;
  const profiles = await readJSON(COMPANY_PROFILES);
  const profile = getProfileById(profiles, 'company', companyid);

  res.status(200).json(profile.regData);
};
//-----------------------------------------------------------------------------------------
export const getCompanyProfile = async (req, res) => {
  const { companyid } = req.params;
  const profiles = await readJSON(COMPANY_PROFILES);
  const profile = getProfileById(profiles, 'company', companyid);
  const companyName = profile.regData.companyName;
  const location = `${profile.regData.country}, ${profile.regData.city}`;
  const response = { companyName, location };

  if (profile.publicInfo) {
    response = { ...response, ...profile.publicInfo };
  }

  res.status(200).json(response);
};
//-----------------------------------------------------------------------------------------
export const removeCompanyProfile = async (req, res) => {
  const { companyid } = req.params;
  const profiles = await readJSON(COMPANY_PROFILES);
  const clearedProfiles = removeProfileById(profiles, 'company', companyid);

  await writeJSON(COMPANY_PROFILES, clearedProfiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const getCompanyJobList = async (req, res) => {
  const { companyid } = req.params;
  const profiles = await readJSON(COMPANY_PROFILES);
  const profile = getProfileById(profiles, 'company', companyid);
  const currentJobs = profile.publicInfo.jobs?.length
    ? profile.publicInfo.jobs.filter(job => !job.isDisabled)
    : null;

  if (currentJobs?.length) {
    let jobs = [];

    currentJobs.forEach(job => {
      jobs.push({ jobId: job.jobId, position: job.position });
    });

    res.status(200).json(jobs);
  } else {
    res.sendStatus(204);
  }
};
