import express from 'express';
import permittedUsesHandler from './permitted-uses';
import proxyHandler from './proxy';

const app = express();

app.use(express.json());
app.use('/api/permitted-uses', permittedUsesHandler);
app.use('/api/proxy', proxyHandler);

export default app; 