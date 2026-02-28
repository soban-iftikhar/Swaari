import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const authPlugin = (schema) => {
  // Instance Method to Generate Access Token (short-lived)
  schema.methods.generateAccessToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "24h",
    });
    return token;
  };

  // Instance Method to Generate Refresh Token (long-lived)
  schema.methods.generateRefreshToken = function () {
    const token = jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });
    return token;
  };

  // Static Method to Hash password
  schema.statics.hashPassword = async function (password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  };

  // Instance Method to Compare password
  schema.methods.comparePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password);
  };
};

export default authPlugin;
