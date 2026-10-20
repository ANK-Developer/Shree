import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { submitMember } from "../features/members/membersSlice";

const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_SIZE = 2 * 1024 * 1024; // backend limit ke saath same

const inputClass = "w-full px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-gray-800 placeholder-gray-400 transition focus:outline-none focus:ring-2 focus:ring-royal-500 focus:border-royal-500";

const Field = ({ label, required, hint, error, children, className = "" }) => (
  <div className={className}>
    <label className="block text-sm font-semibold text-royal-500 mb-1.5">
      {label} {required && <span className="text-pink-brand">*</span>}
    </label>
    {children}
    {error ? <p className="text-xs text-red-500 mt-1">{error}</p> : hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="mb-6 rounded-2xl border border-royal-100 bg-white shadow-sm overflow-hidden">
    <div className="flex items-center gap-3 bg-royal-50 px-5 py-3 border-b border-royal-100">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg shadow-sm">{icon}</span>
      <h3 className="text-base md:text-lg font-bold text-royal-600">{title}</h3>
    </div>
    <div className="p-5 md:p-6">{children}</div>
  </div>
);

const bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

const occupations = [
  "व्यापार / Business",
  "दुकानदार / Shopkeeper",
  "किसान / Farmer",
  "सरकारी कर्मचारी / Government Employee",
  "निजी कर्मचारी / Private Employee",
  "शिक्षक / Teacher",
  "डॉक्टर / Doctor",
  "इंजीनियर / Engineer",
  "वकील / Advocate",
  "विद्यार्थी / Student",
  "स्वरोजगार / Self Employed",
  "गृहिणी / Housewife",
  "सेवानिवृत्त / Retired",
  "अन्य / Other",
];

const memberTypes = [
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
const relations = ["पिता (Father)", "माता (Mother)", "भाई (Brother)", "बहन (Sister)", "पुत्र (Son)", "पुत्री (Daughter)", "पति (Husband)", "पत्नी (Wife)"];

const initialForm = {
  name: "",
  fatherHusbandName: "",
  surname: "",
  memberType: "",
  ancestralPlace: "",
  bloodGroup: "",
  aadharNumber: "",
  occupation: "",
  address: "",
  pincode: "",
  mobileNumber: "",
  email: "",
  birthDate: "",
  anniversaryDate: "",
};

const emptyMember = { name: "", relation: "", dob: "", mobile: "" };

const emptyNominee = { name: "", relation: "", mobile: "" };
const emptyReferral = { name: "", mobile: "" };

const digits = (v, max) => v.replace(/\D/g, "").slice(0, max);

// required=true: name + mobile mandatory. required=false: optional, par mobile bhare to 10 digit hona chahiye
const rowErrors = (rows, required = true) =>
  rows.map((r) => {
    const e = {};
    if (required && !r.name.trim()) e.name = "नाम आवश्यक है / Name is required";
    if ((required || r.mobile) && r.mobile.length !== 10) e.mobile = "10 अंक का मोबाइल नंबर दें / Enter 10-digit mobile number";
    return e;
  });

// Nominee / Referral dono ke liye reusable "ek se zyada add karo" section
const RepeatSection = ({ title, icon, itemLabel, addLabel, rows, showRelation, single, required = true, nameLabel = "नाम / Name", phoneLabel = "फोन / Phone", errors, touched, onChange, onBlur, onAdd, onRemove }) => (
  <Section title={title} icon={icon}>
    <div className="space-y-4">
      {rows.map((r, i) => (
        // single: section hi parent card hai, andar alag child card nahi
        <div key={i} className={single ? "" : "border border-royal-100 rounded-xl p-4 bg-royal-50/50"}>
          {!single && (
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-bold text-pink-brand">
                {itemLabel} #{i + 1}
              </h4>
              {rows.length > 1 && (
                <button type="button" onClick={() => onRemove(i)} className="text-xs font-semibold text-red-500 hover:text-red-700">
                  ✕ हटाएं / Remove
                </button>
              )}
            </div>
          )}
          <div className={`grid grid-cols-1 gap-4 ${showRelation ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
            <Field label={nameLabel} required={required} error={touched[`${i}.name`] ? errors[i]?.name : undefined}>
              <input type="text" value={r.name} onChange={(e) => onChange(i, "name", e.target.value)} onBlur={() => onBlur(i, "name")} className={inputClass} />
            </Field>
            {showRelation && (
              <Field label="रिश्ता / Relation">
                <select value={r.relation} onChange={(e) => onChange(i, "relation", e.target.value)} className={inputClass}>
                  <option value="">-- चुनें / Select --</option>
                  {relations.map((rel) => (
                    <option key={rel}>{rel}</option>
                  ))}
                </select>
              </Field>
            )}
            <Field label={phoneLabel} required={required} error={touched[`${i}.mobile`] ? errors[i]?.mobile : undefined}>
              <input
                type="tel"
                inputMode="numeric"
                value={r.mobile}
                onChange={(e) => onChange(i, "mobile", digits(e.target.value, 10))}
                onBlur={() => onBlur(i, "mobile")}
                className={inputClass}
              />
            </Field>
          </div>
        </div>
      ))}
    </div>
    {!single && (
      <button type="button" onClick={onAdd} className="mt-5 bg-royal-600 hover:bg-royal-700 text-white text-sm font-semibold py-2.5 px-5 rounded-xl transition">
        {addLabel}
      </button>
    )}
  </Section>
);

const MembershipForm = () => {
  const [form, setForm] = useState(initialForm);
  const [members, setMembers] = useState([{ ...emptyMember }]);
  const [nominees, setNominees] = useState([{ ...emptyNominee }]);
  const [referrals, setReferrals] = useState([{ ...emptyReferral }]);
  const [listTouched, setListTouched] = useState({ nominee: {}, referral: {} });
  const [photo, setPhoto] = useState(null); // preview URL
  const [photoFile, setPhotoFile] = useState(null); // upload hone wali actual file
  const submitting = useSelector((s) => s.members.submitting);
  const dispatch = useDispatch();
  const [touched, setTouched] = useState({});
  const [success, setSuccess] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "नाम आवश्यक है / Name is required";
    if (!form.fatherHusbandName.trim()) e.fatherHusbandName = "यह जानकारी आवश्यक है / Required";
    if (!form.memberType) e.memberType = "प्रकार चुनें / Select type";
    if (form.mobileNumber.length !== 10) e.mobileNumber = "10 अंक का मोबाइल नंबर दें / Enter 10-digit mobile number";
    if (!form.birthDate) e.birthDate = "जन्म तिथि आवश्यक है / Date of birth is required";
    if (form.aadharNumber && form.aadharNumber.length !== 12) e.aadharNumber = "12 अंक होने चाहिए / Must be 12 digits";
    if (form.pincode && form.pincode.length !== 6) e.pincode = "6 अंक होने चाहिए / Must be 6 digits";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) e.email = "सही ई-मेल दें / Enter a valid email";
    return e;
  }, [form]);

  const nomineeErrors = useMemo(() => rowErrors(nominees), [nominees]);
  const referralErrors = useMemo(() => rowErrors(referrals, false), [referrals]);
  const listsValid = [...nomineeErrors, ...referralErrors].every((e) => Object.keys(e).length === 0);

  const isValid = Object.keys(errors).length === 0 && listsValid;
  const err = (k) => (touched[k] ? errors[k] : undefined);

  const set = (name, max) => (e) => {
    const value = max ? digits(e.target.value, max) : e.target.value;
    setForm((f) => ({ ...f, [name]: value }));
  };
  const blur = (name) => () => setTouched((t) => ({ ...t, [name]: true }));
  const bind = (name, max) => ({ name, value: form[name], onChange: set(name, max), onBlur: blur(name), className: inputClass });

  const updateMember = (i, key, value) => setMembers((m) => m.map((x, idx) => (idx === i ? { ...x, [key]: value } : x)));

  // Nominee / Referral rows ke helpers (kind = "nominee" | "referral")
  const lists = { nominee: [nominees, setNominees, emptyNominee], referral: [referrals, setReferrals, emptyReferral] };
  const updateRow = (kind, i, key, value) => lists[kind][1]((rows) => rows.map((x, idx) => (idx === i ? { ...x, [key]: value } : x)));
  const addRow = (kind) => lists[kind][1]((rows) => [...rows, { ...lists[kind][2] }]);
  const removeRow = (kind, i) => {
    lists[kind][1]((rows) => rows.filter((_, idx) => idx !== i));
    setListTouched((t) => ({ ...t, [kind]: {} })); // indexes shift ho jaate hain
  };
  const blurRow = (kind, i, key) => setListTouched((t) => ({ ...t, [kind]: { ...t[kind], [`${i}.${key}`]: true } }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    e.target.value = ""; // same file dobara choose karne par bhi onChange chale
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) return toast.error("Only JPG, PNG or WEBP images are allowed");
    if (file.size > PHOTO_MAX_SIZE) return toast.error("Photo must be 2MB or smaller");

    if (photo) URL.revokeObjectURL(photo);
    setPhotoFile(file);
    setPhoto(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) {
      setTouched(Object.fromEntries(Object.keys(initialForm).map((k) => [k, true])));
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    data.append("familyMembers", JSON.stringify(members));
    data.append("nominees", JSON.stringify(nominees));
    data.append("referrals", JSON.stringify(referrals));
    if (photoFile) data.append("photo", photoFile);

    try {
      const res = await dispatch(submitMember(data)).unwrap();
      toast.success(res.message);
      setSuccess(true);
    } catch (message) {
      toast.error(message);
    }
  };

  const reset = () => {
    setForm(initialForm);
    setMembers([{ ...emptyMember }]);
    setNominees([{ ...emptyNominee }]);
    setReferrals([{ ...emptyReferral }]);
    setListTouched({ nominee: {}, referral: {} });
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(null);
    setPhotoFile(null);
    setTouched({});
    setSuccess(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div id="membership" className="py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-royal-700 via-royal-600 to-royal-500 px-6 py-8 mb-8 text-center shadow-lg border-b-4 border-gold-500">
          <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-gold-500/20" />
          <div className="absolute -bottom-12 -right-8 h-40 w-40 rounded-full bg-pink-brand/20" />
          <h1 className="relative text-2xl md:text-4xl font-bold text-gold-400">॥ सदस्यता फार्म ॥</h1>
          <p className="relative mt-2 text-sm md:text-base text-royal-100">Membership Form — * वाले सभी विवरण भरने पर ही Submit खुलेगा</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <Section title="फोटो / Photograph" icon="📷">
            <div className="flex justify-center">
              <label className="cursor-pointer group">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhoto} />
                <div className="w-36 h-36 rounded-full overflow-hidden border-2 border-dashed border-royal-500/40 bg-royal-50 flex flex-col items-center justify-center text-royal-500 transition group-hover:border-royal-500 group-hover:bg-royal-100">
                  {photo ? (
                    <img src={photo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <svg className="w-10 h-10 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.8"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <p className="text-xs font-medium">Upload Photo</p>
                    </>
                  )}
                </div>
              </label>
            </div>
          </Section>

          <Section title="1. व्यक्तिगत जानकारी / Personal Information" icon="👤">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="नाम / Name" required hint="(श्री / श्रीमति / Mr. / Ms.)" error={err("name")}>
                <input type="text" {...bind("name")} />
              </Field>
              <Field label="पिता / पति का नाम / Father's / Husband's Name" required error={err("fatherHusbandName")}>
                <input type="text" {...bind("fatherHusbandName")} />
              </Field>
              <Field label="सरनेम / Surname" error={err("surname")}>
                <input type="text" {...bind("surname")} />
              </Field>
              <Field label="प्रकार / Type" required error={err("memberType")}>
                <select {...bind("memberType")}>
                  <option value="">चुनें / Select</option>
                  {memberTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              {/* <Field label="पैतृक स्थान (निवास) / Ancestral Place (Residence)">
                <input type="text" {...bind("ancestralPlace")} />
              </Field> */}
              <Field label="ब्लड ग्रुप / Blood Group">
                <select {...bind("bloodGroup")}>
                  <option value="">चुनें / Select</option>
                  {bloodGroups.map((b) => (
                    <option key={b}>{b}</option>
                  ))}
                </select>
              </Field>
              <Field label="आधार नम्बर / Aadhar Number" hint="(12 अंक / 12 digits)" error={err("aadharNumber")}>
                <input type="text" inputMode="numeric" {...bind("aadharNumber", 12)} />
              </Field>
              <Field label="व्यवसाय / Occupation">
                <select {...bind("occupation")}>
                  <option value="">व्यवसाय चुनें / Select Occupation</option>
                  {occupations.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="पता / Address">
                <input type="text" {...bind("address")} />
              </Field>
              <Field label="पिनकोड / Pincode" error={err("pincode")}>
                <input type="text" inputMode="numeric" {...bind("pincode", 6)} />
              </Field>
              <Field label="मोबाईल नम्बर / Mobile Number" required error={err("mobileNumber")}>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-gray-300 bg-royal-50 text-royal-600 text-sm font-semibold">+91</span>
                  <input type="tel" inputMode="numeric" {...bind("mobileNumber", 10)} className={inputClass + " rounded-l-none"} />
                </div>
              </Field>
              <Field label="ई-मेल / Email" error={err("email")}>
                <input type="email" {...bind("email")} />
              </Field>
              <Field label="जन्म तिथि / Date of Birth" required error={err("birthDate")}>
                <input type="date" {...bind("birthDate")} />
              </Field>
              <Field label="विवाह वर्षगांठ / Wedding Anniversary" error={err("anniversaryDate")}>
                <input type="date" {...bind("anniversaryDate")} />
              </Field>
            </div>
          </Section>

          <Section title="2. परिवार की जानकारी / Family Information" icon="👨‍👩‍👧">
            <div className="space-y-4">
              {members.map((m, i) => (
                <div key={i} className="border border-royal-100 rounded-xl p-4 bg-royal-50/50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-base font-bold text-pink-brand">सदस्य #{i + 1}</h4>
                    {members.length > 1 && (
                      <button type="button" onClick={() => setMembers((arr) => arr.filter((_, idx) => idx !== i))} className="text-xs font-semibold text-red-500 hover:text-red-700">
                        ✕ हटाएं / Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="नाम / Name">
                      <input type="text" value={m.name} onChange={(e) => updateMember(i, "name", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="रिश्ता / Relation">
                      <select value={m.relation} onChange={(e) => updateMember(i, "relation", e.target.value)} className={inputClass}>
                        <option value="">-- चुनें / Select --</option>
                        {relations.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="जन्म तिथि / DOB">
                      <input type="date" value={m.dob} onChange={(e) => updateMember(i, "dob", e.target.value)} className={inputClass} />
                    </Field>
                    <Field label="मोबाइल / Mobile">
                      <input type="tel" inputMode="numeric" value={m.mobile} onChange={(e) => updateMember(i, "mobile", digits(e.target.value, 10))} className={inputClass} />
                    </Field>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setMembers((arr) => [...arr, { ...emptyMember }])} className="mt-5 bg-royal-600 hover:bg-royal-700 text-white text-sm font-semibold py-2.5 px-5 rounded-xl transition">
              + परिवार के सदस्य जोड़ें / Add Family Member
            </button>
          </Section>

          <RepeatSection
            title="3. नॉमिनी / Nominee"
            icon="🧾"
            itemLabel="नॉमिनी"
            addLabel="+ नॉमिनी जोड़ें / Add Nominee"
            showRelation
            rows={nominees}
            errors={nomineeErrors}
            touched={listTouched.nominee}
            onChange={(i, k, v) => updateRow("nominee", i, k, v)}
            onBlur={(i, k) => blurRow("nominee", i, k)}
            onAdd={() => addRow("nominee")}
            onRemove={(i) => removeRow("nominee", i)}
          />

          <RepeatSection
            title="4. रेफरल / Referral"
            icon="🤝"
            itemLabel="रेफरल"
            single
            required={false}
            nameLabel="रेफर करने वाले का नाम / Referred By"
            phoneLabel="रेफर करने वाले का मोबाइल नंबर / Referrer's Mobile Number"
            rows={referrals}
            errors={referralErrors}
            touched={listTouched.referral}
            onChange={(i, k, v) => updateRow("referral", i, k, v)}
            onBlur={(i, k) => blurRow("referral", i, k)}
            onAdd={() => addRow("referral")}
            onRemove={(i) => removeRow("referral", i)}
          />

          <div className="mb-8 text-center">
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="w-full md:w-auto bg-royal-600 hover:bg-royal-700 text-white font-bold text-lg py-3 px-16 rounded-full shadow-lg border-b-4 border-gold-500 transition disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-royal-600"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
            {!isValid && <p className="text-xs text-gray-500 mt-2">* वाले सभी विवरण भरें / Fill all required (*) fields</p>}
          </div>
        </form>
      </div>

      {success && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl border-t-8 border-leaf">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-leaf/10">
              <svg className="h-12 w-12 text-leaf" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-royal-600">सफल / Success!</h2>
            <p className="mt-2 text-gray-600 text-sm">
              धन्यवाद <span className="font-semibold">{form.name}</span>, आपका सदस्यता फार्म सफलतापूर्वक जमा हो गया है।
            </p>
            <p className="mt-1 text-gray-500 text-xs">Your membership form has been submitted successfully.</p>
            <button onClick={reset} className="mt-6 w-full rounded-full bg-royal-600 hover:bg-royal-700 text-white font-semibold py-3 transition">
              ठीक है / OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipForm;
