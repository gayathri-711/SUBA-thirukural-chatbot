# Thirukkural Dataset Documentation

## Source & Attribution
The dataset included in this project contains all **1,330 couplets (Kurals)** of the classical Tamil treatise **Thirukkural** authored by the sage-poet **Thiruvalluvar**, organized across **133 chapters (Adhigarams)** and **3 main divisions (Paals)**:

1. **அறத்துப்பால் (Aṟattuppāl / Virtue)** — Chapters 1 to 38 (Kurals 1–380)
2. **பொருட்பால் (Poruṭpāl / Wealth & Public Life)** — Chapters 39 to 108 (Kurals 381–1080)
3. **காமத்துப்பால் (Kāmattuppāl / Love)** — Chapters 109 to 133 (Kurals 1081–1330)

### Data Files
- `thirukkural.json`: Contains all 1,330 Kurals with:
  - Original Tamil couplet (`Line1` and `Line2`)
  - Transliteration in Latin script (`transliteration1`, `transliteration2`)
  - Verified English translation (`Translation` by Rev. Dr. G. U. Pope & Rev. W. H. Drew)
  - Verified Tamil commentaries:
    - **Dr. Mu. Varadarajan (`mv`)** — authoritative scholar commentary
    - **Solomon Pappaiah (`sp`)** — popular conversational Tamil commentary
    - **Kalaignar M. Karunanidhi (`mk`)** — poetic modern Tamil commentary
  - English explanation (`explanation`)
- `detail.json`: Contains structural hierarchy:
  - 3 Sections (பால் - Paal)
  - 13 Chapter Groups (இயல் - Iyal)
  - 133 Chapters (அதிகாரம் - Adhigaram) with Tamil title, English translation, transliteration, start Kural, and end Kural.

### Licensing & Rights
- **Original Tamil text**: Thirukkural was composed in antiquity (~2nd-5th century CE) and is in the **Public Domain**.
- **English translations**: Classic public domain translations by Rev. Dr. George Uglow Pope (1886) and Rev. William Hoyles Drew (1840).
- **Dataset compilation**: Maintained by the open-source Tamil computing community under the **MIT License** (source repository: `tk120404/thirukkural`).
