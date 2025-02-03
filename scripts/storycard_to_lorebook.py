### Converts story cards(AI Dungeon) to lorebook(SillyTavern) format.
### Usage: python storycard_to_lorebook.py input.json output.json --remove-braces --description-in-comment

import json
import argparse


def convert_story_cards_to_lorebook(
    story_cards, remove_braces=False, description_in_comment=False
):
    lorebook = {"entries": {}}

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
            "position": 4,  # Fixed position to 4
            "disable": False,
            "excludeRecursion": False,
            "preventRecursion": False,
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
    # Set up argument parser
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

    args = parser.parse_args()

    # Read story cards from file
    with open(args.input, "r", encoding="utf-8") as f:
        story_cards = json.load(f)

    # Convert to lorebook format
    lorebook = convert_story_cards_to_lorebook(
        story_cards, args.remove_braces, args.description_in_comment
    )

    # Save to file
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(lorebook, f, indent=4)


if __name__ == "__main__":
    main()
