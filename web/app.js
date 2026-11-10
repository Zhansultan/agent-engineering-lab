/**
 * Harness Web UI - Phase A.3
 * Full tool execution loop support
 */

const API_URL = '/api';

const messagesEl = document.getElementById('messages');
const eventsEl = document.getElementById('events');
const inputEl = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearChat');
const refreshBtn = document.getElementById('refreshEvents');
const modeBtns = document.querySelectorAll('.mode-btn');

let currentMode = 'mock';

// Mode toggle
modeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    modeBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
  });
});

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Add message to chat
 */
function addMessage(role, content, options = {}) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  if (options.mock) div.classList.add('mock');
  if (options.error) div.classList.add('error');

  div.innerHTML = `<div>${escapeHtml(content)}</div>`;

  if (options.mock) {
    div.innerHTML += `<div class="message-meta">[MOCK] Test response</div>`;
  }

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/**
 * Add tool step to chat
 */
function addToolStep(name, args) {
  const div = document.createElement('div');
  div.className = 'tool-step';
  div.innerHTML = `
    <span class="tool-name">🔧 ${escapeHtml(name)}</span>
    <span class="tool-args">(${escapeHtml(args)})</span>
  `;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/**
 * Add tool result to chat
 */
function addToolResult(name, result) {
  const div = document.createElement('div');
  div.className = 'tool-result';

  if (result.error) {
    div.classList.add('error');
    div.innerHTML = `<strong>Error:</strong> ${escapeHtml(result.error)}`;
  } else if (result.items) {
    const items = result.items.slice(0, 5).map(i =>
      `${i.type === 'directory' ? '📁' : '📄'} ${i.name}`
    ).join('\n');
    const more = result.items.length > 5 ? `\n... +${result.items.length - 5} more` : '';
    div.innerHTML = `<strong>Result:</strong><pre>${escapeHtml(items + more)}</pre>`;
  } else if (result.content) {
    const preview = result.content.substring(0, 300);
    const truncated = result.truncated ? '...' : '';
    div.innerHTML = `<strong>File content:</strong><pre>${escapeHtml(preview + truncated)}</pre>`;
  } else if (result.matches) {
    const matches = result.matches.slice(0, 5).join('\n');
    div.innerHTML = `<strong>Found ${result.matches.length} files:</strong><pre>${escapeHtml(matches)}</pre>`;
  } else if (result.results) {
    div.innerHTML = `<strong>Found ${result.results.length} matches</strong>`;
  } else {
    div.innerHTML = `<pre>${escapeHtml(JSON.stringify(result, null, 2))}</pre>`;
  }

  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

/**
 * Add loading indicator
 */
function addLoading() {
  const div = document.createElement('div');
  div.className = 'message assistant';
  div.id = 'loading';
  div.innerHTML = '<div class="loading"></div> Thinking...';
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeLoading() {
  const loading = document.getElementById('loading');
  if (loading) loading.remove();
}

/**
 * Send message to API
 */
async function sendMessage() {
  const message = inputEl.value.trim();
  if (!message) return;

  inputEl.value = '';
  sendBtn.disabled = true;

  addMessage('user', message);
  addLoading();

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        mock: currentMode === 'mock'
      })
    });

    removeLoading();

    const data = await res.json();

    if (data.error) {
      addMessage('assistant', `Error: ${data.error}`, { error: true });
    } else if (data.steps) {
      // Process each step
      for (const step of data.steps) {
        if (step.type === 'tool_call') {
          addToolStep(step.name, step.args);
        } else if (step.type === 'tool_result') {
          addToolResult(step.name, step.result);
        } else if (step.type === 'response') {
          addMessage('assistant', step.content, { mock: step.mock });
        } else if (step.type === 'done') {
          addMessage('assistant', `[Completed] ${step.message}`, { mock: currentMode === 'mock' });
        } else if (step.type === 'error') {
          addMessage('assistant', `Error: ${step.message}`, { error: true });
        } else if (step.type === 'limit') {
          addMessage('assistant', `[Limit] ${step.message}`, { error: true });
        }
      }

      // Show session info
      const infoDiv = document.createElement('div');
      infoDiv.className = 'message-meta';
      infoDiv.style.textAlign = 'center';
      infoDiv.style.padding = '0.5rem';
      infoDiv.textContent = `[${data.turns} turns, ${data.messages} messages]`;
      messagesEl.appendChild(infoDiv);
    }

    loadEvents();

  } catch (err) {
    removeLoading();
    addMessage('assistant', `Network error: ${err.message}`, { error: true });
  } finally {
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

/**
 * Load events
 */
async function loadEvents() {
  try {
    const res = await fetch(`${API_URL}/events`);
    const data = await res.json();

    eventsEl.innerHTML = '';

    if (data.events && data.events.length > 0) {
      const events = data.events.reverse();

      for (const event of events) {
        const div = document.createElement('div');
        div.className = 'event';

        const dataStr = Object.keys(event.data).length > 0
          ? JSON.stringify(event.data)
          : '';

        div.innerHTML = `
          <span class="event-stage">${event.stage}</span>
          <span class="event-data">${escapeHtml(dataStr)}</span>
          <span class="event-time">+${event.duration_ms}ms</span>
        `;

        eventsEl.appendChild(div);
      }
    } else {
      eventsEl.innerHTML = '<p style="color: var(--text-dim)">No events yet.</p>';
    }
  } catch (err) {
    eventsEl.innerHTML = `<p style="color: var(--error)">Failed: ${err.message}</p>`;
  }
}

function clearChat() {
  messagesEl.innerHTML = '';
}

// Event listeners
sendBtn.addEventListener('click', sendMessage);
clearBtn.addEventListener('click', clearChat);
refreshBtn.addEventListener('click', loadEvents);

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Initial
loadEvents();
addMessage('assistant', 'Welcome to Harness! Use Mock for instant test responses, or Ollama for real model (requires running Ollama).', { mock: true });
