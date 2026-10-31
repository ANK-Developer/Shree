<?php

const EVENT_STATUSES = ['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED'];
const PARTICIPATION_STATUSES = ['ACCEPTED', 'REJECTED', 'NOT_CONFIRMED'];
const CALL_STATUSES = ['PENDING', 'ANSWERED', 'NOT_ANSWERED', 'BUSY', 'FAILED'];

// eventBanner yahan nahi: wo text field nahi, uploaded file se aata hai
const EVENT_FIELDS = ['eventName', 'description', 'status', 'venue', 'startDateTime', 'endDateTime'];

function pick_event_fields(array $body): array
{
    $data = [];
    foreach (EVENT_FIELDS as $key) {
        if (array_key_exists($key, $body)) $data[$key] = is_string($body[$key]) ? str($body[$key]) : $body[$key];
    }
    return $data;
}

// data = poora event (create: picked fields, update: purana + naya)
// return: [errors, data] jisme dates DateTimeImmutable ban chuki hoti hain
function validate_event(array $input): array
{
    $errors = [];
    $data = [...$input, 'status' => ($input['status'] ?? null) ?: 'UPCOMING'];

    $text = function (string $key, string $label, int $max) use (&$data, &$errors) {
        $data[$key] = str($data[$key] ?? null);
        if ($data[$key] === '') $errors[] = "$label is required";
        elseif (mb_strlen($data[$key]) > $max) $errors[] = "$label must be at most $max characters";
    };
    $date = function (string $key, string $label) use (&$data, &$errors) {
        if (empty($data[$key])) return $errors[] = "$label is required";
        $d = parse_js_date($data[$key]);
        if (!$d) return $errors[] = "$label is invalid";
        $data[$key] = $d;
    };

    $text('eventName', 'Event name', 150);
    $text('description', 'Description', 5000);
    $text('venue', 'Venue', 300);
    if (!in_array($data['status'], EVENT_STATUSES, true)) $errors[] = 'Invalid event status';
    $date('startDateTime', 'Start date and time');
    $date('endDateTime', 'End date and time');

    if ($data['startDateTime'] instanceof DateTimeImmutable && $data['endDateTime'] instanceof DateTimeImmutable
        && $data['endDateTime'] <= $data['startDateTime']) {
        $errors[] = 'End date and time must be after start date and time';
    }
    return [$errors, $data];
}

function find_event(string $id): ?array
{
    return is_valid_id($id) ? (query('SELECT * FROM events WHERE id = ?', [$id])->fetch() ?: null) : null;
}

// Event ke participant counts: [eventId => { total, ACCEPTED, REJECTED, NOT_CONFIRMED }]
function participant_counts(array $eventIds): array
{
    $map = [];
    foreach ($eventIds as $id) $map[$id] = ['total' => 0, 'ACCEPTED' => 0, 'REJECTED' => 0, 'NOT_CONFIRMED' => 0];
    if (!$eventIds) return $map;

    $in = implode(',', array_fill(0, count($eventIds), '?'));
    $rows = query(
        "SELECT eventId, participationStatus, COUNT(*) AS c FROM event_participants WHERE eventId IN ($in) GROUP BY eventId, participationStatus",
        $eventIds
    )->fetchAll();

    foreach ($rows as $r) {
        $map[$r['eventId']][$r['participationStatus']] = (int) $r['c'];
        $map[$r['eventId']]['total'] += (int) $r['c'];
    }
    return $map;
}

// Jo ACTIVE members is event me abhi tak nahi hain unko add karta hai. Unique key (eventId+memberId) + INSERT IGNORE
// ki wajah se parallel/repeat call par bhi duplicate nahi banta.
function add_missing_participants(string $eventId): int
{
    $now = db_datetime(now_utc());
    return query(
        "INSERT IGNORE INTO event_participants (id, eventId, memberId, participationStatus, callCount, registeredAt, createdAt, updatedAt)
         SELECT UUID(), ?, m.id, 'NOT_CONFIRMED', 0, ?, ?, ? FROM members m
         WHERE m.memberStatus = 'ACTIVE' AND NOT EXISTS (SELECT 1 FROM event_participants p WHERE p.eventId = ? AND p.memberId = m.id)",
        [$eventId, $now, $now, $now, $eventId]
    )->rowCount();
}

