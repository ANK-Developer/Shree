<?php

const MEMBER_STATUSES = ['ACTIVE', 'INACTIVE'];

// Public form se sirf yehi fields accept hote hain (memberStatus jaise fields client se nahi aate)
const PERSONAL_FIELDS = [
    'name', 'fatherHusbandName', 'surname', 'memberType', 'bloodGroup', 'aadharNumber',
    'occupation', 'address', 'pincode', 'mobileNumber', 'email', 'birthDate',
];

// List/table me itne hi fields chahiye
const MEMBER_LIST_COLUMNS = 'm.id, m.photoUrl, m.name, m.surname, m.mobileNumber, m.memberType, m.memberStatus, m.createdAt';

// multipart form me arrays JSON string ban kar aate hain. Galat data par null.
function parse_list(mixed $value): ?array
{
    if ($value === null || $value === '') return [];
    if (is_string($value)) {
        $parsed = json_decode($value);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($parsed)) return null;
        return json_decode($value, true);
    }
    return is_array($value) && array_is_list($value) ? $value : null;
}

function is_blank_row(mixed $row): bool
{
    foreach ((is_array($row) ? $row : [$row]) as $v) {
        if (str(is_array($v) ? '[object Object]' : $v) !== '') return false;
    }
    return true;
}

// [sql, params] name/mobile search ke liye
function member_search_filter(string $search): array
{
    return $search !== '' ? ['(m.name LIKE ? OR m.mobileNumber LIKE ?)', [like($search), like($search)]] : [null, []];
}

// Member + uske child rows (form ke order me, bina memberId/sortOrder ke)
function find_member_full(string $id): ?array
{
    $member = query('SELECT * FROM members WHERE id = ?', [$id])->fetch();
    if (!$member) return null;

    $member['familyMembers'] = query('SELECT id, name, relation, dob, mobile FROM family_members WHERE memberId = ? ORDER BY sortOrder ASC', [$id])->fetchAll();
    $member['nominees'] = query('SELECT id, name, relation, mobile FROM nominees WHERE memberId = ? ORDER BY sortOrder ASC', [$id])->fetchAll();
    $member['referrals'] = query('SELECT id, name, mobile FROM referrals WHERE memberId = ? ORDER BY sortOrder ASC', [$id])->fetchAll();
    return $member;
}

