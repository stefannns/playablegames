(() => {
  const api = window.PlayableReviewLibrary;
  const trigger = document.getElementById('tiktok-view');
  if (!api || !trigger) return;
  // Local framework integration. This is not a hosted deployment or a public URL.
  const mockOrigin = 'http://127.0.0.1:5173';
  const dialog = document.createElement('dialog');
  dialog.className = 'batch-view-dialog';
  dialog.setAttribute('aria-labelledby', 'batch-view-heading');
  dialog.innerHTML = `<header class="batch-view-toolbar"><div class="batch-view-summary"><h2 id="batch-view-heading">TikTok view</h2><p class="batch-view-status" role="status"></p></div><label class="batch-view-picker">Choose game<select aria-label="Choose game"></select></label><nav class="batch-view-controls" aria-label="Feed review controls"><button type="button" data-step="previous">Previous</button><button type="button" data-step="next">Next</button><button type="button" class="batch-view-close">Back to review</button></nav></header><p class="batch-view-error" hidden>The local mock isn’t responding. Start the local framework, then reopen this view. <a href="http://127.0.0.1:5173/app/home?review=batch" target="_blank" rel="noopener">Open local mock</a></p><iframe class="batch-view-frame" title="TikTok batch review" allow="camera; microphone; autoplay; fullscreen"></iframe>`;
  document.body.append(dialog);
  const frame = dialog.querySelector('iframe'), status = dialog.querySelector('[role="status"]'), error = dialog.querySelector('.batch-view-error');
  const picker = dialog.querySelector('select');
  api.games.forEach(game => {
    const option = document.createElement('option');
    option.value = game.taskId;
    option.textContent = game.number + '. ' + game.name;
    picker.append(option);
  });
  let selected = null, timer = null;
  frame.addEventListener('load', () => {
    if (!dialog.open) return;
    // The review modal supplies no phone chrome. Ask AppFrame to own it via its existing host protocol.
    frame.contentWindow?.postMessage({type:'safe-area:set',safeArea:{top:'0px',bottom:'0px',left:'0px',right:'0px'},fullScreen:true,hostProvidesPhoneChrome:false}, mockOrigin);
  });
  function show() {
    if (dialog.open) return;
    selected = api.getCurrent();
    if (!selected) return;
    picker.value = selected.taskId;
    picker.disabled = true;
    const url = new URL('/app/home', mockOrigin);
    url.searchParams.set('review', 'batch');
    url.searchParams.set('feed', 'playable-batch-' + selected.taskId);
    url.searchParams.set('reviewHost', location.origin);
    api.suspend();
    status.textContent = 'Loading ' + api.games.length + ' games…';
    dialog.querySelectorAll('[data-step]').forEach(button=>{button.disabled=true;});
    error.hidden = true;
    frame.src = url.href;
    dialog.showModal();
    document.body.classList.add('batch-view-open');
    dialog.querySelector('.batch-view-close').focus();
    timer = setTimeout(() => { error.hidden = false; status.textContent = 'Local mock unavailable'; }, 12000);
  }
  function close() { dialog.close(); }
  dialog.addEventListener('close', () => {
    clearTimeout(timer); frame.src = 'about:blank';
    document.body.classList.remove('batch-view-open');
    if (selected) api.select(selected);
    trigger.focus();
  });
  trigger.addEventListener('click', show);
  dialog.querySelector('.batch-view-close').addEventListener('click', close);
  picker.addEventListener('change', () => {
    if (!dialog.open || picker.disabled || !api.games.some(game => game.taskId === picker.value)) return;
    frame.contentWindow?.postMessage({type:'playable-batch-select',taskId:picker.value}, mockOrigin);
  });
  dialog.querySelectorAll('[data-step]').forEach(button => button.addEventListener('click', () => {
    frame.contentWindow?.postMessage({type:'playable-batch-step',direction:button.dataset.step}, mockOrigin);
  }));
  window.addEventListener('message', event => {
    if (!dialog.open || event.source !== frame.contentWindow || event.origin !== mockOrigin || event.data?.type !== 'playable-batch-selection') return;
    const game = api.games.find(item => item.taskId === event.data.taskId);
    if (!game) return;
    selected = game;
    picker.value = game.taskId;
    picker.disabled = false;
    dialog.querySelectorAll('[data-step]').forEach(button=>{button.disabled=false;});
    clearTimeout(timer); error.hidden = true;
    status.textContent = game.number + '. ' + game.name + ' · Swipe down for next, up for previous';
  });
})();
