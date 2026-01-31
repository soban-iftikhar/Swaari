import dotenv from 'dotenv';
import express from 'express';
import connectDB from './configs/db.js';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/userRoutes.js';
import driverRoutes from './routes/driverRoutes.js';


(async () => {
  dotenv.config();
  await connectDB();

  const app = express();
  const PORT = process.env.PORT || 5000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use("/api/users", userRoutes);
  app.use("/api/drivers", driverRoutes);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
})();