// POST /api/events
function create_event(array $user): void
{
    $eventBanner = handle_image_upload('events', 'eventBanner', 'Banner');
    try {
        [$errors, $data] = validate_event(pick_event_fields(body()));
        if ($errors) {
            remove_uploaded_file($eventBanner); // fail hui to orphan file na rahe
            fail(400, implode(', ', $errors));
        }

        $id = uuid4();
        $now = db_datetime(now_utc());
        query(
            'INSERT INTO events (id, eventBanner, eventName, description, status, venue, startDateTime, endDateTime, createdBy, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [$id, $eventBanner, $data['eventName'], $data['description'], $data['status'], $data['venue'],
                db_datetime($data['startDateTime']), db_datetime($data['endDateTime']), $user['id'], $now, $now]
        );
        $participants = add_missing_participants($id);

        json_response(201, ['success' => true, 'message' => 'Event created successfully', 'event' => to_api(find_event($id)), 'participants' => $participants]);
    } catch (Throwable $e) {
        remove_uploaded_file($eventBanner);
        handle_error($e, 'createEvent');
    }
}

// GET /api/events?status=&search=&page=&limit=
function get_events(): void
{
    try {
        [$page, $limit] = page_params();
        $status = strtoupper(query_param('status'));
        $search = str(query_param('search'));

        $conditions = [];
        $params = [];
        if (in_array($status, EVENT_STATUSES, true)) {
            $conditions[] = 'status = ?';
            $params[] = $status;
        }
        if ($search !== '') {
            $conditions[] = 'eventName LIKE ?';
            $params[] = like($search);
        }
        $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

        $events = query("SELECT * FROM events $where ORDER BY startDateTime DESC LIMIT $limit OFFSET " . (($page - 1) * $limit), $params)->fetchAll();
        $total = (int) query("SELECT COUNT(*) FROM events $where", $params)->fetchColumn();

        $counts = participant_counts(array_column($events, 'id'));
        $list = array_map(fn($e) => [...$e, 'counts' => $counts[$e['id']]], $events);

        json_response(200, ['success' => true, 'events' => to_api($list), 'pagination' => paginate($page, $limit, $total)]);
    } catch (Throwable $e) {
        handle_error($e, 'getEvents');
    }
}

// GET /api/events/:id  -> event + participant counts (createdBy: { _id, name })
function get_event_by_id(string $id): void
{
    try {
        $event = find_event($id);
        if (!$event) fail(404, 'Event not found');

        $creator = query('SELECT id, name FROM users WHERE id = ?', [$event['createdBy']])->fetch() ?: null;
        $counts = participant_counts([$event['id']]);
        json_response(200, ['success' => true, 'event' => to_api([...$event, 'createdBy' => $creator, 'counts' => $counts[$event['id']]])]);
    } catch (Throwable $e) {
        handle_error($e, 'getEventById');
    }
}

// PUT /api/events/:id  (multipart: fields + optional eventBanner file; removeBanner=true se banner hatta sakte hain)
function update_event(string $id): void
{
    $newBanner = handle_image_upload('events', 'eventBanner', 'Banner');
    try {
        $existing = find_event($id);
        if (!$existing) {
            remove_uploaded_file($newBanner);
            fail(404, 'Event not found');
        }

        // Purane + naye fields ko saath me validate karte hain (endDateTime > startDateTime)
        $merged = [];
        foreach (EVENT_FIELDS as $key) $merged[$key] = $existing[$key];
        $merged['startDateTime'] = new DateTimeImmutable($existing['startDateTime'], new DateTimeZone('UTC'));
        $merged['endDateTime'] = new DateTimeImmutable($existing['endDateTime'], new DateTimeZone('UTC'));

        [$errors, $data] = validate_event([...$merged, ...pick_event_fields(body())]);
        if ($errors) {
            remove_uploaded_file($newBanner);
            fail(400, implode(', ', $errors));
        }

        $oldBanner = $existing['eventBanner'];
        $eventBanner = $oldBanner;
        if ($newBanner) $eventBanner = $newBanner;
        elseif (input('removeBanner') === 'true') $eventBanner = null;

        query(
            'UPDATE events SET eventBanner = ?, eventName = ?, description = ?, status = ?, venue = ?, startDateTime = ?, endDateTime = ?, updatedAt = ? WHERE id = ?',
            [$eventBanner, $data['eventName'], $data['description'], $data['status'], $data['venue'],
                db_datetime($data['startDateTime']), db_datetime($data['endDateTime']), db_datetime(now_utc()), $existing['id']]
        );

        // Purani file tabhi hatate hain jab DB update successful ho chuka ho
        if ($oldBanner && $oldBanner !== $eventBanner) remove_uploaded_file($oldBanner);

        json_response(200, ['success' => true, 'message' => 'Event updated successfully', 'event' => to_api(find_event($existing['id']))]);
    } catch (Throwable $e) {
        remove_uploaded_file($newBanner);
        handle_error($e, 'updateEvent');
    }
}

