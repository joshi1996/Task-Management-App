import express from 'express';
import authRouter from './routes/auth.js';
import taskRouter from './routes/task.js';

const app = express();

app.use(express.json());
app.use('/auth', authRouter);
app.use("/tasks", taskRouter);

app.get('/', (req, res) => {
    res.send('Hello, World and Good night !!!');
});

app.listen(8000, "0.0.0.0", () => {
    console.log('Server is running on port 8000');
});