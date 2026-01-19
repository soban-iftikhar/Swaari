import User from "../models/User.js";


const createUser = async ({firstName, lastName, email, password}) =>{
    if(!firstName || !email || !password) {
        throw new Error("All fields are required");
    }
    const user = await User.create({
        fullname: {
            firstname: firstName,
            lastname: lastName
        },
        email,
        password
    });
    return user;
}
    
export default {
    createUser
};