// POST /api/members  (public membership form)
function create_member(): void
{
    $photoUrl = handle_image_upload('members', 'photo', 'Photo');
    try {
        $familyMembers = parse_list(input('familyMembers'));
        $nominees = parse_list(input('nominees'));
        $referrals = parse_list(input('referrals'));
        if ($familyMembers === null || $nominees === null || $referrals === null) {
            remove_uploaded_file($photoUrl);
            fail(400, 'Invalid family, nominee or referral data');
        }

        $data = [];
        foreach (PERSONAL_FIELDS as $key) $data[$key] = input($key);
        $data['anniversaryDate'] = input('anniversaryDate') ?: null;
        $data['familyMembers'] = array_values(array_filter($familyMembers, fn($r) => !is_blank_row($r)));
        $data['nominees'] = $nominees;
        $data['referrals'] = array_values(array_filter($referrals, fn($r) => !is_blank_row($r)));
        $data['photoUrl'] = $photoUrl ?? '';

        [$errors, $member, $family, $noms, $refs] = validate_member($data);
        if ($errors) {
            remove_uploaded_file($photoUrl); // validation fail hui to uploaded photo orphan na rahe
            fail(400, implode(', ', $errors));
        }

        // Member + uske family/nominee/referral rows ek hi transaction me
        $id = uuid4();
        $now = db_datetime(now_utc());
        $pdo = db();
        $pdo->beginTransaction();
        try {
            query(
                'INSERT INTO members (id, photoUrl, name, fatherHusbandName, surname, memberType, bloodGroup, aadharNumber, occupation, address,
                    pincode, mobileNumber, email, birthDate, anniversaryDate, memberStatus, createdAt, updatedAt)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, \'ACTIVE\', ?, ?)',
                [
                    $id, $member['photoUrl'], $member['name'], $member['fatherHusbandName'], $member['surname'], $member['memberType'],
                    $member['bloodGroup'], $member['aadharNumber'], $member['occupation'], $member['address'], $member['pincode'],
                    $member['mobileNumber'], $member['email'], $member['birthDate'], $member['anniversaryDate'], $now, $now,
                ]
            );
            foreach ($family as $r) {
                query('INSERT INTO family_members (id, memberId, sortOrder, name, relation, dob, mobile) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [uuid4(), $id, $r['sortOrder'], $r['name'], $r['relation'], $r['dob'], $r['mobile']]);
            }
            foreach ($noms as $r) {
                query('INSERT INTO nominees (id, memberId, sortOrder, name, relation, mobile) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuid4(), $id, $r['sortOrder'], $r['name'], $r['relation'], $r['mobile']]);
            }
            foreach ($refs as $r) {
                query('INSERT INTO referrals (id, memberId, sortOrder, name, mobile) VALUES (?, ?, ?, ?, ?)',
                    [uuid4(), $id, $r['sortOrder'], $r['name'], $r['mobile']]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        json_response(201, [
            'success' => true,
            'message' => 'Membership form submitted successfully',
            'member' => ['_id' => $id, 'name' => $member['name']],
        ]);
    } catch (Throwable $e) {
        remove_uploaded_file($photoUrl);
        if (is_duplicate_error($e)) fail(409, 'This mobile number is already registered');
        error_log('createMember failed: ' . $e->getMessage());
        fail(500, 'Server error');
    }
}

// Members ki paginated list (getMembers aur getReferredMembers dono ke liye)
function member_list_response(array $conditions, array $params): never
{
    [$page, $limit] = page_params();
    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $members = query(
        'SELECT ' . MEMBER_LIST_COLUMNS . " FROM members m $where ORDER BY m.createdAt DESC LIMIT $limit OFFSET " . (($page - 1) * $limit),
        $params
    )->fetchAll();
    $total = (int) query("SELECT COUNT(*) FROM members m $where", $params)->fetchColumn();

    json_response(200, ['success' => true, 'members' => to_api($members), 'pagination' => paginate($page, $limit, $total)]);
}

// GET /api/members?page=&limit=&search=&status=
function get_members(): void
{
    $status = strtoupper(query_param('status'));
    [$searchSql, $params] = member_search_filter(str(query_param('search')));

    $conditions = $searchSql ? [$searchSql] : [];
    if (in_array($status, MEMBER_STATUSES, true)) {
        $conditions[] = 'm.memberStatus = ?';
        $params[] = $status;
    }
    member_list_response($conditions, $params);
}

// Member counts: { total, active, inactive }  (dashboard bhi yahi use karta hai)
function member_stats(): array
{
    $byStatus = query('SELECT memberStatus, COUNT(*) AS c FROM members GROUP BY memberStatus')->fetchAll(PDO::FETCH_KEY_PAIR);
    $active = (int) ($byStatus['ACTIVE'] ?? 0);
    $inactive = (int) ($byStatus['INACTIVE'] ?? 0);
    return ['total' => $active + $inactive, 'active' => $active, 'inactive' => $inactive];
}

// GET /api/members/stats  (filters/search se independent: total, active, inactive)
function get_member_stats(): void
{
    json_response(200, ['success' => true, 'stats' => member_stats()]);
}

// Jin members ne is member ka mobile number "referrer mobile" me diya hai, unhe isne refer kiya hai
function referred_filter(array $member): array
{
    return [
        'EXISTS (SELECT 1 FROM referrals r WHERE r.memberId = m.id AND r.mobile = ?) AND m.id <> ?',
        [$member['mobileNumber'], $member['id']],
    ];
}

// GET /api/members/:id
function get_member_by_id(string $id): void
{
    if (!is_valid_id($id)) fail(400, 'Invalid member id');
    $member = find_member_full($id);
    if (!$member) fail(404, 'Member not found');

    [$sql, $params] = referred_filter($member);
    $referredCount = (int) query("SELECT COUNT(*) FROM members m WHERE $sql", $params)->fetchColumn();

    json_response(200, ['success' => true, 'member' => to_api($member), 'referredCount' => $referredCount]);
}

// GET /api/members/:id/referred?page=&limit=&search=   (is member ne jinhe refer kiya)
function get_referred_members(string $id): void
{
    if (!is_valid_id($id)) fail(400, 'Invalid member id');
    $member = query('SELECT id, mobileNumber FROM members WHERE id = ?', [$id])->fetch();
    if (!$member) fail(404, 'Member not found');

    [$refSql, $params] = referred_filter($member);
    [$searchSql, $searchParams] = member_search_filter(str(query_param('search')));

    $conditions = [$refSql];
    if ($searchSql) $conditions[] = $searchSql;
    member_list_response($conditions, [...$params, ...$searchParams]);
}

// PATCH /api/members/:id/status  body: { memberStatus: "ACTIVE" | "INACTIVE" }
function update_member_status(string $id): void
{
    $memberStatus = input('memberStatus');

    if (!is_valid_id($id)) fail(400, 'Invalid member id');
    if (!in_array($memberStatus, MEMBER_STATUSES, true)) fail(400, 'memberStatus must be ACTIVE or INACTIVE');

    $count = query('UPDATE members SET memberStatus = ?, updatedAt = ? WHERE id = ?', [$memberStatus, db_datetime(now_utc()), $id])->rowCount();
    if ($count === 0) fail(404, 'Member not found');

    json_response(200, [
        'success' => true,
        'message' => 'Member ' . ($memberStatus === 'ACTIVE' ? 'activated' : 'deactivated') . ' successfully',
        'member' => to_api(find_member_full($id)),
    ]);
}

// PUT /api/members/:id  (multipart: create jaisi fields + optional photo; removePhoto=true se photo hata sakte hain)
function update_member(string $id): void
{
    $newPhoto = handle_image_upload('members', 'photo', 'Photo');
    try {
        $existing = is_valid_id($id) ? (query('SELECT * FROM members WHERE id = ?', [$id])->fetch() ?: null) : null;
        if (!$existing) {
            remove_uploaded_file($newPhoto);
            fail(404, 'Member not found');
        }

        $familyMembers = parse_list(input('familyMembers'));
        $nominees = parse_list(input('nominees'));
        $referrals = parse_list(input('referrals'));
        if ($familyMembers === null || $nominees === null || $referrals === null) {
            remove_uploaded_file($newPhoto);
            fail(400, 'Invalid family, nominee or referral data');
        }

        $oldPhoto = $existing['photoUrl'];
        $photoUrl = $newPhoto ?? (input('removePhoto') === 'true' ? '' : $oldPhoto);

        $data = [];
        foreach (PERSONAL_FIELDS as $key) $data[$key] = input($key);
        $data['anniversaryDate'] = input('anniversaryDate') ?: null;
        $data['familyMembers'] = array_values(array_filter($familyMembers, fn($r) => !is_blank_row($r)));
        $data['nominees'] = array_values(array_filter($nominees, fn($r) => !is_blank_row($r)));
        $data['referrals'] = array_values(array_filter($referrals, fn($r) => !is_blank_row($r)));
        $data['photoUrl'] = $photoUrl;

        [$errors, $member, $family, $noms, $refs] = validate_member($data, true);
        if ($errors) {
            remove_uploaded_file($newPhoto);
            fail(400, implode(', ', $errors));
        }

        // Mobile number kisi doosre member ka na ho (khud ka same number rakhna theek hai)
        if (query('SELECT id FROM members WHERE mobileNumber = ? AND id <> ?', [$member['mobileNumber'], $id])->fetch()) {
            remove_uploaded_file($newPhoto);
            fail(409, 'This mobile number is already registered');
        }

        $pdo = db();
        $pdo->beginTransaction();
        try {
            query(
                'UPDATE members SET photoUrl = ?, name = ?, fatherHusbandName = ?, surname = ?, memberType = ?, bloodGroup = ?, aadharNumber = ?,
                    occupation = ?, address = ?, pincode = ?, mobileNumber = ?, email = ?, birthDate = ?, anniversaryDate = ?, updatedAt = ? WHERE id = ?',
                [
                    $member['photoUrl'], $member['name'], $member['fatherHusbandName'], $member['surname'], $member['memberType'],
                    $member['bloodGroup'], $member['aadharNumber'], $member['occupation'], $member['address'], $member['pincode'],
                    $member['mobileNumber'], $member['email'], $member['birthDate'], $member['anniversaryDate'], db_datetime(now_utc()), $id,
                ]
            );
            // Child rows form ke naye order me dobara likhe jate hain
            foreach (['family_members', 'nominees', 'referrals'] as $table) query("DELETE FROM $table WHERE memberId = ?", [$id]);
            foreach ($family as $r) {
                query('INSERT INTO family_members (id, memberId, sortOrder, name, relation, dob, mobile) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [uuid4(), $id, $r['sortOrder'], $r['name'], $r['relation'], $r['dob'], $r['mobile']]);
            }
            foreach ($noms as $r) {
                query('INSERT INTO nominees (id, memberId, sortOrder, name, relation, mobile) VALUES (?, ?, ?, ?, ?, ?)',
                    [uuid4(), $id, $r['sortOrder'], $r['name'], $r['relation'], $r['mobile']]);
            }
            foreach ($refs as $r) {
                query('INSERT INTO referrals (id, memberId, sortOrder, name, mobile) VALUES (?, ?, ?, ?, ?)',
                    [uuid4(), $id, $r['sortOrder'], $r['name'], $r['mobile']]);
            }
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        // Purani photo tabhi hatate hain jab DB update successful ho chuka ho
        if ($oldPhoto && $oldPhoto !== $photoUrl) remove_uploaded_file($oldPhoto);

        json_response(200, ['success' => true, 'message' => 'Member updated successfully', 'member' => to_api(find_member_full($id))]);
    } catch (Throwable $e) {
        remove_uploaded_file($newPhoto);
        if (is_duplicate_error($e)) fail(409, 'This mobile number is already registered');
        error_log('updateMember failed: ' . $e->getMessage());
        fail(500, 'Server error');
    }
}
