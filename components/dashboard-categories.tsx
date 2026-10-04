'use client'

import { useEffect, useState } from 'react'

type Category = { id: string; name: string }

export function DashboardCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const response = await fetch('/api/dashboard/categories', { cache: 'no-store' })
    if (response.ok) setCategories(await response.json())
  }

  useEffect(() => { load() }, [])

  function reset() { setName(''); setEditing(null); setError('') }

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    setBusy(true); setError('')
    const response = await fetch('/api/dashboard/categories', {
      method: editing ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { id: editing, name: name.trim() } : { name: name.trim() }),
    })
    if (response.ok) { reset(); await load() } else setError((await response.json()).error ?? 'Impossibile salvare la categoria')
    setBusy(false)
  }

  async function remove(category: Category) {
    if (!window.confirm(`Eliminare la categoria “${category.name}”? I prodotti resteranno nel catalogo.`)) return
    const response = await fetch(`/api/dashboard/categories?id=${category.id}`, { method: 'DELETE' })
    if (response.ok) setCategories(current => current.filter(item => item.id !== category.id))
    else setError((await response.json()).error ?? 'Impossibile eliminare la categoria')
  }

  return <section className="border-t border-border pt-10">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="font-mono text-xs uppercase tracking-[.2em] text-muted-foreground">Catalogo / Struttura</p><h2 className="mt-2 font-serif text-4xl">Categorie.</h2><p className="mt-2 text-muted-foreground">Crea e rinomina le categorie usate nel form prodotto.</p></div>
      <button type="button" onClick={reset} className="border border-border px-4 py-2 text-sm">Nuova categoria</button>
    </div>
    {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
    <div className="mt-6 grid items-start gap-4 lg:grid-cols-[1fr_1.3fr]">
      <form onSubmit={save} className="grid gap-3 border border-border bg-card p-5"><h3 className="font-serif text-2xl">{editing ? 'Modifica categoria' : 'Aggiungi categoria'}</h3><label className="text-sm">Nome<input required value={name} onChange={event => setName(event.target.value)} className="mt-1 w-full border border-border bg-background p-3" /></label><div className="flex gap-2"><button disabled={busy} className="bg-primary px-4 py-2 text-sm text-primary-foreground">{busy ? 'Salvataggio…' : 'Salva categoria'}</button>{editing && <button type="button" onClick={reset} className="border border-border px-4 py-2 text-sm">Annulla</button>}</div></form>
      <div className="grid gap-3">{categories.map(category => <article key={category.id} className="flex items-center justify-between gap-4 border border-border bg-card p-4"><span className="font-medium">{category.name}</span><div className="flex gap-2"><button type="button" onClick={() => { setEditing(category.id); setName(category.name) }} className="border border-border px-3 py-2 text-xs">Modifica</button><button type="button" onClick={() => remove(category)} className="border border-destructive px-3 py-2 text-xs text-destructive">Elimina</button></div></article>)}</div>
    </div>
  </section>
}
