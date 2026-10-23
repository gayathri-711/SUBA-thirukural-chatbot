package com.suba.thirukkural;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.widget.RemoteViews;
import java.util.Calendar;

public class SubaWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_NEXT_KURAL = "com.suba.thirukkural.ACTION_NEXT_KURAL";
    private static int currentIndex = -1;

    static class Kural {
        int number;
        String chapter;
        String line1;
        String line2;
        String meaning;

        Kural(int number, String chapter, String line1, String line2, String meaning) {
            this.number = number;
            this.chapter = chapter;
            this.line1 = line1;
            this.line2 = line2;
            this.meaning = meaning;
        }
    }

    private static final Kural[] KURALS = new Kural[] {
        new Kural(
            1,
            "அதிகாரம் 1: கடவுள் வாழ்த்து",
            "அகர முதல எழுத்தெல்லாம் ஆதி",
            "பகவன் முதற்றே உலகு.",
            "எழுத்துக்களுக்கு அகரம் முதன்மை; அதுபோல உலகிற்கு ஆதிபகவன் முதன்மை."
        ),
        new Kural(
            391,
            "அதிகாரம் 40: கல்வி",
            "கற்க கசடறக் கற்பவை கற்றபின்",
            "நிற்க அதற்குத் தக.",
            "கற்கத் தகுந்த நூல்களைக் குற்றமறக் கற்க வேண்டும்; கற்ற பிறகு அதன்படி நடக்க வேண்டும்."
        ),
        new Kural(
            303,
            "அதிகாரம் 31: வெகுளாமை",
            "சினமென்னும் சேர்ந்தாரைக் கொல்லி இனமென்னும்",
            "ஏமப் புணையைச் சுடும்.",
            "சினம் தன்னை அடைந்தவனையும் அழிக்கும்; அவனது சுற்றம் என்னும் பாதுகாப்புப் படகையும் சுட்டெரிக்கும்."
        ),
        new Kural(
            66,
            "அதிகாரம் 7: மக்கட்பேறு",
            "குழலினிது யாழினிது என்பதம் மக்கள்",
            "மழலைச்சொல் கேளாதவர்.",
            "தம் குழந்தைகளின் மழலைச் சொல்லைக் கேட்காதவரே குழலும் யாழும் இனிது என்பர்."
        ),
        new Kural(
            314,
            "அதிகாரம் 32: இன்னா செய்யாமை",
            "இன்னாசெய்தாரை ஒறுத்தலவர் நாண",
            "நன்னயஞ் செய்து விடல்.",
            "தீமை செய்தவரைத் தண்டிக்கும் சிறந்த வழி, அவர் வெட்கப்படும்படி அவருக்கு நன்மை செய்வதே."
        ),
        new Kural(
            616,
            "அதிகாரம் 62: ஆள்வினையுடைமை",
            "தெய்வத்தான் ஆகா தெனினும் முயற்சிதன்",
            "மெய்வருத்தக் கூலி தரும்.",
            "விதியால் ஒரு காரியம் முடியாது போனாலும், விடாமுயற்சி உடலுழைப்புக்குரிய பலனைத் தரும்."
        ),
        new Kural(
            78,
            "அதிகாரம் 8: அன்புடைமை",
            "அன்பகத் தில்லா உயிர்வாழ்க்கை வன்பாற்கண்",
            "வற்றல் மரந்தளிர்த் தற்று.",
            "அன்பில்லாத மனிதனின் வாழ்க்கை, பாலைவனத்தில் காய்ந்துபோன மரம் தளிர் விடுவது போன்றது."
        ),
        new Kural(
            102,
            "அதிகாரம் 11: செய்ந்நன்றியறிதல்",
            "காலத்தி னாற்செய்த நன்றி சிறிதெனினும்",
            "ஞாலத்தின் மாணப் பெரிது.",
            "தேவையான நேரத்தில் ஒருவன் செய்த உதவி சிறியதாயினும், அது உலகத்தை விடப் பெரியது."
        )
    };

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        try {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.suba_widget);

            int dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
            int index = (currentIndex >= 0) ? (currentIndex % KURALS.length) : (dayOfYear % KURALS.length);
            Kural kural = KURALS[index];

            views.setTextViewText(R.id.widget_kural_number, "குறள் " + kural.number);
            views.setTextViewText(R.id.widget_chapter, kural.chapter);
            views.setTextViewText(R.id.widget_kural_line1, kural.line1);
            views.setTextViewText(R.id.widget_kural_line2, kural.line2);
            views.setTextViewText(R.id.widget_meaning, kural.meaning);

            // Intent to open Main App
            Intent appIntent = new Intent(context, MainActivity.class);
            appIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            appIntent.putExtra("open_chat", true);

            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent appPendingIntent = PendingIntent.getActivity(context, 0, appIntent, flags);
            views.setOnClickPendingIntent(R.id.widget_btn_ask, appPendingIntent);
            views.setOnClickPendingIntent(R.id.widget_root, appPendingIntent);

            // Intent to cycle to next Kural
            Intent nextIntent = new Intent(context, SubaWidgetProvider.class);
            nextIntent.setAction(ACTION_NEXT_KURAL);
            PendingIntent nextPendingIntent = PendingIntent.getBroadcast(context, 1, nextIntent, flags);
            views.setOnClickPendingIntent(R.id.widget_btn_next, nextPendingIntent);

            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_NEXT_KURAL.equals(intent.getAction())) {
            try {
                if (currentIndex < 0) {
                    int dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR);
                    currentIndex = (dayOfYear % KURALS.length) + 1;
                } else {
                    currentIndex = (currentIndex + 1) % KURALS.length;
                }

                AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
                ComponentName thisWidget = new ComponentName(context, SubaWidgetProvider.class);
                int[] allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
                for (int widgetId : allWidgetIds) {
                    updateAppWidget(context, appWidgetManager, widgetId);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
