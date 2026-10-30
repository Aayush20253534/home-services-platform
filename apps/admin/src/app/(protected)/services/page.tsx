'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Archive, CheckCircle2, CirclePlus, FolderPlus, Pencil, RotateCcw, RefreshCw, Search, Wrench } from 'lucide-react';
import { DetailDialog, PageHeading, StatusPill } from '../../../components/ui';
import { type CatalogCategory, type CatalogService, formatRupees, rupeesToPaise, toSlug } from '../../../lib/catalog';

type FormState =
  | { kind: 'category'; id?: string; name: string; sortOrder: string; isActive: boolean }
  | { kind: 'service'; id?: string; name: string; description: string; categoryId: string; price: string; duration: string; pricingType: 'FIXED' | 'INSPECTION'; isActive: boolean };

const getError = (body: unknown, fallback: string) => {
  if (body && typeof body === 'object' && 'message' in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');
  }
  return fallback;
};

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`/api/catalog/${path}`, {
    ...options,
    headers: { ...(options?.body ? { 'Content-Type': 'application/json' } : {}) },
    cache: 'no-store',
  });
  if (response.status === 401) {
    window.location.assign('/api/auth/renew');
    throw new Error('Administrator session expired');
  }
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error(getError(data, 'Catalog operation failed'));
  return data as T;
}

