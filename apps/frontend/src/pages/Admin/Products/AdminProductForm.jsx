import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { API_URL, imageUrl } from '../../../config.js'
import '../Orders/AdminOrders.css'
import './AdminProducts.css'

// Formulario de alta y edición de producto. La misma pantalla sirve para
// ambos casos: lo decide la presencia del :id en la ruta.
// En edición añade además las secciones de variantes e imágenes.
function AdminProductForm() {
  const { id } = useParams()         // undefined si es creación, string si es edición
  const navigate = useNavigate()
  const { apiFetch } = useAuth()

  // Lista de todas las categorías disponibles (para pintar los checkboxes)
  const [categories, setCategories] = useState([])
  // IDs de las categorías marcadas — array de strings, ej: ["1", "2"]
  const [selectedCategories, setSelectedCategories] = useState([])

  const isEditing = !!id             // true si estamos editando

  // Campos del formulario — snake_case como espera el backend
  const [form, setForm] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    price: '',
    material: '',
    care: '',
    is_featured: false,
    status: 'DRAFT',
  })

  const [loading, setLoading] = useState(isEditing) // si editamos cargamos datos
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Datos del producto completo (solo en edición) — para variantes e imágenes
  const [product, setProduct] = useState(null)

  // Solo en edición se piden los datos del producto; en creación el
  // formulario arranca vacío. Depende de [id] para recargar si se navega
  // de un producto a otro sin desmontar el componente.
  useEffect(() => {
    if (isEditing) fetchProduct()
  }, [id])

  // Cargamos las categorías disponibles una sola vez al montar el componente.
  // Se necesita tanto al crear como al editar, por eso no depende de isEditing.
  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await apiFetch('/api/categories')
        if (res.ok) {
          const data = await res.json()
          setCategories(data)   // el endpoint devuelve un array plano
        }
      } catch (err) {
        console.error('Error cargando categorías:', err)
      }
    }
    fetchCategories()
  }, [])   // [] = solo una vez al montar

  // Carga el producto y vuelca sus datos al formulario. Se pasa como
  // onRefresh a las secciones de variantes e imágenes para que, tras
  // cualquier cambio suyo, se repinte todo con los datos ya guardados.
  async function fetchProduct() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/products/${id}`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al cargar el producto')
      }
      const data = await res.json()
      setProduct(data)
      // Rellenamos el formulario con los datos existentes
      setForm({
        name: data.name || '',
        slug: data.slug || '',
        short_description: data.short_description || '',
        description: data.description || '',
        price: data.price || '',
        material: data.material || '',
        care: data.care || '',
        is_featured: data.is_featured || false,
        status: data.status || 'DRAFT',
      })
      // Pre-marcamos las categorías que el producto ya tiene.
      // La API las devuelve como [{ category_id: "1", categories: {...} }, ...]
      // así que extraemos solo los category_id para el estado.
      setSelectedCategories(
        (data.product_categories || []).map(pc => pc.category_id)
      )
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
      // Los checkboxes usan checked en lugar de value
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Genera el slug automáticamente a partir del nombre
  function generateSlug(name) {
    return name
      .toLowerCase()
      .normalize('NFD')                    // separa letras de acentos
      .replace(/[\u0300-\u036f]/g, '')     // elimina los acentos
      .replace(/[^a-z0-9\s-]/g, '')       // elimina caracteres especiales
      .replace(/\s+/g, '-')               // espacios por guiones
      .replace(/-+/g, '-')               // guiones múltiples por uno
      .trim()
  }

  function handleNameChange(e) {
    const name = e.target.value
    setForm(prev => ({
      ...prev,
      name,
      // Solo auto-generamos el slug si estamos creando (no editando)
      ...(!isEditing && { slug: generateSlug(name) })
    }))
  }

  // Añade o quita un category_id del array de seleccionadas (toggle).
  function toggleCategory(categoryId) {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)   // ya estaba → la quitamos
        : [...prev, categoryId]                   // no estaba → la añadimos
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const body = {
        ...form,
        price: parseFloat(form.price), // el backend espera number, no 
        category_ids: selectedCategories,
      }

      const res = await apiFetch(
        isEditing ? `/api/products/${id}` : '/api/products',
        {
          method: isEditing ? 'PUT' : 'POST',
          body: JSON.stringify(body)
        }
      )

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al guardar el producto')
      }

      if (isEditing) {
        setSuccess(true)
        setProduct(data) // actualizamos los datos del producto
      } else {
        // Si es creación navegamos al formulario de edición del producto creado
        navigate(`/admin/productos/${data.id}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="admin-loading">Cargando...</div>

  return (
    <div className="admin-product-form">
      <button className="admin-btn-back" onClick={() => navigate('/admin/productos')}>
        ← Volver a productos
      </button>

      <h1 className="admin-page-title">
        {isEditing ? `Editar: ${product?.name}` : 'Nuevo producto'}
      </h1>

      {/* Formulario principal */}
      <div className="admin-card admin-card--full">
        <h2 className="admin-card__title">Información del producto</h2>

        {error && <div className="admin-error" style={{ marginBottom: 16 }}>{error}</div>}
        {success && <div className="admin-success" style={{ marginBottom: 16 }}>Producto guardado correctamente.</div>}

        <form className="admin-form" onSubmit={handleSubmit}>

          <div className="admin-form__row">
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
          </div>

          {/* ── Selector de categorías (checkboxes, multi-selección) ── */}
          <div className="admin-form__field">
            <label className="admin-form__label">Categorías</label>
            <div className="admin-form__checkbox-group">
              {categories.length === 0 ? (
                <p className="admin-empty">No hay categorías disponibles.</p>
              ) : (
                categories.map(cat => (
                  <label key={cat.id} className="admin-form__checkbox-item">
                    <input
                      type="checkbox"
                      // marcado si su id está en el array de seleccionadas
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                    />
                    {cat.name}
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">Descripción corta</label>
            <input
              className="admin-input"
              type="text"
              name="short_description"
              value={form.short_description}
              onChange={handleChange}
              placeholder="Máximo 160 caracteres"
            />
          </div>

          <div className="admin-form__field">
            <label className="admin-form__label">Descripción larga</label>
            <textarea
              className="admin-input admin-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
            />
          </div>

          <div className="admin-form__field">
              <label className="admin-form__label">Cuidados</label>
              <textarea
              className="admin-input admin-textarea"
              name="care"
              value={form.care}
              onChange={handleChange}
              rows={3}
              placeholder="Ej: Lavar a mano, no usar secadora..."
            />
          </div>

          <div className="admin-form__row">
            <div className="admin-form__field">
              <label className="admin-form__label">Precio (€) *</label>
              <input
                className="admin-input"
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
              />
            </div>
            <div className="admin-form__field">
              <label className="admin-form__label">Material</label>
              <input
                className="admin-input"
                type="text"
                name="material"
                value={form.material}
                onChange={handleChange}
                placeholder="Cuero, lino, ante..."
              />
            </div>
          </div>

          <div className="admin-form__row">
            <div className="admin-form__field">
              <label className="admin-form__label">Estado</label>
              <select
                className="admin-input admin-select"
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
              </select>
            </div>
            <div className="admin-form__field admin-form__field--checkbox">
              <label className="admin-form__label">
                <input
                  type="checkbox"
                  name="is_featured"
                  checked={form.is_featured}
                  onChange={handleChange}
                />
                Producto destacado
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="admin-btn admin-btn--primary"
            disabled={saving}
          >
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}
          </button>

        </form>
      </div>

      {/* Secciones de variantes e imágenes — solo en edición */}
      {isEditing && product && (
        <>
          <AdminVariants productId={id} variants={product.product_variants} onRefresh={fetchProduct} />
          <AdminImages productId={id} images={product.product_images} variants={product.product_variants} onRefresh={fetchProduct} />
        </>
      )}
    </div>
  )
}

// ── Componente de variantes ────────────────────────────────────────

function AdminVariants({ productId, variants, onRefresh }) {
  const { apiFetch } = useAuth()

  // Formulario de creación
  const [form, setForm] = useState({ sku: '', color: '', color_css: '', price: '', stock_qty: 0, is_active: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  // Estado de edición — guarda el id de la variante que se está editando
  const [editingId, setEditingId] = useState(null)
  // Formulario de edición (separado del de creación)
  const [editForm, setEditForm] = useState({ sku: '', color: '', color_css: '', price: '', stock_qty: 0, is_active: true })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState(null)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleEditChange(e) {
    const { name, value, type, checked } = e.target
    setEditForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = {
        sku: form.sku,
        color: form.color,
        stock_qty: parseInt(form.stock_qty),
        is_active: form.is_active,
        ...(form.color_css && { color_css: form.color_css }),
        ...(form.price ? { price: parseFloat(form.price) } : {}),
      }
      const res = await apiFetch(`/api/products/${productId}/variants`, {
        method: 'POST',
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear variante')
      setForm({ sku: '', color: '', color_css: '', price: '', stock_qty: 0, is_active: true })
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  // Abre el formulario de edición y lo rellena con los datos de la variante.
  // Nota: la API devuelve las variantes con name/css, pero el PUT espera color/color_css.
  function startEdit(v) {
    setEditingId(v.id)
    setEditError(null)
    setEditForm({
      sku: v.sku || '',
      color: v.name || '',           // la API devuelve name, el form usa color
      color_css: v.css || '',        // la API devuelve css, el form usa color_css
      price: v.price ?? '',          // puede ser null si usa el del producto
      stock_qty: v.stock_qty ?? 0,
      is_active: v.is_active,
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setEditError(null)
  }

  async function handleUpdate(e) {
    e.preventDefault()
    setEditSaving(true)
    setEditError(null)
    try {
      const body = {
        sku: editForm.sku,
        color: editForm.color,
        stock_qty: parseInt(editForm.stock_qty),
        is_active: editForm.is_active,
        ...(editForm.color_css && { color_css: editForm.color_css }),
        // Si el precio está vacío mandamos null para que use el del producto
        price: editForm.price === '' ? null : parseFloat(editForm.price),
      }
      const res = await apiFetch(`/api/products/${productId}/variants/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al editar la variante')
      setEditingId(null)
      onRefresh()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  async function handleDeleteVariant(variantId) {
    if (!window.confirm('¿Eliminar esta variante?')) return
    try {
      const res = await apiFetch(`/api/products/${productId}/variants/${variantId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al eliminar')
      }
      onRefresh()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="admin-card admin-card--full" style={{ marginTop: 16 }}>
      <h2 className="admin-card__title">Variantes de color</h2>

      {/* Lista de variantes existentes */}
      {variants && variants.length > 0 && (
        <table className="admin-table" style={{ marginBottom: 24 }}>
          <thead>
            <tr>
              <th>Color</th>
              <th>SKU</th>
              <th>CSS</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Activa</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {variants.map(v => (
              // Fragment para poder renderizar la fila normal + la fila de edición
              editingId === v.id ? (
                // ── Fila en modo edición ──
                <tr key={v.id}>
                  <td colSpan={7}>
                    {editError && <div className="admin-error" style={{ marginBottom: 12 }}>{editError}</div>}
                    <form className="admin-form" onSubmit={handleUpdate}>
                      <div className="admin-form__row">
                        <div className="admin-form__field">
                          <label className="admin-form__label">SKU *</label>
                          <input className="admin-input" type="text" name="sku" value={editForm.sku} onChange={handleEditChange} required />
                        </div>
                        <div className="admin-form__field">
                          <label className="admin-form__label">Color *</label>
                          <input className="admin-input" type="text" name="color" value={editForm.color} onChange={handleEditChange} required />
                        </div>
                        <div className="admin-form__field">
                          <label className="admin-form__label">CSS color</label>
                          <input className="admin-input" type="text" name="color_css" value={editForm.color_css} onChange={handleEditChange} placeholder="#000000" />
                        </div>
                      </div>
                      <div className="admin-form__row">
                        <div className="admin-form__field">
                          <label className="admin-form__label">Precio (€, opcional)</label>
                          <input className="admin-input" type="number" name="price" value={editForm.price} onChange={handleEditChange} step="0.01" min="0" placeholder="Si vacío usa precio del producto" />
                        </div>
                        <div className="admin-form__field">
                          <label className="admin-form__label">Stock</label>
                          <input className="admin-input" type="number" name="stock_qty" value={editForm.stock_qty} onChange={handleEditChange} min="0" />
                        </div>
                        <div className="admin-form__field admin-form__field--checkbox">
                          <label className="admin-form__label">
                            <input type="checkbox" name="is_active" checked={editForm.is_active} onChange={handleEditChange} />
                            Activa
                          </label>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" className="admin-btn admin-btn--primary" disabled={editSaving}>
                          {editSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button type="button" className="admin-btn" onClick={cancelEdit}>
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                // ── Fila normal ──
                <tr key={v.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: v.css || '#ccc', border: '1px solid var(--sand)'
                      }} />
                      {v.name}
                    </div>
                  </td>
                  <td className="admin-table__mono">{v.sku}</td>
                  <td className="admin-table__mono">{v.css || '—'}</td>
                  <td>{v.price ? `${v.price}€` : 'Del producto'}</td>
                  <td>{v.stock_qty}</td>
                  <td>{v.is_active ? '✓' : '—'}</td>
                  <td className="admin-table__actions">
                    <button className="admin-btn admin-btn--sm" onClick={() => startEdit(v)}>
                      Editar
                    </button>
                    <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDeleteVariant(v.id)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              )
            ))}
          </tbody>
        </table>
      )}

      {/* Formulario para añadir variante */}
      <h3 className="admin-form__subtitle">Añadir variante</h3>
      {error && <div className="admin-error" style={{ marginBottom: 12 }}>{error}</div>}

      <form className="admin-form" onSubmit={handleCreate}>
        <div className="admin-form__row">
          <div className="admin-form__field">
            <label className="admin-form__label">SKU *</label>
            <input className="admin-input" type="text" name="sku" value={form.sku} onChange={handleChange} placeholder="BMC-NEGRO" required />
          </div>
          <div className="admin-form__field">
            <label className="admin-form__label">Color *</label>
            <input className="admin-input" type="text" name="color" value={form.color} onChange={handleChange} placeholder="Negro" required />
          </div>
          <div className="admin-form__field">
            <label className="admin-form__label">CSS color</label>
            <input className="admin-input" type="text" name="color_css" value={form.color_css} onChange={handleChange} placeholder="#000000" />
          </div>
        </div>
        <div className="admin-form__row">
          <div className="admin-form__field">
            <label className="admin-form__label">Precio (€, opcional)</label>
            <input className="admin-input" type="number" name="price" value={form.price} onChange={handleChange} step="0.01" min="0" placeholder="Si vacío usa precio del producto" />
          </div>
          <div className="admin-form__field">
            <label className="admin-form__label">Stock</label>
            <input className="admin-input" type="number" name="stock_qty" value={form.stock_qty} onChange={handleChange} min="0" />
          </div>
          <div className="admin-form__field admin-form__field--checkbox">
            <label className="admin-form__label">
              <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} />
              Activa
            </label>
          </div>
        </div>
        <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
          {saving ? 'Añadiendo...' : 'Añadir variante'}
        </button>
      </form>
    </div>
  )
}

// ── Componente de imágenes ─────────────────────────────────────────

function AdminImages({ productId, images, variants, onRefresh }) {
  const { apiFetch, accessToken } = useAuth()
  const [error, setError] = useState(null)
  // Guarda qué grupo está subiendo imagen ('product' o el id de la variante)
  const [uploadingTo, setUploadingTo] = useState(null)

  // Sube una imagen. variantId puede ser null (producto general) o el id de una variante.
  async function handleUpload(e, variantId) {
    const file = e.target.files[0]
    if (!file) return

    setUploadingTo(variantId || 'product')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)
      // Si hay variantId lo añadimos al form-data
      if (variantId) formData.append('variant_id', variantId)

      // Aquí se usa fetch directo y no apiFetch: apiFetch fuerza
      // Content-Type: application/json, y con FormData el navegador tiene que
      // poner él mismo el multipart/form-data con su boundary.
      const res = await fetch(`${API_URL}/api/products/${productId}/images`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 401) throw new Error('Sesión expirada. Vuelve a iniciar sesión.')
        if (res.status === 403) throw new Error('No tienes permisos para subir imágenes.')
        throw new Error(data.error || 'Error al subir imagen')
      }
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingTo(null)
      e.target.value = ''
    }
  }

  async function handleSetPrimary(imageId) {
    try {
      const res = await apiFetch(`/api/products/${productId}/images/${imageId}/primary`, {
        method: 'PUT'
      })
      if (!res.ok) {
        const data = await res.json()
        if (res.status === 403) throw new Error('No tienes permisos para esta acción.')
        throw new Error(data.error || 'Error al marcar como principal')
      }
      onRefresh()
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleDeleteImage(imageId) {
    if (!window.confirm('¿Eliminar esta imagen?')) return
    try {
      const res = await apiFetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const data = await res.json()
        if (res.status === 403) throw new Error('No tienes permisos para esta acción.')
        throw new Error(data.error || 'Error al eliminar imagen')
      }
      onRefresh()
    } catch (err) {
      alert(err.message)
    }
  }

  // Reasigna una imagen a otra variante (o al producto general si variantId es null).
  // Usa el nuevo endpoint PATCH.
  async function handleReassign(imageId, variantId) {
    try {
      const res = await apiFetch(`/api/products/${productId}/images/${imageId}`, {
        method: 'PATCH',
        // variantId puede ser '' (string vacío) que convertimos a null
        body: JSON.stringify({ variant_id: variantId || null })
      })
      if (!res.ok) {
        const data = await res.json()
        if (res.status === 403) throw new Error('No tienes permisos para esta acción.')
        throw new Error(data.error || 'Error al reasignar imagen')
      }
      onRefresh()
    } catch (err) {
      alert(err.message)
    }
  }

  // Imágenes del producto general (sin variante)
  const productImages = (images || []).filter(img => img.variant_id === null)

  // Renderiza una imagen con sus acciones. Recibe también el variant_id actual
  // para el selector de reasignación.
  function renderImage(img) {
    return (
      <div key={img.id} className="admin-image-card">
        <img src={imageUrl(img.url)} alt={img.alt_text || ''} className="admin-image-card__img" />
        {img.is_primary && (
          <span className="admin-image-card__badge">Principal</span>
        )}
        <div className="admin-image-card__actions">
          {!img.is_primary && (
            <button className="admin-btn admin-btn--sm" onClick={() => handleSetPrimary(img.id)}>
              Principal
            </button>
          )}
          <button className="admin-btn admin-btn--sm admin-btn--danger" onClick={() => handleDeleteImage(img.id)}>
            Eliminar
          </button>
        </div>

        {/* Selector para reasignar la imagen a otra variante o al producto */}
        {variants && variants.length > 0 && (
          <select
            className="admin-input admin-select admin-image-card__reassign"
            value={img.variant_id || ''}
            onChange={e => handleReassign(img.id, e.target.value)}
          >
            <option value="">Producto general</option>
            {variants.map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        )}
      </div>
    )
  }

  // Botón de subida reutilizable. variantId null = producto general.
  function renderUploadButton(variantId) {
    const key = variantId || 'product'
    const isUploading = uploadingTo === key
    return (
      <div className="admin-upload" style={{ marginTop: 12 }}>
        <label className="admin-upload__label">
          {isUploading ? 'Subiendo...' : '+ Subir imagen'}
          <input
            type="file"
            accept="image/*"
            onChange={e => handleUpload(e, variantId)}
            disabled={isUploading}
            style={{ display: 'none' }}
          />
        </label>
        <p className="admin-upload__hint">Formatos: JPG, PNG, WebP</p>
      </div>
    )
  }

  return (
    <div className="admin-card admin-card--full" style={{ marginTop: 16 }}>
      <h2 className="admin-card__title">Imágenes</h2>

      {error && <div className="admin-error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* ── Grupo: imágenes del producto general ── */}
      <div style={{ marginBottom: 32 }}>
        <h3 className="admin-form__subtitle">Imágenes del producto</h3>
        {productImages.length > 0 ? (
          <div className="admin-images-grid">
            {productImages.map(renderImage)}
          </div>
        ) : (
          <p className="admin-empty">No hay imágenes del producto general.</p>
        )}
        {renderUploadButton(null)}
      </div>

      {/* ── Un grupo por cada variante ── */}
      {variants && variants.map(variant => {
        // Imágenes de esta variante — comparamos ids como strings
        const variantImages = (images || []).filter(
          img => String(img.variant_id) === String(variant.id)
        )

        return (
          <div key={variant.id} style={{ marginBottom: 32 }}>
            <h3 className="admin-form__subtitle" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Círculo del color de la variante */}
              <span style={{
                display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
                background: variant.css || '#ccc', border: '1px solid var(--sand)'
              }} />
              Imágenes de {variant.name}
            </h3>

            {variantImages.length > 0 ? (
              <div className="admin-images-grid">
                {variantImages.map(renderImage)}
              </div>
            ) : (
              <p className="admin-empty">Esta variante no tiene imágenes.</p>
            )}

            {renderUploadButton(variant.id)}
          </div>
        )
      })}

    </div>
  )
}

export default AdminProductForm