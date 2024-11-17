import express from 'express';
import permittedUsesHandler from './permitted-uses';

const app = express();

app.use('/api/permitted-uses', permittedUsesHandler);

export default app; 