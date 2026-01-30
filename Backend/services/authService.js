import BlackListToken from "../models/BlackListToken.js";

const authService = {
  // Generic register for any user type (User, Driver, etc.)
  async register(Model, data) {
    const { fullName, email, password, ...rest } = data;

    // Check if user already exists
    const existingUser = await Model.findOne({ email });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await Model.hashPassword(password);

    // Create user
    const user = new Model({
      fullname: fullName ? {
        firstname: fullName.firstName,
        lastname: fullName.lastName,
      } : undefined,
      email,
      password: hashedPassword,
      ...rest,
    });

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Prepare response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  },

  // Generic login for any user type
  async login(Model, email, password) {
    // Find user and include password field
    const user = await Model.findOne({ email }).select("+password");
    if (!user) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to database
    user.refreshToken = refreshToken;
    await user.save();

    // Prepare response
    const userResponse = user.toObject();
    delete userResponse.password;
    delete userResponse.refreshToken;

    return {
      accessToken,
      refreshToken,
      user: userResponse,
    };
  },

  // Generic logout for any user type
  async logout(token) {
    if (token) {
      await BlackListToken.create({ token });
    }
  },
};

export default authService;
