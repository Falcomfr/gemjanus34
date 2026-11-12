// The calendar subscription was removed at the association's request. Phones that
// subscribed still poll this address: an empty calendar clears the repeated activities.
const emptyCalendar = [
  "BEGIN:VCALENDAR",
  "VERSION:2.0",
  "PRODID:-//Janus34//Planning//FR",
  "X-WR-CALNAME:Planning Janus34",
  "END:VCALENDAR",
  "",
].join("\r\n");

export function GET(): Response {
  return new Response(emptyCalendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
