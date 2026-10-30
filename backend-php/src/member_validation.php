<?php
// Member form ke rules (Node wale utils/memberValidation.js jaise hi). Save se pehle yahin check hote hain.

const RELATIONS = ['', 'पिता (Father)', 'माता (Mother)', 'भाई (Brother)', 'बहन (Sister)', 'पुत्र (Son)', 'पुत्री (Daughter)', 'पति (Husband)', 'पत्नी (Wife)'];

const MEMBER_TYPES = [
    'पैट्रन ट्रस्टी / Patron Trustee',
    'ट्रस्टी / Trustee',
    'रूम दान / Room Daan',
    'अध्यक्ष / President',
    'उपाध्यक्ष / Vice President',
    'सचिव / Secretary',
    'कोषाध्यक्ष / Treasurer',
    'सदस्य / Member',
    'संस्थापक सदस्य / Founder Member',
    'कार्यकारी सदस्य / Executive Member',
    'सलाहकार / Advisor',
    'मानद सदस्य / Honorary Member',
    'स्वयंसेवक / Volunteer',
    'अन्य / Other',
];

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const MOBILE_RE = '/^\d{10}$/D';
const EMAIL_RE = '/^[^\s@]+@[^\s@]+\.[^\s@]+$/uD';

// "" / null => null, warna "YYYY-MM-DD" (invalid ho to errors me message)
function to_db_date(mixed $value, string $label, array &$errors): ?string
{
    if (str($value) === '') return null;
    $d = parse_js_date($value);
    if (!$d) {
        $errors[] = "$label is invalid";
        return null;
    }
    return db_date($d);
}

function field(mixed $row, string $key): mixed
{
    return is_array($row) ? ($row[$key] ?? null) : null;
}

// data: controller se aaya raw array (personal fields + anniversaryDate, familyMembers, nominees, referrals)
// return: [errors, member, familyMembers, nominees, referrals] (sab trimmed / cleaned)
// $isEdit: purane (sheet se aaye) members me birth date / nominee khaali ho sakte hain, isliye edit me wo zaroori nahi
function validate_member(array $data, bool $isEdit = false): array
{
    $errors = [];

    $member = [
        'name' => str($data['name'] ?? null),
        'fatherHusbandName' => str($data['fatherHusbandName'] ?? null),
        'surname' => str($data['surname'] ?? null),
        'memberType' => str($data['memberType'] ?? null),
        'bloodGroup' => str($data['bloodGroup'] ?? null),
        'aadharNumber' => str($data['aadharNumber'] ?? null),
        'occupation' => str($data['occupation'] ?? null),
        'address' => str($data['address'] ?? null),
        'pincode' => str($data['pincode'] ?? null),
        'mobileNumber' => str($data['mobileNumber'] ?? null),
        'email' => mb_strtolower(str($data['email'] ?? null)),
        'photoUrl' => $data['photoUrl'] ?: '',
    ];

    if ($member['name'] === '') $errors[] = 'Name is required';
    if ($member['fatherHusbandName'] === '') $errors[] = 'Father/Husband name is required';
    if ($member['memberType'] === '') $errors[] = 'Member type is required';
    elseif (!in_array($member['memberType'], MEMBER_TYPES, true)) $errors[] = 'Invalid member type';
    if (!in_array($member['bloodGroup'], BLOOD_GROUPS, true)) $errors[] = 'Invalid blood group';
    if ($member['aadharNumber'] !== '' && !preg_match('/^\d{12}$/D', $member['aadharNumber'])) $errors[] = 'Aadhaar number must be 12 digits';
    if ($member['pincode'] !== '' && !preg_match('/^\d{6}$/D', $member['pincode'])) $errors[] = 'Pincode must be 6 digits';
    if ($member['mobileNumber'] === '') $errors[] = 'Mobile number is required';
    elseif (!preg_match(MOBILE_RE, $member['mobileNumber'])) $errors[] = 'Mobile number must be 10 digits';
    if ($member['email'] !== '' && !preg_match(EMAIL_RE, $member['email'])) $errors[] = 'Please enter a valid email address';

    $member['birthDate'] = to_db_date($data['birthDate'] ?? null, 'Birth date', $errors);
    if (!$isEdit && str($data['birthDate'] ?? null) === '') $errors[] = 'Birth date is required';
    $member['anniversaryDate'] = to_db_date($data['anniversaryDate'] ?? null, 'Anniversary date', $errors);

    $familyMembers = [];
    foreach (array_values($data['familyMembers']) as $sortOrder => $r) {
        $row = ['sortOrder' => $sortOrder, 'name' => str(field($r, 'name')), 'relation' => str(field($r, 'relation')), 'mobile' => str(field($r, 'mobile'))];
        $row['dob'] = to_db_date(field($r, 'dob'), 'Family member date of birth', $errors);
        if (!in_array($row['relation'], RELATIONS, true)) $errors[] = 'Invalid family member relation';
        if ($row['mobile'] !== '' && !preg_match(MOBILE_RE, $row['mobile'])) $errors[] = 'Family member mobile must be 10 digits';
        $familyMembers[] = $row;
    }

    if (!$isEdit && count($data['nominees']) < 1) $errors[] = 'At least one nominee is required';
    $nominees = [];
    foreach (array_values($data['nominees']) as $sortOrder => $r) {
        $row = ['sortOrder' => $sortOrder, 'name' => str(field($r, 'name')), 'relation' => str(field($r, 'relation')), 'mobile' => str(field($r, 'mobile'))];
        if ($row['name'] === '') $errors[] = 'Nominee name is required';
        if (!in_array($row['relation'], RELATIONS, true)) $errors[] = 'Invalid nominee relation';
        if ($row['mobile'] === '') {
            if (!$isEdit) $errors[] = 'Nominee mobile is required';
        } elseif (!preg_match(MOBILE_RE, $row['mobile'])) $errors[] = 'Nominee mobile must be 10 digits';
        $nominees[] = $row;
    }

    $referrals = [];
    foreach (array_values($data['referrals']) as $sortOrder => $r) {
        $row = ['sortOrder' => $sortOrder, 'name' => str(field($r, 'name')), 'mobile' => str(field($r, 'mobile'))];
        if ($row['mobile'] !== '' && !preg_match(MOBILE_RE, $row['mobile'])) $errors[] = 'Referral mobile must be 10 digits';
        $referrals[] = $row;
    }

    // Ek hi message multiple rows se repeat na ho
    return [array_values(array_unique($errors)), $member, $familyMembers, $nominees, $referrals];
}
