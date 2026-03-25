import BlackListToken from "../models/BlackListToken.js";

const authService = {
  // Generic register for any entity type (Rider, Driver, etc.)
  async register(Model, data) {
    const { fullName, email, password, ...rest } = data;

    // Check if entity already exists
    const existingEntity = await Model.findOne({ email });
    if (existingEntity) {
      throw new Error(`${Model.modelName} already exists`);
    }

    // Hash password
    const hashedPassword = await Model.hashPassword(password);

    // Create entity
    const entity = new Model({
      fullname: fullName ? {
        firstname: fullName.firstName,
        lastname: fullName.lastName,
      } : undefined,
      email,
      password: hashedPassword,
      ...rest,
    });

    // Generate tokens
    const accessToken = entity.generateAccessToken();
    const refreshToken = entity.generateRefreshToken();

    // Save refresh token to database
    entity.refreshToken = refreshToken;
    await entity.save();

    // Prepare response
    const entityResponse = entity.toObject();
    delete entityResponse.password;
    delete entityResponse.refreshToken;

    return {
      accessToken,
      refreshToken,
      entity: entityResponse,
      role: Model.modelName.toLowerCase(), // 'rider' or 'driver'
    };
  },

  // Generic login for any entity type
  async login(Model, email, password) {
    // Find entity and include password field
    const entity = await Model.findOne({ email }).select("+password");
    if (!entity) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await entity.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    // Generate tokens
    const accessToken = entity.generateAccessToken();
    const refreshToken = entity.generateRefreshToken();

    // Save refresh token to database
    entity.refreshToken = refreshToken;
    await entity.save();

    // Prepare response
    const entityResponse = entity.toObject();
    delete entityResponse.password;
    delete entityResponse.refreshToken;

    return {
      accessToken,
      refreshToken,
      entity: entityResponse,
      role: Model.modelName.toLowerCase(), // 'rider' or 'driver'
    };
  },

  // Generic logout for any entity type
  async logout(token) {
    if (token) {
      await BlackListToken.create({ token });
    }
  },
};

export default authService;
