import re
import numpy as np
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.models.kural import Kural
from app.services.tanglish import detect_language, expand_query_concepts

class KuralRetrievalEngine:
    """
    Intelligent Hybrid Retrieval Engine combining:
    1. Exact Kural number matching
    2. Tamil character and sub-word n-gram TF-IDF retrieval
    3. English semantic TF-IDF retrieval
    4. Conceptual expansions (Tamil, English, Tanglish)
    5. Thematic and Chapter relevance boosting
    """
    def __init__(self):
        self.is_initialized = False
        self.kurals_cache: List[Kural] = []
        self.kural_by_number: Dict[int, Kural] = {}
        
        # Vectorizers
        self.en_vectorizer: Optional[TfidfVectorizer] = None
        self.ta_vectorizer: Optional[TfidfVectorizer] = None
        
        # Matrix representations
        self.en_matrix = None
        self.ta_matrix = None
        
        # Document representations
        self.en_docs: List[str] = []
        self.ta_docs: List[str] = []

    def initialize(self, db: Session):
        if self.is_initialized and len(self.kurals_cache) == 1330:
            return

        kurals = db.query(Kural).order_by(Kural.kural_number.asc()).all()
        if not kurals:
            print("Warning: Database has no Kurals loaded yet. Run import script first.")
            return

        self.kurals_cache = kurals
        self.kural_by_number = {k.kural_number: k for k in kurals}

        # Build English & transliteration documents
        self.en_docs = [
            f"Kural {k.kural_number} Chapter {k.chapter_number} {k.chapter_name_english} {k.division} "
            f"{k.meaning_english} {k.explanation_english} {k.keywords_english} "
            f"{k.transliteration_1} {k.transliteration_2}"
            for k in kurals
        ]

        # Build Tamil documents
        self.ta_docs = [
            f"குறள் {k.kural_number} அதிகாரம் {k.chapter_name_tamil} {k.division} "
            f"{k.line_1_tamil} {k.line_2_tamil} {k.meaning_tamil} "
            f"{k.explanation_tamil_sp} {k.explanation_tamil_mk} {k.keywords_tamil}"
            for k in kurals
        ]

        # Initialize vectorizers
        self.en_vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            stop_words='english',
            sublinear_tf=True
        )
        self.en_matrix = self.en_vectorizer.fit_transform(self.en_docs)

        # Tamil n-gram vectorizer (char n-grams 3-5 work well for Tamil suffixes)
        self.ta_vectorizer = TfidfVectorizer(
            analyzer='char_wb',
            ngram_range=(3, 5),
            sublinear_tf=True
        )
        self.ta_matrix = self.ta_vectorizer.fit_transform(self.ta_docs)

        self.is_initialized = True
        print(f"Retrieval engine initialized with {len(self.kurals_cache)} Kurals.")

    def extract_kural_number_query(self, query: str) -> Optional[int]:
        """
        Detects if query asks for a specific Kural number (e.g. 'kural 619', 'குறள் 42', '#391')
        """
        match = re.search(r'(?:kural|kurral|thirukkural|குறள்|no\.?|number|#)\s*([0-9]{1,4})\b', query, re.IGNORECASE)
        if match:
            num = int(match.group(1))
            if 1 <= num <= 1330:
                return num
        if query.strip().isdigit():
            num = int(query.strip())
            if 1 <= num <= 1330:
                return num
        return None

    def search(
        self,
        db: Session,
        query: str,
        top_k: int = 3,
        min_threshold: float = 0.05
    ) -> Tuple[List[Dict[str, Any]], str]:
        """
        Searches the 1330 Kurals for the user's query.
        Returns: (results_list, detected_language)
        """
        if not self.is_initialized:
            self.initialize(db)

        if not self.kurals_cache:
            return [], "en"

        lang = detect_language(query)

        # 1. Check for explicit Kural number mention
        kural_num = self.extract_kural_number_query(query)
        if kural_num and kural_num in self.kural_by_number:
            k = self.kural_by_number[kural_num]
            res = [{
                "kural_number": k.kural_number,
                "chapter_name_tamil": k.chapter_name_tamil,
                "chapter_name_english": k.chapter_name_english,
                "division": k.division,
                "kural_tamil": f"{k.line_1_tamil}\n{k.line_2_tamil}",
                "line_1_tamil": k.line_1_tamil,
                "line_2_tamil": k.line_2_tamil,
                "meaning_english": k.meaning_english,
                "meaning_tamil": k.meaning_tamil,
                "relevance_score": 1.0,
                "explanation_english": k.explanation_english,
                "explanation_tamil_sp": k.explanation_tamil_sp
            }]
            return res, lang

        # 2. Extract conceptual synonyms (for Tamil, English, and Tanglish)
        ta_concepts, en_concepts = expand_query_concepts(query)

        # 3. Compute English TF-IDF scores
        en_query_expanded = query + " " + " ".join(en_concepts)
        try:
            en_q_vec = self.en_vectorizer.transform([en_query_expanded])
            en_scores = cosine_similarity(en_q_vec, self.en_matrix).flatten()
        except Exception:
            en_scores = np.zeros(len(self.kurals_cache))

        # 4. Compute Tamil TF-IDF scores
        ta_query_expanded = query + " " + " ".join(ta_concepts)
        try:
            ta_q_vec = self.ta_vectorizer.transform([ta_query_expanded])
            ta_scores = cosine_similarity(ta_q_vec, self.ta_matrix).flatten()
        except Exception:
            ta_scores = np.zeros(len(self.kurals_cache))

        # 5. Hybrid blend
        if lang == "ta":
            combined_scores = 0.70 * ta_scores + 0.30 * en_scores
        elif lang == "tanglish":
            combined_scores = 0.50 * en_scores + 0.50 * ta_scores
        else:
            combined_scores = 0.75 * en_scores + 0.25 * ta_scores

        # 6. Apply concept & keyword boosts
        query_words = set(re.findall(r'[a-zA-Z]+', query.lower()))
        for idx, k in enumerate(self.kurals_cache):
            # Check chapter English words
            ch_en_words = set(re.findall(r'[a-zA-Z]+', k.chapter_name_english.lower()))
            overlap = query_words.intersection(ch_en_words)
            # Avoid over-boosting purely generic words like 'life'
            filtered_overlap = {w for w in overlap if w not in {"life", "the", "and", "good", "men"}}
            if filtered_overlap:
                combined_scores[idx] += 0.25 * len(filtered_overlap)

            # Boost if chapter matches concept expansions
            for ec in en_concepts:
                if ec in k.chapter_name_english.lower():
                    combined_scores[idx] += 0.30
                elif ec in k.meaning_english.lower():
                    combined_scores[idx] += 0.15

            # Boost if Tamil concept matches
            for tc in ta_concepts:
                ch_ta_clean = k.chapter_name_tamil.replace(" ", "")
                if tc in ch_ta_clean or ch_ta_clean in tc:
                    combined_scores[idx] += 0.35
                elif tc in k.meaning_tamil or tc in k.line_1_tamil or tc in k.line_2_tamil:
                    combined_scores[idx] += 0.15

        # Max score for thresholding
        max_score = float(np.max(combined_scores)) if len(combined_scores) > 0 else 0.0
        
        # If max score is below absolute minimum threshold, it's gibberish / no match
        if max_score < min_threshold:
            return [], lang

        normalized_scores = combined_scores / max(max_score, 1.0)

        # Sort indices
        top_indices = np.argsort(combined_scores)[::-1]

        results = []
        for idx in top_indices[:top_k]:
            raw_score = float(combined_scores[idx])
            norm_score = float(normalized_scores[idx])

            if raw_score < min_threshold or norm_score < 0.35:
                continue

            k = self.kurals_cache[idx]
            display_score = round(min(0.98, max(0.40, norm_score)), 2)

            results.append({
                "kural_number": k.kural_number,
                "chapter_name_tamil": k.chapter_name_tamil,
                "chapter_name_english": k.chapter_name_english,
                "division": k.division,
                "kural_tamil": f"{k.line_1_tamil}\n{k.line_2_tamil}",
                "line_1_tamil": k.line_1_tamil,
                "line_2_tamil": k.line_2_tamil,
                "meaning_english": k.meaning_english,
                "meaning_tamil": k.meaning_tamil,
                "relevance_score": display_score,
                "explanation_english": k.explanation_english,
                "explanation_tamil_sp": k.explanation_tamil_sp
            })

        return results, lang

    def get_related_kurals(self, db: Session, kural_number: int, limit: int = 3) -> List[int]:
        if not self.is_initialized:
            self.initialize(db)

        kural = self.kural_by_number.get(kural_number)
        if not kural:
            return []

        ch_num = kural.chapter_number
        start = (ch_num - 1) * 10 + 1
        end = ch_num * 10

        candidates = [num for num in range(start, end + 1) if num != kural_number]
        return candidates[:limit]

# Singleton instance
retrieval_engine = KuralRetrievalEngine()
