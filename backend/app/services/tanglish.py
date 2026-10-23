import re
from typing import Dict, List, Tuple

# Comprehensive Universal Life Concept Taxonomy covering all 133 Chapters of Thirukkural
# Maps modern real-life scenarios, colloquial terms, English synonyms, and Tanglish phrases
# to classical Tamil chapters, keywords, and English equivalents.
CONCEPT_SYNONYMS: Dict[str, Tuple[List[str], List[str]]] = {
    # 1. Health, Diet, Food, Fitness, Medicine, Illness
    "health": (["மருந்து", "உடல்நலம்", "செரிமானம்"], ["medicine", "health", "food", "physic"]),
    "healthy": (["மருந்து", "உடல்நலம்"], ["medicine", "health", "food"]),
    "food": (["மருந்து", "உண்டி", "அளவறிந்து"], ["medicine", "food", "diet"]),
    "eat": (["மருந்து", "உண்டி", "அளவறிந்து"], ["medicine", "food", "eating"]),
    "eating": (["மருந்து", "உண்டி", "செரிமானம்"], ["medicine", "food", "diet"]),
    "diet": (["மருந்து", "உண்டி", "அளவறிந்து"], ["medicine", "diet", "food", "health"]),
    "fit": (["மருந்து", "உடல்நலம்"], ["medicine", "health", "physic"]),
    "fitness": (["மருந்து", "உடல்நலம்"], ["medicine", "health"]),
    "medicine": (["மருந்து", "நோய்"], ["medicine", "physic", "cure"]),
    "disease": (["மருந்து", "நோய்"], ["medicine", "disease", "illness"]),
    "sick": (["மருந்து", "நோய்"], ["medicine", "disease"]),
    "illness": (["மருந்து", "நோய்"], ["medicine", "disease"]),
    "digestion": (["மருந்து", "செரிமானம்", "உண்டி"], ["medicine", "digestion", "food"]),
    "sapadu": (["மருந்து", "உண்டி"], ["medicine", "food"]),
    "saapadu": (["மருந்து", "உண்டி"], ["medicine", "food"]),
    "udambu": (["மருந்து", "உடல்நலம்"], ["medicine", "health"]),
    "marundhu": (["மருந்து"], ["medicine"]),
    "உணவு": (["மருந்து", "உண்டி"], ["medicine", "food"]),
    "மருந்து": (["மருந்து", "நோய்"], ["medicine", "health"]),
    "உடல்நலம்": (["மருந்து"], ["medicine", "health"]),

    # 2. Procrastination, Laziness, Time Waste, Sluggishness
    "procrastinate": (["மடியின்மை", "மடி", "ஆள்வினை உடைமை"], ["unslothfulness", "against indolence", "sloth", "laziness", "manly effort"]),
    "procrastinating": (["மடியின்மை", "மடி", "காலந்தாழ்த்தல்"], ["unslothfulness", "against indolence", "sloth", "laziness"]),
    "procrastination": (["மடியின்மை", "மடி"], ["unslothfulness", "against indolence", "sloth"]),
    "lazy": (["மடியின்மை", "மடி", "சோம்பல்"], ["unslothfulness", "against indolence", "sloth", "idleness"]),
    "laziness": (["மடியின்மை", "மடி", "சோம்பல்"], ["unslothfulness", "against indolence", "sloth"]),
    "delay": (["மடியின்மை", "மடி", "காலந்தாழ்த்தல்"], ["unslothfulness", "delay"]),
    "sluggish": (["மடியின்மை", "மடி"], ["unslothfulness", "sloth"]),
    "sleep": (["மடியின்மை", "மடி"], ["unslothfulness", "sloth"]),
    "sombal": (["மடியின்மை", "மடி", "சோம்பல்"], ["unslothfulness", "sloth"]),
    "somberi": (["மடியின்மை", "மடி"], ["unslothfulness", "sloth"]),
    "சோம்பல்": (["மடியின்மை", "மடி"], ["unslothfulness", "sloth"]),
    "மடி": (["மடியின்மை", "மடி"], ["unslothfulness", "sloth"]),
    "மடியின்மை": (["மடியின்மை"], ["unslothfulness"]),

    # 3. Gossip, Backbiting, Slander, Talking Behind Back
    "gossip": (["புறங்கூறாமை", "புறங்கூறல்", "பயனில சொல்லாமை"], ["not backbiting", "backbiting", "slander", "against vain speaking"]),
    "gossiping": (["புறங்கூறாமை", "புறங்கூறல்"], ["not backbiting", "backbiting", "slander"]),
    "backbiting": (["புறங்கூறாமை", "புறங்கூறல்"], ["not backbiting", "backbiting"]),
    "rumor": (["புறங்கூறாமை", "புறங்கூறல்"], ["not backbiting", "rumors"]),
    "rumors": (["புறங்கூறாமை", "புறங்கூறல்"], ["not backbiting", "rumors"]),
    "slander": (["புறங்கூறாமை"], ["not backbiting", "slander"]),
    "behind": (["புறங்கூறாமை", "புறங்கூறல்"], ["not backbiting"]),
    "puram": (["புறங்கூறாமை"], ["not backbiting"]),
    "புறங்கூறாமை": (["புறங்கூறாமை"], ["not backbiting"]),
    "புறங்கூறல்": (["புறங்கூறாமை"], ["not backbiting"]),

    # 4. Money Management, Savings, Wealth, Debt, Expenses, Budget
    "money": (["வலி அறிதல்", "பொருள் செயல்வகை", "செல்வம்"], ["knowing power", "the acquisition of wealth", "wealth", "fortune"]),
    "save": (["வலி அறிதல்", "பொருள் செயல்வகை"], ["knowing power", "the acquisition of wealth", "saving"]),
    "savings": (["வலி அறிதல்", "பொருள் செயல்வகை"], ["knowing power", "the acquisition of wealth", "savings"]),
    "budget": (["வலி அறிதல்", "பொருள் செயல்வகை"], ["knowing power", "wealth", "budget"]),
    "debt": (["வலி அறிதல்", "நல்குரவு"], ["knowing power", "poverty", "debt"]),
    "finance": (["பொருள் செயல்வகை", "வலி அறிதல்"], ["the acquisition of wealth", "wealth"]),
    "spending": (["வலி அறிதல்", "செல்வம்"], ["knowing power", "expenses", "wealth"]),
    "expenses": (["வலி அறிதல்", "பொருள் செயல்வகை"], ["knowing power", "expenditure"]),
    "invest": (["பொருள் செயல்வகை", "தெரிந்து செயல்வகை"], ["the acquisition of wealth", "acting after due consideration"]),
    "selavu": (["வலி அறிதல்", "பொருள் செயல்வகை"], ["knowing power", "wealth"]),
    "kadan": (["வலி அறிதல்", "நல்குரவு"], ["knowing power", "poverty"]),
    "பணம்": (["பொருள் செயல்வகை", "வலி அறிதல்"], ["the acquisition of wealth", "wealth"]),
    "செல்வம்": (["பொருள் செயல்வகை", "செல்வம்"], ["the acquisition of wealth", "wealth"]),
    "சேமிப்பு": (["வலி அறிதல்", "பொருள் செயல்வகை"], ["knowing power", "wealth"]),

    # 5. Relationship Disputes, Partner Conflicts, Marriage Arguments, Lovers Variance
    "partner": (["வாழ்க்கைத் துணை நலம்", "ஊடலுவகை", "புல்லறிவாண்மை"], ["the worth of a wife", "the pleasures of temporary variance", "love"]),
    "spouse": (["வாழ்க்கைத் துணை நலம்", "ஊடலுவகை"], ["the worth of a wife", "the pleasures of temporary variance"]),
    "wife": (["வாழ்க்கைத் துணை நலம்", "இல்வாழ்க்கை"], ["the worth of a wife", "domestic life"]),
    "husband": (["வாழ்க்கைத் துணை நலம்", "இல்வாழ்க்கை"], ["the worth of a wife", "domestic life"]),
    "fight": (["ஊடலுவகை", "பொறையுடைமை", "இகல்"], ["the pleasures of temporary variance", "forbearance", "enmity"]),
    "fighting": (["ஊடலுவகை", "பொறையுடைமை", "இகல்"], ["the pleasures of temporary variance", "forbearance"]),
    "argument": (["ஊடலுவகை", "பொறையுடைமை"], ["the pleasures of temporary variance", "forbearance"]),
    "conflict": (["பொறையுடைமை", "இகல்", "ஊடலுவகை"], ["forbearance", "enmity", "reconciliation"]),
    "couples": (["வாழ்க்கைத் துணை நலம்", "ஊடலுவகை"], ["the worth of a wife", "love variance"]),
    "divorce": (["வாழ்க்கைத் துணை நலம்", "இல்வாழ்க்கை"], ["the worth of a wife", "domestic life"]),
    "reconciliation": (["ஊடலுவகை", "பொறையுடைமை"], ["the pleasures of temporary variance", "reconciliation"]),
    "sanda": (["ஊடலுவகை", "பொறையுடைமை"], ["the pleasures of temporary variance", "forbearance"]),
    "manaivi": (["வாழ்க்கைத் துணை நலம்"], ["the worth of a wife"]),
    "kanavan": (["வாழ்க்கைத் துணை நலம்"], ["the worth of a wife"]),
    "ஊடல்": (["ஊடலுவகை"], ["the pleasures of temporary variance"]),
    "மனைவி": (["வாழ்க்கைத் துணை நலம்"], ["the worth of a wife"]),
    "கணவன்": (["வாழ்க்கைத் துணை நலம்"], ["the worth of a wife"]),

    # 6. Insults, Humiliation, Trolls, Criticism, Bullying, Forbearance
    "insult": (["பொறையுடைமை", "அகழ்வாரைத் தாங்கும்", "இன்னா செய்யாமை"], ["the possession of forbearance", "forbearance", "not doing evil"]),
    "insulted": (["பொறையுடைமை", "இன்னா செய்யாமை"], ["the possession of forbearance", "forbearance", "patience"]),
    "insults": (["பொறையுடைமை", "இன்னா செய்யாமை"], ["the possession of forbearance", "patience"]),
    "humiliation": (["பொறையுடைமை", "மானம்"], ["the possession of forbearance", "honor"]),
    "humiliated": (["பொறையுடைமை", "மானம்"], ["the possession of forbearance", "honor"]),
    "mock": (["பொறையுடைமை", "இன்னா செய்யாமை"], ["the possession of forbearance"]),
    "mocked": (["பொறையுடைமை"], ["the possession of forbearance"]),
    "criticize": (["பொறையுடைமை", "குற்றங்கடிதல்"], ["the possession of forbearance", "correction of faults"]),
    "criticism": (["பொறையுடைமை", "குற்றங்கடிதல்"], ["the possession of forbearance", "correction of faults"]),
    "troll": (["பொறையுடைமை"], ["the possession of forbearance"]),
    "trolls": (["பொறையுடைமை"], ["the possession of forbearance"]),
    "bullying": (["பொறையுடைமை", "இன்னா செய்யாமை"], ["the possession of forbearance", "not doing evil"]),
    "avamanam": (["பொறையுடைமை", "மானம்"], ["the possession of forbearance", "honor"]),
    "பொறையுடைமை": (["பொறையுடைமை"], ["the possession of forbearance"]),
    "பொறுமை": (["பொறையுடைமை"], ["the possession of forbearance"]),
    "அவமானம்": (["பொறையுடைமை", "மானம்"], ["the possession of forbearance", "honor"]),

    # 7. Toxic Relatives, Bad Company, Fake Friends, Baseness
    "relatives": (["சுற்றந்தழால்", "தீ நட்பு", "கூடா நட்பு", "கயமை"], ["cherishing kin", "evil friendship", "false friendship", "baseness"]),
    "relative": (["சுற்றந்தழால்", "கூடா நட்பு"], ["cherishing kin", "false friendship"]),
    "toxic": (["தீ நட்பு", "கூடா நட்பு", "கயமை"], ["evil friendship", "unreal friendship", "baseness"]),
    "fake": (["கூடா நட்பு", "கூடா ஒழுக்கம்", "கயமை"], ["unreal friendship", "false conduct", "baseness"]),
    "betrayal": (["செய்ந்நன்றி கொன்றல்", "கூடா நட்பு"], ["the not knowing benefits", "unreal friendship"]),
    "betrayed": (["செய்ந்நன்றி கொன்றல்", "கூடா நட்பு", "பொறையுடைமை"], ["unreal friendship", "forbearance"]),
    "backstabber": (["கூடா நட்பு", "கயமை"], ["unreal friendship", "baseness"]),
    "snake": (["கூடா நட்பு"], ["unreal friendship"]),
    "thurogam": (["கூடா நட்பு", "செய்ந்நன்றி கொன்றல்"], ["unreal friendship"]),
    "kayamai": (["கயமை"], ["baseness"]),
    "கயமை": (["கயமை"], ["baseness"]),
    "உறவினர்கள்": (["சுற்றந்தழால்", "கூடா நட்பு"], ["cherishing kin", "false friendship"]),
    "சுற்றத்தார்": (["சுற்றந்தழால்"], ["cherishing kin"]),

    # 8. Stress, Anxiety, Loneliness, Depression, Mental Peace, Sorrow
    "stress": (["இடுக்கண் அழியாமை", "அவாவறுத்தல்", "மன அமைதி"], ["hope in misfortune", "not dreading adversity", "the extirpation of desire", "resilience"]),
    "stressful": (["இடுக்கண் அழியாமை", "அவாவறுத்தல்"], ["hope in misfortune", "not dreading adversity", "resilience"]),
    "anxiety": (["இடுக்கண் அழியாமை", "அவாவறுத்தல்", "அஞ்சாமை"], ["hope in misfortune", "not dreading adversity", "fearlessness"]),
    "anxious": (["இடுக்கண் அழியாமை", "அஞ்சாமை"], ["hope in misfortune", "fearlessness"]),
    "depression": (["இடுக்கண் அழியாமை", "துன்பம்", "ஊக்கமுடைமை"], ["hope in misfortune", "not dreading adversity", "energy", "resilience"]),
    "depressed": (["இடுக்கண் அழியாமை", "ஊக்கமுடைமை"], ["hope in misfortune", "not dreading adversity", "energy"]),
    "lonely": (["இடுக்கண் அழியாமை", "நட்பு", "துறவு"], ["hope in misfortune", "friendship", "renunciation"]),
    "loneliness": (["இடுக்கண் அழியாமை", "நட்பு"], ["hope in misfortune", "friendship"]),
    "sorrow": (["இடுக்கண் அழியாமை", "துன்பம்"], ["hope in misfortune", "not dreading adversity"]),
    "grief": (["இடுக்கண் அழியாமை", "துன்பம்"], ["hope in misfortune"]),
    "peace": (["மெய்யுணர்தல்", "அவாவறுத்தல்", "அடக்கமுடைமை"], ["the perception of truth", "extirpation of desire", "self-control"]),
    "kavalai": (["இடுக்கண் அழியாமை", "துன்பம்"], ["hope in misfortune"]),
    "kavala": (["இடுக்கண் அழியாமை", "துன்பம்"], ["hope in misfortune"]),
    "kashtam": (["இடுக்கண் அழியாமை", "துன்பம்", "ஆள்வினை உடைமை"], ["hope in misfortune", "not dreading adversity", "hardship", "adversity"]),
    "kashtathula": (["இடுக்கண் அழியாமை", "துன்பம்"], ["hope in misfortune", "adversity"]),
    "kashtama": (["இடுக்கண் அழியாமை", "துன்பம்"], ["hope in misfortune", "adversity"]),
    "azhugai": (["இடுக்கண் அழியாமை", "துன்பம்"], ["hope in misfortune"]),
    "azhuga": (["இடுக்கண் அழியாமை", "துன்பம்"], ["hope in misfortune"]),
    "thunbam": (["இடுக்கண் அழியாமை"], ["hope in misfortune"]),
    "துன்பம்": (["இடுக்கண் அழியாமை"], ["hope in misfortune"]),
    "இடுக்கண்": (["இடுக்கண் அழியாமை"], ["hope in misfortune"]),
    "இடுக்கண் அழியாமை": (["இடுக்கண் அழியாமை"], ["hope in misfortune"]),

    # 9. Jealousy & Envy
    "jealous": (["அழுக்காறாமை", "அழுக்காறு"], ["not envying", "freedom from envy", "envy"]),
    "jealousy": (["அழுக்காறாமை", "அழுக்காறு"], ["not envying", "freedom from envy", "envy"]),
    "envy": (["அழுக்காறாமை", "அழுக்காறு"], ["not envying", "freedom from envy"]),
    "envious": (["அழுக்காறாமை", "அழுக்காறு"], ["not envying", "freedom from envy"]),
    "compare": (["அழுக்காறாமை"], ["not envying"]),
    "comparing": (["அழுக்காறாமை"], ["not envying"]),
    "poramai": (["அழுக்காறாமை"], ["not envying"]),
    "பொறாமை": (["அழுக்காறாமை"], ["not envying"]),
    "அழுக்காறாமை": (["அழுக்காறாமை"], ["not envying"]),

    # 10. Greed, Bribery, Corruption, Not Coveting
    "greed": (["வெஃகாமை", "வெஃகல்", "அவாவறுத்தல்"], ["not coveting", "the extirpation of desire"]),
    "greedy": (["வெஃகாமை", "வெஃகல்"], ["not coveting"]),
    "covet": (["வெஃகாமை", "வெஃகல்"], ["not coveting"]),
    "coveting": (["வெஃகாமை"], ["not coveting"]),
    "bribe": (["வெஃகாமை", "வினைத்தூய்மை"], ["not coveting", "purity of action"]),
    "bribery": (["வெஃகாமை", "வினைத்தூய்மை"], ["not coveting", "purity of action"]),
    "corruption": (["வெஃகாமை", "செங்கோன்மை", "கொடுங்கோன்மை"], ["not coveting", "just government", "tyranny"]),
    "peraasai": (["வெஃகாமை"], ["not coveting"]),
    "வெஃகாமை": (["வெஃகாமை"], ["not coveting"]),
    "பேராசை": (["வெஃகாமை"], ["not coveting"]),

    # 11. Parenting, Children, Raising Kids
    "parent": (["மக்கட்பேறு", "பெற்றோர்"], ["the wealth of children", "children"]),
    "parenting": (["மக்கட்பேறு", "குழந்தைகள்"], ["the wealth of children", "children"]),
    "child": (["மக்கட்பேறு", "பிள்ளைகள்"], ["the wealth of children", "children"]),
    "children": (["மக்கட்பேறு", "பிள்ளைகள்", "மழலை"], ["the wealth of children", "children"]),
    "kids": (["மக்கட்பேறு", "குழந்தைகள்"], ["the wealth of children", "children"]),
    "son": (["மக்கட்பேறு"], ["the wealth of children"]),
    "daughter": (["மக்கட்பேறு"], ["the wealth of children"]),
    "raising": (["மக்கட்பேறு"], ["the wealth of children"]),
    "pillai": (["மக்கட்பேறு"], ["the wealth of children"]),
    "makkal": (["மக்கட்பேறு"], ["the wealth of children"]),
    "மக்கட்பேறு": (["மக்கட்பேறு"], ["the wealth of children"]),
    "குழந்தைகள்": (["மக்கட்பேறு"], ["the wealth of children"]),

    # 12. Communication, Sweet Speech, Eloquence, Pleasant Words
    "speak": (["இனியவை கூறல்", "சொல்வன்மை"], ["the utterance of pleasant words", "power of speech", "speech"]),
    "speaking": (["இனியவை கூறல்", "சொல்வன்மை"], ["the utterance of pleasant words", "power of speech"]),
    "speech": (["இனியவை கூறல்", "சொல்வன்மை", "அவையஞ்சாமை"], ["the utterance of pleasant words", "power of speech", "not dreading the council"]),
    "talk": (["இனியவை கூறல்", "பயனில சொல்லாமை"], ["the utterance of pleasant words", "against vain speaking"]),
    "words": (["இனியவை கூறல்", "சொல்வன்மை"], ["the utterance of pleasant words", "power of speech"]),
    "pleasant": (["இனியவை கூறல்", "இன்சொல்"], ["the utterance of pleasant words", "sweet words"]),
    "polite": (["இனியவை கூறல்", "பண்புடைமை"], ["the utterance of pleasant words", "the possession of courtesy"]),
    "eloquence": (["சொல்வன்மை"], ["power of speech"]),
    "interview": (["சொல்வன்மை", "அவையஞ்சாமை"], ["power of speech", "not dreading the council"]),
    "presentation": (["சொல்வன்மை", "அவையஞ்சாமை"], ["power of speech"]),
    "pesanum": (["இனியவை கூறல்"], ["the utterance of pleasant words"]),
    "pesuvadhu": (["இனியவை கூறல்"], ["the utterance of pleasant words"]),
    "இனியவை கூறல்": (["இனியவை கூறல்"], ["the utterance of pleasant words"]),
    "சொல்வன்மை": (["சொல்வன்மை"], ["power of speech"]),

    # 13. Karma, Fate, Destiny, Overcoming Destiny with Effort
    "karma": (["ஊழ்", "ஆள்வினை உடைமை", "விதி"], ["destiny", "fate", "manly effort"]),
    "fate": (["ஊழ்", "ஆள்வினை உடைமை", "விதி"], ["destiny", "fate", "manly effort"]),
    "destiny": (["ஊழ்", "ஆள்வினை உடைமை", "தெய்வத்தான்"], ["destiny", "fate", "manly effort"]),
    "luck": (["ஊழ்", "ஆள்வினை உடைமை"], ["destiny", "fate", "manly effort"]),
    "fortune": (["ஊழ்", "பொருள் செயல்வகை"], ["destiny", "wealth"]),
    "vidhi": (["ஊழ்", "ஆள்வினை உடைமை"], ["destiny", "manly effort"]),
    "ஊழ்": (["ஊழ்", "ஆள்வினை உடைமை"], ["destiny", "manly effort"]),
    "விதி": (["ஊழ்", "ஆள்வினை உடைமை"], ["destiny", "manly effort"]),

    # 14. Forgiveness, Revenge, Doing No Evil in Return
    "revenge": (["இன்னா செய்யாமை", "பொறையுடைமை", "பழி"], ["not doing evil", "forbearance"]),
    "avenge": (["இன்னா செய்யாமை", "பொறையுடைமை"], ["not doing evil", "forbearance"]),
    "forgive": (["பொறையுடைமை", "இன்னா செய்யாமை"], ["forbearance", "not doing evil"]),
    "forgiveness": (["பொறையுடைமை", "இன்னா செய்யாமை"], ["forbearance", "not doing evil"]),
    "pardon": (["பொறையுடைமை"], ["forbearance"]),
    "grudge": (["பொறையுடைமை", "இகல்"], ["forbearance", "enmity"]),
    "mannippu": (["பொறையுடைமை"], ["forbearance"]),
    "pali": (["இன்னா செய்யாமை"], ["not doing evil"]),
    "இன்னா செய்யாமை": (["இன்னா செய்யாமை"], ["not doing evil"]),
    "மன்னிப்பு": (["பொறையுடைமை"], ["forbearance"]),

    # 15. Leadership, Boss, Manager, Team Delegation, Governance
    "leader": (["இறைமாட்சி", "தெரிந்து வினையாடல்", "செங்கோன்மை"], ["the greatness of a king", "selection and employment", "just government"]),
    "leadership": (["இறைமாட்சி", "தெரிந்து வினையாடல்", "செங்கோன்மை"], ["the greatness of a king", "selection and employment", "just government"]),
    "boss": (["மன்னரைச் சேர்ந்தொழுகல்", "இறைமாட்சி", "தெரிந்து வினையாடல்"], ["acting in the presence of the king", "greatness of a king", "selection and employment"]),
    "manager": (["தெரிந்து வினையாடல்", "இறைமாட்சி"], ["selection and employment", "greatness of a king"]),
    "management": (["தெரிந்து வினையாடல்", "தெரிந்து செயல்வகை"], ["selection and employment", "acting after due consideration"]),
    "team": (["தெரிந்து வினையாடல்", "படைமாட்சி"], ["selection and employment", "excellence of an army"]),
    "hiring": (["தெரிந்து வினையாடல்", "தெரிந்து தெளிதல்"], ["selection and employment", "selection and confidence"]),
    "delegation": (["தெரிந்து வினையாடல்"], ["selection and employment"]),
    "governance": (["செங்கோன்மை", "இறைமாட்சி"], ["just government", "greatness of a king"]),
    "thalaivan": (["இறைமாட்சி"], ["the greatness of a king"]),
    "thalaivar": (["இறைமாட்சி"], ["the greatness of a king"]),
    "இறைமாட்சி": (["இறைமாட்சி"], ["the greatness of a king"]),
    "தெரிந்து வினையாடல்": (["தெரிந்து வினையாடல்"], ["selection and employment"]),

    # 16. Environment, Water, Rain, Nature, Climate
    "nature": (["வான்சிறப்பு", "நிலம்"], ["the blessing of rain", "nature"]),
    "water": (["வான்சிறப்பு", "நீரின்றி"], ["the blessing of rain", "water"]),
    "rain": (["வான்சிறப்பு", "மழை"], ["the blessing of rain", "rain"]),
    "climate": (["வான்சிறப்பு"], ["the blessing of rain"]),
    "drought": (["வான்சிறப்பு"], ["the blessing of rain"]),
    "mazhai": (["வான்சிறப்பு"], ["the blessing of rain"]),
    "thanni": (["வான்சிறப்பு"], ["the blessing of rain"]),
    "வான்சிறப்பு": (["வான்சிறப்பு"], ["the blessing of rain"]),
    "மழை": (["வான்சிறப்பு"], ["the blessing of rain"]),

    # 17. Addictions, Alcohol, Drinking, Gambling
    "alcohol": (["கள்ளுண்ணாமை", "சூது"], ["not drinking palm-wine", "gambling", "sobriety"]),
    "drinking": (["கள்ளுண்ணாமை"], ["not drinking palm-wine"]),
    "drink": (["கள்ளுண்ணாமை"], ["not drinking palm-wine"]),
    "drunk": (["கள்ளுண்ணாமை"], ["not drinking palm-wine"]),
    "wine": (["கள்ளுண்ணாமை"], ["not drinking palm-wine"]),
    "beer": (["கள்ளுண்ணாமை"], ["not drinking palm-wine"]),
    "drugs": (["கள்ளுண்ணாமை", "சூது"], ["not drinking palm-wine", "gambling"]),
    "addiction": (["கள்ளுண்ணாமை", "சூது"], ["not drinking palm-wine", "gambling"]),
    "gambling": (["சூது"], ["gambling"]),
    "betting": (["சூது"], ["gambling"]),
    "lottery": (["சூது"], ["gambling"]),
    "kudipazhakkam": (["கள்ளுண்ணாமை"], ["not drinking palm-wine"]),
    "soothu": (["சூது"], ["gambling"]),
    "கள்ளுண்ணாமை": (["கள்ளுண்ணாமை"], ["not drinking palm-wine"]),
    "சூது": (["சூது"], ["gambling"]),

    # 18. Time, Timing, Right Opportunity, Punctuality
    "time": (["காலமறிதல்", "பருவம்"], ["knowing the fitting time", "time", "opportunity"]),
    "timing": (["காலமறிதல்", "பருவம்"], ["knowing the fitting time", "opportunity"]),
    "opportunity": (["காலமறிதல்", "தெரிந்து செயல்வகை"], ["knowing the fitting time", "acting after due consideration"]),
    "moment": (["காலமறிதல்"], ["knowing the fitting time"]),
    "kaalam": (["காலமறிதல்"], ["knowing the fitting time"]),
    "neram": (["காலமறிதல்"], ["knowing the fitting time"]),
    "காலமறிதல்": (["காலமறிதல்"], ["knowing the fitting time"]),

    # 19. Gratitude, Thankfulness, Remembering Help
    "gratitude": (["செய்ந்நன்றி அறிதல்", "நன்றி"], ["the knowledge of benefits", "gratitude", "thankfulness"]),
    "grateful": (["செய்ந்நன்றி அறிதல்", "நன்றி"], ["the knowledge of benefits", "gratitude"]),
    "thank": (["செய்ந்நன்றி அறிதல்"], ["the knowledge of benefits"]),
    "thanks": (["செய்ந்நன்றி அறிதல்"], ["the knowledge of benefits"]),
    "thankful": (["செய்ந்நன்றி அறிதல்"], ["the knowledge of benefits"]),
    "thankfulness": (["செய்ந்நன்றி அறிதல்"], ["the knowledge of benefits"]),
    "ungrateful": (["செய்ந்நன்றி அறிதல்", "செய்ந்நன்றி கொன்றல்"], ["the knowledge of benefits"]),
    "favor": (["செய்ந்நன்றி அறிதல்", "உதவி"], ["the knowledge of benefits"]),
    "nandri": (["செய்ந்நன்றி அறிதல்"], ["the knowledge of benefits"]),
    "செய்ந்நன்றி அறிதல்": (["செய்ந்நன்றி அறிதல்"], ["the knowledge of benefits"]),

    # 20. Wisdom, Truth, Discernment, AI, Science, Real vs Fake
    "wisdom": (["அறிவுடைமை", "மெய்யுணர்தல்", "கல்வி"], ["the possession of knowledge", "the perception of truth", "learning"]),
    "discernment": (["அறிவுடைமை", "மெய்யுணர்தல்"], ["the possession of knowledge", "perception of truth"]),
    "truth": (["வாய்மை", "மெய்யுணர்தல்"], ["truthfulness", "veracity", "perception of truth"]),
    "honest": (["வாய்மை", "நடுவுநிலைமை"], ["truthfulness", "impartiality"]),
    "honesty": (["வாய்மை", "நடுவுநிலைமை"], ["truthfulness", "impartiality"]),
    "lie": (["வாய்மை", "தீவினையச்சம்"], ["truthfulness", "dread of evil deeds"]),
    "lying": (["வாய்மை"], ["truthfulness"]),
    "technology": (["அறிவுடைமை", "மெய்யுணர்தல்"], ["the possession of knowledge", "perception of truth"]),
    "ai": (["அறிவுடைமை", "மெய்யுணர்தல்"], ["the possession of knowledge", "perception of truth"]),
    "artificial": (["அறிவுடைமை"], ["the possession of knowledge"]),
    "science": (["மெய்யுணர்தல்", "அறிவுடைமை"], ["the perception of truth", "knowledge"]),
    "unmai": (["வாய்மை"], ["truthfulness"]),
    "arivu": (["அறிவுடைமை"], ["the possession of knowledge"]),
    "வாய்மை": (["வாய்மை"], ["truthfulness"]),
    "அறிவுடைமை": (["அறிவுடைமை"], ["the possession of knowledge"]),
    "மெய்யுணர்தல்": (["மெய்யுணர்தல்"], ["the perception of truth"]),

    # 21. Success, Hard Work, Effort, Perseverance, Failure
    "success": (["ஆள்வினை உடைமை", "ஊக்கமுடைமை", "முயற்சி"], ["manly effort", "energy", "effort", "perseverance", "industry"]),
    "succeed": (["ஆள்வினை உடைமை", "ஊக்கமுடைமை"], ["manly effort", "energy", "effort"]),
    "failure": (["இடுக்கண் அழியாமை", "தோல்வி", "தளர்ச்சி"], ["hope in misfortune", "not dreading adversity", "resilience"]),
    "effort": (["ஆள்வினை உடைமை", "ஊக்கமுடைமை", "முயற்சிதன்"], ["manly effort", "energy", "effort", "perseverance"]),
    "perseverance": (["ஆள்வினை உடைமை", "ஊக்கமுடைமை"], ["manly effort", "energy", "effort"]),
    "hardwork": (["ஆள்வினை உடைமை", "ஊக்கமுடைமை"], ["manly effort", "energy", "effort"]),
    "work": (["ஆள்வினை உடைமை", "வினை செயல்வகை"], ["manly effort", "modes of action"]),
    "overcome": (["இடுக்கண் அழியாமை", "ஆள்வினை உடைமை"], ["hope in misfortune", "manly effort"]),
    "vetri": (["ஆள்வினை உடைமை", "ஊக்கமுடைமை"], ["manly effort", "energy"]),
    "tholvi": (["இடுக்கண் அழியாமை"], ["hope in misfortune"]),
    "muyarchi": (["ஆள்வினை உடைமை", "முயற்சி"], ["manly effort", "effort"]),
    "வெற்றி": (["ஆள்வினை உடைமை", "ஊக்கமுடைமை"], ["manly effort", "energy"]),
    "தோல்வி": (["இடுக்கண் அழியாமை"], ["hope in misfortune"]),
    "முயற்சி": (["ஆள்வினை உடைமை", "ஊக்கமுடைமை"], ["manly effort", "energy"]),
    "ஆள்வினை உடைமை": (["ஆள்வினை உடைமை"], ["manly effort"]),

    # 22. Anger, Temper, Patience, Self-Restraint
    "anger": (["வெகுளாமை", "சினம்", "பொறையுடைமை"], ["restraining anger", "anger", "forbearance"]),
    "angry": (["வெகுளாமை", "சினம்"], ["restraining anger", "anger"]),
    "rage": (["வெகுளாமை", "சினம்"], ["restraining anger", "anger"]),
    "temper": (["வெகுளாமை", "சினம்", "அடக்கமுடைமை"], ["restraining anger", "self-control"]),
    "patience": (["பொறையுடைமை", "அடக்கமுடைமை"], ["forbearance", "self-control"]),
    "kovam": (["வெகுளாமை", "சினம்"], ["restraining anger", "anger"]),
    "kovatha": (["வெகுளாமை", "சினம்", "பொறையுடைமை"], ["restraining anger", "anger", "forbearance"]),
    "kobam": (["வெகுளாமை", "சினம்"], ["restraining anger", "anger"]),
    "kopam": (["வெகுளாமை", "சினம்"], ["restraining anger", "anger"]),
    "sinam": (["வெகுளாமை", "சினம்"], ["restraining anger"]),
    "porumai": (["பொறையுடைமை"], ["forbearance"]),
    "கோபம்": (["வெகுளாமை", "சினம்"], ["restraining anger", "anger"]),
    "கோபத்தை": (["வெகுளாமை", "சினம்"], ["restraining anger", "anger"]),
    "சினம்": (["வெகுளாமை", "சினம்"], ["restraining anger"]),
    "வெகுளாமை": (["வெகுளாமை"], ["restraining anger"]),

    # 23. Friendship, Companions, Vetting Friends
    "friend": (["நட்பு", "நட்பாராய்தல்", "பழைமை"], ["friendship", "investigation in forming friendships", "familiarity"]),
    "friends": (["நட்பு", "நட்பாராய்தல்", "பழைமை", "தீ நட்பு"], ["friendship", "investigation in forming friendships", "evil friendship"]),
    "friendship": (["நட்பு", "நட்பாராய்தல்", "கூடா நட்பு"], ["friendship", "investigation in forming friendships"]),
    "companion": (["நட்பு", "நட்பாராய்தல்"], ["friendship", "investigation in forming friendships"]),
    "companions": (["நட்பு", "நட்பாராய்தல்"], ["friendship"]),
    "nanban": (["நட்பு", "நட்பாராய்தல்"], ["friendship"]),
    "nanbargal": (["நட்பு", "நட்பாராய்தல்"], ["friendship"]),
    "natpu": (["நட்பு", "நட்பாராய்தல்"], ["friendship"]),
    "நண்பன்": (["நட்பு", "நட்பாராய்தல்"], ["friendship"]),
    "நண்பர்கள்": (["நட்பு", "நட்பாராய்தல்"], ["friendship"]),
    "நண்பர்களை": (["நட்பு", "நட்பாராய்தல்"], ["friendship"]),
    "நட்பு": (["நட்பு", "நட்பாராய்தல்"], ["friendship"]),

    # 24. Education, Learning, Study
    "education": (["கல்வி", "கல்லாமை", "கேள்வி", "அறிவுடைமை"], ["learning", "ignorance", "hearing", "the possession of knowledge"]),
    "learning": (["கல்வி", "கேள்வி", "அறிவுடைமை"], ["learning", "hearing", "knowledge"]),
    "study": (["கல்வி", "கற்றல்"], ["learning", "study"]),
    "studies": (["கல்வி", "கற்றல்"], ["learning"]),
    "knowledge": (["அறிவுடைமை", "கல்வி", "மெய்யுணர்தல்"], ["the possession of knowledge", "learning", "perception of truth"]),
    "kalvi": (["கல்வி", "கேள்வி"], ["learning"]),
    "padipu": (["கல்வி"], ["learning"]),
    "கல்வி": (["கல்வி"], ["learning"]),

    # 25. Love, Romance, Affection
    "love": (["அன்புடைமை", "காமத்துப்பால்", "குறிப்பறிதல்"], ["the possession of love", "love", "the knowledge of signs"]),
    "affection": (["அன்புடைமை"], ["the possession of love"]),
    "romance": (["காமத்துப்பால்"], ["love"]),
    "kadhal": (["காமத்துப்பால்", "அன்புடைமை"], ["love"]),
    "anbu": (["அன்புடைமை"], ["the possession of love"]),
    "அன்பு": (["அன்புடைமை"], ["the possession of love"]),
    "காதல்": (["காமத்துப்பால்"], ["love"])
}

