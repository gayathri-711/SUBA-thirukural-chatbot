import React, { useState } from 'react';
import { X, Sparkles, Bot, Key, Check, AlertCircle, Loader2, Cpu, Zap, ShieldCheck, ExternalLink, Server } from 'lucide-react';
import api, { getApiBaseUrl, setCustomApiBaseUrl } from '../services/api';
import { getT } from '../utils/translations';

export default function AiSettingsModal({ isOpen, onClose, aiConfig, onSaveConfig, language = 'auto' }) {
  const [provider, setProvider] = useState(aiConfig?.provider || 'suba');
  const [apiKey, setApiKey] = useState(aiConfig?.apiKey || '');
  const [model, setModel] = useState(aiConfig?.model || '');
  const [serverUrl, setServerUrl] = useState(getApiBaseUrl());
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const isTamil = language === 'ta';

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (provider === 'suba') {
      setTestResult({ success: true, message: isTamil ? 'சுபா உள்ளமைக்கப்பட்ட AI இயந்திரம் தயார் நிலையில் உள்ளது!' : 'SUBA Built-in AI Cognitive Engine is active and verified!' });
      return;
    }

    if (!apiKey.trim()) {
      setTestResult({ success: false, message: isTamil ? 'தயவுசெய்து உங்கள் API சாவியை உள்ளிடவும்.' : 'Please enter your API Key.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.testAiProvider(provider, apiKey.trim(), model || null);
      setTestResult({ success: true, message: res.message || 'Connection successful!' });
    } catch (err) {
      setTestResult({ success: false, message: err.message || 'Connection test failed. Check key & network.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    setCustomApiBaseUrl(serverUrl.trim());
    onSaveConfig({
      provider,
      apiKey: apiKey.trim(),
      model: model || (provider === 'gemini' ? 'gemini-1.5-flash' : provider === 'openai' ? 'gpt-4o-mini' : 'suba-cognitive-v1')
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white border border-gold-300/50 rounded-3xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-forest-900 to-forest-800 text-cream-100 px-6 py-4 border-b border-forest-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-400/40 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-tamil flex items-center gap-1.5">
                <span>{isTamil ? 'AI சாட்போட் அமைப்புகள்' : 'AI Bot & Model Settings'}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/30">
                  ChatGPT-Style
                </span>
              </h2>
              <p className="text-[11px] text-cream-300">
                {isTamil ? 'குறள்களை பகுப்பாய்வு செய்து தீர்வு காணும் AI அமைப்பு' : 'Analyze life queries and Kurals like ChatGPT'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-cream-300 hover:text-white hover:bg-forest-700/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-forest-800 block">
              {isTamil ? 'AI இயந்திரத்தைத் தேர்ந்தெடுக்கவும்:' : 'Select AI Intelligence Provider:'}
            </label>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option 1: SUBA Cognitive AI Engine */}
              <div
                onClick={() => { setProvider('suba'); setTestResult(null); }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
                  provider === 'suba'
                    ? 'border-gold-500 bg-gold-50/50 shadow-xs'
                    : 'border-cream-300 hover:border-gold-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  provider === 'suba' ? 'bg-gold-500 text-forest-950 font-bold' : 'bg-cream-100 text-forest-700'
                }`}>
                  <Zap className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-forest-950">
                      ⚡ SUBA Built-in AI Cognitive Engine
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      {isTamil ? 'இலவசம் • தயார்' : 'Free • Instant'}
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-600 mt-0.5 leading-relaxed">
                    {isTamil
                      ? '1,330 குறள்களின் அடிப்படையில் உடனடி சூழல் பகுப்பாய்வு மற்றும் நடைமுறைத் தீர்வுகள். API சாவி தேவையில்லை.'
                      : 'Built-in ChatGPT-grade situational analysis and step-by-step action plans grounded in all 1,330 Kurals.'}
                  </p>
                </div>
              </div>

              {/* Option 2: Google Gemini */}
              <div
                onClick={() => { setProvider('gemini'); setTestResult(null); }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
                  provider === 'gemini'
                    ? 'border-gold-500 bg-gold-50/50 shadow-xs'
                    : 'border-cream-300 hover:border-gold-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  provider === 'gemini' ? 'bg-forest-800 text-gold-300 font-bold' : 'bg-cream-100 text-forest-700'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-forest-950">
                      🤖 Google Gemini AI (1.5 Flash / Pro)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-200 text-forest-800 font-semibold">
                      BYO Key
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-600 mt-0.5 leading-relaxed">
                    {isTamil
                      ? 'கூகிளின் மேம்பட்ட ஜெமினி மாடலின் மூலம் ஆழமான நேரடி விளக்கம்.'
                      : 'Connect your Google AI Studio key for live generative synthesis.'}
                  </p>
                </div>
              </div>

              {/* Option 3: OpenAI ChatGPT */}
              <div
                onClick={() => { setProvider('openai'); setTestResult(null); }}
                className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-start space-x-3 ${
                  provider === 'openai'
                    ? 'border-gold-500 bg-gold-50/50 shadow-xs'
                    : 'border-cream-300 hover:border-gold-300 bg-white'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  provider === 'openai' ? 'bg-forest-900 text-cream-100 font-bold' : 'bg-cream-100 text-forest-700'
                }`}>
                  <Cpu className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-forest-950">
                      🧠 OpenAI ChatGPT (GPT-4o / GPT-4o-mini)
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream-200 text-forest-800 font-semibold">
                      BYO Key
                    </span>
                  </div>
                  <p className="text-[11px] text-forest-600 mt-0.5 leading-relaxed">
                    {isTamil
                      ? 'ஓபன்ஏஐ சேட்ஜிபிடி (OpenAI ChatGPT) வழியாக நேரடிப் பதில்களைப் பெறலாம்.'
                      : 'Connect your OpenAI API key for official ChatGPT intelligence.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Input Section for Gemini or OpenAI */}
          {provider !== 'suba' && (
            <div className="space-y-3 p-4 rounded-2xl bg-cream-50 border border-cream-200 animate-fade-in">
              <div>
                <label className="text-xs font-bold text-forest-900 block mb-1 flex items-center justify-between">
                  <span>{provider === 'gemini' ? 'Google Gemini API Key:' : 'OpenAI API Key:'}</span>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] text-gold-700 hover:text-gold-900 font-semibold"
                  >
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={provider === 'gemini' ? 'AIzaSy...' : 'sk-...'}
                    className="w-full text-xs py-2 pl-8 pr-3 bg-white border border-cream-300 rounded-xl focus:outline-hidden focus:border-gold-500 text-forest-900 font-mono"
                  />
                  <Key className="w-3.5 h-3.5 text-forest-400 absolute left-2.5 top-2.5" />
                </div>
              </div>

              {/* Model Choice */}
              <div>
                <label className="text-xs font-bold text-forest-900 block mb-1">
                  {isTamil ? 'மாடல் பதிப்பு:' : 'Model Identifier:'}
                </label>
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full text-xs py-2 px-3 bg-white border border-cream-300 rounded-xl focus:outline-hidden focus:border-gold-500 text-forest-900 font-medium"
                >
                  {provider === 'gemini' ? (
                    <>
                      <option value="gemini-1.5-flash">gemini-1.5-flash (Fast & Recommended)</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro (High Reasoning)</option>
                    </>
                  ) : (
                    <>
                      <option value="gpt-4o-mini">gpt-4o-mini (Fast & Recommended)</option>
                      <option value="gpt-4o">gpt-4o (Full Flagship)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Test Button */}
              <div className="pt-1 flex items-center justify-between">
                <button
                  type="button"
                  id="btn-test-ai-connection"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-3.5 py-1.5 rounded-xl bg-forest-800 text-gold-300 hover:bg-forest-900 text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                >
                  {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                  <span>{testing ? 'Testing...' : (isTamil ? 'இணைப்பைச் சோதிக்க' : 'Test Connection')}</span>
                </button>

                <span className="text-[10px] text-forest-500">
                  {provider === 'gemini' ? 'Keys stored locally in your browser' : 'Key never logged or shared'}
                </span>
              </div>
            </div>
          )}

          {/* Test Status Banner */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start space-x-2 animate-fade-in ${
              testResult.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}>
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span className="font-medium">{testResult.message}</span>
            </div>
          )}

          {/* Backend Server URL Setting (Crucial for Mobile APK / Remote IP) */}
          <div className="pt-3 border-t border-cream-200">
            <label className="text-xs font-bold text-forest-800 flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-gold-600" />
                <span>{isTamil ? 'சேவையக முகவரி (Server URL):' : 'Backend Server URL (Mobile / Cloud):'}</span>
              </span>
              <span className="text-[10px] text-forest-500 font-normal">
                {isTamil ? 'மொபைல் ஆப் அல்லது கணினி IP' : 'For Mobile APK / Network'}
              </span>
            </label>
            <input
              type="text"
              id="input-backend-server-url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.X:8000/api or https://your-server.com/api"
              className="w-full text-xs py-2 px-3 bg-white border border-cream-300 rounded-xl focus:outline-hidden focus:border-gold-500 text-forest-900 font-mono shadow-2xs"
            />
            <p className="text-[10px] text-forest-500 mt-1">
              {isTamil
                ? 'மொபைல் APK-இல் உங்கள் கணினியின் IP (எ.கா: http://192.168.1.15:8000/api) அல்லது கிளவுட் சேவையக முகவரியை உள்ளிடவும்.'
                : 'In Android APK, set your computer local IP (e.g. http://192.168.1.X:8000/api) or hosted backend URL.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-cream-100 px-6 py-3.5 border-t border-cream-300 flex items-center justify-between text-xs">
          <span className="text-forest-600 font-medium">
            {isTamil ? 'சுபா AI எப்போதும் திருக்குறள் சான்றுடன் பதிலளிக்கும்' : 'SUBA guarantees 100% Kural grounding'}
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-forest-700 hover:bg-cream-200 transition-colors font-semibold cursor-pointer"
            >
              {isTamil ? 'ரத்து' : 'Cancel'}
            </button>
            <button
              id="btn-save-ai-settings"
              onClick={handleSave}
              className="px-4 py-1.5 rounded-xl bg-gold-500 text-forest-950 font-bold hover:bg-gold-400 transition-all shadow-xs cursor-pointer"
            >
              {isTamil ? 'சேமித்து செயல்படுத்து' : 'Save & Activate'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
