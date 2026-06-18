import { removeBackground } from '@imgly/background-removal';

self.addEventListener('message', async ({ data: { buffer, name, type } }) => {
  try {
    const file = new File([buffer], name, { type });
    const blob = await removeBackground(file);
    const out = await blob.arrayBuffer();
    self.postMessage({ ok: true, buffer: out }, [out]);
  } catch (err) {
    self.postMessage({ ok: false, message: err?.message ?? String(err) });
  }
});
