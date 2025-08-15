import { useState, useEffect } from 'react'
import { useCategoriesStore, toast } from '@/stores'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  X, 
  ArrowUp,
  ArrowDown,
  FolderPlus,
  Folder,
  Hash
} from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import { ColorPicker } from './settings/ColorPicker'

interface CategoriesManagerProps {
  onClose?: () => void
}

const CategoriesManager = ({ onClose }: CategoriesManagerProps) => {
  const {
    categories,
    isLoading,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    getTopLevelCategories,
    getCategoryChildren
  } = useCategoriesStore()

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [parentForNew, setParentForNew] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId)
      } else {
        newSet.add(categoryId)
      }
      return newSet
    })
  }

  const handleEdit = (category: any) => {
    setEditingCategory(category)
  }

  const handleSaveEdit = async (categoryData: any) => {
    if (!editingCategory) return

    try {
      await updateCategory(editingCategory.id, categoryData)
      toast.success('Category updated', 'Category has been saved successfully')
      setEditingCategory(null)
    } catch (error) {
      toast.error('Failed to update category', 'Please try again')
    }
  }

  const handleAddCategory = (parentId?: string) => {
    setParentForNew(parentId || null)
    setShowAddCategory(true)
  }

  const handleSaveNew = async (categoryData: any) => {
    try {
      const newCategory = {
        ...categoryData,
        parentId: parentForNew || undefined
      }
      await createCategory(newCategory)
      toast.success('Category created', 'New category has been added')
      setShowAddCategory(false)
      setParentForNew(null)
    } catch (error) {
      toast.error('Failed to create category', 'Please try again')
    }
  }

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId)
      toast.success('Category deleted', 'Category has been removed')
      setDeleteConfirm(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category'
      toast.error('Cannot delete category', errorMessage)
      setDeleteConfirm(null)
    }
  }

  const moveCategory = async () => {
    // This is a simplified reorder - in a real app you'd implement proper ordering
    toast.info('Category reordering', 'This feature is coming soon')
  }

  const renderCategory = (category: any, level: number = 0) => {
    const children = getCategoryChildren(category.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedCategories.has(category.id)

    return (
      <div key={category.id} className="border border-gray-200 dark:border-gray-700 rounded-lg mb-2">
        <div 
          className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          style={{ paddingLeft: `${12 + level * 20}px` }}
        >
          <div className="flex items-center gap-3 flex-1">
            {hasChildren ? (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6 h-6 flex items-center justify-center">
                <Hash className="w-3 h-3 text-gray-400" />
              </div>
            )}
            
            <div
              className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
              style={{ backgroundColor: category.color }}
            />
            
            <span className="text-lg">{category.icon}</span>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                {category.name}
              </h4>
              {category.parentId && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Subcategory
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => moveCategory()}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Move up"
            >
              <ArrowUp className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => moveCategory()}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Move down"
            >
              <ArrowDown className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleAddCategory(category.id)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Add subcategory"
            >
              <FolderPlus className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => handleEdit(category)}
              className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Edit category"
            >
              <Edit2 className="w-4 h-4 text-gray-400" />
            </button>
            
            <button
              onClick={() => setDeleteConfirm(category.id)}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
              title="Delete category"
            >
              <Trash2 className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (isLoading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const topLevelCategories = getTopLevelCategories()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Categories Management
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Organize your transactions with custom categories
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddCategory()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
          
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Categories List */}
      {topLevelCategories.length > 0 ? (
        <div className="space-y-2">
          {topLevelCategories.map(category => renderCategory(category))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No categories yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first category to organize transactions
          </p>
          <button
            onClick={() => handleAddCategory()}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          onSave={handleSaveEdit}
          onCancel={() => setEditingCategory(null)}
          title="Edit Category"
        />
      )}

      {/* Add Category Modal */}
      {showAddCategory && (
        <CategoryModal
          parentId={parentForNew}
          onSave={handleSaveNew}
          onCancel={() => {
            setShowAddCategory(false)
            setParentForNew(null)
          }}
          title={parentForNew ? "Add Subcategory" : "Add Category"}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Delete Category
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this category? This will affect any transactions or budgets using this category.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Category Modal Component
const CategoryModal = ({ 
  category, 
  parentId, 
  onSave, 
  onCancel, 
  title 
}: {
  category?: any
  parentId?: string | null
  onSave: (data: any) => void
  onCancel: () => void
  title: string
}) => {
  const [formData, setFormData] = useState({
    name: category?.name || '',
    icon: category?.icon || '📝',
    color: category?.color || '#3b82f6'
  })

  // Common icons for categories
  const commonIcons = [
    '🏠', '🚗', '🍔', '🛒', '💡', '📱', '🎬', '🏥', '✈️', '🎓',
    '💼', '🎵', '👕', '🏋️', '🎮', '📚', '🍕', '☕', '🍾', '🎁',
    '💰', '💳', '🏪', '🚕', '⛽', '🏦', '💻', '📺', '🎸', '🎨'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Groceries, Entertainment"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Icon Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Icon
            </label>
            <div className="grid grid-cols-10 gap-2 mb-3">
              {commonIcons.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    formData.icon === icon
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Or enter custom:</span>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="🎯"
              />
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
            />
          </div>

          {/* Parent Info */}
          {parentId && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                This will be created as a subcategory
              </p>
            </div>
          )}

          {/* Preview */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full border border-gray-300 dark:border-gray-600"
                style={{ backgroundColor: formData.color }}
              />
              <span className="text-lg">{formData.icon}</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formData.name || 'Category Name'}
              </span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {category ? 'Save Changes' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CategoriesManager