"""
Overnight happy hours: a row on day D with end <= start runs D start → D+1 end.
Exercises the real SQL clauses used by /deals/today and /deals/nearby
(active_now) against a small SQLite table.
"""

from datetime import datetime, time

import pytest
from sqlalchemy import Column, Integer, MetaData, String, Table, Time, create_engine, select

from app.services.schedule_window import is_overnight, live_now_clause, relevant_today_clause

MON, TUE, FRI, SAT, SUN = 0, 1, 4, 5, 6

ROWS = [
    # name,            day, start,       end
    ("fri_normal",     FRI, time(16, 0), time(19, 0)),
    ("fri_overnight",  FRI, time(22, 0), time(1, 0)),   # Fri 10pm → Sat 1am
    ("fri_to_midnight", FRI, time(21, 0), time(0, 0)),  # Fri 9pm → midnight
    ("sat_normal",     SAT, time(16, 0), time(19, 0)),
    ("sun_overnight",  SUN, time(23, 0), time(2, 0)),   # Sun 11pm → Mon 2am (week wrap)
]


@pytest.fixture(scope="module")
def table():
    eng = create_engine("sqlite://")
    md = MetaData()
    t = Table("s", md, Column("name", String), Column("day_of_week", Integer),
              Column("start_time", Time), Column("end_time", Time))
    md.create_all(eng)
    with eng.begin() as c:
        c.execute(t.insert(), [dict(zip(["name", "day_of_week", "start_time", "end_time"], r)) for r in ROWS])
    return eng, t


def _names(table, clause_fn, now):
    eng, t = table
    with eng.connect() as c:
        q = select(t.c.name).where(clause_fn(t.c.day_of_week, t.c.start_time, t.c.end_time, now))
        return {r[0] for r in c.execute(q)}


# 2026-11-13 is a Friday; 11-14 Saturday; 11-15 Sunday; 11-16 Monday.
FRI_8PM = datetime(2026, 11, 13, 20, 0)
FRI_930PM = datetime(2026, 11, 13, 21, 30)
FRI_11PM = datetime(2026, 11, 13, 23, 0)
SAT_0030 = datetime(2026, 11, 14, 0, 30)
SAT_0100 = datetime(2026, 11, 14, 1, 0)
SAT_5PM = datetime(2026, 11, 14, 17, 0)
FRI_0030 = datetime(2026, 11, 13, 0, 30)
MON_0130 = datetime(2026, 11, 16, 1, 30)


def test_is_overnight():
    assert is_overnight(time(22), time(1)) and is_overnight(time(21), time(0))
    assert not is_overnight(time(16), time(19))


@pytest.mark.parametrize("now,expected", [
    (FRI_8PM, set()),                                   # 4-7 is over; 9pm/10pm not started
    (FRI_930PM, {"fri_to_midnight"}),
    (FRI_11PM, {"fri_overnight", "fri_to_midnight"}),   # before midnight
    (SAT_0030, {"fri_overnight"}),                      # after midnight: yesterday's row
    (SAT_0100, set()),                                  # end is exclusive
    (SAT_5PM, {"sat_normal"}),
    (FRI_0030, set()),                                  # Fri's overnight hasn't started yet
    (MON_0130, {"sun_overnight"}),                      # Sunday → Monday wrap
])
def test_live_now(table, now, expected):
    assert _names(table, live_now_clause, now) == expected


@pytest.mark.parametrize("now,expected", [
    # During Friday: every Friday row is on today's list.
    (FRI_8PM, {"fri_normal", "fri_overnight", "fri_to_midnight"}),
    # 12:30am Saturday: Saturday's rows, plus Friday's overnight still running.
    (SAT_0030, {"sat_normal", "fri_overnight"}),
    # 5pm Saturday: Friday's overnight ended at 1am, so it drops off.
    (SAT_5PM, {"sat_normal"}),
    (MON_0130, {"sun_overnight"}),
])
def test_relevant_today(table, now, expected):
    assert _names(table, relevant_today_clause, now) == expected
