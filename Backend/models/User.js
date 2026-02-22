import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    fullname : {
        firstname:{
            type: String,
            required : true,
            minlength : [3 ,"Fisrt name must be atleast 3 characters long"]
        },
        lastname:{
            type: String,
            required : true,
            minlength : [3 ,"Last name must be atleast 3 characters long"]
        }
    },
    email:{
            type: String,
            required : true,
            unique : true,
            lowercase : true,
            minlength : [5 ,"Email name must be atleast 5 characters long"]
        },
    password:{
            type: String,
            required : true,
            select: false,
            minlength : [8 ,"Password must be atleast 8 characters long"]
        },
    
        socketId : {
            type: String
        },
    refreshToken : {
            type: String,
            default: null
        }

})

// Instance Method to Generate Access Token (short-lived)
userSchema.methods.generateAccessToken = function() {
    const token = jwt.sign({ _id: this._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    return token;
};

// Instance Method to Generate Refresh Token (long-lived)
userSchema.methods.generateRefreshToken = function() {
    const token = jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return token;
};

// Static Method to Hash the password before saving the user
userSchema.statics.hashPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

//  Instance Method to Compare the provided password with the stored hashed password
userSchema.methods.comparePassword = async function(userPassword) {
    return await bcrypt.compare(userPassword, this.password);
};


const User = mongoose.model("User", userSchema);
export default User;
