/**
 * Goals Page Component
 * Comprehensive financial goal management with tracking and visualization
 * Features creation, editing, progress monitoring, and milestone celebrations
 */

import { useState, useEffect } from 'react'
import { 
  Target, 
  TrendingUp, 
  Plus, 
  Edit2, 
  Trash2, 
  Award,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  PiggyBank,
  Home,
  Shield,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react'
import { format, differenceInDays, isPast } from 'date-fns'
import { goalService } from '@/services/goals'
import { formatCurrency } from '@/services'
import { toast } from '@/stores'
import type { Goal, GoalMilestone } from '@/types'
import LoadingSpinner from '@/components/LoadingSpinner'
import ConfirmDialog from '@/components/ConfirmDialog'
import { cn } from '@/lib/utils'

// Goal type icons mapping
const goalIcons: Record<Goal['type'], any> = {
  savings: PiggyBank,
  debt: Shield,
  investment: TrendingUp,
  emergency: AlertCircle,
  purchase: Home,
  custom: Target
}

// Goal category colors
const goalColors: Record<Goal['category'], string> = {
  'short-term': 'bg-blue-500',
  'medium-term': 'bg-purple-500',
  'long-term': 'bg-green-500'
}

const GoalsPage = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [goalDetails, setGoalDetails] = useState<any>(null)
  const [statistics, setStatistics] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showContributionModal, setShowContributionModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; goalId: string | null }>({ 
    isOpen: false, 
    goalId: null 
  })

  useEffect(() => {
    loadGoals()
    loadStatistics()
    loadRecommendations()
  }, [])

  useEffect(() => {
    if (selectedGoal) {
      loadGoalDetails(selectedGoal.id)
    }
  }, [selectedGoal])

  const loadGoals = async () => {
    try {
      setIsLoading(true)
      const userGoals = await goalService.getUserGoals('default-user')
      setGoals(userGoals)
      
      if (userGoals.length > 0 && !selectedGoal) {
        setSelectedGoal(userGoals[0])
      }
    } catch (error) {
      toast.error('Failed to load goals', 'Please try again')
    } finally {
      setIsLoading(false)
    }
  }

  const loadGoalDetails = async (goalId: string) => {
    try {
      const details = await goalService.getGoalDetails(goalId)
      setGoalDetails(details)
    } catch (error) {
      toast.error('Failed to load goal details', 'Please try again')
    }
  }

  const loadStatistics = async () => {
    try {
      const stats = await goalService.getGoalStatistics('default-user')
      setStatistics(stats)
    } catch (error) {
      console.error('Failed to load statistics:', error)
    }
  }

  const loadRecommendations = async () => {
    try {
      const recs = await goalService.getGoalRecommendations('default-user')
      setRecommendations(recs)
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await goalService.deleteGoal(goalId)
      toast.success('Goal deleted', 'Goal has been removed successfully')
      
      // Update state
      setGoals(goals.filter(g => g.id !== goalId))
      if (selectedGoal?.id === goalId) {
        setSelectedGoal(goals.find(g => g.id !== goalId) || null)
      }
      
      loadStatistics()
    } catch (error) {
      toast.error('Failed to delete goal', 'Please try again')
    }
  }

  const handleContribution = async (amount: number, description?: string) => {
    if (!selectedGoal) return
    
    try {
      await goalService.addContribution({
        goalId: selectedGoal.id,
        amount,
        date: new Date(),
        source: 'manual',
        description
      })
      
      toast.success('Contribution added', `${formatCurrency(amount)} added to ${selectedGoal.name}`)
      
      // Reload data
      loadGoals()
      loadGoalDetails(selectedGoal.id)
      loadStatistics()
      setShowContributionModal(false)
    } catch (error) {
      toast.error('Failed to add contribution', 'Please try again')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Goals
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track your financial goals and celebrate milestones
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Goal
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Target}
            label="Active Goals"
            value={statistics.activeGoals}
            color="text-blue-600"
            bgColor="bg-blue-100 dark:bg-blue-900/20"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed"
            value={statistics.completedGoals}
            color="text-green-600"
            bgColor="bg-green-100 dark:bg-green-900/20"
          />
          <StatCard
            icon={DollarSign}
            label="Total Saved"
            value={formatCurrency(statistics.totalSaved)}
            color="text-purple-600"
            bgColor="bg-purple-100 dark:bg-purple-900/20"
          />
          <StatCard
            icon={TrendingUp}
            label="On Track"
            value={`${statistics.goalsOnTrack}/${statistics.activeGoals}`}
            color="text-emerald-600"
            bgColor="bg-emerald-100 dark:bg-emerald-900/20"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Goals List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                Your Goals
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {goals.length === 0 ? (
                <div className="p-6 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No goals yet
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-secondary mt-3"
                  >
                    Create First Goal
                  </button>
                </div>
              ) : (
                goals.map(goal => {
                  const Icon = goalIcons[goal.type]
                  const progress = (goal.currentAmount / goal.targetAmount) * 100
                  const daysLeft = differenceInDays(goal.targetDate, new Date())
                  const isOverdue = isPast(goal.targetDate) && goal.status === 'active'
                  
                  return (
                    <button
                      key={goal.id}
                      onClick={() => setSelectedGoal(goal)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                        selectedGoal?.id === goal.id && "bg-gray-50 dark:bg-gray-800"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          goalColors[goal.category as Goal['category']],
                          "text-white"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100">
                            {goal.name}
                          </h4>
                          
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>{formatCurrency(goal.currentAmount)}</span>
                            <span>/</span>
                            <span>{formatCurrency(goal.targetAmount)}</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className={cn(
                                "h-2 rounded-full transition-all duration-300",
                                progress >= 100 ? "bg-green-500" :
                                progress >= 75 ? "bg-blue-500" :
                                progress >= 50 ? "bg-yellow-500" :
                                "bg-gray-400"
                              )}
                              style={{ width: `${Math.min(100, progress)}%` }}
                            />
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {progress.toFixed(0)}% complete
                            </span>
                            {goal.status === 'completed' ? (
                              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                                Completed!
                              </span>
                            ) : isOverdue ? (
                              <span className="text-xs text-red-600 dark:text-red-400">
                                Overdue
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {daysLeft} days left
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <ChevronRight className="w-4 h-4 text-gray-400 mt-3" />
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="card">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  Recommended Goals
                </h3>
              </div>
              
              <div className="p-4 space-y-3">
                {recommendations.slice(0, 3).map((rec, index) => {
                  const Icon = goalIcons[rec.type as Goal['type']]
                  
                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center">
                        <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {rec.name}
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {rec.reason}
                        </p>
                        <button
                          onClick={() => {
                            // Pre-fill create form with recommendation
                            setShowCreateModal(true)
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 mt-2"
                        >
                          Create this goal →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Goal Details */}
        <div className="lg:col-span-2">
          {selectedGoal && goalDetails ? (
            <GoalDetails
              goal={selectedGoal}
              details={goalDetails}
              onContribute={() => setShowContributionModal(true)}
              onEdit={() => {/* TODO: Implement edit */}}
              onDelete={() => setDeleteConfirm({ isOpen: true, goalId: selectedGoal.id })}
              onRefresh={() => loadGoalDetails(selectedGoal.id)}
            />
          ) : (
            <div className="card p-12 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Select a Goal
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Choose a goal from the list to view details and track progress
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <CreateGoalModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (goalData: any) => {
            try {
              const newGoal = await goalService.createGoal({
                ...goalData,
                userId: 'default-user'
              })
              toast.success('Goal created', `${newGoal.name} has been created`)
              loadGoals()
              loadStatistics()
              setShowCreateModal(false)
              setSelectedGoal(newGoal)
            } catch (error) {
              toast.error('Failed to create goal', 'Please try again')
            }
          }}
        />
      )}

      {/* Contribution Modal */}
      {showContributionModal && selectedGoal && (
        <ContributionModal
          goal={selectedGoal}
          onClose={() => setShowContributionModal(false)}
          onSave={handleContribution}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, goalId: null })}
        onConfirm={() => {
          if (deleteConfirm.goalId) {
            handleDeleteGoal(deleteConfirm.goalId)
            setDeleteConfirm({ isOpen: false, goalId: null })
          }
        }}
        title="Delete Goal"
        message="Are you sure you want to delete this goal? All progress and contributions will be lost."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, color, bgColor }: any) => (
  <div className="card p-4">
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", bgColor)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
    </div>
  </div>
)

// Goal Details Component
const GoalDetails = ({ goal, details, onContribute, onEdit, onDelete }: any) => {
  const Icon = goalIcons[goal.type as Goal['type']]
  const progress = details.progress
  const daysLeft = differenceInDays(goal.targetDate, new Date())
  
  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="card p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              goalColors[goal.category as Goal['category']],
              "text-white"
            )}>
              <Icon className="w-6 h-6" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {goal.name}
              </h2>
              {goal.description && (
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {goal.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Target: {format(new Date(goal.targetDate), 'MMM d, yyyy')}
                </span>
                {daysLeft > 0 && (
                  <span className="text-gray-600 dark:text-gray-400">
                    {daysLeft} days remaining
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>
        
        {/* Progress Overview */}
        <div className="space-y-4">
          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                {formatCurrency(goal.currentAmount)}
              </span>
              <span className="text-lg text-gray-600 dark:text-gray-400">
                of {formatCurrency(goal.targetAmount)}
              </span>
            </div>
            
            <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-4">
              <div
                className={cn(
                  "h-4 rounded-full transition-all duration-500",
                  progress.progressPercentage >= 100 ? "bg-green-500" :
                  progress.progressPercentage >= 75 ? "bg-blue-500" :
                  progress.progressPercentage >= 50 ? "bg-yellow-500" :
                  "bg-gray-400"
                )}
                style={{ width: `${Math.min(100, progress.progressPercentage)}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {progress.progressPercentage.toFixed(1)}% Complete
              </span>
              {progress.isOnTrack ? (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  On Track
                </span>
              ) : (
                <span className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  Behind Schedule
                </span>
              )}
            </div>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Required Monthly</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {progress.requiredMonthlySaving 
                  ? formatCurrency(progress.requiredMonthlySaving)
                  : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Projected Completion</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {progress.projectedCompletion 
                  ? format(new Date(progress.projectedCompletion), 'MMM yyyy')
                  : 'Calculate...'}
              </p>
            </div>
          </div>
          
          <button
            onClick={onContribute}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Contribution
          </button>
        </div>
      </div>
      
      {/* Milestones */}
      {details.milestones && details.milestones.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Milestones
            </h3>
          </div>
          
          <div className="p-4 space-y-3">
            {details.milestones.map((milestone: GoalMilestone) => {
              const isAchieved = milestone.achievedAt
              const isPending = !isAchieved && goal.currentAmount < milestone.targetAmount
              
              return (
                <div key={milestone.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    isAchieved 
                      ? "bg-green-100 dark:bg-green-900/20"
                      : isPending
                        ? "bg-gray-100 dark:bg-gray-800"
                        : "bg-amber-100 dark:bg-amber-900/20"
                  )}>
                    {isAchieved ? (
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <Award className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <p className={cn(
                      "text-sm font-medium",
                      isAchieved 
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-900 dark:text-gray-100"
                    )}>
                      {milestone.name}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatCurrency(milestone.targetAmount)}
                      {milestone.achievedAt && (
                        <span> • Achieved {format(new Date(milestone.achievedAt), 'MMM d, yyyy')}</span>
                      )}
                    </p>
                  </div>
                  
                  {isAchieved && !milestone.celebrationShown && (
                    <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Recent Contributions */}
      {details.contributions && details.contributions.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Recent Contributions
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {details.contributions.slice(-5).reverse().map((contribution: any) => (
              <div key={contribution.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatCurrency(contribution.amount)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {contribution.description || 'Manual contribution'}
                  </p>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(contribution.date), 'MMM d')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Create Goal Modal Component
const CreateGoalModal = ({ onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'savings' as Goal['type'],
    category: 'medium-term' as Goal['category'],
    targetAmount: 0,
    currentAmount: 0,
    currency: 'GBP',
    targetDate: format(new Date(new Date().setMonth(new Date().getMonth() + 6)), 'yyyy-MM-dd'),
    startDate: format(new Date(), 'yyyy-MM-dd'),
    status: 'active' as Goal['status'],
    priority: 'medium' as Goal['priority'],
    trackingMethod: 'manual' as Goal['trackingMethod'],
    icon: 'target',
    color: '#3B82F6'
  })
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || formData.targetAmount <= 0) {
      toast.error('Invalid input', 'Please fill in all required fields')
      return
    }
    
    onSave({
      ...formData,
      targetDate: new Date(formData.targetDate),
      startDate: new Date(formData.startDate)
    })
  }
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Create New Goal
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Goal Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="e.g., Emergency Fund"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Goal Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as Goal['type'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="savings">Savings</option>
                <option value="debt">Debt Payoff</option>
                <option value="investment">Investment</option>
                <option value="emergency">Emergency Fund</option>
                <option value="purchase">Major Purchase</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              rows={2}
              placeholder="What is this goal for?"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Amount *
              </label>
              <input
                type="number"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Current Amount
              </label>
              <input
                type="number"
                value={formData.currentAmount}
                onChange={(e) => setFormData({ ...formData, currentAmount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Date *
              </label>
              <input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Goal['category'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="short-term">Short-term (&lt; 1 year)</option>
                <option value="medium-term">Medium-term (1-5 years)</option>
                <option value="long-term">Long-term (&gt; 5 years)</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Goal['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tracking Method
              </label>
              <select
                value={formData.trackingMethod}
                onChange={(e) => setFormData({ ...formData, trackingMethod: e.target.value as Goal['trackingMethod'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Contribution Modal Component
const ContributionModal = ({ goal, onClose, onSave }: any) => {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const contributionAmount = parseFloat(amount)
    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      toast.error('Invalid amount', 'Please enter a valid amount')
      return
    }
    
    onSave(contributionAmount, description)
  }
  
  const remainingAmount = goal.targetAmount - goal.currentAmount
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add Contribution
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              autoFocus
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {formatCurrency(remainingAmount)} remaining to reach goal
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              placeholder="e.g., Monthly savings"
            />
          </div>
          
          {/* Quick amount buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map(quickAmount => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => setAmount(quickAmount.toString())}
                className="py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
              >
                £{quickAmount}
              </button>
            ))}
          </div>
          
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 btn-primary"
            >
              Add Contribution
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GoalsPage