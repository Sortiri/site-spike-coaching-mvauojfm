# Forms & leads (built in)

No payload to copy: the template already ships the `leads` table,
`site:submitLead`, and the lead-form block renderer. Installing the
catalog entry only flips the spec flag. To email the coach on each lead,
set `LEAD_NOTIFY_EMAIL` on the site's Convex deployment; notification
sending is wired by the control plane when a mail provider is configured.
