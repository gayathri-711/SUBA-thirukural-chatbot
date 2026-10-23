/**
 * SUBA — AI Thirukkural Wisdom Chatbot Embeddable Widget
 * Add to any website: <script src=".../suba-widget.js" data-api-url="http://localhost:8000/api"></script>
 */
(function() {
  if (window.__SUBA_WIDGET_LOADED__) return;
  window.__SUBA_WIDGET_LOADED__ = true;

  const currentScript = document.currentScript;
  const API_URL = (currentScript && currentScript.getAttribute('data-api-url')) || 'http://localhost:8000/api';

  const styles = `
    .suba-widget-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    }
    .suba-trigger-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #09261D, #0F382A, #164E3A);
      color: #FFFFFF;
      padding: 10px 16px;
      border-radius: 32px;
      border: 2px solid #D4AF37;
      box-shadow: 0 10px 25px -5px rgba(15, 56, 42, 0.5), 0 0 12px rgba(212, 175, 55, 0.35);
      cursor: pointer;
      transition: all 0.25s ease;
      user-select: none;
    }
    .suba-trigger-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 28px -5px rgba(15, 56, 42, 0.6), 0 0 18px rgba(212, 175, 55, 0.5);
    }
    .suba-icon-circle {
      width: 32px;
      height: 32px;
      border-radius: 16px;
      background: #082319;
      border: 1.5px solid #D4AF37;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .suba-dot {
      position: absolute;
      top: 0;
      right: 0;
      width: 8px;
      height: 8px;
      border-radius: 4px;
      background: #10B981;
      border: 1.5px solid #082319;
    }
    .suba-text-box {
      text-align: left;
    }
    .suba-title {
      font-size: 13px;
      font-weight: 700;
      color: #FFFFFF;
    }
    .suba-sub {
      font-size: 10px;
      color: #F3E5AB;
    }
    .suba-chat-window {
      position: absolute;
      bottom: 60px;
      right: 0;
      width: 380px;
      max-width: 90vw;
      height: 520px;
      max-height: 80vh;
      background: #FFFFFF;
      border: 2px solid #D4AF37;
      border-radius: 20px;
      box-shadow: 0 20px 40px -10px rgba(15, 56, 42, 0.4);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      display: none;
      animation: subaFadeIn 0.2s ease forwards;
    }
    @keyframes subaFadeIn {
      from { opacity: 0; transform: translateY(10px) scale(0.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .suba-window-header {
      background: #0F382A;
      color: #FFFFFF;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #164E3A;
    }
    .suba-close-btn {
      background: none;
      border: none;
      color: #FFFFFF;
      font-size: 20px;
      cursor: pointer;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .suba-messages-box {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      background: #FDFBF7;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .suba-msg-user {
      align-self: flex-end;
      background: #0F382A;
      color: #FFFFFF;
      padding: 8px 12px;
      border-radius: 14px 14px 2px 14px;
      font-size: 12px;
      max-width: 85%;
    }
    .suba-msg-bot {
      align-self: flex-start;
      background: #FFFFFF;
      color: #0F241C;
      padding: 10px 12px;
      border-radius: 14px 14px 14px 2px;
      font-size: 12px;
      border: 1px solid #E5D6A7;
      max-width: 88%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .suba-kural-chip {
      margin-top: 8px;
      padding: 8px;
      background: #FAF7F0;
      border-radius: 8px;
      border: 1px solid #E8DEC8;
      font-size: 11px;
    }
    .suba-couplet {
      font-weight: 700;
      color: #0F382A;
      margin-bottom: 4px;
    }
    .suba-input-row {
      display: flex;
      padding: 10px;
      background: #FFFFFF;
      border-top: 1px solid #EFE9DE;
      gap: 8px;
    }
    .suba-input-row input {
      flex: 1;
      border: 1px solid #E2D9C8;
      border-radius: 12px;
      padding: 8px 12px;
      font-size: 12px;
      outline: none;
    }
    .suba-input-row button {
      background: #0F382A;
      color: #D4AF37;
      border: none;
      padding: 8px 14px;
      border-radius: 12px;
      font-weight: 700;
      cursor: pointer;
    }
  `;

  const styleEl = document.createElement('style');
  styleEl.textContent = styles;
  document.head.appendChild(styleEl);

  const container = document.createElement('div');
  container.className = 'suba-widget-container';
  container.innerHTML = `
    <div class="suba-chat-window" id="suba-chat-window">
      <div class="suba-window-header">
        <div>
          <strong style="color: #FFFFFF; font-size: 14px;">SUBA • சுபா AI</strong>
          <div style="color: #F3E5AB; font-size: 10px;">1,330 Thirukkural Life Wisdom</div>
        </div>
        <button class="suba-close-btn" id="suba-close-btn">×</button>
      </div>
      <div class="suba-messages-box" id="suba-messages">
        <div class="suba-msg-bot">
          வணக்கம்! நான் சுபா (SUBA). உங்கள் கேள்விகள் அல்லது வாழ்க்கைச் சூழலைக் கூறுங்கள் — திருக்குறள் வழிகாட்டுகிறது.
        </div>
      </div>
      <form class="suba-input-row" id="suba-form">
        <input type="text" id="suba-input" placeholder="கேள்வி கேட்கவும்... (Ask SUBA)" autocomplete="off" />
        <button type="submit">Send</button>
      </form>
    </div>

    <div class="suba-trigger-btn" id="suba-trigger-btn">
      <div class="suba-icon-circle">
        <span style="font-size: 16px;">🤖</span>
        <div class="suba-dot"></div>
      </div>
      <div class="suba-text-box">
        <div class="suba-title">Ask SUBA • சுபா</div>
        <div class="suba-sub">1,330 Kural AI Guide</div>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  const trigger = document.getElementById('suba-trigger-btn');
  const chatWindow = document.getElementById('suba-chat-window');
  const closeBtn = document.getElementById('suba-close-btn');
  const form = document.getElementById('suba-form');
  const input = document.getElementById('suba-input');
  const messagesBox = document.getElementById('suba-messages');

  let isOpen = false;

  function toggle() {
    isOpen = !isOpen;
    chatWindow.style.display = isOpen ? 'flex' : 'none';
    if (isOpen) input.focus();
  }

  trigger.addEventListener('click', toggle);
  closeBtn.addEventListener('click', toggle);

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // Append user message
    const userDiv = document.createElement('div');
    userDiv.className = 'suba-msg-user';
    userDiv.textContent = text;
    messagesBox.appendChild(userDiv);
    input.value = '';
    messagesBox.scrollTop = messagesBox.scrollHeight;

    // Loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'suba-msg-bot';
    loadingDiv.textContent = 'சுபா ஆராய்கிறது (Thinking)...';
    messagesBox.appendChild(loadingDiv);
    messagesBox.scrollTop = messagesBox.scrollHeight;

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, language: 'auto', top_k: 3 })
      });
      const data = await res.json();
      loadingDiv.remove();

      const botDiv = document.createElement('div');
      botDiv.className = 'suba-msg-bot';
      botDiv.innerHTML = `<div>${data.answer || data.answer_tamil || ''}</div>`;

      if (data.kurals && data.kurals.length > 0) {
        const k = data.kurals[0];
        botDiv.innerHTML += `
          <div class="suba-kural-chip">
            <div style="color: #D4AF37; font-weight: bold; margin-bottom: 2px;">குறள் ${k.kural_number} • ${k.chapter_name_tamil || ''}</div>
            <div class="suba-couplet">${k.line_1_tamil || ''}<br/>${k.line_2_tamil || ''}</div>
            <div style="color: #4A6357;">${k.meaning_tamil || ''}</div>
          </div>
        `;
      }
      messagesBox.appendChild(botDiv);
    } catch (err) {
      loadingDiv.remove();
      const errDiv = document.createElement('div');
      errDiv.className = 'suba-msg-bot';
      errDiv.style.color = '#B91C1C';
      errDiv.textContent = 'Server error. Make sure the backend is running.';
      messagesBox.appendChild(errDiv);
    }
    messagesBox.scrollTop = messagesBox.scrollHeight;
  });
})();