// PATCH /api/events/:id/status  { status }
function update_event_status(string $id): void
{
    try {
        $status = input('status');
        if (!in_array($status, EVENT_STATUSES, true)) fail(400, 'Invalid event status');
        if (!find_event($id)) fail(404, 'Event not found');

        query('UPDATE events SET status = ?, updatedAt = ? WHERE id = ?', [$status, db_datetime(now_utc()), $id]);
        json_response(200, ['success' => true, 'message' => 'Event status updated', 'event' => to_api(find_event($id))]);
    } catch (Throwable $e) {
        handle_error($e, 'updateEventStatus');
    }
}

// DELETE /api/events/:id  (participants aur unke call logs DB cascade se hat jate hain)
function delete_event(string $id): void
{
    try {
        $event = find_event($id);
        if (!$event) fail(404, 'Event not found');

        query('DELETE FROM events WHERE id = ?', [$event['id']]);
        remove_uploaded_file($event['eventBanner']);

        json_response(200, ['success' => true, 'message' => 'Event deleted successfully']);
    } catch (Throwable $e) {
        handle_error($e, 'deleteEvent');
    }
}

// POST /api/events/:id/sync-participants  (event ke baad join hue ACTIVE members ko add karta hai)
function sync_participants(string $id): void
{
    try {
        if (!find_event($id)) fail(404, 'Event not found');
        $added = add_missing_participants($id);
        json_response(200, ['success' => true, 'message' => $added ? "$added new member(s) added" : 'Already up to date', 'added' => $added]);
    } catch (Throwable $e) {
        handle_error($e, 'syncParticipants');
    }
}

// GET /api/events/:id/participants?status=&search=&page=&limit=
function get_participants(string $id): void
{
    try {
        if (!is_valid_id($id)) fail(404, 'Event not found');

        [$page, $limit] = page_params();
        $status = strtoupper(query_param('status'));
        $search = str(query_param('search'));

        $conditions = ['p.eventId = ?'];
        $params = [$id];
        if (in_array($status, PARTICIPATION_STATUSES, true)) {
            $conditions[] = 'p.participationStatus = ?';
            $params[] = $status;
        }
        if ($search !== '') {
            $conditions[] = '(m.name LIKE ? OR m.surname LIKE ? OR m.mobileNumber LIKE ?)';
            array_push($params, like($search), like($search), like($search));
        }
        $where = 'WHERE ' . implode(' AND ', $conditions);

        $rows = query(
            "SELECT p.id, p.participationStatus, p.callCount, p.lastCalledAt, p.lastCallStatus,
                    m.id AS m_id, m.photoUrl, m.name, m.surname, m.mobileNumber, m.memberType, m.memberStatus
             FROM event_participants p JOIN members m ON m.id = p.memberId
             $where ORDER BY m.name ASC, p.id ASC LIMIT $limit OFFSET " . (($page - 1) * $limit),
            $params
        )->fetchAll();
        $total = (int) query("SELECT COUNT(*) FROM event_participants p JOIN members m ON m.id = p.memberId $where", $params)->fetchColumn();

        $participants = array_map(fn($r) => [
            'id' => $r['id'],
            'participationStatus' => $r['participationStatus'],
            'callCount' => (int) $r['callCount'],
            'lastCalledAt' => $r['lastCalledAt'],
            'lastCallStatus' => $r['lastCallStatus'],
            'member' => [
                'id' => $r['m_id'],
                'photoUrl' => $r['photoUrl'],
                'name' => $r['name'],
                'surname' => $r['surname'],
                'mobileNumber' => $r['mobileNumber'],
                'memberType' => $r['memberType'],
                'memberStatus' => $r['memberStatus'],
            ],
        ], $rows);

        json_response(200, ['success' => true, 'participants' => to_api($participants), 'pagination' => paginate($page, $limit, $total)]);
    } catch (Throwable $e) {
        handle_error($e, 'getParticipants');
    }
}

// Participant us event ka hi hai ya nahi (URL tampering se doosre event ka participant na chhua jaye)
function find_participant(string $eventId, string $participantId): ?array
{
    if (!is_valid_id($eventId) || !is_valid_id($participantId)) return null;
    return query('SELECT * FROM event_participants WHERE id = ? AND eventId = ?', [$participantId, $eventId])->fetch() ?: null;
}

function find_participant_by_id(string $id): array
{
    return query('SELECT * FROM event_participants WHERE id = ?', [$id])->fetch();
}

