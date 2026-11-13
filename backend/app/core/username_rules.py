"""Rules for public usernames.

Usernames are the one piece of user content that goes public without admin
review (leaderboard, submission history), so App Review guideline 1.2 applies:
filter objectionable names and block impersonation of the app or its staff.

Deliberately small and conservative: substring matching only for terms that
essentially never appear inside real names, and whole-token matching for
shorter words (so "Dickson", "Cockburn", "Scunthorpe" and "classic" are fine).
Admins can still deactivate users for anything this misses.
"""

import re

USERNAME_MIN = 3
USERNAME_MAX = 30
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9_.]+$")

RESERVED = frozenset(
    {
        "admin", "administrator", "goldenhour", "golden_hour", "golden.hour",
        "gldnhr", "support", "help", "moderator", "mod", "official", "staff",
        "team", "root", "system", "null", "undefined", "deleted",
    }
)

# Blocked anywhere in the (normalized) name.
_SUBSTRING_TERMS = (
    "fuck", "shit", "nigg", "faggot", "whore", "porn", "rapist", "kkk",
)
# Blocked only as a whole token (split on _ . and digits).
_TOKEN_TERMS = frozenset(
    {"cunt", "bitch", "slut", "dick", "cock", "pussy", "fag", "nazi", "rape", "hitler", "ass"}
)

_LEET = str.maketrans({"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s"})


def _normalized(name: str) -> str:
    return name.lower().translate(_LEET)


def username_problem(name: str) -> str | None:
    """Return a user-facing reason the username is not allowed, or None."""
    if not (USERNAME_MIN <= len(name) <= USERNAME_MAX):
        return f"Username must be {USERNAME_MIN}–{USERNAME_MAX} characters"
    if not USERNAME_PATTERN.match(name):
        return "Username can only contain letters, numbers, underscores and periods"

    lowered = name.lower()
    squashed = re.sub(r"[_.]", "", lowered)
    if lowered in RESERVED or squashed in RESERVED or squashed.startswith("goldenhour") or squashed.startswith("gldnhr"):
        return "That username is reserved"

    norm = _normalized(name)
    joined = re.sub(r"[_.]", "", norm)
    if any(t in joined for t in _SUBSTRING_TERMS):
        return "Please choose a different username"
    tokens = {t for t in re.split(r"[_.\d]+", lowered) if t} | {t for t in re.split(r"[_.]+", norm) if t}
    if tokens & _TOKEN_TERMS:
        return "Please choose a different username"
    return None
