"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import "@/features/modo-babilonia/modo-babilonia.css"

type Mapping = {
  id: string
  phone: string
  created_at: string
}

export default function WhatsAppPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [mappings, setMappings] = useState<Mapping[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadMappings = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/whatsapp/mappings')
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || 'Erro ao carregar números')
        return
      }
      setMappings(data.mappings || [])
    } catch {
      setError('Erro ao carregar números')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMappings()
  }, [])

  const addMapping = async () => {
    setSaving(true)
    setError('')
    try {
      const response = await fetch('/api/whatsapp/mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || 'Erro ao salvar número')
        return
      }
      setPhone('')
      setMappings((current) => [data.mapping, ...current])
    } catch {
      setError('Erro ao salvar número')
    } finally {
      setSaving(false)
    }
  }

  const removeMapping = async (id: string) => {
    setError('')
    try {
      const response = await fetch(`/api/whatsapp/mappings?id=${id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setError(data.error || 'Erro ao remover número')
        return
      }
      setMappings((current) => current.filter((item) => item.id !== id))
    } catch {
      setError('Erro ao remover número')
    }
  }

  return (
    <div className="mb-page">
      <div className="mb-shell">
        <div className="mb-hero">
          <button onClick={() => router.push('/lancamentos')} className="mb-btn" style={{ marginBottom: '12px' }}>
            Voltar para lançamentos
          </button>
          <p className="mb-kicker">Integrações</p>
          <h1 className="mb-title">WhatsApp</h1>
          <p className="mb-subtitle">Vincule os números autorizados para lançar despesas/receitas por mensagem</p>
        </div>

        <div className="mb-card">
          <div className="mb-field">
            <span>Telefone (com DDI)</span>
            <input
              className="mb-input"
              placeholder="Ex: 5565999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <button className="mb-btn" disabled={saving} onClick={addMapping} style={{ marginTop: '10px' }}>
            {saving ? 'Salvando...' : 'Adicionar número'}
          </button>
          {error ? <p style={{ color: '#fca5a5', marginTop: '10px' }}>{error}</p> : null}
        </div>

        <div className="mb-card" style={{ marginTop: '14px' }}>
          <h3 style={{ color: '#dbeafe', marginBottom: '10px' }}>Números vinculados</h3>
          {loading ? <p style={{ color: '#cbd5e1' }}>Carregando...</p> : null}
          {!loading && mappings.length === 0 ? <p style={{ color: '#94a3b8' }}>Nenhum número cadastrado.</p> : null}
          {!loading && mappings.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(148,163,184,0.25)', borderRadius: '10px', padding: '10px', marginBottom: '8px' }}>
              <strong style={{ color: '#e2e8f0' }}>{item.phone}</strong>
              <button className="mb-btn" onClick={() => removeMapping(item.id)}>Remover</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