// PATCH /api/events/:id/participants/:participantId  { participationStatus }
function update_participant_status(string $id, string $participantId): void
{
    try {
        $participationStatus = input('participationStatus');
        if (!in_array($participationStatus, PARTICIPATION_STATUSES, true)) fail(400, 'Invalid participation status');

        $found = find_participant($id, $participantId);
        if (!$found) fail(404, 'Participant not found');

        query('UPDATE event_participants SET participationStatus = ?, updatedAt = ? WHERE id = ?', [$participationStatus, db_datetime(now_utc()), $found['id']]);

        json_response(200, ['success' => true, 'message' => 'Participation status updated', 'participant' => to_api(find_participant_by_id($found['id']))]);
    } catch (Throwable $e) {
        handle_error($e, 'updateParticipantStatus');
    }
}

// POST /api/events/:id/participants/:participantId/calls  { callStatus, callResponse, participationStatus?, calledAt? }
// Ek hi request me call log + (optional) participation status update
function add_call(array $user, string $id, string $participantId): void
{
    try {
        $callStatus = input('callStatus');
        $callResponse = input('callResponse');
        $participationStatus = input('participationStatus');
        $calledAt = input('calledAt');

        if (!in_array($callStatus, CALL_STATUSES, true)) fail(400, 'Invalid call status');
        if ($participationStatus && !in_array($participationStatus, PARTICIPATION_STATUSES, true)) fail(400, 'Invalid participation status');

        $calledAtDate = now_utc();
        if ($calledAt) {
            $calledAtDate = parse_js_date($calledAt);
            if (!$calledAtDate || $calledAtDate > now_utc()->modify('+60 seconds')) fail(400, 'Call time cannot be in the future');
        }

        $response = is_string($callResponse) && str($callResponse) !== '' ? str($callResponse) : null;
        if ($response !== null && mb_strlen($response) > 1000) fail(400, 'Call response must be at most 1000 characters');

        $participant = find_participant($id, $participantId);
        if (!$participant) fail(404, 'Participant not found');

        // Call + summary ek transaction me; lastCalledAt sirf tab badalta hai jab ye call sabse naya ho (purani call backfill ho sakti hai)
        $pdo = db();
        $pdo->beginTransaction();
        try {
            $callId = uuid4();
            $now = db_datetime(now_utc());
            query(
                'INSERT INTO event_calls (id, eventParticipantId, callStatus, callResponse, calledAt, calledBy, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [$callId, $participant['id'], $callStatus, $response, db_datetime($calledAtDate), $user['id'], $now, $now]
            );

            $latest = query(
                'SELECT calledAt, callStatus FROM event_calls WHERE eventParticipantId = ? ORDER BY calledAt DESC, createdAt DESC LIMIT 1',
                [$participant['id']]
            )->fetch();

            $sql = 'UPDATE event_participants SET callCount = callCount + 1, lastCalledAt = ?, lastCallStatus = ?, updatedAt = ?';
            $params = [$latest['calledAt'], $latest['callStatus'], $now];
            if ($participationStatus) {
                $sql .= ', participationStatus = ?';
                $params[] = $participationStatus;
            }
            $params[] = $participant['id'];
            query("$sql WHERE id = ?", $params);

            $call = query('SELECT * FROM event_calls WHERE id = ?', [$callId])->fetch();
            $updated = find_participant_by_id($participant['id']);
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }

        json_response(201, ['success' => true, 'message' => 'Call logged successfully', 'call' => to_api($call), 'participant' => to_api($updated)]);
    } catch (Throwable $e) {
        handle_error($e, 'addCall');
    }
}

// GET /api/events/:id/participants/:participantId/calls  -> poori call history (latest first), calledBy: { _id, name }
function get_calls(string $id, string $participantId): void
{
    try {
        $participant = find_participant($id, $participantId);
        if (!$participant) fail(404, 'Participant not found');

        $rows = query(
            'SELECT c.*, u.name AS callerName FROM event_calls c LEFT JOIN users u ON u.id = c.calledBy
             WHERE c.eventParticipantId = ? ORDER BY c.calledAt DESC, c.createdAt DESC',
            [$participant['id']]
        )->fetchAll();

        $calls = array_map(function ($c) {
            $caller = $c['calledBy'] !== null && $c['callerName'] !== null ? ['id' => $c['calledBy'], 'name' => $c['callerName']] : null;
            unset($c['callerName']);
            return [...$c, 'calledBy' => $caller];
        }, $rows);

        json_response(200, ['success' => true, 'calls' => to_api($calls), 'participant' => to_api($participant)]);
    } catch (Throwable $e) {
        handle_error($e, 'getCalls');
    }
}

function handle_error(Throwable $e, string $label): never
{
    log_error("$label failed", $e);
    fail(500, 'Server error (ref: ' . request_id() . ')');
}
