import express from 'express';
import cors from 'cors';
import upload from './multerConfig.js';
import { cloudinaryUpload } from './cloudinaryConfig.js';
import {
  signUpCompany,
  editCompanyRegData,
  saveCompanyProfile,
  getCompanyRegData,
  getCompanyProfile,
  removeCompanyProfile,
  getCompanyJobList,
} from './controllers/companyController.js';
import {
  signUpSeeker,
  editSeekerRegData,
  saveSeekerProfile,
  getSeekerRegData,
  getSeekerProfile,
  toggleSeekerStatus,
  removeSeekerProfile,
  searchCv,
} from './controllers/seekerController.js';
import {
  createJob,
  editJob,
  getJob,
  toggleJobStatus,
  removeJob,
  searchJob,
} from './controllers/jobController.js';
import { createChat, addChatMessage, getUserChats, getChat } from './controllers/chatController.js';
import { logIn } from './controllers/commonController.js';
import errorHandler from './errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Company request handlers
app.post('/sign_up/company', upload.none(), signUpCompany);
app.post('/edit/company_reg_data/:companyid', upload.none(), editCompanyRegData);
app.post('/save/company_profile/:companyid', upload.none(), saveCompanyProfile);
app.get('/company_reg_data/:companyid', getCompanyRegData);
app.get('/company_profile/:companyid', getCompanyProfile);
app.get('/remove/company_profile/:companyid', removeCompanyProfile);
app.get('/company_job_list/:companyid', getCompanyJobList);

// Seeker request handlers
app.post('/sign_up/seeker', upload.none(), signUpSeeker);
app.post('/edit/seeker_reg_data/:seekerid', upload.none(), editSeekerRegData);
app.post('/save/seeker_profile/:seekerid', upload.none(), saveSeekerProfile);
app.get('/seeker_reg_data/:seekerid', getSeekerRegData);
app.get('/seeker_profile/:seekerid', getSeekerProfile);
app.get('/toggle_status/profile/:seekerid', toggleSeekerStatus);
app.get('/remove/job_seeker_profile/:seekerid', removeSeekerProfile);
app.post('/search/cv', upload.none(), searchCv);

// Job request handlers
app.post('/create/job/:companyid', upload.none(), createJob);
app.post('/edit/job/:companyid/:jobid', upload.none(), editJob);
app.get('/job/:companyid/:jobid', getJob);
app.get('/toggle_status/job/:companyid/:jobid', toggleJobStatus);
app.get('/remove/job/:companyid/:jobid', removeJob);
app.post('/search/job', upload.none(), searchJob);

// Chat request handlers
app.post('/create_chat', upload.single('cvFile'), cloudinaryUpload, createChat);
app.post('/add_chat_message', upload.none(), addChatMessage);
app.get('/chat_list/:usertype/:userid', getUserChats);
app.get('/chat/:companyid/:seekerid/:jobid', getChat);

// Common handlers
app.post('/login', upload.none(), logIn);
app.get('/ping', (req, res) => res.sendStatus(200));

// Error handler
app.use((err, req, res, next) => errorHandler(err, res));

app.listen(3000, () => {
  console.log('Server started');
});
