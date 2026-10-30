<?php

const DASHBOARD_LIST_SIZE = 5;

// Sabse nazdeek ke UPCOMING events (jo abhi khatam nahi hue), participant counts ke saath
function get_upcoming_events(): array
{
    $events = query(
        "SELECT id, eventName, venue, startDateTime, endDateTime, status FROM events
         WHERE status = 'UPCOMING' AND endDateTime >= ? ORDER BY startDateTime ASC LIMIT " . DASHBOARD_LIST_SIZE,
        [db_datetime(now_utc())]
    )->fetchAll();

    $counts = participant_counts(array_column($events, 'id'));
    return array_map(fn($e) => [...$e, 'counts' => $counts[$e['id']]], $events);
}

// GET /api/dashboard  ->  { stats, upcomingEvents (max 5), importantDates (max 5) }
function get_dashboard(): void
{
    try {
        $stats = member_stats();
        $upcomingEvents = get_upcoming_events();
        // range "all": aaj se aage ki nazdeeki dates, daysUntil ke hisaab se sorted
        [$importantDates] = query_important_dates(1, DASHBOARD_LIST_SIZE, 'all');

        json_response(200, [
            'success' => true,
            'stats' => $stats,
            'upcomingEvents' => to_api($upcomingEvents),
            'importantDates' => $importantDates,
        ]);
    } catch (Throwable $e) {
        error_log('getDashboard failed: ' . $e->getMessage());
        fail(500, 'Server error');
    }
}
