import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import '../Orders/AdminOrders.css'
import './AdminProducts.css'

function AdminProductForm() {
  const { id } = useParams()         // undefined si es creación, string si es edición
  const navigate = useNavigate()
  const { apiFetch } = useAuth()

  const isEditing = !!id             // true si estamos editando

  // Campos del formulario — snake_case como espera el backend
  const [form, setForm] = useState({
    name: '',
    slug: '',
    short_description: '',
    description: '',
    price: '',
    material: '',
    is_featured: false,
    status: 'DRAFT',
  })

  const [loading, setLoading] = useState(isEditing) // si editamos cargamos datos
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Datos del producto completo (solo en edición) — para variantes e imágenes
  const [product, setProduct] = useState(null)

  useEffect(() => {
    if (isEditing) fetchProduct()
  }, [id])

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
        is_featured: data.is_featured || false,
        status: data.status || 'DRAFT',
      })
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

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const body = {
        ...form,
        price: parseFloat(form.price), // el backend espera number, no string
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
          <AdminImages productId={id} images={product.product_images} onRefresh={fetchProduct} />
        </>
      )}
    </div>
  )
}

// ── Componente de variantes ────────────────────────────────────────

function AdminVariants({ productId, variants, onRefresh }) {
  const { apiFetch } = useAuth()
  const [form, setForm] = useState({ sku: '', color: '', color_css: '', price: '', stock_qty: 0, is_active: true })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
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
      onRefresh() // recargamos el producto para ver la nueva variante
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteVariant(variantId) {
    if (!window.confirm('¿Eliminar esta variante?')) return
    try {
      const res = await apiFetch(`/api/variants/${variantId}`, { method: 'DELETE' })
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
                <td>
                  <button
                    className="admin-btn admin-btn--sm admin-btn--danger"
                    onClick={() => handleDeleteVariant(v.id)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
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

function AdminImages({ productId, images, onRefresh }) {
  const { apiFetch, accessToken } = useAuth()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)

  async function handleUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    setUploading(true)
    setError(null)

    try {
      // Las imágenes se suben como form-data, no JSON
      const formData = new FormData()
      formData.append('image', file)

      // apiFetch añade Content-Type: application/json — para form-data
      // hacemos el fetch directamente sin ese header
      const res = await fetch(`http://localhost:3000/api/products/${productId}/images`, {
        method: 'POST',
        headers: {
          // No ponemos Content-Type — el navegador lo añade automáticamente
          // con el boundary correcto para multipart/form-data
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      onRefresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
      e.target.value = '' // limpiamos el input para poder subir el mismo archivo otra vez
    }
  }

  async function handleSetPrimary(imageId) {
    try {
      const res = await apiFetch(`/api/products/${productId}/images/${imageId}/primary`, {
        method: 'PUT'
      })
      if (!res.ok) {
        const data = await res.json()
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
        throw new Error(data.error || 'Error al eliminar imagen')
      }
      onRefresh()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="admin-card admin-card--full" style={{ marginTop: 16 }}>
      <h2 className="admin-card__title">Imágenes</h2>

      {error && <div className="admin-error" style={{ marginBottom: 12 }}>{error}</div>}

      {/* Grid de imágenes existentes */}
      {images && images.length > 0 && (
        <div className="admin-images-grid">
          {images.map(img => (
            <div key={img.id} className="admin-image-card">
              <img src={img.url} alt="" className="admin-image-card__img" />
              {img.is_primary && (
                <span className="admin-image-card__badge">Principal</span>
              )}
              <div className="admin-image-card__actions">
                {!img.is_primary && (
                  <button
                    className="admin-btn admin-btn--sm"
                    onClick={() => handleSetPrimary(img.id)}
                  >
                    Principal
                  </button>
                )}
                <button
                  className="admin-btn admin-btn--sm admin-btn--danger"
                  onClick={() => handleDeleteImage(img.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload de nueva imagen */}
      <div className="admin-upload">
        <label className="admin-upload__label">
          {uploading ? 'Subiendo...' : '+ Subir imagen'}
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
        <p className="admin-upload__hint">Formatos: JPG, PNG, WebP</p>
      </div>
    </div>
  )
}

export default AdminProductForm