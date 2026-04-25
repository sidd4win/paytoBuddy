require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rootRouter = require('./routes/index');

const app = express();        

app.use(cors());              
app.use(express.json());

app.use('/api/v1', rootRouter);

// Use the PORT provided by Render/Vercel or fallback to 3000 for local
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
