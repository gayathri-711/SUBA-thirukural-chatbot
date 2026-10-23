import React from 'react';
import { Scroll, ShieldCheck, Database, Cpu, Globe, BookOpen, Award } from 'lucide-react';
import { getT } from '../utils/translations';

export default function About({ language = 'auto' }) {
  const t = getT(language);
  const isTamil = language === 'ta';

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-4xl mx-auto w-full space-y-8">
      {/* Hero */}
      <div className="parchment-card rounded-3xl p-6 md:p-10 border border-gold-300 shadow-elevated text-center relative overflow-hidden">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 via-gold-500 to-forest-800 text-cream-50 shadow-md mb-4 border border-gold-300">
          <Scroll className="w-8 h-8" />
        </div>

        <h1 className="text-2xl md:text-4xl font-bold font-tamil text-forest-950 tracking-tight">
          {t.aboutTitle}
        </h1>
        <p className="text-sm md:text-base text-gold-700 font-display font-semibold mt-1">
          SUBA: AI-Powered Thirukkural Wisdom System
        </p>
        <p className="text-sm text-forest-700 max-w-xl mx-auto mt-3 leading-relaxed">
          {t.aboutSub}
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs">
          <span className="px-3.5 py-1.5 rounded-full bg-forest-800 text-gold-300 font-bold shadow-xs">
            {isTamil ? '1,330 சரிபார்க்கப்பட்ட குறள்கள்' : '1,330 Verified Kurals'}
          </span>
          <span className="px-3 py-1 rounded-full bg-cream-200 text-forest-800 font-semibold">
            {isTamil ? '133 அதிகாரங்கள்' : '133 Chapters'}
          </span>
          <span className="px-3 py-1 rounded-full bg-cream-200 text-forest-800 font-semibold">
            {isTamil ? '3 பால்கள் (அறம், பொருள், இன்பம்)' : '3 Divisions (Virtue, Wealth, Love)'}
          </span>
        </div>
      </div>

      {/* Core Principles */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-forest-900 font-tamil flex items-center space-x-2">
          <ShieldCheck className="w-5 h-5 text-gold-600" />
          <span>{t.corePrinciples}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-2">
            <div className="flex items-center space-x-2 text-forest-800 font-bold text-sm">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>{t.sourceGrounding}</span>
            </div>
            <p className="text-xs text-forest-600 leading-relaxed">
              {t.sourceGroundingDesc}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-2">
            <div className="flex items-center space-x-2 text-forest-800 font-bold text-sm">
              <Globe className="w-4 h-4 text-gold-600" />
              <span>{t.multilingualTitle}</span>
            </div>
            <p className="text-xs text-forest-600 leading-relaxed">
              {t.multilingualDesc}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-2">
            <div className="flex items-center space-x-2 text-forest-800 font-bold text-sm">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>{isTamil ? 'பன்முக மெய்யியல் பகுப்பாய்வு' : 'Hybrid Semantic Retrieval (RAG)'}</span>
            </div>
            <p className="text-xs text-forest-600 leading-relaxed">
              {isTamil
                ? 'தமிழ் உருபனியல் பகுப்பாய்வு மற்றும் ஆங்கில TF-IDF கணிப்பீடுகளை ஒருங்கிணைத்து துல்லியமான குறள்களைத் தேர்வு செய்கிறது.'
                : 'Combines character n-gram morphology for Tamil with sublinear TF-IDF embeddings and thematic boosting.'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-cream-300 shadow-xs space-y-2">
            <div className="flex items-center space-x-2 text-forest-800 font-bold text-sm">
              <Award className="w-4 h-4 text-purple-600" />
              <span>{isTamil ? 'நடைமுறை வாழ்வியல் தீர்வுகள்' : 'Grounded Actionable Lessons'}</span>
            </div>
            <p className="text-xs text-forest-600 leading-relaxed">
              {isTamil
                ? 'வெறும் ஏட்டுச் சுரைக்காயாக அன்றி, இன்றைய வேலை, நட்பு, குடும்பம், மற்றும் சவால்களுக்கான செயல்வடிவ ஆலோசனைகளை வழங்குகிறது.'
                : 'Translates classical verses into concrete modern counsel for career, stress, relationships, and ethics.'}
            </p>
          </div>
        </div>
      </div>

      {/* The 3 Divisions */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-forest-900 font-tamil flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-gold-600" />
          <span>{isTamil ? 'திருக்குறள் முப்பால் அமைப்பு' : 'The Three Structural Divisions'}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
              {isTamil ? '1. அறத்துப்பால்' : '1. Virtue (அறத்துப்பால்)'}
            </span>
            <p className="text-xs font-semibold text-emerald-950">
              {isTamil ? '38 அதிகாரங்கள் • குறள் 1 – 380' : '38 Chapters • Kurals 1 – 380'}
            </p>
            <p className="text-xs text-emerald-800 leading-relaxed">
              {isTamil
                ? 'இல்லற நெறி, அன்புடைமை, செய்ந்நன்றி, வாய்மை, பொறையுடைமை, மற்றும் உயிர்க்கொடை.'
                : 'Moral righteousness, family ethics, gratitude, truthfulness, patience, and universal benevolence.'}
            </p>
          </div>

          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-2">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
              {isTamil ? '2. பொருட்பால்' : '2. Wealth (பொருட்பால்)'}
            </span>
            <p className="text-xs font-semibold text-amber-950">
              {isTamil ? '70 அதிகாரங்கள் • குறள் 381 – 1080' : '70 Chapters • Kurals 381 – 1080'}
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {isTamil
                ? 'தலைமைத்துவம், கல்வி, ஆள்வினை உடைமை (விடாமுயற்சி), நட்பு, நிதி நிர்வாகம், மற்றும் துன்பத்தை வெல்லுதல்.'
                : 'Leadership, education, perseverance, governance, economic wisdom, and resilience.'}
            </p>
          </div>

          <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-5 space-y-2">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider block">
              {isTamil ? '3. காமத்துப்பால்' : '3. Love (காமத்துப்பால்)'}
            </span>
            <p className="text-xs font-semibold text-rose-950">
              {isTamil ? '25 அதிகாரங்கள் • குறள் 1081 – 1330' : '25 Chapters • Kurals 1081 – 1330'}
            </p>
            <p className="text-xs text-rose-800 leading-relaxed">
              {isTamil
                ? 'காதலின் நுட்பங்கள், மன உணர்வுகள், பிரிவு, ஊடல் மற்றும் அன்பின் இனிமை.'
                : 'The subtle psychology of romantic affection, lovers variance, empathy, and emotional harmony.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
