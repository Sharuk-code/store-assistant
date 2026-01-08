export default {
    init: () => {
        // Inject HTML
        const div = document.createElement('div');
        div.id = 'goodvibe-ai-container';
        div.innerHTML = `
            <!-- Chat Button -->
            <button id="ai-fab" style="position:fixed; bottom:20px; right:20px; width:60px; height:60px; border-radius:30px; background:linear-gradient(135deg, #6366f1, #a855f7); color:white; border:none; box-shadow:0 4px 10px rgba(0,0,0,0.3); font-size:2rem; cursor:pointer; z-index:9999; display:flex; align-items:center; justify-content:center; transition:transform 0.2s;">
                ✨
            </button>

            <!-- Chat Window -->
            <div id="ai-window" style="display:none; position:fixed; bottom:90px; right:20px; width:350px; height:500px; background:var(--bg-card); border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.2); border:1px solid var(--border-color); flex-direction:column; z-index:9999; overflow:hidden;">
                <!-- Header -->
                <div style="padding:1rem; background:linear-gradient(135deg, #6366f1, #aaaaaa); color:white; font-weight:bold; display:flex; justify-content:space-between; align-items:center;">
                    <span style="display:flex; align-items:center; gap:8px;"><img src="/static/icons/ai-chat.svg" style="width:20px; height:20px; filter:brightness(0) saturate(100%) invert(73%) sepia(42%) saturate(522%) hue-rotate(152deg);">GoodVibe Assistant</span>
                    <button id="ai-close" style="background:none; border:none; color:white; font-size:1.2rem; cursor:pointer;">&times;</button>
                </div>
                
                <!-- Messages -->
                <div id="ai-messages" style="flex:1; padding:1rem; overflow-y:auto; background:var(--bg-body); display:flex; flex-direction:column; gap:0.5rem;">
                    <div class="ai-msg" style="align-self:flex-start; background:var(--bg-card); padding:0.5rem 1rem; border-radius:12px 12px 12px 0; border:1px solid var(--border-color); max-width:80%;">
                        Hi! I'm your specific GoodVibe assistant. Ask me about sales, stock, or repairs!
                    </div>
                </div>

                <!-- Input -->
                <div style="padding:1rem; border-top:1px solid var(--border-color); display:flex; gap:0.5rem; background:var(--bg-card);">
                    <input type="text" id="ai-input" placeholder="Ask something..." style="flex:1; padding:0.5rem; border-radius:20px; border:1px solid var(--border-color); outline:none;">
                    <button id="ai-send" style="background:#6366f1; color:white; border:none; padding:0.5rem 1rem; border-radius:20px; cursor:pointer;">Send</button>
                </div>
            </div>
        `;
        document.body.appendChild(div);

        // Logic
        const fab = document.getElementById('ai-fab');
        const win = document.getElementById('ai-window');
        const close = document.getElementById('ai-close');
        const input = document.getElementById('ai-input');
        const send = document.getElementById('ai-send');
        const msgs = document.getElementById('ai-messages');

        // State
        let chatHistory = []; // [{role: 'user', content: '...'}, {role: 'assistant', content: '...'}]

        // Toggle
        fab.onclick = () => {
            win.style.display = win.style.display === 'flex' ? 'none' : 'flex';
            if (win.style.display === 'flex') input.focus();
        };
        close.onclick = () => win.style.display = 'none';

        // Send
        async function sendMessage() {
            const text = input.value.trim();
            if (!text) return;

            // User Bubble
            addMessage(text, 'user');
            input.value = '';

            // AI Typng...
            const loader = addMessage('Thinking...', 'ai', true);

            try {
                const res = await fetch('/api/ai/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: text,
                        history: chatHistory.slice(-10) // Send last 10 turns for context
                    })
                });
                const data = await res.json();

                // Remove loader
                loader.remove();

                if (data.response) {
                    addMessage(data.response, 'ai');

                    // Update History
                    chatHistory.push({ role: 'user', content: text });
                    chatHistory.push({ role: 'assistant', content: data.response });

                } else if (data.error) {
                    addMessage(data.error, 'ai', false, true);
                }
            } catch (e) {
                loader.remove();
                addMessage("Connection Error.", 'ai', false, true);
            }
        }

        function addMessage(text, sender, isLoader = false, isError = false) {
            const div = document.createElement('div');
            div.className = 'ai-msg';
            div.textContent = text;
            div.style.padding = '0.5rem 1rem';
            div.style.maxWidth = '80%';
            div.style.wordWrap = 'break-word';

            if (sender === 'user') {
                div.style.alignSelf = 'flex-end';
                div.style.background = '#6366f1';
                div.style.color = 'white';
                div.style.borderRadius = '12px 12px 0 12px';
            } else {
                div.style.alignSelf = 'flex-start';
                div.style.background = isError ? '#fee2e2' : 'var(--bg-card)';
                div.style.color = isError ? '#ef4444' : 'var(--text-primary)';
                div.style.border = '1px solid var(--border-color)';
                div.style.borderRadius = '12px 12px 12px 0';
            }

            if (isLoader) {
                div.style.fontStyle = 'italic';
                div.style.opacity = '0.7';
            }

            msgs.appendChild(div);
            msgs.scrollTop = msgs.scrollHeight;
            return div;
        }

        send.onclick = sendMessage;
        input.onkeypress = (e) => {
            if (e.key === 'Enter') sendMessage();
        };
    }
};