def detect_language(text: str) -> str:
    """
    Detects if the query is Tamil script, English, or Tanglish.
    Returns: 'ta' (Tamil), 'tanglish' (Tamil in Latin script), or 'en' (English).
    """
    if not text or not text.strip():
        return "en"

    tamil_chars = len(re.findall(r'[\u0B80-\u0BFF]', text))
    total_letters = len(re.findall(r'[a-zA-Z\u0B80-\u0BFF]', text))

    if total_letters == 0:
        return "en"

    if (tamil_chars / total_letters) > 0.20:
        return "ta"

    tokens = [w.lower() for w in re.findall(r'[a-zA-Z]+', text)]
    tanglish_markers = {
        "enna", "epdi", "eppadi", "panradhu", "pannanum", "valkai", "vaazhkai",
        "nanban", "kovam", "tholvi", "vetri", "la", "aaga", "irukka", "mudiyum",
        "padipu", "muyarchi", "thappu", "kadhal", "anbu", "thaangala", "pesuranga",
        "sanda", "kavala", "sombal", "panam", "kaasu", "udambu", "seri",
        "nan", "naan", "kashtam", "kashtama", "kashtathula", "iruken", "irukken",
        "kovatha", "kobam", "kopam", "porumai", "bayam", "payam", "azhugai", "azhuga",
        "droham", "thurogam", "poy", "poi", "unmai", "kadavul", "pesanum", "seiyanum",
        "solli", "sollunga", "paththi", "pathi", "puriyala", "theriyala", "koodadhu",
        "solrathu", "venum", "kooda", "edhuvum", "ennoda", "unaku", "enakku"
    }

    has_tanglish_marker = any(t in tanglish_markers for t in tokens)
    tanglish_matches = sum(1 for t in tokens if t in CONCEPT_SYNONYMS)

    if has_tanglish_marker or (len(tokens) > 0 and (tanglish_matches / len(tokens)) >= 0.15):
        return "tanglish"

    return "en"

def expand_query_concepts(query: str) -> Tuple[List[str], List[str]]:
    """
    Extracts conceptual synonyms in both Tamil and English for any query
    (Tamil, English, or Tanglish).
    """
    tokens = re.findall(r'[\u0B80-\u0BFFa-zA-Z]+', query.lower())
    ta_concepts = set()
    en_concepts = set()

    for token in tokens:
        if token in CONCEPT_SYNONYMS:
            ta_syns, en_syns = CONCEPT_SYNONYMS[token]
            ta_concepts.update(ta_syns)
            en_concepts.update(en_syns)

    # Substring checks for agglutinative words or compounds
    for concept_word, (ta_syns, en_syns) in CONCEPT_SYNONYMS.items():
        if len(concept_word) >= 4 and concept_word in query.lower():
            ta_concepts.update(ta_syns)
            en_concepts.update(en_syns)

    return list(ta_concepts), list(en_concepts)

def expand_tanglish_query(query: str) -> Tuple[str, List[str], List[str]]:
    ta_concepts, en_concepts = expand_query_concepts(query)
    return query, ta_concepts, en_concepts
