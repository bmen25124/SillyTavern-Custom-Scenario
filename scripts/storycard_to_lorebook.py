### Converts story cards(AI Dungeon) to lorebook(SillyTavern) format.
### Usage: python storycard_to_lorebook.py input.json output.json --remove-braces --description-in-comment --prevent-recursion="type:character" --exclude-recursion="type:character"

import json
import argparse


def convert_story_cards_to_lorebook(
    story_cards,
    remove_braces=False,
    description_in_comment=False,
    exclude_recursion=None,
    prevent_recursion=None,
):
    lorebook = {"entries": {}}

    # Parse recursion rules
    def parse_recursion_rule(rule_str):
        if not rule_str:
            return None
        rules = []
        for rule in rule_str.split(","):
            if ":" in rule:
                field, value = rule.split(":", 1)
                rules.append((field.strip(), value.strip()))
        return rules

    exclude_rules = parse_recursion_rule(exclude_recursion)
    prevent_rules = parse_recursion_rule(prevent_recursion)

    # Check if card matches any rules
    def matches_rules(card, rules):
        if not rules:
            return False
        for field, value in rules:
            if field in card and str(card[field]) == value:
                return True
        return False

    for index, card in enumerate(story_cards):
        # Split keys string into list and trim each key
        keys = [key.strip() for key in card["keys"].split(",")] if card["keys"] else []

        # Handle value text
        content = card["value"]
        if remove_braces:
            if content.startswith("{") and content.endswith("}"):
                content = content[1:-1]

        # Handle comment
        comment = card["title"]
        if description_in_comment and card["description"]:
            comment = f"{card['title']} ({card['description'].strip()})"

        # Create lorebook entry
        entry = {
            "uid": index,
            "key": keys,
            "keysecondary": [],
            "comment": comment,
            "content": content,
            "constant": False,
            "vectorized": False,
            "selective": True,
            "selectiveLogic": 0,
            "addMemo": True,
            "order": 100,
            "position": 4,
            "disable": False,
            "excludeRecursion": matches_rules(card, exclude_rules),
            "preventRecursion": matches_rules(card, prevent_rules),
            "delayUntilRecursion": False,
            "probability": 100,
            "useProbability": True,
            "depth": 0,
            "group": "",
            "groupOverride": False,
            "groupWeight": 100,
            "scanDepth": None,
            "caseSensitive": None,
            "matchWholeWords": None,
            "useGroupScoring": None,
            "automationId": "",
            "role": 0,
            "sticky": 0,
            "cooldown": 0,
            "delay": 0,
            "displayIndex": 0,
        }

        lorebook["entries"][str(index)] = entry

    return lorebook


def main():
    parser = argparse.ArgumentParser(
        description="Convert story cards to lorebook format"
    )
    parser.add_argument("input", help="Input story cards JSON file")
    parser.add_argument("output", help="Output lorebook JSON file")
    parser.add_argument(
        "--remove-braces", action="store_true", help="Remove curly braces from content"
    )
    parser.add_argument(
        "--description-in-comment",
        action="store_true",
        help="Include description in comment if available",
    )
    parser.add_argument(
        "--exclude-recursion",
        help="Set excludeRecursion for entries matching field:value pairs (comma-separated)",
    )
    parser.add_argument(
        "--prevent-recursion",
        help="Set preventRecursion for entries matching field:value pairs (comma-separated)",
    )

    args = parser.parse_args()

    # Read story cards from file
    with open(args.input, "r", encoding="utf-8") as f:
        story_cards = json.load(f)

    # Convert to lorebook format
    lorebook = convert_story_cards_to_lorebook(
        story_cards,
        args.remove_braces,
        args.description_in_comment,
        args.exclude_recursion,
        args.prevent_recursion,
    )

    # Save to file
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(lorebook, f, indent=4)


if __name__ == "__main__":
    main()
