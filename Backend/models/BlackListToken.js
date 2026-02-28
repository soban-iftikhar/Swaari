import mongoose from 'mongoose';

const blackListTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    default: Date.now,
    expiresAt: 24 * 60 * 60, // Automatically remove after 24 hours
  },
});

const BlackListToken = mongoose.model('BlackListToken', blackListTokenSchema);

export default BlackListToken;