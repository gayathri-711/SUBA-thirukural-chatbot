import os
import sys
import json
import re

# Add backend directory to sys.path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import Base, engine, SessionLocal
from app.models.kural import Kural

def load_source_data():
    project_root = os.path.dirname(backend_dir)
    data_dir = os.path.join(project_root, "data")
    
    kural_path = os.path.join(data_dir, "thirukkural.json")
    detail_path = os.path.join(data_dir, "detail.json")
    
    if not os.path.exists(kural_path) or not os.path.exists(detail_path):
        raise FileNotFoundError(f"Missing source files in {data_dir}. Expected thirukkural.json and detail.json.")
        
    with open(kural_path, "r", encoding="utf-8") as f:
        kural_raw = json.load(f)
        kurals = kural_raw.get("kural", kural_raw)
        
    with open(detail_path, "r", encoding="utf-8") as f:
        detail_raw = json.load(f)
        
    return kurals, detail_raw

def parse_chapters(detail_raw):
    """
    Parses detail.json to extract mapping for all 133 chapters and 3 divisions.
    """
    sections = detail_raw[0]["section"]["detail"]
    chapters_map = {}
    
    for section in sections:
        section_name_ta = section.get("name", "")
        section_trans_en = section.get("translation", "")
        division_label = f"{section_name_ta} - {section_trans_en}"
        
        for cg in section.get("chapterGroup", {}).get("detail", []):
            iyal_ta = cg.get("name", "")
            iyal_en = cg.get("translation", "")
            
            for ch in cg.get("chapters", {}).get("detail", []):
                ch_num = int(ch["number"])
                chapters_map[ch_num] = {
                    "chapter_number": ch_num,
                    "chapter_name_tamil": ch.get("name", ""),
                    "chapter_name_english": ch.get("translation", ""),
                    "transliteration": ch.get("transliteration", ""),
                    "division": division_label,
                    "iyal_tamil": iyal_ta,
                    "iyal_english": iyal_en,
                    "start": int(ch.get("start", (ch_num - 1) * 10 + 1)),
                    "end": int(ch.get("end", ch_num * 10))
                }
    return chapters_map

def generate_keywords(kural_item, chapter_info):
    """
    Generate helpful keywords for both Tamil and English search indexing.
    """
    kw_ta = set()
    kw_en = set()
    
    # Add chapter names
    kw_ta.add(chapter_info["chapter_name_tamil"])
    kw_en.add(chapter_info["chapter_name_english"].lower())
    
    # Division
    kw_ta.add(chapter_info["division"].split("-")[0].strip())
    kw_en.add(chapter_info["division"].split("-")[-1].strip().lower())
    
    # Add key words from English translation & explanation
    en_text = f"{kural_item.get('Translation', '')} {kural_item.get('explanation', '')}".lower()
    words = re.findall(r'[a-z]{3,}', en_text)
    stop_words = {"the", "and", "that", "this", "with", "from", "for", "are", "will", "who", "whom", "which", "shall", "they", "their", "them"}
    for w in words:
        if w not in stop_words:
            kw_en.add(w)
            
    # Tamil keywords from Tamil lines & meanings
    ta_text = f"{kural_item.get('Line1', '')} {kural_item.get('Line2', '')} {kural_item.get('mv', '')}"
    ta_words = re.findall(r'[\u0B80-\u0BFF]{3,}', ta_text)
    for tw in ta_words:
        kw_ta.add(tw)
        
    return " ".join(list(kw_ta)[:25]), " ".join(list(kw_en)[:25])

def import_all_kurals():
    print("Beginning Thirukkural database import...")
    Base.metadata.create_all(bind=engine)
    
    kurals_data, detail_data = load_source_data()
    chapters_map = parse_chapters(detail_data)
    
    db = SessionLocal()
    try:
        # Clear existing kurals if any to guarantee clean state
        db.query(Kural).delete()
        db.commit()
        
        imported_count = 0
        for item in kurals_data:
            kural_no = int(item["Number"])
            # In Thirukkural, every 10 kurals belong to one chapter (1 to 133)
            ch_no = (kural_no - 1) // 10 + 1
            ch_info = chapters_map.get(ch_no, {
                "chapter_name_tamil": f"அதிகாரம் {ch_no}",
                "chapter_name_english": f"Chapter {ch_no}",
                "division": "அறத்துப்பால் - Virtue",
                "iyal_tamil": "",
                "iyal_english": ""
            })
            
            kw_ta, kw_en = generate_keywords(item, ch_info)
            
            kural_obj = Kural(
                kural_number=kural_no,
                chapter_number=ch_no,
                chapter_name_tamil=ch_info["chapter_name_tamil"],
                chapter_name_english=ch_info["chapter_name_english"],
                division=ch_info["division"],
                line_1_tamil=item.get("Line1", "").strip(),
                line_2_tamil=item.get("Line2", "").strip(),
                meaning_tamil=item.get("mv", "").strip() or item.get("sp", "").strip(),
                meaning_english=item.get("Translation", "").strip(),
                keywords_tamil=kw_ta,
                keywords_english=kw_en,
                source_name="Thirukkural (Verified Classical Tamil & G.U. Pope / Drew / Dr. M. Varadarajan)",
                transliteration_1=item.get("transliteration1", "").strip(),
                transliteration_2=item.get("transliteration2", "").strip(),
                explanation_tamil_sp=item.get("sp", "").strip(),
                explanation_tamil_mk=item.get("mk", "").strip(),
                explanation_english=item.get("explanation", "").strip(),
                iyal_tamil=ch_info.get("iyal_tamil", ""),
                iyal_english=ch_info.get("iyal_english", "")
            )
            db.add(kural_obj)
            imported_count += 1
            
        db.commit()
        print(f"Successfully imported {imported_count} Kurals into database.")
        return imported_count
    except Exception as e:
        db.rollback()
        print(f"Error during import: {e}", file=sys.stderr)
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    count = import_all_kurals()
    print(f"Database setup complete! Verified count: {count}")
