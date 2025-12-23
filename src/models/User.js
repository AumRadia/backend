const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Counter = require("./counter"); // Ensure this path is correct based on your file structure

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      unique: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    mobile: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: 8,
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    googleEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    verificationExpires: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    userType: {
      type: String,
      enum: ["free", "paid"],
      default: "free"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active", // Default is active
    },
    accountType: {
      type: String,
      enum: ["private", "company", "NGO"], // Updated to include NGO
      default: "private"
    },
    tokens: {
      type: Number,
      default: 0
    },
    // ADDED: Balance field
    balance: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.verificationToken;
  delete user.resetPasswordToken;
  return user;
};

UserSchema.pre("save", async function (next) {
  if (!this.isNew) return next();
  try {
    const counter = await Counter.findOneAndUpdate(
      { id: "userId" },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("User", UserSchema);