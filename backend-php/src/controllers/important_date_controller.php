<?php

const EVENT_TYPES = ['BIRTHDAY', 'ANNIVERSARY'];

// range -> aaj se kitne din ke andar (aaj = 0 din). "all" me koi limit nahi.
const RANGE_DAYS = ['today' => 0, 'next7' => 7, 'next30' => 30];

// Har member ke birthday aur anniversary ko alag-alag "event" ki tarah leta hai, har saal repeat hone wali
// agli date (nextDate) nikalta hai, aur aaj se din ka antar (daysUntil) ke hisaab se filter + sort karta hai.
// Dashboard aur Important Dates page dono isi query ko use karte hain.
// Filters already normalized hone chahiye (range valid key, type/status uppercase, search trimmed).
function query_important_dates(int $page = 1, int $limit = 10, string $range = 'all', string $type = '', string $status = '', string $search = ''): array
{
    // Dates DB me DATE hain, isliye "aaj" (server ke timezone me) ko bhi UTC midnight bana kar compare karte hain
    $year = (int) date('Y');
    $today = gmmktime(0, 0, 0, (int) date('n'), (int) date('j'), $year);

    $conditions = [];
    $params = [];
    if (in_array($status, MEMBER_STATUSES, true)) {
        $conditions[] = 'memberStatus = ?';
        $params[] = $status;
    }
    if ($search !== '') {
        $conditions[] = '(name LIKE ? OR mobileNumber LIKE ?)';
        array_push($params, like($search), like($search));
    }
    $where = $conditions ? 'WHERE ' . implode(' AND ', $conditions) : '';

    $members = query(
        "SELECT id, photoUrl, name, surname, mobileNumber, memberType, memberStatus, birthDate, anniversaryDate FROM members $where",
        $params
    )->fetchAll();

    $rows = [];
    foreach ($members as $m) {
        $events = ['BIRTHDAY' => $m['birthDate'], 'ANNIVERSARY' => $m['anniversaryDate']];

        foreach ($events as $eventType => $date) {
            // sirf wahi events jinki date bhari hai, aur type filter match kare
            if (!$date || (in_array($type, EVENT_TYPES, true) && $eventType !== $type)) continue;

            [$y, $month, $day] = array_map('intval', explode('-', $date));
            // Is saal ki date; wo nikal chuki ho to agle saal ki (29 Feb non-leap year me 1 Mar ban jata hai, pehle jaisa)
            $next = gmmktime(0, 0, 0, $month, $day, $year);
            if ($next < $today) $next = gmmktime(0, 0, 0, $month, $day, $year + 1);

            $daysUntil = (int) round(($next - $today) / 86400);
            if ($range !== 'all' && $daysUntil > RANGE_DAYS[$range]) continue;

            $rows[] = [
                'memberId' => $m['id'],
                'photoUrl' => $m['photoUrl'],
                'name' => $m['name'],
                'surname' => $m['surname'],
                'mobileNumber' => $m['mobileNumber'],
                'memberType' => $m['memberType'],
                'memberStatus' => $m['memberStatus'],
                'eventType' => $eventType,
                'nextDate' => gmdate('Y-m-d\T00:00:00.000\Z', $next),
                'daysUntil' => $daysUntil,
                'years' => (int) gmdate('Y', $next) - $y,
            ];
        }
    }

    usort($rows, fn($a, $b) => $a['daysUntil'] <=> $b['daysUntil'] ?: strcmp($a['name'], $b['name']) ?: strcmp($a['eventType'], $b['eventType']));

    return [array_slice($rows, ($page - 1) * $limit, $limit), count($rows)];
}

// GET /api/important-dates?range=today|next7|next30|all&type=&status=&search=&page=&limit=
function get_important_dates(): void
{
    try {
        [$page, $limit] = page_params();
        $range = array_key_exists(query_param('range'), RANGE_DAYS) ? query_param('range') : 'all';
        $type = strtoupper(query_param('type'));
        $status = strtoupper(query_param('status'));
        $search = str(query_param('search'));

        [$rows, $count] = query_important_dates($page, $limit, $range, $type, $status, $search);

        json_response(200, ['success' => true, 'dates' => $rows, 'pagination' => paginate($page, $limit, $count)]);
    } catch (Throwable $e) {
        error_log('getImportantDates failed: ' . $e->getMessage());
        fail(500, 'Server error');
    }
}
