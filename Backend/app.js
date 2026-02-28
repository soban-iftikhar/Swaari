import dotenv from 'dotenv';
import express from 'express';
import connectDB from './configs/db.js';
import userRoutes from './routes/userRoutes.js';
import cookieParser from 'cookie-parser';

(async () => {
  dotenv.config();
  await connectDB();

  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use("/api/users", userRoutes);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();