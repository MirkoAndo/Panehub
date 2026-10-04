'use client'

import { useEffect, useState } from 'react'

export function DashboardHeroSettings() {
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => { fetch('/api/dashboard/hero', { cache: 'no-store' }).then(response => response.ok ? response.json() : null).then(data => { if (data?.hero_image_url) { setUrl(data.hero_image_url); setPreview(data.hero_image_url) } }) }, [])
  function normalizeImageUrl(source: string) {
    const driveMatch = source.match(/drive\.google\.com\/file\/d\/([^/]+)/i)
    return driveMatch ? `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w2400` : source
  }
  async function save() {
    setError(''); setSaved(false); const value = url.trim(); const normalized = normalizeImageUrl(value)
    if (value && !/^https?:\/\//i.test(value)) { setError('Inserisci un link http o https valido.'); return }
    setBusy(true); const response = await fetch('/api/dashboard/hero', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: normalized }) }); const data = await response.json(); setBusy(false)
    if (!response.ok) { setError(data.error ?? 'Impossibile salvare.'); return } setPreview(data.hero_image_url ?? ''); setSaved(true)
  }
  return <section className="mt-10 border-t border-border pt-10"><div className="max-w-3xl"><p className="font-mono text-xs uppercase tracking-[.2em] text-muted-foreground">Immagine hero</p><h2 className="mt-2 font-serif text-4xl">La vetrina principale.</h2><p className="mt-2 text-muted-foreground">Sostituisci il quadrato della landing con un’immagine pubblica. Non ci sono vincoli sulle dimensioni: usa JPG, JPEG, PNG, WEBP, GIF, SVG o qualsiasi formato immagine supportato dal browser.</p><div className="mt-5 grid gap-5 md:grid-cols-[1fr_220px]"><div className="grid gap-3"><label className="text-sm font-medium">Link immagine dal web<input value={url} onChange={event => setUrl(event.target.value)} placeholder="https://.../immagine.jpg" className="mt-1 w-full border border-border bg-background p-3" /></label><p className="text-xs text-muted-foreground">Sono accettati link HTTP/HTTPS diretti a immagini JPG, JPEG, PNG, WEBP, GIF, SVG e altri formati leggibili dal browser. Supportati anche i link Google Drive condivisi pubblicamente: vengono convertiti automaticamente. Il link deve essere pubblico e puntare al file immagine.</p>{error && <p className="text-sm text-destructive">{error}</p>}{saved && <p className="text-sm text-emerald-700">Immagine salvata e pubblicata nella landing.</p>}<button type="button" disabled={busy} onClick={save} className="w-fit bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">{busy ? 'Verifica...' : 'Salva immagine'}</button></div><div className="aspect-[.88] overflow-hidden rounded-2xl border border-border bg-muted">{preview ? <img src={preview} alt="Anteprima immagine hero" className="size-full object-cover" /> : <div className="grid size-full place-items-center p-5 text-center text-xs text-muted-foreground">Nessuna immagine personalizzata</div>}</div></div></div></section>
}
