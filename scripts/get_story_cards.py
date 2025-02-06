#!/usr/bin/env python3

import json
import argparse
import requests
from typing import List, TypedDict, cast
import os
from dotenv import load_dotenv

from models import StoryCard

class Scenario(TypedDict):
    id: str
    shortId: str
    title: str
    parentScenarioId: str
    deletedAt: str | None
    __typename: str

GRAPHQL_QUERY = """
query ScenarioStartViewGetScenario($shortId: String) {
  scenario(shortId: $shortId) {
    id
    type
    prompt
    shortId
    image
    parentScenarioId
    deletedAt
    memory
    authorsNote
    options {
      id
      shortId
      title
      parentScenarioId
      deletedAt
      __typename
    }
    storyCards {
      id
      type
      keys
      value
      title
      useForCharacterCreation
      description
      updatedAt
      deletedAt
      __typename
    }
    __typename
  }
}
"""

def get_story_cards(shortId: str, auth_token: str, endpoint: str = "https://api.aidungeon.com/graphql") -> List[StoryCard]:
    """Fetch story cards for a given scenario shortId."""
    headers = {
        "authorization": auth_token
    }

    response = requests.post(
        endpoint,
        headers=headers,
        json={
            "operationName": "ScenarioStartViewGetScenario",
            "variables": {"shortId": shortId},
            "query": GRAPHQL_QUERY,
        },
    )
    response.raise_for_status()

    data = response.json()
    story_cards = data.get("data", {}).get("scenario", {}).get("storyCards", [])
    return cast(List[StoryCard], story_cards)

def main() -> None:
    # Load environment variables
    load_dotenv()

    auth_token = os.getenv("AI_DUNGEON_TOKEN")
    if not auth_token:
        raise ValueError("AI_DUNGEON_TOKEN not found in .env file")

    parser = argparse.ArgumentParser(description="Fetch story cards from AI Dungeon scenarios")
    parser.add_argument("input", help="Input JSON file containing list of scenario shortIds")
    parser.add_argument("output", help="Output JSON file for story cards")
    parser.add_argument(
        "--endpoint",
        default="https://api.aidungeon.com/graphql",
        help="GraphQL API endpoint URL",
    )

    args = parser.parse_args()

    # Read scenarios from input file
    with open(args.input, "r", encoding="utf-8") as f:
        scenarios = cast(List[Scenario], json.load(f))

    # Fetch and accumulate all story cards
    all_story_cards: List[StoryCard] = []
    for scenario in scenarios:
        try:
            cards = get_story_cards(scenario["shortId"], auth_token, args.endpoint)
            all_story_cards.extend(cards)
            print(f"Retrieved {len(cards)} cards for scenario {scenario['shortId']}")
        except Exception as e:
            print(f"Error fetching cards for {scenario['shortId']}: {e}")

    # Save story cards to JSON file
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(all_story_cards, f, indent=4)

    print(f"Saved {len(all_story_cards)} story cards to {args.output}")

if __name__ == "__main__":
    main()
