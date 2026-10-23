from sqlalchemy import Column, Integer, String, Text, Float
from app.database import Base

class Kural(Base):
    __tablename__ = "kurals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    kural_number = Column(Integer, unique=True, index=True, nullable=False)
    chapter_number = Column(Integer, index=True, nullable=False)
    chapter_name_tamil = Column(String(255), nullable=False)
    chapter_name_english = Column(String(255), nullable=False)
    division = Column(String(100), nullable=False)  # e.g., "அறத்துப்பால் - Virtue"
    
    line_1_tamil = Column(Text, nullable=False)
    line_2_tamil = Column(Text, nullable=False)
    
    meaning_tamil = Column(Text, nullable=False)       # Primary Tamil meaning (Mu. Varadarajan)
    meaning_english = Column(Text, nullable=False)     # Verified English translation
    
    keywords_tamil = Column(Text, default="")
    keywords_english = Column(Text, default="")
    source_name = Column(String(255), default="Thirukkural (Verified Traditional Tamil & Dr. G.U. Pope)")
    embedding = Column(Text, nullable=True)            # Serialized embedding vector
    
    # Extended commentaries & metadata
    transliteration_1 = Column(Text, default="")
    transliteration_2 = Column(Text, default="")
    explanation_tamil_sp = Column(Text, default="")    # Solomon Pappaiah commentary
    explanation_tamil_mk = Column(Text, default="")    # Kalaignar M. Karunanidhi commentary
    explanation_english = Column(Text, default="")     # Detailed English explanation
    iyal_tamil = Column(String(255), default="")       # Sub-division (Iyal)
    iyal_english = Column(String(255), default="")

    def to_dict(self):
        return {
            "id": self.id,
            "kural_number": self.kural_number,
            "chapter_number": self.chapter_number,
            "chapter_name_tamil": self.chapter_name_tamil,
            "chapter_name_english": self.chapter_name_english,
            "division": self.division,
            "line_1_tamil": self.line_1_tamil,
            "line_2_tamil": self.line_2_tamil,
            "couplet_tamil": f"{self.line_1_tamil}\n{self.line_2_tamil}",
            "meaning_tamil": self.meaning_tamil,
            "meaning_english": self.meaning_english,
            "keywords_tamil": self.keywords_tamil,
            "keywords_english": self.keywords_english,
            "source_name": self.source_name,
            "transliteration_1": self.transliteration_1,
            "transliteration_2": self.transliteration_2,
            "explanation_tamil_sp": self.explanation_tamil_sp,
            "explanation_tamil_mk": self.explanation_tamil_mk,
            "explanation_english": self.explanation_english,
            "iyal_tamil": self.iyal_tamil,
            "iyal_english": self.iyal_english
        }
