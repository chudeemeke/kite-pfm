import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { categoryRepo } from '@/db/repositories'
import type { Category } from '@/types'

interface CategoriesStore {
  categories: Category[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCategories: () => Promise<void>
  createCategory: (data: Omit<Category, 'id'>) => Promise<Category>
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  
  // Selectors
  getCategoryById: (id: string) => Category | undefined
  getTopLevelCategories: () => Category[]
  getCategoryChildren: (parentId: string) => Category[]
  getCategoryPath: (id: string) => Category[]
}

export const useCategoriesStore = create<CategoriesStore>()(
  immer((set, get) => ({
    categories: [],
    isLoading: false,
    error: null,
    
    fetchCategories: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const categories = await categoryRepo.getAll()
        set((state) => {
          state.categories = categories
          state.isLoading = false
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch categories'
          state.isLoading = false
        })
      }
    },
    
    createCategory: async (data) => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })
      
      try {
        const category = await categoryRepo.create(data)
        
        set((state) => {
          state.categories.push(category)
          state.isLoading = false
        })
        
        return category
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create category'
          state.isLoading = false
        })
        throw error
      }
    },
    
    updateCategory: async (id, data) => {
      // Optimistic update
      const originalCategory = get().categories.find(c => c.id === id)
      if (!originalCategory) return
      
      set((state) => {
        const category = state.categories.find(c => c.id === id)
        if (category) {
          Object.assign(category, data)
        }
      })
      
      try {
        await categoryRepo.update(id, data)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          const index = state.categories.findIndex(c => c.id === id)
          if (index !== -1) {
            state.categories[index] = originalCategory
          }
        })
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update category'
        })
        throw error
      }
    },
    
    deleteCategory: async (id) => {
      // Optimistic update
      const originalCategories = [...get().categories]
      
      set((state) => {
        state.categories = state.categories.filter(c => c.id !== id)
      })
      
      try {
        await categoryRepo.delete(id)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.categories = originalCategories
          state.error = error instanceof Error ? error.message : 'Failed to delete category'
        })
        throw error
      }
    },
    
    getCategoryById: (id) => {
      return get().categories.find(category => category.id === id)
    },
    
    getTopLevelCategories: () => {
      return get().categories.filter(category => !category.parentId)
    },
    
    getCategoryChildren: (parentId) => {
      return get().categories.filter(category => category.parentId === parentId)
    },
    
    getCategoryPath: (id) => {
      const path: Category[] = []
      const { categories } = get()
      
      let currentCategory = categories.find(c => c.id === id)
      
      while (currentCategory) {
        path.unshift(currentCategory)
        currentCategory = currentCategory.parentId 
          ? categories.find(c => c.id === currentCategory!.parentId)
          : undefined
      }
      
      return path
    }
  }))
)