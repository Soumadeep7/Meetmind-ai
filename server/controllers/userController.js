const User = require("../models/User");

const searchUsers = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const users = await User.find({
      $or: [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
      ],
    })
      .select("name email")
      .limit(20);

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while searching users",
    });
  }
};

module.exports = {
  searchUsers,
};