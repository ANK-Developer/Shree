const mongoose = require("mongoose");

const { Schema } = mongoose;

// Family Member Schema
const familyMemberSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    relation: {
      type: String,
      enum: ["", "पिता (Father)", "माता (Mother)", "भाई (Brother)", "बहन (Sister)", "पुत्र (Son)", "पुत्री (Daughter)", "पति (Husband)", "पत्नी (Wife)"],
      default: "",
    },
    dob: {
      type: Date,
      default: null,
    },
    mobile: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || /^\d{10}$/.test(value),
        message: "Family member mobile must be 10 digits",
      },
    },
  },
  { _id: true },
);

// Nominee Schema
const nomineeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Nominee name is required"],
      trim: true,
    },
    relation: {
      type: String,
      enum: ["", "पिता (Father)", "माता (Mother)", "भाई (Brother)", "बहन (Sister)", "पुत्र (Son)", "पुत्री (Daughter)", "पति (Husband)", "पत्नी (Wife)"],
      default: "",
    },
    mobile: {
      type: String,
      required: [true, "Nominee mobile is required"],
      trim: true,
      match: [/^\d{10}$/, "Nominee mobile must be 10 digits"],
    },
  },
  { _id: true },
);

// Referral Schema
const referralSchema = new Schema(
  {
    name: {
      type: String,
      trim: true,
      default: "",
    },
    mobile: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || /^\d{10}$/.test(value),
        message: "Referral mobile must be 10 digits",
      },
    },
  },
  { _id: true },
);

// Main Member Schema
const memberSchema = new Schema(
  {
    // Photograph URL
    photoUrl: {
      type: String,
      trim: true,
      default: "",
    },

    // Personal Information
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    fatherHusbandName: {
      type: String,
      required: [true, "Father/Husband name is required"],
      trim: true,
    },

    surname: {
      type: String,
      trim: true,
      default: "",
    },

    memberType: {
      type: String,
      required: [true, "Member type is required"],
      enum: [
        "ट्रस्टी / Trustee",
        "अध्यक्ष / President",
        "उपाध्यक्ष / Vice President",
        "सचिव / Secretary",
        "कोषाध्यक्ष / Treasurer",
        "सदस्य / Member",
        "संस्थापक सदस्य / Founder Member",
        "कार्यकारी सदस्य / Executive Member",
        "सलाहकार / Advisor",
        "मानद सदस्य / Honorary Member",
        "स्वयंसेवक / Volunteer",
        "अन्य / Other",
      ],
    },

 
    bloodGroup: {
      type: String,
      enum: ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"],
      default: "",
    },

    // Aadhaar Number
    aadharNumber: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || /^\d{12}$/.test(value),
        message: "Aadhaar number must be 12 digits",
      },
    },

    occupation: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
      validate: {
        validator: (value) => !value || /^\d{6}$/.test(value),
        message: "Pincode must be 6 digits",
      },
    },

    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      unique: true, // unique index bhi yahi banata hai
      match: [/^\d{10}$/, "Mobile number must be 10 digits"],
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      validate: {
        validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        message: "Please enter a valid email address",
      },
    },

    birthDate: {
      type: Date,
      required: [true, "Birth date is required"],
    },

    anniversaryDate: {
      type: Date,
      default: null,
    },

    // Family Members
    familyMembers: {
      type: [familyMemberSchema],
      default: [],
    },

    // At least one nominee is required
    nominees: {
      type: [nomineeSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 1,
        message: "At least one nominee is required",
      },
    },

    // Referrals are optional
    referrals: {
      type: [referralSchema],
      default: [],
    },

    // Member Status
    memberStatus: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes (mobileNumber ka unique index field par hi defined hai)
memberSchema.index({ email: 1 });
memberSchema.index({ "referrals.mobile": 1 }); // "kisne kitno ko refer kiya" lookup ke liye

const Member = mongoose.model("Member", memberSchema);

// Existing duplicate data ki wajah se unique index na ban paye to server crash na ho, clear log mile
Member.on("index", (err) => {
  if (err) console.error("Member index build failed (duplicate data?):", err.message);
});

module.exports = Member;
