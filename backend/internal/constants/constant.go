package constants

import "time"

const (
	SuperAdminRole    = "SUPER_ADMIN"
	AdminRole         = "ADMIN"
	BuyerRole         = "BUYER"
	SupplierRole      = "SUPPLIER"
	PaymentInFull     = "PAYMENT_IN_FULL"
	PartialPayment    = "PARTIAL_PAYMENT"
	PaymentNotMadeYet = "PAYMENT_NOT_MADE_YET"
	Income            = "INCOME"
	Expense           = "EXPENSE"
)

var JakartaTz = time.FixedZone("Asia/Jakarta", 7*60*60)
