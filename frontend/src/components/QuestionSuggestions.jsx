import React from 'react';
import { Sparkles, Compass, Heart, BookOpen, Flame, Users, Trophy } from 'lucide-react';
import { getT } from '../utils/translations';

const SUGGESTIONS = [
  {
    icon: Trophy,
    category_en: 'Success & Effort',
    category_ta: 'வெற்றியும் முயற்சியும்',
    text_en: 'How can I overcome failure?',
    text_ta: 'தோல்வியை கடந்து வெற்றி பெறுவது எப்படி?'
  },
  {
    icon: Users,
    category_en: 'Friendship',
    category_ta: 'நட்பும் தோழமையும்',
    text_en: 'How do I choose good friends?',
    text_ta: 'நல்ல நண்பர்களை எவ்வாறு தேர்ந்தெடுப்பது?'
  },
  {
    icon: Flame,
    category_en: 'Self Control',
    category_ta: 'சினம் தவிர்த்தல்',
    text_en: 'How can I control my anger?',
    text_ta: 'கோபத்தை எப்படி கட்டுப்படுத்துவது?'
  },
  {
    icon: BookOpen,
    category_en: 'Knowledge',
    category_ta: 'கல்வியும் அறிவும்',
    text_en: 'What does Thirukkural say about education?',
    text_ta: 'கல்வி மற்றும் அறிவு பற்றி வள்ளுவர் கூறுவது யாது?'
  },
  {
    icon: Compass,
    category_en: 'Health & Diet',
    category_ta: 'உணவும் உடலமைப்பும்',
    text_en: 'How to eat healthy and stay fit?',
    text_ta: 'உடல்நலமும் மருந்து நெறியும் பற்றி திருக்குறள் கூறுவது என்ன?'
  },
  {
    icon: Heart,
    category_en: 'Virtue & Duty',
    category_ta: 'பொறையுடைமை',
    text_en: 'What should I do when someone insults me?',
    text_ta: 'ஒருவர் நம்மை அவமதித்தால் நாம் என்ன செய்ய வேண்டும்?'
  }
];

export default function QuestionSuggestions({ onSelectQuestion, language = 'auto' }) {
  const t = getT(language);
  const isTamil = language === 'ta';

  return (
    <div className="w-full max-w-3xl mx-auto my-6 px-4">
      <div className="flex items-center space-x-2 mb-3 text-xs font-bold uppercase tracking-wider text-forest-800">
        <Sparkles className="w-3.5 h-3.5 text-gold-500" />
        <span>{t.suggestedQuestionsTitle}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {SUGGESTIONS.map((item, idx) => {
          const Icon = item.icon;
          const primaryText = isTamil ? item.text_ta : item.text_en;
          const secondaryText = isTamil ? item.text_en : item.text_ta;
          const category = isTamil ? item.category_ta : item.category_en;

          return (
            <button
              key={idx}
              onClick={() => onSelectQuestion(primaryText)}
              className="text-left p-3.5 rounded-xl bg-white border border-cream-300 hover:border-gold-400 hover:shadow-card hover:-translate-y-0.5 transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center space-x-2 text-[11px] font-bold text-gold-700 mb-1">
                  <Icon className="w-3.5 h-3.5 text-gold-500 group-hover:scale-110 transition-transform" />
                  <span>{category}</span>
                </div>
                <p className="text-xs font-semibold text-forest-950 group-hover:text-forest-800 line-clamp-2 leading-relaxed">
                  {primaryText}
                </p>
              </div>
              <p className="text-[11px] text-forest-500 font-tamil mt-2 pt-2 border-t border-cream-200 line-clamp-1 italic">
                {secondaryText}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
