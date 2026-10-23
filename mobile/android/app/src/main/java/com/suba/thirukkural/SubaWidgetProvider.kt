package com.suba.thirukkural

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import java.util.Calendar

class SubaWidgetProvider : AppWidgetProvider() {

    data class Kural(
        val number: Int,
        val chapter: String,
        val line1: String,
        val line2: String,
        val meaning: String
    )

    companion object {
        const val ACTION_NEXT_KURAL = "com.suba.thirukkural.ACTION_NEXT_KURAL"
        private var currentIndex = -1

        val KURALS = listOf(
            Kural(
                1,
                "அதிகாரம் 1: கடவுள் வாழ்த்து",
                "அகர முதல எழுத்தெல்லாம் ஆதி",
                "பகவன் முதற்றே உலகு.",
                "எழுத்துக்களுக்கு அகரம் முதன்மை; அதுபோல உலகிற்கு ஆதிபகவன் முதன்மை."
            ),
            Kural(
                391,
                "அதிகாரம் 40: கல்வி",
                "கற்க கசடறக் கற்பவை கற்றபின்",
                "நிற்க அதற்குத் தக.",
                "கற்கத் தகுந்த நூல்களைக் குற்றமறக் கற்க வேண்டும்; கற்ற பிறகு அதன்படி நடக்க வேண்டும்."
            ),
            Kural(
                303,
                "அதிகாரம் 31: வெகுளாமை",
                "சினமென்னும் சேர்ந்தாரைக் கொல்லி இனமென்னும்",
                "ஏமப் புணையைச் சுடும்.",
                "சினம் தன்னை அடைந்தவனையும் அழிக்கும்; அவனது சுற்றம் என்னும் பாதுகாப்புப் படகையும் சுட்டெரிக்கும்."
            ),
            Kural(
                66,
                "அதிகாரம் 7: மக்கட்பேறு",
                "குழலினிது யாழினிது என்பதம் மக்கள்",
                "மழலைச்சொல் கேளாதவர்.",
                "தம் குழந்தைகளின் மழலைச் சொல்லைக் கேட்காதவரே குழலும் யாழும் இனிது என்பர்."
            ),
            Kural(
                314,
                "அதிகாரம் 32: இன்னா செய்யாமை",
                "இன்னாசெய்தாரை ஒறுத்தலவர் நாண",
                "நன்னயஞ் செய்து விடல்.",
                "தீமை செய்தவரைத் தண்டிக்கும் சிறந்த வழி, அவர் வெட்கப்படும்படி அவருக்கு நன்மை செய்வதே."
            ),
            Kural(
                616,
                "அதிகாரம் 62: ஆள்வினையுடைமை",
                "தெய்வத்தான் ஆகா தெனினும் முயற்சிதன்",
                "மெய்வருத்தக் கூலி தரும்.",
                "விதியால் ஒரு காரியம் முடியாது போனாலும், விடாமுயற்சி உடலுழைப்புக்குரிய பலனைத் தரும்."
            ),
            Kural(
                78,
                "அதிகாரம் 8: அன்புடைமை",
                "அன்பகத் தில்லா உயிர்வாழ்க்கை வன்பாற்கண்",
                "வற்றல் மரந்தளிர்த் தற்று.",
                "அன்பில்லாத மனிதனின் வாழ்க்கை, பாலைவனத்தில் காய்ந்துபோன மரம் தளிர் விடுவது போன்றது."
            ),
            Kural(
                102,
                "அதிகாரம் 11: செய்ந்நன்றியறிதல்",
                "காலத்தி னாற்செய்த நன்றி சிறிதெனினும்",
                "ஞாலத்தின் மாணப் பெரிது.",
                "தேவையான நேரத்தில் ஒருவன் செய்த உதவி சிறியதாயினும், அது உலகத்தை விடப் பெரியது."
            )
        )

        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.suba_widget)

            // Select Kural based on current index or day-of-year
            val dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
            val index = if (currentIndex >= 0) {
                currentIndex % KURALS.size
            } else {
                dayOfYear % KURALS.size
            }
            val kural = KURALS[index]

            views.setTextViewText(R.id.widget_kural_number, "குறள் ${kural.number}")
            views.setTextViewText(R.id.widget_chapter, kural.chapter)
            views.setTextViewText(R.id.widget_kural_line1, kural.line1)
            views.setTextViewText(R.id.widget_kural_line2, kural.line2)
            views.setTextViewText(R.id.widget_meaning, kural.meaning)

            // Intent to open Main App Chat
            val appIntent = Intent(context, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                putExtra("open_chat", true)
            }
            val appPendingIntent = PendingIntent.getActivity(
                context,
                0,
                appIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_ask, appPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_root, appPendingIntent)

            // Intent to cycle to next Kural
            val nextIntent = Intent(context, SubaWidgetProvider::class.java).apply {
                action = ACTION_NEXT_KURAL
            }
            val nextPendingIntent = PendingIntent.getBroadcast(
                context,
                1,
                nextIntent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )
            views.setOnClickPendingIntent(R.id.widget_btn_next, nextPendingIntent)

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_NEXT_KURAL) {
            if (currentIndex < 0) {
                val dayOfYear = Calendar.getInstance().get(Calendar.DAY_OF_YEAR)
                currentIndex = (dayOfYear % KURALS.size) + 1
            } else {
                currentIndex = (currentIndex + 1) % KURALS.size
            }
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val thisWidget = ComponentName(context, SubaWidgetProvider::class.java)
            val allWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget)
            for (widgetId in allWidgetIds) {
                updateAppWidget(context, appWidgetManager, widgetId)
            }
        }
    }
}
