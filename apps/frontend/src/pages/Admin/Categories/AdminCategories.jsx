import { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import '../Orders/AdminOrders.css'
import './AdminCategories.css'

function AdminCategories() {
  const { apiFetch } = useAuth()

  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Controla si el formulario está en modo edición o creación
  const [editing, setEditing] = useState(null) // null = creación, objeto = edición

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    sort_order: 0,
    is_active: true,
  })

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [formSuccess, setFormSuccess] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/categories')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar categorías')
      }
      const data = await res.json()
      // GET /api/categories devuelve directamente un array []
      setCategories(Array.isArray(data) ? data : data.categories || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Genera el slug automáticamente a partir del nombre
  function generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  function handleNameChange(e) {
    const name = e.target.value
    setForm(prev => ({
      ...prev,
      name,
      // Solo auto-generamos el slug si estamos creando
      ...(!editing && { slug: generateSlug(name) })
    }))
  }

  // Carga los datos de una categoría en el formulario para editarla
  function handleEdit(category) {
    setEditing(category)
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      sort_order: category.sort_order || 0,
      is_active: category.is_active,
    })
    setFormError(null)
    setFormSuccess(false)
    // Hacemos scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCancelEdit() {
    setEditing(null)
    setForm({ name: '', slug: '', description: '', sort_order: 0, is_active: true })
    setFormError(null)
    setFormSuccess(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    setFormSuccess(false)

    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        sort_order: parseInt(form.sort_order),
        // is_active solo se manda en edición — en creación el backend lo pone a true por defecto
        ...(editing && { is_active: form.is_active })
      }

      const res = await apiFetch(
        editing ? `/api/categories/${editing.id}` : '/api/categories',
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify(body)
        }
      )

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      setFormSuccess(true)
      await fetchCategories() // recargamos la lista

      if (!editing) {
        // Si era creación limpiamos el formulario
        handleCancelEdit()
      } else {
        // Si era edición actualizamos el objeto en edición con los nuevos datos
        setEditing(data)
      }
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`¿Eliminar la categoría "${name}"? Esta acción no se puede deshacer.`)) return

    try {
      const res = await apiFetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      // Si estábamos editando esta categoría, cancelamos la edición
      if (editing?.id === id) handleCancelEdit()
      setCategories(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="admin-categories">
      <h1 className="admin-page-title">Categorías</h1>

      <div className="admin-categories__layout">

        {/* Formulario — izquierda */}
        <div className="admin-card">
          <h2 className="admin-card__title">
            {editing ? `Editando: ${editing.name}` : 'Nueva categoría'}
          </h2>

          {formError && <div className="admin-error" style={{ marginBottom: 16 }}>{formError}</div>}
          {formSuccess && <div className="admin-success" style={{ marginBottom: 16 }}>Categoría guardada correctamente.</div>}

          <form className="admin-form" onSubmit={handleSubmit}>

            <div className="admin-form__field">
              <label className="admin-form__label">Nombre *</label>
              <input
                className="admin-input"
                type="text"
                name="name"
                value={form.name}
                onChange={handleNameChange}
                required
              />
            </div>

            <div className="admin-form__field">
              <label className="admin-form__label">Slug *</label>
              <input
                className="admin-input"
                type="text"
                name="slug"
                value={form.slug}
                onChange={handleChange}
                required
              />
            </div>

            <div className="admin-form__field">
              <label className="admin-form__label">Descripción</label>
              <textarea
                className="admin-input admin-textarea"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
              />
            </div>

            <div className="admin-form__field">
              <label className="admin-form__label">Orden</label>
              <input
                className="admin-input"
                type="number"
                name="sort_order"
                value={form.sort_order}
                onChange={handleChange}
                min="0"
              />
            </div>

            {/* is_active solo se muestra en edición */}
            {editing && (
              <div className="admin-form__field admin-form__field--checkbox">
                <label className="admin-form__label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={form.is_active}
                    onChange={handleChange}
                  />
                  Categoría activa
                </label>
              </div>
            )}

            <div className="admin-categories__form-actions">
              <button
                type="submit"
                className="admin-btn admin-btn--primary"
                disabled={saving}
              >
                {saving
                  ? 'Guardando...'
                  : editing ? 'Guardar cambios' : 'Crear categoría'
                }
              </button>

              {editing && (
                <button
                  type="button"
                  className="admin-btn"
                  onClick={handleCancelEdit}
                >
                  Cancelar
                </button>
              )}
            </div>

          </form>
        </div>

        {/* Lista de categorías — derecha */}
        <div className="admin-categories__list">
          <div className="admin-card__title" style={{ marginBottom: 16 }}>
            {categories.length} categorías
          </div>

          {error && <div className="admin-error">{error}</div>}

          {loading ? (
            <div className="admin-loading">Cargando categorías...</div>
          ) : categories.length === 0 ? (
            <div className="admin-empty">No hay categorías todavía.</div>
          ) : (
            <div className="admin-categories__items">
              {/* Ordenamos por sort_order antes de mostrar */}
              {[...categories]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(category => (
                  <div
                    key={category.id}
                    className={`admin-category-item ${editing?.id === category.id ? 'admin-category-item--active' : ''}`}
                  >
                    <div className="admin-category-item__info">
                      <span className="admin-category-item__name">{category.name}</span>
                      <span className="admin-category-item__slug">{category.slug}</span>
                      {!category.is_active && (
                        <span className="admin-category-item__inactive">Inactiva</span>
                      )}
                    </div>

                    <div className="admin-category-item__order">
                      #{category.sort_order}
                    </div>

                    <div className="admin-table__actions">
                      <button
                        className="admin-btn admin-btn--sm"
                        onClick={() => handleEdit(category)}
                      >
                        Editar
                      </button>
                      <button
                        className="admin-btn admin-btn--sm admin-btn--danger"
                        onClick={() => handleDelete(category.id, category.name)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default AdminCategories