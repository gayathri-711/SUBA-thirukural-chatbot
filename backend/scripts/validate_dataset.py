import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models.kural import Kural

def validate_dataset():
    db = SessionLocal()
    errors = []
    warnings = []
    
    print("=" * 60)
    print("SUBA — Thirukkural Dataset Integrity & Validation Report")
    print("=" * 60)
    
    try:
        kurals = db.query(Kural).order_by(Kural.kural_number.asc()).all()
        total_count = len(kurals)
        print(f"Total Kurals Found: {total_count}")
        
        # Check 1: Count == 1330
        if total_count != 1330:
            errors.append(f"Expected exactly 1,330 Kurals, but found {total_count}.")
            
        # Check 2: Numbers 1 to 1330 contiguous with no duplicates
        numbers_seen = set()
        duplicate_numbers = set()
        for k in kurals:
            num = k.kural_number
            if num in numbers_seen:
                duplicate_numbers.add(num)
            numbers_seen.add(num)
            
        if duplicate_numbers:
            errors.append(f"Found duplicate Kural numbers: {sorted(list(duplicate_numbers))[:10]}")
            
        missing_numbers = [i for i in range(1, 1331) if i not in numbers_seen]
        if missing_numbers:
            errors.append(f"Missing Kural numbers ({len(missing_numbers)} missing): {missing_numbers[:10]}")
            
        # Check 3: Field completeness
        incomplete_kurals = []
        for k in kurals:
            issues = []
            if not k.line_1_tamil or len(k.line_1_tamil.strip()) < 5:
                issues.append("missing line_1_tamil")
            if not k.line_2_tamil or len(k.line_2_tamil.strip()) < 5:
                issues.append("missing line_2_tamil")
            if not k.meaning_tamil or len(k.meaning_tamil.strip()) < 5:
                issues.append("missing meaning_tamil")
            if not k.meaning_english or len(k.meaning_english.strip()) < 5:
                issues.append("missing meaning_english")
            if not k.chapter_name_tamil:
                issues.append("missing chapter_name_tamil")
            if not k.chapter_name_english:
                issues.append("missing chapter_name_english")
            if not k.division:
                issues.append("missing division")
                
            if issues:
                incomplete_kurals.append((k.kural_number, issues))
                
        if incomplete_kurals:
            errors.append(f"Incomplete Kurals ({len(incomplete_kurals)}): {incomplete_kurals[:5]}")
            
        # Check 4: Chapters count
        chapters = db.query(Kural.chapter_number).distinct().all()
        chapter_nums = {c[0] for c in chapters}
        print(f"Distinct Chapters Found: {len(chapter_nums)} / 133")
        if len(chapter_nums) != 133:
            errors.append(f"Expected 133 distinct chapters, found {len(chapter_nums)}.")
            
        # Check 5: Divisions
        divisions = db.query(Kural.division).distinct().all()
        div_names = [d[0] for d in divisions]
        print(f"Divisions Found ({len(div_names)}):")
        for d in div_names:
            div_count = db.query(Kural).filter(Kural.division == d).count()
            print(f"  • {d}: {div_count} Kurals")
            
        if len(div_names) < 3:
            errors.append(f"Expected 3 divisions, found {len(div_names)}: {div_names}")
            
        # Check sample records
        sample_1 = db.query(Kural).filter(Kural.kural_number == 1).first()
        sample_1330 = db.query(Kural).filter(Kural.kural_number == 1330).first()
        
        print("-" * 60)
        if sample_1:
            print(f"Kural #1 ({sample_1.chapter_name_tamil} / {sample_1.chapter_name_english}):")
            print(f"  Line 1: {sample_1.line_1_tamil}")
            print(f"  Line 2: {sample_1.line_2_tamil}")
            print(f"  English: {sample_1.meaning_english}")
        if sample_1330:
            print(f"\nKural #1330 ({sample_1330.chapter_name_tamil} / {sample_1330.chapter_name_english}):")
            print(f"  Line 1: {sample_1330.line_1_tamil}")
            print(f"  Line 2: {sample_1330.line_2_tamil}")
            print(f"  English: {sample_1330.meaning_english}")
        print("-" * 60)
        
        if errors:
            print("\n❌ VALIDATION FAILED WITH ERRORS:")
            for e in errors:
                print(f"  - {e}")
            return False
        else:
            print("\n✅ VALIDATION PASSED!")
            print("All 1,330 Kurals, 133 Chapters, and 3 Divisions are verified and intact.")
            return True
    finally:
        db.close()

if __name__ == "__main__":
    success = validate_dataset()
    sys.exit(0 if success else 1)
