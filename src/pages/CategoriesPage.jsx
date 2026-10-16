import { useEffect, useRef, useState } from 'react'
import { ApiError, getApiFieldError } from '../api/apiClient'
import { useCategories, useCategoryMutations } from '../features/categories/categoryHooks'
import { AlertBanner, EmptyState, Icon, LoadingState, PageHeader } from '../components/ui'

function validateName(value) {
  const trimmedName = value.trim()
  if (!trimmedName) {
    return 'Category name is required.'
  }
  if (trimmedName.length > 100) {
    return 'Category name must be 100 characters or fewer.'
  }
  return null
}

function errorMessage(error, fallback) {
  return error instanceof ApiError ? error.message : fallback
}

function CategoryNameInput({ id, name, onChange, error, disabled, autoFocus = false, inputRef }) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>Category name</label>
      <input
        id={id}
        className={`category-input ${error ? 'has-error' : ''}`}
        type="text"
        value={name}
        onChange={onChange}
        maxLength={100}
        disabled={disabled}
        autoFocus={autoFocus}
        ref={inputRef}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && <span className="field-error" id={`${id}-error`} role="alert">{error}</span>}
    </>
  )
}

export function CategoriesPage() {
  const { data: categories = [], error: queryError, isError, isPending, refetch } = useCategories()
  const { createCategory, updateCategory, deleteCategory } = useCategoryMutations()
  const [newName, setNewName] = useState('')
  const [newError, setNewError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editError, setEditError] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const editInputRef = useRef(null)

  useEffect(() => {
    if (editingId !== null) {
      editInputRef.current?.focus()
    }
  }, [editingId])

  function startEditing(category) {
    setEditingId(category.id)
    setEditingName(category.name)
    setEditError(null)
    setActionError(null)
    setSuccessMessage(null)
    setPendingDelete(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setEditingName('')
    setEditError(null)
  }

  async function handleCreate(event) {
    event.preventDefault()
    const validationError = validateName(newName)
    if (validationError) {
      setNewError(validationError)
      return
    }

    setNewError(null)
    setActionError(null)
    try {
      await createCategory.mutateAsync(newName.trim())
      setNewName('')
      setSuccessMessage('Category added.')
    } catch (error) {
      setNewError(getApiFieldError(error, 'name') ?? errorMessage(error, 'Category could not be created.'))
      setActionError(error)
    }
  }

  async function handleUpdate(event, categoryId) {
    event.preventDefault()
    const validationError = validateName(editingName)
    if (validationError) {
      setEditError(validationError)
      return
    }

    setEditError(null)
    setActionError(null)
    setSuccessMessage(null)
    try {
      await updateCategory.mutateAsync({ id: categoryId, name: editingName.trim() })
      cancelEditing()
      setSuccessMessage('Category updated.')
    } catch (error) {
      setEditError(getApiFieldError(error, 'name') ?? errorMessage(error, 'Category could not be updated.'))
      setActionError(error)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return
    }

    setActionError(null)
    try {
      await deleteCategory.mutateAsync(pendingDelete.id)
      setPendingDelete(null)
      setSuccessMessage('Category deleted.')
    } catch (error) {
      setActionError(error)
    }
  }

  const isMutating = createCategory.isPending || updateCategory.isPending || deleteCategory.isPending
  const deleteError = deleteCategory.isError ? actionError : null

  return (
    <main className="categories-page page-container">
      <PageHeader
         eyebrow="Organization"
        title="Categories"
        description="Create simple labels that make every expense easier to understand."
        meta={<span className="count-badge">{categories.length} {categories.length === 1 ? 'category' : 'categories'}</span>}
      />

      <section className="category-create-card" aria-labelledby="add-category-title">
        <div>
           <span className="card-kicker">Add a label</span>
          <h2 id="add-category-title">New category</h2>
        </div>
        <form className="category-create-form" onSubmit={handleCreate} noValidate>
          <CategoryNameInput
            id="new-category-name"
            name={newName}
            onChange={(event) => {
              setNewName(event.target.value)
              setNewError(null)
              setActionError(null)
            }}
            error={newError}
            disabled={isMutating}
          />
          <button className="button button-primary category-submit" type="submit" disabled={isMutating}>
            {createCategory.isPending ? 'Adding...' : 'Add category'}
          </button>
        </form>
      </section>

      {deleteError && <AlertBanner title={deleteError.status === 409 ? 'Category is still in use.' : deleteError.status === 404 ? 'Category was not found.' : 'Category could not be deleted.'} action={deleteError.status === 404 && <button className="button button-secondary button-small" type="button" onClick={() => refetch()}>Refresh list</button>}>{deleteError.message}</AlertBanner>}
      {successMessage && <div className="expense-success" role="status">{successMessage}</div>}

      {isPending && <LoadingState label="Loading categories..." />}

      {isError && !isPending && (
        <div className="category-state category-state-error" role="alert">
          <h2>Categories could not load.</h2>
          <p>{errorMessage(queryError, 'The API could not be reached.')}</p>
          <button className="button button-quiet" type="button" onClick={() => refetch()}>Try again</button>
        </div>
      )}

      {!isPending && !isError && categories.length === 0 && <EmptyState icon="tags" title="No categories yet">Add your first category above to give expenses a useful home.</EmptyState>}

      {!isPending && !isError && categories.length > 0 && (
        <section className="category-list" aria-labelledby="category-list-title">
          <div className="list-heading">
             <span className="card-kicker" id="category-list-title">Saved categories</span>
            <span className="list-rule" aria-hidden="true" />
          </div>
          <ul>
            {categories.map((category) => (
              <li className="category-row" key={category.id}>
                {editingId === category.id ? (
                  <form className="category-edit-form" onSubmit={(event) => handleUpdate(event, category.id)} noValidate>
                    <CategoryNameInput
                      id={`edit-category-${category.id}`}
                      name={editingName}
                      onChange={(event) => {
                        setEditingName(event.target.value)
                        setEditError(null)
                        setActionError(null)
                      }}
                      error={editError}
                      disabled={isMutating}
                       autoFocus
                       inputRef={editInputRef}
                    />
                    <div className="category-actions">
                      <button className="button button-primary button-small" type="submit" disabled={isMutating}>
                        {updateCategory.isPending ? 'Saving...' : 'Save'}
                      </button>
                      <button className="button button-quiet button-small" type="button" onClick={cancelEditing} disabled={isMutating}>
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <span className="category-name">{category.name}</span>
                    <div className="category-actions">
                        <button className="button button-secondary button-small" type="button" aria-label={`Edit ${category.name}`} onClick={() => startEditing(category)} disabled={isMutating}>
                         <Icon name="edit" size={15} />Edit
                       </button>
                       <button className="button button-danger button-small" type="button" aria-label={`Delete ${category.name}`} onClick={() => setPendingDelete(category)} disabled={isMutating}>
                         <Icon name="trash" size={15} />Delete
                      </button>
                    </div>
                  </>
                )}
                {pendingDelete?.id === category.id && editingId !== category.id && (
                  <div className="delete-confirmation" role="group" aria-label={`Delete ${category.name}`}>
                    <p>Delete <strong>{category.name}</strong>? Linked expenses or budgets will prevent deletion.</p>
                    <div className="category-actions">
                      <button className="button button-danger button-small" type="button" onClick={handleDelete} disabled={isMutating}>
                        {deleteCategory.isPending ? 'Deleting...' : 'Yes, delete'}
                      </button>
                      <button className="button button-quiet button-small" type="button" onClick={() => setPendingDelete(null)} disabled={isMutating}>
                        Keep it
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  )
}
