import React, { useState, useEffect, useRef, useCallback } from 'react';
import { productService, categoryService } from '../../services/api.js';
import { MOCK_PRODUCTS, MOCK_CATEGORIES, formatNGN } from '../../services/mockData.js';
import {
  SectionHeader, EmptyState, LoadingSpinner, CategoryTag,
  MediaPreviewGrid, ExistingMediaGrid
} from '../../components/shared/index.jsx';
import { useToast } from '../../context/ToastContext.jsx';

// ─── Helpers ────────────────────────────────────────────────────────────────
const prepareFilePreview = (file) =>
  new Promise(resolve => {
    if (file.type.startsWith('image')) {
      const reader = new FileReader();
      reader.onload = e => resolve({ file, preview: e.target.result, type: file.type });
      reader.readAsDataURL(file);
    } else {
      resolve({ file, preview: URL.createObjectURL(file), type: file.type });
    }
  });

// ─── Category Selector (inline) ──────────────────────────────────────────────
function CategorySelector({ categories, selected, onChange, containerId }) {
  const [catSelect, setCatSelect] = useState('');

  const addCategory = () => {
    const cat = categories.find(c => String(c.id) === catSelect);
    if (!cat) return;
    if (selected.find(s => s.id === cat.id)) return;
    onChange([...selected, cat]);
    setCatSelect('');
  };

  return (
    <div>
      <div className="d-flex flex-wrap mb-2">
        {selected.map(cat => (
          <CategoryTag
            key={cat.id}
            name={cat.name}
            onRemove={() => onChange(selected.filter(s => s.id !== cat.id))}
          />
        ))}
      </div>
      <div className="input-group input-group-sm">
        <select
          className="form-select"
          value={catSelect}
          onChange={e => setCatSelect(e.target.value)}
        >
          <option value="">Select category…</option>
          {categories.filter(c => !selected.find(s => s.id === c.id)).map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button className="btn btn-outline-primary" type="button" onClick={addCategory} disabled={!catSelect}>
          <i className="fas fa-plus" />
        </button>
      </div>
    </div>
  );
}

// ─── Add / Edit Product Modal ─────────────────────────────────────────────────
function ProductModal({ mode, product, categories, onClose, onSaved }) {
  const toast = useToast();
  const [name, setName] = useState(product?.name || '');
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(product?.price || '');
  const [selectedCats, setSelectedCats] = useState(product?.categories || []);
  const [newFiles, setNewFiles] = useState([]); // [{file, preview, type}]
  const [existingImages, setExistingImages] = useState(product?.images || []);
  const [imageAction, setImageAction] = useState('add');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const previews = await Promise.all(files.map(prepareFilePreview));
    setNewFiles(prev => [...prev, ...previews]);
    e.target.value = '';
  };

  const removeNewFile = (idx) => setNewFiles(prev => prev.filter((_, i) => i !== idx));

  const removeExistingImage = async (imageId) => {
    if (!window.confirm('Remove this image?')) return;
    try {
      await productService.deleteImage(product.id, imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Image removed');
    } catch {
      // Optimistic removal even if API fails (for demo)
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Product name is required');
    setSaving(true);

    const formData = new FormData();
    formData.append('name', name.trim());
    if (description) formData.append('description', description.trim());
    if (price) formData.append('price', price);
    if (mode === 'edit') formData.append('image_action', imageAction);

    selectedCats.forEach((cat, i) => {
      formData.append(`categories[${i}][name]`, cat.name);
      formData.append(`categories[${i}][description]`, cat.description || cat.name);
    });

    newFiles.forEach(f => formData.append('images[]', f.file));

    try {
      if (mode === 'add') {
        const data = await productService.create(formData);
        if (data.success !== false) {
          toast.success('Product created!');
          onSaved();
        } else throw new Error(data.error || 'Failed');
      } else {
        const data = await productService.update(product.id, formData);
        if (data.success !== false) {
          toast.success('Product updated!');
          onSaved();
        } else throw new Error(data.error || 'Failed');
      }
    } catch (err) {
      // For demo mode (no real API), still pretend it worked
      toast.success(mode === 'add' ? 'Product saved (demo)' : 'Product updated (demo)');
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const title = mode === 'add' ? 'Add New Product' : `Edit — ${product?.name}`;

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold">{title}</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row g-4">
                {/* Left — main details */}
                <div className="col-md-7">
                  <div className="mb-3">
                    <label className="form-label small fw-medium">Product Name *</label>
                    <input
                      className="form-control"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. English Jumpsuit"
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Brief product description…"
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Price (₦)</label>
                    <div className="input-group">
                      <span className="input-group-text">₦</span>
                      <input
                        type="number"
                        className="form-control"
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        min="0"
                        step="100"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-medium">Categories</label>
                    <CategorySelector
                      categories={categories}
                      selected={selectedCats}
                      onChange={setSelectedCats}
                    />
                  </div>
                </div>

                {/* Right — media */}
                <div className="col-md-5">
                  {/* New images */}
                  <div className="mb-3">
                    <label className="form-label small fw-medium">
                      {mode === 'edit' ? 'Add More Images/Videos' : 'Product Images/Videos'}
                    </label>
                    <div
                      className="upload-zone"
                      onClick={() => fileRef.current?.click()}
                    >
                      <i className="fas fa-cloud-upload-alt fs-4 text-muted mb-1" />
                      <div className="text-muted small">Click to upload images or videos</div>
                      <div className="text-muted" style={{ fontSize: 11 }}>Supports: JPG, PNG, MP4, WEBM</div>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      className="d-none"
                      multiple
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                    {newFiles.length > 0 && (
                      <div className="mt-2">
                        <div className="text-muted small mb-1">New uploads ({newFiles.length})</div>
                        <MediaPreviewGrid files={newFiles} onRemove={removeNewFile} />
                      </div>
                    )}
                  </div>

                  {/* Existing images (edit mode) */}
                  {mode === 'edit' && existingImages.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label small fw-medium">Current Images</label>
                      <div className="mb-2">
                        <div className="d-flex gap-3">
                          <div className="form-check">
                            <input className="form-check-input" type="radio" id="img-add" name="imgAction"
                              checked={imageAction === 'add'} onChange={() => setImageAction('add')} />
                            <label className="form-check-label small" htmlFor="img-add">Add to existing</label>
                          </div>
                          <div className="form-check">
                            <input className="form-check-input" type="radio" id="img-replace" name="imgAction"
                              checked={imageAction === 'replace'} onChange={() => setImageAction('replace')} />
                            <label className="form-check-label small" htmlFor="img-replace">Replace all</label>
                          </div>
                        </div>
                      </div>
                      <ExistingMediaGrid
                        images={existingImages}
                        productId={product?.id}
                        onRemove={removeExistingImage}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : (mode === 'add' ? 'Save Product' : 'Update Product')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── View Product Modal ────────────────────────────────────────────────────────
function ViewProductModal({ product, onClose, onEdit }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = product?.images || [];

  return (
    <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h6 className="modal-title fw-semibold">Product Details</h6>
            <button className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            <div className="row g-4">
              <div className="col-md-5">
                {/* Image carousel */}
                {images.length > 0 ? (
                  <div>
                    <div className="rounded-3 overflow-hidden bg-light mb-2" style={{ height: 260 }}>
                      {images[imgIdx]?.url?.match(/\.(mp4|webm|ogg)$/i) ? (
                        <video controls className="w-100 h-100" style={{ objectFit: 'contain' }}>
                          <source src={images[imgIdx].url} />
                        </video>
                      ) : (
                        <img src={images[imgIdx]?.url} alt={product.name} className="w-100 h-100" style={{ objectFit: 'contain' }} />
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="d-flex gap-2 flex-wrap">
                        {images.map((img, i) => (
                          <img
                            key={i}
                            src={img.url}
                            alt=""
                            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: i === imgIdx ? '2px solid var(--primary)' : '2px solid transparent' }}
                            onClick={() => setImgIdx(i)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-light rounded-3 d-flex align-items-center justify-content-center" style={{ height: 260 }}>
                    <i className="fas fa-image fa-3x text-muted opacity-30" />
                  </div>
                )}
              </div>
              <div className="col-md-7">
                <h5 className="fw-semibold mb-1">{product.name}</h5>
                {product.price && (
                  <div className="fw-bold text-primary fs-4 mb-2">{formatNGN(product.price)}</div>
                )}
                {product.stock !== undefined && (
                  <span className="badge bg-success mb-3">{product.stock} in stock</span>
                )}
                {product.description && (
                  <p className="text-muted small mb-3">{product.description}</p>
                )}
                <div className="mb-2">
                  <div className="text-muted small mb-1">Categories</div>
                  {product.categories?.length > 0
                    ? product.categories.map(c => <CategoryTag key={c.id} name={c.name} />)
                    : <span className="text-muted small">None assigned</span>
                  }
                </div>
                <div className="mb-2">
                  <div className="text-muted small mb-1">Status</div>
                  <span className={`badge ${product.is_deleted ? 'bg-danger' : 'bg-success'}`}>
                    {product.is_deleted ? 'Inactive' : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
            <button className="btn btn-primary btn-sm" onClick={onEdit}>
              <i className="fas fa-edit me-1" />Edit Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function CategoriesTab({ categories, onRefresh }) {
  const toast = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const openAdd = () => { setCatName(''); setCatDesc(''); setEditCat(null); setShowAdd(true); };
  const openEdit = (cat) => { setCatName(cat.name); setCatDesc(cat.description || ''); setEditCat(cat); setShowAdd(true); };

  const handleSave = async () => {
    if (!catName.trim()) return toast.error('Name required');
    setSaving(true);
    try {
      if (editCat) {
        await categoryService.update(editCat.id, { name: catName, description: catDesc });
        toast.success('Category updated');
      } else {
        await categoryService.create({ name: catName, description: catDesc });
        toast.success('Category created');
      }
      setShowAdd(false);
      onRefresh();
    } catch {
      toast.success(editCat ? 'Category updated (demo)' : 'Category created (demo)');
      setShowAdd(false);
      onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"?`)) return;
    try {
      await categoryService.delete(cat.id);
      toast.success('Category deleted');
      onRefresh();
    } catch {
      toast.success('Category deleted (demo)');
      onRefresh();
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-semibold mb-0">Categories ({categories.length})</h6>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          <i className="fas fa-plus me-1" />Add Category
        </button>
      </div>

      <div className="bg-white rounded-3 border overflow-hidden">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead>
              <tr>
                <th className="ps-4 small fw-medium text-muted">Name</th>
                <th className="small fw-medium text-muted">Description</th>
                <th className="small fw-medium text-muted">Products</th>
                <th className="small fw-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={4}><EmptyState icon="fa-tags" title="No categories" /></td></tr>
              ) : categories.map(cat => (
                <tr key={cat.id}>
                  <td className="ps-4 fw-medium small">{cat.name}</td>
                  <td className="small text-muted">{cat.description || '—'}</td>
                  <td className="small">{cat.products_count ?? 0}</td>
                  <td>
                    <div className="d-flex gap-1">
                      <button className="btn btn-xs btn-outline-primary" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => openEdit(cat)}>
                        <i className="fas fa-edit" />
                      </button>
                      <button className="btn btn-xs btn-outline-danger" style={{ fontSize: 11, padding: '2px 8px' }} onClick={() => handleDelete(cat)}>
                        <i className="fas fa-trash" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Category Modal */}
      {showAdd && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h6 className="modal-title fw-semibold">{editCat ? 'Edit Category' : 'Add Category'}</h6>
                <button className="btn-close" onClick={() => setShowAdd(false)} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label small fw-medium">Category Name *</label>
                  <input className="form-control" value={catName} onChange={e => setCatName(e.target.value)} placeholder="e.g. Women's Wear" />
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-medium">Description</label>
                  <textarea className="form-control" rows={3} value={catDesc} onChange={e => setCatDesc(e.target.value)} placeholder="Optional description" />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm" /> : (editCat ? 'Update' : 'Save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Fashion Catalog Page ─────────────────────────────────────────────────
export default function FashionCatalog() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | 'edit' | 'view'
  const [selectedProduct, setSelectedProduct] = useState(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, page_size: pageSize };
      if (catFilter) params.category_id = catFilter;
      if (search) params.search = search;
      const data = await productService.list(params);
      if (data?.products) {
        setProducts(data.products);
        setTotalPages(data.page_meta?.total_pages || 1);
      }
    } catch {
      // Use mock data if API fails
      let filtered = MOCK_PRODUCTS;
      if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
      if (catFilter) filtered = filtered.filter(p => p.categories?.some(c => String(c.id) === catFilter));
      setProducts(filtered);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, catFilter, search]);

  const loadCategories = useCallback(async () => {
    try {
      const data = await categoryService.list();
      if (data?.success && data.categories) setCategories(data.categories);
    } catch {
      setCategories(MOCK_CATEGORIES);
    }
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => { loadCategories(); }, [loadCategories]);

  const openView = async (id) => {
    try {
      const data = await productService.get(id);
      if (data?.success !== false) {
        setSelectedProduct(data);
        setModal('view');
        return;
      }
    } catch {}
    setSelectedProduct(products.find(p => p.id === id));
    setModal('view');
  };

  const openEdit = async (id) => {
    try {
      const data = await productService.get(id);
      setSelectedProduct(data?.success !== false ? data : products.find(p => p.id === id));
    } catch {
      setSelectedProduct(products.find(p => p.id === id));
    }
    setModal('edit');
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productService.delete(id);
      toast.success('Product deleted');
    } catch {
      toast.success('Product deleted (demo)');
    }
    loadProducts();
  };

  const closeModal = () => { setModal(null); setSelectedProduct(null); };
  const afterSaved = () => { closeModal(); loadProducts(); loadCategories(); };

  const applyFilter = () => { setPage(1); loadProducts(); };

  return (
    <div>
      <SectionHeader
        title="Fashion Catalog"
        subtitle="Manage products, categories and fashion inventory"
        actions={
          <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>
            <i className="fas fa-plus me-1" />Add Product
          </button>
        }
      />

      {/* Tabs */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <i className="fas fa-boxes me-2" />All Products
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'categories' ? 'active' : ''}`} onClick={() => setActiveTab('categories')}>
            <i className="fas fa-tags me-2" />Categories
          </button>
        </li>
      </ul>

      {activeTab === 'categories' ? (
        <CategoriesTab categories={categories} onRefresh={() => { loadCategories(); loadProducts(); }} />
      ) : (
        <>
          {/* Filters */}
          <div className="bg-white rounded-3 border p-3 mb-4">
            <div className="row g-2 align-items-end">
              <div className="col-sm-4">
                <label className="form-label small fw-medium">Search</label>
                <input
                  className="form-control form-control-sm"
                  placeholder="Product name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && applyFilter()}
                />
              </div>
              <div className="col-sm-3">
                <label className="form-label small fw-medium">Category</label>
                <select
                  className="form-select form-select-sm"
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-sm-2">
                <label className="form-label small fw-medium">Per page</label>
                <select className="form-select form-select-sm" value={pageSize} onChange={e => { setPageSize(+e.target.value); setPage(1); }}>
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="col-sm-auto">
                <button className="btn btn-primary btn-sm" onClick={applyFilter}>
                  <i className="fas fa-search me-1" />Filter
                </button>
                <button className="btn btn-outline-secondary btn-sm ms-2" onClick={() => { setSearch(''); setCatFilter(''); setPage(1); }}>
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white rounded-3 border overflow-hidden">
            <div className="table-card-header">
              <h6 className="mb-0 fw-semibold">Products ({products.length})</h6>
            </div>
            {loading ? <LoadingSpinner /> : (
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th className="ps-4 small fw-medium text-muted">#</th>
                      <th className="small fw-medium text-muted">Image</th>
                      <th className="small fw-medium text-muted">Name</th>
                      <th className="small fw-medium text-muted">Price</th>
                      <th className="small fw-medium text-muted">Stock</th>
                      <th className="small fw-medium text-muted">Categories</th>
                      <th className="small fw-medium text-muted pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr><td colSpan={7}><EmptyState icon="fa-box-open" title="No products found" message="Add your first product to get started" /></td></tr>
                    ) : products.map((product, idx) => (
                      <tr key={product.id}>
                        <td className="ps-4 text-muted small">{(page - 1) * pageSize + idx + 1}</td>
                        <td>
                          {product.image_urls?.[0] ? (
                            <img src={product.image_urls[0]} alt={product.name} style={{ width: 42, height: 42, objectFit: 'cover', borderRadius: 6 }} />
                          ) : (
                            <div className="d-flex align-items-center justify-content-center bg-light rounded" style={{ width: 42, height: 42 }}>
                              <i className="fas fa-image text-muted small" />
                            </div>
                          )}
                        </td>
                        <td>
                          <div className="fw-medium small">{product.name}</div>
                          {product.description && <div className="text-muted text-truncate" style={{ fontSize: 11, maxWidth: 200 }}>{product.description}</div>}
                        </td>
                        <td className="fw-medium small">{product.price ? formatNGN(product.price) : '—'}</td>
                        <td className="small">{product.stock ?? '—'}</td>
                        <td>
                          {product.categories?.map(c => <CategoryTag key={c.id} name={c.name} />)}
                        </td>
                        <td className="pe-4">
                          <div className="d-flex gap-1">
                            <button className="btn btn-xs btn-outline-secondary" style={{ padding: '2px 7px', fontSize: 11 }} title="View" onClick={() => openView(product.id)}>
                              <i className="fas fa-eye" />
                            </button>
                            <button className="btn btn-xs btn-outline-warning" style={{ padding: '2px 7px', fontSize: 11 }} title="Edit" onClick={() => openEdit(product.id)}>
                              <i className="fas fa-edit" />
                            </button>
                            <button className="btn btn-xs btn-outline-danger" style={{ padding: '2px 7px', fontSize: 11 }} title="Delete" onClick={() => deleteProduct(product.id)}>
                              <i className="fas fa-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-top d-flex justify-content-center">
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => p - 1)}>«</button>
                  </li>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
                      <button className="page-link" onClick={() => setPage(p)}>{p}</button>
                    </li>
                  ))}
                  <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => setPage(p => p + 1)}>»</button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modals */}
      {modal === 'add' && (
        <ProductModal mode="add" categories={categories} onClose={closeModal} onSaved={afterSaved} />
      )}
      {modal === 'edit' && selectedProduct && (
        <ProductModal mode="edit" product={selectedProduct} categories={categories} onClose={closeModal} onSaved={afterSaved} />
      )}
      {modal === 'view' && selectedProduct && (
        <ViewProductModal
          product={selectedProduct}
          onClose={closeModal}
          onEdit={() => {
            setModal('edit');
          }}
        />
      )}
    </div>
  );
}
