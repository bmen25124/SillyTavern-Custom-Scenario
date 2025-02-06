from typing import TypedDict, List, Dict, Optional

class Scenario(TypedDict):
    id: str
    shortId: str
    title: str
    parentScenarioId: str
    deletedAt: str | None
    __typename: str

class StoryCard(TypedDict, total=False):
    """Type definition for story card input format."""
    keys: str
    value: str
    title: str
    description: str
    type: str
    originalScenario: Scenario

class LoreBookEntry(TypedDict):
    """Type definition for lorebook entry format."""
    uid: int
    key: List[str]
    keysecondary: List[str]
    comment: str
    content: str
    constant: bool
    vectorized: bool
    selective: bool
    selectiveLogic: int
    addMemo: bool
    order: int
    position: int
    disable: bool
    excludeRecursion: bool
    preventRecursion: bool
    delayUntilRecursion: bool
    probability: int
    useProbability: bool
    depth: int
    group: str
    groupOverride: bool
    groupWeight: int
    scanDepth: Optional[int]
    caseSensitive: Optional[bool]
    matchWholeWords: Optional[bool]
    useGroupScoring: Optional[bool]
    automationId: str
    role: int
    sticky: int
    cooldown: int
    delay: int
    displayIndex: int

class LoreBook(TypedDict):
    """Type definition for the complete lorebook format."""
    entries: Dict[str, LoreBookEntry]

RecursionRule = List[tuple[str, str]]
