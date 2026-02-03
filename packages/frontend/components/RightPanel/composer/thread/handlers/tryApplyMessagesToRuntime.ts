export async function tryApplyMessagesToRuntime(
  rt: any,
  msgs: any[]
): Promise<{ ok: boolean; path: string; count: number }> {
  const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
  const check = (): number => {
    try {
      const s1 = Array.isArray(rt?.messages) ? rt.messages.length : 0;
      const s2 = Array.isArray(rt?._threadBinding?.getState?.()?.messages) ? rt._threadBinding.getState().messages.length : 0;
      const s3 = Array.isArray(rt?.getState?.()?.messages) ? rt.getState().messages.length : 0;
      return Math.max(s1, s2, s3);
    } catch { return 0; }
  };

  // Disable runtime to prevent auto-runs while importing history
  let didDisable = false;
  let originalState: any = undefined;
  try {
    if (rt?._threadBinding?.getState && rt?._threadBinding?.setState) {
      originalState = rt._threadBinding.getState();
      rt._threadBinding.setState({ ...originalState, isDisabled: true, isLoading: false });
      didDisable = true;
    }
  } catch {}

  // Attempt 1: export snapshot → replace → import
  try {
    const snapshot = rt.export ? await rt.export() : {};
    if (snapshot?.thread && Array.isArray(snapshot.thread.messages)) {
      snapshot.thread.messages = msgs;
    } else {
      snapshot.messages = msgs;
    }
    if (rt.import) {
      await rt.import(snapshot);
      await pause(50);
      const cnt = check();
      if (cnt > 0) {
        try { rt.cancelRun?.(); } catch {}
        // restore disabled state before returning
        try {
          if (didDisable && rt?._threadBinding?.setState) {
            const prevNow = rt?._threadBinding?.getState?.() || {};
            const restoreDisabled = originalState?.isDisabled ?? false;
            rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
          }
        } catch {}
        return { ok: true, path: 'export/import', count: cnt };
      }
    }
  } catch {}

  // Attempt 2: simple import with messages
  try {
    if (rt.import) {
      await rt.import({ messages: msgs });
      await pause(50);
      const cnt = check();
      if (cnt > 0) {
        try { rt.cancelRun?.(); } catch {}
        try {
          if (didDisable && rt?._threadBinding?.setState) {
            const prevNow = rt?._threadBinding?.getState?.() || {};
            const restoreDisabled = originalState?.isDisabled ?? false;
            rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
          }
        } catch {}
        return { ok: true, path: 'import(messages)', count: cnt };
      }
    }
  } catch {}

  // Attempt 3: threadBinding import
  try {
    if (rt._threadBinding?.import) {
      await rt._threadBinding.import({ messages: msgs });
      await pause(50);
      const cnt = check();
      if (cnt > 0) {
        try { rt.cancelRun?.(); } catch {}
        try {
          if (didDisable && rt?._threadBinding?.setState) {
            const prevNow = rt?._threadBinding?.getState?.() || {};
            const restoreDisabled = originalState?.isDisabled ?? false;
            rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
          }
        } catch {}
        return { ok: true, path: '_threadBinding.import', count: cnt };
      }
    }
  } catch {}

  // Attempt 4: setState on threadBinding
  try {
    if (rt._threadBinding?.setState) {
      const prev = rt._threadBinding.getState?.() || {};
      rt._threadBinding.setState({ ...prev, messages: msgs });
      await pause(50);
      const cnt = check();
      if (cnt > 0) {
        try { rt.cancelRun?.(); } catch {}
        try {
          if (didDisable && rt?._threadBinding?.setState) {
            const prevNow = rt?._threadBinding?.getState?.() || {};
            const restoreDisabled = originalState?.isDisabled ?? false;
            rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
          }
        } catch {}
        return { ok: true, path: '_threadBinding.setState', count: cnt };
      }
    }
  } catch {}

  // Attempt 5: temporarily disable runtime, append one-by-one (best-effort)
  try {
    if (rt.append) {
      try {
        // Disable runtime actions to avoid triggering runs while reconstructing history
        const prev = rt._threadBinding?.getState?.() || {};
        rt._threadBinding?.setState?.({ ...prev, isDisabled: true, isLoading: false });
      } catch {}
      for (const m of msgs) {
        try { await rt.append(m); } catch {}
      }
      try {
        const prev2 = rt._threadBinding?.getState?.() || {};
        rt._threadBinding?.setState?.({ ...prev2, isDisabled: false, isLoading: false });
      } catch {}
      await pause(50);
      const cnt = check();
      if (cnt > 0) {
        try { rt.cancelRun?.(); } catch {}
        try {
          if (didDisable && rt?._threadBinding?.setState) {
            const prevNow = rt?._threadBinding?.getState?.() || {};
            const restoreDisabled = originalState?.isDisabled ?? false;
            rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
          }
        } catch {}
        return { ok: true, path: 'append(each)', count: cnt };
      }
    }
  } catch {}

  // Restore runtime disabled state
  try {
    if (didDisable && rt?._threadBinding?.setState) {
      const prevNow = rt?._threadBinding?.getState?.() || {};
      const restoreDisabled = originalState?.isDisabled ?? false;
      rt._threadBinding.setState({ ...prevNow, isDisabled: restoreDisabled, isLoading: false, isRunning: false });
    }
  } catch {}

  return { ok: false, path: 'failed', count: 0 };
}
