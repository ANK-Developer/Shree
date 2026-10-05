import React, { useState } from "react";

const MembershipForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    fatherHusbandName: "",
    gotra: "",
    ghatak: "",
    ancestralPlace: "",
    bloodGroup: "",
    aadharNumber: "",
    occupation: "",
    officeAddress: "",
    pincode: "",
    mobileNumber: "",
    email: "",
    birthDate: "",
    anniversaryDate: "",
    familyMembers: [],
    district: "",
    assembly: "",
    wardMandAl: "",
    referredBy: "",
    referredByMobile: "",
    photo: null,
    signature: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files?.[0] || null;

    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const addFamilyMember = () => {
    setFormData((prev) => ({
      ...prev,
      familyMembers: [
        ...prev.familyMembers,
        {
          name: "",
          relation: "",
          birthDate: "",
          mobile: "",
        },
      ],
    }));
  };

  const updateFamilyMember = (index, field, value) => {
    setFormData((prev) => {
      const members = [...prev.familyMembers];

      members[index] = {
        ...members[index],
        [field]: value,
      };

      return {
        ...prev,
        familyMembers: members,
      };
    });
  };

  const removeFamilyMember = (index) => {
    setFormData((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    console.log("Static Form Data:", formData);

    alert("Form submitted successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-[#dbb674] text-white text-center px-6 py-8">
            <h1 className="text-3xl md:text-4xl font-bold">॥ वैश्यकुल सदस्यता फार्म ॥</h1>

            <p className="mt-2 text-lg">Become a Vaishyakul Member</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {/* Photo */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-yellow-600 border-b-2 border-yellow-500 pb-2 mb-5">फोटो / Photograph</h2>

              <div className="flex justify-center">
                <label className="cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "photo")} />

                  <div className="w-36 h-36 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden">
                    {formData.photo ? <img src={URL.createObjectURL(formData.photo)} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-sm text-gray-400">Upload Photo</span>}
                  </div>
                </label>
              </div>
            </div>

            {/* Personal Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-yellow-600 border-b-2 border-yellow-500 pb-2 mb-5">1. व्यक्तिगत जानकारी / Personal Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="नाम / Name" name="name" value={formData.name} onChange={handleChange} required />

                <Input label="पिता / पति का नाम / Father's / Husband's Name" name="fatherHusbandName" value={formData.fatherHusbandName} onChange={handleChange} required />

                <Input label="गोत्र / Gotra" name="gotra" value={formData.gotra} onChange={handleChange} required />

                <Input label="घटक / Ghatak" name="ghatak" value={formData.ghatak} onChange={handleChange} />

                <Input label="पैतृक स्थान / Ancestral Place" name="ancestralPlace" value={formData.ancestralPlace} onChange={handleChange} />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ब्लड ग्रुप / Blood Group</label>

                  <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="">Select</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>O+</option>
                    <option>O-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>

                <Input label="आधार नम्बर / Aadhar Number" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} maxLength={12} />

                <Input label="व्यवसाय / Occupation" name="occupation" value={formData.occupation} onChange={handleChange} />

                <Input label="पता / Address" name="officeAddress" value={formData.officeAddress} onChange={handleChange} />

                <Input label="पिनकोड / Pincode" name="pincode" value={formData.pincode} onChange={handleChange} />

                <Input label="मोबाईल नम्बर / Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} maxLength={10} required />

                <Input label="ई-मेल / Email" name="email" type="email" value={formData.email} onChange={handleChange} />

                <Input label="जन्म तिथि / Date of Birth" name="birthDate" type="date" value={formData.birthDate} onChange={handleChange} required />

                <Input label="विवाह वर्षगांठ / Wedding Anniversary" name="anniversaryDate" type="date" value={formData.anniversaryDate} onChange={handleChange} />
              </div>
            </div>

            {/* Family Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-yellow-600 border-b-2 border-yellow-500 pb-2 mb-5">2. परिवार की जानकारी / Family Information</h2>

              <div className="space-y-4">
                {formData.familyMembers.map((member, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-yellow-600">सदस्य #{index + 1}</h3>

                      <button type="button" onClick={() => removeFamilyMember(index)} className="text-red-500 text-sm">
                        Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input label="नाम / Name" value={member.name} onChange={(e) => updateFamilyMember(index, "name", e.target.value)} />

                      <Input label="रिश्ता / Relation" value={member.relation} onChange={(e) => updateFamilyMember(index, "relation", e.target.value)} />

                      <Input label="जन्म तिथि / DOB" type="date" value={member.birthDate} onChange={(e) => updateFamilyMember(index, "birthDate", e.target.value)} />

                      <Input label="मोबाइल / Mobile" value={member.mobile} onChange={(e) => updateFamilyMember(index, "mobile", e.target.value)} />
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addFamilyMember} className="mt-5 bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-lg">
                + Add Family Member
              </button>
            </div>

            {/* Other Details */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-yellow-600 border-b-2 border-yellow-500 pb-2 mb-5">3. अन्य विवरण / Other Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Input label="जिला / District" name="district" value={formData.district} onChange={handleChange} required />

                <Input label="विधानसभा / Assembly Constituency" name="assembly" value={formData.assembly} onChange={handleChange} />

                <Input label="वार्ड / मण्डल / Ward / Mandal" name="wardMandAl" value={formData.wardMandAl} onChange={handleChange} />

                <Input label="मेंबर बनाने वाले का नाम / Referred By" name="referredBy" value={formData.referredBy} onChange={handleChange} />

                <Input label="Referrer Mobile Number" name="referredByMobile" value={formData.referredByMobile} onChange={handleChange} maxLength={10} />
              </div>
            </div>

            {/* Signature */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-yellow-600 border-b-2 border-yellow-500 pb-2 mb-5">हस्ताक्षर / Signature</h2>

              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "signature")} className="w-full border border-gray-300 rounded-md p-2" />
            </div>

            {/* Contribution */}
            <div className="mb-8 p-5 bg-gray-50 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">सहयोग राशि / Contribution Amount</label>

              <div className="text-3xl font-bold text-yellow-500">₹100/-</div>

              <p className="text-sm text-gray-500">One Time Contribution</p>
            </div>

            {/* Submit */}
            <div className="flex justify-center">
              <button type="submit" className="bg-[#dbb674] hover:bg-[#c9a15f] text-white font-semibold px-8 py-3 rounded-lg">
                Submit Form
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="bg-[#dbb674] text-white px-6 py-4 text-center text-sm">वैश्यकुल - वैश्य समाज के व्यक्तियों की एक संस्था</div>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, name, value, onChange, type = "text", required = false, maxLength }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}

        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <input type={type} name={name} value={value} onChange={onChange} required={required} maxLength={maxLength} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500" />
    </div>
  );
};

export default MembershipForm;
