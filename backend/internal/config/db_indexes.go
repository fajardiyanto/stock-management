package config

import "gorm.io/gorm"

// CreateIndexes creates all database indexes for query optimization.
// Uses CREATE INDEX IF NOT EXISTS so it is safe to call on every startup.
// Partial indexes (WHERE deleted = false) keep index size small by only
// covering active rows.
func CreateIndexes(db *gorm.DB) {
	indexes := []string{
		// =====================================================
		// "user" table
		// =====================================================
		// Covers: GetAllUser (role + status filter), GetAllUserByRole
		`CREATE INDEX IF NOT EXISTS idx_user_status_role ON "user" (status, role)`,
		// Covers: GetUserById, JOIN user ON uuid with status check
		`CREATE INDEX IF NOT EXISTS idx_user_uuid_status ON "user" (uuid, status)`,
		// Covers: LoginUser, CheckUser (phone + status lookup)
		`CREATE INDEX IF NOT EXISTS idx_user_phone_status ON "user" (phone, status)`,

		// =====================================================
		// purchase table
		// =====================================================
		// Covers: JOIN purchase ON stock_id (stock_service, analytic_service)
		`CREATE INDEX IF NOT EXISTS idx_purchase_stock_id ON purchase (stock_id) WHERE deleted = false`,
		// Covers: GetSupplierPerformance, GetAllPurchases (supplier_id filter)
		`CREATE INDEX IF NOT EXISTS idx_purchase_supplier_id ON purchase (supplier_id) WHERE deleted = false`,
		// Covers: date-range filters in analytics, purchase listing
		`CREATE INDEX IF NOT EXISTS idx_purchase_purchase_date ON purchase (purchase_date) WHERE deleted = false`,
		// Covers: GetAllPurchases (payment_status filter)
		`CREATE INDEX IF NOT EXISTS idx_purchase_payment_status ON purchase (payment_status) WHERE deleted = false`,

		// =====================================================
		// payment table
		// =====================================================
		// Covers: GetAllPaymentFromUserId, getBatchBalances, GetUserBalanceDeposit
		`CREATE INDEX IF NOT EXISTS idx_payment_user_id ON payment (user_id) WHERE deleted = false`,
		// Covers: GetAllPaymentByFieldId (sale), LATERAL join for last payment
		`CREATE INDEX IF NOT EXISTS idx_payment_sales_id ON payment (sales_id) WHERE deleted = false`,
		// Covers: GetAllPaymentByFieldId (purchase), LATERAL join for last payment
		`CREATE INDEX IF NOT EXISTS idx_payment_purchase_id ON payment (purchase_id) WHERE deleted = false`,
		// Covers: LATERAL sub-queries ORDER BY created_at DESC LIMIT 1
		`CREATE INDEX IF NOT EXISTS idx_payment_sales_id_created ON payment (sales_id, created_at DESC) WHERE deleted = false`,
		`CREATE INDEX IF NOT EXISTS idx_payment_purchase_id_created ON payment (purchase_id, created_at DESC) WHERE deleted = false`,

		// =====================================================
		// stock_entries table
		// =====================================================
		// Covers: JOIN stock_entries ON uuid throughout services
		`CREATE INDEX IF NOT EXISTS idx_stock_entries_uuid ON stock_entries (uuid) WHERE deleted = false`,

		// =====================================================
		// stock_items table
		// =====================================================
		// Covers: fetchStockItemsAndSorts, getBatchStockItemTotals
		`CREATE INDEX IF NOT EXISTS idx_stock_items_entry_id ON stock_items (stock_entry_id) WHERE deleted = false`,
		// Covers: GetAnalyticStats, GetStockDistributionData (created_at range)
		`CREATE INDEX IF NOT EXISTS idx_stock_items_created_at ON stock_items (created_at) WHERE deleted = false`,
		// Covers: applyKeywordFilter (item_name ILIKE search)
		`CREATE INDEX IF NOT EXISTS idx_stock_items_item_name ON stock_items (item_name) WHERE deleted = false`,

		// =====================================================
		// stock_sorts table
		// =====================================================
		// Covers: fetchStockItemsAndSorts, JOIN stock_sorts ON stock_item_id
		`CREATE INDEX IF NOT EXISTS idx_stock_sorts_item_id ON stock_sorts (stock_item_id) WHERE deleted = false`,
		// Covers: JOIN stock_sorts ON uuid (item_sales → stock_sorts)
		`CREATE INDEX IF NOT EXISTS idx_stock_sorts_uuid ON stock_sorts (uuid) WHERE deleted = false`,
		// Covers: unsold stock query (weight = current_weight, not shrinkage)
		`CREATE INDEX IF NOT EXISTS idx_stock_sorts_weight_current ON stock_sorts (weight, current_weight) WHERE deleted = false AND is_shrinkage = false`,
		// Covers: applyTextKeywordFilter, sorted_item_name searches
		`CREATE INDEX IF NOT EXISTS idx_stock_sorts_sorted_name ON stock_sorts (sorted_item_name) WHERE deleted = false`,
		// Covers: GetAnalyticStats (current_weight SUM where not shrinkage)
		`CREATE INDEX IF NOT EXISTS idx_stock_sorts_current_weight ON stock_sorts (current_weight) WHERE deleted = false AND is_shrinkage = false`,

		// =====================================================
		// fibers table
		// =====================================================
		// Covers: GetAllFibers, GetAvailableFibers, GetAllUsedFibers (status filter)
		`CREATE INDEX IF NOT EXISTS idx_fibers_status ON fibers (status) WHERE deleted = false`,
		// Covers: fetchFiberList (sale_id + deleted lookup)
		`CREATE INDEX IF NOT EXISTS idx_fibers_sale_id ON fibers (sale_id) WHERE deleted = false`,
		// Covers: GetFibersByStockSort
		`CREATE INDEX IF NOT EXISTS idx_fibers_stock_sort_id ON fibers (stock_sort_id) WHERE deleted = false`,
		// Covers: fiber UUID lookup
		`CREATE INDEX IF NOT EXISTS idx_fibers_uuid ON fibers (uuid) WHERE deleted = false`,

		// =====================================================
		// fiber_allocations table
		// =====================================================
		// Covers: JOIN fiber_allocations ON fiber_id
		`CREATE INDEX IF NOT EXISTS idx_fiber_alloc_fiber_id ON fiber_allocations (fiber_id) WHERE deleted = false`,
		// Covers: JOIN fiber_allocations ON stock_sort_id
		`CREATE INDEX IF NOT EXISTS idx_fiber_alloc_stock_sort_id ON fiber_allocations (stock_sort_id) WHERE deleted = false`,

		// =====================================================
		// sales table
		// =====================================================
		// Covers: GetCustomerPerformance, GetAllSales (customer_id filter)
		`CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales (customer_id) WHERE deleted = false`,
		// Covers: GetAnalyticStats, GetSalesTrendData (created_at range)
		`CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at) WHERE deleted = false`,
		// Covers: GetAllSales (payment_status filter)
		`CREATE INDEX IF NOT EXISTS idx_sales_payment_status ON sales (payment_status) WHERE deleted = false`,
		// Covers: GetAllSales (purchase_date filter / sales_date)
		`CREATE INDEX IF NOT EXISTS idx_sales_purchase_date ON sales (purchase_date) WHERE deleted = false`,
		// Covers: sales UUID lookup
		`CREATE INDEX IF NOT EXISTS idx_sales_uuid ON sales (uuid) WHERE deleted = false`,

		// =====================================================
		// item_sales table
		// =====================================================
		// Covers: fetchRelatedData, updateItemSales (sale_id lookup)
		`CREATE INDEX IF NOT EXISTS idx_item_sales_sale_id ON item_sales (sale_id) WHERE deleted = false`,
		// Covers: JOIN item_sales ON stock_sort_id
		`CREATE INDEX IF NOT EXISTS idx_item_sales_stock_sort_id ON item_sales (stock_sort_id) WHERE deleted = false`,
		// Covers: GetSalesTrendData, GetDailyGetAnalyticStats (created_at range)
		`CREATE INDEX IF NOT EXISTS idx_item_sales_created_at ON item_sales (created_at) WHERE deleted = false`,

		// =====================================================
		// item_add_onn table
		// =====================================================
		// Covers: fetchRelatedData, updateAddOns (sale_id lookup)
		`CREATE INDEX IF NOT EXISTS idx_item_add_onn_sale_id ON item_add_onn (sale_id) WHERE deleted = false`,

		// =====================================================
		// audit_logs table
		// =====================================================
		// Covers: audit log filtering by user
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs (user_id)`,
		// Covers: audit log date range queries
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp)`,
		// Covers: audit log action filter
		`CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs (action)`,
	}

	for _, idx := range indexes {
		if err := db.Exec(idx).Error; err != nil {
			logger.Error("Failed to create index: %s, error: %v", idx, err)
		}
	}

	logger.Info("Database indexes created/verified successfully (%d indexes)", len(indexes))
}
