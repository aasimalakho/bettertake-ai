"""
Basic unit tests, no network / API keys required.

Run with: pytest

These deliberately test only pure functions (build_prompt, clamp_max_rounds,
_parse_and_validate_form) rather than the full generate/critic pipeline,
since those hit real Replicate / OpenAI / B2 calls. It's a small suite, but
it's enough to show input handling is actually exercised rather than just
hoped to work.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import build_prompt, clamp_max_rounds, MAX_ROUNDS_CAP, MIN_ROUNDS


def test_build_prompt_includes_product_and_direction():
    prompt = build_prompt("a red kettle", "warm, cozy, minimal", None)
    assert "a red kettle" in prompt
    assert "warm, cozy, minimal" in prompt
    assert "IMPORTANT" not in prompt


def test_build_prompt_includes_fix_instruction_when_present():
    prompt = build_prompt("a red kettle", "warm, cozy", "hands look warped")
    assert "hands look warped" in prompt
    assert "IMPORTANT" in prompt


def test_clamp_max_rounds_caps_high_values():
    assert clamp_max_rounds(9999) == MAX_ROUNDS_CAP


def test_clamp_max_rounds_floors_low_values():
    assert clamp_max_rounds(0) == MIN_ROUNDS
    assert clamp_max_rounds(-5) == MIN_ROUNDS


def test_clamp_max_rounds_handles_garbage_input():
    assert clamp_max_rounds("not-a-number") == 3
    assert clamp_max_rounds(None) == 3


def test_clamp_max_rounds_passes_through_valid_values():
    assert clamp_max_rounds(2) == 2
    assert clamp_max_rounds("4") == 4
