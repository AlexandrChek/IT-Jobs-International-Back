import { nanoid } from 'nanoid';
import { COMPANY_PROFILES } from '../index.js';
import {
  readJSON,
  writeJSON,
  getProfileIndexById,
  getJobIndexById,
  makeWorkplacesAnArray,
  compareMeaning,
  checkPosition,
  checkWorkplaces,
} from '../methods.js';

export const createJob = async (req, res) => {
  const { companyid } = req.params;
  let profiles = await readJSON(COMPANY_PROFILES);
  const profileIndex = getProfileIndexById(profiles, 'company', companyid);
  const job = { ...req.body, companyId: companyid, jobId: nanoid(8) };
  const normJob = makeWorkplacesAnArray(job);

  if (profiles.profiles[profileIndex].publicInfo.jobs) {
    profiles.profiles[profileIndex].publicInfo.jobs.push(normJob);
  } else {
    profiles.profiles[profileIndex].publicInfo.jobs = [normJob];
  }

  await writeJSON(COMPANY_PROFILES, profiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const editJob = async (req, res) => {
  const { companyid, jobid } = req.params;
  let profiles = await readJSON(COMPANY_PROFILES);
  const profileIndex = getProfileIndexById(profiles, 'company', companyid);
  const jobIndex = getJobIndexById(profiles, profileIndex, jobid);
  let job = makeWorkplacesAnArray(req.body);
  job = { ...job, companyId: companyid, jobId: jobid };

  profiles.profiles[profileIndex].publicInfo.jobs[jobIndex] = job;
  await writeJSON(COMPANY_PROFILES, profiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const getJob = async (req, res) => {
  const { companyid, jobid } = req.params;
  const profiles = await readJSON(COMPANY_PROFILES);
  const profileIndex = getProfileIndexById(profiles, 'company', companyid);
  const job = profiles.profiles[profileIndex].publicInfo.jobs.find(job => job.jobId === jobid);
  const companyName = profiles.profiles[profileIndex].regData.companyName;

  res.status(200).json({ ...job, companyName });
};
//-----------------------------------------------------------------------------------------
export const toggleJobStatus = async (req, res) => {
  const { companyid, jobid } = req.params;
  let profiles = await readJSON(COMPANY_PROFILES);
  const profileIndex = getProfileIndexById(profiles, 'company', companyid);
  const jobIndex = getJobIndexById(profiles, profileIndex, jobid);

  if (profiles.profiles[profileIndex].publicInfo.jobs[jobIndex].isDisabled) {
    delete profiles.profiles[profileIndex].publicInfo.jobs[jobIndex].isDisabled;
  } else {
    profiles.profiles[profileIndex].publicInfo.jobs[jobIndex].isDisabled = true;
  }

  await writeJSON(COMPANY_PROFILES, profiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const removeJob = async (req, res) => {
  const { companyid, jobid } = req.params;
  let profiles = await readJSON(COMPANY_PROFILES);
  const profileIndex = getProfileIndexById(profiles, 'company', companyid);
  const jobIndex = getJobIndexById(profiles, profileIndex, jobid);

  profiles.profiles[profileIndex].publicInfo.jobs.splice(jobIndex, 1);
  await writeJSON(COMPANY_PROFILES, profiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const searchJob = async (req, res) => {
  const searchCriteria = makeWorkplacesAnArray(req.body);
  const profiles = await readJSON(COMPANY_PROFILES);
  let results = [];

  for (const profile of profiles.profiles) {
    if (!profile.publicInfo || !profile.publicInfo.jobs) continue;

    for (const job of profile.publicInfo.jobs) {
      if (job.isDisabled) continue;

      const isMatching = [
        !searchCriteria.country ||
          (job.country && compareMeaning(searchCriteria.country, job.country)),
        !searchCriteria.city || (job.city && compareMeaning(searchCriteria.city, job.city)),
        !searchCriteria.position || checkPosition(searchCriteria, job),
        !searchCriteria.salary || (job.salary && +job.salary >= +searchCriteria.salary),
        !searchCriteria.workplaces || checkWorkplaces(searchCriteria.workplaces, job),
        !searchCriteria.isRelocationPossible || job.isRelocationPossible,
        !searchCriteria.experienceIsNotRequired || job.experienceIsNotRequired,
      ].every(Boolean);

      if (isMatching) {
        const { companyId, jobId, position, salary, country, city } = job;
        const matchingObject = { companyId, jobId, position, salary, country, city };

        results.push(matchingObject);
      }
    }
  }

  if (results.length) {
    res.status(200).json(results);
  } else {
    res.status(200).send('No matching jobs found.');
  }
};
