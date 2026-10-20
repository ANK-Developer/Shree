// Pehle ye rules Mongoose schema me the; MySQL/Prisma me save se pehle yahin check hote hain.

const RELATIONS = ["", "पिता (Father)", "माता (Mother)", "भाई (Brother)", "बहन (Sister)", "पुत्र (Son)", "पुत्री (Daughter)", "पति (Husband)", "पत्नी (Wife)"];

const MEMBER_TYPES = [
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
];

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const MOBILE_RE = /^\d{10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const str = (v) => (v === undefined || v === null ? "" : String(v).trim());

// "" / null => null, warna Date (invalid ho to errors me message)
const toDate = (value, label, errors) => {
  const s = str(value);
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    errors.push(`${label} is invalid`);
    return null;
  }
  return d;
};

// data: controller se aaya raw object ({ ...PERSONAL_FIELDS, anniversaryDate, familyMembers, nominees, referrals })
// return: { errors, member, familyMembers, nominees, referrals } (sab trimmed / cleaned)
const validateMember = (data) => {
  const errors = [];

  const member = {
    name: str(data.name),
    fatherHusbandName: str(data.fatherHusbandName),
    surname: str(data.surname),
    memberType: str(data.memberType),
    bloodGroup: str(data.bloodGroup),
    aadharNumber: str(data.aadharNumber),
    occupation: str(data.occupation),
    address: str(data.address),
    pincode: str(data.pincode),
    mobileNumber: str(data.mobileNumber),
    email: str(data.email).toLowerCase(),
    photoUrl: data.photoUrl || "",
  };

  if (!member.name) errors.push("Name is required");
  if (!member.fatherHusbandName) errors.push("Father/Husband name is required");
  if (!member.memberType) errors.push("Member type is required");
  else if (!MEMBER_TYPES.includes(member.memberType)) errors.push("Invalid member type");
  if (!BLOOD_GROUPS.includes(member.bloodGroup)) errors.push("Invalid blood group");
  if (member.aadharNumber && !/^\d{12}$/.test(member.aadharNumber)) errors.push("Aadhaar number must be 12 digits");
  if (member.pincode && !/^\d{6}$/.test(member.pincode)) errors.push("Pincode must be 6 digits");
  if (!member.mobileNumber) errors.push("Mobile number is required");
  else if (!MOBILE_RE.test(member.mobileNumber)) errors.push("Mobile number must be 10 digits");
  if (member.email && !EMAIL_RE.test(member.email)) errors.push("Please enter a valid email address");

  member.birthDate = toDate(data.birthDate, "Birth date", errors);
  if (!str(data.birthDate)) errors.push("Birth date is required");
  member.anniversaryDate = toDate(data.anniversaryDate, "Anniversary date", errors);

  const familyMembers = data.familyMembers.map((r, sortOrder) => {
    const row = { sortOrder, name: str(r.name), relation: str(r.relation), mobile: str(r.mobile) };
    row.dob = toDate(r.dob, "Family member date of birth", errors);
    if (!RELATIONS.includes(row.relation)) errors.push("Invalid family member relation");
    if (row.mobile && !MOBILE_RE.test(row.mobile)) errors.push("Family member mobile must be 10 digits");
    return row;
  });

  if (data.nominees.length < 1) errors.push("At least one nominee is required");
  const nominees = data.nominees.map((r, sortOrder) => {
    const row = { sortOrder, name: str(r.name), relation: str(r.relation), mobile: str(r.mobile) };
    if (!row.name) errors.push("Nominee name is required");
    if (!RELATIONS.includes(row.relation)) errors.push("Invalid nominee relation");
    if (!row.mobile) errors.push("Nominee mobile is required");
    else if (!MOBILE_RE.test(row.mobile)) errors.push("Nominee mobile must be 10 digits");
    return row;
  });

  const referrals = data.referrals.map((r, sortOrder) => {
    const row = { sortOrder, name: str(r.name), mobile: str(r.mobile) };
    if (row.mobile && !MOBILE_RE.test(row.mobile)) errors.push("Referral mobile must be 10 digits");
    return row;
  });

  // Ek hi message multiple rows se repeat na ho
  return { errors: [...new Set(errors)], member, familyMembers, nominees, referrals };
};

module.exports = { validateMember };