export default function Services() {
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<FormState | null>(null);

  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [loadedCategories, loadedServices] = await Promise.all([
        apiRequest<CatalogCategory[]>('categories'),
        apiRequest<CatalogService[]>('services?limit=100'),
      ]);
      setCategories(loadedCategories);
      setServices(loadedServices);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load catalog');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  const visible = useMemo(() => services.filter((service) =>
    (filter === 'all' || service.categoryId === filter) &&
    [service.name, service.slug, service.category.name].some((text) => text.toLowerCase().includes(query.toLowerCase().trim())),
  ), [services, filter, query]);

  function newCategory() {
    setError('');
    setForm({ kind: 'category', name: '', sortOrder: String(categories.length + 1), isActive: true });
  }
  function editCategory(category: CatalogCategory) {
    setForm({ kind: 'category', id: category.id, name: category.name, sortOrder: String(category.sortOrder), isActive: category.isActive });
  }
  function newService() {
    setError('');
    setForm({
      kind: 'service', name: '', description: '', price: '', duration: '60', pricingType: 'FIXED',
      categoryId: categories.find((item) => item.isActive)?.id ?? '', isActive: true,
    });
  }
  function editService(service: CatalogService) {
    setForm({
      kind: 'service', id: service.id, name: service.name, description: service.description ?? '',
      categoryId: service.categoryId, price: (service.basePricePaise / 100).toFixed(2),
      duration: String(service.durationMinutes), pricingType: service.pricingType, isActive: service.isActive,
    });
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    const payload = form.kind === 'category'
      ? { name: form.name.trim(), ...(form.id ? {} : { slug: toSlug(form.name) }), sortOrder: Number(form.sortOrder), isActive: form.isActive }
      : {
          name: form.name.trim(), ...(form.id ? {} : { slug: toSlug(form.name) }),
          categoryId: form.categoryId, description: form.description.trim() || null,
          basePricePaise: rupeesToPaise(form.price), durationMinutes: Number(form.duration),
          pricingType: form.pricingType, isActive: form.isActive,
        };
    if (form.kind === 'service' && rupeesToPaise(form.price) === null) {
      setError('Enter a valid price with no more than two decimal places');
      return;
    }
    setSaving(true); setError(''); setNotice('');
    try {
      await apiRequest(`${form.kind === 'category' ? 'categories' : 'services'}${form.id ? `/${form.id}` : ''}`, {
        method: form.id ? 'PATCH' : 'POST', body: JSON.stringify(payload),
      });
      setForm(null);
      await reload();
      setNotice('Catalog changes saved to the database.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save'); }
    finally { setSaving(false); }
  }
  async function toggle(kind: 'category' | 'service', id: string, isActive: boolean) {
    if (!window.confirm(isActive ? (kind === 'category' ? 'Archive this category and hide all its services from customers?' : 'Archive this service?') : 'Restore this item?')) return;
    setSaving(true); setError(''); setNotice('');
    try {
      await apiRequest(`${kind === 'category' ? 'categories' : 'services'}/${id}`, {
        method: 'PATCH', body: JSON.stringify({ isActive: !isActive }),
      });
      await reload();
      setNotice(isActive ? 'Item archived; historical bookings remain intact.' : 'Item restored.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to update status'); }
    finally { setSaving(false); }
  }
  return (
    <>
      <PageHeading eyebrow="Live marketplace catalog" title="Services & categories"
        description="Manage the services and prices that customers actually see."
        action={<><button className="secondary-button" disabled={loading || saving} onClick={() => { void reload(); }}><RefreshCw size={15}/> Refresh</button>
          <button className="secondary-button" onClick={newCategory}><FolderPlus size={16}/> New category</button>
          <button className="primary-button" disabled={!categories.some((item) => item.isActive)} onClick={newService}><CirclePlus size={16}/> New service</button></>} />
      <div className="demo-alert"><CheckCircle2 size={17}/><span>Connected to PostgreSQL. Changes affect the public catalog. Archiving hides records without erasing booking history.</span></div>
      {error && <div className="catalog-feedback catalog-error" role="alert">{error}</div>}
      {notice && <div className="catalog-feedback catalog-ok" role="status">{notice}</div>}
      <section className="panel" style={{ marginBottom: 22 }}>
        <div className="panel-header"><div><h2>Categories</h2><p>{categories.length} database categories</p></div></div>
        {loading ? <p className="source-note">Loading categories...</p> : !categories.length ? <p className="source-note">No categories. Create one to start the catalog.</p> :
          <div className="catalog-category-list">
            {categories.map((category) => <div key={category.id} className="catalog-category">
              <div><b>{category.name}</b><p>{category.slug} · {category._count?.services ?? 0} services</p><StatusPill status={category.isActive ? 'Active' : 'Archived'}/></div>
              <div className="catalog-card-actions">
                <button className="secondary-button" onClick={() => editCategory(category)}><Pencil size={14}/> Edit</button>
                <button disabled={saving} className="secondary-button" onClick={() => { void toggle('category', category.id, category.isActive); }}>
                  {category.isActive ? <Archive size={14}/> : <RotateCcw size={14}/>}
                  {category.isActive ? 'Archive' : 'Restore'}
                </button>
              </div>
            </div>)}
          </div>}
      </section>
      <section className="panel">
        <div className="panel-header"><div><h2>Services</h2><p>{visible.length} of {services.length} records</p></div></div>
        <div className="toolbar">
          <label className="search-box"><Search size={17}/><input aria-label="Search services" placeholder="Search services..." value={query} onChange={(e) => setQuery(e.target.value)}/></label>
          <select className="catalog-select" aria-label="Filter by category" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
        <div className="table-scroll"><table><thead><tr><th>Service</th><th>Category</th><th>Price</th><th>Duration</th><th>Pricing</th><th>Visibility</th><th>Actions</th></tr></thead>
          <tbody>{visible.map((service) => <tr key={service.id}>
            <td><strong>{service.name}</strong><p className="source-note">{service.slug}</p></td>
            <td>{service.category.name}</td><td><strong>{formatRupees(service.basePricePaise)}</strong></td>
            <td>{service.durationMinutes} min</td><td>{service.pricingType === 'FIXED' ? 'Fixed' : 'Inspection'}</td>
            <td><StatusPill status={service.isActive && service.category.isActive ? 'Active' : 'Archived'}/></td>
            <td><button className="table-action" onClick={() => editService(service)}>Edit</button>
              <button className="table-action" disabled={saving} onClick={() => { void toggle('service', service.id, service.isActive); }}>{service.isActive ? 'Archive' : 'Restore'}</button></td>
          </tr>)}</tbody>
        </table></div>
        {!loading && !visible.length && <div className="empty-results">No matching services found.</div>}
        {loading && <p className="source-note">Loading service records...</p>}
      </section>
      {form && <DetailDialog title={form.id ? `Edit ${form.kind}` : `Create ${form.kind}`} onClose={() => { if (!saving) setForm(null); }}>
        <form className="form-stack" onSubmit={(event) => { void save(event); }}>
          <label>Name<input required maxLength={form.kind === 'category' ? 120 : 160} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}/></label>
          {!form.id && <p className="source-note">Slug: {toSlug(form.name) || '(enter a name)'}. Slugs are immutable after creation.</p>}
          {form.kind === 'category' ? <>
            <label>Display order<input type="number" min="0" max="10000" required value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}/></label>
          </> : <>
            <label>Category<select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
              <option value="">Select a category</option>{categories.filter((c) => c.isActive || c.id === form.categoryId).map((c) => <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (archived)'}</option>)}
            </select></label>
            <label>Description<input maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></label>
            <label>Pricing<select value={form.pricingType} onChange={(e) => setForm({ ...form, pricingType: e.target.value as 'FIXED' | 'INSPECTION' })}><option value="FIXED">Fixed price</option><option value="INSPECTION">Inspection fee</option></select></label>
            <label>Base price (INR)<input required inputMode="decimal" placeholder="799.00" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}/></label>
            <label>Duration (minutes)<input required type="number" min="1" max="1440" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}/></label>
          </>}
          <label className="catalog-check"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}/> Active and visible to customers</label>
          <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save to database'}</button>
        </form>
      </DetailDialog>}
    </>
  );
}
