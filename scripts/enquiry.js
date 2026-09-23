// ── Enquiry form — DOM wiring ───────────────────────────────────────────────
// One short form for every kind of enquiry, on the Spaces page and in the
// home-page dialog. Logic lives in enquiry-core.js; this file shows/hides the
// follow-up questions, applies prefills from [data-enquire] triggers and the
// URL, validates, and posts to Netlify Forms. On failure the visitor keeps
// their input and gets a prefilled email link, so nothing is lost.
(function () {
  const core = window.MedullaEnquiry;
  if (!core) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function currentInterest(form) {
    const checked = form.querySelector('[name="interest"]:checked');
    return checked ? checked.value : null;
  }

  function setGroupVisibility(form, interest) {
    const visible = core.visibleFieldsFor(interest);
    form.querySelectorAll('[data-group]').forEach((group) => {
      const show = Boolean(visible[group.dataset.group]);
      group.hidden = !show;
      group.disabled = !show; // disabled fields are left out of the submission
    });
    const message = form.querySelector('[name="message"]');
    if (message) message.placeholder = core.promptFor(interest);
  }

  function toggleError(form, id, show) {
    const el = form.querySelector(`#${id}`);
    if (el) el.hidden = !show;
  }

  function applyPrefill(form, prefill) {
    if (!prefill.interest) return;
    const radio = form.querySelector(`[name="interest"][value="${prefill.interest}"]`);
    if (radio) radio.checked = true;
    const field = core.getInterest(prefill.interest).optionField;
    if (field && prefill.option) {
      const option = form.querySelector(`[name="${field}"][value="${prefill.option}"]`);
      if (option) option.checked = true;
    }
    toggleError(form, 'enq-interest-error', false);
    setGroupVisibility(form, prefill.interest);
  }

  function focusStart(form) {
    const target = currentInterest(form)
      ? form.querySelector('[name="name"]')
      : form.querySelector('[name="interest"]');
    if (target) target.focus({ preventScroll: true });
  }

  function validate(form) {
    const problems = [];
    const hasInterest = Boolean(currentInterest(form));
    toggleError(form, 'enq-interest-error', !hasInterest);
    if (!hasInterest) problems.push(form.querySelector('[name="interest"]'));
    ['name', 'email'].forEach((fieldName) => {
      const input = form.querySelector(`[name="${fieldName}"]`);
      const ok = input.value.trim() !== '' && input.checkValidity();
      input.setAttribute('aria-invalid', String(!ok));
      toggleError(form, `enq-${fieldName}-error`, !ok);
      if (!ok) problems.push(input);
    });
    if (problems.length) problems[0].focus();
    return problems.length === 0;
  }

  function showDone(root, data) {
    const form = root.querySelector('form');
    const done = root.querySelector('.enquiry__done');
    const firstName = String(data.get('name') || '').trim().split(/\s+/)[0];
    done.querySelector('.enquiry__done-title').textContent = `Thanks, ${firstName}, we've got it.`;
    done.querySelector('.enquiry__done-text').textContent =
      `We'll reply to ${String(data.get('email') || '').trim()} within a few days.`;
    form.hidden = true;
    done.hidden = false;
    done.focus();
  }

  function showFailure(form, data) {
    const status = form.querySelector('.enquiry__status');
    const link = document.createElement('a');
    link.href = core.buildMailto(Object.fromEntries(data.entries()));
    link.textContent = 'email it to us';
    status.replaceChildren(
      'Something went wrong on our side. Your message is still here. Try again, or ',
      link,
      '.'
    );
    status.hidden = false;
  }

  async function submit(form, root) {
    const button = form.querySelector('[type="submit"]');
    const status = form.querySelector('.enquiry__status');
    const data = new FormData(form);
    button.disabled = true;
    button.textContent = 'Sending…';
    status.hidden = true;
    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: core.encodeBody([...data.entries()]),
      });
      if (!response.ok) throw new Error(`Netlify Forms responded ${response.status}`);
      showDone(root, data);
    } catch (error) {
      console.error('Enquiry submission failed:', error);
      showFailure(form, data);
    } finally {
      button.disabled = false;
      button.textContent = 'Send';
    }
  }

  function resetIfDone(root) {
    const form = root.querySelector('form');
    const done = root.querySelector('.enquiry__done');
    if (!done.hidden) {
      form.reset();
      form.hidden = false;
      done.hidden = true;
      setGroupVisibility(form, null);
    }
  }

  function initForm(root) {
    const form = root.querySelector('form[data-enquiry-form]');
    if (!form) return null;
    form.addEventListener('change', (event) => {
      if (event.target.name === 'interest') {
        toggleError(form, 'enq-interest-error', false);
        setGroupVisibility(form, event.target.value);
      }
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (validate(form)) submit(form, root);
    });
    setGroupVisibility(form, currentInterest(form));
    return form;
  }

  // ── Page setup ────────────────────────────────────────────────────────────
  const root = document.querySelector('[data-enquiry]');
  const form = root && initForm(root);
  if (!form) return;

  const dialog = document.querySelector('dialog[data-enquiry-dialog]');
  let opener = null;

  function openDialog(trigger) {
    opener = trigger;
    resetIfDone(root);
    dialog.showModal();
    document.dispatchEvent(new CustomEvent('enquiry:open'));
    focusStart(form);
  }

  if (dialog) {
    dialog.addEventListener('close', () => {
      document.dispatchEvent(new CustomEvent('enquiry:close'));
      if (opener) opener.focus();
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close(); // click on the backdrop
    });
    dialog.querySelectorAll('[data-enquiry-close]').forEach((button) => {
      button.addEventListener('click', () => dialog.close());
    });
  } else {
    applyPrefill(form, core.prefillFromSearch(window.location.search));
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-enquire]');
    if (!trigger) return;
    // let the browser handle new-tab / new-window clicks — the href carries the prefill
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    applyPrefill(form, core.parsePrefill(trigger.dataset.enquire));
    if (dialog) {
      openDialog(trigger);
    } else {
      const section = document.getElementById('enquire') || root;
      section.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      focusStart(form);
    }
  });
})();
