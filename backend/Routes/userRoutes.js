const express = require("express");
const router = express.Router();
const fetchuser = require("../middleware/fetchUser.js");
const {
  getPresignedUrl,
  getOnlineStatus,
} = require("../controllers/userController.js");  // 👈 lowercase "controllers"
const {
  getNonFriendsList,
  updateprofile,
} = require("../controllers/auth_controller.js");  // 👈 lowercase "controllers"

router.get("/online-status/:id", fetchuser, getOnlineStatus);
router.get("/non-friends", fetchuser, getNonFriendsList);
router.put("/update", fetchuser, updateprofile);
router.get("/presigned-url", fetchuser, getPresignedUrl);

module.exports = router;
