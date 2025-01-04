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
  const job = { ...req.body, jobId: nanoid(8) };
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

  profiles.profiles[profileIndex].publicInfo.jobs[jobIndex] = makeWorkplacesAnArray(req.body);
  await writeJSON(COMPANY_PROFILES, profiles);

  res.sendStatus(200);
};
//-----------------------------------------------------------------------------------------
export const getJob = async (req, res) => {
  const { companyid, jobid } = req.params;
  const profiles = await readJSON(COMPANY_PROFILES);
  const profileIndex = getProfileIndexById(profiles, 'company', companyid);
  let job = profiles.profiles[profileIndex].publicInfo.jobs.find(job => job.jobId === jobid);
  const companyName = profiles.profiles[profileIndex].regData.companyName;

  job = { ...job, companyId: companyid, companyName };

  res.status(200).json(job);
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
        let matchingObject = {
          companyId: profile.companyId,
          jobId: job.jobId,
          position: job.position,
        };

        if (job.salary) {
          matchingObject.salary = job.salary;
        }

        const location = job.country ? `${job.country}${job.city ? `, ${job.city}` : ''}` : null;

        if (location) {
          matchingObject.location = location;
        }

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
