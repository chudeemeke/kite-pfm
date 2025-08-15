# Kite Personal Finance Manager - User Guide

Welcome to Kite, your comprehensive personal finance management solution. This guide will help you get the most out of Kite's powerful features.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Managing Accounts](#managing-accounts)
3. [Transactions](#transactions)
4. [Budgets](#budgets)
5. [Auto-categorization Rules](#auto-categorization-rules)
6. [Insights & Reports](#insights--reports)
7. [Settings & Customization](#settings--customization)
8. [Data Management](#data-management)
9. [Tips & Best Practices](#tips--best-practices)

---

## Getting Started

### First Time Setup

When you first open Kite, you'll be greeted with an onboarding flow that introduces you to the app's main features.

#### Onboarding Tour

1. **Welcome Screen**: Introduction to Kite and its capabilities
2. **Track Your Spending**: Learn about transaction tracking across multiple accounts
3. **Smart Budgeting**: Understand budget creation with carryover strategies
4. **Automatic Rules**: Discover rule-based transaction categorization
5. **Demo Data**: Explore pre-loaded sample data to familiarize yourself with features

*[Screenshot placeholder: Onboarding welcome screen with progress indicators]*

### Creating Your First Account

After completing the onboarding:

1. Navigate to the **Accounts** page from the bottom navigation
2. Tap the **+** (Add) button
3. Fill in account details:
   - **Account Name**: Give your account a descriptive name
   - **Account Type**: Choose from checking, savings, credit, investment, cash, loan, or other
   - **Currency**: Select your account's currency (USD, EUR, GBP, etc.)
   - **Initial Balance**: Enter your current balance
4. Tap **Save** to create the account

*[Screenshot placeholder: Account creation form]*

### Understanding the Interface

Kite uses a clean, mobile-first design with intuitive navigation:

- **Bottom Navigation**: Quick access to Home, Activity, Budgets, Accounts, Insights, and Settings
- **Top Bar**: Shows current page title, theme toggle, and additional actions
- **Cards**: Information is organized in easy-to-read cards
- **Quick Actions**: The floating + button provides quick access to add transactions, budgets, or accounts

*[Screenshot placeholder: Main interface overview with annotations]*

---

## Managing Accounts

### Account Types

Kite supports multiple account types to organize your finances:

- **Checking**: For everyday spending accounts
- **Savings**: For savings and emergency funds
- **Credit**: For credit cards and lines of credit
- **Investment**: For investment accounts and portfolios
- **Cash**: For cash on hand
- **Loan**: For tracking loans and debts
- **Other**: For any accounts that don't fit other categories

### Adding Bank Accounts

1. Go to **Accounts** → **Add Account**
2. Select the appropriate account type
3. Enter account details:
   - Name (e.g., "Wells Fargo Checking")
   - Currency
   - Current balance
4. Save the account

*[Screenshot placeholder: Account type selection screen]*

### Viewing Balances

- **Account Overview**: See all accounts with current balances
- **Total Net Worth**: Automatically calculated across all accounts
- **Balance History**: Track how your balances change over time
- **Hide Balances**: Use privacy mode to blur sensitive amounts

### Account Settings

For each account, you can:

- **Edit Details**: Change name, type, or currency
- **Archive Account**: Hide accounts you no longer use
- **Set as Default**: Make an account the default for new transactions
- **Delete Account**: Permanently remove an account (warning: this cannot be undone)

*[Screenshot placeholder: Account settings menu]*

---

## Transactions

### Adding Transactions Manually

#### Quick Add

Use the floating + button for quick transaction entry:

1. Tap the + button in the bottom right
2. Select "Transaction"
3. Fill in the essential details:
   - **Amount**: Enter the transaction amount
   - **Description**: Brief description of the transaction
   - **Account**: Select which account the transaction belongs to
   - **Category**: Choose or create a category
   - **Date**: Defaults to today, but can be changed

*[Screenshot placeholder: Quick add transaction modal]*

#### Detailed Transaction Entry

For more detailed transactions:

1. Go to **Activity** → **Add Transaction**
2. Complete all available fields:
   - Amount and description
   - Account and category
   - Date and time
   - Merchant name
   - Notes and tags
   - Mark as subscription (for recurring payments)

### Importing Transactions (CSV)

Kite supports importing transactions from CSV files exported from your bank:

#### Step 1: Prepare Your CSV File

- Export transactions from your bank
- Ensure the file includes columns for date, amount, and description
- Save as a .csv file

#### Step 2: Import Process

1. Go to **Settings** → **Data & Backup** → **Import Data**
2. **Upload File**: Drag and drop your CSV file or click to browse
3. **Map Columns**: Match your CSV columns to Kite's fields:
   - Date (required)
   - Amount (required)
   - Description (required)
   - Merchant (optional)
   - Category (optional)
   - Account (optional)

*[Screenshot placeholder: CSV column mapping interface]*

#### Step 3: Preview and Import

1. **Review Preview**: Check a sample of how your data will be imported
2. **Validate Data**: Kite will show any errors or warnings
3. **Duplicate Detection**: Automatic detection of potential duplicates
4. **Confirm Import**: Complete the import process

### Categorizing Transactions

#### Manual Categorization

1. Select a transaction from the Activity list
2. Tap on the category field
3. Choose from existing categories or create a new one
4. Save changes

#### Bulk Categorization

1. Go to **Activity** page
2. Tap "Select" to enter bulk edit mode
3. Choose multiple transactions
4. Select "Change Category" from the actions menu
5. Apply the new category to all selected transactions

*[Screenshot placeholder: Bulk transaction selection interface]*

### Searching and Filtering

The Activity page provides powerful search and filtering options:

#### Search Bar

- Type to search transaction descriptions, merchants, or notes
- Search results update in real-time
- Use quotes for exact phrase matching

#### Filter Options

- **Date Range**: Filter by specific time periods
- **Amount Range**: Find transactions within certain amounts
- **Categories**: Show only specific categories
- **Accounts**: Filter by account
- **Transaction Type**: Income vs. expenses

*[Screenshot placeholder: Filter options panel]*

### Bulk Operations

Available bulk operations include:

- **Change Category**: Apply a category to multiple transactions
- **Mark as Subscription**: Identify recurring payments
- **Delete Transactions**: Remove multiple transactions
- **Export Selection**: Export filtered transactions

---

## Budgets

### Creating Budgets

#### Setting Up Your First Budget

1. Go to **Budgets** page
2. Tap **Add Budget**
3. Configure budget details:
   - **Category**: Choose which spending category to budget for
   - **Amount**: Set your monthly budget limit
   - **Carryover Strategy**: Choose how to handle unspent/overspent amounts

*[Screenshot placeholder: Budget creation form]*

#### Budget Strategies (Carryover Options)

Kite offers three carryover strategies:

1. **No Carryover**: Start fresh each month
   - Unspent amounts don't carry forward
   - Overspent amounts don't carry forward
   - Good for strict monthly budgeting

2. **Carry Unspent**: Roll over unused budget
   - Unspent amounts add to next month's budget
   - Overspent amounts don't affect next month
   - Good for building flexibility

3. **Carry Overspend**: Account for overspending
   - Overspent amounts reduce next month's budget
   - Unspent amounts don't carry forward
   - Good for maintaining strict spending limits

*[Screenshot placeholder: Carryover strategy selection]*

### Monitoring Spending

#### Budget Dashboard

The Budgets page shows:

- **Progress Rings**: Visual representation of spending vs. budget
- **Remaining Amounts**: How much budget is left
- **Overspend Warnings**: Red indicators when over budget
- **Monthly Timeline**: Switch between different months

#### Budget Status Indicators

- **Green**: Under budget and on track
- **Yellow**: Approaching budget limit (80-100% spent)
- **Red**: Over budget
- **Gray**: No budget set for this category

*[Screenshot placeholder: Budget dashboard with progress rings]*

### Budget Alerts

Configure budget notifications in Settings:

1. Go to **Settings** → **Notifications & Alerts**
2. Enable **Budget Alerts**
3. Set **Budget Alert Threshold** (e.g., 80% of budget spent)
4. Choose notification preferences

### Budget Ledger

View detailed budget calculations:

1. Tap on any budget to see the ledger
2. Review month-by-month breakdown:
   - **Budgeted Amount**: Your monthly allocation
   - **Carry-in**: Amount brought forward from previous month
   - **Spent**: Total spending in category
   - **Carry-out**: Amount to carry to next month
   - **Remaining**: Current available budget

*[Screenshot placeholder: Budget ledger view]*

---

## Auto-categorization Rules

### Creating Rules

Automate transaction categorization with smart rules:

#### Setting Up Your First Rule

1. Go to **Settings** → **Transaction Settings** → **Manage Auto-Categorization Rules**
2. Tap **Add Rule**
3. Configure rule details:
   - **Rule Name**: Descriptive name for the rule
   - **Priority**: Order of rule execution (1 = highest priority)
   - **Stop Processing**: Whether to stop checking other rules after this one matches

*[Screenshot placeholder: Rule creation interface]*

### Rule Conditions

Set up conditions that trigger the rule:

#### Field Types

- **Merchant**: Business or store name
- **Description**: Transaction description text
- **Amount**: Transaction amount

#### Condition Operators

- **Equals**: Exact match
- **Contains**: Partial text match (case-insensitive)
- **Regex**: Regular expression pattern matching
- **Amount Range**: Between minimum and maximum values

#### Example Conditions

- Merchant contains "Starbucks" → Food & Dining
- Description contains "gas" → Transportation
- Amount between $500-$2000 → Large Purchase category

*[Screenshot placeholder: Rule conditions setup]*

### Rule Actions

When conditions are met, rules can:

- **Set Category**: Automatically assign a category
- **Mark as Subscription**: Flag as recurring payment
- **Append Notes**: Add text to transaction notes

### Rule Priorities

Rules are processed in priority order (1, 2, 3, etc.):

- **Higher Priority**: Processed first
- **Stop Processing**: Prevents lower-priority rules from running
- **Reorder Rules**: Drag and drop to change priority

### Managing Rules

#### Rule Management Tools

- **Enable/Disable**: Turn rules on or off without deleting
- **Test Rules**: Preview what transactions would be affected
- **Bulk Apply**: Apply rules to existing transactions
- **Rule History**: See which transactions were affected by each rule

*[Screenshot placeholder: Rules management interface]*

#### Best Practices for Rules

1. **Start Simple**: Begin with obvious patterns like specific merchants
2. **Use Priorities**: Put more specific rules first
3. **Test First**: Use preview before applying to all transactions
4. **Regular Cleanup**: Review and update rules periodically

---

## Insights & Reports

### Dashboard Overview

The Home dashboard provides a snapshot of your financial health:

#### Key Metrics

- **Net Worth**: Total assets minus liabilities
- **Monthly Income**: Total income for current month
- **Monthly Expenses**: Total spending for current month
- **Budget Status**: Overall budget performance

*[Screenshot placeholder: Dashboard overview]*

### Spending Trends

Analyze your spending patterns over time:

#### Cashflow Chart

- **Income vs. Expenses**: Monthly comparison
- **Net Cashflow**: Monthly savings or overspending
- **Trend Lines**: See if spending is increasing or decreasing
- **Time Periods**: View 3, 6, or 12-month trends

*[Screenshot placeholder: Cashflow trend chart]*

#### Spending by Category

- **Pie Chart**: Visual breakdown of spending by category
- **Top Categories**: Identify your biggest spending areas
- **Month-over-Month**: Compare category spending across months
- **Percentage Breakdown**: See what portion each category represents

### Category Analysis

Deep dive into specific spending categories:

#### Category Details

- **Monthly Totals**: Spending per month in each category
- **Transaction Count**: Number of transactions per category
- **Average Transaction**: Typical amount per transaction
- **Merchant Analysis**: Top merchants in each category

#### Insights and Recommendations

Kite provides automated insights:

- **Unusual Spending**: Transactions that are outside normal patterns
- **Budget Opportunities**: Categories where budgets could help
- **Saving Opportunities**: Areas where spending could be reduced

*[Screenshot placeholder: Category analysis charts]*

### Custom Date Ranges

Analyze any time period:

1. **Preset Ranges**: This month, last month, last 3 months, year-to-date
2. **Custom Range**: Select any start and end date
3. **Comparison Mode**: Compare current period to previous period
4. **Export Options**: Download charts and data

### Reports

Generate detailed financial reports:

#### Available Reports

- **Income Statement**: Income vs. expenses over time
- **Category Report**: Detailed breakdown by spending category
- **Account Summary**: Balances and activity by account
- **Budget Performance**: How well you're sticking to budgets

#### Report Customization

- **Date Range**: Select specific time periods
- **Categories**: Include or exclude specific categories
- **Accounts**: Filter by specific accounts
- **Format**: View on screen or export to PDF/CSV

*[Screenshot placeholder: Report generation interface]*

---

## Settings & Customization

### Profile Settings

Manage your personal information:

#### Basic Information

- **Profile Name**: Your display name in the app
- **Email Address**: For notifications and account recovery
- **Subscription Status**: Free or Premium account level

#### Account Management

- **Change Password**: Update your security credentials
- **Security Settings**: Configure PIN and biometric unlock
- **Privacy Preferences**: Control data sharing and analytics

*[Screenshot placeholder: Profile settings page]*

### Appearance (Themes, Display)

Customize the app's look and feel:

#### Theme Options

- **Light Mode**: Bright theme for daytime use
- **Dark Mode**: Dark theme for low-light environments
- **System**: Automatically match your device's theme

#### Display Settings

- **Font Size**: Small, medium, or large text
- **View Density**: Compact, comfortable, or spacious layouts
- **Accent Color**: Choose your preferred accent color
- **Show Balance**: Toggle account balance visibility

*[Screenshot placeholder: Appearance settings]*

### Notifications

Control when and how you receive alerts:

#### Notification Types

- **Budget Alerts**: When approaching or exceeding budgets
- **Large Transaction Alerts**: For transactions above a set amount
- **Weekly Summary**: Summary of weekly spending
- **Monthly Report**: Detailed monthly financial report
- **Reminder Notifications**: For bill payments and goals

#### Notification Settings

- **Threshold Amounts**: Set limits for budget and transaction alerts
- **Delivery Times**: Choose when to receive summaries
- **Sound Effects**: Enable or disable notification sounds
- **Vibration**: Control haptic feedback

*[Screenshot placeholder: Notification settings]*

### Privacy & Security (PIN, Biometric)

Protect your financial data:

#### Security Options

- **PIN Protection**: Set a 4-8 digit PIN for app access
- **Biometric Unlock**: Use fingerprint or face recognition (Premium)
- **Auto-Lock Timer**: Automatically lock app after inactivity
- **Privacy Mode**: Blur sensitive amounts when app is backgrounded

#### Privacy Controls

- **Data Sharing**: Control anonymous data sharing for app improvement
- **Analytics**: Opt in or out of usage analytics
- **Two-Factor Authentication**: Add extra security layer (Coming Soon)

*[Screenshot placeholder: Security settings]*

### Currency & Regional Settings

Configure location and currency preferences:

#### Currency Options

- **Primary Currency**: Default currency for accounts and transactions
- **Multi-Currency Support**: Enable multiple currencies (Premium)
- **Exchange Rates**: Automatic currency conversion

#### Regional Settings

- **Language**: App display language (English, more coming soon)
- **Region**: Your country or region for formatting
- **Date Format**: Choose how dates are displayed
- **Number Format**: Regional number formatting preferences
- **First Day of Week**: Monday or Sunday
- **Fiscal Year**: When your fiscal year begins

*[Screenshot placeholder: Currency and regional settings]*

### Data Management (Backup/Restore)

Protect and manage your financial data:

#### Backup Options

- **Auto-Backup**: Automatically backup data (Premium)
- **Backup Frequency**: Daily, weekly, or monthly backups
- **Manual Backup**: Create backups on demand
- **Backup Verification**: Ensure backup integrity

#### Data Retention

- **Retention Period**: How long to keep transaction data
- **Archive Options**: Archive old data instead of deleting
- **Storage Management**: Monitor data usage and storage

*[Screenshot placeholder: Data management settings]*

---

## Data Management

### Exporting Data

Keep copies of your financial data:

#### Export Options

1. **Quick Export**: Go to Settings → Data & Backup → Export Data
2. **Choose Format**:
   - **CSV**: Compatible with Excel and other spreadsheet apps
   - **JSON**: Machine-readable format for developers
   - **Excel**: Full formatting with charts (Premium)

#### What Gets Exported

- **Transactions**: All transaction data with categories and notes
- **Accounts**: Account information and balances
- **Budgets**: Budget settings and performance data
- **Categories**: Custom categories and their settings
- **Rules**: Auto-categorization rules

*[Screenshot placeholder: Export format selection]*

### Importing Data

Bring data from other financial apps:

#### Supported Import Sources

- **Bank CSV Files**: Direct from your bank's export
- **Other Finance Apps**: CSV exports from Mint, YNAB, etc.
- **Spreadsheets**: Excel or Google Sheets exports
- **Previous Kite Backups**: Restore from backups

#### Import Process

1. **Prepare Data**: Ensure CSV has required columns (date, amount, description)
2. **Upload File**: Use the import wizard in Settings
3. **Map Columns**: Tell Kite which columns contain which data
4. **Preview**: Check how data will be imported
5. **Import**: Complete the import process

### Backup Strategies

Protect your data with regular backups:

#### Automatic Backups (Premium)

- **Schedule**: Set up daily, weekly, or monthly backups
- **Cloud Storage**: Securely stored in encrypted cloud storage
- **Versioning**: Keep multiple backup versions
- **Restoration**: Easy one-click restore from any backup

#### Manual Backups

- **On-Demand**: Create backups whenever needed
- **Local Storage**: Save backups to your device
- **Sharing**: Send backups via email or cloud storage
- **Verification**: Check backup integrity before storing

*[Screenshot placeholder: Backup management interface]*

### Privacy Features

Keep your financial data secure:

#### Local Storage

- **Device-Only**: All data stays on your device by default
- **No Cloud**: No automatic uploading to external servers
- **Encryption**: Data encrypted on your device
- **Secure Deletion**: Proper data removal when deleted

#### Data Control

- **Export Anytime**: Always have access to your data
- **Delete Everything**: Complete data removal option
- **Privacy Mode**: Hide sensitive information when needed
- **Access Logs**: See when and how your data is accessed (Premium)

---

## Tips & Best Practices

### Effective Budgeting

#### Starting Your Budget Journey

1. **Track First**: Spend a month just tracking expenses to understand patterns
2. **Start Simple**: Create budgets for your top 3-5 spending categories
3. **Be Realistic**: Set achievable budget amounts based on actual spending
4. **Review Regularly**: Check budget performance weekly

#### Budget Categories to Consider

- **Essential**: Housing, utilities, groceries, transportation
- **Financial**: Debt payments, savings, investments
- **Lifestyle**: Entertainment, dining out, hobbies
- **Irregular**: Annual fees, seasonal expenses, gifts

*[Screenshot placeholder: Sample budget categories]*

#### Advanced Budgeting Tips

- **Use Carryover Strategically**: Choose the right strategy for each category
- **Seasonal Adjustments**: Adjust budgets for holiday seasons or irregular expenses
- **Emergency Buffer**: Keep a small buffer in each budget for unexpected expenses
- **Regular Reviews**: Adjust budgets quarterly based on life changes

### Category Organization

#### Creating Meaningful Categories

1. **Keep It Simple**: Start with broad categories, add subcategories later
2. **Match Your Habits**: Categories should reflect how you think about spending
3. **Use Consistent Names**: Avoid similar category names that might confuse
4. **Regular Cleanup**: Merge or delete unused categories

#### Suggested Category Structure

**Income**
- Salary
- Freelance/Side Income
- Investment Income
- Other Income

**Fixed Expenses**
- Rent/Mortgage
- Insurance
- Utilities
- Loan Payments

**Variable Expenses**
- Groceries
- Transportation
- Entertainment
- Personal Care

**Savings & Investments**
- Emergency Fund
- Retirement
- Investments
- Short-term Savings

*[Screenshot placeholder: Category hierarchy example]*

### Rule Optimization

#### Creating Effective Rules

1. **Start with Obvious Patterns**: Begin with merchants you visit regularly
2. **Use Specific Conditions**: More specific rules are more accurate
3. **Test Before Applying**: Always preview rule effects before saving
4. **Monitor Performance**: Regularly check if rules are working correctly

#### Common Rule Patterns

- **Merchant-Based**: "Amazon" → Online Shopping
- **Amount-Based**: Amounts over $1000 → Large Purchase
- **Description Keywords**: "gas", "fuel" → Transportation
- **Combined Conditions**: "Starbucks" AND amount < $10 → Coffee

#### Rule Maintenance

- **Regular Reviews**: Check rules monthly for accuracy
- **Update Patterns**: Modify rules as spending habits change
- **Remove Outdated**: Delete rules for merchants you no longer visit
- **Optimize Priority**: Adjust rule order for better performance

### General Financial Management Tips

#### Daily Habits

1. **Daily Entry**: Add transactions daily while they're fresh in memory
2. **Quick Reviews**: Spend 5 minutes reviewing recent transactions
3. **Photo Receipts**: Take photos of receipts for important purchases
4. **Check Balances**: Verify account balances match your records

#### Weekly Routines

1. **Budget Check**: Review budget performance and spending patterns
2. **Categorize**: Ensure all transactions are properly categorized
3. **Rule Review**: Check if any new rules could be helpful
4. **Goal Progress**: Review progress toward financial goals

#### Monthly Tasks

1. **Full Budget Review**: Analyze budget performance and adjust as needed
2. **Account Reconciliation**: Ensure all accounts match bank statements
3. **Rule Optimization**: Update and optimize auto-categorization rules
4. **Data Backup**: Create manual backup of your financial data

*[Screenshot placeholder: Monthly review checklist]*

#### Financial Health Indicators

Monitor these key metrics:

- **Net Worth Trend**: Should generally increase over time
- **Expense Ratios**: Fixed expenses should be reasonable portion of income
- **Budget Performance**: Most categories should be within budget most months
- **Savings Rate**: Percentage of income saved each month

---

## Troubleshooting

### Common Issues

#### Import Problems

**Issue**: CSV import fails
**Solution**: 
- Check file format (must be .csv)
- Ensure required columns (date, amount, description) are present
- Verify date format is recognized
- Check for special characters that might cause parsing issues

**Issue**: Transactions import to wrong category
**Solution**:
- Review column mapping during import
- Update auto-categorization rules
- Manually recategorize imported transactions
- Create rules to prevent future mismatching

#### Syncing and Data Issues

**Issue**: Balances don't match bank statements
**Solution**:
- Check for missing transactions
- Verify transaction amounts and dates
- Look for duplicate transactions
- Reconcile account by account

**Issue**: Auto-categorization not working
**Solution**:
- Check that auto-categorization is enabled in settings
- Review rule conditions for accuracy
- Verify rule priority order
- Test rules with preview mode

#### Performance Issues

**Issue**: App running slowly
**Solution**:
- Clear app cache in Settings → Advanced
- Close and restart the app
- Check available device storage
- Enable performance mode in Advanced Settings

### Getting Help

#### In-App Support

- **Help Center**: Access built-in help articles
- **Contact Support**: Report bugs or get assistance
- **Feedback**: Suggest new features or improvements

#### Community Resources

- **User Forums**: Connect with other Kite users
- **Video Tutorials**: Step-by-step video guides
- **FAQ**: Answers to frequently asked questions
- **Blog**: Tips, updates, and financial advice

---

## Keyboard Shortcuts (Desktop)

When using Kite on desktop, these shortcuts can speed up your workflow:

- **Ctrl + N**: Add new transaction
- **Ctrl + A**: Add new account
- **Ctrl + B**: Add new budget
- **Ctrl + F**: Search transactions
- **Ctrl + E**: Export data
- **Ctrl + ,**: Open settings
- **Esc**: Close modals and dialogs

---

## Conclusion

Kite Personal Finance Manager is designed to grow with your financial management needs. Start with basic transaction tracking and gradually incorporate budgeting, automation rules, and detailed reporting as you become more comfortable with the app.

Remember that personal finance is personal – use the features that work best for your situation and don't feel pressured to use everything at once. The most important thing is to start tracking your spending and build consistent habits around managing your money.

For the latest updates, new features, and tips, check the app regularly and visit our support resources. Happy budgeting!

---

*This user guide covers Kite Personal Finance Manager v1.0. Features and interfaces may change in future updates. Check Settings → About for your current app version.*