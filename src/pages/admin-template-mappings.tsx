import React, { useEffect, useState } from 'react';
import { createMapping, deleteMapping, getMappings, updateMapping } from '../lib/adminApi';

type Mapping = { id: string; activity: string; template_key: string; template_language?: string };

export default function AdminTemplateMappings() {
    const [mappings, setMappings] = useState<Mapping[]>([]);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ activity: '', template_key: '', template_language: 'en' });
    const [editingId, setEditingId] = useState<string | null>(null);

    async function load() {
        setLoading(true);
        try {
            const data = await getMappings();
            setMappings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            alert(String(err));
        } finally { setLoading(false); }
    }

    useEffect(() => { load(); }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (editingId) {
                await updateMapping(editingId, form);
                setEditingId(null);
            } else {
                await createMapping(form);
            }
            setForm({ activity: '', template_key: '', template_language: 'en' });
            await load();
        } catch (err) { alert(String(err)); }
    }

    async function handleDelete(id: string) {
        if (!confirm('Delete mapping?')) return;
        try { await deleteMapping(id); await load(); } catch (err) { alert(String(err)); }
    }

    function startEdit(m: Mapping) {
        setEditingId(m.id);
        setForm({ activity: m.activity, template_key: m.template_key, template_language: m.template_language || 'en' });
    }

    return (
        <div style={{ padding: 20 }}>
            <h2>Activity → Template mappings</h2>
            <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
                <input placeholder="activity" value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })} />
                <input placeholder="template_key" value={form.template_key} onChange={e => setForm({ ...form, template_key: e.target.value })} />
                <input placeholder="language" value={form.template_language} onChange={e => setForm({ ...form, template_language: e.target.value })} />
                <button type="submit">{editingId ? 'Update' : 'Create'}</button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ activity: '', template_key: '', template_language: 'en' }); }}>Cancel</button>}
            </form>

            {loading ? <div>Loading…</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr><th>Activity</th><th>Template Key</th><th>Lang</th><th>Actions</th></tr></thead>
                    <tbody>
                        {mappings.map(m => (
                            <tr key={m.id}>
                                <td>{m.activity}</td>
                                <td>{m.template_key}</td>
                                <td>{m.template_language}</td>
                                <td>
                                    <button onClick={() => startEdit(m)}>Edit</button>
                                    <button onClick={() => handleDelete(m.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
