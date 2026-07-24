# My vision for how Events are to be handled

## Overall Purpose

Events are meant to highlight things that are both one-off and recurring. Refer to the vision of this app: in short, we are building something where somebody can quickly check what's going on in the community in terms of local restaurants and bars.

Events are to be categorized by one of two things. 

1. Weekly or monthly recurring events which bring reason to go to the venue
* examples include Trivia, Karaoke, Game Nights, Watching a TV Show like the Bachelor/Bachelorette, Dueling Pianos, Country Nights, Dance Classes
2. One-off events which are slightly less predictable but still brings people together
* Titos promotional event, Gameday Special for the Whiteout Game, FIFA World Cup matchday specials, Cafe 210 Day, Collabs, Latin Night, DJ Battles, Battle of the Bands

Ultimately, some of these events have deals associated to them, and that is something worth mentioning in my optinion.

## How Events should be handled in app

### Home Page

Embed events in the Home Page under a different color as well as associated deals. Pickles has country nights every Tuesday, so on a Tuesday in the home page, I want it to say that in the Pickles section maybe in a different color or like a little highlighted bar, but also want to show the Happy Hours. So maybe it looks something like

| Bar Name | {EVENT} \n [Happy Hour Deals] |

Where {EVENT} is highlighted to pop out, \n is a paragraph indent, and [Happy Hour Deals] is the list of deals

Something of that nature

### Map Page

No effect

### Calendar Page

The calendar page should have two buttons at the top, one saying EVENTS and the other saying HAPPY HOURS.

Clicking the EVENTS button will show the EVENTS calendar which should be visually much less aggressive than the Happy Hour calendar. Events by nature are significantly less frequent thus this calendar should be more visually appealing.

Events calendar to be the DEFAULT calendar for users.

Happy Hour calendar still to exist tucked under the Happy Hour button

### Contribution Page

Will need to add a "ADD EVENT" button using similar style as it currently exists. So dropdown menu for bar name. Instead of picking a day of the week, they pick a calendar date (On second thought, the Add Deal Day should also have that and then an option to like make recurring so it auto-updates to every Thursday... idk provide thoughts. Should definitely be on ADD EVENT tho). Name of Event. Deals Associated to it (add existing deal vs new deal). And maybe a "Is this recurring" button with a frequency filter.

### Admin Page

This is where things get **funky**

If I learn that a bar is hosting deals for every home football game or if a bar is hosting events for a specific thing, I want to be able to add those in the backend of things before someone even gets the chance to submit something. Yes, I admit, I am actively preventing easy points. But if I see a schedule for all upcoming latin nights at Bar Bai on instagram, I want to be able to add that to the database before people can get points for it. If I get beat then oh well I get beat. But if not then let me be part of the crowdsource. 

## Bar Pages

When you click a bar, should show Events in the same vein as the Home Page. Different color banner, still immersed, maybe have an Upcoming Events tab and flex future events down the road like a Latin Night coming up within the week.

## Table Schema 

Table Schema TBD. Whatever makes sense, this is my initial thoughts.

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| id | UUID | No | auto | Primary key |
| venue_id | UUID (FK→venues) | No | | The bar hosting the event. Indexed. |
| name | VARCHAR(255) | No | | e.g. "UFC 300", "Eagles vs Cowboys", "World Cup: USA v England" |
| description | TEXT | Yes | | Free text: what's happening, who's playing |
| event_type | VARCHAR(50) | Yes | | `"ufc"` / `"nfl"` / `"cfb"` / `"fifa"` / `"nba"` / `"local"` / `"flex"` / `"other"`. Indexed. |
| start_datetime | TIMESTAMPTZ | No | | Actual date + time the event starts. Indexed. This is what the calendar sorts/filters on. |
| end_datetime | TIMESTAMPTZ | Yes | | When it ends. Nullable — some events have no clean end. |
| image_url | VARCHAR(500) | Yes | | Poster/flyer for the calendar card |
| is_sponsored | BOOLEAN | No | false | Bar-paid or brand-sponsored promotion flag (e.g. a tournament sponsor like Michelob Ultra/Stella Artois) — future monetization hook |
| active | BOOLEAN | No | true | Soft delete |
| verified | BOOLEAN | No | false | Admin-verified, same gate as deals |
| source | VARCHAR(50) | Yes | "manual" | `"import"` / `"manual"` / `"user"` |
| created_at | TIMESTAMPTZ | No | now() | |
| updated_at | TIMESTAMPTZ | No | now() | |

**CSV ref key:** `event_id` (e.g. `E001`) — maps to UUID on import, used as a join key for event-bound deals.