import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) => {
  const { token } = req.cookies;
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized: Login Again" });
  }

  try {
    const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

    if (tokenDecode.id) {
      req.user = { userId: tokenDecode.id }; // Attach to req.user

    } else {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Login Again" });
    }

    next();
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export default userAuth;
