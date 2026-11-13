"""
Regression lock for [Revert-Rejected]: rejecting a submission requires a
non-empty admin note, because the submitter sees it as the rejection reason.
Approving never requires one.
"""

import pytest
from pydantic import ValidationError

from app.schemas.submission import ReviewAction


@pytest.mark.parametrize("notes", [None, "", "   ", "\n\t"])
def test_reject_without_meaningful_notes_is_invalid(notes):
    with pytest.raises(ValidationError, match="admin_notes is required"):
        ReviewAction(status="rejected", admin_notes=notes)


def test_reject_with_notes_is_valid():
    action = ReviewAction(status="rejected", admin_notes="Bar closed in 2025")
    assert action.admin_notes == "Bar closed in 2025"


@pytest.mark.parametrize("notes", [None, ""])
def test_approve_does_not_require_notes(notes):
    assert ReviewAction(status="approved", admin_notes=notes).status == "approved"
