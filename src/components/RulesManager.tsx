import { useState, useEffect } from 'react'
import { useRulesStore, useCategoriesStore, toast } from '@/stores'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  X, 
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  Zap,
  Filter,
  Target,
  CheckCircle,
  Copy
} from 'lucide-react'
import LoadingSpinner from './LoadingSpinner'
import type { RuleCondition } from '@/types'

interface RulesManagerProps {
  onClose?: () => void
}

const RulesManager = ({ onClose }: RulesManagerProps) => {
  const {
    rules,
    isLoading,
    error,
    fetchRules,
    createRule,
    updateRule,
    deleteRule,
    reorderRules
  } = useRulesStore()

  const { categories, fetchCategories } = useCategoriesStore()
  
  const [editingRule, setEditingRule] = useState<any>(null)
  const [showAddRule, setShowAddRule] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<any>(null)

  useEffect(() => {
    fetchRules()
    fetchCategories()
  }, [fetchRules, fetchCategories])

  const handleEdit = (rule: any) => {
    setEditingRule(rule)
  }

  const handleSaveEdit = async (ruleData: any) => {
    if (!editingRule) return

    try {
      await updateRule(editingRule.id, ruleData)
      toast.success('Rule updated', 'Auto-categorization rule has been saved')
      setEditingRule(null)
    } catch (error) {
      toast.error('Failed to update rule', 'Please try again')
    }
  }

  const handleAddRule = () => {
    setShowAddRule(true)
  }

  const handleSaveNew = async (ruleData: any) => {
    try {
      const newRule = {
        ...ruleData,
        priority: rules.length + 1 // Add to end with proper priority
      }
      await createRule(newRule)
      toast.success('Rule created', 'New auto-categorization rule has been added')
      setShowAddRule(false)
    } catch (error) {
      toast.error('Failed to create rule', 'Please try again')
    }
  }

  const handleDelete = async (ruleId: string) => {
    try {
      await deleteRule(ruleId)
      toast.success('Rule deleted', 'Auto-categorization rule has been removed')
      setDeleteConfirm(null)
    } catch (error) {
      toast.error('Failed to delete rule', 'Please try again')
      setDeleteConfirm(null)
    }
  }

  const handleToggleEnabled = async (ruleId: string, enabled: boolean) => {
    try {
      await updateRule(ruleId, { enabled })
      toast.success(
        enabled ? 'Rule enabled' : 'Rule disabled', 
        `Auto-categorization rule is now ${enabled ? 'active' : 'inactive'}`
      )
    } catch (error) {
      toast.error('Failed to update rule', 'Please try again')
    }
  }

  const handleMoveRule = async (ruleId: string, direction: 'up' | 'down') => {
    const currentIndex = rules.findIndex(r => r.id === ruleId)
    if (currentIndex === -1) return

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (newIndex < 0 || newIndex >= rules.length) return

    const newOrder = [...rules]
    const [movedRule] = newOrder.splice(currentIndex, 1)
    newOrder.splice(newIndex, 0, movedRule)

    try {
      await reorderRules(newOrder.map(r => r.id))
      toast.success('Rule reordered', 'Rule priority has been updated')
    } catch (error) {
      toast.error('Failed to reorder rules', 'Please try again')
    }
  }

  const testRule = async () => {
    // This would test the rule against existing transactions
    // For now, just show a mock result
    const mockResult = {
      matched: Math.floor(Math.random() * 50) + 1,
      total: 120,
      examples: [
        'Amazon Purchase - Groceries',
        'Starbucks Coffee - Food & Drink',
        'Shell Station - Transport'
      ]
    }
    setTestResult(mockResult)
    toast.info('Rule tested', `Would categorize ${mockResult.matched} of ${mockResult.total} transactions`)
  }

  const duplicateRule = async (originalRule: any) => {
    try {
      const duplicatedRule = {
        name: `${originalRule.name} (Copy)`,
        enabled: false,
        conditions: [...originalRule.conditions],
        actions: [...originalRule.actions],
        stopProcessing: originalRule.stopProcessing,
        priority: rules.length + 1
      }
      await createRule(duplicatedRule)
      toast.success('Rule duplicated', 'A copy of the rule has been created')
    } catch (error) {
      toast.error('Failed to duplicate rule', 'Please try again')
    }
  }

  if (isLoading && rules.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Auto-Categorization Rules
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Automatically categorize transactions based on rules
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRule}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Rule
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

      {/* Rules List */}
      {rules.length > 0 ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Rules are processed in order from top to bottom. Higher priority rules are applied first.
          </div>
          
          {rules.map((rule, index) => {
            const category = categories.find(c => c.id === rule.actions[0]?.setCategoryId)
            
            return (
              <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleMoveRule(rule.id, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move up"
                      >
                        <ArrowUp className="w-3 h-3 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleMoveRule(rule.id, 'down')}
                        disabled={index === rules.length - 1}
                        className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Move down"
                      >
                        <ArrowDown className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        #{index + 1}
                      </span>
                      <button
                        onClick={() => handleToggleEnabled(rule.id, !rule.enabled)}
                        className={`p-1 rounded transition-colors ${
                          rule.enabled 
                            ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/20' 
                            : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                      >
                        {rule.enabled ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`font-medium ${
                          rule.enabled 
                            ? 'text-gray-900 dark:text-gray-100' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {rule.name}
                        </h4>
                        {!rule.enabled && (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 rounded">
                            Disabled
                          </span>
                        )}
                      </div>
                      
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {rule.conditions.length} condition{rule.conditions.length !== 1 ? 's' : ''} → {' '}
                        {category && (
                          <span className="inline-flex items-center gap-1">
                            <span>{category.icon}</span>
                            <span>{category.name}</span>
                          </span>
                        )}
                        {rule.stopProcessing && (
                          <span className="ml-2 px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-xs text-orange-700 dark:text-orange-300 rounded">
                            Stop processing
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        {rule.conditions.map((condition: RuleCondition, idx: number) => (
                          <div key={idx} className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
                            <Filter className="w-3 h-3" />
                            <span className="capitalize">{condition.field}</span>
                            <span className="text-gray-400">{formatOperator(condition.op)}</span>
                            <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded">
                              {formatConditionValue(condition)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => testRule()}
                      className="p-2 rounded hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
                      title="Test rule"
                    >
                      <Zap className="w-4 h-4 text-blue-500" />
                    </button>
                    
                    <button
                      onClick={() => duplicateRule(rule)}
                      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Duplicate rule"
                    >
                      <Copy className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      title="Edit rule"
                    >
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    <button
                      onClick={() => setDeleteConfirm(rule.id)}
                      className="p-2 rounded hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No rules yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first auto-categorization rule to automatically organize transactions
          </p>
          <button
            onClick={handleAddRule}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mx-auto"
          >
            <Plus className="w-4 h-4" />
            Add Rule
          </button>
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h4 className="font-medium text-blue-900 dark:text-blue-100">
              Rule Test Result
            </h4>
            <button
              onClick={() => setTestResult(null)}
              className="ml-auto p-1 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
            >
              <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </button>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            This rule would categorize <strong>{testResult.matched}</strong> out of <strong>{testResult.total}</strong> existing transactions
          </p>
          <div className="space-y-1">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">Examples:</p>
            {testResult.examples.map((example: string, idx: number) => (
              <p key={idx} className="text-xs text-blue-600 dark:text-blue-300">
                • {example}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {editingRule && (
        <RuleModal
          rule={editingRule}
          categories={categories}
          onSave={handleSaveEdit}
          onCancel={() => setEditingRule(null)}
          title="Edit Rule"
        />
      )}

      {/* Add Rule Modal */}
      {showAddRule && (
        <RuleModal
          categories={categories}
          onSave={handleSaveNew}
          onCancel={() => setShowAddRule(false)}
          title="Add New Rule"
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
                  Delete Rule
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This action cannot be undone
                </p>
              </div>
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this auto-categorization rule? It will no longer be applied to new transactions.
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
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Helper functions
const formatOperator = (op: string) => {
  const operators = {
    eq: 'equals',
    contains: 'contains',
    regex: 'matches',
    range: 'between'
  }
  return operators[op as keyof typeof operators] || op
}

const formatConditionValue = (condition: RuleCondition) => {
  if (condition.op === 'range' && typeof condition.value === 'object') {
    const range = condition.value as { min: number; max: number }
    return `${range.min} - ${range.max}`
  }
  return String(condition.value)
}

// Rule Modal Component
const RuleModal = ({ 
  rule, 
  categories,
  onSave, 
  onCancel, 
  title 
}: {
  rule?: any
  categories: any[]
  onSave: (data: any) => void
  onCancel: () => void
  title: string
}) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    enabled: rule?.enabled ?? true,
    conditions: rule?.conditions || [{ field: 'description', op: 'contains', value: '' }],
    actions: rule?.actions || [{ setCategoryId: '' }],
    stopProcessing: rule?.stopProcessing ?? false
  })

  const addCondition = () => {
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, { field: 'description', op: 'contains', value: '' }]
    }))
  }

  const removeCondition = (index: number) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_: any, i: number) => i !== index)
    }))
  }

  const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition: any, i: number) => 
        i === index ? { ...condition, ...updates } : condition
      )
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
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
          {/* Rule Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Grocery Store Categorization"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          {/* Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Conditions (all must match)
            </label>
            <div className="space-y-3">
              {formData.conditions.map((condition: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, { field: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="description">Description</option>
                    <option value="merchant">Merchant</option>
                    <option value="amount">Amount</option>
                  </select>
                  
                  <select
                    value={condition.op}
                    onChange={(e) => updateCondition(index, { op: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="contains">contains</option>
                    <option value="eq">equals</option>
                    <option value="regex">matches regex</option>
                    {condition.field === 'amount' && <option value="range">between</option>}
                  </select>
                  
                  {condition.op === 'range' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={typeof condition.value === 'object' ? (condition.value as any).min : ''}
                        onChange={(e) => updateCondition(index, { 
                          value: { 
                            min: parseFloat(e.target.value) || 0, 
                            max: typeof condition.value === 'object' ? (condition.value as any).max : 0 
                          } 
                        })}
                        className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={typeof condition.value === 'object' ? (condition.value as any).max : ''}
                        onChange={(e) => updateCondition(index, { 
                          value: { 
                            min: typeof condition.value === 'object' ? (condition.value as any).min : 0, 
                            max: parseFloat(e.target.value) || 0 
                          } 
                        })}
                        className="w-20 px-2 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  ) : (
                    <input
                      type={condition.field === 'amount' ? 'number' : 'text'}
                      value={typeof condition.value === 'string' || typeof condition.value === 'number' ? condition.value : ''}
                      onChange={(e) => updateCondition(index, { 
                        value: condition.field === 'amount' ? parseFloat(e.target.value) || 0 : e.target.value 
                      })}
                      placeholder={
                        condition.field === 'description' ? 'e.g., Tesco' :
                        condition.field === 'merchant' ? 'e.g., Starbucks' :
                        condition.field === 'amount' ? 'e.g., 25.50' : ''
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      required
                    />
                  )}
                  
                  {formData.conditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCondition(index)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              
              <button
                type="button"
                onClick={addCondition}
                className="flex items-center gap-2 px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            </div>
          </div>

          {/* Actions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category to assign *
            </label>
            <select
              value={formData.actions[0]?.setCategoryId || ''}
              onChange={(e) => setFormData({
                ...formData,
                actions: [{ setCategoryId: e.target.value }]
              })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Select category...</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Enable this rule immediately
              </span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.stopProcessing}
                onChange={(e) => setFormData({ ...formData, stopProcessing: e.target.checked })}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Stop processing other rules if this one matches
              </span>
            </label>
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
              {rule ? 'Save Changes' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RulesManager